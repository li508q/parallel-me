# ER-01 · 多 Agent 结构化输出可靠性 · 工程模式调研

- 调研动机：[EXP-03](../experience-log/EXP-03-multi-agent-absence.md) 暴露的"应该 5 个 Agent 都说话，但 LLM 只给了 3 个"是 LLM 应用的**经典共性问题**，业界已有一套成熟的工程模式
- 关联需求：[S7 Slot-based / Fan-out](../requirements/backlog.md#s7) · [S8 Schema Gate + Repair Loop](../requirements/backlog.md#s8) · [S9 占位卡 + 重试按钮](../requirements/backlog.md#s9)

---

## 问题的本质

让 **一个 LLM 调用** 同时扮演 N 个 Agent、并按 schema 返回 N 条结构化输出，会同时遇到三类风险：

1. **Schema 完整性风险** — LLM 可能漏字段、漏数组项、写错枚举值
2. **角色串味风险** — N 个角色挤在一次调用里，互相风格污染、抢戏、互相同意
3. **可观测性盲区** — 调用是黑盒，失败时不知道是"模型偷懒"、"prompt 不够强"还是"个别角色被安全策略拦了"

业界的解法不是单点 patch，而是**一套组合拳**，按"治标→治本"分四层。

---

## 模式 1 · Strict Schema + Required Fields（约束源头）

**核心思想**：从 prompt 层面就把"必须返回什么"写死，不给 LLM 自由发挥的空间。

### 1a · OpenAI Structured Outputs（strict mode）
- 通过 `response_format: { type: "json_schema", json_schema: { strict: true, ... } }` 让模型在**采样阶段**就被约束到 schema 上
- 官方公告（"Introducing Structured Outputs in the API"）声称 `gpt-4o-2024-08-06` 在内部 eval 上达到 **100% schema 符合率**——*注：该数字是 OpenAI 自己的 eval，非第三方独立复现*
- **关键约束**：`strict: true` 时所有字段都必须出现在 `required` 里，可选字段要用 `["string", "null"]` 联合类型表达；不支持所有 JSON Schema 特性（如 `minItems`/`maxItems` 在 strict mode 下不被强制）
- 其他厂商 / 运行时也提供类似机制，但实现强度不同：
  - Anthropic：通过 tool use 的 `input_schema`（无 strict mode 等价物，仍需 prompt 配合）
  - Google Gemini：`generationConfig.responseSchema` + `responseMimeType: "application/json"`
  - 本地模型：`llama.cpp` 的 GBNF grammar / `outlines` / `xgrammar` 等基于约束解码的方案

### 1b · 通过 Tool/Function Calling 间接约束
- 即使没有 strict mode，把"返回 5 条 turn"包装成一个 function 的 parameters schema，也能显著提高完整性
- 在 Vercel AI SDK 中对应的具体 API 是：
  - `generateObject({ schema })` / `streamObject({ schema })`：直接生成符合 zod schema 的对象（不带工具调用）
  - `generateText({ tools, experimental_output: Output.object({ schema }) })`：在带工具调用的同时还要求结构化产物（issue #3866 起逐步稳定）
- LangChain JS 对应：`model.withStructuredOutput(schema)`

### 1c · Prompt 层面的"硬话"
- 即使有 strict mode，prompt 措辞也得跟上。社区共识的几个有效写法：
  - "**必须**返回 5 条，缺一不可，**禁止**省略"
  - "依次为 lay / money / roam / filial / future，**每个 voice_id 都必须出现且只出现一次**"
  - 把 example 也改成 5 条完整示范，而不是 1 条
- 反例（当前 ParallelMe 的 prompt）："`{"turns":[{...}]}`" 这种单条 example 是负面引导

---

## 模式 2 · Schema Gate + Repair Loop（治本：解析后兜底）

**核心思想**：永远假设 LLM 会返回不完整的内容，把验证+修复做成一道"门"。

### 2a · 基础形态：Validate → Repair
出处：Instructor（Python）、Zod / Valibot（TS）、Pydantic AI 等库的标配模式

```
LLM 返回 → JSON Schema 校验 → 失败？
  → 把 validation error 当作新 prompt 喂回去："你刚才漏了 X，请补上"
  → 重试（通常上限 2~3 次）
  → 仍失败 → fallback / 抛错
```

Instructor 库直接把 Pydantic 的 `ValidationError` 序列化进 user message，让模型"看到自己错在哪"再改——业界称为 **"Errors as Prompts"**。

### 2b · 业务级补齐（不止 schema，还看语义）
单纯 JSON 合法不够，还要检查**业务完整性**：
- 数组长度对不对（"应该是 5 条"）
- 枚举值覆盖完整不完整（"5 个 voice_id 都齐了吗"）
- 必填字段是否真的有内容（不是空字符串）

业界叫这个为 **"Semantic Schema Gate"** 或 **"Business-Level Validation"**。

### 2c · 部分缺失补齐（Partial Fill）
当只有少数缺失时，不重试整次调用，而是**只对缺失部分单独再请求一次**，叫 **"Targeted Re-prompt"**：
- 成本低（只补 2 条而不是重新生成 5 条）
- 已有正确部分不会被重新生成时改坏

---

## 模式 3 · Fan-Out / Map-Reduce（治根：拆调用）

**核心思想**：与其让一次 LLM 调用同时演 5 个角色，不如**每个角色一次独立调用**，再聚合。

这是 LangGraph、AutoGen、CrewAI 等多 Agent 框架的**默认推荐模式**。

### 3a · 为什么拆调用更可靠

| 维度 | 单次调用演 N 角色 | Fan-out N 次调用 |
| --- | --- | --- |
| 完整性 | ❌ 容易漏角色 | ✅ 每个调用单独完成，要么成功要么失败，可独立重试 |
| 角色一致性 | ❌ 风格互相污染 | ✅ 每个调用 system prompt 专注于一个角色 |
| 上下文窗口 | ⚠️ 共享 context，容易挤 | ✅ 每个调用只带必要 context |
| 失败粒度 | ❌ 整体失败 = 全部失败 | ✅ 1 个失败不影响其他 4 个 |
| 延迟 | ✅ 一次往返 | ⚠️ 但可以**并发**，总延迟 ≈ max(单次) 而非 sum |
| 成本 | ✅ 总 token 少 | ⚠️ 总 token 多 1.5~2x（system prompt 重复） |
| 可观测性 | ❌ 黑盒 | ✅ 每个 Agent 一条 trace，失败定位精确 |

### 3b · LangGraph 的 Send API + Superstep
- LangGraph 用 **`Send` 对象** 把任务分发到多个并行节点
- 框架自动检测 fan-out → 在一个 **superstep** 里**并发执行**所有目标节点
- 用 **reducer 函数** 把多个节点的结果聚合回 state（典型如 `operator.add` 拼接列表）
- 这就是 **Map-Reduce 模式** 在 Agent 场景的标准落地

### 3c · AutoGen 的 GroupChat / RoundRobin
- AutoGen 用 `GroupChatManager` 协调多 Agent
- `RoundRobinGroupChat` 强制按顺序让每个 Agent 都发言一次——**结构上保证不漏人**
- 代价：序列化执行，慢

### 3d · 折中方案：单次调用 + 分项 schema
当不想拆 N 次调用、又想保证完整性时：
- 用 schema 把输出建模成 **`{lay: {...}, money: {...}, roam: {...}, filial: {...}, future: {...}}`** 这种**对象**而非 **`turns: [...]`** 这种数组
- 因为 strict mode 下对象的所有 key 都必须出现，**LLM 想漏都漏不了**
- 业界俗称 **"Slot-based Schema"**

---

## 模式 4 · Observable Failure（治面：让用户看见）

**核心思想**：即使前面三层都防住了，UI 也要把"这个 Agent 没说话"作为**一类合法状态**展示出来，而不是消失。

### 4a · 占位卡 / Placeholder Card
- 永远画死 5 个座位，无论是否有发言
- 缺席的座位显式渲染："**{name} 这一轮选择沉默** · 重试 ↻"
- 用户能感知到"产品在运行、只是这个角色没回应"，而不是"产品坏了"

### 4b · 重试按钮放在 UI 里
- 缺席卡上挂一个"再请 TA 说一次"的按钮，触发 **Targeted Re-prompt**（模式 2c）
- 把容错从"工程师后台修"下放到"用户主动触发"，符合 ParallelMe 的产品调性（用户始终是会议主理人）

### 4c · Trace 面板里写明原因
- 当某个 Agent 缺席时，Trace 面板里要有对应日志：
  - "❌ lay 这一轮 LLM 未返回有效内容（已自动补齐 / 等待重试）"
- 对应 [DC-01 Scribe Activity Layer 2](../design-concepts/DC-01-scribe-activity.md)，让黑盒透明化

---

## 业界共识：四层组合，不可省略任一层

| 层 | 作用 | 省略后果 |
| --- | --- | --- |
| 1. Strict Schema | 约束源头 | LLM 自由发挥，输出五花八门 |
| 2. Schema Gate + Repair | 解析后兜底 | 漏字段直接进数据库，下游全错 |
| 3. Fan-out / Slot-based | 改架构 | 单次调用永远有上限，规模上去就崩 |
| 4. Observable Failure | UI 兜底 | 用户看到"缺了"以为是 bug，信任崩塌 |

经验法则（来自社区文章 *"Multi-Agent Orchestration Patterns for Production"*）：

> **没有银弹**。低风险场景用 1+2 就够；高情绪/高准确率场景必须 1+2+3+4 全做。

---

## 参考资料

> 链接来源说明：以下链接均为本次调研的 web_search 结果。由于 OpenAI 官方页面 web_fetch 时返回 403（反爬），其内容来自搜索结果摘要与社区转述，未做完整原文核对；其他链接为搜索结果直接给出，**列入参考前未亲自打开每一篇**，使用时请二次核实。

- OpenAI Structured Outputs（公告页，需浏览器访问）：<https://openai.com/index/introducing-structured-outputs-in-the-api/>
- OpenAI API 文档（Structured Outputs Guide）：<https://developers.openai.com/api/docs/guides/structured-outputs>
- Instructor 库官网（Errors as Prompts 模式来源）：<https://python.useinstructor.com/>
- BentoML LLM Inference Handbook · Structured Outputs 一节（涵盖 re-prompting / Instructor 模式）：<https://bentoml.com/llm/model-interaction/structured-outputs>
- LangGraph Map-Reduce How-to（Send API + Superstep 来源）：<https://langchain-ai.github.io/langgraph/how-tos/map-reduce/>
- Vercel AI SDK · Generating Structured Data：<https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data>
- Vercel AI SDK · `experimental_output` 设计 issue：<https://github.com/vercel/ai/issues/3866>
- AutoGen 框架官网（GroupChat / RoundRobinGroupChat 来源）：<https://microsoft.github.io/autogen/>
- *Stop Blaming the LLM: JSON Schema Is the Cheapest Fix*（Schema Gate Pattern 一词出处）：<https://medium.com/@Micheal-Lanham/stop-blaming-the-llm-json-schema-is-the-cheapest-fix-for-flaky-ai-agents-00ebcecefff8>
- *Multi-Agent Orchestration Patterns for Production* by Beam AI（"四层组合"经验法则出处）：<https://beam.ai/agentic-insights/multi-agent-orchestration-patterns-production>
- arXiv · *Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop QA*（多 Agent 成本 / 收益讨论的学术参考）：<https://arxiv.org/pdf/2604.02460>
