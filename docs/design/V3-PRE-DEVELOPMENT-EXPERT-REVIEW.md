# ParallelMe V3 · 开发前专家审查与优化方向

> **Revision Notice (V3 开发前定稿)**：本文已被 [`V3-IVY-FINAL-DIRECTION.md`](./V3-IVY-FINAL-DIRECTION.md) 完整吸收并增强（含 5 个锁定决策、七条军规、Liquid Glass 取舍、Memory Consent Gate、四循环留存、心理安全红线、竞品差异化）。本文结论保留作为决策溯源。
>
> 进一步研究档案见 `docs/research/V3/`，竞品全景见 `docs/competitive/V3-COMPETITIVE-LANDSCAPE.md`。

> 这份文档站在两个角色上审视 V3：顶级视觉设计师与顶级产品总监。
> 目的不是夸现有方案，而是在正式开发前明确哪些要保留、哪些要推翻、哪些必须重做。

---

## 0 · 总判定

V3 的产品方向是对的：从「五声 demo」升级为「可管理、可调用、有记忆的内在组阁系统」。

但当前设计还不够狠。

它现在最大的问题不是“细节不够”，而是仍然带着 V2 的表达惯性：

- 视觉上仍有“文艺手账 / 角色心理测试 / 黑客松 demo”的残影。
- 交互上仍有“用户输入一次，看 AI 表演”的残影。
- 字体上仍过度依赖宋体和大标题制造气质，而不是用系统化的 typography 支撑复杂任务。
- 产品上已经提出「阁」这个伟大对象，但首屏、导航、复访、记忆控制还没有彻底围绕「阁」重构。

V3 开发前必须明确：

> **ParallelMe V3 不是更漂亮的五声页面，而是一个本地优先的私人内阁操作系统。**

---

## 1 · 调研基准

本审查参考了以下资料体系：

### 1.1 视觉与可访问性

- W3C WCAG 2.2：文本对比度、非文本组件对比度、文本间距。
- Apple Human Interface Guidelines：颜色应克制、一致，不只靠颜色传达信息；字体必须服务可读性与动态缩放。
- Material Design 3：颜色应成为语义角色系统，而不是孤立色值；色彩角色要对应状态、强调程度和组件用途。
- IBM Carbon / IBM Design Language：产品 UI 应使用 productive typography，阅读和品牌时刻才使用 expressive typography；复杂任务中字体层级要稳定。

### 1.2 色彩心理与情绪设计

- Jonauskaite & Mohr 2025 对 128 年、132 篇颜色与情绪研究的系统综述：浅色更偏正向，红色高唤醒，蓝/绿/蓝绿偏低唤醒。
- Elliot 2015 对颜色心理学研究的综述：颜色心理结论仍需谨慎，不能把颜色当作万能心理治疗工具。

### 1.3 产品交互与粘性

- Nielsen Norman Group：10 usability heuristics、progressive disclosure、cognitive load、onboarding vs contextual help。
- Stanford Behavior Design Lab / Fogg Behavior Model：行为发生需要 Motivation、Ability、Prompt 同时出现；提升 ability 通常比刺激 motivation 更可靠。
- JMIR / BMJ 数字心理健康应用 engagement 研究：心理健康类产品常见低留存原因包括不解决真实问题、不尊重隐私、不可信、紧急时无帮助、与用户生活不贴合。

---

## 2 · 顶级视觉设计师审查

### 2.1 当前色彩方案：方向对，但还不够高级

现有 V3 色彩原则是：

> 墨色定秩序，矿物色定席位。

这个方向必须保留。它比“五个角色五张彩色卡片”成熟很多。

但当前色彩还有三个问题。

#### 问题 A · 纸感过重，容易滑向“文艺手账”

当前实现和文档大量依赖米白、纸、墨、陶土、古金。

这会给产品带来温度，但也有风险：

- 太像 journaling app。
- 太像小红书心理疗愈视觉。
- 太像中文文创品牌。
- 不够像一个能长期处理复杂内在组织的操作系统。

V3 的高级感不应该来自“纸很美”，而应该来自：

> **档案感、秩序感、可追溯感、私密感。**

新的视觉目标：

```text
私人档案室
  + 内阁会议桌
  + 低亮度心理安全空间
  + 本地工作区的清晰控制感
```

不是：

```text
手账
  + 彩色分身卡
  + 情绪 app
  + 文艺 landing page
```

#### 问题 B · 当前实现与 V3 token 不一致

当前代码仍使用 V2 色值：

```text
paper #FAF6EC
accent #C65D4A
gold #C9A227
lay #5B7A99
money #B5862F
future #6B4F8C
```

而 V3 文档使用另一套：

```text
paper.base #F7F0E3
seal.action #8E3F32
gold.attention #A8844D
```

正式开发前必须统一。

V3 不允许：

- CSS 一套色。
- Tailwind 一套色。
- SVG 图一套色。
- 设计文档一套色。

所有颜色必须收束到 `design tokens`，并用语义命名。

#### 问题 C · 对比度有硬伤

按 WCAG AA 普通文本 4.5:1、UI 组件 3:1 的基准，当前部分颜色不能直接用于小字。

实测结果：

| Pair | Contrast | 结论 |
|---|---:|---|
| 当前 `paper/accent #C65D4A` | 3.84 | 小字不合格，只能做大按钮或图形强调 |
| 当前 `paper/gold #C9A227` | 2.24 | 不合格，不能写文字 |
| 当前 `paper/money #B5862F` | 3.03 | 小字不合格 |
| 当前 `paper/lay #5B7A99` | 4.15 | 小字不合格 |
| V3 `paper.base/ink.mute #7C7568` | 4.03 | 小字不合格 |
| V3 `paper.base/gold.attention #A8844D` | 3.05 | 小字不合格 |
| V3 `paper.base/silent #899199` | 2.82 | 不合格 |

结论：

> 席位色可以做点、线、左边框、图形身份；不能默认拿来写正文、小标签和按钮文字。

### 2.2 新色彩方向

V3 色彩应从“暖纸手账”改为“矿物档案系统”。

关键词：

- 石墨
- 雾白
- 青灰
- 暗矿物蓝
- 深苔绿
- 干燥土红
- 老铜金
- 火漆红

#### 推荐 V3 色彩结构

```text
72% neutral archive
  用雾白、石墨、线框、轻微冷灰建立秩序

18% paper / document
  只在议案、裁决、档案原文处出现纸面

7% seat mineral accents
  席位识别，不大面积铺色

3% seal / commitment
  签字、承诺、危险确认
```

#### 推荐基础 tokens

| Token | Hex | 用途 |
|---|---|---|
| `surface.canvas` | `#F4F2EC` | 全局背景，低黄度雾白 |
| `surface.paper` | `#FFFDF7` | 议案纸、档案原文 |
| `surface.mist` | `#E9ECE8` | 次级区域 |
| `surface.sunk` | `#DADDD7` | 凹陷区、历史层 |
| `line.soft` | `#D0D2CB` | 细线 |
| `line.strong` | `#AEB4AA` | 分区线、可交互边界 |
| `ink.core` | `#171817` | 主文字、主按钮 |
| `ink.body` | `#343735` | 正文 |
| `ink.mute` | `#666B66` | meta、小字 |
| `ink.faint` | `#8B9088` | disabled，不写关键信息 |

#### 推荐席位 tokens

| Seat | Hex | 气质 | 用途 |
|---|---|---|---|
| 休整席 | `#4E6870` | 冷静、降噪 | 点、线、左边框 |
| 资源席 | `#7E5F2A` | 老铜、现实 | 点、线、左边框 |
| 自由席 | `#355F4F` | 深苔绿、呼吸 | 点、线、左边框 |
| 依恋席 | `#7F463C` | 干燥土红、关系 | 点、线、左边框 |
| 远望席 | `#5A5064` | 暗紫灰、时间 | 点、线、左边框 |
| 临时席 | `#6F6146` | 中性矿土 | 虚线、候补 |
| 沉默席 | `#636B72` | 暗灰蓝 | 低透明图形，不做小字 |
| 被流放席 | `#633B33` | 深褐红 | 小面积警示 |

#### 推荐状态 tokens

| Token | Hex | 用途 |
|---|---|---|
| `seal.action` | `#82372E` | 签字、承诺 |
| `trace.blue` | `#3E5868` | 证据链 |
| `safe.green` | `#45634D` | 已完成、低风险 |
| `attention.copper` | `#7E5F2A` | 等待转正、需复盘 |

### 2.3 色彩使用规则

必须改：

- 席位色只用于身份，不用于大片背景。
- 所有小字颜色必须过 4.5:1。
- 状态不能只靠颜色，还要有文字、图标、位置。
- `gold` 不再写文字，只做图形强调。
- `seal.action` 只用于承诺、签字、删除、危险确认，不能用成普通 CTA。
- 深色裁决卡保留，但不能频繁出现；它是情绪峰值，不是普通结果区域。

必须删：

- 大面积 beige / cream 主导。
- 手绘框、手写下划线作为主视觉语言。
- 每个席位一张彩色卡的心理测试感。
- 太多圆角胶囊按钮。
- 过度文学化的金色强调。

---

## 3 · 顶级字体设计审查

### 3.1 当前字体问题

当前实现大量使用：

```css
font-display = Source Han Serif SC / Songti SC
font-body = PingFang SC
display = clamp(3.5rem, 11vw, 8rem), letterSpacing -0.04em
```

问题：

1. 宋体使用过多。  
   宋体适合标题、判词、裁决，不适合按钮、表单、标签、复杂状态。

2. 大标题过度强势。  
   V3 不应该继续以「平行的我」大标题作为每个页面的视觉核心。产品本体已经从品牌进入「我的阁」。

3. 中文负字距必须取消。  
   当前 `letterSpacing: -0.04em` 和 `.font-display { letter-spacing: -0.01em }` 会让中文标题更挤，也不利于多设备稳定。

4. `clamp()` 流式大字不适合产品 UI。  
   流式大字适合营销 hero，不适合 V3 的工作台、会议页、档案页。开发时应该使用明确断点 token，而不是让字号随 viewport 连续漂移。

5. 字体没有区分 productive 与 expressive 场景。  
   当前是“所有有气质的东西都用宋体”，这不够专业。

### 3.2 V3 字体原则

V3 应使用“双字体、双场景”：

```text
Productive UI
  用 sans，服务任务、表单、列表、状态、导航。

Expressive Ritual
  用 serif，服务裁决、签字、档案标题、少量心理旁注。
```

### 3.3 推荐字体系统

#### Sans · 产品工作字体

用途：

- 导航
- 表单
- 设置
- 议题列表
- 会议阶段条
- API Key 引导
- 证据链
- 按钮
- 所有密集信息

字体栈：

```css
font-family:
  "Inter",
  "PingFang SC",
  "Noto Sans SC",
  system-ui,
  -apple-system,
  sans-serif;
```

#### Serif · 仪式字体

用途：

- 页面开场短句
- 档案标题
- 席位判词
- NowMe 裁决
- 签字页

字体栈：

```css
font-family:
  "Noto Serif SC",
  "Source Han Serif SC",
  "Songti SC",
  ui-serif,
  serif;
```

#### Mono · 证据与系统字体

用途：

- evidence id
- provider config
- API base URL
- 本地工作区版本
- 导出文件名

字体栈：

```css
font-family:
  "IBM Plex Mono",
  "SF Mono",
  ui-monospace,
  monospace;
```

### 3.4 推荐 type scale

| Token | Size / Line | 用途 |
|---|---|---|
| `type.label` | 12 / 16 | 标签、阶段、meta |
| `type.body-sm` | 14 / 22 | 卡片内短说明 |
| `type.body` | 16 / 26 | 主要正文、席位发言 |
| `type.body-long` | 16 / 28 | 档案、长段落 |
| `type.title-sm` | 18 / 26 | 组件标题 |
| `type.title` | 22 / 30 | 会议阶段标题 |
| `type.headline` | 30 / 38 | 页面标题 |
| `type.display` | 44 / 52 | 只用于空状态 / 首次引导 |
| `type.verdict` | 24 / 36 | 裁决文本 |

规则：

- 中文 letter-spacing 默认 `0`。
- 只有英文 uppercase label 可以轻微 tracking。
- 组件内不使用 hero-scale type。
- 大标题不能出现在卡片内部。
- 表单和按钮不用 serif。

---

## 4 · UI 视觉系统审查

### 4.1 当前 UI 风险

当前 UI 很有记忆点，但更像 V2 黑客松作品：

- Hero 过强。
- 五个头像横排仍像角色入口。
- 卡片和圆角太多。
- 手绘框与纸纹让产品像创意页面，不像长期系统。
- 结果页阶段感强，但用户主持感不够强。
- 「底片 / 纸页 / 自照」命名美，但 V3 进入「阁」之后需要更高的信息清晰度。

V3 应该更冷静、更精准。

### 4.2 V3 视觉隐喻重构

从：

```text
纸页 / 手账 / 五个角色来吵架
```

转为：

```text
阁 / 议案 / 席位 / 质询 / 裁决 / 档案 / 证据链
```

视觉对象应该是：

- 会议桌
- 席位牌
- 议案纸
- 侧边档案夹
- 证据索引
- 火漆签章
- 权力图谱

不是：

- 五彩角色卡
- 普通聊天气泡
- 营销大 hero
- 心理测试结果页

### 4.3 桌面布局方向

V3 桌面端不应继续单列滚动。

推荐三栏：

```text
Left Rail
  我的阁
  反复议题
  会议档案
  设置 / 钥匙

Center Stage
  当前议题
  当前会议阶段
  当前主动作

Right Context
  今日入席
  证据链
  上次承诺
  相关记忆
```

这样才能体现：

- 阁是长期对象。
- 会议是当前任务。
- 记忆是可追溯上下文。

### 4.4 移动端布局方向

移动端保持单列，但必须有底部阶段条：

```text
立案 → 组阁 → 表态 → 质询 → 裁决 → 签字
```

底部只保留当前主动作：

- 确认议题
- 请入席
- 追问
- 标记说中了
- 修订议案
- 签字 / 暂缓

不要让移动端同时承担档案、证据链、权力图谱。

---

## 5 · 顶级产品总监审查

### 5.1 当前产品逻辑最大的问题

V3 文档已经说“阁是产品本体”。

但当前可感知路径仍然像：

```text
输入纠结
→ 5 个我说话
→ 互相戳穿
→ 此刻的我总结
→ 生成纸页
```

这还是 V2。

V3 必须改成：

```text
打开我的阁
→ 选择或提出议题
→ 系统帮我问准议题
→ 系统推荐入席名单
→ 我确认 / 替换席位
→ 开会
→ 我点名追问
→ 我判定哪些说中了
→ 我修订议案
→ 我签字或暂缓
→ 档案写入
→ 阁发生可见变化
```

关键变化：

> 用户不是观众，用户是主持人。

### 5.2 首页必须重做

V3 首页不再是诗意 landing。

首页应该叫：

> 我的阁

首屏必须同时解决三个问题：

1. 我今天能做什么？
2. 我上次说过什么？
3. 我的阁最近发生了什么变化？

推荐首页结构：

```text
Top
  今天要开哪件事？
  [提出新议题 input]

Primary
  待复盘承诺
  反复议题
  最近会议

Cabinet Snapshot
  本周掌权
  本周沉默
  候补转正
  关系最紧张的两席

Local Trust
  模型钥匙状态
  本地记忆状态
  导出 / 删除
```

这比“大标题 + 输入框”更有留存力量，因为用户会看到：

- 它记得我。
- 它在等我回来。
- 我的阁真的变了。

### 5.3 首次引导必须是产品体验，不是设置

API Key 引导不能像开发者配置。

推荐 onboarding：

```text
Step 1 · 给你的阁一把钥匙
  DeepSeek 推荐
  OpenAI-compatible
  演员模式

Step 2 · 测试是否能开会
  一键测试连接
  失败时给清晰解决方案

Step 3 · 选一个低风险议题
  从模板开始，不要求用户立刻暴露隐私

Step 4 · 完成第一次微型会议
  只召集 3 席
  必须让用户点名追问一次
  以一个 24h 小承诺结束
```

不要做长教程。NN/g 对 onboarding 的结论很明确：强推式教程常被跳过、易遗忘、还会打断任务。V3 应使用 contextual help：

- 用户填 key 时解释 key。
- 用户看到席位时解释入席理由。
- 用户准备签字时解释承诺。
- 用户查看档案时解释证据链。

### 5.4 会议流程必须缩短第一轮

当前 V3 流程完整但偏长：

```text
立案
→ 确认议题
→ 组阁
→ 管理席位
→ 初表态
→ 点名追问
→ 交叉质询
→ 质询判定
→ 议案修订
→ 裁决
→ 签字 / 暂缓
```

这个流程适合成熟用户，但不适合第一次使用。

V3 应分两种模式：

#### 快速会议

目标：第一次使用、轻议题、低风险。

```text
立案
→ 三席入席
→ 用户追问一席
→ 裁决
→ 签字 / 暂缓
```

时长：3-5 分钟。

#### 完整内阁会议

目标：反复议题、重大决策、用户主动选择。

```text
立案
→ 组阁
→ 管理席位
→ 表态
→ 质询
→ 议案修订
→ 裁决
→ 签字
→ 阁更新
```

时长：8-15 分钟。

### 5.5 用户参与门要更精确

保留三个必需门：

1. 确认议题。
2. 点名追问。
3. 签字 / 暂缓。

但要改变表达。

不要让用户感觉被流程拖着走。

每个参与门都必须有“为什么现在问你”的理由：

| 阶段 | 用户动作 | 产品解释 |
|---|---|---|
| 确认议题 | 改写一句问题 | 问错问题，后面所有声音都会跑偏 |
| 点名追问 | 选择一个席位继续问 | 你不是看表演，你要主持 |
| 质询判定 | 标记“说中了 / 没说中 / 我不想听” | 阁的记忆来自你的判定 |
| 签字 | 接受或暂缓 24h 动作 | 选择不是正确，选择是承担一点代价 |

### 5.6 记忆必须变成可控产品能力

当前 V3 讲了证据链，但还不够产品化。

用户必须能控制记忆：

```text
系统想记住：
  你在职业议题里反复把“稳定”标成有道理，但签字时总是暂缓。

[记住] [改写] [别记] [只记在这次会议]
```

这是信任关键。

没有记忆控制，用户会害怕它“乱记我”。

### 5.7 粘性的根不是提醒，而是未完成的内在关系

ParallelMe 不能靠 push 和打卡做粘性。

它的粘性应该来自四个循环：

#### Loop A · 承诺复盘

```text
签字 24h 动作
→ 第二天回来问“做了吗”
→ 用户回答
→ 阁更新
```

#### Loop B · 反复议题

```text
同类问题再次出现
→ 系统识别“这不是第一次”
→ 打开旧档案
→ 召集相关席位
```

#### Loop C · 席位成长

```text
临时席多次出现
→ 系统建议转正
→ 用户任命
→ 我的阁变得更像我
```

#### Loop D · 沉默席召回

```text
某个声音长期被压住
→ 系统提醒“要不要请它旁听”
→ 用户让它发言
→ 产生新的自我理解
```

这四个循环的本质是：

> 产品不是提醒用户回来，而是让用户感到“我回来以后，我的阁会继续长出来”。

### 5.8 Fogg 行为模型下的 V3

V3 的核心行为是：

> 用户在有纠结时打开 ParallelMe 并主持一次会议。

#### Motivation

来自真实痛点：

- 焦虑。
- 决策困住。
- 情绪无法命名。
- 想听见自己。
- 想知道过去模式。

#### Ability

必须极低门槛：

- 首屏只问“今天开哪件事？”
- 预设议题可一键进入。
- 第一次会议只 3 席。
- 每阶段一个主动作。
- 不强迫用户先学会“阁”的全套概念。

#### Prompt

不能用廉价 push。

应使用：

- 待复盘承诺。
- 旧议题再出现。
- 未完成档案。
- 本地首页 callback。
- 用户主动设置的复盘时间。

#### Investment

来自用户投入：

- 写下 me profile。
- 任命席位。
- 标记说中了。
- 签字承诺。
- 改写记忆。
- 导出自己的阁。

V3 留存的关键指标不是 session 时长，而是：

> 用户是否愿意让这个系统保存下一条关于自己的真实记忆。

---

## 6 · 大刀阔斧优化决策

### Decision 1 · 推翻 V2 hero 首页

V3 首屏改为「我的阁」工作台。

保留诗性，但降级为局部表达：

- 空状态。
- 裁决页。
- 档案标题。
- 签字页。

### Decision 2 · 色彩从手账纸感改为矿物档案系统

保留纸和墨，但降低暖黄比例。

席位色只做身份系统，不做页面大色块。

### Decision 3 · 字体从“全局宋体气质”改为“双场景 typography”

Productive sans 管任务。

Expressive serif 管仪式。

### Decision 4 · 会议从 AI 表演改为用户主持

用户必须：

- 确认问题。
- 点名追问。
- 标记说中了。
- 签字或暂缓。

### Decision 5 · 记忆从自动总结改为可控写入

任何长期记忆都应该可见、可改、可拒绝、可追溯。

### Decision 6 · 粘性从打卡改为“阁的生长”

核心留存循环：

- 承诺复盘。
- 反复议题。
- 临时席转正。
- 沉默席召回。

### Decision 7 · Onboarding 从教程改为第一次微型会议

不要解释一大堆概念。

用户填 key 后马上完成一次小会议，在使用中理解产品。

---

## 7 · 开发前实践方向

### 7.1 Design System 先行

正式开发前先建立：

- `tokens/colors.ts`
- `tokens/typography.ts`
- `tokens/spacing.ts`
- `tokens/radius.ts`
- `tokens/motion.ts`

并同步：

- Tailwind config。
- CSS variables。
- SVG design docs。
- README 视觉说明。

### 7.2 V3 第一屏先行

优先开发：

```text
我的阁 Home
  + Provider Key 状态
  + 今日开会 input
  + 待复盘承诺
  + 反复议题
  + 最近阁变化
```

而不是先开发会议页。

因为首屏决定用户是否理解 V3 已经不是 demo。

### 7.3 Provider Setup Wizard 作为真正入口

优先开发：

- DeepSeek preset。
- OpenAI-compatible custom。
- 连接测试。
- 演员模式。
- 密钥本地保存说明。
- 删除密钥。

### 7.4 Quick Meeting MVP

先做快速会议：

```text
立案
→ 三席入席
→ 用户追问
→ 裁决
→ 签字 / 暂缓
→ 写入本地档案
```

完整内阁会议作为高级模式。

### 7.5 Memory Consent Layer

每次会议结束后都出现：

```text
这次你的阁想记住三件事
  1. ...
  2. ...
  3. ...

[全部记住] [逐条确认] [这次不记]
```

这会成为 ParallelMe 的信任护城河。

---

## 8 · 开发验收标准

### 8.1 视觉验收

- 所有正文、小标签、按钮文字 contrast >= 4.5:1。
- UI 组件边界 contrast >= 3:1。
- 中文 letter-spacing = 0。
- 组件内不使用 viewport-fluid font size。
- Serif 只用于仪式性文本，不用于表单按钮。
- 页面不能被 beige / cream / gold 支配。
- 席位色不能成为卡片大背景。

### 8.2 产品验收

第一次使用必须在 3 分钟内完成：

```text
填 key / 演员模式
→ 选择低风险议题
→ 看到席位入席
→ 点名追问
→ 得到裁决
```

第一次会议结束必须产生：

- 一个 meeting archive。
- 一个 commitment 或 paused verdict。
- 至少一条用户确认过的 memory candidate。
- 一个首页可见的复访入口。

### 8.3 粘性验收

第二次打开首页必须有：

- 上次承诺复盘。
- 最近会议档案。
- 阁变化提示。
- 继续旧议题入口。

如果第二次打开仍然只是一个空输入框，V3 失败。

---

## 9 · 参考资料

- W3C WCAG 2.2  
  https://www.w3.org/TR/WCAG22/
- Apple Human Interface Guidelines: Color, Typography  
  https://developer.apple.com/design/human-interface-guidelines/color  
  https://developer.apple.com/design/human-interface-guidelines/typography
- Material Design 3 / Android Developers  
  https://developer.android.com/develop/ui/compose/designsystems/material3
- IBM Design Language: Type Scale  
  https://www.ibm.com/design/language/typography/type-scale/
- Carbon Design System: Color Accessibility, Typography  
  https://v10.carbondesignsystem.com/guidelines/accessibility/color/  
  https://carbondesignsystem.com/elements/typography/style-strategies/  
  https://carbondesignsystem.com/elements/typography/type-sets/
- Nielsen Norman Group: 10 Usability Heuristics, Progressive Disclosure, Cognitive Load, Onboarding Tutorials vs Contextual Help  
  https://www.nngroup.com/articles/ten-usability-heuristics/  
  https://www.nngroup.com/articles/progressive-disclosure/  
  https://www.nngroup.com/articles/minimize-cognitive-load/  
  https://www.nngroup.com/articles/onboarding-tutorials/
- Stanford Behavior Design Lab: Fogg Behavior Model  
  https://behaviordesign.stanford.edu/resources/fogg-behavior-model
- Jonauskaite & Mohr: Do we feel colours? A systematic review of 128 years of psychological research linking colours and emotions  
  https://link.springer.com/article/10.3758/s13423-024-02615-z
- Elliot: Color and psychological functioning: a review of theoretical and empirical work  
  https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00368/full
- JMIR: Barriers to and Facilitators of User Engagement With Digital Mental Health Interventions  
  https://www.jmir.org/2021/3/e24387/
- BMJ Evidence-Based Mental Health: Clinical review of user engagement with mental health smartphone apps  
  https://mentalhealth.bmj.com/content/21/3/116
