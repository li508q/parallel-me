# 11 · Tech Stack References

> **命题**：V3 技术栈的关键决策依据。本文是 `V3-TECH-DIRECTION.md` 的引用支撑档案。
> 涉及：Vercel AI SDK 5/6 / Anthropic Agent SDK / Prompt Caching / IndexedDB + Dexie / Design Tokens + Tailwind v4。

---

## 1 · Vercel AI SDK 5/6

### 1.1 关键发布
- [AI SDK 5 announcement (Vercel, 2025-07-31)](https://vercel.com/blog/ai-sdk-5)
- [AI SDK 6 Beta announcement](https://v5.ai-sdk.dev/docs/announcing-ai-sdk-6-beta)
- [AI SDK 5 docs · Agents](https://ai-sdk.dev/v5/docs/agents)
- [AI SDK RSC · Streaming React Components](https://ai-sdk.dev/v5/docs/ai-sdk-rsc/streaming-react-components)

### 1.2 核心能力（V3 可能用到的）

#### Agentic Loop Control
> "AI SDK 5 introduces three features for building agents:
> - **stopWhen**: Define when a tool-calling loop is stopped.
> - **prepareStep**: Adjust the parameters for each step
> - **Agent Abstraction**: Use generateText and streamText with predefined settings"

#### Typed Data Parts
[AI SDK 5 Deep Dive (Sean Kim)](https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/)
> "The AI SDK RSC package — which let you stream React Server Components directly from LLM responses — is still marked experimental, and **development is officially paused**. Vercel recommends migrating to AI SDK UI for production."

> "AI SDK 5's answer is the **UIMessage/ModelMessage separation**. Instead of streaming React components, you stream typed data parts and render them on the client."

V3 应用：
- ParallelMe 的 SSE event schema 直接对应 typed data parts
- 不使用 RSC streaming（已 paused）
- 客户端用 React 18 + state 渲染

#### prepareStep Pattern
> "prepareStep runs before each iteration, letting you adjust the model, system prompt, available tools, and message history dynamically. This enables patterns like **escalation** (switch to a more powerful model if the first attempt fails)."

V3 应用（Post-MVP）：
- DeepSeek 失败 → escalation 到 Anthropic Sonnet
- 临时席生成失败 → 退化到模板

### 1.3 V3 选型决策

```
✓ 借用：streamText + AbortController（取代手写 fetch SSE）
✓ 借用：typed data parts schema（统一客户端事件结构）
✗ 不借用：Agent class abstraction（自写状态机更适合 ParallelMe）
✗ 不借用：RSC streaming（已 paused）
✗ 不借用：prepareStep（V3 MVP 不需要 escalation）
```

### 1.4 部署
- [AI Agents on Vercel guide](https://examples.vercel.com/guides/ai-agents)
- Fluid Compute 适合长 SSE / agentic 流式
- Edge Runtime 适合轻量 endpoint（如 `/api/provider/test`）

---

## 2 · Anthropic Agent SDK

### 2.1 关键资料
- [Agent SDK reference · TypeScript](https://docs.anthropic.com/en/api/agent-sdk/typescript)
- [Claude Agent SDK Multi-Agent Design Patterns (Claude Lab, 2026-03)](https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns)
- [Claude Agent SDK in TypeScript (Code With Seb, 2026-04)](https://www.codewithseb.com/blog/claude-agent-sdk-typescript-production-guide)
- [Claude Agent SDK Guide (ClaudeGuide, 2026-04)](https://claudeguide.io/claude-agent-sdk-guide)

### 2.2 核心
> "The Claude Agent SDK gives you the same tools that power Claude Code — Read, Write, Bash, Grep, WebSearch — programmable in TypeScript."

> "Same agentic loop — the model decides which tools to call, processes results, and iterates until the task is done."

### 2.3 与 Managed Agents 对比

| | Agent SDK | Managed Agents |
|---|---|---|
| Runs in | Your process | Anthropic infra |
| Interface | TS/Python library | REST API |
| Session state | JSONL on filesystem | Hosted event log |
| Best for | Local prototyping, filesystem ops | Production w/o infra |

### 2.4 V3 选型决策

```
✗ 不主用 Anthropic Agent SDK：
  - V3 需要 multi-provider（DeepSeek / OpenAI / Anthropic / Ollama），不能强绑定 Anthropic
  - ParallelMe 的"会议状态机"是产品独特性，不应被通用 agent loop 抽象
✓ Post-MVP 局部用：
  - 如果切到 Anthropic provider，可启用 Anthropic SDK 的 prompt caching native API
```

---

## 3 · Anthropic Prompt Caching

### 3.1 官方文档
[Prompt Caching · Claude API Docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

### 3.2 核心规则

| 项目 | 值 |
|---|---|
| 默认 TTL | 5 分钟 |
| 可选 TTL | 1 小时（额外成本） |
| 最大 cache breakpoints | 4 / 请求 |
| 最小 cached block | 1024 tokens（Sonnet 4.5 及以前），2048（Sonnet 4.6），4096（Opus 4.6 / Haiku 4.5） |
| 缓存读价格 | base × 0.1（90% off） |
| 缓存写价格 | base × 1.25（5min）/ × 2（1hr） |

### 3.3 实施模式
[Prompt Caching for AI Agents Architecture (Zylos Research, 2026-02)](https://zylos.ai/research/2026-02-24-prompt-caching-ai-agents-architecture)

> "Anthropic requires developers to **explicitly mark cache breakpoints** using `cache_control`. The API accepts up to 4 cache breakpoints per request."

实战收益：
> "Cost: Cached input tokens are billed at 10% of standard input token price (90% reduction). Latency: Up to 85% reduction for long prompts; a 100K-token prompt that previously took 11.5s drops to ~2.4s."

最佳实践：
1. **Static-first 结构**：system prompt → tool definitions → history → user message
2. **Freeze tool definitions canonically** at startup
3. **Exclude dynamic tool results** from cache breakpoints
4. **Layer cache prefixes** in multi-tenant systems（global → user-class → per-user → conversation）
5. **Measure cache hit rate** in observability

### 3.4 设计实战
[Designing for Prompt Cache Hits (Token Optimize)](https://www.tokenoptimize.dev/guides/designing-for-prompt-cache-hits)

| Provider | 折扣 | 写溢价 | TTL |
|---|---|---|---|
| **Anthropic** | 90% (0.1x) | 1.25x (5min) / 2x (1h) | 5min / 1h |
| **OpenAI** | 50% (0.5x) — 90% on GPT-5.4 | None | 5-10 min |
| **Google Gemini** | 90% (Gemini 2.5+) / 75% (2.0) | Storage cost | Configurable |

> "Anthropic now supports **automatic caching for multi-turn conversations**. Instead of manually placing `cache_control` markers on individual content blocks, you add a single `cache_control` field at the top level."

### 3.5 跨产品对比
[Prompt Caching for Anthropic and OpenAI Models (DigitalOcean, 2026-04)](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)

> "By organizing prompts into static cached prefixes and dynamic request components, developers can reduce token costs by roughly **70-90% in many real-world applications**."

### 3.6 长期视角
[Anthropic Prompt Caching in 2026 (AI Checker Hub, 2026-03)](https://aicheckerhub.com/anthropic-prompt-caching-2026-cost-latency-guide)

> "Teams that structure prompts carefully and measure real cache reuse will get meaningful savings and lower latency. Teams that mark unstable prefixes and assume the feature will fix itself will mostly buy extra write cost and extra confusion."

### 3.7 V3 应用

详见 `V3-TECH-DIRECTION.md` 第 6 节。要点：
- 仅在 Anthropic provider 时启用
- 5 默认席 system prompt（~6000 字符）→ 5min TTL
- Cabinet brief（用户阁状态，~1500 字符）→ 1h TTL
- 工具定义、JSON schema → 5min TTL
- 临时席、用户输入、点名 → 不缓存
- DeepSeek / OpenAI 暂无 cache_control，但抽象层预留字段

---

## 4 · 本地优先存储（IndexedDB / Dexie / RxDB）

### 4.1 浏览器存储 landscape
[LocalStorage vs IndexedDB vs Cookies vs OPFS vs WASM-SQLite (RxDB, 2026-03)](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html)

| 技术 | 容量 | API | 索引 | 适合 |
|---|---|---|---|---|
| Cookies | 4KB | sync | No | session ID |
| LocalStorage | ~5MB | sync | No | UI 偏好 / 小 state |
| IndexedDB | GB 级 | async | Yes | 结构化大量数据 |
| OPFS | GB 级 | async | No (default) | 文件 / blob |
| WASM SQLite | GB 级 | async | Yes (full SQL) | 强一致 / 复杂查询 |

> "Use IndexedDB for handling complex structured data, large document collections, binary blobs, and scenarios where asynchronous operations and indexing are mandatory."

### 4.2 IndexedDB 库选型

[Best library for IndexedDB (Paul Maneesilasan)](https://www.paultman.com/posts/best-library-for-indexeddb-localforage-idb-keyval-or-idb/)

[Which IndexedDB Library Should I Use (BSWEN, 2026-04)](https://docs.bswen.com/blog/2026-04-07-indexeddb-libraries-dexie-idb-rxdb/)

| 库 | Bundle (gzipped) | 特性 | 适合 |
|---|---|---|---|
| **idb-keyval** | 1.1KB | 仅 key-value | 简单 KV |
| **idb (Jake Archibald)** | 1.1KB | 完整 IDB API + Promise | 自由控制 |
| **Dexie** | 14KB | declarative + live queries + TS | **大多数应用** |
| **RxDB** | 62KB | reactive + sync + CRDT | offline-first + sync |

决策树：
```
1. Need real-time sync / offline-first?  YES → RxDB
2. Need complex queries (range, compound, full-text)?  YES → Dexie
3. Migrating existing IndexedDB code?  YES → idb
4. Bundle size critical (<5KB)?  YES → idb-keyval
5. Default → Dexie
```

### 4.3 Dexie 详细
[Dexie 5.0 Roadmap](https://dexie.org/docs/roadmap/dexie5.0)

特点：
- "Promise-based"
- "Declarative schema"
- "Transactions"
- "Live queries" ← 自动驱动 React UI
- "Excellent TypeScript support"
- "Works around various flaws and bugs in IndexedDB implementations"

> "Dexie is widely used... ChatGPT, WhatsApp Web, Facebook Messenger, GitHub Desktop, Flightradar24, Microsoft To Do, Walmart and many other products load and use Dexie.js."

[Dexie Cloud · when to use](https://rxdb.info/sem/indexeddb-database)

V3 决策：
- **MVP：Dexie + dexie-react-hooks**
- **Post-MVP：可选 Dexie Cloud 或自管 Supabase 同步**

---

## 5 · Design Tokens 架构

### 5.1 Three-Tier vs Two-Tier
[Building a Design Token System That Scales (Tyler McDaniel, 2026-03)](https://www.tostupidtooquit.com/blog/building-design-token-system)

> "The pattern that scales is three tiers. I didn't invent this — Salesforce Lightning, Adobe Spectrum, and most mature systems converge on it:
> - **Tier 1: Primitive tokens** (raw values)
> - **Tier 2: Semantic tokens** (aliases, intent-named)
> - **Tier 3: Component tokens** (scoped)"

> "**For most teams, two tiers are enough.** The third tier adds governance overhead. Only add it when you have multiple teams consuming your tokens."

V3 决策：**两层即可**（primitive + semantic）。ParallelMe 是单 codebase，没必要引入 component token 层。

### 5.2 Tailwind v4 集成
[Tailwind v4 design tokens (Innatus Digital, 2026-03)](https://innatus.digital/digital-insights/our-tailwind-v4-design-system-and-how-we-handle-brand-tokens)

> "Tailwind v4 changed how configuration works. **No more tailwind.config.js.** Everything lives in CSS now, inside the @theme directive."

> "This is a good change. Your design tokens sit next to the styles that use them. One file, one source of truth."

V3 应用：见 `V3-TECH-DIRECTION.md` 第 8.3 节，所有 token 定义在 `app/globals.css` 的 `@theme` 块。

### 5.3 多源交叉
- [Design Tokens · Building Consistent Systems (Bootspring, 2026-02)](https://www.bootspring.com/blog/design-tokens-system-guide)
- [Tailwind Design Tokens 2025 (Nicola Lazzari)](https://nicolalazzari.ai/articles/integrating-design-tokens-with-tailwind-css)
- [Themed Design System with Tailwind + CSS variables (Andriy Vl, 2025-07)](https://medium.com/@andriy.vl/building-a-themed-design-system-with-tailwind-and-css-variables-for-react-and-next-js-apps-2df0ff783440)

共识：
- Primitive → Semantic → (optional) Component 三层
- Style Dictionary 是跨平台同步工具（V3 单平台不需要）
- CSS variables 是 runtime token 的最佳载体
- Theme switching = CSS variable swap，不是 stylesheet 重写

V3 应用：
```
lib/design/tokens/         ← Tier 1 + 2 in TS
app/globals.css            ← Tailwind v4 @theme 引用 token
```

---

## 6 · V3 技术决策最终回放

参考 `V3-TECH-DIRECTION.md` 第 13 节：

```
✓ Next.js 14 + React 18 + TS 5
✓ Tailwind v4 + CSS variables (no tailwind.config.js)
✓ Dexie (IndexedDB)
✓ 自写 SSE 状态机 + Vercel AI SDK 5 streamText (局部)
✓ OpenAI-compatible 主路径 + Anthropic 选配 (启用 prompt caching)
✓ 演员模式 SSE schema 与真实模式完全一致
✓ Token 两层架构
✓ Vercel Fluid Compute (Node runtime for /api/parallel/*)
✓ Geist (next/font) + CJK 系统字体回退
```

---

## 7 · 完整 URL 清单

### Vercel AI SDK
```
https://vercel.com/blog/ai-sdk-5
https://v5.ai-sdk.dev/docs/announcing-ai-sdk-6-beta
https://ai-sdk.dev/v5/docs/agents
https://ai-sdk.dev/v5/docs/ai-sdk-rsc/streaming-react-components
https://blog.imseankim.com/vercel-ai-sdk-5-streaming-tool-calls-rsc-agentic-architecture/
https://examples.vercel.com/guides/ai-agents
```

### Anthropic Agent SDK & Prompt Caching
```
https://docs.anthropic.com/en/api/agent-sdk/typescript
https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
https://claudelab.net/en/articles/api-sdk/agent-sdk-multi-agent-design-patterns
https://www.codewithseb.com/blog/claude-agent-sdk-typescript-production-guide
https://claudeguide.io/claude-agent-sdk-guide
https://zylos.ai/research/2026-02-24-prompt-caching-ai-agents-architecture
https://www.tokenoptimize.dev/guides/designing-for-prompt-cache-hits
https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean
https://aicheckerhub.com/anthropic-prompt-caching-2026-cost-latency-guide
```

### IndexedDB / Dexie
```
https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html
https://www.paultman.com/posts/best-library-for-indexeddb-localforage-idb-keyval-or-idb/
https://docs.bswen.com/blog/2026-04-07-indexeddb-libraries-dexie-idb-rxdb/
https://dexie.org/docs/roadmap/dexie5.0
https://rxdb.info/sem/indexeddb-database
https://rxdb.info/rx-storage.html
```

### Design Tokens
```
https://www.tostupidtooquit.com/blog/building-design-token-system
https://innatus.digital/digital-insights/our-tailwind-v4-design-system-and-how-we-handle-brand-tokens
https://www.bootspring.com/blog/design-tokens-system-guide
https://nicolalazzari.ai/articles/integrating-design-tokens-with-tailwind-css
https://medium.com/@andriy.vl/building-a-themed-design-system-with-tailwind-and-css-variables-for-react-and-next-js-apps-2df0ff783440
```
