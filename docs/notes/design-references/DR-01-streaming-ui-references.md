# DR-01 · 流式 UI 与 AI 工作台 · 业界参考

- 性质：[DC-01 书记员工作台四层结构](../design-concepts/DC-01-scribe-activity.md) 的业界证据库
- 调研窗口：2024-2026 年最新版本
- 关联：[DR README · 调研规范六项](README.md)

---

## 一句话立场

> 2024-2026 这两年，硅谷顶级产品**集体回答了一个问题**：用户愿意等 AI 多久？答案是——只要"它在做什么"看得见，等待就不再是等待。本 DR 提取的不是 UI 装饰，是**让等待变成观察**的具体机制。

---

## 1 · ChatGPT · GPT-5.4 Thinking · 推理过程显式化

### 产品 / 版本 / 截图位置

- 产品：ChatGPT Web / Desktop · 模型 GPT-5.4 Thinking（2025）、前身 o1 / o1-pro
- 截图位置：`chatgpt.com` 任意会话，选择带 "Thinking" 后缀的模型，发送一条复杂问题
- 关键 UI 区域：模型回复气泡上方出现的**「Thinking…」可折叠面板**

### 可观测细节

- **状态条形态**：回复气泡之前，先出现一个**单独的 "Thinking…" 块**，左侧带浅灰色竖条，右侧带 `▾` 折叠图标，文字采用比正文小一档的灰色字（约 `text-sm text-neutral-500`）
- **过程文案**：实时滚动展示模型的**自然语言推理摘要**（不是原始 chain-of-thought，是改写后的人话），每隔 1-3 秒切换一段：「Considering the user's intent…」→「Looking up relevant context…」→「Drafting a response…」
- **完成态**：推理结束后，"Thinking…" 折叠为单行 `Thought for 12 seconds ›`，可点击展开看完整推理摘要
- **位置守恒**：折叠/展开**不引起回复气泡的位置跳动**——折叠面板用 `max-height` 过渡，正文不挪位

### 为什么有效

- **消灭沉默感**：o1 之前用户面对 30+ 秒等待是"白屏"，o1 引入 Thinking 面板后用户主观等待时长**显著下降**（社区反馈一致）——证明 [DC-01 原则 2 过程叙事化](../design-concepts/DC-01-scribe-activity.md) 是产品级真理
- **改写而非裸露**：OpenAI 出于安全和商业考虑**不暴露原始 chain-of-thought**，而是用模型生成"对外摘要"——这个改写动作本身就在做"schema → 人话"的翻译，正是 [DC-01 Layer 1 vs Layer 2](../design-concepts/DC-01-scribe-activity.md) 的分层范本
- **回收态做留痕**：`Thought for 12 seconds ›` 这个完成态摘要既是"事情做完了"的回收，又给好奇用户留了"想看深一层"的入口——对应 [DC-01 Layer 4 完成回收](../design-concepts/DC-01-scribe-activity.md)

### 对应 DC-01 哪条原则

| ChatGPT 机制 | DC-01 对应 |
| --- | --- |
| Thinking 面板的实时滚动文案 | Layer 1 状态条 + DC-02 微叙事 |
| 折叠后的 `Thought for X seconds ›` 入口 | Layer 2 Trace 面板入口 |
| 推理摘要的人话改写 | 原则 1 永远说人话 |
| 折叠/展开位置守恒 | DC-01 Tailwind Token 规范「禁用位移动画」 |

### 不该照抄的部分

- ❌ **"Thought for X seconds" 在 ParallelMe 不适用**——ParallelMe 的等待主体是"书记员"而非"模型"，应改为"书记员花了 X 秒整理"或更柔的"已经听完"
- ❌ **ChatGPT 的 Thinking 文案偏开发者腔**（"Considering tool use" 之类）——ParallelMe 必须坚持 [DC-02 主语永远是书记员](../design-concepts/DC-02-scribe-narration-library.md)
- ❌ **ChatGPT 把 Thinking 摘要做成"可有可无的好奇心入口"**——ParallelMe 的 Layer 4 归档是**长期透明度资产**，不能默认折叠就丢失

---

## 2 · Claude Sonnet 4.5 · Extended Thinking + Interleaved Thinking + Artifacts

### 产品 / 版本 / 截图位置

- 产品：Claude.ai Web · 模型 Sonnet 4.5（2025-09-29 发布）/ Opus 4.5
- 截图位置：`claude.ai` 任意会话开启 Extended Thinking，发送复杂问题；或让 Claude 生成代码触发 Artifacts 侧栏
- 关键 UI 区域：(a) **Thinking 块**（回复气泡上方折叠面板）；(b) **Artifacts 侧栏**（屏幕右半部分独立可滚动区）；(c) **Interleaved Thinking**（工具调用与思考交替）

### 可观测细节

- **Thinking 块**：与 ChatGPT 同源但更克制——Claude 用纯文字 `Thinking…` + 进度脉冲（很轻的呼吸光），**不带任何 emoji 或图标**，体现 Anthropic 一贯的"克制即克制"美学
- **Interleaved Thinking**（`interleaved-thinking-2025-05-14` beta header）：当 Claude 用工具时，**思考 → 调工具 → 看到工具输出 → 再思考 → 再调** 这个序列以**交错卡片**形式展示，每个 step 是一个独立卡片：
  ```
  💭 Thinking · 我需要先查一下用户提到的文件
  🔧 Tool · read_file("src/utils.ts")  → 输出 124 行
  💭 Thinking · 看到了，这个函数依赖 lodash，我需要确认版本
  🔧 Tool · grep("lodash", package.json) → 输出 1 行
  💭 Thinking · 版本是 4.17.21，可以使用 _.debounce
  ```
- **Artifacts 侧栏**：当 Claude 生成代码/HTML/SVG 时，**主对话区不渲染代码**，而是右侧弹出独立侧栏（约 50% 屏宽），左侧继续对话，右侧实时流式渲染产物。用户可以在侧栏顶部切换 `Code | Preview` 双视图（HTML/React 直接渲染，可点可玩）
- **流式光标**：所有流式输出（无论主对话/Artifacts）末尾带一个**闪烁的细方块光标**（不是斜杠也不是圆点），表示"还在写"——光标消失即流结束

### 为什么有效

- **Interleaved Thinking 是流式 UI 的范式跃升**：从"先想完再做"变成"边想边做"，每一步都暴露给用户。这是**多 Agent 时代的 Trace Panel 标杆**——单 Agent 时 Trace 只是好奇心入口，多 Agent 工具调用时 Trace 是**必需品**（否则用户根本不知道 AI 在跟谁交互）
- **Artifacts 双区分屏**：把"生成中的产物"和"对话过程"**物理隔离**——对话区永远保持纯净的"对谈感"，产物区允许实时翻滚而不污染对话节奏。这是**信息架构的物理分层**，比 ChatGPT 把代码块直接塞进对话气泡的方案更克制
- **细方块光标 vs spinner**：spinner 暗示"系统在转圈"（机器感），细光标暗示"有人在打字"（人感）——选什么决定了你的 AI 是工具还是同事

### 对应 DC-01 哪条原则

| Claude 机制 | DC-01 对应 |
| --- | --- |
| Interleaved Thinking 交错卡片 | Layer 2 Trace Panel（多 Agent 必需形态） |
| Artifacts 侧栏分屏 | Layer 4 完成回收 + 信息架构物理分层 |
| 闪烁细方块光标 | DC-01 Tailwind Token 规范「禁用 spinner」的正面替代 |
| 流式过程不带 emoji 的克制 | DC-02 原则 4「emoji 备份方案」 |

### 不该照抄的部分

- ❌ **Artifacts 的"双区分屏"在 ParallelMe 不直接适用**——ParallelMe 没有"生成的代码/HTML 产物"，但**圆桌的 voice 发言流 + 书记员的结构化镜面**可以借用相同思路（左侧 voice 对话流，右侧书记员观察面板），是 [DC-04 M4 mirror_structure](../design-concepts/DC-04-confrontational-voice-design.md) 一个值得探索的演进方向
- ❌ **Interleaved Thinking 的"卡片粒度"过细**——ParallelMe 的书记员推理子步骤如果都按 Claude 这种粒度暴露，会让 Layer 2 Trace 过载。需要做**聚合**：把"读取 → 抽张力 → 起草卡片 1 → 起草卡片 2"聚合成一个 `task-frame` 阶段卡，而不是 4 张
- ❌ **Claude 的 Thinking 文案是英文 + 偏技术（"Considering tool use"）**——ParallelMe 必须坚持中文 + 书记员人称（参见 [DR-02](DR-02-narration-tone-references.md) Apple HIG voice 条款）

---

## 3 · Cursor 2.0 · Multi-Agent 并行视图 + Composer 状态条（**与 ParallelMe 同构最强的参考**）

### 产品 / 版本 / 截图位置

- 产品：Cursor IDE · 版本 2.0（2025-10-29 发布）· Composer 模型 + Agent 模式
- 截图位置：Cursor 2.0 主界面右侧 Agent 面板，发起 `/best-of-n` 命令；或在 Plan 模式下展开多 Agent tab
- 关键 UI 区域：(a) **Agent-centric 主界面**（不再以文件为中心）；(b) **多 Agent 并行 tab**（最多 8 个 worktree 并列）；(c) **每 Agent 独立状态条**（每个 tab 头部显示该 agent 的实时状态）

### 可观测细节

- **范式转变**：Cursor 2.0 的 UI **不再以文件为中心**，而是以 Agent 为中心——主区域可同时挂 8 个独立 Agent，每个 Agent 在自己的 git worktree 上工作，互不干扰。这是 IDE 历史上罕见的范式重构
- **多 Agent tab 头部**：每个 agent 的 tab 头部带：(1) 模型图标（Claude/GPT/Composer）；(2) 当前状态文案（`Thinking…` / `Editing src/foo.ts` / `Running tests`）；(3) 进度小圆点（绿色=完成、黄色=进行中、灰色=排队）
- **`/best-of-n` 模式**：用户输入一个 prompt，Cursor 自动在 N 个 agent 上**并行运行同一任务**（用不同模型或不同 prompt 变体），运行完成后并排展示**结果对比 diff**，让用户选优（pick winner）
- **状态条粒度**：每个 agent 的状态文案以**当前正在动的文件名**为主体（`Editing src/utils.ts · line 42`），而非泛泛的"工作中"——把"我在动哪里"暴露给用户
- **完成态标识**：agent 完成后 tab 头部出现 `✓ 23 files changed · 2m 14s`，可点击进入 diff review

### 为什么有效（**这是本 DR 中与 ParallelMe 同构性最强的参考**）

- **多 Agent 并行的 UI 范式**：Cursor 2.0 是**第一个把"多 Agent 并行"做成主流产品形态**的工具——它解决的核心问题与 ParallelMe 五声圆桌**完全同构**：N 个独立人格/Agent 在同一 prompt 下并行工作，最后需要"对比 + 选优"。Cursor 给出的答案是 **tab 化并列 + 每 tab 独立状态条 + 最终 diff 比较**
- **Agent-centric 而非内容-centric**：Cursor 抛弃了"文件 tab"换成"agent tab"，对应到 ParallelMe 应是——**圆桌不应该以"对话流"为中心，而应该以"五声状态板"为中心**：屏幕主区域是五个 voice 的状态卡，对话流是次要的时间线
- **"我在动哪里"vs"我在工作"**：状态文案带上**当前操作的具体对象**（文件名/行号），让"工作中"从抽象变具体——这是对 [DC-02 文案库](../design-concepts/DC-02-scribe-narration-library.md) 的强升级建议（目前 ParallelMe 文案是「正在起草第 1 张选择卡」，可升级为「正在起草『要不要离职』的第 1 张选择卡」）
- **best-of-n 的"对比+选优"**：这是 ParallelMe 圆桌**结尾阶段**可以借鉴的——让用户对五声的不同立场做最终的选择反馈，而非纯被动接收

### 对应 DC-01 哪条原则

| Cursor 2.0 机制 | DC-01 对应 / 启发 |
| --- | --- |
| Agent-centric 主界面 | **强升级建议**：[DC-03 圆桌信息架构](../design-concepts/DC-03-roundtable-information-architecture.md) 应考虑"voice 状态板"与"对话流"的物理分屏 |
| 每个 agent 独立状态条 | **强升级建议**：[DC-01 Layer 1](../design-concepts/DC-01-scribe-activity.md) 应支持"多 Agent 时每个 agent 一条状态"，不是只有书记员一条 |
| 状态文案带操作对象（文件名） | DC-02 文案 token 应增加 `topic` / `target` 上下文变量 |
| best-of-n 比较 + 选优 | **新方向**：ParallelMe 的"清明落定"阶段可考虑引入"对五声立场的回选"机制 |

### 不该照抄的部分

- ❌ **8 个并行的"密集状态板"在 ParallelMe 不适用**——Cursor 是开发者工具（用户能并行处理 8 个上下文），ParallelMe 是情绪场景（5 个就已经是极限），不能学其密度
- ❌ **`/best-of-n` 的 diff 比较是技术语言**——ParallelMe 不能搞"五声立场 diff"，应转译为 [DC-04 mirror_structure](../design-concepts/DC-04-confrontational-voice-design.md) 的"书记员观察"形态
- ❌ **Cursor 2.0 的 voice mode 引入了语音输入**——ParallelMe 第一阶段不引入语音（语音会破坏"克什米尔木色调"的克制场域感）
- ❌ **进度色点（绿/黄/灰）的工程感**——ParallelMe 应改用更柔的"已经入席 / 正在开口 / 还在听"等人化态指示器

---

## 4 · Linear AI · Inline Agent Sessions（**"AI 融入现有界面"而非"新建独立面板"的标杆**）

### 产品 / 版本 / 截图位置

- 产品：Linear · Inline Agent Sessions（2025 年下半年发布）+ Notion Custom Agents 集成
- 截图位置：Linear app 任意 issue 页面，右侧 sidebar 唤起 agent；或在 issue 详情顶部的 "Ask AI" 按钮
- 关键 UI 区域：(a) **issue 详情右侧 sidebar 的 agent session 卡**；(b) **inline agent 操作的 "正在做什么" 微提示**；(c) **agent 完成后自动生成的 issue / sub-task 视觉**

### 可观测细节

- **Inline 而非弹窗**：Linear 的 agent **不开新页面、不弹模态框**，而是在 issue 详情页右侧（与现有 activity feed 同区域）直接生成一个 agent session 卡片——agent 工作过程完全嵌入现有 issue 上下文中
- **Agent session 卡片结构**：(1) 顶部头像 + agent 名（来自配置的 sub-agent，比如 "Bug Triager"）；(2) 中部对话流，与 Linear 既有 comment thread 视觉一致（同字号、同间距）；(3) 底部 `Suggest action` chip（让 agent 主动给出可执行建议，如"创建子 issue""指派给 X"）
- **"创建 issue from video"**：Linear changelog 明确：用户可以**上传视频** → agent 看完后**直接在当前项目下创建 issue**，并把视频时间戳作为 issue body 的引用——这是**agent 输出物直接成为产品资产**的范例
- **Streaming 时的 UX 修复**：Linear changelog 有一条 `Fixed slow UI responses when agent chat is streaming`——说明他们专门优化了 agent 流式输出时主界面的响应速度，证明 **"流式不能阻塞主界面"** 是产品级铁律

### 为什么有效（**"AI 不是新功能，AI 是现有功能的能力扩展"**）

- **Inline 而非独立面板**：Linear 的核心设计哲学是 "AI 应该让现有工作流变快，而不是变成另一个要学的工具"——这与 ParallelMe 的 [DC-01 命名与定位](../design-concepts/DC-01-scribe-activity.md)（"它不是一个具体页面，而是一个贯穿全局的 UI 范式"）**完全同向**。书记员就应该像 Linear 的 inline agent 一样，**融入圆桌而不是另开页面**
- **Agent 输出 = 产品资产**：Linear 让 agent 直接生成 issue/sub-task/comment，这些产物**等同于人创建的产物**（同模型、同权限、同检索）。对应到 ParallelMe——书记员生成的"议题卡 / 圆桌纪要 / 清明落定"应该作为**一等公民**进入 archive，可被检索、被分享、被引用，而不是"AI 副产品"
- **Comment thread 视觉一致**：agent 对话流复用 Linear 既有的 comment 视觉，**没有专门的"AI 紫色渐变"**——这是反"AI 视觉特殊化"的硅谷顶级范例。ParallelMe 应避免"AI 输出用专门的金色 / 渐变 / 闪光"，书记员的话就是会议纪要的话，应与会议正文同视觉
- **Sub-agent 配置化**：Linear 允许用户配置专门用途的 agent（"Bug Triager"、"Sprint Planner"），每个 agent 有自己的人格和指令——这是 ParallelMe **五声 + 书记员 = 六个独立人格 sub-agent** 的产品化范例

### 对应 DC-01 哪条原则

| Linear AI 机制 | DC-01 对应 / 启发 |
| --- | --- |
| Inline 而非独立面板 | **强校准**：[DC-01 命名与定位](../design-concepts/DC-01-scribe-activity.md)「贯穿全局 UI 范式」的产品级证据 |
| Agent 输出物 = 产品资产 | **强升级建议**：[DC-01 Layer 4 完成回收](../design-concepts/DC-01-scribe-activity.md) 应明确"书记员产出物在 archive 中的一等公民地位" |
| Comment thread 视觉一致（反 AI 特殊化） | **强约束**：[DC-01 Tailwind Token](../design-concepts/DC-01-scribe-activity.md) 应明确"禁用 AI 专属渐变 / 闪光" |
| Sub-agent 配置化 | 现有 [lib/selves.ts](../../../lib/selves.ts) 五声 + 书记员的设计方向已对齐，无需调整 |

### 不该照抄的部分

- ❌ **Linear 的 `Suggest action` chip 是任务工具语境**——ParallelMe 不能让书记员主动 chip "建议你做 X"（违背 [DC-04 Observer ≠ Sixth Voice](../design-concepts/DC-04-confrontational-voice-design.md) 原则）。书记员可以"建议下一步交给哪一声接话"，但不能"建议用户做什么"
- ❌ **Linear 的 agent 集成偏向工程效率**（自动建 issue、批量分类）——ParallelMe 是情绪场景，不能借用其"批量化"的工程感
- ❌ **Linear 的视觉极度克制（几乎是黑白灰）**是开发者审美——ParallelMe 应保留"克什米尔木色 + 暖米白" 的情绪温度，不能学到"冷"
- ❌ **Linear 的 sub-agent 强调"专业分工"**（一个修 bug、一个排 sprint）——ParallelMe 的五声是"同一个人的不同部分"（IFS parts），不是"专业分工"，命名上要避免任何"专家 / 顾问"暗示

---

## 5 · Vercel v0 · Composite Model Family · 多步流水线进度暴露

### 产品 / 版本 / 截图位置

- 产品：Vercel v0 · v0-1.0-md（2025-05-22 发布）+ Composite Model Family
- 截图位置：`v0.dev` 任意会话，发起一个生成请求；同时观察主对话区上方的 **多步进度条**
- 关键 UI 区域：(a) **多步流水线进度条**（顶部横向 step indicator）；(b) **每步独立的状态文案**；(c) **AutoFix 自我修复阶段的可见暴露**

### 可观测细节

- **三段流水线显式暴露**：v0 不是黑盒生成，而是把 `RAG（检索相关上下文）→ LLM（生成代码草稿）→ AutoFix（自动修复编译错误）` 三个阶段**做成 UI 可见的横向进度指示**，每个阶段亮起时显示对应文案
- **每步状态文案具体到对象**：与 Cursor 状态条同源——v0 不说"生成中"，而说"正在检索 shadcn/ui 组件"→"正在生成 Card 组件代码"→"检测到 1 个 TypeScript 错误，正在修复"
- **AutoFix 阶段可见**：这是 v0 最反直觉的设计——**主动暴露"我刚才写错了"**。当 LLM 输出的代码有编译错误时，v0 不假装"一次就对"，而是显式进入 AutoFix 阶段，告诉用户"刚才那一版有问题，正在修"
- **getWritable streaming 协议**：v0 工程团队公开承认（`vercel.com/blog`）——他们用 `getWritable` API 把每个子步骤的进度**实时推到前端**，前端订阅渲染，而非等整个 pipeline 跑完
- **生成完成后的 diff 视图**：每次 AutoFix 后，v0 会显示**修改前 vs 修改后的 diff**，让用户看到"它到底改了什么"，建立对自动修复的信任

### 为什么有效（**"暴露失败比假装完美更可信"**）

- **多步流水线显式化是流式 UI 的下一阶段**：从 ChatGPT 的"单 Thinking 块" → Claude 的"Interleaved Thinking 卡片" → v0 的"显式三阶段流水线"——产品演进的方向是**把 AI 内部流程拆成用户可观察的离散 step**。这是对 [DC-01 Layer 1 状态条](../design-concepts/DC-01-scribe-activity.md) 的强升级建议——不只展示"现在在做什么"，更要展示**"现在在哪个阶段"**
- **AutoFix 暴露 = 信任建立**：v0 主动展示"我刚才错了"，反直觉地**提升了用户信任**——因为用户看到了"它会犯错但能自己修"，比"它从不犯错"更可信。对应到 ParallelMe——书记员**不应该假装从不出错**，应有显式的"刚才那段我重写一下"机制（呼应 [DC-02 失败语态](../design-concepts/DC-02-scribe-narration-library.md)）
- **getWritable 是 SSE 的 Vercel 化封装**：技术上证明"流式不是高阶能力，是产品基础设施"——ParallelMe 的后端 14 个 route 改造（[S2](../requirements/backlog.md#s2)）有现成的工程范例可参考
- **diff 视图建立可逆感**：每次 AutoFix 都给 diff，用户知道"哪些改了"。对应到 ParallelMe 议题卡的编辑态——书记员重写议题卡时应该展示 "改之前 vs 改之后"，不能默默覆盖（呼应 [DC-05 编辑态↔查看态过渡](../design-concepts/DC-05-brief-card-design.md)）

### 对应 DC-01 哪条原则

| Vercel v0 机制 | DC-01 对应 / 启发 |
| --- | --- |
| 多步流水线横向进度条 | **强升级建议**：[DC-01 Layer 1 状态条](../design-concepts/DC-01-scribe-activity.md) 应增加"阶段指示器"（taskFrame / opening / roundtable / inquiry / settlement 五段） |
| AutoFix 显式暴露失败 | **强升级建议**：[DC-02 失败语态](../design-concepts/DC-02-scribe-narration-library.md) 应增加"重写态"——书记员主动说"刚才那段不对，我重写一下" |
| 每步文案带具体对象（"shadcn/ui 组件"）| 与 Cursor 同源，强化 [DC-02 文案 token 增加 topic 变量](../design-concepts/DC-02-scribe-narration-library.md) 的建议 |
| getWritable streaming 协议 | [S1 全局事件协议](../requirements/backlog.md#s1) 与 [S2 SSE 改造](../requirements/backlog.md#s2) 的工程范例 |
| diff 视图建立可逆感 | [DC-05 编辑态过渡](../design-concepts/DC-05-brief-card-design.md) 应增加 diff 展示 |

### 不该照抄的部分

- ❌ **v0 的横向 step indicator 是工程感强的进度条**——ParallelMe 的"阶段指示器"应改用更柔的视觉（如顶部的 **细线 + 当前阶段名**，而非数字进度条），不能学到"任务管理工具感"
- ❌ **AutoFix 的"自我修复"措辞偏理性**——ParallelMe 的书记员重写应是更克制的措辞，比如"让我换个说法"而不是"刚才有错"
- ❌ **v0 的 diff 视图借用了代码 diff 范式**（绿/红 +/-）——ParallelMe 议题卡 diff 应改用更柔的视觉（划掉 + 浮现），文字 diff 不应有"代码 review"质感
- ❌ **v0 把 RAG 阶段也暴露给用户**（"正在检索 shadcn/ui 组件"）——ParallelMe 的"读 prompt / 调模型"等技术阶段**绝不暴露**（呼应 [DC-01 原则 1 永远说人话](../design-concepts/DC-01-scribe-activity.md)），书记员的状态条只展示用户感知层的阶段，不展示技术阶段

---

## 跨产品共性提炼

5 个产品（ChatGPT / Claude / Cursor / Linear / v0）虽然形态各异，但 2024-2026 年集体收敛出**七条流式 UI 的公理级实践**：

### 公理 1 · 流式不是性能优化，是产品契约

所有 5 家都把流式做成**默认行为而非可选项**——证明"流式 UI" 已从工程优化升格为**产品级契约**。ParallelMe 的 14 个 route 改造（[S2](../requirements/backlog.md#s2)）不是 nice-to-have，是**生死线**。

### 公理 2 · "在做什么"必须比"做完没"更显眼

ChatGPT/Claude 的 Thinking 块、Cursor 的 tab 状态、v0 的 step indicator——**全部把"过程"放在比"结果"更显眼的位置**。这强力支持 [DC-01 Layer 1 状态条永远在线](../design-concepts/DC-01-scribe-activity.md) 的设计。

### 公理 3 · 状态文案必须带"具体对象"

Cursor "Editing src/utils.ts · line 42"、v0 "正在生成 Card 组件"——**抽象的"工作中"已被淘汰**。ParallelMe 文案应升级为带 `topic` 上下文（"正在起草『要不要离职』的第 1 张选择卡"），见 [DC-02 文案变量命名约定](../design-concepts/DC-02-scribe-narration-library.md) 的 `topic` 变量预留位。

### 公理 4 · 失败必须显式暴露，不能假装完美

v0 的 AutoFix 公开承认错误、Linear 的 streaming 响应优化都印证：**用户能接受 AI 出错，不能接受 AI 假装从不出错**。ParallelMe 的书记员"重写态"是 [DC-02 失败语态](../design-concepts/DC-02-scribe-narration-library.md) 的下一个升级方向。

### 公理 5 · AI 不能有视觉特殊化

Linear 的 agent comment 与人类 comment **同视觉**、Claude 的 Thinking 不带 emoji、v0 的 step 用中性灰——**反 "AI 紫色渐变 / 闪光"** 已是顶级产品共识。ParallelMe 的书记员视觉应保持与 voice 同一视觉体系，[DC-04 mirror_structure 卡片视觉规格](../design-concepts/DC-04-confrontational-voice-design.md) 的"细线 + 浅灰"是正确方向。

### 公理 6 · Inline 优于独立面板

Linear 把 agent 嵌入既有 comment、Claude 把 Artifacts 做成侧栏而非新页——**AI 应融入现有工作流，不应另建新工具**。强力支持 [DC-01 命名与定位](../design-concepts/DC-01-scribe-activity.md)「贯穿全局 UI 范式而非新页面」的设计哲学。

### 公理 7 · 多 Agent 时代需要"agent 状态板"

Cursor 2.0 的范式转变（agent-centric 而非 file-centric）证明：**多 Agent 产品不能套用单 Agent 的 UI**。ParallelMe 的圆桌应考虑"五声状态板 + 对话流"的物理分屏，这是 [DC-03 圆桌信息架构](../design-concepts/DC-03-roundtable-information-architecture.md) 下一阶段的演进方向。

---

## ParallelMe 直接行动建议（基于 5 产品调研）

> 不是建议未来做，是**已经验证可行、可立即写进 backlog** 的具体动作：

| 建议 | 来源 | 影响 DC | 建议进度 |
| --- | --- | --- | --- |
| Layer 1 状态条增加"阶段指示器"（5 段流水线视觉） | Vercel v0 | DC-01 | R 系列新增候选 |
| 文案 token 增加 `topic` / `target` 上下文变量 | Cursor + v0 | DC-02 | 已在 DC-02 命名约定预留 |
| 书记员"重写态"显式暴露（"让我换个说法"）| v0 AutoFix | DC-02 | R 系列新增候选 |
| 书记员视觉禁用 AI 专属渐变（与 voice 同体系） | Linear | DC-04 | 已在 DC-04 视觉规格约束 |
| Layer 4 归档明确"书记员产物 = 一等公民" | Linear | DC-01 | R 系列新增候选 |
| 圆桌"voice 状态板 + 对话流"分屏探索 | Cursor 2.0 | DC-03 | 列入下一阶段架构演进 |

> 这些建议**不立即转化为 R 需求**——按用户工作流"先沉淀调研，再讨论拍板再做需求"。本 DR 的角色是**给后续讨论提供硅谷顶级产品的事实证据**，不是替用户做决定。
