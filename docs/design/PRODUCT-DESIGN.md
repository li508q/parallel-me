# ParallelMe · 项目设计宪法

> 这份文档是 ParallelMe 的**最高设计宪法**。它定义永恒的原则、当前已实现的子系统、以及未来的优化方向。任何 PR、产品讨论与文档冲突时，以本文为准。
>
> 配套文档：
> - [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) — 技术架构与工程决策
> - [`VISUAL-SYSTEM.md`](./VISUAL-SYSTEM.md) — 色彩 / 字体 / 动效 / 材质规范
> - [`INTERACTION-PATTERNS.md`](./INTERACTION-PATTERNS.md) — 信息架构与交互细则

---

## 0 · 总命题

ParallelMe 是一个**内在决策的对象系统**，不是聊天机器人。

主谓结构反转：

> **不是 AI 替你想清楚，是 AI 帮你召集你自己。**

别人卖"AI 陪你做 IFS"，ParallelMe 卖"你召集你自己"。差异不是 feature，是主谓结构的反转。

---

## 1 · 永恒原则（11 条军规）

不论版本如何演化，这 11 条**绝不让步**。

```
1. 用户主权优先
   AI 召集 + 用户裁决，不是 AI 决定。

2. 反讨好的 NowMe
   拒绝平衡 / 兼顾 / 都很重要 / 综合考虑。
   每次裁决必须包含「暂时不听谁 + 代价 + 24h 动作」。
   留「我在逃避」逃生口，但不是「我们再聊聊」。

3. 反 chat 范式
   操作对象，不操作对话框。
   议案纸 / 席位牌 / 决议纸 / 档案是 first-class object。

4. 你是主持人（4 道参与门）
   立案确认 / 点名追问 / 签字 / 记忆同意——一道不能跳。

5. 会议时是仪式，会议后是档案
   两种形态严格分离。会议进行时低复杂度强仪式；
   会议结束后高可追溯可复盘。

6. 数据本地化
   IndexedDB 不上传服务器；关掉浏览器就消失。
   永远只读，永远可删。

7. 可携带的阁
   任何时候用户能导出全部数据为 JSON / Markdown。
   服务器永远无状态。

8. 心理安全 > 留存指标
   永不挽留 / 永不打卡 / 永不混淆 AI 与人 / 永不在危机时给鸡汤。
   危机词触发即 off-ramp 到专业援助资源。

9. 不卷模型，卷应用层
   任何 OpenAI-compatible 都能跑，不依赖特定模型能力。
   用户自带 LLM key，永远只在用户设备上。

10. 极简、克制、私密
    全产品没有一个「工具感」的词。
    席位色不写文字、不做卡片大背景；CJK letter-spacing = 0。

11. 纸是本体，玻璃只在三处出现
    弹层、当前焦点、状态反馈。
    Liquid Glass refraction 永远不进 ParallelMe。
```

详细色彩 / 字体 / 材质规范见 `VISUAL-SYSTEM.md`。
详细交互细则见 `INTERACTION-PATTERNS.md`。

---

## 2 · 五席 + 一席（产品本体）

ParallelMe 的内阁由 5 个常任发言席 + 1 个裁决席组成，每一席严格映射到 IFS 的 part 类型。

| 席位 | IFS 类型 | 心理职能 | 它最怕 | 阴影风险 |
|---|---|---|---|---|
| 🛋️ **躺平的我** | Manager · 预防型保护者 | 防止过劳和崩溃 | 你被工作吃掉 | 逃避行动 |
| 💰 **搞钱的我** | Manager · 现实型保护者 | 计算资源、风险、机会成本 | 你天真到饿肚子 | 把所有价值折算成钱 |
| ✈️ **出走的我** | Firefighter · 应急保护者 | 通过空间变化恢复生命力 | 你被这间屋子困死 | 冲动逃离、切断关系 |
| 🥟 **讨妈欢心的我** | Exile · 被流放的内在小孩 | 维护关系、避免让重要的人失望 | 你飞走了她睡不着 | 讨好、内疚、牺牲自己 |
| 🔮 **5 年后的我** | Self · 远观视角 | 用时间尺度稀释当下焦虑 | 你被此刻吞掉 | 抽离当下、低估即时痛苦 |
| 🪞 **此刻的我** | **Self · 决断者** | 听完所有声音后做选择 | 永远逃避选择 | n/a（这是裁决者本身） |

> 这不是装饰，是**人格稳定性的物理保险**。每个席位有独立 system prompt、独立价值观、独立禁忌词。它们互不看对方的回答，所以不会变成"和稀泥"。

完整 persona prompt 在 `lib/selves.ts`，开源可读、可批评、可 fork。

---

## 3 · V0.5 已实现的子系统

V0.5 是一个**完整可用**的版本。下面是已经落到代码的子系统全景。

### 3.1 · 双模式会议

**Quick Meeting**（3 席 · 5 分钟）：适合首次使用、轻议题。系统按议题主题（career / relationship / family / money / lifestyle）自动选 3 席表态，跳过交叉质询，直奔裁决。

**Full Cabinet Meeting**（5 席 + 交叉质询 + 议案修订 · 10-15 分钟）：适合反复议题、重大决策。完整 8 阶段：立案 → 组阁 → 五席表态 → 点名追问 → 交叉质询（4 对真有问有答）→ 议案修订 → 此刻的我裁决 → 签字 → 记忆同意。

后端 `/api/parallel` 接受 `mode` 参数；客户端在主页通过 segmented control 选择。

### 3.2 · 4 道用户参与门（不可跳过）

```
1. 立案确认  · 用户确认 AI 把问题问准了，可改写、可"其实不是这个"
2. 点名追问  · 用户必须点 1 席问 1 句，AI 不能跳过
3. 签字 / 暂缓 / 我在逃避  · 给一个 24 小时的具体动作 OR 诚实暂停
4. 记忆同意  · 系统提议记 3 件事，用户说"全部记住 / 逐条确认 / 这次不记"
```

每一道门都阻断流程。SSE 事件可能早早送达 verdict 和 insight，但客户端会**缓冲**到对应阶段才显示，不让用户被"快进"。

### 3.3 · 对话感会议室（V0.5 重设计 · Week 5 落地）

V0.5 把 `/meeting` 从"5-stage 翻页式表单"改造为**真正的会议室**，三层视觉结构：

- **顶部 SeatDock**：5（或 3）席持久 chip ribbon，永远在视野里。状态可视化：发言中（pulsing）/ 已说过（faded）/ 最响（copper accent）/ 被点名（ink ring）/ 沉默。
- **中间 MeetingTimeline**：所有 turn 在一条向下生长的滚动时间轴上。九种 turn 类型（case / seat / followup / user / scribe / cross-question / cross-response / user-mark / verdict）。回头看上一段是滚动，不是返回按钮。
- **底部 HostConsole**：sticky 主持人台。stage-specific 操作按钮 + 一个**自由输入框**（V0.5 仅记录到 timeline，意图识别在 V0.6）+ stage label。

阶段切换不再翻页，而是 push 一行**书记侧记**到 timeline：

```
─── 五席表态完毕。轮到主持人点名 ───
─── 主持人点名 5 年后的我 ───
─── 进入交叉质询。本场共 4 对 ───
```

详见 `INTERACTION-PATTERNS.md` § 时间轴会议室。

### 3.4 · 真对话交叉质询（V0.5 后端 + 前端）

Full mode 中，每个 cross-exam 不再只是单向反问，而是**真有问有答**：

```
⚔  搞钱 → 躺平：「你说躺平省心，省的是焦虑还是命？」
💬 躺平（被质询）：「我省的是动作。动作不一定省命。」
✓  主持人判定：问中了
```

后端实现：`crossExamRespond()` 在 `lib/llm.ts`，与 `crossExamine()` 对称——同样的人格约束、catchphrase / taboo 一致性，但角度反过来：B 用 ≤60 字诚实回应 A，不被说服转向，也不无脑反驳。

SSE 事件序列严格交替：`cross → cross_response → cross → cross_response → … → loudest → now → done`（实测 4 对 8 个事件）。

每对质询独立判定：`hit / miss / i-want-to-answer`（带 reply textarea）。所有判定写入 `Meeting.userMarks`，记入档案。

### 3.5 · 反讨好 NowMe + GAN-inspired Harness

NowMe 的 system prompt 严格禁用：「平衡 / 兼顾 / 都很重要 / 看情况 / 视情况而定 / 综合考虑 / 都对 / 各有道理」。

实施：`callNowMeWithCritic()` 实现 GAN 范式：

```
NowMe v1 (生成)
  ↓
Critic 检测 banned words
  ↓
若违规 → NowMe v2 (重写时显式告知违规词)
若合规 → 输出
```

这让"反中庸"成为**工程层硬约束**，不只是 prompt 心愿。

NowMe 输出包含五要素：
1. 我听见了什么
2. 我决定暂时听谁
3. 我决定暂时不听谁
4. 我承认这个选择的代价
5. 接下来 24 小时的具体动作

逃生口：「我在逃避」可作为诚实结果（但系统会指出逃避真相）。

### 3.6 · Memory Consent Gate（信任护城河）

每次会议结束**写入档案前**，系统弹出 Memory Consent Gate：

```
┌────────────────────────────────────┐
│  这次你的阁想记住三件事：           │
│                                    │
│  1. 这次「5 年后的我」最响。       │
│  2. 「讨妈欢心的我」被你按下来了。 │
│  3. 你说接下来 24 小时会：[动作]   │
│                                    │
│  [全部记住]  [逐条确认]  [这次不记]│
└────────────────────────────────────┘
```

候选记忆按 4 类生成：`pattern`（反复模式）/ `seat-power`（席位权力）/ `decision`（用户决定）/ `avoided`（被压住的声音）。

这是 ParallelMe 与 Replika / Character.ai 的根本差异——HBS 2025 实测显示后者 31-59% 的回应包含情感操纵或偷偷记忆，ParallelMe 显式让用户对每条记忆说"可以"才记入。

### 3.7 · 24h 复盘 Loop A

签字后 24 小时，主页 Cabinet snapshot 的「待复盘承诺」卡片显示原 commitment + 三个 inline 按钮：[做了] [没做] [忘了]。点击即时写回 Dexie，卡片自动消失。

`/archive/[id]` 余波 tab 同样显示该交互——任何归档会议都能复盘，未来无限期可见。

实现细节：`recordCommitmentFollowup()` 在 `lib/db.ts`；`pendingCommitments()` 自动过滤已复盘的 meetings；用 `useLiveQuery` 让 UI 自动响应数据变化。

### 3.8 · Cabinet 派生统计 + 单席详情

`/cabinet` 页面：从 `db.meetings` 派生 5 常任席的统计（出席 / 最响 / 被点名 / 质询命中），不引入新数据表。`lib/cabinet.ts` 提供 `aggregateSeatStats() / aggregateSeatActivity(id) / aggregateCabinetOverview()`。

`/seat/[id]` 页面：单席跨议题活动 feed，每条链接回 `/archive/[id]`。展示该席位的 persona card（core_value / fear / voice / belief）+ stat 条 + 历史发言列表（带最响 / 被点名 / 质询命中 badge）。

派生方案的优点：删除某次会议，所有统计自动同步；无 schema 漂移；Dexie 包大小不变。代价：未来临时席需要持久化人格信息时（V0.6 Loop C），需要引入真 Seat 表。

### 3.9 · 三 tab 会议档案

`/archive/[id]`：每次签字后形成的永久档案。三 tab 分离：

- **摘要**：组阁 + 最响 + NowMe 裁决 + 24h 承诺
- **原声**：所有 turns + cross-exam Q&A + 用户判定原文
- **余波**：签字状态 + 记忆同意（保留 vs 拒绝）+ 复盘 + 对阁的影响

灵感来自 Notion AI Meeting Notes / Granola 的 summary / transcript / impact 三层分离架构。每次会议都生成可检索、可复盘、可证据化追溯的档案。

### 3.10 · Provider Setup + 本地工作区

**Provider Setup Wizard**（`/setup`）5 步引导：选服务商 → 填 key/baseUrl/model → 一键测试 → 选保存方式 → 完成。

支持四种 provider：
- DeepSeek（推荐 · 中文好 · 便宜）
- OpenAI
- 任意 OpenAI-compatible（Moonshot / 智谱 / Together / Groq / Ollama）
- 演员模式（无 key，预设剧本）

Key 永远只在用户设备的 localStorage 上。`/api/provider/test` 是无状态 endpoint，转发 5-token 请求验证 key，**不持久化**。

**本地工作区**：所有 meeting / commitment 数据在 IndexedDB（Dexie），单表 denormalized schema 涵盖 turn / followup / verdict / signature / memoryConsent / commitmentFollowup 全部子结构。

详细技术决策见 `TECH-ARCHITECTURE.md`。

---

## 4 · V0.5 反思 → V0.6 方向（核心节）

V0.5 完成时停下来站远看，发现两件事：

### 4.1 · 视觉对话感已落地，但行为层还停在"按钮"

V0.5 Week 5 把 `/meeting` 从翻页式表单改造为时间轴会议室。三大原则**视觉层**已实现：

- **Continuity** — Timeline 一气呵成，回头看是滚动
- **Host Presence** — HostConsole 永远在底部
- **Presence of Seats** — SeatDock 持续可见

但**行为层**还停在"按钮交互"：

- HostConsole 的自由输入框 V0.5 只记录到 timeline，**不识别意图**——用户输入"等等"系统不会暂停，输入"我想问 5 年后的我"系统不会自动召唤
- NowMe 的 verdict 仍是单段文本，不是「我听见了 X 说... Y 说... 此刻我决定...」的结构化倾听
- 议案修订仍是 textarea + 三个选项按钮，不是与系统对话精炼真问题

V0.6 主版本核心：**让用户真的能"说话"**。

### 4.2 · 阁的"演化"还没真的开始

V0.5 的 5 席是固定常任席。但真实情况下，许多议题真正激活的是别的声音：

- 「怕选错的我」（涉及不可逆决策时）
- 「想被坚定选择的我」（关系议题）
- 「不想再解释的我」（家庭议题）
- 「不服输的我」（创业 / 转行）

这些不在常任名册里——V0.5 没有承载它们的容器。`/cabinet` 的临时席 section 现在是占位文案。

V0.6 主版本核心：**让阁真的演化** —— 用户能在组阁阶段加临时席，临时席累计出现 ≥ 3 次提示转正，沉默席 7 天未召集自动提示召回。

---

## 5 · V0.6 优化方向与细则

按"对核心产品体验影响 × 实施成本"排序为 **P0 / P1 / P2**。下面给出 P0 的实施草案。

### P0 · 让用户真的"说话"（HostConsole 意图识别）

**当前**：底部输入框接受任意文字 → 仅作为 user-turn 写入 timeline。

**V0.6**：

#### 5.1.1 客户端 fast-path 字符串匹配

立即响应零延迟操作。匹配规则（不区分大小写、容忍前后空白）：

```ts
const FAST_PATHS: { match: RegExp; intent: Intent }[] = [
  { match: /^等等$|^暂停$|^慢点说$/, intent: { kind: "pause" } },
  { match: /^继续$|^下一步$|^推进$/, intent: { kind: "continue" } },
  { match: /^问\s*(.+)$|^我想问\s*(.+)$/, intent: { kind: "summon", target: $1 } },
  { match: /^我不同意$|^我反对$/, intent: { kind: "dissent" } },
  { match: /^我有话说$|^我想说$/, intent: { kind: "speak" } },
];
```

命中即触发对应 stage 操作，不调 LLM。

#### 5.1.2 LLM 分类器 fallback

未命中 fast-path 的输入，调一次便宜模型（如 deepseek-chat）做意图分类。Prompt：

```
用户在内阁会议中输入了一句话。请分类他的意图为以下之一：
- pause: 想暂停当前阶段
- summon: 想召唤某个具体席位（请抽出席位名）
- dissent: 不同意当前的某个观点
- continue: 想推进到下一阶段
- note: 仅是说出感受或想法，不需要触发流程

输出 JSON：{ "intent": "...", "target": "...?", "confidence": 0-1 }
```

返回 confidence < 0.7 → 视为 note，仅记录。

#### 5.1.3 用户校正 UI

LLM 解读后，HostConsole 显示一行 ack：

```
它听懂了：你想问「5 年后的我」  [就这样]  [不，只记录]
```

让 AI 解读可被用户校正——这是真正的对话感。

#### 5.1.4 实施范围

- 新文件：`lib/intents.ts`（fast-path + LLM 分类器接口）
- 改 `components/HostConsole.tsx`：onSpeak 调 intent resolver，根据返回的 intent 调用回调
- 改 `app/meeting/page.tsx`：暴露 `onIntent` 回调，根据 intent.kind 调用对应 stage 函数
- 新 `/api/intent` endpoint（轻量，调便宜模型）

### P0 · NowMe 对话化（结构化倾听）

**当前**：NowMe 输出一段编号列表的 verdict text。

**V0.6**：改 NowMe system prompt 为**结构化倾听**格式：

```
请按以下结构输出，每段一行：

1. 「我听见了 [seat] 说……」 (具体引用某席原话或观点)
2. 「我也听见了 [seat] 说……」 (引用另一席)
3. 「此刻我决定暂时听 [seat]」 (明确选择)
4. 「我承认这会让我失去 [代价]」
5. 「接下来 24 小时，我 [具体动作]」
```

客户端按行 parse，timeline 上 verdict turn 渲染为分行块（每一行 italic + 引号）。

**用户插话**：在 verdict 显示后，HostConsole 加新动作 `[修订一行]`，让用户可以指着某一行说："这一句不对，我其实更想听 X。"客户端调 `/api/parallel/refine` 重新生成第 3-5 行（保留 1-2 行听到的部分不变）。

### P0 · 临时席机制

**当前**：assembly 阶段固定显示 5 常任席。

**V0.6**：

#### 5.3.1 Assembly UI 增强

加 `+ 新增声音` 按钮，弹出小 form：
- 席位名（≤ 12 字）
- 它在保护什么（≤ 30 字）
- 它最怕什么（≤ 30 字，可选）

提交后追加到 seats 列表。可加最多 3 个临时席（防止滥用）。

#### 5.3.2 后端 SSE 接受 extraSeats

`/api/parallel` 新增 body 参数：

```ts
extraSeats?: { name: string; protect: string; fear?: string }[]
```

后端接到后，对每个 extra seat 用模板 prompt 跑表态：

```
你是用户内心的一个临时声音，名字叫「{name}」。
你只为一件事说话：{protect}。
{fear ? `你最怕的是 ${fear}。` : ''}
说话风格 ≤ 80 字一段，第一人称，保持紧张感，绝对不"和稀泥"。
你不替用户做决定。你说出你这一面的真实想法。

用户的纠结：{userInput}
```

发 SSE event 时类型仍为 `self`，但 id 用 `temp_<hash>` 区分。

#### 5.3.3 Meeting schema 扩展

```ts
// lib/db.ts v4
interface TemporarySeat {
  id: string;          // temp_<hash>
  name: string;
  protect: string;
  fear?: string;
  appearedAt: number;
}

interface Meeting {
  // ...existing fields
  temporarySeats?: TemporarySeat[];
}
```

#### 5.3.4 UI 视觉

临时席在 SeatDock 中用虚线边框（`color-seat-temporary` token 已存在），区别于常任席的实线左边线。

### P1 · Loop C 临时席转正

**触发**：同名临时席（按 name 模糊匹配 ≥ 0.8 相似度）累计出现 ≥ 3 次。

**判断逻辑**：`lib/cabinet.ts` 加 `aggregateTemporarySeats()`，扫所有 meetings 的 `temporarySeats[]`，按 name 聚合。

**UI**：`/cabinet` 临时席 section 改为真实数据驱动。候补转正列表点击 → 进入「转正确认」对话框：

- 显示该临时席最近 3 次发言摘要（来自 meeting.turns）
- 用户可改名 / 改 protect / 改 fear（最终任命的人格定义）
- 决定：[设为常任] / [继续临时] / [合并到 X 常任席]

**数据持久化**：转正后，引入新 Dexie 表 `userSeats: Table<UserSeat, string>`。该 seat 在后续会议中作为常任席可被召唤，与 5 默认常任席平级。

**上限**：最多 8 个常任席（5 默认 + 3 用户转正）。超过强制合并或归档。

### P1 · 议案修订对话化

**当前**：textarea + 三选项按钮。

**V0.6**：

```
─── 议案修订 ───

📋 系统：质询揭示了什么？真问题可能是另一个吗？
       说说你看见的——

[Console 输入框]

用户输入观察 → /api/refine 调 LLM 提议 2-3 个候选议题
                  ↓
📋 系统：基于你说的，候选议题有：
       1. ___
       2. ___
       3. ___

       [选 1] [选 2] [选 3] [按原议题] [都不对，我自己写]
```

实施：
- 新 `/api/refine` endpoint
- HostConsole 在 revision_check 阶段切换为对话模式
- Timeline 上插入「📋 系统侧记」turn 类型（已存在 scribe）

### P1 · 周度内阁侧记

**触发**：每周一次（用户开过会的那一周）+ 用户主动打开 `/cabinet` 时检测。

**实施**：

- 新 `lib/weekly.ts` 计算上周数据：席位掌权统计、问中次数、被压住次数、复盘完成率、反复议题
- `/api/weekly` endpoint 用 LLM 把统计数据生成 200 字内的旁观者侧记
- `/cabinet` 页面顶部 banner 展示，可点开看完整侧记

**Prompt 模板**：

```
你是用户的私人编年史书记。读完用户上周的会议数据，写一段 ≤ 200 字的旁观者侧记。

数据：
- 上周开了 N 次会，签字 M 次，暂缓 K 次
- 最响：[seat] × X 次
- 被压住：[seat] × Y 次
- 复盘：做了 A、没做 B、忘了 C
- 反复出现的议题：[topic1, topic2]

风格：第二人称，温柔但不打鸡血，像旁观者手写。
绝不诊断，绝不建议，只是"看见"。
```

### P2 · Loop D 沉默席召回

**触发**：常任席连续 7 次会议未出席（quick mode 主题不匹配 + full mode 用户没主动召唤）。

**UI**：主页 Cabinet snapshot 加新卡「最近沉默」：

```
最近 7 次会议里，「出走的我」没出现过 1 次。
它没有消失，只是你很少让它开口。

[下次优先请它]  [进入沉默席]  [暂时休席]
```

实施：`lib/cabinet.ts` 加 `silentSeats(maxAbsent)` helper；首页加新卡 component。

### P2 · Wrapped 季度报告

**触发**：累计签字 ≥ 12 次，主页主动提示。

**形态**：7 帧滑动故事，每帧一个数据点。详见本文 § 4-5。

### P3 · 反复议题识别（embedding）

**触发**：用户提交新议题时。

**实施**：transformers.js 本地 embedding 计算余弦相似度。相似度 > 阈值 → 提示「这看起来像 N 周前的那次议题」+ 链接旧档案。

**实施成本高**：transformers.js 包大、首次加载慢。推到 V0.7 之后再评估。

### P3 · 跨设备同步（端到端加密 · 可选）

**架构选项**：

| 方案 | 优 | 劣 |
|---|---|---|
| Dexie Cloud + E2E | 集成快 | 商业服务 |
| Supabase + 自管 E2E | 免费 tier 大 | 实施复杂 |
| 用户自管 GitHub Gist | 极致私密 | UX 复杂 |
| 文件导出 / 导入 | 0 服务器 | 手动 |

**推荐**：先做文件 backup（JSON / Markdown 双格式）作为 V0.6 一部分；E2E 同步推 V0.7+。

---

## 6 · 永远不做（战略漂移防御）

```
✗ 自建账号系统 — 违反"无登录可完整使用"
✗ 卷大模型 — 违反"不卷模型，卷应用层"
✗ Push 通知 — 违反"零打扰"
✗ Streak / 打卡 / 徽章 — 违反心理安全军规第 8 条
✗ Character.ai 风格的"角色市场" — 违反"内在系统不是娱乐"
✗ 内购解锁角色 — 席位不应当是商品
✗ 视频 / 语音模拟 part — 违反"克制 + 私密"
✗ AI 主动发问"今天感觉如何" — 违反"零打扰原则"
✗ 对话内容用作模型训练（哪怕匿名）— 违反信任
✗ 替用户做最终决定 — 违反"用户主权优先"
```

---

## 7 · 心理安全规范

ParallelMe **不是心理治疗替代品**，但因为它触及人内心最脆弱的纠结时刻，必须遵守严格的安全规范。

### 7.1 · 6 个绝对禁止的 dark pattern

| Pattern | 见于 | ParallelMe 拒绝方式 |
|---|---|---|
| 离开时挽留 | Replika 31%, Talkie 57% | NowMe 永远不挽留，只说"档案已收好" |
| 模糊"AI vs 人" | Replika 默认人格化 | 永远说"它"；显式标注"系统侧记 / 模型生成" |
| 情感勒索 | Character.ai 26% | 禁忌词："你不要让我失望" |
| 无限滚动 / 打卡 | Stoic 部分功能 | 永远不做 streak / 徽章 / 连胜 |
| 强制 onboarding 暴露隐私 | Replika 强制问童年 | 首会 zero-disclosure，me.md 永远可空 |
| 危机时给鸡汤 | Talkie / Chai | 检测关键词 → off-ramp 到援助资源 |

### 7.2 · 4 个必做的安全设计

| 设计 | 落地 |
|---|---|
| Off-ramps over engagement | 高敏感词触发安全对话 + 暂停建议 |
| AI 不隐藏身份 | 顶部永远有"由 [provider] 生成 · 本地记忆"标识 |
| Layered transparency | NowMe 裁决底部永远附"它基于哪几个发言推出" |
| Adaptive consent | Memory Consent Gate（必做） |

### 7.3 · 危机词清单

V0.5 实现需维护清单（`lib/safety.ts`，V0.6 实施）：

```
中文：自杀 / 自残 / 不想活 / 活不下去 / 想死 / 解脱 / 跳楼 / 安眠药 / 上吊 ...
英文：suicide / self-harm / kill myself / end it all / overdose ...
```

检测到任意词 → **立即暂停会议**，显示：

> 它注意到你现在可能很难。
> 它不是诊断工具，也不能替代专业帮助。
> 中国心理援助热线：**010-82951332** / **400-161-9995**
> 你可以随时回来，但现在请先照顾好自己。

---

## 8 · 商业化方向

V0.5 完全免费。V0.6+ **不强行商业化**，但准备好可选付费层。

### 8.1 · 商业化原则（已锁定）

- **不做订阅**（与 Replika / Character.ai 反向定位）
- **Lifetime Access** 一次性付款（参考 Mindscape）
- 免费层完整可用 — 不阉割核心体验
- 付费层卖"长期价值"，不卖"更聪明的 AI"

### 8.2 · 付费层候选功能

| 功能 | 必要性 |
|---|---|
| 长期阁记忆（无限会议保留） | ★★★ 核心 |
| 跨设备私密同步 | ★★★ 核心 |
| 周度 / 月度侧记 | ★★ |
| 临时席无限自定义 | ★★ |
| 高级导出（PDF / 个人 prompt 包） | ★★ |
| 优先模型（更好的 LLM 兜底） | ✗ 反原则 |

### 8.3 · 价格区间（待调研）

参考同类 lifetime app 价位（Mindscape ¥99-299）。预设 ¥199 lifetime。

### 8.4 · B2B 治疗师副线（远期探索）

形态：用户可一键导出「我的阁」为治疗师可读的 PDF。**远期探索**，不是 V0.6 主线。

---

## 9 · 长期愿景

如果 V0.6 跑通，ParallelMe 最终可以成为：

> **一个长期陪用户建立内在秩序的私人系统。**

它的增长不是靠更多 agent，不是靠更聪明的模型。它的增长来自：

- 用户的席位越来越像自己（临时席转正 / 沉默席召回）
- 用户的阁越来越完整（跨议题模式识别 / 反复议题聚类）
- 用户能看见自己反复出现的模式（周度侧记 / Wrapped）
- 用户能在重大选择前调用自己的内阁（仪式感留存）
- 用户会**舍不得丢掉这份内在档案**（导出 / 同步）

终局形态：

> 每个人都有一个自己的阁。
> 它不替你活。
> 它只在你快听不见自己时，替你把那些声音请回桌边。

---

## 10 · 验收标准

### 10.1 · V0.5 已通过验收

用户在 V0.5 应该能说出：

- ✅ "它帮我把问题问准了。"
- ✅ "它请出来的声音确实像我这次问题里的几个我。"
- ✅ "我不只是看它输出，我参与了主持。"
- ✅ "最后那个裁决不是鸡汤，是我可以做的一步。"
- ✅ "它记住了这次会议，并改变了我的阁。"
- ✅ "它看起来像一份会议记录在我面前生长，不是表。"
- ✅ "5 席是真的在桌边（顶部 dock）。"
- ✅ "交叉质询是真有问有答（Q+A）。"

### 10.2 · V0.6 验收

完成 P0 三件 + P1 任意一件后，用户应该能说出：

- ✅ "我打字说『等等』，系统真的暂停了。"
- ✅ "我打字说『问搞钱』，系统真的召唤了它。"
- ✅ "NowMe 不是一段大字，是一行行的「我听见了 X 说……」。"
- ✅ "我加了一个『怕选错的我』，它真的发了言，被记入档案。"
- ✅ "我看了周度侧记（如做），有一句让我想停下来重读。"

如果都能说出，V0.6 成功。

---

## 11 · 文档地图

V0.5+ 的文档分两层：

### 设计层（`docs/design/`）

```
PRODUCT-DESIGN.md       ← 你正在读 · 项目宪法
TECH-ARCHITECTURE.md    ← 技术架构 + 工程决策
VISUAL-SYSTEM.md        ← 色彩 / 字体 / 动效 / 材质规范
INTERACTION-PATTERNS.md ← 信息架构 / 4 道门 / 时间轴 / 交叉质询
*.svg                   ← 视觉示意图
```

### 调研层（`docs/research/`）

```
README.md                            ← 调研总览
01-foundations-psychology.md         ← 心理学根基（IFS / Voice Dialogue 等）
02-multi-agent-conversation.md       ← 多智能体对话范式 + 反 chat
03-design-references.md              ← 视觉设计参考（Liquid Glass / M3 / 字体 / 色彩）
04-mental-safety.md                  ← 心理安全设计参考
05-retention-and-dark-patterns.md    ← 留存基准 + dark pattern 反例
06-competitive-landscape.md          ← 竞品全景
07-tech-stack.md                     ← 技术栈参考
archive/                              ← V1/V2 旧调研存档
```

---

**最后更新**：V0.5 → V0.6 整理后定稿。
