# DR-06 · Agent Loop + Streaming UI 业界参考

> 对应设计构想：[DC-06](../design-concepts/DC-06-agent-loop-design.md)
> 对应体验问题：[EXP-08](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md)
> 调研时间：2026-05-07
> 调研目的：为 ParallelMe 从"固定调用次数 Workflow"升级为"Agent Loop + Streaming UI"提供业界顶级产品的截图级 / 交互级证据

---

## 1 · Vercel AI SDK 6 · ToolLoopAgent

> 来源：`https://vercel.com/blog/ai-sdk-6`（2025-12-22 发布，已二次核对原文）

### 核心架构

Vercel AI SDK 6 引入 `ToolLoopAgent` 类——**生产级 Agent Loop 原语**：

```typescript
import { ToolLoopAgent, stepCountIs } from 'ai';

export const scribeAgent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4.5',
  instructions: 'You are the ParallelMe scribe...',
  tools: { clarify: clarifyTool, generateFrame: frameTool },
  stopWhen: stepCountIs(20),  // 安全上限，非业务终止条件
});

// 使用：Agent 自主循环直到判断完成
const result = await scribeAgent.generateText({ prompt: userInput });
// 或 streaming：
const stream = await scribeAgent.streamText({ prompt: userInput });
```

### 关键设计决策

| 决策 | Vercel 的选择 | 对 ParallelMe 的启示 |
| --- | --- | --- |
| **循环终止** | `stopWhen` 函数（步数上限 / 自定义条件） | 书记员的终止条件应是"信息充分度自评"而非步数 |
| **Tool 执行** | Agent 自主决定调用哪个 tool → 执行 → 结果回传 → 继续循环 | 书记员的"追问选择卡"可建模为一个 tool call |
| **Streaming** | `streamText` 原生支持，每个 tool call 的过程都可 stream | 用户可以看到书记员的思考过程（"正在分析…" → "发现 3 个点…"） |
| **可复用** | 定义一次、多处使用（chat UI / background job / API） | `lib/scribe-agent.ts` 定义一次，`/api/task-frame` 和 `/api/scribe-inquiry` 复用 |
| **Human-in-the-loop** | Tool approval API——Agent 请求执行 tool 时可暂停等用户批准 | 书记员追问 = tool call（需要用户回答） |

### 对 ParallelMe 的具体映射

ParallelMe 的"书记员追问选择卡"可以直接映射为 Vercel AI SDK 的 **Tool Call** 模式：

```
书记员 Agent Loop:
  1. 分析用户输入 → 判断信息是否充分
  2. 不充分 → tool call: generateChoiceCards(questions)
     → 暂停等用户回答（Human-in-the-loop）
     → 用户回答后继续循环
  3. 充分 → tool call: generateTaskFrame(context)
     → 返回最终结果
```

---

## 2 · OpenAI Agents SDK · Runner Loop

> 来源：`https://developers.openai.com/api/docs/guides/agents/running-agents`（2025，来自 web_search 摘要）
> 补充：`https://zhuanlan.zhihu.com/p/2031808107903444359`（已二次核对原文）

### 核心概念

OpenAI Agents SDK 的核心是 **Runner**——"keeps looping until it reaches a real stopping point"：

```python
from agents import Agent, Runner

agent = Agent(name="scribe", instructions="...", tools=[clarify, frame])
result = Runner.run_sync(agent, "用户的议题描述")
```

Runner 内部循环：
1. 调用 LLM → LLM 返回 tool_call 或 final_output
2. 如果是 tool_call → 执行 tool → 把结果送回 LLM → 回到步骤 1
3. 如果是 final_output → 停止循环

### 关键设计理念

- **"把 Agent Loop 里每一个可能出错、可能被打断、可能需要人介入的点，都显式地建成一个 SDK 原语"**（知乎深度解读原文）
- **Handoff 机制**：Agent 可以把控制权交给另一个 Agent——直接映射 ParallelMe 的"书记员 → 五声 → 书记员"切换
- **Guardrails**：输入/输出护栏——映射 ParallelMe 的"不诊断、不治疗承诺"约束

### 对 ParallelMe 的启示

| OpenAI 概念 | ParallelMe 映射 |
| --- | --- |
| Agent | 书记员 / 五声（各一个 Agent） |
| Runner loop | 每个 Stage 内部的 Agent Loop |
| Handoff | Stage 切换（defining → review → roundtable → …） |
| tool_call | 追问选择卡 / 生成 taskFrame / 生成立论 / mirror_structure |
| final_output | 该 Stage 的最终产出（taskFrame / roundtable record / clarity） |
| Guardrails | 不诊断 / 不治疗 / 不站队 / 不做第六声 |

---

## 3 · LangGraph · State Machine + Streaming

> 来源：`https://www.langchain.com/langgraph`（官网，已二次核对）
> 补充：`https://www.langchain.com/blog/building-langgraph`（设计博客，已二次核对）

### 核心架构

LangGraph 将 Agent 建模为**有状态的图（Stateful Graph）**：

- **Nodes**：执行步骤（"调用 LLM" / "执行 tool" / "等待用户输入"）
- **Edges**：条件转移（LLM 决定"下一步去哪个 node"）
- **State**：全局共享的 TypedDict，所有 node 读写同一份状态

### Streaming 设计

LangGraph 的口号：**"First-class streaming for better UX design"**

- Token-by-token streaming：每个 node 的 LLM 输出都可以实时 stream
- Node-level events：前端可以监听"哪个 node 正在执行"，展示步骤进度
- Interrupt：可以在任意 node 暂停等待人类输入

### 对 ParallelMe 的启示

ParallelMe 的每个 Stage 可以建模为一个 LangGraph 子图：

```
defining 子图：
  [analyze_input] → (信息充分?) 
      → Yes → [generate_taskframe] → END
      → No  → [generate_choice_cards] → [wait_user_answer] → [analyze_input]（循环）

roundtable 子图：
  [opening_turns] → [wait_user_action]
      → user_triggered → [generate_move] → [wait_user_action]（循环）
      → voice_autonomous → [voice_interject] → [wait_user_action]
      → scribe_autonomous → [mirror_structure] → [wait_user_action]
      → user_exits → END
```

---

## 4 · ChatGPT · Agent Streaming UI 交互模式

> 来源：ChatGPT Web/iOS 2025 版本实测（已二次核对交互行为）

### 核心 UI 模式

ChatGPT 在 Agent 模式（如 Deep Research、Canvas）下的 UI 设计：

| UI 元素 | 交互行为 | 对 ParallelMe 的启示 |
| --- | --- | --- |
| **Thinking 气泡** | Agent 思考时显示"Thinking…"动画 + 可展开查看思考过程 | 书记员分析用户输入时的可见思考 |
| **Tool Call 展开** | 每个 tool call 显示为可折叠卡片（工具名 + 参数 + 结果预览） | 书记员决定"追问选择卡"时展示决策过程 |
| **Streaming 文本** | Token-by-token 渲染，光标闪烁 | 立论/回应/清明句的逐字渲染 |
| **步骤进度** | 侧边栏显示"Step 1/5: Searching…" | 书记员工作台 Layer 1 的阶段叙事 |
| **中断按钮** | 用户可随时点"Stop"中断 Agent | 用户可以说"够了"中断书记员追问 |

### 关键设计原则

1. **透明度**：Agent 的每一步决策都对用户可见（不是黑箱等待）
2. **可中断**：用户任何时候都能中断 Agent 的循环
3. **渐进披露**：思考过程默认折叠、可展开——不强迫用户看所有细节
4. **结果优先**：最终结果永远在视觉最突出的位置

---

## 5 · Cursor / Windsurf · Agent 模式 UI

> 来源：Cursor 0.45+ Agent 模式实测 + Windsurf Cascade（2025，已二次核对交互行为）

### 核心交互模式

| 模式 | 交互 | 对 ParallelMe 的启示 |
| --- | --- | --- |
| **Plan → Execute** | Agent 先生成计划（可编辑）→ 用户确认 → 逐步执行 | 书记员先展示"我打算问你这 3 个问题"→ 用户可以说"不用问第 2 个" |
| **多步执行可视化** | 侧边栏实时显示 Agent 正在执行的步骤 + 已完成的步骤 | DC-01 Layer 1 ScribeStatusStrip |
| **Diff 预览** | 每个修改都先展示 diff → 用户确认 | 书记员修改 taskFrame 时先展示"我把 X 改成了 Y，因为…" |
| **回滚** | 用户可以撤销 Agent 的任何一步操作 | 用户可以说"你刚才的追问不对，退回去" |

---

## 6 · 跨产品公理提炼

| # | 公理 | 来源 | 对 ParallelMe 的行动建议 |
| --- | --- | --- | --- |
| 1 | **Agent Loop 的终止条件由 LLM 自主判断，代码只设安全上限** | Vercel `stopWhen` / OpenAI Runner / LangGraph conditional edges | 书记员的"信息充分度"= LLM 评估，代码只设 `maxSteps: 10` 兜底 |
| 2 | **每个 Agent 步骤都必须可 stream** | Vercel `streamText` / LangGraph "first-class streaming" | 从 `postJson` 一次性返回改为 SSE/ReadableStream 逐步返回 |
| 3 | **Human-in-the-loop 是 tool call 的特例，不是独立机制** | Vercel tool approval / OpenAI Guardrails / LangGraph interrupt | 书记员追问 = tool call `askUser(questions)` → 暂停 → 用户回答 → 继续 |
| 4 | **Agent 的思考过程必须对用户透明** | ChatGPT thinking bubble / Cursor plan preview | 书记员的每一步决策（"我觉得信息不够 → 决定追问 → 选择问什么"）都应可见 |
| 5 | **用户必须能随时中断 Agent 循环** | ChatGPT Stop 按钮 / Cursor cancel | 每个 streaming 环节都有"够了 / 跳过"按钮 |
| 6 | **Agent 的多步执行应该有视觉进度** | ChatGPT step progress / Cursor sidebar / Windsurf Cascade | DC-01 Layer 1 ScribeStatusStrip 的 Agent 步骤可视化 |
| 7 | **Handoff（Agent 间切换）应该显式、可见** | OpenAI Handoff / LangGraph sub-graphs | Stage 切换不再是瞬间跳转，而是有"书记员把接力棒交给五声"的过渡叙事 |

---

## 7 · 技术栈选型建议

基于调研，ParallelMe 实现 Agent Loop + Streaming UI 的推荐技术路径：

| 层 | 推荐 | 理由 |
| --- | --- | --- |
| **Agent Loop 运行时** | Vercel AI SDK 6 `ToolLoopAgent` | 与 Next.js 16 原生集成；TypeScript-first；支持 streaming + tool approval；20M+ 月下载量 |
| **State 管理** | React 19 `useActionState` + Server Actions | 与 [S15](../requirements/backlog.md#s15) 协同；消除手写 useState/try-catch |
| **Streaming 传输** | AI SDK `streamText` + React Server Components | 比手写 SSE 更可靠；自动处理 backpressure |
| **UI 组件** | AI SDK `useChat` / 自定义 `useAgentStream` hook | 处理 token streaming + tool call 展示 + 中断 |
| **进度可视化** | DC-01 Layer 1 ScribeStatusStrip 适配 | 已有设计基础，只需从"阶段叙事"升级为"Agent 步骤叙事" |

> **注**：Vercel AI SDK 6 需要 React 19 + Next.js 15+；[S13 框架核心升级](../requirements/backlog.md#s13) 已在 Step 1 完成。
