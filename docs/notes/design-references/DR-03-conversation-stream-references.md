# DR-03 · 多代理对话流 · 业界参考

- 性质：[DC-03 圆桌信息架构](../design-concepts/DC-03-roundtable-information-architecture.md) 的业界证据库
- 调研窗口：2024-2026 年最新版本
- 关联：[DR README · 调研规范六项](README.md)

---

## 一句话立场

> 多 Agent / 多人对话的 UI 是过去十五年硅谷反复试错的领域——Slack 用一篇官方设计文章承认走了多少弯路，AutoGen 用 `allowed_speaker_transitions_dict` 把"谁该接话"做成可配置项，Character.AI 在 2025 年九月把 group chat 整体重做。本 DR 提取的不是装饰，是**让用户在 N 个声音里不迷路**的具体机制。

---

## 1 · Slack threads · 多人对话的 Round/Turn 视觉范式（**唯一公开承认设计反思的产品**）

### 产品 / 版本 / 截图位置

- 产品：Slack · threads 功能（2017 上线，2025 持续迭代）+ 官方设计博客 `slack.design`
- 截图位置：(a) Slack 任意 channel 一条消息上 hover 触发 `Reply in thread`；(b) 触发后右侧滑出的 thread side panel；(c) 官方文章「Threads in Slack, a long design journey (part 2 of 2)」全文复盘
- 关键 UI 区域：(1) **主流频道流**（顶级消息按时间排列）；(2) **Reply in thread 触发器**（hover 时出现）；(3) **侧栏 thread panel**（独立可滚动区域）；(4) **回到主流频道的 thread 摘要**（"X replies · last reply 3h ago"）

### 可观测细节

- **只允许一层嵌套**：Slack 设计博客明确写 `Reducing each thread to only one level of replies was an instant success on all fronts. The design was simpler, it was easier to build, and of course, easier to follow`——**禁止多层嵌套**是 Slack 经过多版迭代后总结的铁律
- **侧栏而非内联展开**：thread 不会在主流频道里展开，而是右侧滑出一个**独立可滚动的 panel**——主流频道保持"时间流"的纯净，thread 是"针对性深聊"的独立空间
- **主流频道的 thread 摘要**：原消息下方出现一行 `💬 5 replies · last reply 3h ago · View thread`——这是把"分支"折叠为"主线上的一行注脚"的范本
- **"Send to channel" 复选框**：在 thread 内发送消息时有一个 checkbox `Also send to #channel`——允许用户决定是否把这条 reply 同时广播回主流频道，是**"thread 与主流频道的双向桥"**
- **AI answer step 集成**（2025）：Slack 持续迭代到现在，新增了 `AI answer step` 作为 workflow 的一部分——AI 总结 channel / 回答问题，但**仍然遵守 thread 的 1 层嵌套规则**

### 为什么有效（**唯一公开的"多人对话 UI 设计旅程"**）

- **1 层嵌套是经验证的最优解**：Slack 不是没试过 N 层（Reddit/HN 都是 N 层）——他们试过、失败了、然后**降到 1 层就立即成功**。设计博客明确写 "instant success on all fronts"。这是对 ParallelMe 的强校准——**圆桌的"对峙引用 / 反驳链" 不应做无限嵌套**，应限定 1 层（A 反驳 B，C 接着反驳 A，但 D 不应"反驳 C 对 A 的反驳"——会让用户彻底迷路）
- **侧栏 vs 内联**：Slack 选侧栏的核心理由是"主流不能被分支污染"——**对应到 ParallelMe，圆桌主流（五声 + 用户 + 书记员的时间线）必须保持纯净，duel/inquiry 这些"针对性深聊"应有独立可视区域**。这强力支持 [DC-03 Same Stream, Different Card Template](../design-concepts/DC-03-roundtable-information-architecture.md) 的设计——但更进一步：**duel 卡也许应该考虑侧栏化**
- **主流的 thread 摘要 = 折叠注脚**：让用户在主流上一眼看到"这条消息引发了多少深聊"，但深聊本身不打扰主流——对应到 [DC-03 Round Marker](../design-concepts/DC-03-roundtable-information-architecture.md)，可以补充"该轮触发了 X 次对峙"这种摘要式注脚
- **Send to channel 双向桥**：用户对"分支结论"是否回灌主线有控制权——对应到 ParallelMe 的"清明落定"，用户可以决定哪些圆桌结论进入最终的归档摘要
- **AI 不破坏既有规则**：Slack 在加 AI 时严格遵守 thread 既有规则（1 层嵌套）——证明 [DR-01 公理 5 · AI 不能有视觉特殊化](DR-01-streaming-ui-references.md)、[DR-02 公理 1 · 文案是产品的人格容器](DR-02-narration-tone-references.md)在多 Agent 时代依然成立

### 对应 DC-03 哪条原则

| Slack 机制 | DC-03 对应 / 启发 |
| --- | --- |
| 1 层嵌套铁律 | **强校准**：[DC-03 时间线四维度 · 跨角色互引](../design-concepts/DC-03-roundtable-information-architecture.md) 应明确"反驳链最多 1 层"约束，避免无限嵌套 |
| 侧栏 thread panel | **强升级建议**：[DC-03 Duel 卡片布局](../design-concepts/DC-03-roundtable-information-architecture.md) 可考虑"duel 是侧栏，不是流内卡片"的演进方向 |
| 主流的 thread 摘要 | [DC-03 Round Marker 视觉规范](../design-concepts/DC-03-roundtable-information-architecture.md) 可补"该轮触发摘要" |
| Send to channel 双向桥 | **新方向**：清明落定的"用户决定哪些 turn 进归档"机制 |
| 设计反思公开化 | DC-03 当前已有"对应 R4~R10 圆桌问题"的反向追溯，与 Slack 设计博客同方法论 |

### 不该照抄的部分

- ❌ **Slack 是工作工具语境**——thread 是"延后讨论某个具体话题"，ParallelMe 的圆桌是"几个声音同时争论同一个话题"。两者**不是同一个对话模型**——Slack 的范式是"主流 + 偶尔 thread"，ParallelMe 是"高密度并发 + 偶尔 duel"，密度反过来
- ❌ **Slack 的侧栏 panel 在桌面端宽屏才好用**——ParallelMe 必须考虑移动端，duel 不能简单照搬侧栏，需要视宽自适应（如 < 768px 降级为模态卡或纵向展开）
- ❌ **`💬 5 replies · last reply 3h ago` 是工程感强的元数据**——ParallelMe 应改为更柔的"这一轮里 X 和 Y 互相打了 3 次照面"等人话表达
- ❌ **AI answer step 是 workflow 工具范式**——ParallelMe 不应把书记员包装成 "Step"，书记员是默认在场的人格，不是流程节点

---

## 2 · Discord · Inline reply 与 Slack 侧栏的直接对照（**两种"分支可视化"哲学的对比**）

### 产品 / 版本 / 截图位置

- 产品：Discord · 持续迭代到 2024-2025（2024 年加入 Forward 按钮，但 reply 机制保留）
- 截图位置：Discord 任意 channel，hover 一条消息出现工具条 → 选 `Reply`；或对消息发起 `@提及`；或在 thread 模式下查看
- 关键 UI 区域：(1) **inline reply 引用块**（被回复的原消息以小字 + 头像 + 缩进形式插在新消息上方）；(2) **@提及高亮**（被提及的用户名渲染为可点击链接 + 整条消息有左侧色条提醒）；(3) **Forward 按钮**（2024 新增，可把消息转发到其他 channel）

### 可观测细节

- **Inline reply 而非侧栏**：与 Slack 完全相反——Discord 的 reply **不会另开侧栏**，而是把"回复关系"做成新消息上方的一行**引用块**：
  ```
  ┌─ ↳ @Alice · 你说的稳定，其实是怕    ← 上方一行小字引用块
  └─ Bob: 但稳定不等于不动                ← 新消息正文
  ```
- **引用块极轻量**：(a) 字号比正文小一档（约 `text-xs`）；(b) 只有头像 + 用户名 + 原消息前 60 字符；(c) 可点击跳转到原消息位置；(d) 不带边框，仅左侧 2px 灰色竖线
- **@提及色条**：当某条消息 @ 了你，整条消息**左侧出现一条饱和度极低的橙红色竖条**（约 2px）——是非常克制的"这条与你有关"信号
- **没有"thread 入口"也能 reply**：Discord 任何消息都可以被 reply，**不需要先创建 thread**——降低了用户的认知门槛
- **Forward 按钮**（2024 新增）：可以把任意消息转发到其他 channel，**保留原消息的引用关系**——这是"消息可携带其语境"的产品级实现

### 为什么有效（**Discord 与 Slack 的对比是本 DR 最有价值的设计哲学对照**）

- **Inline vs 侧栏：两种哲学的根本分歧**：
  - **Slack 哲学**：主流必须纯净，分支应被隔离 → 侧栏
  - **Discord 哲学**：分支就是主流的一部分，引用关系应**就地可见** → inline
  - **哪个适合 ParallelMe？**——圆桌的"五声互引"是**高频、高密度**的（每轮可能有 3-5 次互引），如果都用侧栏会让用户不停切换，inline 更合适；但"对峙 duel"是**低频、高密度**的（一轮可能只有 1 次但内容很重），侧栏可能更合适。**结论**：ParallelMe 应采用**混合策略**——普通互引用 inline 引用块，正式 duel 用类侧栏的特殊视觉
- **极轻量引用块 = "提示而非占位"**：Discord 的引用块小到几乎不占视觉权重，但又足够让用户知道"这是回复谁"——这与 [DC-05 P3 Whisper Metadata · 元数据耳语](../design-concepts/DC-05-brief-card-design.md) 同源。对应到 ParallelMe——voice 互引时不应展开被引用的全文，应做成 Discord 式的"小字 + 头像 + 前 60 字 + 可点跳转"
- **饱和度极低的色条 vs 强烈的红点 / 数字徽章**：Discord 的"@你了"信号比 Slack/微信的"未读数字徽章"克制太多——它选择**让消息本身略微凸显**，而不是堆叠通知噪声。对应到 ParallelMe——书记员的"被点名" / voice 的"被引用" 信号都应该这种克制风格，不应有"红点 / 角标"
- **任何消息都可被 reply（无需 thread 容器）**：降低交互门槛——对应到 ParallelMe，**不应强制用户"先选择对话模式再发言"**，应允许任何 voice 在任何时刻直接 reply 任何 turn（呼应 [DC-03 R9 输入框收敛](../design-concepts/DC-03-roundtable-information-architecture.md) 的"Single Source of Input Truth"原则）

### 对应 DC-03 哪条原则

| Discord 机制 | DC-03 对应 / 启发 |
| --- | --- |
| Inline reply 引用块 | **强校准**：[DC-03 时间线四维度 · 跨角色互引](../design-concepts/DC-03-roundtable-information-architecture.md) 应明确"普通互引用 inline 引用块" |
| 极轻量引用块（小字 + 前 60 字 + 可跳转） | 与 [DC-05 P3 Whisper Metadata](../design-concepts/DC-05-brief-card-design.md) 同源，验证"用色不用框"原则 |
| 饱和度极低的色条信号 | **强约束**：ParallelMe 的"voice 被引用 / 书记员被点名" 信号严禁红点角标 |
| 任何消息可被 reply（无 thread 容器） | [DC-03 Single Source of Input Truth](../design-concepts/DC-03-roundtable-information-architecture.md) 的产品级证据 |
| Forward 保留原引用关系 | **新方向**：清明落定的引用块可保留原 turn 跳转链接 |

### 不该照抄的部分

- ❌ **Discord 是游戏 / 社区语境**——视觉饱和度高（紫色品牌色 + 各种 emoji + 表情包反应），ParallelMe 的"克什米尔木色 + 暖米白" 基调不能学到任何"游戏感"
- ❌ **Discord 的 @提及色条是橙红色**——ParallelMe 应改用更柔的色（如克什米尔木色暗一档），保持"温的理性" 基调
- ❌ **Discord 的 Forward 是社交转发**——ParallelMe 不需要"转发到其他会议"功能，但保留原引用的能力可借用
- ❌ **Discord 任何消息可 reply 在 ParallelMe 需要约束**——voice 不应能 reply "用户的问题问题"（破坏 voice 的角色边界），应限定 voice 只能 reply 其他 voice 或对全场发言

---

## 3 · AutoGen Studio · GraphFlow 多 Agent 群聊（**与 ParallelMe 同构最强的工程参考**）

### 产品 / 版本 / 截图位置

- 产品：Microsoft AutoGen · v0.4 + AutoGen Studio v0.4.1（2025）+ GraphFlow workflow + 即将合并到 Microsoft Agent Framework
- 截图位置：`microsoft.github.io/autogen/stable` GraphFlow 文档页 + AutoGen Studio Web UI 的 `Build` 标签页（多 Agent 配置）+ `Playground` 标签页（运行可视化）
- 关键 UI 区域：(1) **Agent team 配置面板**（左侧列出 N 个 agent + 各自的 system prompt + tool 集）；(2) **GraphFlow 流程图**（DAG 节点表示 agent，边表示 `allowed_speaker_transitions`）；(3) **运行时对话流**（每条 agent 发言带头像 + 时间戳 + tool call trace 折叠）；(4) **GroupChat 的 next-speaker 决策可视化**

### 可观测细节

- **`allowed_speaker_transitions_dict` 是显式约束**：AutoGen GroupChat 不让所有 agent 自由抢话——开发者用一个 Python 字典明确声明 "agent A 说完后只允许 agent B 或 C 接话"，**把"谁能跟谁说话" 做成可配置的图边**
- **GraphFlow 是 DAG 结构化执行**：v0.4 引入的 GraphFlow 用 DAG（有向无环图）描述 multi-agent workflow——比纯自由 GroupChat 更可控，每个节点是 agent，每条边是允许的 speaker transition + 触发条件
- **运行时对话流的结构**：每条 agent 发言 = `[头像 + agent name] [发言正文] [tool call trace 可展开] [时间戳]`——与 Slack 的消息结构同形态，但**多了 tool trace 这一层**
- **GroupChat manager 是显式角色**：AutoGen 把"谁来决定下一个 speaker" 做成显式的 manager agent（`GroupChatManager`），与普通 agent 同等渲染但角色不同——这是把 ParallelMe 的"圆桌主持人 / 编排器"概念**产品化**的范例
- **声明式配置导出**：AutoGen Studio v0.4.1 允许 `Build agents in Python and export them directly to AutoGen Studio using declarative configuration`——把"agent 行为"作为可序列化的数据资产，与 [DC-05 SCRIBE_SOUL](../design-concepts/DC-05-brief-card-design.md) / `lib/selves.ts` 的 voice 数据结构同方法论
- **bug 案例公开化**：GitHub issue #6523 公开承认 `Graphflow doesnt seem to work as expected when an agent has access to tools`——证明"next speaker 决策"在多 Agent 系统里是**已知难题**，不是简单问题

### 为什么有效（**这是 ParallelMe 多 Agent 编排的工程范式靠山**）

- **`allowed_speaker_transitions_dict` 解决的是 ParallelMe 圆桌的核心痛点**：当前 ParallelMe 的圆桌编排器（`generateRoundtableMove` in `lib/llm.ts:355-380`）是**自由 GroupChat 模式**——五声谁都可能接话，由 LLM 自己决定。AutoGen 给出的工程答案是——**把"谁能跟谁说话" 做成显式约束**。对应到 ParallelMe，可以为每种 moveType（continue_all / duel / mirror_structure 等）配置不同的 `allowed_speaker_transitions`，比如 `duel` 时只允许被 challenge 的那一声接话
- **GroupChatManager 显式化 = 编排责任有归属**：AutoGen 把"主持人"做成独立 agent，让"决定谁说话"这件事有明确归属。对应到 ParallelMe——目前的"主持人 / 编排器"是隐式的（散在 LLM prompt 里），可考虑做成显式的"主持人 agent"，与五声平等存在但职责不同（呼应 [DC-04 P3 书记员是激烈对话中的「理性支柱」](../design-concepts/DC-04-confrontational-voice-design.md) 的边界划分）
- **GraphFlow DAG vs 自由 GroupChat = 可控性 vs 涌现性的权衡**：AutoGen 提供两种模式让开发者按场景选——结构化（DAG）适合任务型 workflow，自由（GroupChat）适合对话型场景。**ParallelMe 应是混合模式**：opening 阶段用 DAG（五声依次发言，speaker transition 严格）；roundtable 阶段用 GroupChat（允许涌现，但每种 moveType 有不同 transition 约束）
- **声明式配置 = 产品哲学**：把 agent 的人格 / tool / 行为做成数据而非硬编码，让"换人格" 不需要改代码——ParallelMe 的 `lib/selves.ts` 已天然走这条路（VoiceSoul 接口），AutoGen 验证了这个方向是对的
- **公开 bug = 对工程问题的诚实**：AutoGen 把"next speaker 决策遇到 tool 时出 bug" 公开 issue 化——证明 multi-agent UI/编排是**未完全解决的工程领域**。对应到 ParallelMe——任何 multi-voice 编排的 bug 都应该被诚实记录到 [experience-log/](../experience-log/README.md)，这是已经在做的对的事

### 对应 DC-03 哪条原则

| AutoGen 机制 | DC-03 对应 / 启发 |
| --- | --- |
| `allowed_speaker_transitions_dict` 显式约束 | **强升级建议**：[DC-03 + lib/llm.ts](../design-concepts/DC-03-roundtable-information-architecture.md) 应为每种 moveType 配置不同的 speaker transition 规则 |
| GraphFlow DAG | **新方向**：opening 阶段可考虑 DAG 化（五声依次入席），roundtable 保持自由 |
| GroupChatManager 显式化 | **强升级建议**：把"圆桌主持"做成显式 agent，与五声平等渲染但职责不同 |
| 声明式 agent 配置 | 与 [lib/selves.ts](../design-concepts/DC-04-confrontational-voice-design.md) `VoiceSoul` 同方法论，是已对齐的方向 |
| 运行时对话流结构（头像 + 正文 + trace + 时间戳） | 与 [DC-03 Same Stream, Different Card Template](../design-concepts/DC-03-roundtable-information-architecture.md) 强同构 |
| 公开 bug issue 文化 | [experience-log/](../experience-log/README.md) 已在做，强校准信号 |

### 不该照抄的部分

- ❌ **AutoGen 是开发者工具**——它的 UI（Build 面板 / Playground）面向的是构建 multi-agent 系统的工程师，不是终端用户。**不能学其密度** —— ParallelMe 的圆桌主界面**不应展示 system prompt / tool 配置**，这些应该归属 [DC-01 Layer 2 Trace Panel](../design-concepts/DC-01-scribe-activity.md) 默认收起
- ❌ **GraphFlow 的 DAG 可视化对终端用户可能过于抽象**——ParallelMe 不应让用户看到 "speaker transition graph"，但**可以借鉴这个概念用于内部架构**
- ❌ **AutoGen 的 agent 命名常带"Assistant"/"User Proxy" 等技术词**——ParallelMe 的"五声 + 书记员" 命名已超越这种工程感，**禁止退化到工具腔**（不要让 voice 叫 "Voice 1 / Voice 2"，永远用 "远行人 / 安稳者" 等人格化命名）
- ❌ **AutoGen 把 tool call trace 默认展开**——是开发者需求；ParallelMe 应默认收起（呼应 [DC-01 原则 4 「细节按需展开」](../design-concepts/DC-01-scribe-activity.md)）

---

## 4 · Pi.ai · AI 单聊的"情感对话感"基准（**反向证明：单 Agent 范式不能解决 ParallelMe 的问题**）

### 产品 / 版本 / 截图位置

- 产品：Pi by Inflection AI · `hey.pi.ai` Web + iOS/Android App（持续迭代到 2025）
- 截图位置：`hey.pi.ai` 任意会话——尤其是首次进入时 Pi 主动开启的"What's on your mind?"问候
- 关键 UI 区域：(1) **极简单列对话流**（屏幕中央窄列、极大留白）；(2) **气泡极柔和**（不带头像、不带时间戳、不带菜单按钮）；(3) **语音播放按钮**（每条 AI 回复都可以一键朗读，是 Inflection 的差异化能力）

### 可观测细节

- **极简单列**：Pi 的对话区**只有一列**——没有侧栏、没有 thread、没有引用、没有 @提及。所有交互压缩到"用户说一句 → Pi 回一句"的最简循环
- **气泡视觉极柔和**：(a) 无头像（Pi 没有"虚拟形象"）；(b) 无时间戳（让人忘记时间）；(c) 无右上角菜单（避免提供"复制 / 删除 / 反馈"等让用户出戏的工具）；(d) 圆角更大（比 ChatGPT 的 4px 更圆）
- **语气极慢**：Pi 的回复语速明显慢于 ChatGPT/Claude——**故意**用流式吐字的节奏制造"对方在思考" 的感觉
- **永远不打断**：Pi 不会主动 push 推送、不会在你停留时弹"还在吗？"——把"对话主动权 100% 交给用户"做成产品哲学
- **公开立场**：官网首句 `the first emotionally intelligent AI` + Inflection 公司定位 `transforms interactions from transactional to relational`——把"反工具感、反销售感" 当成品牌

### 为什么有效（**反向证明：单 Agent 单列范式不能解决 ParallelMe 的多声碰撞问题**）

- **Pi 是"情感单聊"的金标准**：要求"反工具感、反工程感、反销售感"——ParallelMe 在情绪温度上应该向 Pi 学习（克制、慢、不打断、不堆功能）
- **但 Pi 的单列范式 = ParallelMe 不能照抄的反面**：
  - Pi 的世界里**只有一个对话对象**，不存在"五声并发"问题
  - Pi 的对话流没有"谁先说 / 谁引用谁 / 谁反驳谁" 的需要
  - Pi 不存在"被多个声音淹没" 的认知负担
  - **ParallelMe 的核心难题（多 Agent 时的信息架构）在 Pi 身上根本不存在**
- **结论**：Pi 是**视觉温度 + 文案语态 + 节奏感**的最佳老师，但不是**信息架构**的老师。这是 5 个产品调研里最有价值的"反向锚点"——它告诉我们什么是温度的极致，但也告诉我们这个极致是**单 Agent 才能达到的**
- **Inflection 的"transactional → relational" 立场**：是产品哲学层面对 ParallelMe 最大的启发——**对话型 AI 的目标不是高效完成任务，是建立关系感**。但 ParallelMe 的"关系感" 是用户与五声集体之间的关系，不是与单一 AI 的关系——这又一次说明 ParallelMe 的难度是 Pi 的 N 倍

### 对应 DC-03 哪条原则

| Pi.ai 机制 | DC-03 对应 / 启发 |
| --- | --- |
| 极简单列 + 极大留白 | **温度参考但不照抄** —— ParallelMe 不可能极简单列，但**留白量级**应向 Pi 学习（圆桌的 voice 卡之间应有充足留白） |
| 无头像 / 无时间戳 / 无右上角菜单 | **部分借鉴**：roundtable 阶段的细节可以更克制，但**多 voice 场景必须保留头像**（否则用户分不清谁在说） |
| 故意慢速吐字 | **强校准**：[DC-02 原则 3 「节奏感优先于精确性」](../design-concepts/DC-02-scribe-narration-library.md) 的产品级证据 |
| 永远不打断 | [DC-03 沉浸感不可被工程化按钮打断](../design-concepts/DC-03-roundtable-information-architecture.md) 的强支撑 |
| transactional → relational 立场 | ParallelMe 的产品定位文案可借鉴这种否定式立场（"不是任务工具 / 不是治疗工具"） |
| 单列范式 = ParallelMe 不能照抄的反面 | **明确边界**：DC-03 必须坚持"对话流 + 状态板 + 元信息"的多区域信息架构，单列在多 Agent 场景失效 |

### 不该照抄的部分

- ❌ **极简单列范式**——ParallelMe 是多声场景，单列会让用户在五声里彻底迷路
- ❌ **无头像 / 无时间戳**——多声场景必须保留这两者，否则信息架构崩塌
- ❌ **故意慢吐字**——ParallelMe 的"慢" 应来自书记员的状态条节奏（[DC-02](../design-concepts/DC-02-scribe-narration-library.md)），voice 自身的回复速度应正常
- ❌ **永远不打断的极致克制**——ParallelMe 的书记员应该有"主动指出回避"的时刻（[DC-04 mirror_structure](../design-concepts/DC-04-confrontational-voice-design.md)），不应学到 Pi 的完全被动
- ❌ **`emotionally intelligent AI` 这种营销定位**——ParallelMe 的产品定位应基于具体能力（"五种声音替你说出你不敢说的"），不应使用 Pi 这种自我标签

---

## 5 · Character.AI · Multi Character Group Chat（**面向终端用户的多角色对话同构最强**）

### 产品 / 版本 / 截图位置

- 产品：Character.AI · Multi Character Group Chat（2025-09 大更新，称为 "Improvements for Multi Character Roleplays in Group Chat"）
- 截图位置：Character.AI iOS/Android App（桌面端 group chat 受限），创建 group chat → 添加 2-N 个 character → 发起对话；或加入官方 brainstorming room
- 关键 UI 区域：(1) **Group chat 创建面板**（选 N 个 character + 命名 + 设定场景）；(2) **运行时对话流**（每个 character 头像 + 名字 + 单独气泡 + 用户也作为一个 speaker）；(3) **auto memory 摘要**（AI 自动保存关键 plot 进展）

### 可观测细节

- **多 character 并存的对话流**：每条发言 = `[character 头像] [character 名] [发言正文气泡]`——所有 character 的发言**在同一时间流里**，按时间顺序排列，每个 character 用自己的头像 + 名字标识
- **用户也是一个 speaker**：用户的发言**视觉上与 character 同构**——同样的气泡形态、同样的"头像 + 名字"前缀，只是头像是用户自己的、气泡颜色略有差异。这是把"用户 = 圆桌一员"做成视觉一等公民的范本
- **next speaker 由 AI 决定**：用户发完一条消息后，**不是所有 character 都回复**——AI 自动决定"这一回合谁该接话"（基于 character 性格 + 上下文相关性）。同一回合可能有 1-3 个 character 发言，**不会全员发言**
- **auto memory 自动摘要**：随着对话进展，AI 自动提取关键 plot 进展保存成"记忆"——这是把多 character roleplay 长会话**信息压缩**做成产品功能
- **roleplay 而非 chat 的定位**：Character.AI 用 "roleplay" 而不是 "chat" 描述这种多 character 对话——明确告诉用户"这是一个虚构场景，不是工具对话"，**降低用户的"它说错了" 焦虑感**
- **group chat 仅在移动端可用**：桌面端目前不开放 group chat（受限），证明**多 character 群聊在桌面端的设计仍是难题**——这是行业共同遇到的挑战

### 为什么有效（**面向终端用户的多角色对话最直接的同构参考**）

- **多 character 同流但不同身份 = ParallelMe 的核心范式**：Character.AI 解决的是与 ParallelMe 完全相同的问题——多个独立人格 AI 在同一对话流里说话，用户也是一个参与者。它给出的视觉答案是 **"同流 + 头像区分 + 颜色微差"**——这强力支持 [DC-03 Same Stream, Different Card Template](../design-concepts/DC-03-roundtable-information-architecture.md) 的设计方向
- **用户视觉 = character 视觉同构**：把用户做成"圆桌一员"而非"对面的提问者"——这是 [DC-03 Conversational Symmetry](../design-concepts/DC-03-roundtable-information-architecture.md) 原则的产品级证据。ParallelMe 当前用户发言用 italic + 引号，可考虑升级为"头像 + 名字 + 气泡"的同构形态
- **next speaker 智能选择 ≠ 全员发言**：Character.AI 的关键决策是"不是全员每轮都说话"——同一回合只有相关 character 接话。对应到 ParallelMe——这是对 [EXP-03 缺席声音](../experience-log/EXP-03-multi-agent-absence.md) 的关键校准：**有时候缺席是对的**（不是 bug）。问题在于"缺席要不要让用户看见"，而不是"必须每个 voice 都说话"
- **auto memory = 长会话信息压缩**：把"AI 自动总结 plot" 做成产品能力——对应到 ParallelMe，[DC-04 mirror_structure 书记员](../design-concepts/DC-04-confrontational-voice-design.md) 在长圆桌时可以扮演 auto memory 的角色（每 N 轮自动产出一个"截至目前的关键脉络"）
- **roleplay 定位 = 降低事实性焦虑**：明确告诉用户"这是虚构场景"——降低了用户对"AI 说的对不对" 的焦虑。对应到 ParallelMe——可考虑在产品定位文案中明确"五声不是建议，是镜子里的不同侧面"，让用户从"我要听谁的对" 切换到"我看到了我自己的几面"
- **桌面端受限 = 行业共同难题**：Character.AI 至今不在桌面端开放 group chat，证明多 character 群聊在大屏幕上的信息架构**没有公认答案**——这反过来意味着 ParallelMe 在桌面端的圆桌设计本身就是**对未解难题的探索**，没有现成可抄的样板

### 对应 DC-03 哪条原则

| Character.AI 机制 | DC-03 对应 / 启发 |
| --- | --- |
| 多 character 同流 + 头像区分 | **强校准**：[DC-03 Same Stream, Different Card Template](../design-concepts/DC-03-roundtable-information-architecture.md) 的产品级证据 |
| 用户 = character 视觉同构 | **强升级建议**：用户发言可考虑从 italic+引号升级为"头像+名字+气泡" 的同构形态 |
| next speaker 智能选择 | **强校准**：[EXP-03 缺席声音](../experience-log/EXP-03-multi-agent-absence.md) 的关键决策——**缺席不是 bug，可见的缺席才是**。书记员应让缺席被看见，而不是强制全员发言 |
| auto memory 长会话压缩 | **新方向**：书记员的 mirror_structure 可扩展为 auto memory 角色 |
| roleplay 定位 vs chat 定位 | **新方向**：产品定位文案的"镜子" 隐喻可借鉴 |
| 桌面端 group chat 受限 | 反向印证：ParallelMe 桌面端圆桌设计是"对未解难题的探索" |

### 不该照抄的部分

- ❌ **Character.AI 是 roleplay 娱乐场景**——视觉饱和度高（character 头像往往是动漫风 / 写实人物画），ParallelMe 的"克什米尔木色 + 暖米白" 基调不应学到任何"二次元 / cosplay" 风
- ❌ **character 的头像是具象人物**——ParallelMe 的五声头像应是**抽象的色块 / 几何形状**（不是具象人脸），让用户在五声里看到"自己的不同部分"，而不是"五个外人"
- ❌ **roleplay 的"虚构剧情"语境**——ParallelMe 是真实情绪场景，五声说的话**不是虚构**，是用户自己内心声音的镜像。不能学到 Character.AI 的"剧情" 框架
- ❌ **auto memory 直接展示给用户**——Character.AI 的 memory 摘要是用户可见的；ParallelMe 的书记员观察更应该是**按需展开**（[DC-01 Layer 2 Trace Panel](../design-concepts/DC-01-scribe-activity.md)），默认不打扰主流
- ❌ **桌面端不开放是 Character.AI 的妥协，ParallelMe 不能跟随**——ParallelMe 的桌面端必须做好（用户主要使用场景），不能用"行业难题" 当借口

---

## 跨产品共性提炼

5 个产品（Slack / Discord / AutoGen Studio / Pi.ai / Character.AI）覆盖了**人-人 / 人-AI / 多 AI** 三种对话拓扑的全部象限，2024-2026 年集体收敛出**七条多代理对话流的公理级实践**：

### 公理 1 · 嵌套深度必须有上限

Slack 经过多版试错后**铁律式降到 1 层嵌套**——这是公开的设计反思。Reddit/HN 的无限嵌套是反例。对应到 ParallelMe——圆桌的"反驳链 / 引用链" 必须限定 **最多 1 层嵌套**（A 反驳 B，C 接着反驳 A 的反驳 = 仍是新的 1 层；不允许 D 再去反驳 C 的反驳）。

### 公理 2 · 主流 vs 分支必须有视觉隔离

Slack 选侧栏、Discord 选 inline 引用块、AutoGen 选 trace 折叠、Character.AI 选同流但不同头像——**所有顶级产品都给"分支"做了与主流不同的视觉处理**，区别只在轻重程度。**绝不允许分支以与主流完全相同的视觉权重出现在主流中**。

### 公理 3 · 多角色必须有头像 + 名字双重标识

Discord / AutoGen / Character.AI 全部给每个 speaker 配头像 + 名字。Pi.ai 是反例（没有头像）但它是**单 Agent** 场景。**多 Agent 场景下，头像 + 名字是不可省略的最低身份信号**。ParallelMe 的五声当前已对齐此原则，应继续保持。

### 公理 4 · "谁来接话"应该是显式产品决策

AutoGen 的 `allowed_speaker_transitions_dict` + Character.AI 的 next-speaker AI 决策——**谁能接话不应是 LLM 自由发挥的结果**，应是产品级的显式约束。对应到 ParallelMe，每种 moveType（continue_all / duel / mirror_structure）应配置不同的 speaker transition 规则，而不是让编排器 LLM 凭直觉判断。

### 公理 5 · 缺席不是 bug，可见的缺席才是

Character.AI 同一回合不要求所有 character 都说话——**缺席本身是正常状态**。问题不在"为什么 X 没说话"，而在"如果 X 该说话却没说，用户能否看到这件事"。这是 [EXP-03 缺席声音](../experience-log/EXP-03-multi-agent-absence.md) 的关键校准——书记员的职责是**让缺席被看见**，不是**强制全员发言**。

### 公理 6 · 用户必须是对话的一等公民

Character.AI 把用户做成"圆桌一员"（同样的头像 + 名字 + 气泡）—— Discord/Slack 也类似。**绝不应让用户处于"对面提问者"的二等公民位置**。ParallelMe 当前用户发言用 italic + 引号是降级形态，应升级。

### 公理 7 · 长会话需要内置压缩机制

Character.AI auto memory + Slack thread 摘要 + AutoGen trace 折叠——**所有顶级产品都把"长会话压缩"做成产品功能**，而不是让用户面对原始全量记录。对应到 ParallelMe——书记员的 mirror_structure 应扩展为定期"截至目前的关键脉络"摘要能力。

---

## ParallelMe 直接行动建议（基于 5 产品调研）

> 不是建议未来做，是**已经验证可行、可立即写进 backlog** 的具体动作。本 DR 不替用户拍板，按工作流"先沉淀，再讨论"原则提供事实证据。

| 建议 | 来源 | 影响 DC | 建议进度 |
| --- | --- | --- | --- |
| **DC-03 增加「反驳链 ≤1 层嵌套」铁律** | Slack 设计博客 | DC-03 | DC 升级动作（强制约束） |
| **`lib/llm.ts` 增加 `allowedSpeakerTransitions` 配置**（每种 moveType 一套规则，duel 时只允许被 challenge 的 voice 接话） | AutoGen | DC-03 + lib/llm.ts | R 系列新增候选（工程改造） |
| **DC-03 增加「对峙 duel 视觉应有侧栏 / 模态形态」探索章节**（响应式：≥ 1024px 侧栏，< 1024px 全屏模态） | Slack 侧栏 + Character.AI 移动端 | DC-03 + DC-05 | DC 升级动作 |
| **DC-03 增加「voice 互引用 = inline 引用块」规范**（小字 + 头像 + 前 60 字 + 可点跳转） | Discord | DC-03 | DC 升级动作 |
| **DC-03 + components/TurnEntry.tsx 升级用户发言为「头像+名字+气泡」同构形态**（移除 italic+引号的二等公民形态） | Character.AI + Discord | DC-03 + 组件 | R 系列新增候选 |
| **DC-04 mirror_structure 扩展为 auto memory 角色**（每 N 轮自动产出"截至目前的关键脉络"摘要） | Character.AI auto memory | DC-04 | DC 升级动作 |
| **EXP-03 缺席声音的关键校准**（缺席不是 bug，可见的缺席才是；书记员的职责是让缺席被看见） | Character.AI next-speaker | EXP-03 + DC-04 | EXP 文档校准 |
| **「ParallelMe 是镜子里的不同侧面，不是建议」产品定位文案** | Character.AI roleplay 定位 + Pi.ai 否定式立场 | 产品定位 / 主页面 | R 系列新增候选 |
| **「voice 被引用 / 书记员被点名」严禁红点角标** | Discord 极轻色条 | 全产品视觉规范 | 全局视觉约束（写入 DC-05） |
| **声明式 voice 配置应保持** —— `lib/selves.ts` 的 VoiceSoul 接口路径正确 | AutoGen 声明式配置 | 现状校准 | 强校准信号（保持当前方向） |
