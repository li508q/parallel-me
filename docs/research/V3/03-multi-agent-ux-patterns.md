# 03 · Multi-Agent UX Patterns

> **命题**：2024-2026 多智能体编排已经形成"DefaultPattern / AutoPattern / RoundRobin / Random / Manual / Swarm"等几种范式。ParallelMe V3 的"议题驱动会议"本质是 **AutoPattern + Manual gates 的混合** —— LLM 决定哪席最尖锐，但用户必须签字。

---

## 关键结论

```
1. 多智能体 UX 已脱离"几个 bot 轮流说话"的玩具阶段
2. 核心 pattern：Orchestrator-Worker / Pipeline / Mesh / Group Chat
3. 高质量的多 agent UX 必须有 progressive disclosure（不一屏暴露所有信息）
4. 用户参与门 + 异步处理 + 透明 reasoning 是 2025 三大共识
5. ParallelMe 的"主持人范式"是当前文献中唯一明确把"用户必须主持"作为产品核心的设计
```

---

## 1 · 学术与研究

### 1.1 HUMA：人样多用户 agent
[HUMA: Humanlike Multi-user Agent (arXiv 2511.17315, 2025)](https://arxiv.org/html/2511.17315v1)

核心贡献：
- LLM 在 group chat 中的 facilitator 角色研究
- Event-driven architecture：handles messages, replies, reactions, and realistic response-time simulation
- 三组件：Router / Action Agent / Reflection
- 结论：AI facilitator 在自然异步群聊中可达"near-parity with human facilitators"

对 ParallelMe 的意义：**ParallelMe 的"书记"侧记角色其实就是一个 facilitator agent**，可借鉴 HUMA 的 Router + Reflection 架构。

### 1.2 多智能体辩论提升事实性
Du et al. 2023 · *Improving Factuality and Reasoning via Multiagent Debate*（V2 已引用）

ParallelMe V2 的"5 路并行 + cross + critic"路径直接来自这条研究。

---

## 2 · 工程框架

### 2.1 AG2 Group Chat Patterns
[Agent Orchestration: Coordinating Multiple Agents (AG2)](https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/)

5 种内置 pattern：
- **DefaultPattern**：simple, explicit handoffs
- **AutoPattern**：LLM 自动选下一发言者（基于上下文 + agent description）
- **RoundRobinPattern**：固定顺序
- **RandomPattern**：随机
- **ManualPattern**：human-in-the-loop 选下一发言者

ParallelMe 的对应：
- 立案：DefaultPattern（系统重写）
- 表态阶段：RoundRobinPattern（5 席依次）
- 质询阶段：**AutoPattern**（LLM 选最尖锐的两对）
- 用户点名：**ManualPattern**
- 裁决：DefaultPattern（NowMe 单 agent）

### 2.2 AutoGen 多智能体设计
[Designing Multi-Agent Workflows · AutoGen](https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows)

3 个 team pattern：
- **RoundRobinGroupChat**：sequential, predictable
- **SelectorGroupChat**：dynamic, LLM-driven
- **Swarm**：agent-initiated handoffs

设计建议：
- "Give agents clear, distinct roles and responsibilities"
- "Be careful with `allow_repeated_speaker=True` — can lead to infinite loops"
- "Set Reasonable Limits"（max iterations / max tokens）

### 2.3 Vercel AI SDK 5 Agent 抽象
[AI SDK 5 announcement (Vercel, 2025-07)](https://vercel.com/blog/ai-sdk-5)

提供 3 个 agentic primitive：
- `stopWhen`: 定义 tool-calling loop 何时终止
- `prepareStep`: 每步前调整 model / system prompt / tools / history
- `Agent` abstraction: 封装配置 + 执行（OOP 风格）

[AI SDK 5 Deep Dive (Sean Kim, 2025-08)](https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/)：
- "AI SDK RSC 已 paused，建议用 typed data parts"
- prepareStep 实现 escalation pattern（先用便宜模型，失败时切贵模型）

### 2.4 LangGraph 多智能体生产案例
[LangGraph Multi-Agent Case Study (FRE|Nxt, 2026-01)](https://www.frenxt.com/case-studies/langgraph-multi-agent)

InterviewLM 案例：
- 8 个 specialized agents（Coding / Interview / Evaluation / Fast Progression / Comprehensive / Question Gen / Question Eval / Supervisor）
- Hierarchical orchestrator-worker 模式
- 三层缓存策略 + IRT 算法 + 5 层 agent isolation
- 结果：cold start 8-12s → 2-3s（70% faster），token cost 40% 下降

### 2.5 LangGraph 实战工作坊
[AI-Powered Chatbot Development Case Study (Zartis, 2025-11)](https://www.zartis.com/success-stories/ai-architecture-for-multi-agent-system/)

核心建议：
- "Split complex agents into subgraphs with distinct responsibilities"
- "Implement agent handoff pattern for smooth transitions"
- "Design agents for single, testable purposes"

### 2.6 Anthropic Agent SDK 多智能体模式
[Claude Agent SDK Multi-Agent Design Patterns (2026-03)](https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns)

3 个核心 pattern：
- **Orchestrator**：central coordinator + specialist agents
- **Pipeline**：sequential stages
- **Mesh**：full network topology, message broker

ParallelMe 选择：**Orchestrator + Manual gates**。书记是 orchestrator，5 席是 specialist，用户是终极裁决者。

---

## 3 · UX 设计原则

### 3.1 Async + 实时的双层架构
[Improving Real-Time UX with a Multi-Agent Architecture (Kaz Sato, Google Cloud, 2025-04)](https://medium.com/google-cloud/improving-real-time-ux-with-a-multi-agent-architecture-lessons-from-shoppers-concierge-demo-51c466a11662)

核心洞察：
- UI Agent（轻 + 快）专门交互
- Search Agent / Tool Agent 异步背景跑
- "User gets a smooth experience without really noticing the search happening"

ParallelMe 的对应：
- 用户在会议页交互（UI Agent 体感快）
- 后台 LLM 跑 5 路并行表态（Search-style 异步）
- SSE 流式让用户感觉"声音一个个出现"

### 3.2 协作式 Agentic UX
[Building a Collaborative Agentic UX (Isotopes AI, 2026-02)](https://blog.isotopes.ai/building-a-collaborative-agentic-ux-88e3362c16c1)

4 个核心特性：
1. Multi-user sessions（团队共看分析）
2. Sessions 持久化（关闭 laptop 后还能继续）
3. Branching exploration（任意点回退试不同方向）
4. Transparent reasoning（看 agent 想了什么 / retrieve 什么 / 调谁）

进度可视化用 **hierarchical organization with progressive disclosure**：
- Stage level: Thoughts / Plan / Execution / Results
- Ask threads: 任意点提问，threaded 讨论

ParallelMe 的对应：
- 会议档案 = sessions 持久化
- 议案修订 = branching exploration
- 证据链 = transparent reasoning

---

## 4 · ParallelMe 的独有定位

### 4.1 在 5 种 pattern 中的位置

| Pattern | 谁选下一发言者 | 用户参与度 | 例子 |
|---|---|---|---|
| Default | 显式编程 | 低 | 简单 pipeline |
| Auto | LLM | 低 | AutoGen, Anthropic Agent SDK |
| RoundRobin | 固定顺序 | 低 | V2 ParallelMe（5 路并行） |
| Manual | 用户 | 高 | 通常的群聊机器人 |
| **Hybrid (Auto + Manual gates)** | **LLM 推荐 + 用户必须确认** | **极高** | **V3 ParallelMe** |
| Swarm | Agent | 中 | LangGraph swarm |

### 4.2 V3 的关键创新：4 道用户参与门

```
立案确认 → 组阁确认 → 点名追问 → 签字 / Memory Consent
```

每道门都"打断"AI 自动流程，强迫用户主持。这是当前多 agent 文献中最罕见的设计 —— 大多数产品在追求"减少用户操作"，ParallelMe 在追求"增加用户主持"。

详见 `V3-IVY-FINAL-DIRECTION.md` 第 3.3 节。

---

## 5 · 完整 URL 清单

```
https://arxiv.org/html/2511.17315v1
https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/
https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows
https://vercel.com/blog/ai-sdk-5
https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/
https://www.frenxt.com/case-studies/langgraph-multi-agent
https://www.zartis.com/success-stories/ai-architecture-for-multi-agent-system/
https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns
https://medium.com/google-cloud/improving-real-time-ux-with-a-multi-agent-architecture-lessons-from-shoppers-concierge-demo-51c466a11662
https://blog.isotopes.ai/building-a-collaborative-agentic-ux-88e3362c16c1
```
