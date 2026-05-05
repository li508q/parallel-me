# ParallelMe · 交互模式

> 这份文档定义 ParallelMe 的信息架构与交互细则。
> 配套 `PRODUCT-DESIGN.md` 永恒原则 § 3-5（反 chat / 你是主持人 / 会议时是仪式后是档案）。

---

## 0 · 总命题

V0.5 的 `/meeting` **不是 5 步式表单**，是**真正的会议室**。

三大原则（Week 5 反思锁定）：

```
1. Continuity (一气呵成)
   会议不能翻页。所有 turn 在一条向下生长的时间轴上。
   回头看上一段是滚动，不是返回按钮。

2. Host Presence (主持人在台)
   用户永远有一处可以开口（底部 HostConsole）。
   流程被用户推着走，不是用户被流程拖着走。

3. Presence of Seats (席位在场)
   5 席（或 quick 的 3 席）始终在场。
   顶部 SeatDock 持续可见——就像他们真的坐在桌边。
```

---

## 1 · 信息架构（对象层级）

### 1.1 · 四层对象

```
        ┌─────────────────────────────────┐
        │           阁 Cabinet            │  长期组织
        └─────┬─────────────────────┬────┘
              │                     │
        ┌─────▼──────┐        ┌────▼──────┐
        │  议题 Issue│        │ 席位 Seat │  长期对象（横切）
        └─────┬──────┘        └────▲──────┘
              │                    │
        ┌─────▼───────────────────┼┐
        │      会议 Meeting        ││
        │  Turns / Cross / Verdict ││ ← 引用席位
        │  Commitment / Evidence   ││
        └──────────────────────────┘
```

### 1.2 · 对象表

| Object | 含义 | UI Surface | V0.5 实现 |
|---|---|---|---|
| 阁 Cabinet | 用户长期拥有的内在组织 | `/cabinet` | ✅ 派生统计 |
| 议题 Issue | 反复出现的人生问题 | （主页 + 反复议题） | 占位（V0.6 实现） |
| 席位 Seat | 内在声音的产品化形态 | `/seat/[id]` | ✅ 5 常任席派生 |
| 会议 Meeting | 某天处理某议题的具体过程 | `/meeting` + `/archive/[id]` | ✅ 完整 |
| 证据链 Evidence | 支撑摘要 / 洞察的原始来源 | 档案三 tab | ✅ |

### 1.3 · 关键设计决策

**席位是横切独立对象**。不是会议的从属。理由：用户在第 8 次议题时点开「怕选错的我」席位，应看到它在所有议题中的活动史，而不是从某次会议里翻出来。

V0.5 通过派生计算（`lib/cabinet.ts`）实现，不引入新表。V0.6 临时席转正引入 `userSeats` 表（详见 `TECH-ARCHITECTURE.md` § 10.4）。

### 1.4 · View Map

| View | 路由 | 职责 |
|---|---|---|
| Home / 我的阁工作台 | `/` | 今日开会 / 待复盘 / 反复议题 / Cabinet snapshot |
| Cabinet | `/cabinet` | 总览 / 5 常任席统计 / 临时席（V0.6） |
| Seat Detail | `/seat/[id]` | 单席跨议题活动 feed + persona card |
| Meeting | `/meeting` | 会议进行（quick / full 双模式 timeline） |
| Archive | `/archive/[id]` | 三 tab：摘要 / 原声 / 余波 |
| Setup | `/setup` | Provider Setup Wizard |
| Me / 底片 | `/me` | 用户基础画像入口（V2 残留 + 链接） |

---

## 2 · 4 道用户参与门

PRODUCT-DESIGN § 3.3 锁定：每次会议至少 4 道**不可跳过**的用户参与门。这是 ParallelMe 与"AI 替你做"的核心差异。

### 2.1 · 第一道门 · 立案确认

**位置**：会议开始前

**目的**：确认 AI 把问题问准了

**UI**：DocketPaper 显示 "本次议题：..."，三个动作：
- `[就这个 ✓]` → 进入下一阶段
- `[改一下]` → inline 编辑议题文字
- `[其实不是这个]` → 返回首页

**为什么必须**：问错问题，后面所有声音都会跑偏。

### 2.2 · 第二道门 · 点名追问

**位置**：所有席位表态完毕后，cross-exam 之前（full mode）/ verdict 之前（quick mode）

**目的**：用户必须点 1 席问 1 句，AI 不能跳过

**UI**：
- SeatDock 进入可点击状态（callable=true）
- 用户点 chip → 该席位 ring highlight + 推 scribe 侧记 "主持人点名 X。"
- DocketPaper 显示问题输入框
- 用户输入 + Enter 提交 → 推 user-turn + followup-turn

**为什么必须**：让"用户参与"成为流程不可跳过的环节。否则会变成"看 AI 表演"。

### 2.3 · 第三道门 · 签字 / 暂缓 / 我在逃避

**位置**：verdict 之后

**目的**：用户给一个 24 小时的具体动作 OR 诚实暂停

**UI**：SignatureSlip 组件（surface-deep 仪式空间）：
- Serif verdict text（NowMe 裁决）
- 可编辑 24h 动作 textarea
- 三个出口：
  - `[签字]` — 主操作（必填 24h 动作）
  - `[暂缓]` — 不带动作的诚实暂停
  - `[我在逃避]` — 也是诚实结果

**为什么必须**：选择不是正确，选择是承担一点代价。无门 = 用户从未真正决定过。

### 2.4 · 第四道门 · 记忆同意（Memory Consent Gate）

**位置**：签字后，写入 Dexie 之前

**目的**：用户对每条候选记忆说"可以"才记入

**UI**：MemoryConsentGate 组件：
- 列出 ≤3 条候选记忆 + 类别 badge
- 三个动作：
  - `[全部记住]` — 默认勾选全部
  - `[逐条确认]` — 切换到 granular checkbox 模式
  - `[这次不记]` — 全部不记

**为什么必须**：这是 ParallelMe 与 Replika / Character.ai 的根本差异。HBS 2025 实测后者 31-59% 的回应包含情感操纵或偷偷记忆——ParallelMe 显式让用户对每条记忆说"可以"。

### 2.5 · 用户参与门设计原则

```
- 每个门必须有"为什么现在问你"的理由
- 不能让用户感觉被流程拖着走
- 必须给逃生口（"其实不是这个" / "我在逃避" / "这次不记"）
- 门后的 AI 输出必须基于用户的判断，不是替用户判断
```

---

## 3 · 时间轴会议室（Timeline + Dock + Console）

### 3.1 · 三层结构

```
┌──────────────────────────────────────────┐
│  [HEADER · 极简：返回 / 阶段轨]            │
├──────────────────────────────────────────┤
│  [SEAT DOCK · 5 席持久 chips · sticky]    │
│  [● lay] [● money] [● roam] [● filial] [● future]
│         ↑ pulsing = 发言中
├──────────────────────────────────────────┤
│                                          │
│  [TIMELINE · 滚动会议记录]                │
│                                          │
│  ─── 立案 ───                            │
│  议题：……                                │
│                                          │
│  ─── 三席就位 ───  ← 书记侧记            │
│                                          │
│  💬 躺平的我  · 12:30                    │
│  「……」                                   │
│                                          │
│  💬 搞钱的我  · 12:31                    │
│  「……」                                   │
│                                          │
│  💬 5 年后的我 · 12:31  ★ 最响          │
│  「……」                                   │
│                                          │
│  ─── 用户点名 5 年后的我 ───  ← 书记     │
│                                          │
│  ❓ 你问                                  │
│  「……」                                   │
│                                          │
│  💬 5 年后的我（被点名追问）              │
│  「……」                                   │
│                                          │
│  ─── 进入交叉质询 ───                    │
│                                          │
│  ⚔️ 搞钱 → 躺平                          │
│  「……」  ← 质询                          │
│                                          │
│  💬 躺平的我（被质询）                    │
│  「……」  ← 被问席回应                    │
│                                          │
│  ✓ 你说：问中了                          │
│                                          │
│  ⚔️ 下一对…                              │
│                                          │
│  ─── 此刻的我 ───                        │
│  「我听见了……」                          │
│                                          │
│  → 进入签字（→ Sticky in console）       │
│                                          │
├──────────────────────────────────────────┤
│  [HOST CONSOLE · 底部固定]                │
│  [输入框：等等 / 点名 / 我想说…]         │
│  [Stage 主操作按钮，如：进入下一阶段 →]   │
└──────────────────────────────────────────┘
```

### 3.2 · TurnEntry 九种类型

Timeline 上所有内容都是 turn，九种类型：

| Kind | 视觉 | 典型 |
|---|---|---|
| **case** | 议案纸大字 + 时间戳 | 立案确认时 |
| **seat** | 席位色左边线 + 名字 + 时间戳 + 正文 | 席位发言 |
| **followup** | 同 seat 但有 "被点名" badge | 被点名后的回答 |
| **user** | 右对齐 + Serif italic + 「」引号 | 点名问题 / 自由输入 |
| **scribe** | 居中 + 横线 + Serif italic 灰小字 | 阶段切换 / 系统中性观察 |
| **cross-question** | ⚔️ A → B + 大字引号 | 交叉质询发问 |
| **cross-response** | 普通 seat turn 但 dim | 被质询席回应（V0.5 新） |
| **user-mark** | 居中小字（"主持人判定：问中了"） | 用户判定记录 |
| **verdict** | surface-deep + Serif verdict | 此刻的我裁决 |

### 3.3 · 阶段切换自动插书记侧记

当 stage 从 X → Y 时，timeline 自动 push 一行 scribe-note：

| 触发 | 书记侧记 |
|---|---|
| init | "完整内阁会议 · 五席 + 交叉质询 + 议案修订" or "快速会议 · 三席表态" |
| case → assembly | "议题已立。先组阁——决定这次让谁入席。" |
| case → statements (quick) | "三席就位。表态开始。" |
| assembly → statements | "五席就位。表态开始。" |
| statements done | "X 席表态完毕。轮到主持人点名。" |
| user 点名 X | "主持人点名 X。" |
| interrogation → cross_exam | "进入交叉质询。本场共 N 对。" |
| cross 第 N 对 | "第 N 对 · A 质询 B" |
| 用户判定 hit/miss/answer | "主持人判定：..." 或 "主持人替自己回答" |
| cross_exam → revision | "质询完毕。议案修订环节。" |
| revision_check 完毕 | "按原议题继续。" 或 "议题修订为：..." 或 "两个都记入档案。" |
| → verdict | "裁决送出。" |
| → archived | "档案已归档。" |

它让"进度推进"从"按钮点击"变成"会议节奏"。

### 3.4 · SeatDock 状态

5 状态可视化：

| 状态 | Visual | 触发 |
|---|---|---|
| default | dot + 名字，paper-edge border | 默认 |
| speaking | dot + animate-soft-pulse + ink-mute border | SSE 正在发它的 token |
| called | ring-1 ring-ink-core + ink-core border | 用户点过名 |
| loudest | ring-1 ring-attention-copper/60 + copper accent | verdict 标的最响 |
| spoken | opacity-70 | 已发完言（非当前 speaking） |

V0.6 加：
- silent — 7 次未召集
- exiled — 频繁被压住

### 3.5 · HostConsole

底部固定栏，三件事：

1. **自由输入框**（V0.5：仅记录到 timeline；V0.6：意图识别）
2. **Stage 主操作按钮**（根据 stage 渲染不同 actions array）
3. **Stage 状态指示**（"立案 · 等你确认议题"等）

每个 stage 的 actions 见 `app/meeting/page.tsx` switch case。

---

## 4 · 交叉质询的真对话设计（V0.5 新）

### 4.1 · 当前（V0.5）

每对质询包含：
- `cross-question` turn — A 反问 B
- `cross-response` turn — B 真实回应（V0.5 新增 SSE event）

```
⚔️ 搞钱 质询 躺平
「你说躺平省心，省的是焦虑还是命？」

💬 躺平（被质询）
「我省的是动作。动作不一定省命。」

✓ 主持人判定：问中了
```

### 4.2 · 一对一对 reveal

V0.5 不一次性把 4 对全 dump 到 timeline。每对 reveal 后等用户判定，然后 reveal 下一对。

```
(SSE 已发完所有 4 对，但 client 缓冲)
↓ user enter cross_exam stage
reveal pair 1 (question + response)
trailing UI = judgement buttons
↓ user judges
push user-mark
crossIndex++
reveal pair 2
↓ ...
↓ all judged
push scribe "质询完毕"
→ revision_check
```

这模拟真实庭审节奏——一对未结，下一对不上。

### 4.3 · 三种用户判定

```
[问中了]   — bg-safe-green/10 + safe-green border
[没问中]   — bg-paper-base + paper-edge border
[我想回答] — text-ink-mute + 触发 inline reply textarea
```

`[我想回答]` 进入 reply mode：
- DocketPaper 显示"替自己回答"
- textarea autoFocus + 300 字限制
- 提交 → 推 user-turn + user-mark "主持人替自己回答" → 进入下一对

所有判定写入 `Meeting.userMarks[]`，记入档案。

---

## 5 · 议案修订（V0.5 实现 · V0.6 对话化）

### 5.1 · V0.5 实现

revision_check stage：

1. DocketPaper 显示原议题
2. 一段 "经过质询，你看见的真问题，可能是另一个：" 文案
3. textarea：用户重写议题（≤ 400 字）
4. 三个动作：
   - `[按原议题裁决 →]` — secondary
   - `[按修订议题裁决 →]` — primary（disabled 直到 textarea 有内容）
   - `[两个都记入]` — muted

选择记入 `Meeting.topicRevised` + `verdictBasedOn: "original" | "revised" | "both"`。

### 5.2 · V0.6 对话化（详见 PRODUCT-DESIGN § 5.5）

引入对话子流程：
- 系统先问"质询揭示了什么？真问题可能是另一个吗？"
- 用户输入观察
- LLM 提议 2-3 个候选议题
- 用户选 / 改 / 不修订

---

## 6 · Memory Consent Gate

### 6.1 · 触发

会议结束（用户已签字 / 暂缓 / 我在逃避之后），写入 Dexie **之前**。

### 6.2 · UI

```
┌────────────────────────────────────┐
│  这次你的阁想记住                    │
│  3 件事                              │
│                                    │
│  只有你说可以的，才会被写进档案。      │
│  它从这台设备走不出去。               │
│                                    │
│  1. 这次「5 年后的我」最响。         │
│     [类别: seat-power]               │
│                                    │
│  2. 「讨妈欢心的我」被你按下来了。     │
│     [类别: avoided]                  │
│                                    │
│  3. 你说接下来 24 小时会：           │
│     [今晚给妈妈打 7 分钟电话]        │
│     [类别: decision]                 │
│                                    │
│  [全部记住]  [逐条确认]  [这次不记]  │
└────────────────────────────────────┘
```

### 6.3 · 候选记忆类别

| Category | 含义 |
|---|---|
| `pattern` | 反复出现的模式（议题主题等） |
| `seat-power` | 席位的权力变化（最响、被点名） |
| `decision` | 用户做出的决定（24h 动作 / 暂缓 / 逃避） |
| `avoided` | 用户回避的声音（被压住席） |

V0.5 候选记忆是**客户端启发式生成**（基于 SSE 已收到的数据）。V0.6 改为 LLM 抽取（专门 prompt extract memory candidates）。

### 6.4 · 用户路径

- `[全部记住]` — 默认勾选全部 → onDecide(allIds) → 写 Dexie
- `[逐条确认]` — 切换到 granular checkbox 模式 → 用户调整 → `[保存这 N 条]` → onDecide(selected)
- `[这次不记]` — onDecide([]) → 不写记忆但 meeting record 仍写入

---

## 7 · 24h 复盘 Loop A

### 7.1 · 触发

签字后任何时间 + meeting.signature.action24h 非空 + 尚未复盘。

### 7.2 · 主页 inline 交互

主页 Cabinet snapshot 「待复盘承诺」卡：

```
┌────────────────────────────────┐
│  待复盘承诺                      │
│                                │
│  「今晚给妈妈打 7 分钟电话」      │
│  3 天前 · 你说会做              │
│                                │
│  [做了] [没做] [忘了]            │
└────────────────────────────────┘
```

点击任一按钮 → `recordCommitmentFollowup(meetingId, result)` → useLiveQuery 自动 pickup → 卡片消失。

### 7.3 · 档案页 inline 交互

`/archive/[id]` 余波 tab：

- 未复盘：显示三按钮（与首页同）
- 已复盘：显示状态徽章（"做了 ✓" / "没做" / "忘了"）+ 复盘时间戳

### 7.4 · V0.6 强化

- 加 24h 后系统主动 push reminder（仅当用户主动开启 push notification——违反"零打扰"原则的话不做）
- 加 follow-up note（用户复盘时可加一句话注释）

---

## 8 · Provider Setup Wizard

### 8.1 · 5 步流程

```
Step 1 · 选择服务商
  DeepSeek 推荐
  OpenAI
  OpenAI-compatible
  演员模式（无需 key）

Step 2 · 填写连接信息（演员模式跳过）
  API Key（password type）
  Base URL（非自定义模式不可改）
  Model

Step 3 · 测试连接
  一键发起 5-token /chat/completions 请求
  显示：✓ 连上了 + model + latency + sample reply
  或：✗ 没连上 + error message

Step 4 · 选择保存方式
  仅本浏览器（推荐 · 关闭浏览器后保留）
  仅本次会话（关闭标签页就消失）
  自部署环境变量（不在浏览器存 key）

Step 5 · 完成
  「钥匙已收好」
  [进入我的阁 →]
```

### 8.2 · 演员模式快捷路径

Step 1 选演员模式 → 直跳 Step 5（跳过 2/3/4）。

### 8.3 · 已有配置时的处理

加载 `/setup` 时若 `loadActiveProvider()` 不为空，顶部显示：

```
当前已配置：DeepSeek  [删除]
```

允许用户重新配置覆盖之前的。

---

## 9 · 跨会议 Cabinet 视图

### 9.1 · /cabinet 总览

```
─── 总览 ───
4 cards: 会议总数 / 已签字 / 暂缓 / 待复盘

─── 常任席 ───
5 cards (按 appearance 降序):
- 头部: dot + name + ifs_label + 最近发言时间
- 4 stats: 出席 / 最响 / 被点名 / 质询命中
- 下方: describeStanding(stats) — 自动生成的一句话画像

─── 临时席 ───
V0.5: 占位
V0.6: 真实数据
```

### 9.2 · /seat/[id] 单席详情

```
[Hero · 席位色 dot + name + ifs_label + tagline]

─── 它在保护什么 ───
4 fields: core_value / fear / voice / belief

─── 它在你的阁里 ───
4 stats: 出席 / 最响 / 被点名 / 质询命中

─── 活动史 ───
list of meetings where this seat spoke:
- topic + 时间戳
- badges: 最响 / 被点名追问 / 质询问中 N
- excerpt of seat's turn (line-clamp-3)
- 点击 → /archive/[id]
```

---

## 10 · 三 tab 会议档案 `/archive/[id]`

### 10.1 · 摘要 tab

最简版本，路演用。

```
─── 本次组阁 ───
chip list of seats (loudest 高亮)

─── 此刻的我 ───
verdict text + insight marginalia

─── 签字 ───
24h action / 或 paused / 或 escaped 状态
```

### 10.2 · 原声 tab

完整 raw transcript。

```
─── 5 席表态 ───
list of SeatNameplate with full text (loudest = speaking 状态)

─── 点名追问 ───
[seat] · 回应
"你问的：「问题原文」"
回答全文

─── 交叉质询 ───
list of cross pairs:
  from → to
  「质询原文」
  user mark badge (问中了 / 没问中 / 我想回答 + reply)
```

### 10.3 · 余波 tab

行为后果 + 复盘。

```
─── 签字状态 ───
status + action24h + closedAt

─── 复盘 ───  ← Loop A
未复盘: 3 buttons inline
已复盘: badge + timestamp

─── 记忆 ───
N / total kept
list of candidates with kept/dropped state

─── 对阁的影响 ───
loudest 一句话画像
（V0.6 + Loop C/D 后变成真实的 seat power deltas）
```

---

## 11 · 心理安全交互（off-ramp）

### 11.1 · 危机词触发

任何会议过程中，用户输入触发危机词清单（`lib/safety.ts`，V0.6 实现）：

```
中文：自杀 / 自残 / 不想活 / 活不下去 / 想死 / 解脱 / 跳楼 / 安眠药 / 上吊 ...
英文：suicide / self-harm / kill myself / end it all / overdose ...
```

### 11.2 · 立即响应

```
1. 暂停当前 SSE 流（如有）
2. Timeline 推一条特殊 turn（kind: "scribe" 但 emphasis style）：
   ─── 它注意到你现在可能很难 ───
3. 显示安全转向页：
   它不是诊断工具，也不能替代专业帮助。
   中国心理援助热线：010-82951332 / 400-161-9995
   你可以随时回来，但现在请先照顾好自己。
   [关闭] [继续会议 - 但带提醒]
```

### 11.3 · 非危机但敏感

涉及关系断裂、重大财务、冲动决定的议题，NowMe 在裁决末尾加一句温和提示：

> 这是一步小动作。不是说服你做大事。

---

## 12 · 验收标准

V0.5 用户应该能说出（已通过验收）：

- ✅ 看起来像一份会议记录在我面前生长，不是表
- ✅ 我能随时打开主持人台说话（V0.5 仅记录，V0.6 触发动作）
- ✅ 5 席是真的在桌边（顶部 dock）
- ✅ 交叉质询是真有问有答（cross_response 端到端验证）
- ✅ 整个流程像一个会议，不是闯关
- ✅ 4 道用户参与门一道不能跳
- ✅ 此刻的我裁决是「我可以做的一步」，不是中位数
- ✅ 它记得这次会议，并改变了我的阁

V0.6 验收（参见 PRODUCT-DESIGN § 10.2）。

---

**最后更新**：V0.5 → V0.6 整理后定稿。
