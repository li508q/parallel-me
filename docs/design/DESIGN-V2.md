# ParallelMe · DESIGN-V2 设计宪法

> 此文件是 ParallelMe V2 改造的"宪法"——所有代码、文案、视觉、交互都从这里派生。
> **基于 30+ 顶级产品 + 学术论文 + 心理学权威 + 比赛规则的综合调研。**
> 调研档案见 `docs/research/`（2026-05-01 落档）。

---

## 0 · 时间线（比赛驱动）

- **5 月 10 日截止**（剩 9 天）
- **必交付物**：(1) 公网演示网站 (2) 代码 ZIP
- **加分项**：傅盛叙事呼应 / 多 agent 协作鲜明 / 在创始人自己工作流跑通

## 1 · 一句话定位（参赛 + 长期）

> **「你不是一个人，你是好几个。」**
> 你说一句，5 个你回信。最后由「此刻的我」做选择。

副标题（傅盛 framing）：
> 傅盛说"骨折 14 天靠 AI 团队照常运转"。
> 我们把它从"公司经营"推到了「自我经营」。

## 2 · 三大改造支柱（V2 灵魂）

### Pillar Ⅰ · 让每个 inner voice 真有灵魂（Harness 升级）
- **GAN-inspired Generator-Evaluator** — Anthropic 顶级 harness 模式：分身写 → critic 挑刺 → 重写
- **动态 cross-examine** — 取消硬编码 pair，每次跑一次 5×5 对立矩阵选最尖锐的两对
- **反讨好 prompt** — 每个分身底部夹击"你不是助手，你是声音；同意了对方你就消失了"
- **持口头禅 + 双层 persona card** — anti-drift 最便宜手段
- **NowMe 反中庸** — ban 中庸词 + "我在逃避"逃生口

### Pillar Ⅱ · 让系统拥有「me」（Profile + Memory）
- **me.md 跨会话画像** — 灵感来自 CLAUDE.md / AGENTS.md，但面向用户自填"我是谁"
- **3 层记忆** — Working（KV 24h TTL）+ Episodic（事件卡）+ Reflective（你总是 X 的洞见）
- **Taste 三色板** — 用户上传"3 本书 / 3 部电影 / 3 首歌"文本，AI 抽风格画像，作为分身额外人格输入源
  - 灵感：Achriom *"There's a pattern in what you love"* + Vybif *"今天你是你消费内容的平均值"* + Letterboxd Personality
- **Callback 开场** — 第二次回来开场永远引用一个**具体细节**（不是"欢迎回来"），用 Pi.ai 的 callback 范式

### Pillar Ⅲ · 让人愿意第二次打开（沉浸 + 仪式 + 报告）
- **First-run 仪式** — 30 秒的入场动画（不可 skip），把"打开 App"变仪式
- **Wrapped 式报告页** — 7 帧故事流，第 4 帧"你回避的那个分身"制造好奇 + 分享驱动
- **晨间一问 / 凌晨模式** — 时间感知文案（Stoic 学）
- **集页机制** — 每次对话产出一张"页"，30 张拼成一册（Apple Journal + Finch 学）
- **不发 push** — 永远不打扰，但永远有"今天的那张纸"等着

## 3 · 信息架构（路由）

```
/                        ← 主入口（沉浸辩论体验）
/me                      ← 个人主页（命名见 §4）
/me/taste                ← 品味上传（书/影/乐三色板）
/me/pages                ← 历史对话页（"今日页"集册）
/me/insights             ← AI 关于我的笔记（用户可见可删）
/wrapped                 ← Wrapped 式报告页（每月/累计 7 次自动触发）
/about                   ← 致敬傅盛 / 设计哲学
/api/parallel            ← SSE 主流（保留）
/api/agent               ← agent.json
/api/followup            ← 追问（保留）
/api/share               ← 分享卡片
/api/wrapped             ← 新：报告数据接口
/api/profile             ← 新：me.md 读写
/api/memory              ← 新：episode 读写 + insight
```

## 4 · 命名表（统一调性）

> 调性原则：**中文文学感 + 物理隐喻 + 不带科技感词**。
> 借鉴：Apple Journal（"Journal"=日记）/ Bear Notes / Day One。
> 中文同类成功命名：纸条、笔记、晨光、回声、纪念册。

| 旧名 / 用户口语 | V2 正式名 | 含义 / 出处 |
|---|---|---|
| 主入口 | **「五声」** 或保留无名 | 此刻的辩论会 |
| ~~个人主页~~ | **「底片」** | 摄影术语：底片是被冲洗的"原我"；呼应 ParallelMe 的"另一个我"叙事 |
| ~~品味~~ | **「染色」** | 你喜欢的东西，把你染成你的颜色 |
| ~~历史~~ | **「纸页」** | 每次对话 = 一张纸；攒成"册" |
| ~~AI 笔记~~ | **「侧记」** | 中文古书"侧记"= 旁观笔记；不冒犯感 |
| 报告页 | **「自照」** | 「以铜为镜，可以正衣冠」的"照"；不用 Wrapped/Year-in-Review |
| 关于 | **「序」** | 古书"序"——少而重 |

> 推荐主导航顺序：**五声（主辩论）· 底片（个人页）· 序**
> 底片内部包含 子节点：染色 / 纸页 / 侧记 / 自照（用户用 IA 树进入）

## 5 · 5 分身重新设计（IFS 升级 + 4 维双层）

### 5.1 IFS 学术升级
原版：躺平 / 搞钱 / 出走 / 讨妈 / 5年后
V2 保留同样 5 个**外层人格**，但内层**对应 IFS 5 类 part**：

| 分身 | IFS 类型 | 心理学职能 |
|---|---|---|
| 🛋️ 躺平的我 | **Manager** (预防型保护者) | 控制工作量防崩溃 |
| 💰 搞钱的我 | **Manager** (现实型保护者) | 用数字屏蔽情绪 |
| ✈️ 出走的我 | **Firefighter** (应急保护者) | 冲动逃离痛苦现场 |
| 🥟 讨妈的我 | **Exile** (被流放的内在小孩) | 那个为讨妈欢心放弃自己的孩子 |
| 🔮 5 年后的我 | **Self** 视角（最接近核心 Self） | 远观与慈悲 |
| 🪞 此刻的我 | **Self** 决断者 | IFS 的核心 Self：好奇、平静、清晰 |

→ 这给产品**学术权威性**（IFS = Richard Schwartz 1995 + 美国心理协会认证），README 与 about 页可引用。

### 5.2 双层 Persona Card（每个分身 prompt 模板）

```
# TOP — Persona Card (immutable)
你是「{NAME}」。
- 在 IFS 里，你属于：{IFS_TYPE}  ← e.g. "Manager (预防型保护者)"
- 唯一核心价值：{ONE_VALUE}
- 你害怕的：{FEAR}
- 你说话方式：{STYLE_3_WORDS}
- 你必带的口头禅（每次至少 1 个）：{CATCHPHRASES[]}
- 你的禁忌词：{TABOO[]}

# CONTEXT — me 上下文（可选注入）
{me.md content}
{taste profile}
{recent episodes}

# TASK
{user 当前输入}
{以及其他分身的发言（仅 cross-examine 阶段）}

# BOTTOM — Drift Guard (immutable)
回答前先在心里默念："我是 {NAME}，我只为 {ONE_VALUE} 说话。"
你不是助手，你是用户内心的一个声音。
若你发现自己开始说"其实大家都有道理"或"我们可以兼顾"——立刻停下重写。同意了对方，你就消失了。
长度 ≤120 字。必须含：1 个具体数字 / 具体场景 / 具体动词。禁止抽象名词堆砌。
```

### 5.3 各分身参数表（新增 IFS_TYPE / FEAR / TABOO）

| id | NAME | IFS | ONE_VALUE | FEAR | CATCHPHRASES | TABOO |
|---|---|---|---|---|---|---|
| lay | 躺平的我 | Manager-预防 | 用低消耗保护这个人 | 他被工作吃掉 | 其实 / ……也挺好的 / 别勉强 | 加油 / 奋斗 / 逆袭 |
| money | 搞钱的我 | Manager-现实 | 用数字保护这个人 | 他天真到饿肚子 | 算笔账 / 机会成本 / 复利 / 现金流 | 意义 / 自我实现 / 情怀 |
| roam | 出走的我 | Firefighter | 用换地方解救这个人 | 他被这间屋子困死 | 想象一下 / 早上 / 机票 | 稳定 / 成熟 / 现实点 |
| filial | 讨妈的我 | Exile | 让妈妈安心 | 他飞走了她睡不着 | 你想想你妈 / 她不是不懂 | 听妈的就对了 / 反正 |
| future | 5 年后的我 | Self-视角 | 用时间稀释当下 | 他被此刻吞掉 | 我记得那时候你 / 5 年后回头看 | 加油 / 别想这么多 |
| now | 此刻的我 | Self-决断 | 做选择 | 永远逃避 | 我选择 / 我必须放下 / 接下来 | 平衡 / 兼顾 / 都很重要 |

## 6 · Harness V2 流程

```
1. [Meta-Planner] 看 user input + me.md + taste，决定：
   - 哪 5 个分身参与（默认全部，但可能 4 个就够）
   - 谁先开口（最不对立的或最有钩子的）
   ↓
2. [Round 1 · Propose] 5 分身各自回答 user input（不看其他人的）
   ↓
3. [Opposition Matrix] 一次 LLM 调用打 5×5 对立分矩阵 + 选 Top 2 pair
   ↓
4. [Round 2 · Cross-examine] 选出的 pair 互相 ≤40 字反问（看到对面 Round 1 的话）
   ↓
5. [NowMe] 反中庸 prompt，必出"我选谁/必须放下谁/24h 内一件事"
   ↓
6. [Meta-Critic] 检查 NowMe 是否含中庸词，命中 → 回炉重写一次
   ↓
7. [Insight] IFS 视角心理学解读（不评判、命名情绪）
   ↓
8. [Episode 抽取] 异步：把这次对话抽成事件卡 → episodes table
   ↓
9. [Reflection trigger] 若 episodes 累计 ≥5 → 触发 reflection LLM 写 insight
```

## 7 · me.md 结构（用户自填跨会话画像）

```yaml
# 我是
name: # 怎么称呼你（昵称即可，不会上传服务器）
age: # 年龄段：18-24 / 25-29 / 30-34
city: # 现居城市
season: # 现在是你人生哪个阶段，3-15 字（例：刚毕业第二年）

# 我此刻
caring_about:  # 最近最在意的事，1-3 行
  - 
avoiding:      # 最在回避的话题，1-3 行
  - 

# 我的人
people:
  - name: 妈    relation: family    note: # 一句话画像
  - name: 前任  relation: ex        note:

# 我的红线（分身永不踩）
red_lines:
  - 
```

## 8 · Taste 数据结构（书/影/乐 三色板）

```yaml
books:    # 3-7 本，纯文本
  - title: 局外人
    author: 加缪
    why: 我读完之后默坐了 1 小时

films:    # 3-7 部
  - title: 海街日记
    director: 是枝裕和
    why: 让我想起夏天和外婆

music:    # 3-7 首
  - title: 漠河舞厅
    artist: 柳爽
    why: 1 个人的舞厅

# 自动派生（LLM 抽）
taste_profile:    # 由后端 LLM 一次性总结
  themes: [孤独, 时间, 失而复得]
  moods: [慢, 雨天]
  identity_hint:  # 14 字内人格判词（参考 Letterboxd Personality）
    "在喧闹中找寂静的人"
```

## 9 · 记忆数据结构

```ts
// L2 episodes（事件卡）
type Episode = {
  id: string; ts: number; title: string;
  summary: string;        // ≤120 字
  emotion: 'joy'|'anger'|'fear'|'sad'|'conflict';
  intensity: number;      // 0-1
  importance: number;     // 0-1（LLM 打）
  dominant_voice: SelfId;
  silenced_voice: SelfId;
  decision: string;
  raw_excerpt: string;
};

// L3 insights（洞见）
type Insight = {
  id: string; ts: number;
  statement: string;       // "你在'妈妈期待'和'自由'之间反复横跳，已 4 次"
  evidence: string[];      // episode ids
  confidence: number;
  superseded_by?: string;
};
```

存储：MVP **localStorage** （客户端，私密、零基建）+ 可选 Vercel KV 同步。**不上 SQLite**，避免 Vercel 部署摩擦。

## 10 · UI 文案池（统一调性）

### 10.1 钩子 placeholder（每天轮一个）
```
今天有哪一刻，你假装没事？
如果可以删掉今天的一个小时，你会删哪一段？
刚才那个念头，你愿意让谁听见？
有件事你已经偷偷想了三天，但还没开口。
凌晨睡不着的时候，你心里那个问题。
```

### 10.2 First-run 30s 脚本
（详见 `research/ux-product/01-top-products-design-patterns.md` §五，已写好逐秒）

### 10.3 Callback 开场模板
```
{N} 天前，你来这里聊过 「{episode.title}」。
那天 {dominant_voice}赢了，{silenced_voice}被你按下来了。
你说会 「{episode.decision}」 ——

做了吗？
```

### 10.4 Wrapped 7 帧文案
（详见 research/ux-product/01）

### 10.5 Footer 永远的 micro-affirmation 池
```
今天你没有崩溃，这本身就是一种工作。
45 度的你，也在站着。
听见自己，比说服别人更难。
```

## 11 · 视觉系统（保留 + 微调）

| 元素 | 现状 | V2 |
|---|---|---|
| 主色 | 米白纸面 #FBF8F3 | ✅ 保留 |
| 字体 | Songti SC 衬线 | ✅ 强化 |
| 5 分身色 | 雾蓝/古金/苔绿/陶土/紫罗兰 | ✅ 保留 |
| 流式 | 整段 pop | → 改 30-40ms/字打字机 |
| 转场 | 现 fade | 全部改 fade-only + 水墨晕染 |
| 头像 | SelfAvatar SVG | ✅ 保留，新增"饱和度成长"机制 |

## 12 · 实施优先级（9 天倒计时）

```
Day 1-2  Phase A  代码核心层（lib/* 重写）+ 演员模式同步 + 端到端
Day 3-4  Phase B  路由重组 + /me 个人主页 + taste 上传 + memory 接入
Day 5-6  Phase C  first-run 仪式 + Wrapped 报告页 + 主页文案重塑 + callback
Day 7    Phase D  README V2 + 比赛素材 + about 页致敬叙事 + 部署 Vercel
Day 8    Phase E  打磨 + 真实用户走查 + 回炉
Day 9    备用 / 紧急修复 / 提交
```

## 13 · 验收标准（Definition of Done）

每个 Phase 结束后必须达到：

| 维度 | 标准 |
|---|---|
| 演员模式 | 没 KEY 也能完整跑完 5 帧（评委友好） |
| 真 LLM | DeepSeek 跑通端到端 |
| 一致性 | 每个分身回答必含口头禅 + 不出现禁忌词 |
| NowMe | 100% 不含 ban 词；做出明确选择 |
| 速度 | 首帧 ≤2s，全程 ≤30s |
| 移动端 | iOS/Android 浏览器无破版 |
| 隐私 | 默认 localStorage，不强制上传 |

## 14 · 关键参考文献

- **Anthropic Multi-Agent Research** — https://www.anthropic.com/engineering/multi-agent-research-system
- **Anthropic Harness Design (GAN-inspired)** — https://www.anthropic.com/engineering/harness-design-long-running-apps/
- **Du 2023 Multi-Agent Debate** — https://arxiv.org/abs/2305.14325
- **Generative Agents (Park 2023)** — https://arxiv.org/abs/2304.03442
- **MemGPT** — https://arxiv.org/abs/2310.08560
- **mem0 fact extraction** — https://docs.mem0.ai/open-source/features/custom-fact-extraction-prompt
- **IFS Exiles** — https://ifs.space/blog/ifs-exiles
- **Pi.ai** — https://hey.pi.ai/
- **Achriom** — https://www.achriom.com/
- **Letterboxd Personality** — https://medium.com/@alf.19x/letterboxd-personality-type
- **Cursor Agent prompt leaked** — https://leaked-system-prompts.com/prompts/cursor/
- **Claude Code prompt leaked** — https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-code.md
- **OpenCode agents** — https://opencode.ai/docs/agents/
- **EasyClaw 比赛规则** — https://easyclaw.link/zh/hackathon
- **傅盛 14 天养虾叙事** — https://openclaws.io/zh/blog/openclaw-fusheng-easyclaw/
