# V3 Week 5 · 对话感重设计（Conversational Redesign）

> 这份文档是 Week 5 启动前的反思与方向锁定。它不替代 `V3-IVY-FINAL-DIRECTION.md`
> 的产品宪法，而是补一层 Week 2-4 实施后才看清的问题：**当前 /meeting 是
> 一份"5 步式表单"，不是一场"真正的会议"**。Week 5 把它扳过来。

---

## 0 · 自我审视：Week 4 之后看，/meeting 还差什么

四周码了一万行。停下来看，发现一个严肃问题：

> **当前的 Quick / Full Meeting 是离散 stage 翻页，不是会议。**

具体表现：

| 维度 | 当前状态 | 真实会议感 |
|---|---|---|
| 阶段切换 | DocketPaper 整页替换 | 应是连续滚动，前面话还在视野里 |
| 席位发言 | grid 排列 3-5 张静态卡 | 应是轮流"接话"的张力 |
| 用户介入 | 各 stage 各自的小按钮 + 表单 | 应是底部一个常驻"主持人台"，随时能插话 |
| 交叉质询 | A 问 B → 用户判定 → 下一对 | 应是 A 问 → **B 答** → 用户判定 → 自然过渡 |
| 用户角色 | 推流程的 form-filler | 主持人，会议进度由用户的判断推动 |
| 书记 | 不存在（系统侧记还没出现） | 应该有 inline 中性侧记串起整场会议 |
| NowMe | 一锤子结论 | 应是"我听见了"式对话总结 |

**根因**：Week 2-4 我们专注于**功能完整**，把每个产品环节做成"独立组件 +
独立 stage"。每个环节单看是干净的，但拼到一起，用户感受到的是"问卷调查"，
不是"主持会议"。

V3-IVY-FINAL § 1 的战略钉子是：

> **ParallelMe 不是一个 AI 聊天 APP，是一个内在决策的对象系统。**
> 别人卖"AI 陪你做 IFS"，ParallelMe 卖"你召集你自己"。

但"你召集你自己"在当前 UI 里**不够沉浸**。用户更像在"完成一份引导式问答"，
而不是"主持一场属于自己的内在内阁会议"。

---

## 1 · 设计原则（Week 5 三条军规）

### 1.1 一气呵成（Continuity）
会议**不能翻页**。从立案到签字，所有 turns 都在一条向下生长的时间轴上。
回头看上一段是滚动，不是返回按钮。

> 灵感参考：议会 Hansard、Slack thread、Notion AI Meeting Notes 的转录视图、
> Anthropic Artifacts 的 sidecar — **content lives, doesn't get replaced**.

### 1.2 主持人在台（Host Presence）
用户**永远有一处可以开口**。底部主持人台是常驻的 — 不管当前在哪个阶段，
用户都能：
- 输入一句话（自由表达）
- 推进流程（继续 / 进入下一阶段）
- 召唤一席（点名追问）
- 暂停（"等等"）

这把"用户被流程拖着走"反过来：**流程被用户推着走**。

### 1.3 在场（Presence of Seats）
5 席（或 quick 的 3 席）**始终在场**。不只是"轮到他时才出现"，而是顶部一条
持久 dock，发言中的席位有 pulse 标识，沉默的席位也在视野里 — **就像他们
真的坐在桌边**。

用户随时可以点任何席位，触发"点名"——这把 V3-IVY-FINAL 的 4 道参与门
之一（点名追问）从"流程必经环节"扩展为"主持人随时可用的工具"。

---

## 2 · 调研对照：什么样的对话感是有效的

**Pi.ai (Inflection)**
- 慢节奏 + 情感优先 + 用户每次回复都被"接住"
- 启发：每个 turn 之后必须有一个"接得住"的视觉状态

**ChatGPT Voice**
- 边说边响应，可以打断
- 启发：席位发言时用户可以"举手"中断进入点名

**Anthropic Artifacts**
- 主对话流 + 侧 panel 的 living object
- 启发：议案纸是 living object，但放在主时间线左侧固定 ribbon 而不是切换页

**Cursor Chat**
- 单输入框，多种意图（改代码/解释/问问题）
- 启发：HostConsole 的输入框接受多种意图（提问/表态/暂停/继续）—— Week 5
  先做记录用户输入到档案中，意图识别留 Week 6

**议会 Hansard 转录**
- 中性书记 inline 描写（"议长敲槌"、"X 议员鼓掌"）
- 启发：每次阶段切换或重要事件，自动插一条 italic 小字"书记侧记"

**Notion AI Meeting Notes**
- summary / transcript 分离 + transcript 有时间戳
- 启发：会议进行时所有 turn 是 transcript；归档时再生成 summary
  （Week 3 的 /archive 已经做了这条架构 — 现在只需要让"进行时"也长这样）

---

## 3 · 重设计方案

### 3.1 三层视觉结构

```
┌────────────────────────────────────────┐
│  [HEADER · 极简：返回 / 阶段轨]         │
├────────────────────────────────────────┤
│  [SEAT DOCK · 5 席持久]                │
│  [● lay] [● money] [● roam] [● filial] [● future]
│         ↑ pulsing = 发言中
├────────────────────────────────────────┤
│                                        │
│  [TIMELINE · 滚动会议记录]              │
│                                        │
│  ─── 立案 ───                          │
│  议题：……                              │
│                                        │
│  ─── 三席就位 ───  ← 书记侧记          │
│                                        │
│  💬 躺平的我  · 12:30                  │
│  「……」                                │
│                                        │
│  💬 搞钱的我  · 12:31                  │
│  「……」                                │
│                                        │
│  💬 5 年后的我 · 12:31  ★ 最响        │
│  「……」                                │
│                                        │
│  ─── 用户点名 5 年后的我 ───  ← 书记   │
│                                        │
│  ❓ 你问                                │
│  「……」                                │
│                                        │
│  💬 5 年后的我（被点名追问）            │
│  「……」                                │
│                                        │
│  ─── 进入交叉质询 ───                  │
│                                        │
│  ⚔️ 搞钱 → 躺平                       │
│  「……」  ← 质询                        │
│                                        │
│  💬 躺平的我（被质询）                  │
│  「……」  ← 被问席回应（Week 5 新）     │
│                                        │
│  ✓ 你说：问中了                        │
│                                        │
│  ⚔️ 下一对…                            │
│                                        │
│  ─── 此刻的我 ───                      │
│  「我听见了……」                        │
│                                        │
│  → 进入签字（→ Sticky in console）    │
│                                        │
├────────────────────────────────────────┤
│  [HOST CONSOLE · 底部固定]              │
│  [输入框：等等 / 点名 / 我想说…]       │
│  [Stage 主操作按钮，如：进入下一阶段 →] │
└────────────────────────────────────────┘
```

### 3.2 三种 turn 类型

Timeline 上所有内容都是 turn，三种类型：

| Kind | 视觉 | 典型 |
|---|---|---|
| **seat-turn** | 席位色左边线 + 名字 + 时间戳 + 正文 | 席位发言 / 被点名回应 / 被质询回应 |
| **user-turn** | 右对齐 + Serif italic + 「」引号 | 点名问题 / 用户表态 / 自由输入 |
| **scribe-note** | 居中 + 横线 + Serif italic 小字灰 | 阶段切换提示 / 系统中性观察 |

新组件 `TurnEntry` 接受 `kind` prop 渲染三种形态。

### 3.3 阶段切换自动插书记侧记

当 stage 从 statements → interrogation 时，timeline 自动 push:

```
─── 三席表态完毕。轮到主持人点名 ───
```

每个阶段切换都有这种自动侧记。它让"进度推进"从"按钮点击"变成"会议节奏"。

文案库（部分）：

| 触发 | 书记侧记 |
|---|---|
| case → assembly | "议题已立。组阁..." |
| assembly → statements | "X 席就位。表态开始。" |
| statements → interrogation | "三席表态完毕。轮到主持人点名。" |
| user 点名 X | "主持人点名 X。" |
| followup 完成 | "X 回应完毕。" |
| interrogation → cross_exam | "进入交叉质询。本场共 N 对。" |
| cross 第 N 对 | "第 N 对 · A → B" |
| 用户判定 hit | "主持人判定：问中了。" |
| cross_exam → revision | "质询完毕。议案修订环节。" |
| revision_check 完毕 | "议题已确认。请此刻的我裁决。" |
| verdict → signature | "裁决送出。请主持人签字。" |
| 签字 | "主持人已签字。" |
| memory_consent 完成 | "档案归档。" |

### 3.4 主持人台 (HostConsole)

底部固定栏，三件事：

1. **自由输入框**：用户随时可以打字
   - Week 5：输入会被记入档案的 `userMarks` 作为 reply / note
   - Week 6+：意图识别（"等等"暂停、"问 X"召唤、"我不同意"标记表态）

2. **Stage 主操作**：根据当前 stage 显示
   - case: [就这个 ✓]  [改一下]  [其实不是这个]
   - assembly: [确认组阁 →]
   - statements 进行中: 不显示按钮（让席位说完）
   - statements 完成: [开始追问]
   - interrogation 未点名: 显示 5 席 chips 让点
   - interrogation 已问: [够了，进入下一阶段]
   - cross_exam: 不显示按钮（用户判定 inline 在 timeline）
   - cross_exam 完毕: [进入议案修订]
   - revision: 三选一（原 / 修订 / 都记入）
   - verdict: [进入签字]
   - signature: [签字] [暂缓] [我在逃避]
   - memory_consent: 三选一

3. **Stage 状态指示**：左侧"当前在 [阶段名]"

### 3.5 持久席位 dock (SeatDock)

顶部一条 chip 列（mobile 横滚，desktop 全显示）：

- 默认：席位色小 dot + 名字
- 发言中：dot 大 + soft pulse
- 已发言：勾或半透明
- 用户已点名：边框 ring
- 沉默：opacity 50%

点击任何 chip 始终可触发"点名"——即使当前不在 interrogation 阶段。
点了之后：
- 在 statements / 表态完毕：进入 interrogation 并预选这一席
- 在 cross_exam: 暂停当前对，让用户问
- 在 verdict / signature: 提示"裁决已发，要重新讨论吗？" → 退到 interrogation

（Week 5 简化：dock chip 在表态完成前禁用点名，表态后开放）

### 3.6 交叉质询的真对话化

当前：A 问 B → 用户判定 → 下一对。
重设计：A 问 B → **B 真的回应** → 用户判定 → 下一对。

后端改造：每个 cross 事件后，用 callSelf with 特殊 prompt 让 B 回应一句
（≤ 60 字）。新 SSE event：

```
data: {"type":"cross","fromId":"money","toId":"lay","text":"..."}
data: {"type":"cross_response","fromId":"lay","text":"..."}  ← Week 5 新
```

prompt 模板：

```
你是 [B 的人格 prompt]
现在 [A 的名字] 反问了你：「{cross.text}」
用 ≤ 60 字诚实回应。保持你的人格、口头禅、禁忌词。
不要变成同意，不要去说服 A，只把你的真实想法接住一句。
```

这一改让交叉质询从"单向 4 个反问"升级为"4 组对峙问答"，真有会议的质感。

### 3.7 NowMe 的对话化

当前 verdict 是单段 text + 列表。Week 5 文案微调：

- 不再叫"会议决议"，叫"此刻的我"
- 开场固定："我听见了……"（继承 NowMe 的 system prompt 已经倾向这个结构）
- 在 timeline 上展示为 `seat-turn` 类型，但用 surface-deep 背景 + Serif verdict
- 下方仍可"进入签字"

签字本身保持 Week 2 的 SignatureSlip 不变（仪式感够强），但**通过 Console 的 stage action 触发**，不是替换页面。

---

## 4 · 实施范围（Week 5）

### 4.1 必做
1. 反思文档（本文）
2. `MeetingTimeline` + `TurnEntry` + `SeatDock` + `HostConsole` 4 个新组件
3. `/meeting/page.tsx` 重写：所有 stage 用 timeline 表达，不再切换 paper
4. 后端 `cross_response` event 实现
5. 全部 stage 切换的"书记侧记"文案到位
6. 保留所有 Week 2-4 的 4 道参与门逻辑（不丢功能）
7. 保留 quick / full 双 mode

### 4.2 不做（推 Week 6）
1. HostConsole 自由输入的意图识别（Week 5 只做记录）
2. 用户在质询过程中"中断 + 插话"完整功能
3. NowMe 实质重写（Week 5 仅做视觉对话化）
4. 议案修订对话化（保持当前 docket UI）
5. Loop C 临时席（已推）

---

## 5 · 视觉细节锁定

### 5.1 Timeline 间距与字体

- Turn 之间间距 24px
- seat-turn 用 Sans body 16/26
- user-turn 用 Serif italic 16/26
- scribe-note 用 Serif italic 13/20，灰色，居中带横线

### 5.2 SeatDock 颜色

延用 V3 token：
- `--color-seat-rest` / `money` / `roam` / `filial` / `future`
- Pulse 用 `animate-soft-pulse`（已有）
- Ring 高亮用 `ring-ink-core` 1px

### 5.3 HostConsole

- 背景 `paper-lift` + 顶边 `paper-edge`
- 输入框 transparent border-bottom（不画框）
- 主操作按钮 `bg-ink-core`
- 高度固定 ~80px（mobile 96px）

### 5.4 阶段轨

保留 Week 3 的 StageRail 但**移到 header 内**，更小更收敛。当前 stage 不
再 ring 强调，仅 dot 与 label 颜色变化。让 timeline 本身是主视觉。

---

## 6 · 验收标准

完成 Week 5 后，用户在 /meeting 应该能说出：

- "这看起来像一份会议记录在我面前生长，不是一份要填的表"
- "我能随时打开主持人台说话"
- "5 席是真的在桌边，不是按钮"
- "交叉质询是真有问有答，不是机器在自言自语"
- "整个流程像一个会议，不是闯关"

如果能说出这五条，Week 5 成功。

---

## 7 · 文档地图

- 上层宪法：`V3-IVY-FINAL-DIRECTION.md`（不变）
- Week 5 反思：本文
- Week 5 之前的产品交互细则：`V3-INTERACTION-DESIGN-GUIDE.md`、
  `DESIGN-V3-UI-INTERACTION.md`（仍然有效，Week 5 在其上做"叙事整合"）
- 后续 Week 6+：
  - HostConsole 意图识别（"等等" / "我想问"）
  - NowMe 对话式裁决
  - 议案修订对话化
  - Loop C 临时席
