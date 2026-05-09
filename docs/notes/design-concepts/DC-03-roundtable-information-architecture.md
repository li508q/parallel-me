# DC-03 · 圆桌信息架构与设计原则四维度

- 性质：`stage === "roundtable"` 阶段的信息架构方案 + 全局可复用设计原则
- 来源痛点：圆桌 UI 五连问（已在 Step 2/3 迁移为 [R1~R10](../requirements/backlog.md#r1) 并验收）
- 关联需求：[R1~R10](../requirements/backlog.md#r1)
- 与 [DC-01](DC-01-scribe-activity.md) 的关系：DC-03 的"时间线"是 DC-01 Layer 1/2 落地的物理基础——没有时间线，就没法贴状态条上去
- 关联心理学：[PR-01 五声分布](../psychology-references/PR-01-plurality-of-self.md)（IFS part 类型 / DST I-positions——五声席位的人格学根基）· [PR-04 圆桌结构化容器](../psychology-references/PR-04-productive-disagreement.md)（Edmondson psychological safety + De Dreu task conflict 容器 + Janis 反 groupthink 编排——duel 卡片差异化 / 6 阶段编排的学术根基）

---

## 信息架构核心判断

业界通用的对话型 UI 有两种主要形态：

| 形态 | 适用场景 | 例子 |
| --- | --- | --- |
| **Grouped by Speaker（按角色聚合）** | 静态对照、立场对比、人物档案 | 候选人立场对照表、剧本人物列表 |
| **Chronological Stream（按时间流）** | 任何"对话"、"辩论"、"会议" | 微信、Slack、ChatGPT、AutoGen GroupChat、Discord |

ParallelMe 圆桌阶段的判断：

- `opening` 子阶段（五声第一轮立论）→ **Grouped by Speaker**（立场展示）
- `roundtable` 子阶段（自由圆桌）→ **必须切换为 Chronological Stream**（对话）

旧实现沿用"立场展示卡片"到了"对话"阶段，是把两种信息架构错配了——这是 [R4](../requirements/backlog.md#r4) 已解决的根因。

---

## 时间线必须显式呈现的四个维度

具体丢失的维度有四个，缺一不可：

1. **时间顺序** — 谁先开口、谁后回应
2. **触发关系** — 这条发言是因为"再来一轮"还是"被用户问"还是"被对峙问"
3. **回合分隔** — 一个 round 内的若干 turns 是一组、不同 round 之间应有视觉分隔
4. **跨角色互引** — A 引用了 B 的话来反驳，需要可视化指引

---

## 同流不同模板（Same Stream, Different Card Template）

时间线是同一条流，但不同 turn 类型应有专属的视觉模板：

| Turn 类型 | 视觉特征 | 来源 turn 字段 |
| --- | --- | --- |
| **seat（声音发言）** | 左对齐、声音色块、角色名 | `kind === "seat"` 或 voice_id 命中 |
| **user（我的发言）** | 右对齐、italic、引号包裹 | `kind === "user"` |
| **duel（两声对峙）** | 双色边、AB 对置块、"↔" 箭头，传达视觉张力 | `turn.duel === true` |
| **scribe（书记员侧记）** | 中性灰、缩进、"📝 书记员记下…"前缀 | `trigger === "scribe_summary"` |
| **cross-question/cross-response（追问对答）** | 缩进 + 引线指向被引用 turn | 配合 `refers_to` 字段 |

---

## 设计原则汇总（按四维度解耦）

> 把圆桌 UI 五连问背后的原则按"信息架构 / 交互 / 视觉 / 心理"归类，未来设计任何新功能都可查表对照。

### 信息架构维度

| 原则 | 含义 | 来源 |
| --- | --- | --- |
| **Stream vs Grouped 必须按场景选** | 立场展示用 Grouped；对话/会议必须用 Stream | [R4](../requirements/backlog.md#r4) / [R7](../requirements/backlog.md#r7) |
| **Single Source of Input Truth** | 同一种意图只能有一处输入入口 | [R9](../requirements/backlog.md#r9) |
| **Round / Turn 是显式概念** | 多 Agent 对话里"轮"和"次"必须是 UI 可见的结构，不能让用户自己脑补 | [R5](../requirements/backlog.md#r5) |
| **数据写入与视图渲染必须配对** | 数据已存但视图未读 = 半实现 = bug | [R2](../requirements/backlog.md#r2) / [R3](../requirements/backlog.md#r3) |

### 交互维度

| 原则 | 含义 | 来源 |
| --- | --- | --- |
| **Proximity Principle** | 控件应紧邻其触发点 | [R8](../requirements/backlog.md#r8) |
| **Progressive Disclosure** | 模式相关的输入只在该模式激活时出现 | [R8](../requirements/backlog.md#r8) / [R9](../requirements/backlog.md#r9) |
| **Single Responsibility per Stage** | 每个 stage 只做一类核心动作，跨阶段能力别提前漏出 | [R1](../requirements/backlog.md#r1) |
| **Don't Delete the Engine, Just Hide the Button** | 拆功能优先收前端入口，后端能力先保留 | [R1](../requirements/backlog.md#r1) |

### 视觉维度

| 原则 | 含义 | 来源 |
| --- | --- | --- |
| **Conversational Symmetry** | 用户与 AI 的发言在视觉上必须是同一类公民 | [R3](../requirements/backlog.md#r3) |
| **Speaker Color Token** | 用预先定义的角色色作为"谁在说话"的快速识别 | [R6](../requirements/backlog.md#r6) / [R7](../requirements/backlog.md#r7) |
| **Same Stream, Different Card Template** | 同一时间流里，不同 turn 类型用不同卡片样式（seat / user / duel / scribe）| [R7](../requirements/backlog.md#r7) |
| **Round Marker** | 一组 turns 的起止要有视觉分隔 | [R5](../requirements/backlog.md#r5) |

### 心理维度

| 原则 | 含义 | 来源 |
| --- | --- | --- |
| **Provenance Visibility** | 每一句话都要能看出谁说的、什么时候说的、为什么说的——这是用户信任产品的最低线 | [R3](../requirements/backlog.md#r3) / [R5](../requirements/backlog.md#r5) |
| **沉浸感不可被工程化按钮打断** | 用户在和五声对话时不要弹出后台动作类 UI（如"书记员整理"） | [R1](../requirements/backlog.md#r1) |
| **不让 UI 撒谎** | 看起来可以输入的框就必须真的可以输入，禁用状态要么消失要么明显标示 | [R8](../requirements/backlog.md#r8) / [R9](../requirements/backlog.md#r9) |

---

## 与 DC-01 的衔接关系

- **R2 / R3（用户发言入库与渲染）** 是 **Conversational Symmetry** 的最小实现，与 DC-01 的 Streaming UI 无强耦合，**可独立先做**
- **R4 / R5 / R6 / R7（时间线 + 轮次 + 引用 + 对峙模板）** 是 [DC-01 Layer 1（状态条）/ Layer 2（Trace）](DC-01-scribe-activity.md) 落地的物理基础：没有时间线，就没法贴状态条上去
- **R7（对峙模板）** 在视觉张力设计上需要复用项目的 `--color-seat-*` CSS 变量
- **R9（输入框收敛）** 决定了未来 SSE 流式响应时"用户能否中途打断"的交互可能性——若选 R9a（底部固定栏），打断/插话天然成立

---

## R9 输入框收敛 · 两条候选路线利弊对比

> [R9](../requirements/backlog.md#r9) 处理"圆桌阶段多个输入入口该如何收敛"。Step 3 采用 R9b：单一就近输入浮层。

| 维度 | **R9a · 底部固定栏（聊天流范式）** | **R9b · 上下文唤起栏（仪式化会议范式）** |
| --- | --- | --- |
| **范式参考** | ChatGPT / Claude / Slack | Notion AI / Linear Command Bar / Apple Mail Compose |
| **输入框位置** | 永远固定在视窗底部 | 默认收起，按 `⌘K` 或点 voice 头像唤起浮层 |
| **目标动作映射** | 单一 textarea + 左侧"@对谁说"chip 切换（@全场/@某声/@对峙） | 唤起后选 intent → 出对应表单（继续 / 单问 / 对峙） |
| **认知负担** | 低（任何时刻都知道去哪打字） | 中（需要记住快捷键或唤起入口） |
| **沉浸感** | 中（输入框始终视觉占位，会拉低"会议感"） | 高（不打字时屏幕全是对话内容，更像在旁听） |
| **打断/插话** | 天然成立（输入框一直在） | 需要额外快捷键，对新手不友好 |
| **SSE 流式响应兼容性** | ✅ 直接兼容（输入框可在响应中持续输入） | ⚠️ 需要"流式中也能唤起浮层"的额外状态机 |
| **移动端友好度** | ✅ 高（与微信/Slack 习惯一致） | ⚠️ 中（浮层在小屏上易遮挡内容） |
| **与"五声圆桌"产品哲学契合度** | ⚠️ 中（聊天流暗示"对一个 AI 说话"） | ✅ 高（仪式化更符合"列席旁听"的心理框架） |
| **实现成本** | 低（HostConsole 改造 + chip 选择器） | 中（新增 CommandBar 组件 + 浮层状态机） |

**推荐路径**：
- **MVP（R12 之前）**：先做 R9a，把当前三个入口先收成一个底部栏，让圆桌不再"五连问"
- **后续（R12/R13 落地后）**：观察用户行为数据——如果"打断/插话"占比 < 5%，说明仪式感更重要，可演进到 R9b
- **永远不要做的**：保留多个入口同时存在的现状（违反 Single Source of Input Truth 原则）

---

## Duel 卡片布局草图

> 对应 `Same Stream, Different Card Template` 表格中的 `duel` 行。给设计师的"按这个画就行"级别布局规范。

```
┌──────────────────────────────────────────────────────────────┐
│                    ◆ 第 3 轮 · 对峙 ◆                          │  ← Round Marker（见下文）
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐         ↔         ┌─────────────────┐  │
│  │ 🟦 远行人        │  ←──── 引用 ────→  │ 🟫 安稳者        │  │
│  │ ─────────────── │                    │ ─────────────── │  │
│  │ "你说的稳定，    │                    │ "你说的远方，    │  │
│  │  其实是怕。"     │  ←──── 反驳 ────→  │  代价是孩子。"   │  │
│  │                 │                    │                 │  │
│  │  [被引用原文高亮] │                    │  [被引用原文高亮] │  │
│  └─────────────────┘                    └─────────────────┘  │
│        14:32:18                               14:32:24         │
└──────────────────────────────────────────────────────────────┘
```

**布局规范**：
- 双列等宽（`grid-cols-2 gap-6`），居中容器宽度 `max-w-3xl`
- 左右两块卡片各使用各自的 voice 色（`--color-seat-{voiceId}`）作 4px 顶部色条 + 头像背景，**禁止用整块底色**（会喧宾夺主）
- 中间 `↔` 符号：`text-2xl text-neutral-400`，永远居中对齐，**不带任何动效**（避免视觉干扰内容）
- "被引用原文高亮"：在被反驳的原话上加 `bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded-sm`，让用户一眼看到"是哪句话被打回来了"
- 时间戳：`text-xs text-neutral-400 tabular-nums`，左右两块各贴各的左下角
- **响应式**：< 768px 时降级为上下堆叠（先左后右），中间 `↔` 改为 `↓`，保持语义

**禁用清单**：
- ❌ 不允许在 duel 卡片上叠加任何按钮（"再来一回合"等动作交给 HostConsole）
- ❌ 不允许两侧卡片高度强制对齐（自然高度更真实，强制对齐会让短发言显得"被注水"）
- ❌ 不允许自动滚动到 duel——让用户自己滚到，避免"被剧透"

---

## Round Marker · 视觉规范

> 对应 `Round Marker` 设计原则。每一 round 的起始位置插入一个**轻量的视觉分隔符**，让用户知道"上一轮结束、新一轮开始"。

```
┌───── 第 2 轮 · 自由发言 ──────┐    ← Round Marker
└───────────────────────────────┘
```

**规范**：
- 形态：水平细线 + 中间标签，标签格式 `第 {n} 轮 · {triggerLabel}`
- triggerLabel 词典（与 [DC-02](DC-02-scribe-narration-library.md) 文案一致）：
  - `continue_all` → `自由发言`
  - `continue_one` → `单声续言`
  - `user_to_voice` → `你的追问`
  - `duel` → `对峙`
  - `mirror_structure` → `书记员的镜子`（不是"对峙"，强调它是观察不是发言）
- 视觉 token（与 [DC-01 Tailwind Token](DC-01-scribe-activity.md) 同体系）：
  - 线条：`h-px bg-neutral-200 dark:bg-neutral-700`
  - 标签：`text-xs text-neutral-500 px-3 bg-{页面背景色}`（让标签"压在"线条上）
  - 上下留白：`my-8`（足够大让用户感受"换气"，但不至于让内容断层）
- **不允许**带头像、带色块、带动效——Round Marker 是结构提示，不是内容
- **不允许**显示绝对时间（"14:32"），只显示相对回合数；时间归 turn 卡片自己负责

**触发条件**：当 `turns[i].round !== turns[i-1].round` 时插入；首轮（`turns[0]`）不插入（开场即第一轮，无需"开始"标记）。

---

## 业界参考库 → DR-03

> 本 DC 的所有信息架构决策（同流不同模板 / 跨角色互引 / Round Marker / Single Source of Input Truth / 用户作为圆桌一员）都有截图级 / 工程级的业界证据库支撑。详见 **[DR-03 多代理对话流 · 业界参考](../design-references/DR-03-conversation-stream-references.md)**（296 行 · 5 产品截图级调研）。

| DR-03 章节 | 印证 DC-03 哪条原则 |
| --- | --- |
| Slack threads · 1 层嵌套铁律 + 侧栏 panel | 跨角色互引应限定 ≤1 层嵌套 + duel 可考虑侧栏 |
| Discord · Inline reply 引用块 | 普通互引用 inline 引用块（小字 + 头像 + 前 60 字 + 可点跳转） |
| AutoGen Studio · GraphFlow + `allowed_speaker_transitions_dict` | 每种 moveType 应配置不同 speaker transition 规则 |
| Pi.ai · 单 Agent 范式（反向锚点） | 多 voice 必须保留头像 + 名字双重身份 |
| Character.AI · Multi Character Group Chat | 用户 = character 视觉同构 + 缺席不是 bug + auto memory |
| **跨产品 7 条公理** | 嵌套上限 / 主流分支视觉隔离 / 头像名字标识 / 显式 speaker transition 等 |
| **10 项行动建议** | 含 lib/llm.ts allowedSpeakerTransitions 配置、用户气泡升级等可立即落地动作 |

> **关键发现**：[DR-03 公理 5 · 缺席不是 bug，可见的缺席才是](../design-references/DR-03-conversation-stream-references.md) 是对 [EXP-03 缺席声音](../experience-log/EXP-03-multi-agent-absence.md) 的关键校准——缺席本身正常，问题是"缺席要让用户看见"而不是"强制全员发言"。
