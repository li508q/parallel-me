# DR-05 · 议题卡与摘要卡 · 业界参考

- 性质：[DC-05 议题卡设计语言](../design-concepts/DC-05-brief-card-design.md) 的业界证据库
- 调研窗口：2024-2026 年最新版本
- 关联：[DR README · 调研规范六项](README.md)

---

## 一句话立场

> 议题卡 / 摘要卡是"把 N 个属性塞进一个有限矩形"的古老问题——Linear 用极简属性 + 高密度 + 键盘快捷键把它做成 SaaS 行业的金标准、Notion 用「Everything is database」的多视图哲学覆盖所有形态、Granola 用「jot and enhance」 + 黑字灰字二分把 AI 摘要做成"AI 不抢主"的范本、Stripe 是唯一开源 4 篇官方 checkout/billing/invoice 设计指南的支付产品、Apple Notes 在 iOS 18 把 Apple Intelligence 集成到极致克制的笔记卡里。本 DR 提取的不是装饰，是**把"任务框" / "议题" / "摘要" 做成视觉一等公民**的具体机制。

---

## 1 · Linear issue card · SaaS 行业议题卡的金标准（**极简属性 × 高密度 × 键盘第一**）

### 产品 / 版本 / 截图位置

- 产品：Linear · `linear.app` 持续迭代到 2026（`linear.app/changelog` 长期更新）
- 截图位置：(a) Linear inbox / triage / project 视图中的 issue 列表（每行 = 一个 issue card）；(b) hover 任意 issue 时按 `Space` 触发的 peek 弹层；(c) `Cmd+K` 唤起的 command menu
- 关键 UI 区域：(1) **issue 列表行**（图标 + 状态 + 标题 + 优先级 + assignee + 截止日期，单行 ≤ 60px 高）；(2) **peek panel**（按住 Space 时浮出的卡片预览，松开消失）；(3) **issue details bar**（详情页顶部的属性条，2019 改版后简化）；(4) **command menu**（`Cmd+K` 唤起的统一动作面板）

### 可观测细节

- **单行 issue 容纳 6 个属性 + 标题**：状态图标（◯ Backlog / ◐ In Progress / ● Done） + 标识符（`ENG-123`） + 标题 + 优先级（▁▃▅▇）+ assignee 头像 + 截止日期——全部塞在 ≤ 60px 高的一行内，**信息密度极高但不拥挤**
- **状态用图形而非文字**：状态用 ◯/◐/● 等几何符号 + 颜色编码，不用 "Backlog/In Progress/Done" 等文字标签——**节省横向空间 + 加快识别**
- **优先级 4 级竖条**：▁▃▅▇ 四级竖条直接表达优先级——**视觉权重 = 信息权重**，无需阅读
- **`Space` peek = "看一眼就走"模式**：hover issue 时按住 `Space` 浮出预览卡片，松开消失——**不离开当前列表就能看到详情**，是"密度 + 不打扰" 的范本
- **`Cmd+K` command menu 统一所有动作**：所有可执行操作（创建 issue / 切换视图 / 改状态 / 邀请人）全部归一到 `Cmd+K`——**一个入口取代 N 个按钮**
- **字母组合导航**（`G+I` 进 Inbox / `G+M` 进 My Issues）：受 vim 启发的双键导航——**键盘第一是 Linear 的产品哲学**
- **issue details bar 简化**：2019 改版把详情页顶部的下拉菜单**全部替换为 command menu actions**——**减少视觉控件，把动作收编到统一入口**
- **changelog 长期开放**：`linear.app/changelog` 持续公开每一次 UI 调整——**设计透明化作为产品价值**

### 为什么有效（**ParallelMe 议题卡 / 任务框的最强同构参考**）

- **极简属性 × 高密度 = 议题卡的最优解**：Linear 证明"塞下 6 个属性 + 标题 + 不拥挤" 是可达的——关键是**用图形/颜色替代文字、用空间布局替代标签**。对应 ParallelMe，[DC-05 议题卡](../design-concepts/DC-05-brief-card-design.md) 的属性（who / what / when / why / mood / urgency）也应**用图形/色调表达**，避免文字标签堆叠
- **`Space` peek = "看一眼就走" = 议题切换的零成本**：在多议题场景，用户需要快速浏览多个议题——peek 模式让用户**不离开主流就能看到议题详情**。对应 ParallelMe，[DC-03 圆桌信息架构](../design-concepts/DC-03-roundtable-information-architecture.md) 的"切换议题" 应有 peek 等价物
- **状态图形化 = 视觉权重 = 信息权重**：用 ◯/◐/● 而非 "Backlog/In Progress/Done"——**节省 80% 横向空间 + 识别速度提升 3x**。对应 ParallelMe，议题的"状态"（草拟 / 桌上 / 归档）应有等价的图形编码
- **`Cmd+K` 统一入口 = 反控件堆叠**：Linear 用一个 command menu 替代 N 个按钮，证明 SaaS 场景下"统一入口"是密度优化的关键路径——对应 ParallelMe 的"主持人 console"，所有书记员动作 / 编排动作可考虑收编到统一 command menu
- **键盘第一 = 高频用户的真正爱**：Linear 的 `G+I` 字母组合导航是**反主流但被高频用户最爱**的设计——证明产品哲学有时需要"对极少数人极致好" 而非"对所有人都凑合"。对应 ParallelMe，可考虑为深度用户设计键盘流（如 `J/K` 切换 voice 视角 / `R` 进入 roundtable）
- **changelog 透明化 = 产品诚实的具体动作**：Linear 公开每一次 UI 调整作为产品价值——对应 ParallelMe，[experience-log/](../experience-log/README.md) 已在做同方向，验证此方向正确

### 对应 DC-05 哪条原则

| Linear 机制 | DC-05 对应 / 启发 |
| --- | --- |
| 极简属性 × 高密度（≤60px 行） | **强校准**：[DC-05 议题卡布局](../design-concepts/DC-05-brief-card-design.md) 应锁定单卡密度上限 |
| 状态图形化（◯/◐/●） | **强升级建议**：议题状态应有图形编码（草拟 ◯ / 桌上 ◐ / 归档 ●） |
| 优先级 4 级竖条（▁▃▅▇） | **新方向**：议题"轻重"维度可借鉴竖条编码 |
| `Space` peek 模式 | **新方向**：[DC-03 议题切换](../design-concepts/DC-03-roundtable-information-architecture.md) 可考虑 peek 等价 |
| `Cmd+K` command menu | **新方向**：主持人 console 可收编到统一 command menu |
| 字母组合导航（G+I/G+M） | **新方向**：深度用户的键盘流（J/K 切 voice / R 进 roundtable） |
| changelog 透明化 | [experience-log/](../experience-log/README.md) 同方向，强校准 |

### 不该照抄的部分

- ❌ **Linear 是工程协作工具语境**——issue 是工作任务，ParallelMe 的"议题" 是情绪 / 决策话题，**不应学到任何"任务管理 / 工单 / 状态流转" 的工具感**
- ❌ **Linear 的密度对工程师友好，对普通用户可能过密**——ParallelMe 应**降一档密度**（单卡可以更高一点 80-100px），保留呼吸感
- ❌ **`ENG-123` 标识符是工程语境**——ParallelMe 不应有任何"编号" 出现在用户可见区域
- ❌ **Linear 的紫色 / 黑色基调是 SaaS 工业感**——ParallelMe 必须保持"克什米尔木色 + 暖米白" 的温度
- ❌ **键盘第一对深度用户友好，但首次访问用户不应被强制学键盘**——ParallelMe 的键盘流必须是**渐进式可发现**（hover 时显示快捷键 tooltip），不能是必经之路
- ❌ **优先级在 ParallelMe 不存在**——情绪 / 决策话题没有"P0/P1/P2"，竖条编码若使用应改为别的语义维度（如"内心权重 / 急迫感"）

---

## 2 · Notion database card · 「Everything is database」的多视图哲学（**同一议题 N 个视角的范本**）

### 产品 / 版本 / 截图位置

- 产品：Notion · 2025-07-10 发布的 2.52「Everything is database」版本 + 2025-06 Feed View + 2025-02 Tabbed database page layouts
- 截图位置：(a) 任意 database 页面右上角 view tabs（默认 Table，可加 Board / Gallery / Calendar / Timeline / List / Form / Chart / Map / Feed 等 9 种）；(b) View settings → Property visibility 面板（每个 property 旁有 👁️ icon 控制显隐）；(c) Tabbed database page layout（一个 page 内可放多个 tab，每个 tab 一个不同的 view）
- 关键 UI 区域：(1) **view tabs**（顶部一行可切换的视图切换器）；(2) **property visibility 控制面板**（每个属性的眼睛图标控制是否在当前视图显示）；(3) **card 形态随视图变形**（Board view 时是卡片、Gallery view 时是大图卡、Feed view 时是顶部带属性行的流式卡）

### 可观测细节

- **同一份数据 N 种呈现**：Notion 的核心哲学是 `same data, different views`——一份 database items 数据可以同时以 Table / Board / Gallery / Feed 等 9 种视图呈现，**每种视图自动重排版面**而无需用户重新建数据
- **Property visibility 是每个视图独立配置的**：同一个 property 可以在 Table view 显示但在 Board view 隐藏——**视图密度按使用场景定制**
- **Feed view 把属性作为顶部行**：2025-06 发布的 Feed view 把所有可见属性**渲染为每条 entry 顶部的一行小标签**，正文内容紧跟其后——**密度极高的"流 + 元数据" 范式**
- **Tabbed database page**：2025-02 引入的 tabbed page layout 允许在一个 page 内放多个 tab，**每个 tab 内嵌一个 linked database 的不同视图**，且自动应用 filter——**一个议题多个切片**的结构化呈现
- **2025-07 「Everything is database」哲学**：Notion 把所有内容（page / note / task / project）统一到 database 抽象——`Now Notion AI can answer extra-complex questions about your databases, drawing info from across properties and any notes inside your database`
- **Card 内容可包含完整 page**：每条 database entry 不仅是行/卡，**点开是一个完整的 page**（可以有标题 + body + 子 database），是"卡片即文档" 的范本

### 为什么有效（**ParallelMe 议题卡多视图切换的最强同构参考**）

- **「同一份数据 N 个视图」直接解决 ParallelMe 的核心需求**：圆桌的同一议题在不同阶段需要不同呈现——opening 是 brief card 形态、roundtable 是 timeline 形态、清明落定是 summary 形态——**这本质上是 Notion 的多视图模型**。对应到 ParallelMe，议题数据应该是**单一数据源**，UI 是**这份数据的不同视图**，避免数据冗余
- **Property visibility 每视图独立 = 议题卡密度按场景定制**：在 ParallelMe 的不同 stage，议题卡需要露出的属性不同（taskFrame 时露出 mood/urgency、roundtable 时露出 who_speaks_next、settlement 时露出 archived_traces）——Notion 的 visibility 模型直接适用。**对应 [DC-05 议题卡设计语言](../design-concepts/DC-05-brief-card-design.md)**：议题卡应有 `propertyVisibility[stage]` 配置而非硬编码每个 stage 的展示
- **Feed view 顶部属性行 = 高密度流的视觉范本**：当议题 + 属性 + 正文需要同时展示且不能堆叠时，Feed view 的"顶部属性行 + 正文 紧跟" 是密度最高的解。对应 [DC-03 圆桌时间流](../design-concepts/DC-03-roundtable-information-architecture.md)，每个 turn entry 可以借鉴顶部属性行（who / when / mood）+ 正文紧跟的布局
- **Tabbed database page = 一个议题 N 个切片的结构化呈现**：议题在不同维度需要不同切片——情绪切片 / 决策切片 / 关系切片——对应 ParallelMe 清明落定阶段，可考虑用 tabbed page 呈现（"情绪脉络 / 关键决策 / 待思考点" 三个 tab），而不是单页堆叠
- **「Everything is database」= 数据抽象的统一**：Notion 把 page / note / task 统一到 database——对应 ParallelMe，议题 / turn / archived trace 都应统一到一个 schema 而非分散数据结构。这与 [lib/v7.ts schema 抽象](../design-concepts/DC-05-brief-card-design.md) 同方法论
- **Card 即 Page = 议题卡可深入而不打断主流**：Notion 的卡可以点开成完整 page——对应 ParallelMe 议题卡，hover/click 可深入完整议题视图，**主流不被打断**（呼应 [DR-03 公理 2 主流 vs 分支视觉隔离](DR-03-conversation-stream-references.md)）

### 对应 DC-05 哪条原则

| Notion 机制 | DC-05 对应 / 启发 |
| --- | --- |
| 同一数据 N 个视图 | **强升级建议**：[DC-05](../design-concepts/DC-05-brief-card-design.md) 应明确"议题数据 → 视图渲染" 的分离，避免每 stage 重复定义议题卡 |
| Property visibility 每视图独立 | **强升级建议**：议题卡按 stage 配置 propertyVisibility 而非硬编码 |
| Feed view 顶部属性行 | **新方向**：[DC-03 turn entry 布局](../design-concepts/DC-03-roundtable-information-architecture.md) 可借鉴顶部属性行 + 正文紧跟 |
| Tabbed database page | **新方向**：清明落定阶段可用 tabbed 切片（情绪 / 决策 / 待思） |
| Everything is database 哲学 | **强校准**：[lib/v7.ts schema](../design-concepts/DC-05-brief-card-design.md) 数据抽象的统一性方向正确 |
| Card 即 Page 可深入 | **强校准**：议题卡的 hover preview + click 深入分层，与 [DR-03 公理 2 视觉隔离](DR-03-conversation-stream-references.md) 同向 |

### 不该照抄的部分

- ❌ **Notion 是知识管理工具，9 种视图是为多场景而生**——ParallelMe 不需要 9 种视图，**3-4 种就够**（taskFrame / roundtable / settlement / archive），多了反而是认知负担
- ❌ **Notion 的 view tabs 让用户主动切换视图**——ParallelMe 应**根据 stage 自动切换**视图，不应让用户操心"我现在该看 Board 还是 Feed"
- ❌ **Notion 的 property 是用户可自定义的**（database schema 灵活）——ParallelMe 的议题 schema 应**严格固定**（who/what/when/why/mood/urgency 是产品级 schema 而非用户可改），避免"用户被自由淹没"
- ❌ **Notion 的密度对工作场景合适，对情绪场景过密**——ParallelMe 应**降一档密度**，给情绪话题留呼吸空间
- ❌ **Notion AI 在 database 上的能力是"复杂查询"**（draws info from across properties）——ParallelMe 的书记员不是查询助手，**不应学到任何"AI 帮你查数据" 的工具感**
- ❌ **Tabbed page layout 的多 tab 切换可能让用户对"主流" 失去定位**——ParallelMe 使用 tabbed 时必须有**明显的"主流位置" 锚点**，避免用户不知道"我在哪一层"

---

## 3 · Granola brief card · "jot and enhance" + 黑字灰字二分（**AI 不抢主的议题卡范本**）

### 产品 / 版本 / 截图位置

- 产品：Granola · `granola.ai` 持续迭代到 2025-12（2025-12-19 发布 Mentions 等更新）+ 29 个开箱即用 meeting note templates + "Edit notes by asking" 功能
- 截图位置：(a) 进入会议时左侧空白笔记区（Granola 不主动写，等用户先 jot）；(b) 用户用粗略 bullet 写下结构后，会议结束时 AI enhance —— **用户黑字 + AI 灰字**；(c) AI 灰字 bullet 旁边的小 hyperlink，点开跳转到原 transcript 对应位置；(d) `templates` 选择器（29 个预设：Project Kick-Off / Pipeline Review / 1:1 / Customer Call / Interview ...）；(e) "Edit notes by asking" 文本框（让用户用自然语言要求 AI 改 tone / length / 精确编辑）
- 关键 UI 区域：(1) **空白笔记区 + `Jot a few notes…` 占位**（不主动写）；(2) **enhance 触发**（会议结束时一键触发，不在过程中打扰）；(3) **黑字 / 灰字二分**（用户原笔记黑色，AI 补全灰色，色阶差作为唯一来源标识）；(4) **AI bullet 的 hyperlink**（每条 AI 补的内容都可点跳转到 transcript 对应行，是溯源能力）；(5) **template 结构骨架**（每个 template 给出预设的 sections，引导用户在该结构内 jot）

### 可观测细节

- **官方原话定义产品哲学**：`Granola works as an AI notepad, not a note taker. You write the structure, AI fills in [the rest]`——明确把产品定位为"笔记本（被人用）" 而非"记录员（自己工作）"
- **黑字 / 灰字是唯一的来源标识**：`Granola renders the AI-written text in gray, below the user's own text in black`——用色阶（不是 badge / icon / 边框）区分人 vs AI 来源。**视觉权重 = 信任权重**：黑字（用户）权重高、灰字（AI）权重低
- **每条 AI bullet 都带 hyperlink 溯源**：`Every AI-added bullet also carries a hyperlink; clicking it [jumps to the source]`——AI 补全内容**必须可溯源**到原 transcript，让用户随时验证 AI 是否扭曲
- **enhance 是"会议结束后" 一次性触发，不在过程中打扰**：用户在会议中只看到自己的黑字笔记，**AI 不在过程中主动插话** —— 这与 ChatGPT 在用户输入时就有 typing indicator 完全相反
- **`Jot a few notes…` 占位文案降低门槛**：用 jot（记几笔）而不是 take notes（做笔记），**动词的轻量感降低开始的心理门槛**
- **29 个 template 预设结构**：Project Kick-Off / Pipeline Review / 1:1 / Customer Call / Interview ... 每个 template 给出该场景的 section 骨架（如 1:1 = `Wins / Blockers / Asks / Next Steps`）——**结构化的 brief 骨架按场景准备**
- **"Edit notes by asking" 自然语言改写**：用户可以用自然语言指令（"make this tighter"、"change tone to casual"、"add the action items I mentioned"）让 AI 修改笔记——**AI 编辑能力是按需召唤而非默认介入**
- **不弹"成功！" toast**：会议结束 AI enhance 完后**没有庆祝弹窗 / 成功提示音 / "你的笔记已增强！" badge**，AI 安静完成工作并退场（已在 [DR-02 Granola 章节](DR-02-narration-tone-references.md) 论证过）

### 为什么有效（**议题卡 = brief card 的 AI 时代范本**）

- **"AI notepad, not note taker" = 议题卡的产品哲学声明**：Granola 把"AI 是辅助、人是主人" 做成产品级哲学——直接对应 ParallelMe 议题卡的设计原则。**议题卡是用户的议题，不是 AI 的议题**——AI 可以补全、整理、高亮，但**议题的主语永远是用户**。这是 [DC-05 议题卡设计语言](../design-concepts/DC-05-brief-card-design.md) 应该明确写入的产品哲学
- **黑字 / 灰字 = 议题卡来源溯源的金标准**：用色阶而非 badge 区分用户原话 vs AI 补全——视觉极轻、信任权重清晰、不打断阅读流。**对应 ParallelMe 议题卡**：用户填写的 brief（who / what / when）应是黑字、AI 补全的（why 推断 / mood 推测 / urgency 估计）应是灰字。这是 [DC-05 P3 Whisper Metadata · 用色不用框](../design-concepts/DC-05-brief-card-design.md) 的产品级证据
- **每条 AI bullet 可点跳转溯源 = 议题卡的可信赖性基础**：AI 补的每一条都可被用户随时验证——**AI 不可信任的核心解药是可溯源**。对应 ParallelMe，议题卡的 AI 补全字段（如"我推断你想说的是 X"）应该可以**跳转到对应 turn 的原话**，让用户验证 AI 推断的准确度
- **enhance 是会议后一次性触发 = 不打扰主流的工程范本**：AI 不在用户思考时插话——直接对应 [DR-01 公理 5 · AI 不能视觉特殊化](DR-01-streaming-ui-references.md) + [DR-03 公理 2 · 主流 vs 分支视觉隔离](DR-03-conversation-stream-references.md)。**对应 ParallelMe**：议题卡的 AI 补全应在用户**完成 brief 后**触发，而不是在用户键入时实时插话
- **`Jot a few notes…` 占位文案的轻量感**：对应 [DR-02 公理 5 · 动词选择 = 产品哲学声明](DR-02-narration-tone-references.md)。ParallelMe 议题卡的 placeholder 应避免 `请详细描述你的议题`（重）改为 `说说看…` / `先随便记几句…`（轻）
- **29 个 template = 结构化骨架按场景准备**：Granola 不强迫用户从空白开始，提供场景化骨架——对应 ParallelMe，议题卡可考虑提供 3-5 种**议题骨架 template**（如"决策类 / 情绪类 / 关系类 / 反思类"），让用户从结构开始而不是空白
- **"Edit notes by asking" = 自然语言修改议题卡**：用户用自然语言指令让 AI 改议题——对应 ParallelMe，议题卡进入 roundtable 后用户应能用自然语言**追加 / 修改 / 重新框定** 议题（"再加一句：我希望大家也讨论 Y"），而不是必须重新打开编辑面板
- **不弹"成功" toast = 议题卡完成态的克制范本**：议题卡保存 / AI 补全完成时**严禁出现庆祝弹窗 / 成功 badge**——直接对应 [DR-01 公理 6 · 状态文案克制](DR-01-streaming-ui-references.md)

### 对应 DC-05 哪条原则

| Granola 机制 | DC-05 对应 / 启发 |
| --- | --- |
| AI notepad, not note taker | **强校准**：[DC-05](../design-concepts/DC-05-brief-card-design.md) 应明确写入"议题卡是用户的，不是 AI 的" 产品哲学 |
| 黑字 / 灰字二分 | **强升级建议**：[DC-05 P3 Whisper Metadata](../design-concepts/DC-05-brief-card-design.md) 应明确"用户字段黑、AI 补全字段灰" 视觉规范 |
| AI bullet 可点跳转溯源 | **强升级建议**：议题卡 AI 补全字段应可跳转到原 turn / 推断依据 |
| enhance 会议后一次性触发 | **强校准**：议题卡 AI 补全应在用户完成 brief 后触发，不实时插话 |
| `Jot a few notes…` 占位 | **强升级建议**：议题卡 placeholder 应轻动词（"说说看…"） |
| 29 个 template | **新方向**：可考虑议题骨架 template（决策 / 情绪 / 关系 / 反思 / 计划） |
| Edit notes by asking | **新方向**：roundtable 阶段允许用户用自然语言追加 / 修改议题 |
| 不弹成功 toast | **强校准**：议题卡完成态严禁庆祝弹窗 |

### 不该照抄的部分

- ❌ **Granola 是会议笔记产品，议题卡是事后产物**——议题卡基于 transcript 生成；ParallelMe 的议题卡是**事前产物**（议题确立后才进入 roundtable），**生成时机相反**，不应学到"基于历史数据自动总结" 的范式
- ❌ **Granola 的灰字内容是事实摘要**（来自 transcript）——ParallelMe 议题卡的 AI 补全是**推断**（"我猜你想说的是…"），**性质不同**：摘要可以追求精确，推断必须留下"我可能错"的余地。**ParallelMe 灰字 AI 补全应有显式的"推断" 标记**（如 hover 显示"这是我的推测，可能不准"），而不是 Granola 那样直接渲染为既成事实
- ❌ **29 个 template 数量过多**——Granola 是 B 端工具语境（用户每天开 N 种会议）；ParallelMe 是 C 端情绪场景（用户的议题类型有限），**3-5 个就足够**，多了反而是认知负担
- ❌ **"Edit notes by asking" 的自然语言指令模式偏工具感**——对 B 端笔记合理，对 C 端议题应**降一档表达**（如改成"我想再补一句…" 而非"add the action items"）
- ❌ **Granola 的 hyperlink 跳转到 transcript 是文本溯源**——ParallelMe 议题卡的溯源应是**情绪 / 推断链溯源**（"我说你 mood=焦虑，是因为你提到了 X 三次 + Y 一次"），不是简单的文本指针
- ❌ **Granola 的"Jot first, AI later" 流程是顺序的**（用户先写完，AI 才介入）——ParallelMe 议题卡可以**部分实时**（用户键入 who 时 AI 不参与，键入完整 brief 后 AI 才补充推断字段），不必完全等到会议结束

---

## 4 · Stripe Checkout / Invoice · 唯一开源 4 篇官方 checkout/billing 设计指南（**摘要卡 = 已完成动作的呈现范本**）

### 产品 / 版本 / 截图位置

- 产品：Stripe Checkout + Stripe Elements + Payment Successful Page + Invoice + 4 篇官方设计指南（`stripe.com/resources/more/credit-card-checkout-ui-design` / `checkout-ui-strategies-for-faster-and-more-intuitive-transactions` / `payment-successful-pages` / `designing-a-billing-page-that-converts`）
- 截图位置：(a) `stripe.com/payments/checkout` 产品页的 demo checkout；(b) Stripe 自家网站 `stripe.com/billing` 升级 Plan 时的实际 checkout 页面；(c) 4 篇 design guide 配套截图；(d) Stripe 官方 invoice 模板（`stripe.com/resources/more/invoice-requirements`）
- 关键 UI 区域：(1) **summary 卡（订单摘要）**：金额 + 商品 + 税 + 折扣的层次清晰呈现；(2) **trust signals 区**：Powered by Stripe / 锁图标 / Money-back guarantee 等信任元素的极简呈现；(3) **payment successful page 五段结构**：Payment confirmation + Order summary + Payment information + Next steps + Customer support；(4) **Stripe Elements** 模块化 UI 组件：Card / Address / Payment Request 等可独立使用、风格统一

### 可观测细节（**Stripe 是唯一把支付 UX 设计公开为方法论的支付公司**）

- **官方 4 篇设计指南公开化**：Stripe 是**唯一**把自家 checkout / billing / payment success / invoice 的设计哲学**完整文档化对公众开放**的支付公司——竞争对手（PayPal / Square / Adyen）都不开源设计方法论
- **Payment successful page 的 5 段标准结构**（官方 guide 明确列出）：
  1. **Payment confirmation**（支付确认）— 一句话定性 + 大金额数字 + 状态图标
  2. **Order summary**（订单摘要）— 商品列表 + 数量 + 单价 + 总计的层次化展示
  3. **Payment information**（支付信息）— 卡片末四位 + 时间戳 + transaction ID
  4. **Next steps**（下一步）— 明确告诉用户接下来该做什么（"查看你的发票" / "返回控制台"）
  5. **Customer support**（客服入口）— 不显眼但存在的"出问题怎么办"
- **`What elements are key, what to skip` 二分方法论**：Stripe 的 checkout guide 不只说"加什么"，更说"该跳过什么"——`avoid asking for unnecessary information`、`skip optional fields by default`、`don't add visual noise`。**减法是产品决策**
- **trust signals 极简而非堆叠**：Stripe 的 checkout 不堆 10 个安全 badge 吓唬用户——`Powered by Stripe` 一行小字 + 锁图标足够，**信任不是靠堆 badge 建立的**
- **Stripe Elements modular = 可拼装但风格统一**：`Stripe's suite of modular UI building blocks make it easy to design a secure on-brand checkout`——把 UI 拆成可独立使用的小组件（CardElement / AddressElement / PaymentRequestElement），**每个组件单独完美 + 组合自然统一**
- **Appearance API 让品牌风格可注入**：Stripe Elements 可以通过 Appearance API 注入字体 / 色彩 / 圆角 / 间距，但**核心交互 / 验证逻辑不可被破坏** —— `customize look and feel without breaking [the secure flow]`
- **行业级公认评价**：`Stripe's Payment UX: Why It's the Gold Standard`、`benchmark for the industry`——Stripe 的 checkout 是**业界公认的金标准**，没有第二

### 为什么有效（**ParallelMe 摘要卡 / 清明落定 / 议题完成态的最强参考**）

- **4 篇设计指南公开 = 设计方法论可学习**：Stripe 把"什么要、什么不要、为什么" 完整文档化——这是 ParallelMe 设计议题卡 / 摘要卡时**唯一可对照的开源方法论**。其他产品（Linear / Notion / Granola）只能逆向猜方法论，Stripe 直接给答案
- **Payment successful page 5 段结构 = 议题完成态的标准模板**：把"动作完成" 拆成 5 段而非 1 段——对应 ParallelMe **清明落定阶段**（议题归档 / 圆桌结束 / 主线决定时刻），可借鉴 5 段拆解：
  1. **Settlement confirmation**（这次圆桌的核心定性，1 句话）
  2. **Round summary**（关键 turn 的层次化摘要）
  3. **Voice information**（每个 voice 在本场的轨迹）
  4. **Next steps**（用户接下来可做的——继续展开 / 归档 / 重新开 / 分享给自己未来）
  5. **Reach out**（如果想再听某个声音说话的入口，对应 ParallelMe 的"按需召唤" 能力）
- **`What to skip` 二分方法论 = 议题卡设计的减法清单**：议题卡每加一个字段 / 一个属性 / 一个 badge 都要问"这个真的非加不可吗？"——Stripe 把"加什么" 和"跳过什么" 当成同等重要的决策。**对应 [DC-05 议题卡设计语言](../design-concepts/DC-05-brief-card-design.md)** 应明确写入"议题卡禁止包含" 的清单（如"禁止 status badge / 禁止 priority numeric label / 禁止 estimated time"）
- **trust signals 极简 = 反 Replika sycophancy 在 UI 层的对应**：Stripe 不堆 badge 吓唬用户，对应 ParallelMe 不应在议题卡 / 摘要卡上堆"AI 已分析 / Privacy Safe / End-to-end encrypted" 等信任 badge——**信任靠产品本身建立，不靠 UI 元素喊口号**（呼应 [DR-04 Replika 反面](DR-04-confrontation-references.md)）
- **modular UI building blocks = 议题卡的组件拆分方法**：每个 element 单独完美 + 组合统一——对应 ParallelMe，议题卡的 (whoElement / whatElement / whyElement / moodElement / urgencyElement) 应**可独立测试、可独立复用**，而不是单一 monolithic 议题卡组件。这与 [components/ 目录](../design-concepts/DC-05-brief-card-design.md) 的组件化策略同方法论
- **Appearance API = 视觉风格可定制 + 核心交互不可破坏的范本**：核心是 `customize look and feel without breaking [secure flow]`——对应 ParallelMe，议题卡的视觉（色阶 / 字体 / 圆角）可调，但**议题的核心 schema（who/what/when/why/mood）不可被定制破坏**。这是产品防御性设计的关键
- **金标准 = 借鉴成本最低**：Stripe 是业界公认 gold standard——借鉴 Stripe 的设计模式不会被认为"过度借鉴"，反而是对行业最佳实践的尊重

### 对应 DC-05 哪条原则

| Stripe 机制 | DC-05 对应 / 启发 |
| --- | --- |
| 4 篇设计指南公开化 | **方法论校准**：[DC-05](../design-concepts/DC-05-brief-card-design.md) 应公开"什么该有 / 什么该跳过" 的设计哲学 |
| Payment successful 5 段结构 | **强升级建议**：清明落定阶段可借鉴 5 段（confirmation / summary / voice info / next steps / reach out） |
| `What to skip` 二分方法 | **强升级建议**：DC-05 增加"议题卡禁止包含" 清单 |
| trust signals 极简 | **强校准**：禁止在议题卡 / 摘要卡堆信任 badge |
| Stripe Elements modular | **强校准**：议题卡组件拆分（who/what/why/mood/urgency 各自独立组件） |
| Appearance API 风格可调 + 核心不可破坏 | **强升级建议**：议题卡视觉可定制，schema 不可破坏 |
| 业界公认 gold standard | **背书**：借鉴 Stripe 模式是对行业最佳实践的尊重 |

### 不该照抄的部分

- ❌ **Stripe 是支付场景，目标是"完成交易"**——ParallelMe 是情绪场景，目标是"看见自己"。**不应学到任何"成功 / 失败 / 转化率" 的目标导向语言**
- ❌ **Payment successful page 的"庆祝感"**（大对勾 + 绿色 + 「Thank you for your purchase!」）——ParallelMe 的清明落定阶段**禁止庆祝感**，应是"沉淀感"（呼应 [DR-01 公理 6 状态文案克制](DR-01-streaming-ui-references.md) + [DR-02 公理 4 反营销腔](DR-02-narration-tone-references.md)）
- ❌ **Stripe 的"Next steps" 是行动号召**（CTA button）——ParallelMe 的 next steps 应是**温柔的可能性提示**（"如果你想再听一次… / 如果想保留这次思考…"）而非按钮式 CTA
- ❌ **Order summary 的金额计算式呈现**（小计 + 税 + 折扣 + 总计）——ParallelMe 的 round summary**禁止任何"得分 / 总分 / 评估" 数字**，圆桌不是计算结果
- ❌ **Stripe Elements 是开发者 SDK**——可以借鉴模块化思想，但**不应学到 SDK 化的产品策略**（ParallelMe 不是给开发者集成的中间件，是终端用户产品）
- ❌ **Customer support 入口的"客服感"**——ParallelMe 不应有"客服 / FAQ / 帮助中心" 的工具感入口，应是更柔的"回到主页 / 重新开始 / 这次先到这里" 的人话表达
- ❌ **Stripe 的 trust 来自"我们处理了 N 万亿美元交易"**——ParallelMe 不应用类似的"我们已陪伴 X 用户" 量化背书建立信任，应靠产品体验本身建立

---

## 5 · Apple Notes（iOS 18 / macOS Sequoia） · 极致克制的元数据 + Apple Intelligence 集成（**消费级笔记卡的金标准**）

### 产品 / 版本 / 截图位置

- 产品：Apple Notes · iOS 18 + iPadOS 18 + macOS Sequoia 15（2024 秋季 + 2025 持续迭代）+ Apple Intelligence 集成
- 截图位置：(a) iOS 18 Notes app 任意一条 note 的卡片视图——标题加粗 + 第一行预览灰字 + 时间戳元数据极小；(b) iPadOS 18 折叠 sections（heading 旁边的 ▼/▶ 切换器）；(c) macOS Sequoia Quick Note 浮窗（任意 app 上呼出，写完自动归档到 Notes）；(d) iOS 18 的 Math Notes（手写公式后自动求解，**结果用灰字呈现**）；(e) Apple Intelligence summary（录音后一键生成转录摘要，**摘要不替代原音**）
- 关键 UI 区域：(1) **note 卡（list 视图）**：标题加粗 + 第一行预览灰字 + 时间戳极小；(2) **collapsible sections**：heading 可折叠，正文按 heading 分组；(3) **highlight 5 色高亮**（iOS 18 新增）；(4) **Quick Note 浮窗**：跨 app 的快速记录入口，无标题压力；(5) **Apple Intelligence summary**：转录摘要 + 行动项，但**不替代原录音**

### 可观测细节

- **note 卡（list 视图）3 元素结构**：标题（粗体）+ 第一行预览（灰字截断）+ 时间戳（极小灰字）—— **没有 status badge / no priority / no tags 显示在卡上**，元数据极致克制
- **iOS 18 大更新：collapsible sections**（`MacRumors` / `Cult of Mac` 多家科技媒体头条）：长 note 可按 heading 折叠展开，**长文档视为可导航结构而非纯流**——`Collapsible sections allow for better organization of lengthy notes around titles and headers, making it easier to navigate complex documents`
- **iOS 18 highlight 5 色**：用户可以为正文文字加 5 种颜色的 highlight（黄/绿/蓝/粉/紫）——**视觉强调用色不用 weight 变化**（不加粗、不下划线、不斜体）
- **Quick Note 浮窗（macOS Sequoia）**：在任意 app 中按快捷键浮出一个临时笔记窗口，写完后自动归档到 Notes——**降低"我得专门打开 Notes" 的心理门槛**，对应 [DR-02 公理 5 动词选择](DR-02-narration-tone-references.md) 的"轻量动词" 哲学
- **Math Notes（iOS 18 / iPadOS 18）**：手写公式后自动求解，**结果用灰字呈现在等号后**——AI 计算结果与用户原笔记**色阶区分**（与 Granola 黑字/灰字范式异曲同工）
- **Apple Intelligence summary 不替代原音**：用户录一段会议音频，AI 生成转录 + 摘要，但**原音频依然可播放、转录依然可阅读**——**AI 加层而非取代** —— `generate a summary of a transcript when you record audio`
- **没有 cloud sync 状态条 / 没有 saving... toast / 没有 success badge**：Notes 始终保持纯净的笔记空间，**所有系统状态被隐藏**——这与 [DR-01 公理 6 状态文案克制](DR-01-streaming-ui-references.md) 完全同向
- **Apple Design Resources 公开化**：Apple 官方 `developer.apple.com/design/resources/` 提供完整设计模板、icon 模板、color guide——**与 Stripe 同样开源设计哲学**，但更克制

### 为什么有效（**消费级议题卡 / 笔记卡的克制范式金标准**）

- **3 元素 list 视图 = 消费级笔记卡的极简范本**：Apple Notes 用"标题 + 预览 + 时间戳" 3 元素覆盖了 99% 的用户场景——**没有 status / priority / tags 等工具感字段**。对应 ParallelMe，议题卡 list 视图（如 archive 页面、setup 页面的"过往议题"）应学习这种 3 元素极简，避免 Linear 式的 6 元素工程感
- **collapsible sections = 长议题 / 长摘要的可导航结构**：当议题 / round summary 内容变长，应有 heading + 折叠机制让用户**按需展开**而非滚动疲劳。对应 [DC-01 原则 4 细节按需展开](../design-concepts/DC-01-scribe-activity.md) 的视觉范本
- **highlight 5 色 = 视觉强调用色不用 weight**：避免在正文中混用粗体 / 斜体 / 下划线（视觉噪声），用低饱和度 highlight 表达强调——对应 ParallelMe 的"温度系基调"，议题卡 / 摘要卡的强调应用低饱和度色块（呼应 [Kialo 不该照抄部分 · 应降级为低饱和度色调差异](DR-04-confrontation-references.md)）
- **Quick Note 浮窗 = 议题入口的轻量化思路**：用户不需要"专门进入 ParallelMe 才能开议题"——可考虑提供轻量入口（如菜单栏 quick capture / 浏览器扩展），让用户在任何时刻**用 1 句话先把议题框住**，回头再进入完整圆桌
- **Math Notes 灰字结果 = AI 加层而非取代的视觉范本**：与 Granola 黑字 / 灰字完全同源——验证"用户原内容黑字、AI 补全灰字" 是消费级 AI 产品的视觉公理
- **Apple Intelligence summary 不替代原音 = 议题归档的关键约束**：摘要不应替代原 turn——对应 ParallelMe，清明落定 / archive 阶段的"圆桌摘要" **必须保留原 turn 全文可访问**，摘要只是入口而非替代
- **系统状态全隐藏 = 笔记空间的纯净感**：no cloud sync indicator / no saving toast / no badge——对应 ParallelMe，议题卡 / 圆桌主流应**严禁出现工程感的系统状态**（保存中... / 已同步 / Connection lost 等）
- **Apple Design Resources 公开化 = 与 Stripe 形成"设计开源" 的双范本**：消费级（Apple）+ B 端（Stripe）双重背书—— ParallelMe 借鉴这两者的设计哲学是**对行业最高标准的尊重**

### 对应 DC-05 哪条原则

| Apple Notes 机制 | DC-05 对应 / 启发 |
| --- | --- |
| 3 元素 list 视图（标题 + 预览 + 时间戳） | **强升级建议**：[DC-05](../design-concepts/DC-05-brief-card-design.md) 的议题卡 list 视图应锁定 3 元素，禁止堆叠属性 |
| collapsible sections | **强升级建议**：长议题 / 长摘要应有 heading + 折叠机制 |
| highlight 5 色（视觉强调用色） | **强升级建议**：议题卡禁止粗体/斜体/下划线混用，用低饱和度 highlight 表达强调 |
| Quick Note 浮窗 | **新方向**：可考虑议题轻量入口（菜单栏 / 扩展） |
| Math Notes 灰字结果 | **强校准**：AI 加层不取代的视觉公理（与 Granola 同源） |
| Apple Intelligence summary 不替代原音 | **强校准**：圆桌摘要必须保留原 turn 全文可访问 |
| 系统状态全隐藏 | **强校准**：议题卡 / 圆桌严禁工程感系统状态 |
| Apple Design Resources 公开化 | **背书**：Apple + Stripe 双重设计开源标准 |

### 不该照抄的部分

- ❌ **Apple Notes 是通用笔记 app，无领域特化**——ParallelMe 是情绪 / 决策场景特化产品，议题卡的 schema（who/what/when/why/mood/urgency）必须显式存在，**不能学到 Apple Notes 的"什么都能记" 的无 schema 自由度**
- ❌ **Apple Notes 的纸感视觉**（白底 + 黑字 + 圆角小）——ParallelMe 应保持"克什米尔木色 + 暖米白" 基调，不应学到 Apple 的偏冷白
- ❌ **5 色 highlight 数量太多**——ParallelMe 应限定**最多 2-3 色**（如低饱和度米黄 + 低饱和度橙），多了反而打破温度系基调
- ❌ **Apple Notes 的 sharing 能力**（多人协作 / 链接分享）——ParallelMe 是单用户私人场景，**严禁任何"分享议题给他人" 的入口**
- ❌ **Apple Notes 的 folder 层级组织**——ParallelMe 议题不应被强制归类到 folder，应是**时间流 + 标签** 的扁平结构（Apple 的层级对工具合理，对情绪场景过度组织化）
- ❌ **Apple Intelligence 在 Notes 中是"被动等召唤"**（用户主动选 "Summarize"）——ParallelMe 的书记员是**主动在场**的人格，不应学到这种工具按钮式 AI
- ❌ **Apple Notes 的 timestamp 是工程感时间**（"Yesterday at 3:42 PM"）——ParallelMe 时间戳应更人话（"昨天傍晚" / "三天前的那个下午"），呼应 [DR-02 公理 1 文案是产品的人格容器](DR-02-narration-tone-references.md)

---

## 跨产品共性提炼

5 个产品（Linear / Notion / Granola / Stripe / Apple Notes）覆盖了**议题卡 / 摘要卡 / brief card** 的全部象限——从 SaaS 工具到知识管理、从 AI 笔记到支付摘要、再到消费级笔记。2024-2026 年集体收敛出 **七条议题卡设计的公理级实践**：

### 公理 1 · 极简属性 + 高密度信息是议题卡的最优解

Linear 把 6 个属性塞进 ≤60px 行 + Apple Notes 用 3 元素覆盖 99% 场景 + Notion 的 property visibility 按视图定制——**议题卡的设计黄金律是"信息密度高 + 视觉权重低"**，靠图形 / 颜色 / 空间布局而非文字标签实现。

### 公理 2 · 同一议题数据 N 个视图是必须，不是可选

Notion `same data, different views` + Linear 的 list / board / cycle 多视图 + Stripe Elements 的模块化组合——**议题卡数据应单一源头，UI 是这份数据按场景的不同视图渲染**。ParallelMe 的议题在 taskFrame / roundtable / settlement / archive 各有不同呈现，必须遵循此原则。

### 公理 3 · 黑字 / 灰字二分是 AI 时代议题卡的视觉公理

Granola 黑字（用户）+ 灰字（AI 补全）+ Apple Math Notes 灰字结果——**用色阶（不是 badge / icon / 边框）区分人 vs AI 来源** 是 2024-2026 年 AI 产品的事实标准。视觉权重 = 信任权重，黑字权威、灰字辅助。

### 公理 4 · `What to skip` 与 `What to include` 同等重要

Stripe 4 篇官方设计指南都明确写"该跳过什么" + Apple Notes 主动隐藏系统状态 + Linear 的 issue details bar 简化——**减法是产品决策**。议题卡的设计应有显式的"禁止包含" 清单（status badge / priority numeric / cloud sync indicator / saving toast 等）。

### 公理 5 · AI 是辅助、不是主体，必须可溯源

Granola "AI notepad, not note taker" + Granola AI bullet hyperlink 跳转 + Apple Intelligence summary 不替代原音 + Stripe Appearance API 风格可调但核心不可破坏——**AI 在议题卡中的所有补全 / 摘要 / 推断都必须 (a) 视觉上可识别为 AI 来源、(b) 可溯源到原数据、(c) 不替代原内容**。

### 公理 6 · 议题完成态严禁庆祝感，应是沉淀感

Apple Notes 无 "saved!" toast + Granola 不弹 enhance 完成弹窗 + Stripe 唯一例外（金融场景需要确认）——**议题卡 / 圆桌完成时禁止庆祝弹窗 / 成功 badge / 大对勾绿色**。情绪 / 决策场景的"完成" 应是沉淀感而非成就感。

### 公理 7 · 设计开源化是顶级产品的共同特征

Stripe 4 篇官方设计指南 + Apple Design Resources + Linear changelog + Notion Help Center——**所有顶级产品都把设计哲学完整文档化对外开放**。ParallelMe 的 [docs/notes/](../README.md) 体系是同方向，强校准信号。

---

## ParallelMe 直接行动建议（基于 5 产品调研）

> 不是建议未来做，是**已经验证可行、可立即写进 backlog** 的具体动作。本 DR 不替用户拍板，按工作流"先沉淀，再讨论"原则提供事实证据。

| 建议 | 来源 | 影响 DC | 建议进度 |
| --- | --- | --- | --- |
| **DC-05 议题卡数据 / 视图分离架构**（议题数据单一源 + propertyVisibility[stage] 按 stage 定制视图） | Notion + Linear | DC-05 + lib/v7.ts | DC 升级动作（重大） |
| **DC-05 议题卡 list 视图锁定 3 元素**（标题 + 第一行预览 + 时间戳，禁止堆叠属性） | Apple Notes | DC-05 | DC 升级动作 |
| **DC-05 增加「黑字 / 灰字二分」视觉规范**（用户字段黑字、AI 补全字段灰字 + AI 字段可溯源） | Granola + Apple Math Notes | DC-05 + DC-02 | DC 升级动作（重大） |
| **DC-05 增加「议题卡禁止包含」清单**（status badge / priority numeric / cloud sync indicator / saving toast / success badge / 完成庆祝） | Stripe + Apple Notes | DC-05 | DC 升级动作（强约束） |
| **清明落定阶段借鉴 Stripe 5 段结构**（settlement confirmation / round summary / voice information / next steps / reach out） | Stripe payment success | DC-03 + DC-05 | R 系列新增候选 |
| **DC-05 议题卡 placeholder 改轻量动词**（"说说看…" 替代"请详细描述你的议题…"） | Granola + DR-02 公理 5 | DC-05 + DC-02 | R 系列新增候选 |
| **议题骨架 template 3-5 种**（决策类 / 情绪类 / 关系类 / 反思类 / 计划类） | Granola 29 templates 降配 | DC-05 | R 系列新增候选 |
| **议题卡组件模块化拆分**（whoElement / whatElement / whyElement / moodElement / urgencyElement 各自独立） | Stripe Elements | DC-05 + components/ | R 系列新增候选（工程改造） |
| **长议题 / 长摘要支持 collapsible sections** | Apple Notes iOS 18 | DC-05 + DC-01 | R 系列新增候选 |
| **议题卡正文强调用低饱和度 highlight，禁止粗/斜/下划线混用** | Apple Notes 5 色 highlight + Kialo 反例 | DC-05 全局视觉 | DC 升级动作 |
| **议题卡 / 圆桌主流严禁工程感系统状态**（saving / synced / Connection lost 等） | Apple Notes + DR-01 公理 6 | DC-05 + DC-03 全局视觉 | 全局视觉约束 |
| **AI 推断字段必须有显式溯源能力**（hover 显示推断依据 / 跳转到原 turn） | Granola hyperlink + Anthropic epistemic honesty | DC-05 + DC-02 | DC 升级动作（重大） |
| **议题轻量入口探索**（菜单栏 quick capture / 浏览器扩展，让用户随时 1 句话先框议题） | Apple Quick Note | 产品扩展 | R 系列新增候选 |
| **AI 加层不取代原内容**（议题摘要 / 圆桌摘要 / 转录都必须保留原数据可访问） | Apple Intelligence + Granola | DC-03 + DC-05 | 全局产品约束 |
| **roundtable 阶段允许用户用自然语言追加 / 修改议题** | Granola "Edit by asking" | DC-03 + DC-05 | R 系列新增候选 |
| **time stamp 改人话表达**（"昨天傍晚" / "三天前的那个下午"，禁止"Yesterday at 3:42 PM"） | Apple Notes 反面 + DR-02 公理 1 | DC-05 全局文案 | R 系列新增候选 |
