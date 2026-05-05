# 02 · 多智能体对话范式

> **命题**：单 chat 框是 2024 主流但**不是 UI 范式**——只是当时仓促 ship 的形态。2025-2026 顶级 AI 产品全面迁移到 sidecar / canvas / generative UI / scoped surface。ParallelMe 的"议案纸 + 席位牌 + 阶段轨 + 决议纸 + 档案"本质是 sidecar + canvas 混合，**走在 2026 趋势的前面**。

---

## 关键结论

```
1. 多智能体编排已收敛到 5 种 pattern（Default / Auto / RoundRobin / Random / Manual / Swarm）
2. ParallelMe 的"议题驱动会议"= AutoPattern + Manual gates 混合
3. 单 chat 框只是 ship 出来的，不是被设计出的范式
4. 2024 一年内 7 次 GUI retrofit：GPT Store / Voice / Artifacts / Projects / Canvas / Computer Use / Deep Research
5. ParallelMe V0.5 Week 5 重设计直接对标这条趋势：Timeline + Dock + Console
6. 交叉质询的"真对话化"（V0.5 cross_response）是单 chat 框做不到的事
```

---

## 1 · 多智能体编排范式

### 1.1 · 五种 pattern（业界共识）

[Agent Orchestration: Coordinating Multiple Agents (AG2)](https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/)：

| Pattern | 谁选下一发言者 | 用户参与度 | 例子 |
|---|---|---|---|
| **DefaultPattern** | 显式编程 | 低 | 简单 pipeline |
| **AutoPattern** | LLM | 低 | AutoGen / Anthropic Agent SDK |
| **RoundRobinPattern** | 固定顺序 | 低 | V2 ParallelMe（5 路并行） |
| **ManualPattern** | 用户 | 高 | 通常的群聊机器人 |
| **Hybrid (Auto + Manual gates)** | **LLM 推荐 + 用户必须确认** | **极高** | **V0.5 ParallelMe** |
| **Swarm** | Agent 自发 | 中 | LangGraph swarm |

### 1.2 · ParallelMe 的位置（独有）

ParallelMe 是当前文献中**罕见的 Hybrid (Auto + Manual gates)** 实施：

- 立案：DefaultPattern（系统重写）
- 表态：RoundRobinPattern（5 席并行）
- 质询：**AutoPattern**（LLM 选最尖锐的 2 对）
- 用户点名：**ManualPattern**（4 道参与门之一）
- 裁决：DefaultPattern（NowMe 单 agent + critic loop）
- 用户签字：**ManualPattern**（24h 承诺）

**这套混合模式让 4 道用户参与门成为流程不可跳过的环节**——大多数其他多 agent 产品在追求"减少用户操作"，ParallelMe 在追求"增加用户主持"。

### 1.3 · 学术与工程参考

- [HUMA: Humanlike Multi-user Agent (arXiv 2511.17315, 2025)](https://arxiv.org/html/2511.17315v1) — Router + Action + Reflection 三组件 facilitator
- Du et al. 2023 · *Improving Factuality and Reasoning via Multiagent Debate* (arXiv:2305.14325) — 多智能体辩论提升事实性的实证
- [AutoGen · Multi-Agent Workflows](https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows) — 5 种内置 pattern
- [LangGraph Multi-Agent Case Study (FRE|Nxt, 2026-01)](https://www.frenxt.com/case-studies/langgraph-multi-agent) — 8 specialized agents 实战
- [Claude Agent SDK Multi-Agent Design Patterns (2026-03)](https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns) — Orchestrator / Pipeline / Mesh

---

## 2 · 反 chat 趋势（2024-2026）

### 2.1 · The chat box isn't a UI paradigm

[The chat box isn't a UI paradigm. It's what shipped. (DesignersForest)](https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/)：

> "**2024 is the year every major AI lab shipped GUI additions on top of the chat box.** Seven retrofits in twelve months, across three labs."

时间线：

| 时间 | 实验室 | 产品 | 形态 |
|---|---|---|---|
| 2024-01 | OpenAI | GPT Store | tile-based catalog |
| 2024-05 | OpenAI | GPT-4o Voice | 语音、打破 send-and-scrollback |
| 2024-06 | Anthropic | Artifacts | side panel |
| 2024-06 | Anthropic | Projects | persistent workspace |
| 2024-10 | OpenAI | Canvas | split-screen document editor |
| 2024-10 | Anthropic | Computer Use | agent 操作真实桌面 |
| 2024-12 | Google | Deep Research | multi-step + visible plan |

> "Each of these is a GUI pattern borrowed back from the interface the chat box replaced."

### 2.2 · Post-chat 5 大要素

> "Post-chat AI UX borrows from the GUI patterns the chat box displaced:
> - **visible affordances**
> - **structured input**
> - **direct manipulation of output**
> - **scoped assistance** tied to specific surfaces"

具体例子：
- Google Docs：highlight-based rephrase tools
- Notion / Cursor：inline cell autocomplete
- Figma：one-click image variants
- Linear：comment-to-commit flows

> "None of these require the user to write a prompt. All of them are intent-based."

### 2.3 · Beyond Chat 三大范式

[Beyond Chat: The Interface Revolution for AI Agents (MMNTM Research, 2025-12)](https://www.mmntm.net/articles/beyond-chat-interfaces) 总结了三大范式：

#### 1. Generative UI
> "The model returns interactive components — a chart for data, a form for inputs, a diff view for changes — rather than forcing everything into text bubbles."

代表：v0 (Vercel)、Vercel AI SDK 5 typed data parts。

#### 2. The Sidecar Pattern
> "Split-pane interface: chat on the left, 'living object' on the right. The artifact persists rather than scrolling away. **Users shift from asking for output to collaborating on a versioned document.**"

代表：Claude Artifacts、OpenAI Canvas、Cursor Composer。

ParallelMe 对应：会议主屏 = sidecar paradigm。议案纸是 living object，不是 chat history 中的临时消息。

#### 3. Spatial Canvas / Node Graph
> "Users don't chat with agents daily. They design them on node-based canvases, monitor execution logs, and intervene only when confidence drops below threshold."

代表：n8n、Zapier Central、LangGraph 编辑器。

ParallelMe V0.6+ 对应：席位关系图（Cabinet 视图深化）。

### 2.4 · Spatial layouts 决定 mental model

[Where should AI sit in your UI? (Sharang Sharma, UX Collective, 2025-06)](https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e)：

| Layout | 例 | AI 角色 |
|---|---|---|
| Chatbot | ChatGPT default | 主角，全部 |
| Side panel | GitHub Copilot Chat | 助手 |
| Inline | Notion AI / Cursor 内联 | 微 augment |
| Semantic spreadsheet | Causal, Bardeen | 数据 augment |
| **Infinite canvas** | TLDraw, Figma, Miro | **Creative collaborator** |

> "**Spatial layouts aren't aesthetic choices. They define the mental model users form about the AI's role.**"

ParallelMe V0.5 Week 5 重设计的关键判断：**桌面端三栏布局**（Header / SeatDock / Timeline + Console）+ **会议进行页的圆桌布局**（Dock 5 chip 围绕 Timeline 中央议题）—— 是 spatial canvas 的 IFS 版本。

---

## 3 · 对话感设计（V0.5 Week 5 反思）

### 3.1 · 当前问题诊断

V0.5 Week 5 反思（已并入 `PRODUCT-DESIGN.md` § 4.1）：

| 维度 | Week 4 之前的状态 | 真实会议感 |
|---|---|---|
| 阶段切换 | DocketPaper 整页替换 | 应是连续滚动，前面话还在视野里 |
| 席位发言 | grid 排列 3-5 张静态卡 | 应是轮流"接话"的张力 |
| 用户介入 | 各 stage 各自的小按钮 + 表单 | 应是底部一个常驻"主持人台" |
| 交叉质询 | A 问 B → 用户判定 → 下一对 | 应是 A 问 → **B 答** → 用户判定 |
| 用户角色 | 推流程的 form-filler | 主持人，会议进度由用户判断推动 |
| 书记 | 不存在 | 应该有 inline 中性侧记串起整场 |
| NowMe | 一锤子结论 | 应是"我听见了"式对话总结 |

### 3.2 · 三大原则

```
1. Continuity (一气呵成)
   会议不能翻页。所有 turn 在一条向下生长的时间轴上。
   灵感参考：议会 Hansard、Slack thread、Notion AI Meeting Notes 的转录视图、
   Anthropic Artifacts 的 sidecar — content lives, doesn't get replaced.

2. Host Presence (主持人在台)
   用户永远有一处可以开口（底部 HostConsole）。
   流程被用户推着走，不是用户被流程拖着走。

3. Presence of Seats (席位在场)
   5 席（或 quick 的 3 席）始终在场。
   就像他们真的坐在桌边。
```

### 3.3 · 业界对照启发

**Pi.ai (Inflection)**
- 慢节奏 + 情感优先 + 用户每次回复都被"接住"
- → ParallelMe 启发：每个 turn 之后必须有一个"接得住"的视觉状态

**ChatGPT Voice**
- 边说边响应，可以打断
- → 启发：席位发言时用户可以"举手"中断进入点名（V0.6 意图识别支持）

**Anthropic Artifacts**
- 主对话流 + 侧 panel 的 living object
- → 启发：议案纸是 living object，但放在主时间线左侧固定 ribbon 而不是切换页

**Cursor Chat**
- 单输入框，多种意图（改代码 / 解释 / 问问题）
- → 启发：HostConsole 接受多种意图（V0.6 意图识别）

**议会 Hansard 转录**
- 中性书记 inline 描写（"议长敲槌"、"X 议员鼓掌"）
- → 启发：每次阶段切换或重要事件，自动插一条 italic 小字"书记侧记"

**Notion AI Meeting Notes**
- summary / transcript 分离 + transcript 有时间戳
- → 启发：会议进行时所有 turn 是 transcript；归档时再生成 summary（V0.5 已实现 `/archive/[id]` 三 tab）

---

## 4 · 交叉质询的真对话化（V0.5 后端 + 前端）

### 4.1 · 当前（V0.5）

每对质询包含：
- `cross-question` event — A 反问 B（≤40 字）
- `cross-response` event — B 真实回应（≤60 字，**V0.5 新增**）

### 4.2 · 后端实现

`lib/llm.ts` 加 `crossExamRespond()`：

```typescript
export async function crossExamRespond(
  target: SelfId,
  challenger: SelfId,
  userInput: string,
  challengeText: string,
  runtime?: LlmRuntime,
): Promise<string> {
  const me = SELVES[target];
  const t = SELVES[challenger];
  const messages: Msg[] = [
    {
      role: "system",
      content:
        me.system_prompt +
        `\n\n# 特殊任务：被质询时的回应\n「${t.name}」刚刚反问了你。\n` +
        "用 ≤ 60 字诚实回应。继续保持你的人格、口头禅、禁忌词。\n" +
        "不要被说服转向，但也不要无脑反驳——把你真实的反应说出来。",
    },
    { role: "user", content: `用户的纠结：${userInput}\n\n${t.name}质问你：「${challengeText}」\n\n你的一句话回应：` }
  ];
  return chat(messages, { temperature: 0.85, max_tokens: 160, runtime });
}
```

`/api/parallel` 在 cross 事件后立即调用 `crossExamRespond` 并发送 `cross_response` event：

```
SSE event sequence (实测验证):
  cross → cross_response → cross → cross_response → ... → loudest → now → done
```

4 对质询，每对 Q+A 严格交替。

### 4.3 · 客户端 reveal one-at-a-time

V0.5 不一次性把 4 对全 dump 到 timeline。每对 reveal 后等用户判定，然后 reveal 下一对：

```
SSE 已发完所有 4 对（client 缓冲）
↓ user enter cross_exam stage
reveal pair 1 (question + response)
trailing UI = judgement buttons
↓ user judges → push user-mark → crossIndex++
reveal pair 2
↓ ...
↓ all judged → push scribe "质询完毕" → revision_check
```

这模拟真实庭审节奏——一对未结，下一对不上。

### 4.4 · 三种用户判定

```
[问中了]   — bg-safe-green/10 + safe-green border
[没问中]   — bg-paper-base + paper-edge border
[我想回答] — text-ink-mute + 触发 inline reply textarea
```

`[我想回答]` 进入 reply mode：用户在 DocketPaper 中输入自己替自己回答的话（≤300 字），提交后推 user-turn + user-mark 到 timeline。所有判定写入 `Meeting.userMarks[]`。

---

## 5 · ParallelMe 的反 chat 资产

V0.5 已经走在 post-chat 趋势的前面。这是战略资产：

### 5.1 · 产品级反 chat
- 主输入不是"chat 框"，是"议题立案纸"
- 会议过程是阶段轨而非 message stream
- 输出是议案纸 / 决议纸 / 签字条 / 会议档案——全部是 first-class object
- 历史不是 chat history，是会议档案库 + 阁

### 5.2 · 工程级反 chat
- 全部 UI object 可 deep-link：`/cabinet`, `/seat/[id]`, `/archive/[id]`
- 全部 AI 输出走 typed event schema，不是 raw text stream
- 客户端写 IndexedDB，不是 chat history append

### 5.3 · 商业级反 chat
- 对外宣发口径："不是 AI 替你想清楚，而是 AI 帮你召集你自己"
- 永远不说 "ParallelMe 是 chatbot"
- 永远不说 "对话型 AI"
- 始终说："对象系统 / 内阁会议 / 议题驱动"

---

## 6 · 完整 URL 清单

```
# 多智能体编排
https://arxiv.org/html/2511.17315v1
https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/
https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows
https://www.frenxt.com/case-studies/langgraph-multi-agent
https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns

# 反 chat 趋势
https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/
https://www.mmntm.net/articles/beyond-chat-interfaces
https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e
https://riffon.com/insight/ins_t5gqvpoc6vdw

# 协作式 Agentic UX
https://blog.isotopes.ai/building-a-collaborative-agentic-ux-88e3362c16c1
https://medium.com/google-cloud/improving-real-time-ux-with-a-multi-agent-architecture-lessons-from-shoppers-concierge-demo-51c466a11662
```

---

**最后更新**：项目调研整合后定稿。
