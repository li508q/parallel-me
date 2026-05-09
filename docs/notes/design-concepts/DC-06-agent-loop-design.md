# DC-06 · Agent Loop 化设计 · 关键环节从固定调用升级为 LLM 自主循环

> 对应体验问题：[EXP-08](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md)
> 业界参考：[DR-06](../design-references/DR-06-agent-loop-streaming-references.md)
> 关联设计：[DC-01 书记员工作台](DC-01-scribe-activity.md) · [DC-04 碰撞哲学](DC-04-confrontational-voice-design.md)
> 关联工程：[S13 Next 16](../requirements/backlog.md#s13)
> 关联需求：[R19~R21 + S16~S17](../requirements/backlog.md#r19)

---

## 1 · 设计原则

### P1 · LLM 自主判断终止，代码只设安全上限

**反模式**：`choiceCards 2-4 张`（`lib/llm.ts:237` 硬编码）
**正确模式**：LLM 每一步评估"信息是否充分"，不充分就继续追问；代码只设 `maxSteps: 10` 防止无限循环。

来源：[DR-06 公理 1](../design-references/DR-06-agent-loop-streaming-references.md)（Vercel `stopWhen` / OpenAI Runner / LangGraph conditional edges）

### P2 · 每个 Agent 步骤都必须可 stream

**反模式**：`postJson()` 一次性返回整个 JSON
**正确模式**：SSE/ReadableStream 逐步返回——用户看到书记员的思考过程（"正在分析…" → "发现 3 个需确认的点…" → "生成选择卡…"）

来源：[DR-06 公理 2](../design-references/DR-06-agent-loop-streaming-references.md)（Vercel `streamText` / LangGraph first-class streaming）

### P3 · 追问是 tool call，不是独立机制

**反模式**：前端硬编码"先出选择卡 → 用户答 → 再调一次"的流程
**正确模式**：书记员 Agent 在循环中自主决定调用 `askUser(questions)` tool → 暂停等待用户回答 → 继续循环

来源：[DR-06 公理 3](../design-references/DR-06-agent-loop-streaming-references.md)（Vercel tool approval / OpenAI Guardrails / LangGraph interrupt）

### P4 · Agent 思考过程对用户透明

**反模式**：用户只看到 loading spinner → 突然出现完整结果
**正确模式**：渐进披露——思考过程默认折叠、可展开；关键决策点（"我决定追问"）显式告知用户

来源：[DR-06 公理 4](../design-references/DR-06-agent-loop-streaming-references.md)（ChatGPT thinking bubble / Cursor plan preview）

### P5 · 用户随时可中断

**反模式**：用户在 Agent 循环中没有"够了"按钮
**正确模式**：每个 streaming 环节都有"跳过 / 够了 / 我要补充"按钮；Agent 被中断后优雅降级（用已有信息生成当前最佳结果）

来源：[DR-06 公理 5](../design-references/DR-06-agent-loop-streaming-references.md)（ChatGPT Stop / Cursor cancel）

---

## 2 · 五个环节的 Agent Loop 改造方案

### 2.1 defining 阶段 · 书记员议题定义 Agent

**当前**（`lib/llm.ts:206` `generateTaskFrame`）：

```
call_1(rawInput) → { choiceCards, taskFrame_draft }
user_answers → call_2(rawInput, answers) → { taskFrame_final }
→ setStage("review")
```

**目标**：

```
ScribeDefiningAgent.loop(rawInput):
  step 1: analyze(rawInput)
    → 评估信息充分度（LLM 自主判断）
    → 如果充分 → 直接生成 taskFrame → END
    → 如果不充分 → tool_call: askUser(choiceCards)
  
  step 2: 用户回答 choiceCards（Human-in-the-loop）
    → context.update(answers)
    → 回到 step 1（重新评估充分度）
  
  ... 循环直到 LLM 判断"信息充分" 或 达到 maxSteps(10) 或 用户说"够了"
  
  final: generateTaskFrame(context) → setStage("review")
```

**UI 交互**：
- 书记员分析过程 token-by-token stream（"我注意到你提到了三个维度…"）
- 每张选择卡出现时有渐入动画，不是一次性堆出 4 张
- 用户可以在任何时候说"够了，直接整理议题"
- 书记员决定"信息够了"时有显式叙事（"我觉得已经够清楚了，下面是我整理的议题"）

**关键技术**：Vercel AI SDK 6 `ToolLoopAgent` + `askUser` tool + `streamText`

### 2.2 inquiry 阶段 · 书记员偏好验证 Agent

**当前**（`lib/llm.ts:402` `generateScribeInquiry`）：

```
call_1(全部上下文) → { questions, preferenceProfile }
user_answers → 直接进入 settlement
```

**目标**：

```
ScribeInquiryAgent.loop(taskFrame, roundtable, scribeTrace):
  step 1: analyze(圆桌记录)
    → 识别待验证偏好 + 识别潜在矛盾
    → tool_call: askUser(validation_questions)
  
  step 2: 用户回答
    → context.update(answers)
    → 重新分析：用户回答是否揭示了新矛盾？
    → 有新矛盾 → tool_call: askUser(followup_questions)（回到 step 2）
    → 无新矛盾 → 生成 preferenceProfile → END
  
  maxSteps: 5（安全上限）
```

**UI 交互**：
- 书记员在分析圆桌记录时的思考过程可见（"我注意到 Money 和 Lay 在这个点上完全对立…"）
- 追问出现时有叙事过渡（"你的回答让我发现了一个新的矛盾…"）

### 2.3 roundtable opening · 五声充分思考（Deep Reasoning，非 Agent Loop）

> **关键区分**：五声**不需要 Agent Loop**——它们不与用户交互了解意图，而是各自有性格，针对场景和对话交锋来输出内容。**这个定位完全没有问题。** 但五声需要**充分思考后给出有洞见的回答**。改进方向是 **Deep Reasoning**（更深的推理链、更充分的思考空间），不是 Human-in-the-loop 循环。

**当前**（`lib/llm.ts:289` `generateOpeningTurns`）：

```
call_1(taskFrame) → { openingTurns: [5个] }（一次性生成，5 个 voice 的思考深度被分摊稀释）
```

**目标**：

```
改进方向 A · 独立调用（推荐）：
  for each voice in [Money, Lay, Future, Emotion, Wild]:
    openingTurn = generateSingleOpening(voice, taskFrame)
    // 每个 voice 独立调用，拥有完整的 thinking token 预算
    // prompt 显式引导：先深度分析议题 → 找到自己角色最值得发声的交锋点 → 形成有洞见的立场

改进方向 B · 张力自检（可叠加）：
  after all 5 openings generated:
    tensionCheck = evaluateTension(openingTurns)
    // 评估 5 个立论是否形成足够差异
    // 如果 2 个 voice 观点过于相似 → 重生成重叠的 voice（给予更多思考空间）
```

**UI 交互**：
- 5 个立论逐个 stream 出现（不是一次性全部出现）
- 每个 voice 的立论有独立的 streaming 动画
- 如果某个 voice 的立论被重生成（张力自检后），展示书记员叙事（"让 Future 换个视角再想想…"）

### 2.4 roundtable 自由阶段 · 五声充分思考 + 书记员自主 mirror

**当前**（`lib/llm.ts:352` `generateRoundtableMove`）：

```
用户点按钮(moveType) → call_1(moveType, context) → { turns/duel/summary }
```

**目标**：分两个维度改进

**维度 A · 五声充分思考（Deep Reasoning）**：

五声仍然是"被叫到才说话"——用户触发后 voice 发言。但发言前需要充分思考：

```
用户点按钮(moveType) →
  voice.deepReason(context):
    // prompt 显式引导：
    // 1. 分析到目前为止的对话脉络（谁说了什么、哪些观点碰撞了）
    // 2. 找到自己角色在当前对话上下文中最值得回应的交锋点
    // 3. 形成有洞见的、立场鲜明的回应
  → { turn: 有深度的回应 }
```

**维度 B · 书记员自主 mirror（Agent Loop）**：

书记员可以在对话进行中自主插入 `mirror_structure`——这是书记员的 Agent 行为，不是五声的：

```
after each voice turn:
  scribe.evaluate(roundtable_state):
    → 如果检测到结构性矛盾 → 自主插入 mirror_structure
    → 否则 → 等待用户下一步操作
```

**UI 交互**：
- 书记员自主 mirror 时有独立视觉（细线框 + 灰底，与 voice 强对比）
- 用户可以关闭"书记员自主观察"（尊重用户控制权，[PR-03 autonomy](../psychology-references/PR-03-anti-sycophancy-autonomy.md)）

### 2.5 settlement · 书记员自检 Agent

**当前**（`lib/llm.ts:461` `generateClaritySettlement`）：

```
call_1(全部上下文) → { clarity_sentence, preference_readout, ... }
```

**目标**：

```
SettlementAgent.loop(全部上下文):
  step 1: 生成清明落定草稿
  step 2: 自检（LLM 评估"这个清明句是否真的从用户的选择里长出来"）
    → 自检通过 → END
    → 自检不通过（清明句太泛、太鸡汤、没有触及核心矛盾）→ 自我修正 → 回到 step 2
  maxSteps: 3
```

**UI 交互**：
- 清明句逐字 stream（仪式感）
- 如果 Agent 自检后修正，展示"让我再想想…"的过渡叙事（不暴露"自检失败"的机制，保持书记员的人格一致性）

---

## 3 · 与 DC-01 书记员工作台的协同

[DC-01](DC-01-scribe-activity.md) 定义了四层架构：

| DC-01 Layer | Agent Loop 化后的升级 |
| --- | --- |
| **Layer 1 状态条** | 从"阶段叙事"升级为"Agent 步骤叙事"——不再只展示"正在整理议题"，而是展示"正在分析你的输入（step 1/3）→ 发现需要确认 → 生成选择卡…" |
| **Layer 2 Trace** | 记录 Agent 的每一步决策——"step 1: 评估信息充分度 → 判定不充分 → 决定追问 3 个问题"（为归档和回溯提供完整决策链） |
| **Layer 3 决策面板** | 用户在 Agent Loop 中的交互（回答选择卡、说"够了"、补充信息）也是决策行为，需要入 Trace |
| **Layer 4 Trace 回看** | 归档详情页可以回放 Agent 的完整决策过程 |

---

## 4 · 技术实现路径

### 4.1 前置依赖

| 依赖 | 来源 | 说明 |
| --- | --- | --- |
| **Next.js 16 + React 19** | [S13](../requirements/backlog.md#s13) | Vercel AI SDK 6 需要 React 19+ |
| **Vercel AI SDK 6** | 新增依赖 | `ToolLoopAgent` + `streamText` + tool approval |
| **SSE/ReadableStream** | [S2](../requirements/backlog.md#s2) | Agent Loop 的多步 streaming 需要 SSE 作为传输层 |

### 4.2 架构变化

```
当前架构：
  app/meeting/page.tsx (useState 状态机)
    → postJson("/api/task-frame")     ← 一次性 JSON 返回
    → postJson("/api/roundtable")     ← 一次性 JSON 返回
    → postJson("/api/scribe-inquiry") ← 一次性 JSON 返回
    → postJson("/api/settlement")     ← 一次性 JSON 返回

目标架构：
  lib/agents/scribe-defining.ts      ← ToolLoopAgent 定义
  lib/agents/scribe-inquiry.ts       ← ToolLoopAgent 定义
  lib/agents/opening.ts              ← ToolLoopAgent 定义
  lib/agents/roundtable.ts           ← 混合触发 Agent
  lib/agents/settlement.ts           ← ToolLoopAgent 定义

  app/api/task-frame/route.ts        ← 改为 streaming endpoint
  app/api/roundtable/route.ts        ← 改为 streaming endpoint
  app/api/scribe-inquiry/route.ts    ← 改为 streaming endpoint
  app/api/settlement/route.ts        ← 改为 streaming endpoint

  app/meeting/page.tsx
    → useAgentStream("/api/task-frame")     ← streaming + tool call 展示
    → useAgentStream("/api/roundtable")     ← streaming + voice 自主插入
    → useAgentStream("/api/scribe-inquiry") ← streaming + 追问循环
    → useAgentStream("/api/settlement")     ← streaming + 自检叙事
```

### 4.3 工程改造需求映射

| 需求 ID | 标题 | 对应环节 |
| --- | --- | --- |
| [R19](../requirements/backlog.md#r19) | 书记员 defining Agent Loop 化 | 2.1 |
| [R20](../requirements/backlog.md#r20) | 书记员 inquiry Agent Loop 化 | 2.2 |
| [R21](../requirements/backlog.md#r21) | 圆桌 Voice 自主插入 + 书记员自主 mirror | 2.4 |
| [S16](../requirements/backlog.md#s16) | Agent 运行时引入（Vercel AI SDK 6 ToolLoopAgent） | 4.1 |
| [S17](../requirements/backlog.md#s17) | 全链路 streaming UI 改造（useAgentStream hook） | 4.2 |

> opening 自检（2.3）和 settlement 自检（2.5）可合并入 S16（Agent 运行时引入后自然获得 loop 能力），不单独拆需求。

---

## 5 · 落地验收

1. **defining 阶段**：对同一个复杂议题（"离婚 + 裁员 + 想要小孩"）跑 3 次，书记员至少有 1 次在第一轮选择卡答完后说"我还需要了解…"并自主追问
2. **inquiry 阶段**：跑 3 次，书记员至少有 1 次在用户回答后说"你的回答让我发现…"并追问
3. **roundtable**：跑 3 次，至少有 1 次 voice 自主插入（不需要用户点按钮）
4. **settlement**：跑 3 次，用户主观判断清明句的"从选择里长出来"感 ≥ 当前版本
5. **streaming UI**：所有环节的 LLM 输出都是 token-by-token stream，无一次性整块渲染
6. **中断**：用户在任何环节点"够了"按钮后，Agent 在 2 秒内优雅停止并用已有信息生成结果
7. **Trace**：归档详情页可以看到 Agent 的完整决策链（step 1 → step 2 → …）
