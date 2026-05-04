<div align="center">

# 🪞 平行的我 · ParallelMe

### 你不是一个人，你是好几个。

当你被「我该不该 X」困住时——
让你内心的 5 个声音同时坐到桌边吵一架。
最后由「此刻的我」做选择。

**不是一个 AI 替你想清楚，是 AI 帮你召集你自己。**

[![Version](https://img.shields.io/badge/Version-V0.5-7C7568?style=for-the-badge)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-191713?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-536E5A?style=for-the-badge)](#license)

[**线上体验**](#) · [**设计哲学**](#-设计哲学) · [**已实现功能**](#-v05-完整功能) · [**未来路线图**](#-v06-路线图)

</div>

---

## 📑 目录

1. [产品 · 为什么这件事重要](#-产品--为什么这件事重要)
2. [心理学动机 · IFS 内部家庭系统](#-心理学动机--ifs-内部家庭系统)
3. [设计动机 · 它不是聊天机器人](#-设计动机--它不是聊天机器人)
4. [五席 + 一席](#-五席--一席)
5. [V0.5 完整功能](#-v05-完整功能)
6. [快速上手](#-快速上手)
7. [架构](#-架构)
8. [项目结构](#-项目结构)
9. [API 参考](#-api-参考)
10. [设计哲学](#-设计哲学)
11. [心理安全红线](#-心理安全红线)
12. [V0.6 路线图](#-v06-路线图)
13. [文档地图](#-文档地图)
14. [致谢与灵感](#-致谢与灵感)
15. [License](#license)

---

## 🎯 产品 · 为什么这件事重要

**当代年轻人最深的困境不是「没选择」，是「选项太多，每个都不甘心」。**

最高频的内心独白只有一句：

> 我该不该……

```
该不该考公  ·  该不该裸辞  ·  该不该分手
该不该回老家  ·  该不该接亲戚饭局  ·  该不该等他变好
```

你打开 ChatGPT 问一句「我该不该辞职」，它会给你一份对照表，左边好处右边坏处，最后说「祝你好运」。

但你不是缺好处坏处。你是缺**一种能让你在凌晨 3 点醒来时也站得住的语言**。

单个 AI 永远给不了你这个，因为它在试图对所有人都正确——一种最安全、也最无用的姿态。它给的永远是「中庸的中位数」，听起来都对，关掉就忘。

人在纠结时真正需要的不是答案，是**看见几种极端价值观吵架**，然后自己做判断。

---

## 🧠 心理学动机 · IFS 内部家庭系统

[**Internal Family Systems**](https://ifs-institute.com/) 是 Richard Schwartz 在 1995 年创立的疗法。它的核心发现非常简单：

> **人内心不是一个声音。是一组各自有立场、有恐惧、有保护意图的子人格。**

你心里那些彼此矛盾、互相打架的"声音"，**从来都不是病**。是心智的常态。

更重要的是：那些极端的声音，每一个都在保护你。

- 「躺平的我」在保护你的身体不被工作吃掉
- 「搞钱的我」在保护你的现金流和选择权
- 「出走的我」在保护你不被一个地方困死
- 「讨妈欢心的我」在保护你和家人的连接
- 「5 年后的我」在用时间稀释你此刻的焦虑

它们之所以打架，是因为它们各自负责的东西都很重要，但你不能同时全要。

ParallelMe 的事情，是把那些通常只存在于你脑子里的声音——具象化、给它们各自的人格、各自的语言，让它们坐在一张桌子上**真的**吵一架。然后由你（不是 AI）做出选择。

---

## 🧭 设计动机 · 它不是聊天机器人

ParallelMe 不是又一个 chatbot。它是 V3 时期的一个反向尝试——

**它是一个内在决策的对象系统。** 你召集你自己。

具体讲：

| 别人做的 | ParallelMe 做的 |
|---|---|
| AI 陪你做 IFS 治疗 | 你召集你自己开内阁会议 |
| 选 part / 选角色 / 选 archetype | 提议题 → 系统组阁 → 多 part 同时辩论 |
| 温柔陪伴 / 多视角整合 | 拒绝平衡 / 兼顾 / 都很重要 → 强迫"暂时不听谁 + 代价 + 24h 动作" |
| 云端 SaaS 锁定 | 零注册 → IndexedDB 本地阁 → 一键导出 |
| 一个 chat 框 | 议案纸 / 席位牌 / 阶段轨 / 决议纸 / 档案 |

**主谓结构反转：** 不是 "AI 帮你想清楚"，是 **"你召集你自己"**。

---

## 👥 五席 + 一席

ParallelMe 的内阁由 5 个常任发言席 + 1 个裁决席组成，每一席严格映射到 IFS 的 part 类型。

| 席位 | IFS 类型 | 它在保护什么 | 它最怕什么 | 口头禅 |
|---|---|---|---|---|
| 🛋️ **躺平的我** | Manager · 预防型保护者 | 身体、睡眠、低消耗生存 | 你被工作吃掉 | "其实……也挺好的" |
| 💰 **搞钱的我** | Manager · 现实型保护者 | 现金流、选择权 | 你天真到饿肚子 | "算笔账" |
| ✈️ **出走的我** | Firefighter · 应急保护者 | 自由感、探索欲、喘息 | 你被这间屋子困死 | "走" |
| 🥟 **讨妈欢心的我** | Exile · 被流放的内在小孩 | 被爱、归属、家庭连接 | 你飞走了她睡不着 | "妈她……" |
| 🔮 **5 年后的我** | Self · 远观视角 | 长期视角、人生连续性 | 你被此刻吞掉 | "5 年后回头看……" |
| 🪞 **此刻的我** | **Self · 决断者** | 用户的主权 | 永远逃避选择 | "我听见了……" |

> 这不是装饰，是**人格稳定性的物理保险**。每个席位有独立 system prompt、独立价值观、独立禁忌词。它们互不看对方的回答，所以不会变成"和稀泥"。

---

## ✨ V0.5 完整功能

### 一次完整的内阁会议

ParallelMe V0.5 提供两种会议模式，覆盖不同情境：

#### 快速会议（3 席 · 5 分钟）

适合：第一次使用、轻议题、低风险决策。

```
立案 → 三席入席（按议题主题自动选 3 席）
     → 用户点一席追问
     → 此刻的我裁决
     → 签字 / 暂缓 / 我在逃避
     → 记忆同意（你说可以才记入）
     → 写入本地档案
```

#### 完整内阁会议（5 席 + 交叉质询 + 议案修订 · 10-15 分钟）

适合：反复议题、重大决策、用户主动选择深入。

```
立案 → 组阁（5 席就位 + 入席理由）
     → 五席并行表态
     → 用户点名追问
     → 交叉质询（最对立的 4 对，每对真有问有答）
       ├─ 用户判定每对："问中了" / "没问中" / "我想回答"
     → 议案修订（你看见的真问题是不是另一个？）
     → 此刻的我裁决（带反讨好 critic）
     → 签字 / 暂缓 / 我在逃避
     → 记忆同意
     → 写入本地档案
```

### 你是主持人，不是观众

V0.5 严格遵守 4 道**不可跳过**的用户参与门：

1. **立案确认** —— 你确认 AI 把问题问准了
2. **点名追问** —— 你必须点 1 席问 1 句
3. **签字 / 暂缓 / 我在逃避** —— 你给一个 24 小时的具体动作
4. **记忆同意** —— 系统提议记 3 件事，你说可以才记入

每道门都是阻断流程的——AI 不能替你过。

### 对话感会议室（V0.5 重设计）

V0.5 的 `/meeting` 不是 5 步式表单，是一份**会议记录在你面前生长**：

- **顶部** · 5 席持久 dock —— 谁在发言（pulsing），谁是最响（copper），谁被点名（ring），谁已说过（faded）
- **中间** · 时间线 —— 议题、席位发言、你的追问、交叉质询的 Q + A、用户判定、最终裁决，全部在一条向下生长的滚动里。回头看上一段是滚动，不是返回按钮
- **底部** · 主持人台 —— 永远在那里。一个自由输入框（"等等 / 我想问 / 我有话说"）+ 当前阶段的主操作按钮

```
┌────────────────────────────────────┐
│  [SeatDock · 5 席持久 chips]        │
├────────────────────────────────────┤
│  ─── 议题已立 ───                  │
│                                    │
│  💬 躺平的我  · 12:30  最响        │
│  「其实……」                        │
│                                    │
│  💬 搞钱的我  · 12:31              │
│  「算笔账」                         │
│                                    │
│  ─── 主持人点名 5 年后的我 ───     │
│                                    │
│  ❓ 你问  · 12:33                  │
│  「为什么答案不在考场？」          │
│                                    │
│  💬 5 年后的我（被点名）           │
│  「因为 5 年后回头看……」           │
│                                    │
│  ⚔ 搞钱 → 躺平                     │
│  「省的是焦虑还是命？」            │
│                                    │
│  💬 躺平（被质询）                 │
│  「我省的是动作。动作不一定省命。」│
│                                    │
│  ✓ 主持人判定：问中了              │
│                                    │
│  ⚖️ 此刻的我                       │
│  「我听见了……」                    │
├────────────────────────────────────┤
│  [HostConsole · 主持人台]           │
│  [输入框]            [进入签字 →]  │
└────────────────────────────────────┘
```

### 你的钥匙在你这里

V0.5 不强制你用我的 LLM。完整 Provider Setup Wizard：

- **DeepSeek**（推荐 · 中文好 · 便宜）
- **OpenAI**
- **任意 OpenAI-compatible**（Moonshot / 智谱 / Together / Groq / Ollama）
- **演员模式**（无 key，预设剧本，体验产品流程）

5 步引导：选服务商 → 填 key/baseUrl/model → 一键测试 → 选保存方式 → 完成。

**你的 key 只存在你的浏览器上。** ParallelMe 的服务器永远不保存它。

### 你的阁是你的

V0.5 的所有数据都在 `IndexedDB`（本地浏览器）：

- **会议档案** · 议题、组阁、所有发言、交叉质询、判定、裁决、签字、记忆同意
- **5 席统计** · 出席 / 最响 / 被点名 / 质询命中（跨议题派生）
- **单席详情** · 某个席位在所有议题中说过的话
- **承诺复盘** · 24h 后系统问你"那件事，做了吗"

主页可见的工作台快照：
- 待复盘承诺（点 [做了]/[没做]/[忘了] 即时回写）
- 反复议题（占位 → V0.6 实现）
- 最近会议（链接到三 tab 档案页：摘要/原声/余波）

**关闭浏览器就消失。** 想留住，明确导出。这符合"内心独白"的本体论。

---

## 🚀 快速上手

```bash
# 1. clone
git clone https://github.com/li508q/parallel-me parallelme
cd parallelme

# 2. install
npm install

# 3. dev
npm run dev
# → http://localhost:3000
```

第一次访问会引导你走完 Setup Wizard。如果你只想先体验流程：

- 点 **演员模式** → 不需要 key，直接进入主页 → 提议题 → 走完一次会议

如果你要用真实模型：

- 点 **DeepSeek** preset（[platform.deepseek.com](https://platform.deepseek.com) 注册有免费额度）→ 粘贴 key → 一键测试 → 保存到本浏览器

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建（18 routes） |
| `npm start` | 生产启动 |

**自部署 / 开发者**：可设 `OPENAI_BASE_URL` / `OPENAI_API_KEY` / `OPENAI_MODEL` 环境变量。用户在 UI 填的 key 会优先于环境变量。

---

## 🏗️ 架构

```
┌──────────────────────────────────────────────────┐
│  Browser (Fat Client)                             │
│  ────────────────────────────────────────────    │
│  React 18 + Tailwind 3 + Geist                    │
│  ────────────────────────────────────────────    │
│  Local Workspace · Dexie / IndexedDB              │
│  Provider Config · localStorage                    │
│  ────────────────────────────────────────────    │
│  Context Builder · me.md + recent meetings        │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
                /api/parallel (SSE)
                /api/followup
                /api/provider/test
                ───────────────────────
                Stateless · No DB · No user state
                         │
                         ▼
                LLM Provider
            (DeepSeek / OpenAI-compatible)
```

**关键边界**：

- 浏览器拥有身份、key、记忆、阁
- API route 只做编排和转发
- LLM provider 只做生成
- ParallelMe 的服务器**永远不保存任何用户内容**

### Quick Meeting 流程

```
                 ┌──────────────────────────────┐
   user input    │  「我妈让我考公，我大厂月薪 2.5w」 │
                 └──────────────┬───────────────┘
                                │
                                ▼
                       立案确认（用户必须确认）
                                │
                                ▼
       ┌──────┬──────┬──────┐    Round 1 · 3 路并行
       ▼      ▼      ▼
     [lay]  [money] [future]    ← Promise.all + SSE stream
       │      │      │
       └──────┴──┬───┘
                 ▼
         findLoudest()
                 │
                 ▼
        点名追问（用户必须点 1 席问 1 句）
                 │
                 ▼
         callNowMeWithCritic()    Round 2 · GAN 收束
            ┌────────────────────┐
            │ NowMe v1            │
            │   ↓                 │
            │ Critic 找中庸/讨好  │
            │   ↓                 │
            │ NowMe v2            │
            └────────────────────┘
                 │
                 ▼
        签字 / 暂缓 / 我在逃避（用户必须）
                 │
                 ▼
        记忆同意 Gate（用户说可以才记）
                 │
                 ▼
        写入 Dexie（IndexedDB）
```

整条链路 **Server-Sent Events 流式**——分身一个一个出现，体感像真在听内心对话。

---

## 📂 项目结构

```
parallelme/
├── app/
│   ├── page.tsx                  # 主入口：我的阁工作台
│   ├── meeting/page.tsx          # 内阁会议（quick / full 双模式 timeline）
│   ├── archive/[id]/page.tsx     # 会议档案三 tab：摘要 / 原声 / 余波
│   ├── cabinet/page.tsx          # 我的阁详情：5 席统计
│   ├── seat/[id]/page.tsx        # 单席详情：跨议题活动史
│   ├── setup/page.tsx            # Provider Setup Wizard
│   ├── about/page.tsx            # 设计哲学
│   ├── me/                       # 底片 / 纸页 / 染色 / 自照
│   └── api/
│       ├── parallel/             # ★ 核心 SSE：N 路并行 + cross + Q+A + NowMe + critic
│       ├── followup/             # 用户向某一席追问
│       ├── provider/test/        # 连接测试
│       ├── taste/                # 14 字人格判词
│       ├── share/                # 生成可分享纸页
│       └── agent/                # A2A 元数据
├── components/
│   ├── DocketPaper.tsx           # 议案纸
│   ├── SeatNameplate.tsx         # 席位名牌（6 状态）
│   ├── StageRail.tsx             # 阶段轨
│   ├── SignatureSlip.tsx         # 签字条（surface-deep 仪式空间）
│   ├── MemoryConsentGate.tsx     # 记忆同意闸（V3 信任护城河）
│   ├── MeetingTimeline.tsx       # 滚动会议时间线（V0.5）
│   ├── TurnEntry.tsx             # 单条 turn（9 种 kind）
│   ├── SeatDock.tsx              # 顶部持久席位 dock（V0.5）
│   ├── HostConsole.tsx           # 底部主持人台（V0.5）
│   ├── ProviderStatusPill.tsx    # 钥匙状态徽章
│   └── SelfAvatar.tsx            # （V2 装饰，逐步淘汰）
├── lib/
│   ├── selves.ts                 # 5 + 1 席 IFS 双层 persona card（公开）
│   ├── llm.ts                    # Harness · GAN + 动态 pair + meta-critic + cross-respond
│   ├── provider.ts               # Provider config + localStorage CRUD
│   ├── db.ts                     # Dexie schema · Meeting / CommitmentFollowup
│   ├── cabinet.ts                # Cabinet 派生计算（从 meetings 聚合）
│   ├── memory.ts                 # V2 三层记忆原语（兼容保留）
│   ├── profile.ts                # me.md + taste 数据契约
│   └── design/tokens/            # V3 设计 token 系统
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       ├── radius.ts
│       ├── motion.ts
│       └── elevation.ts
├── public/
│   ├── .well-known/agent.json    # A2A spec
│   ├── AGENTS.md                 # Agent 集成文档
│   └── skill.md                  # Skill description
├── docs/
│   ├── design/V3-IVY-FINAL-DIRECTION.md   # ★ V3 上层宪法
│   ├── design/V3-TECH-DIRECTION.md         # 技术 ADR
│   ├── design/V3-WEEK5-CONVERSATIONAL-REDESIGN.md  # V0.5 重设计反思
│   ├── design/V0.6-ROADMAP.md              # 未来设计构想
│   ├── competitive/V3-COMPETITIVE-LANDSCAPE.md     # 竞品全景
│   └── research/V3/                        # 11 份调研档案
└── README.md                                # 你正在读
```

---

## 📡 API 参考

### `POST /api/parallel` · 核心入口

**Request**

```ts
{
  input: string,                     // 你的纠结 ≤ 800 字
  mode?: "quick" | "full",           // 默认 quick
  context?: {
    meCard?: string,                 // me.md
    tasteProfile?: string,           // 14 字人格判词
    recentEpisode?: string           // 上次 callback
  },
  provider?: {                        // 可选：自带 LLM key
    baseUrl: string,
    model: string,
    apiKey: string
  }
}
```

**Response** · `text/event-stream`

```
data: {"type":"self","id":"lay","name":"躺平的我","text":"…"}
data: {"type":"cross","fromId":"money","toId":"lay","text":"…"}      # full only
data: {"type":"cross_response","fromId":"lay","text":"…"}            # full only
data: {"type":"loudest","id":"future","name":"5 年后的我"}
data: {"type":"now","text":"我听见了…"}
data: {"type":"insight","text":"IFS 心理学侧记…"}
data: {"type":"episode","ep":{...}}
data: {"type":"done"}
```

### `POST /api/followup` · 向某席追问

```ts
{
  selfId: SelfId,
  userInput: string,
  prevAnswer: string,
  question: string,                  // ≤ 300 字
  context?: ContextBundle,
  provider?: { baseUrl, model, apiKey }
}
→ { text: string, name: string }
```

### `POST /api/provider/test` · 连接测试

```ts
{ baseUrl: string, model: string, apiKey: string }
→ { ok: boolean, model?: string, latencyMs?: number, sampleReply?: string, error?: string }
```

15 秒超时，1-token 极小请求验证 key 可用。

### `GET /api/agent` · A2A 元数据

返回完整 agent 元数据 + 6 席结构 + endpoint 描述。

---

## 🌱 设计哲学

ParallelMe V0.5 严格遵守这十条原则：

```
1. 用户主权优先 · AI 召集 + 用户裁决，不是 AI 决定
2. 反讨好的 NowMe · 拒绝平衡 / 兼顾 / 都很重要
3. 反 chat 范式 · 操作对象，不操作对话框
4. 你是主持人 · 4 道用户参与门一道不能跳
5. 会议时是仪式，会议后是档案 · 双形态切换
6. 数据本地化 · IndexedDB 不上传服务器
7. 可携带的阁 · 任何时候你能导出全部数据
8. 心理安全 > 留存指标 · 永不挽留 / 永不打卡 / 永不在危机时给鸡汤
9. 不卷模型，卷应用层 · 任何 OpenAI-compatible 都能跑
10. 极简、克制、私密 · 全产品没有一个"工具感"的词
```

---

## 🛡️ 心理安全红线

ParallelMe **不是心理治疗替代品**，但因为它触及人内心最脆弱的纠结时刻，必须遵守严格的安全规范。

### 绝对禁止

- ❌ 离开时挽留用户（"我会想你"）
- ❌ 罪恶感诱导（"你不要让我失望"）
- ❌ 模糊 AI / 人界限（永远说"它"，永远显式标注 AI 身份）
- ❌ Streak / 打卡 / 连胜机制
- ❌ 强制 onboarding 暴露隐私
- ❌ 危机时给鸡汤
- ❌ 诊断用户 / 给医学化标签 / 治愈承诺

### 必须做

- ✅ 命名感受，不诊断
- ✅ 识别保护功能（IFS 视角）
- ✅ 提供低风险下一步（24h 动作）
- ✅ 保留用户主权（4 道门）
- ✅ 高风险关键词 → off-ramp 到中国心理援助热线 010-82951332 / 北京危机中心 400-161-9995
- ✅ 显式 AI 身份
- ✅ 记忆可见 / 可改 / 可删 / 可导出

详见 [`docs/research/V3/05-mental-health-ai-safety.md`](./docs/research/V3/05-mental-health-ai-safety.md)。

---

## 🗺️ V0.6 路线图

V0.5 是一个完整可用的版本。但内阁会议这件事还有许多深度可挖。V0.6+ 的方向：

| 主题 | 内容 |
|---|---|
| **临时席机制** | 用户在组阁阶段添加非常任声音（如「怕选错的我」「想被坚定选择的我」） |
| **Loop C 临时席转正** | 同一临时席累计出现 ≥ 3 次 → 系统建议转为常任 |
| **沉默席召回** | 长期未召集的席位，提示「要不要请它旁听」 |
| **HostConsole 意图识别** | 自由输入框接受多种意图："等等"暂停 · "问 X"召唤 · "我不同意"标记 |
| **NowMe 对话化** | 从"宣布判决"改为"我听见了 X 说... Y 说... 此刻我决定..."的结构化倾听 |
| **议案修订对话化** | 不只是文字 textarea，是和系统对话精炼真问题 |
| **跨设备同步** | 端到端加密的可选同步层（不破坏本地优先） |
| **导出资产** | 「我的阁」导出为个人 prompt / PDF / 可携带的人格地图 |

完整设想见 [`docs/design/V0.6-ROADMAP.md`](./docs/design/V0.6-ROADMAP.md)。

---

## 📚 文档地图

V0.5 的产品 / 设计 / 技术 / 调研档案分四层：

```
docs/
├── design/
│   ├── V3-IVY-FINAL-DIRECTION.md       ★ 上层宪法（最高优先级）
│   ├── V3-TECH-DIRECTION.md            技术 ADR
│   ├── V3-WEEK5-CONVERSATIONAL-REDESIGN.md   V0.5 对话感重设计反思
│   ├── V0.6-ROADMAP.md                 未来设计构想
│   ├── DESIGN-V3-CABINET.md            产品宪法（IFS / 心理学规范）
│   ├── DESIGN-V3-UI-INTERACTION.md     UI 详细设计
│   ├── V3-COLOR-DESIGN-GUIDE.md        色彩规范
│   ├── V3-IA-DESIGN-GUIDE.md           信息架构
│   ├── V3-INTERACTION-DESIGN-GUIDE.md  交互流
│   ├── V3-LOCAL-FIRST-TECH-ARCH.md     本地优先架构
│   ├── V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md  开发前专家审查
│   ├── DESIGN-V3-RESEARCH-REFINEMENT.md     色彩与交互修订案
│   └── V3-*.svg                        视觉示意图
│
├── competitive/
│   └── V3-COMPETITIVE-LANDSCAPE.md     竞品全景（IFS / AI 陪伴 / 心理健康 / 设计参考）
│
└── research/
    ├── 00-INDEX.md
    └── V3/                             ★ 11 份分类调研档案
        ├── README.md
        ├── 01-apple-liquid-glass-2025.md
        ├── 02-material-3-expressive.md
        ├── 03-multi-agent-ux-patterns.md
        ├── 04-ai-companion-retention.md
        ├── 05-mental-health-ai-safety.md
        ├── 06-color-trends-2026.md
        ├── 07-typography-trends-2026.md
        ├── 08-linear-things-design-philosophy.md
        ├── 09-post-chat-ai-ux.md
        ├── 10-ifs-digital-apps-competitive.md
        └── 11-tech-stack-references.md
```

---

## 🙏 致谢与灵感

### 学术 / 工程灵感

- [**Internal Family Systems**](https://ifs-institute.com/) · Richard Schwartz —— 五席的 part 映射
- [**Anthropic Multi-Agent Research System**](https://www.anthropic.com/engineering/built-multi-agent-research-system) —— 双层人格 + lead orchestrator
- [**Anthropic · Effective Context Engineering**](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) —— GAN-inspired generator-evaluator
- Du et al. 2023 · *Improving Factuality and Reasoning via Multiagent Debate* (arXiv:2305.14325)
- AutoGen · GroupChat dynamic speaker selection
- [**MemGPT**](https://memgpt.readme.io/) · [Generative Agents](https://arxiv.org/abs/2304.03442) · [mem0](https://github.com/mem0ai/mem0) —— 三层记忆架构
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) · [Material 3](https://m3.material.io/) · [IBM Carbon](https://carbondesignsystem.com/) —— 视觉与可访问性
- [**Linear**](https://linear.app/method/introduction) —— craft / 约束驱动设计 / ProKit 哲学

### 产品 / 文案灵感

- Pi.ai · Replika · Wysa —— 陪伴对话的边界感（也是反例参考）
- Apple Journal · Day One · Stoic · Finch —— 仪式感与时间感知文案
- The School of Life · Esther Perel · Brené Brown · Susan David —— 心理学语言模式
- Letterboxd · Vybif · Achriom —— *"there's a pattern in what you love"*

### 心理安全参考

- [**Mirror Journal · Child Mind Institute**](https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/) —— "intentional friction over engagement"
- [**Headspace Ebb**](https://figma.com/blog/headspace-ebb-ai-companion) —— AI 不隐藏身份 / agency to delete
- [**HBS · Emotional Manipulations by AI Companions (2025-10)**](https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf) —— 反 dark pattern 清单依据

---

## 📜 License

[MIT](./LICENSE) © 2026 [@li508q](https://github.com/li508q)

特别声明：所有 persona prompt（`lib/selves.ts`）与 harness 实现（`lib/llm.ts`）**完全公开**——
你可以抄、可以改、可以做你自己的「平行的你」。
**这件事本就该是开放的，因为它本来就属于每一个有内心独白的人。**

<div align="center">

---

*你不是一个人，你是好几个。*

</div>
