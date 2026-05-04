# 09 · Post-Chat AI UX

> **命题**：单一 chat 框是 2024 主流但 **不是 UI 范式 —— 只是当时仓促 ship 的形态**。2025-2026 顶级 AI 产品全面迁移到 sidecar / canvas / generative UI / scoped surface。ParallelMe V3 的"议案纸 + 席位牌 + 阶段轨 + 决议纸 + 档案"本质是 sidecar + canvas 混合，**走在 2026 趋势的前面**。

---

## 关键结论

```
1. 单 chat 框只是 ship 出来的，不是被设计出的范式
2. 2024 一年内 7 次 GUI retrofit：GPT Store / Voice / Artifacts / Projects / Canvas / Computer Use / Deep Research
3. Post-chat AI UX 范式：generative UI / sidecar / canvas / scoped surface / agent observability
4. Canvas paradigm 比 chat 在多 agent / 协作 / 复杂任务上全面胜出
5. ParallelMe V3 是当前少数明确把"对象操作"作为产品本体的 AI 应用
```

---

## 1 · 反 chat 战略命题

### 1.1 The chat box isn't a UI paradigm
[The chat box isn't a UI paradigm. It's what shipped. (DesignersForest)](https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/)

> "**2024 is the year every major AI lab shipped GUI additions on top of the chat box.** Seven retrofits in twelve months, across three labs."

时间线：
| 时间 | 实验室 | 产品 | 形态 |
|---|---|---|---|
| 2024-01 | OpenAI | GPT Store | tile-based catalog |
| 2024-05 | OpenAI | GPT-4o Voice | 语音、打破 send-and-scrollback |
| 2024-06 | Anthropic | Artifacts | side panel, code/document |
| 2024-06 | Anthropic | Projects | persistent workspace |
| 2024-10 | OpenAI | Canvas | split-screen document editor |
| 2024-10 | Anthropic | Computer Use | agent 操作真实桌面 |
| 2024-12 | Google | Deep Research | multi-step agent + visible plan |

> "**Each of these is a GUI pattern borrowed back from the interface the chat box replaced.**"

### 1.2 Post-chat 5 大要素

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

---

## 2 · Beyond Chat：3 种 post-chat 范式

[Beyond Chat: The Interface Revolution for AI Agents (MMNTM Research, 2025-12)](https://www.mmntm.net/articles/beyond-chat-interfaces)

### 2.1 Generative UI
> "The model returns interactive components — a chart for data, a form for inputs, a diff view for changes — rather than forcing everything into text bubbles. The technical foundation is streaming React components from server to client, pioneered by the Vercel AI SDK."

代表：
- v0 (Vercel)：AI 生成 component code
- Vercel AI SDK 5：typed data parts streaming

### 2.2 The Sidecar Pattern
> "Split-pane interface: chat on the left, 'living object' on the right. The artifact persists rather than scrolling away. **Users shift from asking for output to collaborating on a versioned document.**"

代表：
- Claude Artifacts
- OpenAI Canvas
- Cursor Composer

ParallelMe V3 对应：会议主屏 = sidecar paradigm。议案纸是 living object，不是 chat history 中的临时消息。

### 2.3 Spatial Canvas / Node Graph
> "In platforms like n8n, Zapier Central, and LangGraph, users don't chat with agents daily. They design them on node-based canvases, monitor execution logs, and intervene only when confidence drops below threshold."

> "**This enables asynchronous scale: one human managing fifty agents handling five thousand tasks.**"

ParallelMe V3 对应：席位关系图（Post-MVP）= 简化版 spatial canvas。用户能"看见"自己的内在席位关系结构。

### 2.4 Invisible AI（终极态）
> "The ultimate post-chat interface is no interface at all. **Invisible AI operates below the threshold of awareness** — optimizing supply chains, routing tickets, patching code."

> "AI is dissolving into applications themselves."

ParallelMe 不走这条 —— 因为对内在反思来说，**仪式感是产品资产**，不是消除项。

---

## 3 · UX Collective：Where should AI sit in your UI?

[Where should AI sit in your UI? (Sharang Sharma, 2025-06)](https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e)

5 种 spatial layout：

| Layout | 例 | AI 角色 |
|---|---|---|
| Chatbot | ChatGPT default | 主角，全部 |
| Side panel | GitHub Copilot Chat | 助手 |
| Inline | Notion AI / Cursor 内联 | 微 augment |
| Semantic spreadsheet | Causal, Bardeen | 数据 augment |
| **Infinite canvas** | TLDraw, Figma, Miro | **Creative collaborator** |

关键判断：
> "**Spatial layouts aren't aesthetic choices. They define the mental model users form about the AI's role.**"

> "Multiple parallel LLM calls can coexist across the canvas. AI acts as a 'creative collaborator', responding to spatial context rather than linear flow."

ParallelMe V3 对应：**桌面端三栏布局**（左 Rail / 中 Stage / 右 Context）+ **会议进行页的圆桌布局**（5 席围绕中央议题）—— 是 spatial canvas 的 IFS 版本。

---

## 4 · Canvas vs Chat：协作场景对比

[The Future of AI UX is Co-Creation on a Canvas (RiffOn)](https://riffon.com/insight/ins_t5gqvpoc6vdw)

> "**Chatbots are fundamentally linear, which is ill-suited for complex tasks** like planning a trip. The next generation of AI products will use AI as a co-creation tool within a more flexible canvas-like interface."

> "Current text-based prompting for AI is a primitive, temporary phase, similar to MS-DOS."

> "While chat works for human-AI interaction, the **infinite canvas is a superior paradigm for multi-agent and human-AI collaboration**. It allows for simultaneous, non-distracting parallel work, asynchronous handoffs, and persistent spatial context."

> "AI should be a collaborative partner that augments human capacity. **A successful AI product leaves room for user participation, making them feel like they are co-building the experience.**"

ParallelMe 对应：
- 4 道参与门 = 强制 user participation
- 议案纸可编辑 = co-building
- 会议档案是 versioned document = persistent spatial context

---

## 5 · 工程实践

### 5.1 PRD 案例：Canvas-based workspace
[Widget-Ready Chatbot Workspace (Automatos AI, PRD)](https://docs.automatos.app/automatos-ai-docs/design-docs/prds/38.1-widget-ready-chatbot-workspace)

> "Transform the current chatbot interface from a modal-based artifact viewer into a **canvas-based workspace** where widgets persist, can be arranged, and remain accessible throughout the conversation."

架构：
- WorkspaceContainer
  - ChatPanel (MessageList)
  - Canvas (CanvasGrid + WidgetWrapper[])
  - Canvas Controls (LayoutToggle)

ParallelMe V3 对应：会议主屏的"中央议案纸 + 周边席位牌"是简化版 canvas workspace。

### 5.2 Vercel AI SDK 5 的 typed data parts
[AI SDK 5 Deep Dive (Sean Kim, 2025-08)](https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/)

> "AI SDK 5's answer is the UIMessage/ModelMessage separation. Instead of streaming React components, you stream typed data parts and render them on the client. **The server sends structured data; the client decides how to display it.**"

ParallelMe V3 对应：SSE event 走 typed data parts schema：
```ts
type SseEvent =
  | { type: "self", id: SeatId, name: string, text: string }
  | { type: "cross", fromId: SeatId, toId: SeatId, text: string }
  | { type: "verdict", text: string, evidenceIds: string[] }
  | { type: "memory_proposal", proposals: MemoryCandidate[] }
  | { type: "done" }
  ;
```

---

## 6 · ParallelMe V3 的反 chat 资产

V3 已经走在 post-chat 趋势的前面。把它做成战略资产：

### 6.1 产品级反 chat
- 主输入不是"chat 框"，是"议题立案纸"
- 会议过程是阶段轨而非 message stream
- 输出是议案纸 / 决议纸 / 签字条 / 会议档案 —— 全部是 first-class object
- 历史不是 chat history，是会议档案库 + 阁

### 6.2 工程级反 chat
- 全部 UI object 可 deep-link：`/cabinet`, `/issue/:id`, `/meeting/:id`, `/seat/:id`
- 全部 AI 输出走 typed event schema，不是 raw text stream
- 客户端写 IndexedDB，不是 chat history append

### 6.3 商业级反 chat
- 对外宣发口径："不是 AI 替你想清楚，而是 AI 帮你召集你自己"
- 永远不说 "ParallelMe 是 chatbot"
- 永远不说 "对话型 AI"
- 始终说："对象系统 / 内阁会议 / 议题驱动"

详见 `V3-IVY-FINAL-DIRECTION.md` 第 3.1 节。

---

## 7 · 完整 URL 清单

```
https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/
https://www.mmntm.net/articles/beyond-chat-interfaces
https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e
https://riffon.com/insight/ins_t5gqvpoc6vdw
https://docs.automatos.app/automatos-ai-docs/design-docs/prds/38.1-widget-ready-chatbot-workspace
https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/
```
