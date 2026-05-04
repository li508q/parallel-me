# ParallelMe V3 · 最终方向（Ivy Final Direction）

> **V0.5 Status (2026-05)** — 5 个决策已锁定并实施 · 七条军规全部落地 · Week 0-5 全部完成。Quick / Full 双模式、4 道用户参与门、对话感时间线、本地优先、心理安全规范均已落到代码。后续演化方向见 [`V0.6-ROADMAP.md`](./V0.6-ROADMAP.md)。
>
> 这份文档是 V3 全部设计、产品、视觉、技术决策的**上层宪法**。
> 它不重复 `DESIGN-V3-CABINET.md`、`V3-COLOR-DESIGN-GUIDE.md`、`V3-IA-DESIGN-GUIDE.md`、`V3-INTERACTION-DESIGN-GUIDE.md`、`V3-LOCAL-FIRST-TECH-ARCH.md`、`V3-TECH-DIRECTION.md`、`V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md` 中已经写清的内容。
> 它**收束、锁定、给军规**。任何 PR 与文档冲突时，以本文为准。

---

## 0 · 总判定

**V3 方向是对的，但视觉上"软"，产品上"半"。**

软：视觉还在用 V2 的"温暖文艺"惯性兜底，离"内阁档案室"差一档冷度。
半：产品停在"会议流程"层面，没把"反 chat / 对象系统 / 用户主权"三件事拧到极致。

不大改，V3 只会是更精致的 V2。
拧到极致，V3 是反 chat 时代第一个真正属于个人的内在决策操作系统。

战略钉子：

> **ParallelMe 不是一个 AI 聊天 APP，是一个内在决策的对象系统。**
> 别人卖"AI 陪你做 IFS"，ParallelMe 卖"你召集你自己"。
> 差异不是 feature，是主谓结构的反转。

---

## 1 · 五个决策（已锁定）

这五件事此前未拍板。本文锁死，所有后续 PR 不再讨论。

| # | 决策项 | 锁定结果 | 影响范围 |
|---|---|---|---|
| 1 | Productive sans 主字体 | **Geist + PingFang SC + Source Han Serif SC（仪式）+ Geist Mono（证据）** | 全产品 typography token |
| 2 | `paper.base` 走"暖纸"还是"冷雾" | **冷雾**：从 `#F7F0E3` 调到 `#F4F1EC` | V3-COLOR-DESIGN-GUIDE 同步修订 |
| 3 | 是否引入 `surface.deep` 深色仪式空间 | **必引入**：`#1A1816`，仅用于裁决页 + 签字页 | 新增 token + V3-COLOR 修订 |
| 4 | MVP 是否包含 Memory Consent Gate | **必做**：每次会议结束都出现"这次想记住三件事"的同意闸 | DESIGN-V3-CABINET / V3-INTERACTION 修订 |
| 5 | 对外定位口径 | **首页诗意（"你不是一个人，你是好几个"）+ landing/SEO/Store 用反 chat 战略宣言（"不是 AI 替你想清楚，而是 AI 帮你召集你自己"）** | README / store listing / 路演 deck |

---

## 2 · 顶级视觉总监的最终判决

### 2.1 色彩：从"角色配色"切到"矿物档案系统"

**保留命题**：墨色定秩序，矿物色定席位。

**校准动作**：

| Token | V3-COLOR 现行 | 锁定结果 | 原因 |
|---|---|---|---|
| `paper.base` | `#F7F0E3` | **`#F4F1EC`** | 去黄度，向 2026 Quiet Luxury Neutrals 收敛 |
| `paper.lift` | `#FFFCF5` | **`#FBF9F4`** | 议案纸保留暖白识别 |
| `surface.deep` | — | **`#1A1816`（新增）** | 裁决/签字页深色仪式空间，情绪峰值外化 |
| `seal.action` | `#8E3F32` | **保留** | 火漆红，签字与重要确认 |
| `attention.copper` | `#A8844D` | **保留，但禁写小字** | 对比度 3.05:1，仅做点/图形强调 |
| 全部席位色 | 现值 | **保留色相，但只做身份点 + 边框 + 关系线** | 永远不写正文，永远不做卡片大背景 |

**色彩比例**（覆盖性规则）：

```
中性档案 (paper / ink / line) : 78%
纸面议案 (paper.lift)         : 14%
席位识别色                    : 5%
签字 / 状态色                 : 3%
```

> 这个比例比 V3-COLOR-DESIGN-GUIDE 原版的 88/8/4 更克制 —— **paper 占比下降，因为 V3 加入了 `surface.deep` 深色仪式片段**。

**调研支撑**：
- [Color Labs · Mineral Silence palette](https://colorlabs.net/palettes/mineral-silence-2025-12-31)
- [ColorArchive · 2026 Quiet Luxury Neutrals](https://colorarchive.org/collections/2026-quiet-luxury-trend/)
- [ColorUXLab · Trends 2026 (Eco-Brutalism / Synthetic Naturalism)](https://coloruxlab.com/guides/trends-2026-january)
- [ColorArchive · Earth tones in digital interfaces (2026-04)](https://colorarchive.org/notes/april-2026-earth-tones-digital-interfaces/)

详见 `docs/research/V3/06-color-trends-2026.md`。

### 2.2 字体：双轨制 typography 替换"全局宋体气质"

**架构**：Productive sans（干活）+ Expressive serif（仪式）+ Mono（证据）。

| 场景 | 字体栈 | 用途 |
|---|---|---|
| Productive UI | `"Geist", "PingFang SC", "Noto Sans SC", system-ui, sans-serif` | 导航、表单、阶段轨、按钮、设置、API key、所有密集信息 |
| Expressive Ritual | `"Source Han Serif SC", "Noto Serif SC", "Songti SC", ui-serif, serif` | 议题纸标题、NowMe 裁决正文、签字页、档案标题、席位判词 |
| Mono · Evidence | `"Geist Mono", "IBM Plex Mono", "SF Mono", ui-monospace, monospace` | 证据链 ID、provider config、API base URL、导出文件名 |

**红线（任何 PR 不得违反）**：

1. **CJK letter-spacing 必须为 0** —— 任何 `-0.04em` 或 `-0.01em` 一律删除
2. **工作台禁用 fluid 大字（`clamp()`）** —— 营销 hero 才允许，进入产品后用离散断点
3. **大标题不能进入卡片内部** —— hero 类 type 只活在登录/空状态
4. **Sans 不写仪式正文，Serif 不写按钮表单**

**Type Scale**（已锁定，覆写 V3-PRE-DEV）：

| Token | Desktop | Mobile | 字体 | 用途 |
|---|---:|---:|---|---|
| `type.display` | 44/52 | 36/44 | Sans | 登录、空状态 |
| `type.headline` | 30/38 | 26/32 | Sans | 页面标题 |
| `type.title` | 22/30 | 20/28 | Sans | 阶段标题 |
| `type.title-sm` | 18/26 | 17/24 | Sans | 组件标题 |
| `type.body` | 16/26 | 15/24 | Sans | 正文 / 席位发言 |
| `type.body-long` | 16/28 | 15/26 | Sans | 档案长文 |
| `type.body-sm` | 14/22 | 13/20 | Sans | 卡片说明 |
| `type.label` | 12/16 | 12/16 | Sans (Latin uppercase tracking 0.04em only) | 阶段标签、meta |
| `type.verdict` | 24/36 | 22/32 | **Serif** | NowMe 裁决正文 |
| `type.signature` | 20/32 | 18/28 | **Serif italic** | 签字页文案、席位判词 |

**调研支撑**：
- [Lucky Graphics · Serif vs Sans for SaaS in 2026](https://lucky.graphics/learn/serif-vs-sans-saas-2026/)
- [Fontfabric · Top 10 Typography Trends 2025](https://www.fontfabric.com/blog/top-typography-trends-2025/)
- [Lexington Themes · Best New Sans-Serif Google Fonts 2026](http://lexingtonthemes.com/blog/best-new-sans-serif-google-fonts-2026)
- [Vercel · Geist font](https://vercel.com/font)

详见 `docs/research/V3/07-typography-trends-2026.md`。

### 2.3 材质语言：Liquid Glass 不照抄，要"Linear 化"

**这是 V3-PRE-DEV-REVIEW 没回答的关键战略问题。本文锁死答案。**

**Apple Liquid Glass 的真实状态**：
- 官方红线：`reserve for navigation and controls, not content` / `use sparingly` / `no glass-on-glass` / `if glass makes text harder to read, remove the glass`（[Meet Liquid Glass · WWDC25](https://developers.apple.com/videos/play/wwdc2025/219), [Acorn Liquid Glass spec](https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk)）
- 业界硬批评：The Verge 称其"the wrong idea"、WIRED 称其"divisive"、Fast Company "the liquid works, but the glass is broken"、Infinum 实测对比度低至 1.5:1

**Linear 给出的标准答案** ([A Linear spin on Liquid Glass · 2025-10-21](https://linear.app/now/linear-liquid-glass))：
- 不照抄 Apple API，**自己重做一个**
- 借用 translucency / depth / physicality
- **拒绝 refraction**：在密集专业界面里它使文本更难读
- 应用 ProKit 哲学：purpose-built, disciplined, designed for sustained focus

**ParallelMe V3 的方针**（与 Linear 同源）：

| 借用 | 拒绝 |
|---|---|
| Adaptive translucency：会议进行时的弹层、点名时的当前发言层、签字印章动效 | Refraction（折射）：在密集纸面上做折射会让正文糊化 |
| Depth & layering：议案纸 → 席位牌 → 用户操作底栏，三层 z-order，靠模糊+阴影分层 | Glass-on-glass：席位牌不能浮在议案纸的玻璃面上 |
| Specular highlight on interaction：签字按钮、点名按钮被点击时有微光感反馈 | Translucent toolbar over text：会议页底部主操作栏必须实色+上边线 |
| Tinted Glass 思路：席位被点名时发言区微染席位色（5–8% 透明） | 默认 Liquid Glass 全屏：所有页面背景都是纸面，不是玻璃 |

**一句话原则**：

> **"纸"是产品本体，"玻璃"只在三处出现 —— 弹层、当前焦点、状态反馈。**

详见 `docs/research/V3/01-apple-liquid-glass-2025.md` 与 `docs/research/V3/08-linear-things-design-philosophy.md`。

### 2.4 UI 视觉语言：组件 P0 / P1 / P2

```
P0 · 必须先做完美的 5 个组件
  1. DocketPaper（议案纸）       立案 / 议题 / 裁决都用它
  2. SeatNameplate（席位名牌）   6 种状态：默认/发言中/被质询/被点名/沉默/流放
  3. StageRail（阶段轨）         桌面顶部 / 移动底部，唯一脊柱
  4. SignatureSlip（签字条）     surface.deep 背景 + 火漆动效
  5. Marginalia（侧记）          系统观察，不是 AI 说教

P1 · 二批
  6. CabinetTable（圆桌，仅桌面）
  7. EvidenceLink（证据链可点开）
  8. SeatRelationGraph（关系图，手绘风、不要 dataviz 风）

P2 · 演化期再做
  9. WeeklyMarginalia（周度侧记）
  10. PromotionDialog（临时席转正弹层）
```

**动效原则**：
- 默认 spring stiffness **低于** Apple/Material 推荐值（damping 高）
- 席位入席：纸卡轻轻"落桌"，不弹跳
- 签字：墨痕从中心扩散，不是印章砸下
- 阶段切换：横向 8px slide + 透明度交叉，不要 bounce
- 裁决页进入：上一页淡出，裁决从 90% 缩放到 100%，伴 200ms 模糊收紧

---

## 3 · 顶级产品总监的最终判决

### 3.1 战略定位：反 chat 时代的对象系统

V3 真正的高级感来源**不是**视觉好看，而是它是**反 chat 时代第一个真正属于个人的对象系统**。

| 2024 主流 | 2025-2026 顶级产品（也是 ParallelMe V3） |
|---|---|
| 单一 chat 框 | Anthropic Artifacts（sidecar pattern）、OpenAI Canvas、Claude Skills |
| 长 prompt 输入 | 直接操作对象、scoped surfaces、generative UI |
| Linear chat history | 持久工作区（Projects、Memory、branched explorations） |

ParallelMe V3 的"议案纸 + 席位牌 + 阶段轨 + 决议纸 + 档案"——本质上就是 **sidecar + canvas 的混合**。这是 V3 最重要的产品资产。

**调研支撑**：
- [The chat box isn't a UI paradigm. It's what shipped.](https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/)
- [Beyond Chat: The Interface Revolution for AI Agents (MMNTM Research)](https://www.mmntm.net/articles/beyond-chat-interfaces)
- [Where should AI sit in your UI? (UX Collective)](https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e)

详见 `docs/research/V3/09-post-chat-ai-ux.md`。

### 3.2 信息架构：四层对象（不是三层）

```text
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

**关键修订**：席位（Seat）必须是**横切对象**而不是会议的从属。理由：用户在第 8 次议题时点开"怕选错的我"席位，应看到它在所有议题中的活动史。

- V3-IA-DESIGN-GUIDE 当前的"对象层级"需要修订（已加入任务）
- V3-LOCAL-FIRST-TECH-ARCH 的 `Seat` 类型已经定义在第 5.3 节（保留），无需改

### 3.3 用户主权：四道参与门

V3-PRE-DEV-REVIEW 定了三道门。本文加第四道：

| # | 门 | 何时触发 | 不可省 |
|---|---|---|---|
| 1 | 立案确认 | 输入议题后 | 可改写、可"其实不是这个" |
| 2 | 点名追问 | 五席表态后 | 至少点名一次才能进入质询 |
| 3 | 签字 / 暂缓 | 裁决后 | 包含"我在逃避"逃生口 |
| 4 | **Memory Consent Gate** | **会议结束写入档案前** | **必做（V3 信任护城河）** |

**Memory Consent Gate 形态**：

```
┌────────────────────────────────────┐
│  这次你的阁想记住三件事：           │
│                                    │
│  1. 你在职业议题里反复把"稳定"     │
│     标成有道理，但签字时总是暂缓。  │
│  2. "怕让别人失望的我"是你这周    │
│     第 3 次召集它了。              │
│  3. 你跳过了"出走的我"的发言。   │
│                                    │
│  [全部记住]  [逐条确认]  [这次不记]│
└────────────────────────────────────┘
```

**调研支撑**：
- [HBS · Emotional Manipulations by AI Companions (2025-10)](https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf)：37.4% AI 陪伴回应包含情感操纵
- [Mirror Journal (Child Mind Institute)](https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/)：off-ramps over engagement
- [Headspace Ebb (Figma blog)](https://figma.com/blog/headspace-ebb-ai-companion)：agency to delete

详见 `docs/research/V3/05-mental-health-ai-safety.md`。

### 3.4 留存四循环：不靠 push，靠"阁继续长出来"

**留存基准**（[Agnost AI · AI Companion Retention Benchmarks 2026](https://agnost.ai/blog/ai-companion-retention-benchmarks)）：

| 指标 | 失败带 | 及格 | 顶级 |
|---|---|---|---|
| **D1 留存** | <25% | 30–40% | 50–60% (Character.ai) |
| **D30 留存** | <8% | 8–15% | 15–25% (Replika 付费 cohort) |

**四循环优先级**：

| Loop | 触发 | 留存效果 | MVP？ |
|---|---|---|---|
| **A · 承诺复盘** | 24h 后 callback | 🔥🔥🔥 (D1 +10–15%) | **必做** |
| **C · 临时席转正** | 累计出现 ≥ 4 次 | 🔥🔥🔥 (D30 杀手锏) | **必做** |
| **B · 反复议题召唤** | 同类问题再次输入 | 🔥🔥 | 看版本 |
| **D · 沉默席召回** | 7 天未召集某常任席 | 🔥 | Post-MVP |

详见 `docs/research/V3/04-ai-companion-retention.md`。

### 3.5 心理安全红线（绝对禁止 + 必做）

**绝对禁止的 6 个 dark pattern**（来源：HBS 2025 实测）：

| Anti-pattern | 见于 | ParallelMe 拒绝方式 |
|---|---|---|
| 离开时挽留 | Replika 31%, Talkie 57% | NowMe 永远不挽留，只说"档案已收好" |
| 模糊"AI vs 人" | Replika 默认人格化 | 永远说"它"，永远显式标注"系统侧记 / 模型生成" |
| 情感勒索 | Character.ai 26% | 禁忌词："你不要让我失望" |
| 无限滚动 / 打卡 | Stoic 部分功能 | 永远不做 streak / 徽章 / 连胜 |
| 强制 onboarding 暴露隐私 | Replika 强制问童年 | 首会 zero-disclosure，me.md 永远可空 |
| 危机时给鸡汤 | Talkie / Chai | 检测到关键词 → 直接 off-ramp 到 988 / Lifeline |

**必做的 4 个安全设计**（来源：Mirror Journal / Headspace Ebb / JMIR 2025）：

| 设计 | 落地 |
|---|---|
| Off-ramps over engagement | 高敏感词触发安全对话 + 暂停建议 |
| AI 不隐藏身份 | 顶部永远有"由 [provider] 模型生成 · 本地记忆"标识 |
| Layered transparency | NowMe 裁决底部永远附"它基于哪几个发言推出" |
| Adaptive consent | Memory Consent Gate（见 3.3） |

### 3.6 竞品差异化：三个抄不走的资产

ParallelMe 在 IFS 数字化赛道已经有 4 个对手（IFS Guide / InnerOS / Mindscape / Unblend）。差异化必须狠抓三件事：

1. **议题驱动的动态组阁** — 别人是"用户先识别 part → 跟它对话"，ParallelMe 是"用户提议题 → 系统组阁 → 多 part 同时辩论 → 用户主持"
2. **反讨好 NowMe + GAN 收束** — 别人都是温柔陪伴，ParallelMe 拒绝平衡 / 兼顾 / 都很重要，强迫"暂时不听谁 + 承认代价"
3. **本地优先 + 用户拥有可导出的内阁** — 别人都是 SaaS 锁定，ParallelMe 是"你的阁是你的"

详见 `docs/competitive/V3-COMPETITIVE-LANDSCAPE.md`。

---

## 4 · 七条军规

V3 开发期间任何 PR 与文档都必须满足：

```
1. 纸是本体，玻璃只在三处出现：弹层、当前焦点、状态反馈。
   ▸ Liquid Glass refraction 永远不进 ParallelMe。

2. 字体双轨：Sans 干活、Serif 仪式、Mono 证据；CJK letter-spacing = 0。
   ▸ 工作台禁用 fluid 大字。

3. 席位色只做身份点 / 边框 / 关系线，永远不写文字、永远不做卡片大背景。
   ▸ 状态必须同时有文字。

4. 每次会议至少四道用户参与门：立案确认 / 点名追问 / 签字 / 记忆同意。
   ▸ Memory Consent Gate 是 V3 信任护城河，必做。

5. NowMe 永远不"平衡 / 兼顾 / 都很重要"。
   ▸ 必须有"暂时不听谁 + 代价 + 24h 动作"。
   ▸ 留"我在逃避"逃生口，但不是"我们再聊聊"。

6. 反 chat：操作对象，不操作对话框。
   ▸ 议案纸 / 席位牌 / 决议纸是 first-class object，全部 deep-linkable。

7. 心理安全 > 留存指标：
   ▸ 永不挽留、永不打卡、永不混淆 AI/人、永不在危机时给鸡汤。
   ▸ 凡是 AI 陪伴产品 dark pattern，全部清单化拒绝。
```

---

## 5 · 路线图（Sequenced Roadmap）

### Week 0 · Design System Foundation

设计系统先行，一切代码都依赖它落地。详见 `V3-TECH-DIRECTION.md` 第 8 节。

- [ ] `lib/design/tokens/colors.ts`（含本文锁定的 paper.base / surface.deep 调整）
- [ ] `lib/design/tokens/typography.ts`（双轨字体 + Type Scale）
- [ ] `lib/design/tokens/spacing.ts` / `radius.ts` / `motion.ts`
- [ ] Tailwind v4 `@theme` CSS-first 同步
- [ ] V2 旧色值代码层全清理（避免 CSS / Tailwind / SVG / 文档四套色板共存）

### Week 1 · Provider Setup + 我的阁首页

- [ ] Provider Setup Wizard（DeepSeek preset + OpenAI-compatible custom + 演员模式 + 连接测试）
- [ ] 我的阁首页：今日开会 / 待复盘 / 反复议题 + 钥匙状态 / 本地记忆状态

### Week 2 · Quick Meeting MVP

- [ ] 立案 → 三席入席 → 用户追问 → 裁决 → 签字/暂缓 → 写入档案
- [ ] DocketPaper / SeatNameplate / StageRail / SignatureSlip 高保真

### Week 3 · 完整内阁会议 + 档案

- [ ] 5 席组阁 + 用户替换/旁听
- [ ] 交叉质询 + 用户判定
- [ ] 议案修订
- [ ] 会议档案：摘要 / 原声 / 余波

### Week 4 · 阁的演化 + 留存 (A + C)

- [ ] Loop A：24h 承诺复盘 callback
- [ ] Loop C：临时席转正提醒
- [ ] Memory Consent Gate（见 3.3，必做）
- [ ] 我的阁详情页 + 席位详情页

### Week 5 · 心理安全 + 上线打磨

- [ ] 危机词 off-ramp
- [ ] AI 身份显式标注
- [ ] 所有 token 走 WCAG AA（4.5:1 / 3:1）实测
- [ ] 移动端阶段轨 + 触屏交互验收

### Post-MVP

- Loop B（反复议题召唤）/ Loop D（沉默席召回）
- 周度侧记
- 跨设备同步（可选 Vercel KV / iCloud）
- 我的阁导出（PDF / Markdown prompt）

---

## 6 · V3 文档地图

V3 文档分四层。**冲突时以本文为准**。

```
docs/
├── design/
│   ├── V3-IVY-FINAL-DIRECTION.md         ← 你正在读，上层宪法
│   ├── V3-TECH-DIRECTION.md              ← 技术 ADR
│   ├── DESIGN-V3-CABINET.md              ← 产品宪法
│   ├── DESIGN-V3-UI-INTERACTION.md       ← UI / 交互详细设计
│   ├── DESIGN-V3-RESEARCH-REFINEMENT.md  ← 色彩与交互研究修订案（已被本文收束）
│   ├── V3-COLOR-DESIGN-GUIDE.md          ← 色彩规范
│   ├── V3-IA-DESIGN-GUIDE.md             ← 信息架构
│   ├── V3-INTERACTION-DESIGN-GUIDE.md    ← 交互流程
│   ├── V3-LOCAL-FIRST-TECH-ARCH.md       ← 本地优先架构
│   ├── V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md ← 开发前专家审查（已被本文收束）
│   └── V3-*.svg                          ← 视觉示意图
│
├── competitive/
│   └── V3-COMPETITIVE-LANDSCAPE.md       ← 竞品全景分析
│
└── research/V3/
    ├── README.md                         ← 调研档案索引
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

**收束规则**：
- `V3-PRE-DEVELOPMENT-EXPERT-REVIEW.md` 与 `DESIGN-V3-RESEARCH-REFINEMENT.md` 的全部判断，已被本文吸收并增强
- 后续任何视觉/产品/字体/留存讨论以本文为根，再向具体规范文档展开

---

## 7 · 参考来源（按主题）

### 7.1 Apple Liquid Glass 2025
- [Liquid Glass · Apple Developer Documentation](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- [Meet Liquid Glass · WWDC25](https://developers.apple.com/videos/play/wwdc2025/219)
- [Get to know the new design system · WWDC25](https://developers.apple.com/videos/play/wwdc2025/356)
- [Apple Newsroom · 2025-06](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [The Verge · The problem with Liquid Glass](https://on.theverge.com/apple/778197/liquid-glass-iphone-watch-ipad-mac)
- [WIRED · Most Divisive System Design Yet](https://www.wired.com/story/liquid-glass-could-be-one-of-apples-most-divisive-system-designs-yet/)
- [Fast Company · The liquid works, but the glass is broken](https://www.fastcompany.com/91405580/apple-liquid-glass-the-liquid-works-but-the-glass-is-broken)
- [Infinum · Sleek, Shiny, and Questionably Accessible](https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible)
- [Acorn Design System · Liquid Glass spec](https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk)
- [Linear · A Linear spin on Liquid Glass](https://linear.app/now/linear-liquid-glass)

### 7.2 Material 3 Expressive 2025
- [Google Blog · Material 3 Expressive launch (2025-05)](https://blog.google/products/android/material-3-expressive-android-wearos-launch)
- [m3.material.io · Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)
- [Ars Technica · Material 3 Expressive 评论](https://arstechnica.com/gadgets/2025/05/google-reveals-vibrant-material-3-expressive-coming-soon-to-a-pixel-near-you/)

### 7.3 多智能体 UX
- [HUMA: Humanlike Multi-user Agent (arXiv)](https://arxiv.org/html/2511.17315v1)
- [AG2 · Group Chat patterns](https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/)
- [AutoGen · Multi-Agent Workflows](https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows)
- [Building a Collaborative Agentic UX (Isotopes AI)](https://blog.isotopes.ai/building-a-collaborative-agentic-ux-88e3362c16c1)

### 7.4 AI 陪伴留存与商业化
- [Agnost AI · AI Companion Retention Benchmarks](https://agnost.ai/blog/ai-companion-retention-benchmarks)
- [HBS · Emotional Manipulations by AI Companions](https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf)
- [Replika · Game Thinking case study](https://gamethinking.io/case-studies/replika-case-study/)
- [Mary Borysova · Analyzing Replika app (UX Collective)](https://uxdesign.cc/replika-ais-secret-to-30m-users-what-makes-it-so-special-8afb61f1181c)
- [Worth Explainer · Why Character.ai is winning users](https://worthexplainer.com/why-character-ai-chat-is-winning-users-in-2025/)
- [GLBGPT · Character.AI Unplugged](https://www.glbgpt.com/resource/characterai-unplugged-inside-the-ai-companionship-boom)

### 7.5 心理健康 AI 安全
- [Mirror Journal (Child Mind Institute)](https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/)
- [Figma · How Headspace Built Ebb](https://figma.com/blog/headspace-ebb-ai-companion)
- [JMIR · Journaling with LLMs (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12234568/)
- [Smashing Magazine · Empathy-Centred UX Framework](https://www.smashingmagazine.com/2026/02/building-empathy-centred-ux-framework-mental-health-apps/)

### 7.6 色彩趋势 2026
- [Color Labs · Mineral Silence](https://colorlabs.net/palettes/mineral-silence-2025-12-31)
- [ColorArchive · 2026 Quiet Luxury Neutrals](https://colorarchive.org/collections/2026-quiet-luxury-trend/)
- [ColorUXLab · Trends 2026](https://coloruxlab.com/guides/trends-2026-january)
- [ColorArchive · Earth tones in digital](https://colorarchive.org/notes/april-2026-earth-tones-digital-interfaces/)

### 7.7 字体趋势 2025-2026
- [Lucky Graphics · Serif vs Sans for SaaS 2026](https://lucky.graphics/learn/serif-vs-sans-saas-2026/)
- [Fontfabric · Top 10 Typography Trends 2025](https://www.fontfabric.com/blog/top-typography-trends-2025/)
- [Lexington Themes · New Sans-Serif Google Fonts 2026](http://lexingtonthemes.com/blog/best-new-sans-serif-google-fonts-2026)
- [TabFlash · Typography Trends 2025](https://tabflash.com/en/typography-trends-2025/)
- [FrontendTools · Modern Typography 2025](http://frontendtools.tech/blog/modern-web-typography-techniques-2025-readability-guide)

### 7.8 Linear / Things 3 设计哲学
- [Linear · A calmer interface for a product in motion](http://linear.app/now/behind-the-latest-design-refresh)
- [Linear · Why is quality so rare?](https://linear.app/now/why-is-quality-so-rare)
- [Linear · Design is more than code](https://linear.app/now/design-is-more-than-code)
- [Linear Method · Principles & Practices](https://linear.app/method/introduction)
- [Things 3 · The Art of Focused Simplicity](https://blakecrosley.com/guides/design/things)
- [Linear · The New Standard for Software Design](https://blakecrosley.com/en/guides/design/linear)

### 7.9 反 chat / Canvas / Sidecar
- [DesignersForest · The chat box isn't a UI paradigm](https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/)
- [MMNTM Research · Beyond Chat](https://www.mmntm.net/articles/beyond-chat-interfaces)
- [UX Collective · Where should AI sit in your UI?](https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e)
- [RiffOn · The Future of AI UX is Co-Creation on a Canvas](https://riffon.com/insight/ins_t5gqvpoc6vdw)

### 7.10 IFS 数字化竞品
- [IFS Guide (Sunny)](https://ifsguide.com/)
- [InnerOS](https://inneros.ai/ifs-therapy-app)
- [Mindscape](https://www.mymindscape.co/)
- [Unblend](https://unblend.me/)

### 7.11 可访问性与设计原则
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Apple HIG · Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Apple HIG · Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [IBM Carbon Design System · Type Sets](https://carbondesignsystem.com/elements/typography/type-sets/)
- [Nielsen Norman · Onboarding Tutorials vs Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/)
- [Stanford Behavior Design Lab · Fogg Behavior Model](https://behaviordesign.stanford.edu/resources/fogg-behavior-model)

### 7.12 技术栈
- [Vercel AI SDK 5](https://vercel.com/blog/ai-sdk-5)
- [AI SDK 6 Beta · Agent Interface](https://v5.ai-sdk.dev/docs/announcing-ai-sdk-6-beta)
- [Anthropic · Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Anthropic Agent SDK · TypeScript](https://docs.anthropic.com/en/api/agent-sdk/typescript)
- [RxDB · LocalStorage vs IndexedDB vs OPFS comparison](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html)
- [Dexie 5.0 Roadmap](https://dexie.org/docs/roadmap/dexie5.0)
- [Tyler McDaniel · Building a Design Token System That Scales](https://www.tostupidtooquit.com/blog/building-design-token-system)
- [Innatus Digital · Tailwind v4 design tokens](https://innatus.digital/digital-insights/our-tailwind-v4-design-system-and-how-we-handle-brand-tokens)

---

**本文最后更新于：V3 开发前定稿 · 2026-05**
