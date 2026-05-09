# DR-02 · AI 叙事文案与语态 · 业界参考

- 性质：[DC-02 书记员叙事文案库](../design-concepts/DC-02-scribe-narration-library.md) 的业界证据库
- 调研窗口：2024-2026 年最新版本
- 关联：[DR README · 调研规范六项](README.md)

---

## 一句话立场

> 文案不是装饰，是产品的人格容器。同一个 AI 能力，文案语态决定它"像同事 / 像工具 / 像菩萨 / 像销售"——而硅谷顶级产品早就把"语态"做成了与代码同等重要的工程资产。本 DR 提取的不是金句，是**怎么把语态写成可维护的系统**。

---

## 1 · Linear changelog · 极致克制的产品语态（**"少即是温度"的范本**）

### 产品 / 版本 / 截图位置

- 产品：Linear · changelog 主页面 (`linear.app/changelog`)
- 截图位置：任意一条 changelog 条目，特别是涉及 AI 功能的条目（如 "Generate release notes with Linear Agent"、"Inline agent session examples"）
- 关键 UI 区域：(a) **changelog 条目正文的写作风格**；(b) **AI 功能命名约定**；(c) **"Fixed slow UI responses when agent chat is streaming" 这类 bug fix 条目的语气**

### 可观测细节

- **句长极短**：典型条目 1-3 句话，每句 8-15 词。**没有任何营销腔**——不说 "We're excited to announce"，直接 "Generate release notes with Linear Agent"
- **动词开头**：90% 的条目以动词原型开头（`Generate` / `Create` / `Fixed` / `Added`），主语是 "你"（隐含），不是 "我们"
- **AI 命名朴素**：内部 AI 叫 "Linear Agent"——**没有起花哨名字**（不是"Lin"、"Liney"、"Spark"），也没有 emoji 前缀。AI 是产品的能力，不是产品的吉祥物
- **bug fix 语气与功能更新一致**：`Fixed slow UI responses when agent chat is streaming` —— 没有"我们改进了体验"的浮词，直接说"修了什么"。AI 功能的 bug 与普通 bug **同语气**，强化"AI 不是新物种"的认知
- **"Inline agent session examples" 这种 UI 截图描述**：用名词短语而非完整句，与设计师/工程师的工作语言完全一致

### 为什么有效

- **克制即温度**：反直觉地——**越克制的语态，用户越觉得"这个产品懂我"**。因为浮词背后是"我要让你买单"的销售心理，克制背后是"我尊重你的时间"的同事心理。Linear 把这条做到极致：连 AI 这种"应该花哨"的功能，都用 bug fix 的语气描述
- **同语态 = 同公民**：当 AI bug fix 与普通 bug fix 语气一致时，用户潜意识里把 AI 当成"产品自然能力"而非"花瓶 demo"。这与 [DR-01 公理 5 · AI 不能有视觉特殊化](DR-01-streaming-ui-references.md) 形成呼应——**视觉不特殊化 + 文案不特殊化 = AI 真正融入产品**
- **动词开头 = 用户视角**：把"用户能做什么"放在每句开头，把"我们做了什么"隐去——这是反传统 release notes 的写法，但符合 Linear "工具应隐去自己" 的产品哲学

### 对应 DC-02 哪条原则

| Linear 机制 | DC-02 对应 |
| --- | --- |
| 句长 8-15 词、1-3 句话 | 原则 3「节奏感优先于精确性」、文案变量约定中"≤36字"约束 |
| 动词开头、隐去主语 | 原则 2「永远主语是书记员，不是系统」的镜像版本——Linear 是"主语是你"，ParallelMe 是"主语是书记员"，但**都拒绝"系统"作为主语** |
| AI 命名朴素 | DC-02 没有专门规约，**应补充**：书记员就叫"书记员"，禁止起花哨外号 |
| bug fix 与功能更新同语气 | 原则 5「失败语态也要写好」的范本——失败和成功都是产品的语态资产 |

### 不该照抄的部分

- ❌ **Linear 的"动词开头、隐去主语"不能直接套用**——ParallelMe 的语境是"书记员在跟你说话"，必须显式主语。Linear 是"工具的更新通知"，主语隐去合理
- ❌ **Linear 的全英文 + 极简语态在中文里需要校准**——中文短句容易显冷，需在 [DC-05 P4 「温的理性」](../design-concepts/DC-05-brief-card-design.md) 的烟火气里找平衡
- ❌ **Linear 的 changelog 是单向广播**（产品 → 用户），ParallelMe 是双向对话（书记员 ↔ 用户）——不能借用其"通告腔"
- ❌ **AI 命名朴素这条要谨慎**——Linear 把 AI 叫 "Linear Agent" 是因为 Linear 本身已经是品牌名；ParallelMe 的"书记员"已经是有人格暗示的命名（不是"AI Helper"），这是对的，但**禁止再起昵称**（如"小书"、"老书"）

---

## 2 · Stripe Docs · 开发者文档的"中性温度"基准

### 产品 / 版本 / 截图位置

- 产品：Stripe Documentation (`docs.stripe.com`) · 持续维护
- 截图位置：任意 API 文档页面（如 `Payment Intents`、`Webhooks`），重点观察"概念解释段落"和"错误信息段落"
- 关键 UI 区域：(a) **概念页的开篇段落**（"什么是 X"）；(b) **错误码描述**；(c) **代码示例上方的注释段**

### 可观测细节

- **100% 中性品牌语态**：业界公认 Stripe 是"开发者文档语态"的金标准——**几乎没有营销词**（"powerful"/"seamless"/"revolutionary" 等词在文档里出现次数接近 0）
- **以"读者需要什么"为主语**：典型句式 "When a customer pays..." / "If you want to..." / "Your application can..."——**主语永远是读者或读者关心的对象**，不是 Stripe 自己
- **错误信息的克制**：错误描述格式固定为 `<错误码>: <一句话陈述事实> · <一句话给出修复方向>`，不带"sorry"、"oops"、"don't worry"等情绪词
- **概念分层清晰**：每个概念页的结构是 `What is X · When to use X · How to use X`，永远先说"是什么"，再说"为什么"，最后说"怎么做"——**信息架构本身就是文案规范**
- **代码注释也写人话**：代码示例里的注释如 `// Create a customer before charging them`，是给"理解代码做了什么"的人写的，不是给"看代码本身"的人写的

### 为什么有效

- **中性 = 信任**：开发者最厌恶被"营销"，Stripe 通过保持 100% 中性，让自己成为"基础设施"而非"产品"——基础设施值得长期信任，产品要不停证明自己。这对应到 ParallelMe——书记员应该像 Stripe Docs 一样"中性可信"，**不是热情洋溢的助手**
- **以读者为主语 = 让信息直接可用**：读者不需要把 "Stripe processes the payment" 翻译成"我要在我的代码里调一个 API 处理支付"——Stripe 直接写 "Your application processes the payment" 把转译省掉了。对应到 ParallelMe——书记员的话应该是 "你刚才说到妈妈的那句..."，不是 "用户在 turn 3 提到了 mother 这个 entity..."
- **错误信息无情绪词 = 用户不需要安慰，需要解决**：当错误发生时，"sorry / oops" 是噪声，"具体错了什么 + 怎么修" 是信号。对应到 ParallelMe 失败语态——书记员应该说 "这一句没听清，让我再试一次" 而不是 "抱歉出错了！请重试"

### 对应 DC-02 哪条原则

| Stripe 机制 | DC-02 对应 |
| --- | --- |
| 100% 中性、无营销词 | **强校准**：DC-02 应明确**禁词列表**（兴奋词/营销词/情绪词），与 voice 的 `taboo_words` 同构 |
| 以读者为主语 | 原则 2「永远主语是书记员」的镜像——主语既不能是"系统"，也不能是"AI"，**应是用户能感知的具象对象**（书记员/voice/你自己） |
| 错误信息无情绪词 + 给修复方向 | 原则 5「失败语态也要写好」+ DC-02 异常态文案应增加"修复指引"维度 |
| 信息架构 = 文案规范 | DC-02 状态机切换规则的对应——文案的顺序就是用户认知的顺序 |

### 不该照抄的部分

- ❌ **Stripe 的中性是开发者语境的中性**——ParallelMe 的语境是情绪场景，需要"中性 + 温度"，不能学到全冷
- ❌ **Stripe 的"以读者为主语"是因为读者是开发者（强动作主体）**——ParallelMe 的读者在情绪低谷时**不一定是强动作主体**，过度强调"你"会显得施压。需在"你"和"书记员/我们"之间做平衡（参考 [DC-05 P4 「温的理性」](../design-concepts/DC-05-brief-card-design.md)）
- ❌ **错误信息直接给修复方向在情绪场景不适用**——ParallelMe 的"网络断了"不应该说"请检查你的网络"（指责感），应说"和外面断了线，正在重新接通"（书记员承担动作）
- ❌ **Stripe 永远不带 emoji**——ParallelMe 可保留极少量 emoji 作为视觉节奏（如 `📖` `🪑`），但需遵守 [DC-02 原则 4 「无 emoji 备份方案」](../design-concepts/DC-02-scribe-narration-library.md)，emoji 永远不承担信息

---

## 3 · Apple HIG · Writing · 业界最系统的 voice/tone 官方方法论

### 产品 / 版本 / 截图位置

- 产品：Apple Human Interface Guidelines · `Writing` 章节 + WWDC24「Add personality to your app through UX writing」(Session 10140)
- 截图位置：`developer.apple.com/design/human-interface-guidelines/writing`，重点关注「Voice and tone」段落；以及 Apple Style Guide PDF（`help.apple.com/pdf/applestyleguide/en_US/apple-style-guide.pdf`）
- 关键 UI 区域：(a) **HIG Writing 章节的 voice/tone 二分定义**；(b) **WWDC24 视频里的"voice 不变、tone 随情境变"框架**；(c) **Apple Style Guide 中的禁词表**

### 可观测细节

- **voice vs tone 二分**：Apple HIG 是少数明确把这两者拆开的官方文档——
  - **Voice = 不变的人格**（这个 app 是谁、它的世界观、它的克制基线）
  - **Tone = 随情境调节的语态**（错误时更克制、成功时可以稍微温暖、引导新手时更耐心、专业用户更直接）
- **"Match your tone to the context"**：HIG 明确写——同一个 voice 在不同情境下要有不同 tone。比如新手引导时可以略带鼓励，专业用户的高级设置时则要求精准简洁
- **WWDC24 三步法**：(1) **Define your app's voice**（写下 3-5 个形容词描述这个 app 的人格）；(2) **Audit existing copy**（用这 3-5 个词逐句校对所有现有文案）；(3) **Modulate tone for situations**（列出 5-10 个典型情境，为每个情境定义 tone 调整方向）
- **Apple Style Guide 的禁词层级**：分三层 —— (a) **Never use**（如 "select" 不要用 "click"）；(b) **Avoid unless necessary**（如营销词 "powerful"）；(c) **Prefer**（推荐用法清单）。这是把"语态规范"当成可枚举工程资产的范本
- **错误信息黄金句式**：HIG 给出的错误信息模板 = `具体陈述发生了什么 + 给出可操作的下一步`，禁止 "Sorry / Oops / Don't worry"

### 为什么有效（**这是 ParallelMe 书记员人格规范的方法论靠山**）

- **voice/tone 二分解决了"书记员到底是谁"的根本问题**：当前 ParallelMe 只在 [DC-05 SCRIBE_SOUL](../design-concepts/DC-05-brief-card-design.md) 定义了书记员人格（接近 "voice"），但**没有明确定义在 5 个 stage 各自的 tone 调节**。Apple 框架告诉我们——书记员的 voice 是「温的理性 / 接地气 / 不下场」（这是不变的），但 tone 在 `taskFrame` 时（耐心引导）、`opening` 时（克制旁观）、`roundtable` 时（结构化镜面）、`inquiry` 时（温柔追问）、`settlement` 时（庄重凝句）应该有微调
- **WWDC24 三步法是可立即执行的工程动作**：定义 5 个形容词 → 用形容词审计现有文案 → 列情境矩阵——这三步可以直接转化为 [DC-02](../design-concepts/DC-02-scribe-narration-library.md) 的下一轮升级动作
- **禁词分层 = 可工程化的语态守门**：`Never use / Avoid / Prefer` 三层可以直接 lint——前端构建时跑一遍，命中 Never 报错、命中 Avoid 警告。对应到 ParallelMe，可在 [lib/scribe-narration.ts](../design-concepts/DC-02-scribe-narration-library.md)（建议路径）旁配 `taboo_words.ts`，与 voice 的 `taboo_words` 同构
- **错误信息黄金句式**：直接对应 [DC-02 失败语态](../design-concepts/DC-02-scribe-narration-library.md) 当前的 4 条异常态文案——"模型慢 / 网络断 / 钥匙过期 / 安全闸门"全部都符合 Apple 模板（具体陈述 + 可操作下一步），这是个**强校准信号**

### 对应 DC-02 哪条原则

| Apple HIG 机制 | DC-02 对应 / 启发 |
| --- | --- |
| voice / tone 二分 | **强升级建议**：DC-02 应增加 "Voice 定义"（3-5 个形容词）+ "Tone × Stage 矩阵"（5 阶段各自的 tone 调节方向） |
| WWDC24 三步法 | DC-02 文案库的下一轮升级动作清单 |
| 禁词三层 (Never / Avoid / Prefer) | **强补充**：DC-02 应明确禁词表，可工程化 lint |
| 错误信息黄金句式 | 原则 5「失败语态也要写好」的范本——当前 DC-02 异常态文案已自然符合，**应在文档中显式声明这一传承** |

### 不该照抄的部分

- ❌ **Apple HIG 是英文为主的**——voice/tone 框架可学，但禁词表不能直接搬（中文有自己的禁词体系，如"加油 / 奋斗"已在 voice 的 `taboo_words` 中）
- ❌ **Apple 强调 "Plain English / 短句优先"**——中文应转译为"短而不冷"，避免学到全冷
- ❌ **HIG 的 tone 调节范例偏工具语境（设置/错误/引导）**——ParallelMe 的 tone 调节维度是情绪 stage（议题整理/立论/对峙/落定），不能直接套用，但**方法论可继承**
- ❌ **WWDC24 演讲里有些"幽默 / 玩梗"的 tone 范例（如 Snoopy app）**——ParallelMe 是情绪场景，不应使用任何"玩梗 / 双关"的 tone 调节

---

## 4 · Notion AI · "Ask AI" 状态文案的人格化（**"AI 不是新功能，是一个会写字的同事"的范例**）

### 产品 / 版本 / 截图位置

- 产品：Notion AI · Notion AI for Work（2025 升级版，含 AI meeting notes / enterprise search / research mode）
- 截图位置：Notion 任意 page，按空格键唤起 Ask AI 浮层；或选中文字后右键唤起 AI 操作菜单（Refresh / Shorten / Summarize / Change tone）
- 关键 UI 区域：(a) **Ask AI 浮层的占位文案**；(b) **AI 思考时的状态文案**；(c) **"Change tone" 子菜单的措辞**

### 可观测细节

- **空格键唤起 Ask AI**：在 Notion 任何空行按空格键，浮层弹出，输入框 placeholder 是 **`Ask AI to write anything…`**——一句话同时完成 (1) 主语显式（"Ask AI"，不是"system" 或 "tools"）+ (2) 用户角色明确（you ask）+ (3) 能力边界开放（"anything"，但隐含语境是"写作"）
- **AI 工作时的状态文案**：当 Ask AI 在生成时，**输入框被替换为半透明的进度文字** `Writing…` / `Thinking about your request…` / `Drafting…`——状态文案与最终产物**位置守恒**（在同一行展开），不另开 modal
- **"Change tone" 子菜单的措辞**：选中段落后 → AI 操作菜单 → Change tone → 子选项是 **`Professional / Casual / Straightforward / Confident / Friendly`** 五选一——把"调 tone"做成可枚举的人话词，不是"调整语气"这种空话
- **流式输出与人手输入混排**：AI 生成的段落直接成为 page 的一部分（不带特殊背景色 / 不带 AI 标签），用户随时可以接着 AI 写的往下编辑——AI 与人的产出**视觉无差别**
- **"Refresh" vs "Try again"**：Notion 用 `Refresh` 表示"换一个版本再试"，用 `Try again` 表示"刚才失败了重新跑"——这是非常细的语义区分，证明文案是被**反复打磨**过的

### 为什么有效

- **空格键 + `Ask AI to write anything`**：占位文案在做三件事——召唤主体（Ask AI）、定义关系（you ask）、暗示边界（anything 但语境收敛）。这是把 [DC-02 原则 2「永远主语是书记员，不是系统」](../design-concepts/DC-02-scribe-narration-library.md) 做到极致的范本——主语永远是被你召唤的那个对象，不是平台
- **状态文案位置守恒**：Notion 没有用 spinner 或新弹窗，而是把"思考中"文案直接显示在产物即将出现的位置。对应到 ParallelMe——状态条不应飘走，应在 [DC-01 Layer 1](../design-concepts/DC-01-scribe-activity.md) 强调"状态出现的位置 = 产物出现的位置"
- **Change tone 可枚举**：把"语态调节"从抽象的指令变成可点击的离散选项（5 个 tone 名词）——这是把 Apple HIG 的"Tone × Stage 矩阵"产品化的范例。对应到 ParallelMe——书记员的 5 个 stage tone 调节也可以做成显式可见的"标签"（如 stage indicator 旁边显示当前 tone）
- **AI 与人产出视觉无差别**：与 [DR-01 公理 5 · AI 不能有视觉特殊化](DR-01-streaming-ui-references.md) 完全呼应。Notion 的"AI 段落不染色"是文案与视觉同时的克制
- **`Refresh` vs `Try again` 的语义区分**：证明文案不能笼统——"换版本"和"重试"是两个不同语义动作，混用会让用户认知错位

### 对应 DC-02 哪条原则

| Notion AI 机制 | DC-02 对应 / 启发 |
| --- | --- |
| `Ask AI to write anything` 召唤主体 | 原则 2「主语永远是书记员」的产品级证据 |
| 状态文案位置守恒（不飘走） | 原则 3「节奏感优先于精确性」+ DC-01 Tailwind Token「禁用位移动画」 |
| Change tone 5 选一 | **强升级建议**：DC-02 应增加"可显示给用户的 tone 标签"（如圆桌阶段切换时，状态条旁显示当前 tone） |
| AI 与人产出视觉无差别 | 与 DR-01 公理 5 共同支撑「反 AI 视觉特殊化」 |
| Refresh vs Try again 语义精度 | DC-02 应明确**动词词典**：每个动作有唯一对应的动词（"重试 / 换稿 / 重写 / 修订"不能混用） |

### 不该照抄的部分

- ❌ **Ask AI 是"用户主动召唤"模式**——ParallelMe 的书记员是**默认在场**的（贯穿全局 UI 范式），不需要用户每次召唤。两者的"召唤模型"不同
- ❌ **Change tone 5 选一对 ParallelMe 不直接适用**——ParallelMe 的 tone 应由 stage 自动切换（书记员根据当前阶段自动调），不应让用户手动选 tone（手动选 tone 会破坏沉浸感）
- ❌ **Notion 的 Friendly / Casual 等 tone 标签**——ParallelMe 的 tone 词典应来自[DC-05 SCRIBE_SOUL](../design-concepts/DC-05-brief-card-design.md) 的"温的理性 / 接地气 / 灵动"，不应使用 Notion 的西式 tone 词
- ❌ **AI 段落直接成为 page 一部分**——Notion 的产物是用户文档（用户拥有），ParallelMe 的书记员产物是会议纪要（书记员产出），所有权不同，视觉融合度可以略低（如 [DC-04 mirror_structure 卡片视觉规格](../design-concepts/DC-04-confrontational-voice-design.md) 的细线灰底就是合理的"轻识别"）

---

## 5 · Granola · 黑字 / 灰字 二分 · "AI 不抢主"的文案范例（**与 ParallelMe 议题卡同构最强**）

### 产品 / 版本 / 截图位置

- 产品：Granola · AI Notepad（2024 起持续迭代，2025 推出 iPhone 版 + AI chat + 29 meeting templates）
- 截图位置：Granola Mac/iPhone app 任意会议笔记页面，对比"会议中你打的字"vs"会议后 Enhance 出来的字"
- 关键 UI 区域：(a) **黑字（用户原笔记）vs 灰字（AI 补全）的视觉二分**；(b) **"Enhance notes" 按钮的措辞**；(c) **不派 bot 进会议的产品定位文案**

### 可观测细节

- **黑字 / 灰字 二分**：用户在会议中草草打的笔记保留为**黑字**（你的原话、你的视角、你的关注点），会议结束后点 "Enhance notes"，Granola 用全文 transcript 把笔记**自动 flesh out 成更完整的纪要**——但**新增的内容用灰字渲染**，与黑字物理区分
- **"Enhance" 而非 "Generate"**：动词选择极克制——`Enhance` 暗示"AI 在你已有的基础上加东西"，而不是"AI 替你重新写"。这是动词选择层面的产品哲学声明
- **不派 bot 进会议**：产品文案明确 `no meeting bots` / `transcribes device audio directly`——用否定句强调"我们不打扰"，把"克制"做成产品定位本身
- **占位文案**：空笔记页的 placeholder 是 `Jot a few notes…`——`jot` 这个词隐含"潦草是被允许的"，让用户没有压力地开始
- **状态文案极少**：与 ChatGPT 的 Thinking 块、Vercel v0 的 step indicator 不同，Granola 几乎不展示"AI 正在工作"的状态文案——因为 Enhance 是用户主动触发的批处理操作（不是流式），状态条不必要。这是**反向证明**：流式 UI 的状态文案是"流式的副产物"，不是"AI 的必需品"

### 为什么有效（**这是 ParallelMe 议题卡 + 圆桌纪要的同构样本**）

- **黑字 / 灰字 = 来源溯源 + 用户主权双解**：用户一眼看出"哪是我说的、哪是 AI 加的"——既保留了用户的主权感（我的笔记还是我的），又显式标注了 AI 的贡献边界（AI 加的内容随时可删）。这与 [DC-05 P3 「Whisper Metadata · 元数据耳语」](../design-concepts/DC-05-brief-card-design.md) 完全同构——**用色不用框、不用 badge，让来源在视觉上"在场而不打扰"**
- **`Enhance` 不是 `Generate`**：这一个词的差异决定了产品的整个定位——`Generate` 暗示 AI 是主体（替你写），`Enhance` 暗示用户是主体（AI 帮你完善）。对应到 ParallelMe——书记员的动词选择应避免 `Generate` / `Create`，优先用 `Enhance` / `Polish` / `Surface`（让...浮现）等"非主体"动词
- **"no meeting bots" 用否定句立场**：用"我们不做什么"来定义产品比"我们做什么"更有辨识度。对应到 ParallelMe——产品定位文案可以借用 `not a therapy app · not a productivity tool`（**不是治疗 app，不是效率工具**）这种否定式立场，呼应 [R11~R13](../requirements/backlog.md#r11) 背后的产品哲学
- **`Jot` 比 `Write` 更温柔**：占位文案的动词选择直接影响用户心理摩擦。`Write` 暗示"要写完整的句子"，`Jot` 允许"潦草、片段、关键词"——用户更容易开始。对应到 ParallelMe——所有用户输入框的 placeholder 都应使用降低开始门槛的动词（如 "说说看…" 而非 "请详细描述你的问题"）
- **状态文案的"反向缺席"证明**：Granola 几乎没有状态文案，因为它的 AI 工作是"批处理 + 用户主动触发"——这反向证明了 [DR-01 公理 1](DR-01-streaming-ui-references.md) 的边界：**状态文案是流式 UI 的产物，不是 AI 的必需品**。ParallelMe 的书记员是流式工作的（议题整理是边读边出），所以需要状态文案；但 Granola 式的"批处理 + 用户触发" 模式也是值得在 ParallelMe 某些环节（如归档 / 清明落定的最终凝句）借鉴的

### 对应 DC-02 哪条原则

| Granola 机制 | DC-02 对应 / 启发 |
| --- | --- |
| 黑字 / 灰字 二分 | 与 [DC-05 P3 Whisper Metadata](../design-concepts/DC-05-brief-card-design.md) 完全同构，是议题卡"用户原话 vs 书记员补全" 的视觉范本 |
| `Enhance` 而非 `Generate` 的动词选择 | **强升级建议**：DC-02 应增加**动词词典**，明确禁用主体性强的动词（Generate/Create/Produce），优先非主体动词（Enhance/Surface/Polish/Echo） |
| `no meeting bots` 否定句立场 | **强升级建议**：ParallelMe 主页 / about 页可借鉴否定式立场文案（呼应 R11~R13 的产品哲学） |
| `Jot a few notes…` 降低开始门槛的占位文案 | **强升级建议**：DC-02 应增加"占位文案规范"——所有用户输入框的 placeholder 都应使用低门槛动词 |
| 批处理模式可以没有状态文案 | DC-02 状态机切换规则的边界澄清——**状态文案不是必需品，按交互模式按需配** |

### 不该照抄的部分

- ❌ **黑字 / 灰字 视觉二分对 ParallelMe 议题卡可借鉴，但圆桌不适用**——圆桌的 voice 发言是**完整角色输出**（不是"用户笔记 + AI 补全"），所有发言都应是"AI 灰字"，不存在"用户黑字"。议题卡和清明落定环节才是黑/灰二分的合理场景
- ❌ **`Enhance` 在中文里没有完美对应**——"完善"略生硬，"补充"太轻，需结合 ParallelMe 语境创造性地对应（如"让 X 浮现得更完整""把 X 整理得更清楚"）
- ❌ **Granola 的"会议笔记"是工具语境**——ParallelMe 是情绪场景，黑/灰二分的视觉力度可以略弱（不要做成强对比，应是 `text-neutral-900` vs `text-neutral-500` 的微差）
- ❌ **`no meeting bots` 是反 SaaS 工具的定位**——ParallelMe 不应反"医疗 / 心理咨询" 工具时用这种"否定句堆叠"，否则会显得在攻击同行业。否定式立场要谨慎使用

---

## 跨产品共性提炼

5 个产品（Linear / Stripe / Apple HIG / Notion AI / Granola）虽然形态各异，但 2024-2026 年集体收敛出**七条 AI 时代文案语态的公理级实践**：

### 公理 1 · 文案是产品的人格容器，不是装饰

Linear 的 changelog、Apple 的 HIG Writing 章节、Notion 的 Change tone 子菜单——所有顶级产品都把"语态"做成与代码同等重要的工程资产，有专门的方法论、可枚举的禁词表、可显示给用户的 tone 标签。**文案投入决定产品人格上限**。

### 公理 2 · voice 不变，tone 随情境变

Apple HIG 把这一条做成官方方法论。对应到 ParallelMe——书记员的 voice 是 [DC-05 SCRIBE_SOUL](../design-concepts/DC-05-brief-card-design.md)（不变的"温的理性"），tone 应在 [DC-02 5 个 stage](../design-concepts/DC-02-scribe-narration-library.md) 各自微调（taskFrame 耐心 / opening 克制 / roundtable 镜面 / inquiry 温柔 / settlement 庄重）。

### 公理 3 · 主语永远不能是"系统"

Linear 用动词开头隐去主语、Stripe 以读者为主语、Notion 用 "Ask AI" 召唤具体对象、Granola 用 "Enhance notes" 让 AI 服务于用户笔记——**所有顶级产品都拒绝以"系统"作为主语**。ParallelMe 的"书记员"作为显式主语是正确方向。

### 公理 4 · 营销词、情绪词、玩梗 = 三个产品级毒药

Stripe 100% 中性、Linear 反营销腔、Apple HIG 明确 Never use 列表、Granola 不弹"成功！"toast——硅谷顶级产品的共识是**任何带销售意图或情绪暗示的词都会破坏信任**。ParallelMe 必须建立中文版禁词表（已有的 voice `taboo_words` 是好开端）。

### 公理 5 · 动词选择 = 产品哲学声明

Granola 用 `Enhance` 不用 `Generate`、Notion 区分 `Refresh` 和 `Try again`、Stripe 用 `select` 不用 `click`——**单个动词的选择决定了产品的整个定位**。ParallelMe 的书记员动词词典需要单独打磨（参见行动建议 1）。

### 公理 6 · 失败语态决定产品温度

Stripe 错误信息无情绪词、Apple HIG 的"具体陈述 + 可操作下一步"句式、Granola 不在批处理结束时弹 toast——所有顶级产品都把"失败"当成普通产品状态而非例外。ParallelMe [DC-02 异常态文案](../design-concepts/DC-02-scribe-narration-library.md) 已天然符合 Apple 黄金句式，是个**强校准信号**。

### 公理 7 · 来源溯源用色不用框

Granola 黑字/灰字、Notion AI 段落不染色、Linear comment thread 视觉一致——**用极轻的视觉差异（色阶、不饱和度）来标注来源，而不是用边框/badge/AI 标签**。这与 [DC-05 P3 Whisper Metadata](../design-concepts/DC-05-brief-card-design.md) 完全同向。

---

## ParallelMe 直接行动建议（基于 5 产品调研）

> 不是建议未来做，是**已经验证可行、可立即写进 backlog** 的具体动作。本 DR 不替用户拍板，按工作流"先沉淀，再讨论"原则提供事实证据。

| 建议 | 来源 | 影响 DC | 建议进度 |
| --- | --- | --- | --- |
| **建立中文版书记员禁词表**（Never / Avoid / Prefer 三层） | Apple HIG + Stripe | DC-02 | R 系列新增候选，可工程化 lint |
| **建立书记员动词词典**（明确禁用 Generate / Create 等主体动词，优先 Enhance / Surface / Polish / Echo / Jot 等非主体动词） | Granola + Notion | DC-02 | R 系列新增候选 |
| **DC-02 增加 voice/tone 二分定义**（voice 用 3-5 形容词锁定，tone × 5 stage 矩阵） | Apple HIG WWDC24 | DC-02 + DC-05 | DC 升级动作 |
| **DC-02 增加占位文案规范**（所有用户输入框 placeholder 用低门槛动词，如"说说看…"而非"请详细描述"） | Granola "Jot" | DC-02 | R 系列新增候选 |
| **About / 主页面用否定式立场文案**（"不是治疗 app · 不是效率工具"，呼应 R11~R13 产品哲学） | Granola "no meeting bots" | DC-02 + 产品定位 | R 系列新增候选 |
| **DC-02 状态机切换规则增加 tone 注解**（每个 stage 切换时显式声明 tone 调整方向） | Apple HIG + Notion | DC-02 | DC 升级动作 |
| **议题卡和清明落定环节引入"黑字/灰字"二分**（用户原话黑字 / 书记员补全灰字） | Granola | DC-05 | 列入 DC-05 视觉规范升级 |
| **bug fix 文案与功能文案同语气**（约束所有 ParallelMe 错误提示与正常文案语气一致） | Linear | DC-02 异常态 | 已天然符合，应在文档显式声明 |
