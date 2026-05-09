# EXP-08 · 固定调用次数限制了 Agent 分析深度

> 记录时间：2026-05-07
> 来源：用户实测 + 架构 code review
> 严重度：🔴 高（架构级 · 影响所有 LLM 环节）
> 关联设计：[DC-06](../design-concepts/DC-06-agent-loop-design.md)（Agent Loop 化设计）
> 关联调研：[DR-06](../design-references/DR-06-agent-loop-streaming-references.md)（业界 Agent Loop + Streaming UI 参考）
> 关联需求：[R19~R21 + S16~S17](../requirements/backlog.md#r19)

---

## 1 · 问题本质

ParallelMe v0.7 的 LLM 环节存在**两类不同的深度不足**问题：

### 问题 A · 书记员缺乏 Agent Loop（交互循环）

书记员需要**与用户交互循环追问**，但当前是固定调用次数：

- 书记员**不能说**"你答完这 3 张卡我还是没搞清楚，再问你 2 个"
- 书记员在问询阶段**不能说**"你的回答让我发现了新的矛盾点，我想再问一个"

这是一个 **Human-in-the-loop Agent Loop** 问题——书记员需要与用户反复交互来了解意图、验证偏好。

### 问题 B · 五声缺乏充分思考（Deep Reasoning）

五声**不需要 Agent Loop**——它们不与用户交互了解意图，而是各自有各自的性格，针对场景和对话交锋来输出内容。**这个定位完全没有问题。**

但五声需要**充分思考后给出有洞见的回答**。当前的问题不是"缺少循环"，而是：
- prompt 没有显式引导 voice 进行深度推理（分析对话脉络、找到真正的交锋点、形成有洞见的立场）
- 没有利用 extended thinking / chain-of-thought 机制让 voice 在回答前充分思考
- 一次性生成 5 个 voice 的立论时，每个 voice 的思考深度被分摊稀释

### 两种机制的区分

| 维度 | 书记员 | 五声 |
| --- | --- | --- |
| **需要 Agent Loop（与用户交互循环）?** | ✅ 需要 | ❌ 不需要——角色驱动，不是交互驱动 |
| **需要充分思考（Deep Reasoning）?** | ✅ 需要 | ✅ **同样需要**——充分思考后给出有洞见的回答 |
| **机制** | Human-in-the-loop + tool call 循环 | Extended thinking / CoT · 更多 thinking tokens · 更深推理链 |
| **终止条件** | LLM 自主判断"信息是否充分" | 单次调用，但调用时给予充分的思考空间 |

本质上，书记员的问题是 **Workflow 架构限制了交互深度**，五声的问题是 **prompt 和调用方式限制了思考深度**。两者都需要改进，但改进方向完全不同。

---

## 2 · 全代码库证据链

### 2.1 `generateTaskFrame`（defining 阶段）· `lib/llm.ts:206`

**当前模式**：固定 2 次调用

```
第 1 次：rawInput → LLM → { choiceCards: 2-4张, taskFrame: 初版 }
     ↓ 用户逐张回答 choiceCards
第 2 次：rawInput + choiceAnswers → LLM → { taskFrame: 最终版 }
     ↓ 直接进入 review（setStage("review")）
```

**问题**：
- prompt 硬编码 `choiceCards 2-4 张`（`lib/llm.ts:237`）
- 无论议题复杂度如何（"考公 vs 大厂"和"离婚 + 裁员 + 想要小孩"），都是固定 2-4 张卡、2 次调用
- 书记员没有"评估信息是否充分"的决策点

**前端驱动逻辑**：`app/meeting/page.tsx:225`
- `finalizeTaskFrame()` → `setStage("review")`，无条件推进

### 2.2 `generateScribeInquiry`（inquiry 阶段）· `lib/llm.ts:402`

**当前模式**：固定 1 次调用

```
全部上下文 → LLM → { questions: N个, preferenceProfile: 初版 }
     ↓ 用户逐个回答 questions
直接进入 settlement（无第二轮追问机会）
```

**问题**：
- 书记员不能根据用户的回答发现新矛盾并追问
- preferenceProfile 基于一次性生成，无法被用户回答迭代修正

**前端驱动逻辑**：`app/meeting/page.tsx:343`
- `startInquiry()` → 1 次 API 调用 → `setStage("inquiry")`
- 用户答完 → `generateSettlement()` → `setStage("settlement")`

### 2.3 `generateOpeningTurns`（roundtable opening）· `lib/llm.ts:289`

**当前模式**：固定 1 次调用，一次性生成 5 个 voice 的立论

**问题**：
- 五声**不需要 Agent Loop**（它们不与用户交互了解意图，而是角色驱动——各自有性格，针对场景和对话交锋输出内容），**这个定位完全没有问题**
- 但五声需要**充分思考后给出有洞见的回答**——当前一次性生成 5 个立论，每个 voice 的思考深度被分摊稀释
- prompt 没有显式引导 voice 进行深度推理（分析议题脉络、找到真正值得发声的交锋点、形成有洞见的立场）
- 缺席问题（[EXP-03](EXP-03-multi-agent-absence.md)）的根因之一就是一次性要求太多，思考不充分
- 没有 self-check 机制（LLM 不评估"这 5 个立论是否形成了足够的张力"）

### 2.4 `generateRoundtableMove`（roundtable 自由阶段）· `lib/llm.ts:352`

**当前模式**：用户点按钮 → 1 次调用 → 返回结果

**问题**：
- 同 2.3，五声不需要 Agent Loop，但每次发言需要充分思考——当前 prompt 没有引导 voice 深度分析对话脉络后再回应
- 书记员不能自主插入 `mirror_structure`
- 五声的发言是被动触发的（等用户点按钮），但这本身不是问题——关键是触发后 voice 的思考深度不足

### 2.5 `generateClaritySettlement`（settlement）· `lib/llm.ts:461`

**当前模式**：固定 1 次调用

**问题**：
- 书记员不能自检"这个清明句是否真的从用户的选择里长出来"
- 没有 self-refinement 机制

---

## 3 · 应该变成什么

### 3.1 核心架构变化

从 **固定 N 次调用** 变为 **Agent Loop（LLM 自主判断终止条件）**：

```
当前（Workflow）：
  call_1() → user_answer → call_2() → done    （硬编码 2 次）

目标（Agent Loop）：
  while (agent.needsMoreInfo(context)):         （LLM 自主判断）
      action = agent.decide(context)            （LLM 决定下一步做什么）
      if action.type === "ask_user":
          answers = user.answer(action.questions)
          context.update(answers)
      elif action.type === "refine":
          context.update(agent.refine(context))
  result = agent.finalize(context)
```

### 3.2 每个环节的目标形态

| 环节 | 角色 | 当前 | 目标 | 改进类型 |
| --- | --- | --- | --- | --- |
| **defining** | 书记员 | 固定 2 次调用 | Agent Loop：持续追问直到自主判断"信息充分" | Agent Loop（Human-in-the-loop） |
| **inquiry** | 书记员 | 固定 1 次调用 | Agent Loop：验证偏好后可追问新矛盾 | Agent Loop（Human-in-the-loop） |
| **opening** | 五声 | 固定 1 次 5 voice | Deep Reasoning：每个 voice 独立充分思考 + 张力自检 | 充分思考（非 Agent Loop） |
| **roundtable** | 五声 | 用户点按钮才响应 | Deep Reasoning：每次发言前充分分析对话脉络再回应 | 充分思考（非 Agent Loop） |
| **roundtable** | 书记员 | 被动等用户操作 | 书记员自主 mirror_structure | Agent Loop（自主触发） |
| **settlement** | 书记员 | 固定 1 次生成 | Agent Loop：生成 → 自检 → self-refinement | Agent Loop（self-refine） |

### 3.3 UI 必须匹配 Agent streaming

用户明确要求：**在这些环节中的 UI 交互要更贴合现代主流的 streaming，尤其是 Agent 领域的 UI 设计**。

当前 UI 模式是"按钮 → 全量等待 → 整块渲染"，应该改为：
- Token-by-token streaming（书记员思考过程可见）
- Agent 步骤可视化（"正在分析你的输入…" → "发现 3 个需要确认的点…" → "生成选择卡…"）
- 过程可中断（用户可以在 Agent 思考时说"够了"或"不对，我补充一下"）

业界参考：
- **Vercel AI SDK 6**：`ToolLoopAgent` 原语——`stopWhen: stepCountIs(20)` 控制最大步数，原生支持 streaming + tool calls 可视化
- **OpenAI Agents SDK**：Runner loop 核心概念——"keeps looping until it reaches a real stopping point"
- **LangGraph**：state machine + first-class streaming，每个 node 的执行过程都可以 stream
- **ChatGPT UI**：tool call 展示（展开/折叠 + 进度指示 + 结果预览）

详细业界参考见 [DR-06](../design-references/DR-06-agent-loop-streaming-references.md)。

---

## 4 · 与现有设计体系的关系

- **[DC-01 书记员工作台](../design-concepts/DC-01-scribe-activity.md)**：Layer 1（状态条）的"阶段叙事"需要适配 Agent Loop 的多步可视化；Layer 2（Trace）需要记录 Agent 的每一步决策
- **[S2 SSE 改造](../requirements/backlog.md#s2)**：Agent Loop 意味着一次用户操作可能触发**多轮** LLM 调用，SSE/streaming 是技术前提
- **[DC-04 碰撞哲学](../design-concepts/DC-04-confrontational-voice-design.md)**：Voice 自主插入是碰撞哲学的工程实现
- **[S13 技术基座](../requirements/backlog.md#s13)**：Vercel AI SDK 6 的 `ToolLoopAgent` + React 19 Server Actions 需要 Next 16 / React 19 基座，已在 Step 1 完成

---

## 5 · 用户原话

> "我认为这里都不能使用固定几次调用，而是应当进一步激发大模型的分析能力。"
> "我需要这种设计，并且在这个环节中的 UI 交互要更贴合现代主流的 streaming，尤其是 agent 领域的 UI 设计。"
> "并且在一切需要做这种改造的地方都需要进行这种改进。"
