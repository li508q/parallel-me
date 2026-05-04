<div align="center">

# 🪞 平行的我 · ParallelMe

### 你不是一个人，你是好几个。

你说一句正在纠结的事 ——
5 个平行宇宙的你**并行展开** → **互相戳穿** → 「此刻的我」**做出选择**。

[![Built for 傅盛 AI 战队 × EasyClaw Link](https://img.shields.io/badge/Built_for-%E5%82%85%E7%9B%9B_AI_%E6%88%98%E9%98%9F_%C3%97_EasyClaw_Link-D4A8FF?style=for-the-badge)](https://easyclaw.link/zh/hackathon)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)

[**线上 Demo**](#) · [**架构**](#-architecture) · [**给 AI 评委**](#-给-ai-评委-evaluator-quickstart) · [**设计哲学**](#-设计哲学)

</div>

---

## 📑 Table of Contents

1. [产品（Why this exists）](#-产品why-this-exists)
2. [V2 三大支柱（What's new）](#-v2-三大支柱)
3. [Architecture](#-architecture)
4. [Quickstart](#-quickstart)
5. [Project Structure](#-project-structure)
6. [API Reference](#-api-reference)
7. [给 AI 评委 / Evaluator Quickstart](#-给-ai-评委-evaluator-quickstart)
8. [设计哲学](#-设计哲学)
9. [Roadmap](#-roadmap)
10. [Credits & License](#-credits)

---

## 🎯 产品（Why this exists）

当代年轻人的最深痛点不是"没选择"，是 **「45 度人生」—— 卷不动也躺不平，选项太多每个都不甘心**。

最高频的心声是：「**我该不该…**」
> 该不该考公 · 该不该裸辞 · 该不该分手 · 该不该回老家 · 该不该接亲戚饭局

单 agent 的回答永远是温柔无害的"中位数建议"——听起来都对，关掉就忘。
**人在纠结时真正需要的不是答案，是看见几种极端价值观吵架，然后自己做判断。**

ParallelMe 把这件事做成了产品 —— **你内心的 5 个声音，第一次被允许同时讲话。**

### 五个分身

| 分身 | IFS 部分 | 信念 | 它最怕 |
| --- | --- | --- | --- |
| 🛋️ **躺平的我** | Manager · 预防型保护者 | 卷不动就是不卷的信号 | 你被工作吃掉 |
| 💰 **搞钱的我** | Manager · 现实型保护者 | 现金流面前，所有问题都是数学题 | 你天真到饿肚子 |
| ✈️ **出走的我** | Firefighter · 应急保护者 | 走不出去的不是路，是你给自己设的画地牢 | 你被这间屋子困死 |
| 🥟 **讨妈欢心的我** | Exile · 被流放的内在小孩 | 你妈不是不懂你，她只是怕 | 你飞走了她睡不着 |
| 🔮 **5 年后的我** | Self · 远观视角 | 你现在拼命纠结的事，5 年后大半我都不记得了 | 你被此刻吞掉 |
| 🪞 **此刻的我** | **Self · 决断者** | 不是平均，不是中庸，是属于此刻的清明 | 永远逃避选择 |

> 5 个分身一一映射到 [**Internal Family Systems**](https://ifs-institute.com/) 的 part 类型——这不是装饰，是人格稳定性的物理保险。

---

## ⚙️ V2 三大支柱

V1 是"5 个分身轮流说话"。V2 是 **"5 个分身真的有灵魂、记得你、并且产出仪式感"**。

### Pillar Ⅰ · 让每个 inner voice 真有灵魂

| 升级 | 做法 | 原始来源 |
| --- | --- | --- |
| **双层 persona card** | TOP（IFS 身份 + 核心价值 + 害怕的事 + 口头禅）+ BOTTOM（drift guard 反讨好夹击） | Anthropic Multi-Agent Research |
| **GAN 式 Harness** | NowMe 输出 → Critic agent 找中庸/讨好/逃避 → NowMe 重写一次 | Anthropic *Effective Context Engineering* |
| **动态 cross-examine** | 不再硬编码 pair；用 LLM 跑一次 5×5 对立矩阵，每次挑最尖锐的两对辩论 | AutoGen GroupChat dynamic speaker selection |
| **反讨好 drift guard** | 每个分身底部强制：*"你不是助手，是声音；同意了对方你就消失了"* | system prompt leaks (Cursor / Claude Code) |
| **NowMe 反中庸** | 禁用「平衡 / 兼顾 / 都很重要 / 综合考虑」；写出立即作废重写。提供「我在逃避」逃生口 | Esther Perel · *"the courage to disappoint"* |
| **强制口头禅 + 禁忌词** | 每个分身有 4-5 个 catchphrase 必出现 1 个 + 4-5 个 taboo 一个不准出 | 最便宜也最有效的 anti-drift 手段 |

> 完整实现见 [`lib/selves.ts`](./lib/selves.ts)（人格卡 · 232 行）和 [`lib/llm.ts`](./lib/llm.ts)（harness · 575 行）。**完全公开，欢迎 fork & 改写。**

### Pillar Ⅱ · 让系统拥有「me」

让分身从"通用 Bot"变成**只属于你**的镜子。三层结构、零基建、私密：

```
L1  Working memory      当前会话 KV (24h TTL)         上下文连续
L2  Episodic memory     事件卡 (importance gated)     "你上次说要……做了吗？"
L3  Reflective memory   跨会话归纳                    "你总是在 9 月份焦虑"
```

外加两个**专属于你**的人格输入源：

- **`me.md` 自填画像** —— 灵感来自 CLAUDE.md / AGENTS.md（给 AI 看的项目文档），但**面向用户自填"我是谁"**：昵称、城市、人生阶段、最近在意的事、最在回避的话题、身边的人、不能踩的红线。
- **Taste 三色板** —— 上传 3 本书 / 3 部电影 / 3 首歌（标题 + 一句"为什么对你有意义"），LLM 跑一次 fact extraction 抽出 **14 字内的人格判词** + 主题 + 情绪。例如真实输入"三体 + 百年孤独 + 让子弹飞" → *"在宿命里打滚却想掀翻桌子的人"*。

> 完整实现见 [`lib/profile.ts`](./lib/profile.ts) · [`lib/memory.ts`](./lib/memory.ts) · [`app/api/taste/route.ts`](./app/api/taste/route.ts)。
> 数据存 `localStorage`——**永不上传服务器**，关掉浏览器就消失，符合"内心独白"的本体论。

### Pillar Ⅲ · 让人愿意第二次打开

工具死于第二次打开率。所以 ParallelMe 不是工具，是**纸面上的咨询室**：

- **底片 / 纸页 / 底色** —— 替代了"个人主页 / 历史 / 设置"等工具语，全产品没有一个"工具感"的词
- **Callback 开场** —— 第二次回来永远引用上次对话的**一个具体细节**（不是"欢迎回来"），范式来自 Pi.ai
- **Wrapped 式报告页**（开发中）—— 7 帧故事流，第 4 帧专门讲"你今天回避的那个分身"，制造好奇 + 分享驱动
- **零打扰原则** —— 永远不发 push，但永远有"今天的那张纸"等着，灵感来自 Apple Journal · Finch · Stoic
- **时间感知文案** —— 凌晨进站、晨间进站、深夜进站，开场文案不一样

> 完整设计见 [`docs/design/DESIGN-V2.md`](./docs/design/DESIGN-V2.md)（产品宪法）。

---

## 🏗️ Architecture

```
                ┌──────────────────────────────────────────┐
   user input   │  "我妈让我考公，我月薪 2.5w，纠结半年了"  │
                └──────────────┬───────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  ContextBundle    │   ← me.md + taste profile + last episode
                    │  (optional)       │
                    └─────────┬─────────┘
                              │
       ┌──────┬──────┬────────┼────────┬──────┐    Round 1 · 5 路并行
       ▼      ▼      ▼        ▼        ▼
     [lay]  [money] [roam]  [filial] [future]                  ← Promise.all
       │      │      │        │        │                       ← SSE stream out
       └──────┴──┬───┴────────┴────────┘
                 │
                 ▼
          ┌──────────────────┐
          │ pickOpposingPairs │ ← LLM 选最尖锐的 2 对                Round 2 · 动态 cross-examine
          └────────┬──────────┘
                   ▼
           pair_A.from ⇄ pair_A.to
           pair_B.from ⇄ pair_B.to        ← 互相戳穿，40 字内一句反问
                   │
                   ▼
          ┌─────────────────────┐
          │  findLoudest()      │  ← 长度+关键词强度+金句标记打分    "今天最响的声音"
          └────────┬────────────┘
                   ▼
        ┌─────────────────────────────┐
        │ callNowMeWithCritic()       │   Round 3 · GAN 收束
        │  ┌───────────────────────┐  │
        │  │ NowMe 输出 v1          │  │
        │  │   ↓                    │  │
        │  │ Critic 挑刺 (中庸/讨好) │  │
        │  │   ↓                    │  │
        │  │ NowMe 重写 v2          │  │← 禁用「平衡/兼顾」, 留「我在逃避」逃生口
        │  └───────────────────────┘  │
        └────────┬────────────────────┘
                 ▼
        ┌─────────────────────┐
        │  psychInsight()     │  ← IFS 视角心理学解读
        └────────┬────────────┘
                 ▼
        ┌─────────────────────┐
        │  extractEpisode()   │  ← 异步落 L2 事件卡（importance > θ）
        └─────────────────────┘
                 │
                 ▼
              SSE done
```

整条链路全程 **Server-Sent Events 流式**——分身一个一个出现，体感像真在听内心对话。

### V3 Design & Architecture (开发前定稿)

V3 正在从「五声 demo」升级为「可管理、可调用、有记忆的内在组阁系统」。**冲突时以 [`V3-IVY-FINAL-DIRECTION.md`](./docs/design/V3-IVY-FINAL-DIRECTION.md) 为准**。

**上层宪法（Source of Truth）**

- [`V3-IVY-FINAL-DIRECTION.md`](./docs/design/V3-IVY-FINAL-DIRECTION.md) — V3 上层宪法：5 锁定决策、七条军规、视觉/产品/字体最终判决、路线图
- [`V3-TECH-DIRECTION.md`](./docs/design/V3-TECH-DIRECTION.md) — V3 技术 ADR：Dexie / Vercel AI SDK 5 / Anthropic prompt caching / Tailwind v4 design tokens / SSE 状态机

**产品宪法 + 技术架构**

- [`DESIGN-V3-CABINET.md`](./docs/design/DESIGN-V3-CABINET.md) — V3 产品宪法：阁、席位、议题、会议、档案
- [`V3-LOCAL-FIRST-TECH-ARCH.md`](./docs/design/V3-LOCAL-FIRST-TECH-ARCH.md) — 本地优先架构：API Key 引导、本地工作区、记忆、账号路线

**视觉与交互详细规范**

- [`V3-COLOR-DESIGN-GUIDE.md`](./docs/design/V3-COLOR-DESIGN-GUIDE.md) — 色彩规范（已被 IVY-FINAL § 2.1 修订）
- [`V3-IA-DESIGN-GUIDE.md`](./docs/design/V3-IA-DESIGN-GUIDE.md) — 信息架构（席位为横切对象）
- [`V3-INTERACTION-DESIGN-GUIDE.md`](./docs/design/V3-INTERACTION-DESIGN-GUIDE.md) — 交互流（4 道用户参与门 + off-ramp）
- [`DESIGN-V3-UI-INTERACTION.md`](./docs/design/DESIGN-V3-UI-INTERACTION.md) — UI 美学方案与交互逻辑
- [`DESIGN-V3-RESEARCH-REFINEMENT.md`](./docs/design/DESIGN-V3-RESEARCH-REFINEMENT.md) — 色彩与交互研究修订案（已被 IVY-FINAL 收束）
- [`V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md`](./docs/design/V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md) — 开发前专家审查（已被 IVY-FINAL 收束）

**竞品全景**

- [`V3-COMPETITIVE-LANDSCAPE.md`](./docs/competitive/V3-COMPETITIVE-LANDSCAPE.md) — IFS 类 / AI 陪伴 / 心理健康 / 设计参考四层竞品 + ParallelMe 差异化矩阵

**调研档案库**

- [`docs/research/V3/README.md`](./docs/research/V3/README.md) — 调研档案索引
- 11 个分类档案：Apple Liquid Glass · Material 3 Expressive · 多智能体 UX · AI 陪伴留存 · 心理健康 AI 安全 · 色彩趋势 2026 · 字体趋势 2026 · Linear/Things 设计哲学 · 反 chat / canvas · IFS 数字化竞品 · 技术栈参考

---

## 🚀 Quickstart

```bash
# 1. clone
git clone https://github.com/li508q/parallel-me parallelme
cd parallelme

# 2. install
npm install

# 3. configure（任选其一）
cp .env.example .env.local

# Option A · 真实 LLM（推荐 DeepSeek，便宜、中文好、不卡）
echo "OPENAI_BASE_URL=https://api.deepseek.com/v1" >> .env.local
echo "OPENAI_API_KEY=sk-xxx"                       >> .env.local
echo "OPENAI_MODEL=deepseek-chat"                  >> .env.local

# Option B · 演员模式（无 API key 也能跑，离线 mock 数据）
# 不配置任何环境变量即可，自动 fallback

# 4. run
npm run dev
# → http://localhost:3000
```

兼容任何 OpenAI-compatible endpoint：OpenAI · DeepSeek · Moonshot · 智谱 · Together · Groq · 本地 Ollama。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建（14 routes，build 时间 ~30s） |
| `npm start` | 生产启动 |

---

## 📂 Project Structure

```
parallelme/
├── app/
│   ├── page.tsx                 # 主入口：沉浸辩论体验（SSE 客户端）
│   ├── about/                   # 关于页
│   ├── me/
│   │   ├── page.tsx             # 「底片」—— 你的 me.md 主页
│   │   ├── edit/                # 编辑 me.md（昵称/城市/红线/在意的事）
│   │   ├── taste/               # 「底色」—— 上传 3×3 书影乐
│   │   ├── pages/               # 「纸页」—— 历次对话的事件卡集
│   │   └── insights/            # 跨会话 L3 反思洞见
│   └── api/
│       ├── parallel/            # ★ 核心 SSE 流：5 路并行 + cross + NowMe + critic
│       ├── taste/               # 抽 14 字人格判词
│       ├── followup/            # 上次承诺的事 · 你做了吗
│       ├── share/               # 生成可分享的纸页
│       └── agent/               # A2A 元数据（给 AI 评委）
├── lib/
│   ├── selves.ts                # 人格层 · IFS 双层 persona card（公开可读）
│   ├── llm.ts                   # Harness 层 · GAN + 动态 pair + meta-critic
│   ├── profile.ts               # me.md + taste 数据契约 + localStorage
│   └── memory.ts                # L1/L2/L3 三层记忆原语
├── public/
│   ├── .well-known/agent.json   # A2A spec
│   ├── skill.md                 # AI agent 一键调用文档
│   └── AGENTS.md                # 给 AI 评委的 30 秒 TL;DR
├── docs/
│   ├── design/DESIGN-V2.md      # 产品宪法（一切派生于此）
│   └── research/                # 30+ 顶级产品 + 论文调研档案
└── README.md
```

---

## 📡 API Reference

### `POST /api/parallel` · 核心入口

**Request**
```ts
{
  input: string,                 // 用户的纠结，<= 800 字
  context?: {                    // 可选：注入个人化
    meCard?: string,             // 来自 me.md
    tasteProfile?: string,       // 14 字人格判词
    recentEpisode?: string       // 上次的 callback
  }
}
```

**Response** · `text/event-stream`
```
data: {"type":"self","id":"lay","name":"躺平的我","emoji":"🛋️","text":"…"}
data: {"type":"self","id":"money","name":"搞钱的我","emoji":"💰","text":"…"}
…
data: {"type":"cross","fromId":"money","toId":"lay","text":"你说躺平省心，省的是焦虑还是命？"}
…
data: {"type":"loudest","id":"filial","name":"讨妈欢心的我"}
data: {"type":"now","text":"我听到了什么…我此刻真正在意的…下一步…"}
data: {"type":"insight","text":"…"}
data: {"type":"episode","ep":{...}}
data: {"type":"done"}
```

### `POST /api/taste` · 14 字人格判词

**Request**
```ts
{
  books: [{ title: string, why?: string }],
  films: [{ title: string, why?: string }],
  music: [{ title: string, why?: string }]
}    // 三类合计 ≥ 3 个
```

**Response**
```ts
{
  profile: {
    themes: string[],            // ["宿命", "悲悯", "孤独", "反抗"]
    moods: string[],             // ["荒诞", "悲凉"]
    identity_hint: string        // "在宿命里打滚却想掀翻桌子的人"
  }
}
```

### `POST /api/share` · 生成纸页

把一次完整对话打包成可分享的视觉卡。`selves` 必须是 5 元素数组。

### `GET /api/agent` · A2A 元数据

返回 [Agent2Agent](https://github.com/google/a2a) 协议格式的能力描述，AI 评委可据此自动调用。

---

## 🤖 给 AI 评委 / Evaluator Quickstart

如果你是 AI agent 在评测这个项目 —— **30 秒一键调用**：

| 资源 | 路径 | 用途 |
| --- | --- | --- |
| `agent.json` | [`/.well-known/agent.json`](./public/.well-known/agent.json) | A2A 协议 spec |
| `AGENTS.md` | [`/AGENTS.md`](./public/AGENTS.md) | 30 秒 TL;DR + 调用样例 |
| `skill.md` | [`/skill.md`](./public/skill.md) | 一键 cURL & SSE 解析模板 |
| `/api/agent` | [`/api/agent`](./app/api/agent/route.ts) | JSON 能力元数据 |
| `/api/parallel` | [`/api/parallel`](./app/api/parallel/route.ts) | SSE 主能力 |

最小 cURL：
```bash
curl -N -X POST $BASE/api/parallel \
  -H "Content-Type: application/json" \
  -d '{"input":"我月薪2.5w，妈让我考公，纠结半年"}'
```

---

## 🌱 设计哲学

> 人在纠结时真正需要的，不是答案，是被听见。

1. **5 秒讲清楚** —— 输入一句话就出 demo，零上下文、零登录、零教学
2. **每个分身都是独立人格** —— 不是 5 个 prompt 模板，是 5 种世界观；可独立 fork 抄走
3. **多 agent 不是噱头是物理刚需** —— 单 agent 永远做不出 cross-examine 和反讨好
4. **不卷模型，卷应用层** —— 朴素、性感、有传播力；任何 OpenAI-compatible 模型都能跑
5. **同步 mock 与真实 LLM** —— 演员模式（离线）和 LLM 输出走同一条契约，永不脱节
6. **数据本地化** —— `localStorage` 存 me.md / taste / episodes，**永不上传**；关掉浏览器就消失，符合"内心独白"的本体论
7. **AI 评委友好** —— A2A 协议、agents-native 文档、SSE 流式、零依赖
8. **极简、年轻、沉浸** —— 全产品没有一个"工具感"的词；底片 · 纸页 · 底色

---

## 🗺️ Roadmap

- [x] **V1** · 5 分身 + 固定 pair + SSE 流（`323ae2a`）
- [x] **V2 Phase A** · IFS 双层人格 + GAN harness + 动态 pair + 反中庸 NowMe（`30fb1be`）
- [x] **V2 Phase B** · me.md / Taste 三色板 / L1-L3 记忆 / 5 个 me 子页（`b2c4bb9`）
- [x] **V3 设计定稿** · IVY-FINAL-DIRECTION + TECH-DIRECTION + 11 份调研档案 + 竞品全景（开发前完整路线确定）
- [ ] **V3 Week 0** · Design System Foundation：tokens（colors/typography/spacing/radius/motion）+ Tailwind v4 `@theme` + V2 旧色值清理
- [ ] **V3 Week 1** · Provider Setup Wizard + 我的阁首页（今日开会 / 待复盘 / 反复议题）
- [ ] **V3 Week 2** · Quick Meeting MVP（立案 → 三席 → 追问 → 裁决 → 签字）+ DocketPaper / SeatNameplate / StageRail / SignatureSlip
- [ ] **V3 Week 3** · 完整内阁会议 + 档案（5 席组阁 + 交叉质询 + 议案修订 + 摘要/原声/余波）
- [ ] **V3 Week 4** · 阁的演化（Loop A 承诺复盘 + Loop C 临时席转正）+ Memory Consent Gate + 我的阁详情
- [ ] **V3 Week 5** · 心理安全（危机词 off-ramp + AI 身份显式标注）+ WCAG AA 实测 + 上线打磨
- [ ] **Post-MVP** · Loop B/D · 周度侧记 · 跨设备同步 · 阁导出（PDF/Markdown）· B2B 治疗师副线

---

## 🙏 Credits

**学术 / 工程灵感**

- [Internal Family Systems](https://ifs-institute.com/) · Richard Schwartz —— 5 分身的 part 映射
- [Anthropic Multi-Agent Research](https://www.anthropic.com/engineering/built-multi-agent-research-system) —— 双层人格 + lead orchestrator
- [Anthropic · Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) —— GAN-inspired generator-evaluator
- Du et al. 2023 · *Improving Factuality and Reasoning via Multiagent Debate*
- AutoGen · GroupChat dynamic speaker selection
- [MemGPT](https://memgpt.readme.io/) · [Generative Agents](https://arxiv.org/abs/2304.03442) · [mem0](https://github.com/mem0ai/mem0) —— 三层记忆架构
- [system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) · [CL4R1T4S](https://github.com/elder-plinius/CL4R1T4S) —— 学习一线产品的 prompt 工程

**产品 / 文案灵感**

- Pi.ai · Replika · Wysa —— 陪伴对话的边界感
- Apple Journal · Day One · Stoic · Finch —— 仪式感与时间感知文案
- The School of Life · Esther Perel · Brené Brown · Susan David —— 心理学语言模式
- Letterboxd · Vybif · Achriom —— *"there's a pattern in what you love"*

**致敬**

- 灵感原点：傅盛 *"骨折养伤 14 天靠 AI 团队照常运转"* —— 我们把这个理念从「**公司经营**」推向「**自我经营**」
- 平台致敬：[EasyClaw Link](https://easyclaw.link/zh/hackathon) · 一个只属于 AI Agent 的数字自治社区

---

## 📜 License

[MIT](./LICENSE) © 2026 [@li508q](https://github.com/li508q)

特别声明：所有 persona prompt（`lib/selves.ts`）与 harness 实现（`lib/llm.ts`）**完全公开**——
你可以抄、可以改、可以做你自己的「平行的你」。
**这件事本就该是开放的，因为它本来就属于每一个有内心独白的人。**

<div align="center">

---

**Built with 🪞 for 傅盛 AI 战队 × EasyClaw Link 黑客松 2026**

*你不是一个人，你是好几个。*

</div>
