# PR-01 · 五声哲学的心理学依据

> 一句话立场：**「内心不是单一意识，而是多个 part 的合奏」是 1989-2020 年代横跨 4 个心理学传统的共识，不是 ParallelMe 的发明，而是 ParallelMe 对这个共识的产品化复刻。**

- 关联设计：[DC-04 Confrontational Voice Design](../design-concepts/DC-04-confrontational-voice-design.md) · [lib/selves.ts:10-17](../../../lib/selves.ts) IFS 5 类 part 实证
- 关联需求：[R11 端水软约束移除](../requirements/backlog.md#r11) · [R18 overreach_cost 移除](../requirements/backlog.md#r18)
- 调研窗口：经典文献（1989-2011）+ 最新综述（2014-2025）
- 文献密度：4 篇 primary source · 含 1 篇 *American Psychologist* 顶刊原文 · 1 套 IFS Institute 官方 PDF

---

## 1 · Internal Family Systems · Schwartz · 1995/2020

### 1.1 出处

- Schwartz, R. C. (1995). *Internal Family Systems Therapy*. New York, NY: Guilford Press. ISBN 978-0-89862-273-7. 第 1 版 hardcover；1997 paperback 再版。
- Schwartz, R. C., & Sweezy, M. (2020). *Internal Family Systems Therapy* (2nd ed.). New York, NY: Guilford Press. ISBN 978-1-4625-4146-1. 大幅扩写至 25 章。
- 官方文献库：IFS Institute, *IFS Bibliography, APA Style*（持续更新版）。
- 8 C's 官方手册：IFS Institute, *8 C's of Self v1*（PDF）。

### 1.2 核心理论

IFS 提出**人类心智天生是多元的**（"the mind is not a singular entity, but rather is naturally multiple"，*IFS Therapy* 2nd ed., Ch. 1）。每个 part 都不是病理产物，而是心智的正常组成，并具有以下属性：

- **positive intent**（正向意图）：每个 part 即使表现出极端行为，也是在保护用户
- **protective role**（保护角色）：分为 manager（预防型）/ firefighter（应急型）两大类
- **exile**（被流放部分）：携带未被照顾的痛苦记忆，被 manager / firefighter 看守

IFS 同时提出 **Self**（核心自我）的存在——一种**与 part 区分的元意识**，具有 8 种品质（**8 C's of Self Leadership**，Schwartz 2020）：

| C | 中译 | 官方定义节选 |
| --- | --- | --- |
| Curiosity | 好奇 | "Being genuinely open and curious about why other parts or other people behave as they do" |
| Compassion | 慈悲 | 对自己的 part 与他人不带评判地理解 |
| Calm | 平静 | "Being centered and able to maintain a physical groundedness in the face of stressful situations or parts" |
| Clarity | 清晰 | 不被 part 的扭曲透镜染色看世界 |
| Courage | 勇气 | "Approaching formerly avoided / threatening parts with willingness to listen" |
| Confidence | 自信 | 相信自己有能力承接所有内在体验 |
| Creativity | 创造性 | 能在限制中找到新可能 |
| Connectedness | 联结感 | 与他人 / 更大整体的归属感 |

### 1.3 → ParallelMe 精确映射

| IFS 概念 | ParallelMe 实现 | 代码位置 |
| --- | --- | --- |
| part 多元性 | 5 个独立 voice，每个一个 PersonaCard | [lib/selves.ts](../../../lib/selves.ts) |
| 4 类 part 类型 | `IFSType` enum 显式枚举 manager-prevent / manager-realist / firefighter / exile / self-perspective / self-decider | [lib/selves.ts:10-17](../../../lib/selves.ts) |
| positive intent | `VoiceSoul.protects` 字段 | [lib/selves.ts:19-29](../../../lib/selves.ts) |
| part 害怕的事 | `VoiceSoul.afraidOf` + `PersonaCard.fear` | [lib/selves.ts:21,40](../../../lib/selves.ts) |
| 保护代价 | `VoiceSoul.cost`（仅作 voice 内部人格定义，**禁止暴露给用户**——见 [R18](../requirements/backlog.md#r18)） | [lib/selves.ts:23](../../../lib/selves.ts) |
| Self 的 8 C's | 书记员人格 = self-perspective 的产品化体现（不评判、好奇、清晰呈现） | [DC-04 P3 书记员能做/不能做](../design-concepts/DC-04-confrontational-voice-design.md) |

> **关键 IFS 原则在 ParallelMe 的体现**：IFS 治疗师**绝不让 part 自己批判自己**——批判 part 的工作属于另一个 part（IFS 中称为 inner critic / managers）。当前 lib/llm.ts 已经把"批判"独立为 mirror_structure（书记员观察）的工作，不让任何 voice 兼任，符合 IFS part-边界原则。

---

## 2 · Polyvagal Theory · Porges · 1994/2011

### 2.1 出处

- Porges, S. W. (1994). Orienting in a defensive world: Mammalian modifications of our evolutionary heritage. *Psychophysiology, 32*(4), 301–318. → 首次提出 Polyvagal Theory（PVT）。
- Porges, S. W. (2011). *The Polyvagal Theory: Neurophysiological Foundations of Emotions, Attachment, Communication, and Self-Regulation*. New York, NY: W. W. Norton. ISBN 978-0-393-70700-7. → 系统性专著。
- Porges, S. W. (2022). Polyvagal Theory: A Science of Safety. *Frontiers in Integrative Neuroscience, 16*, 871227. DOI: 10.3389/fnint.2022.871227. → 最新综述。

### 2.2 核心理论

Polyvagal Theory 提出**自主神经系统具有 3 个进化层级的神经回路**（*Polyvagal Theory*, 2011, Ch. 2），按演化顺序由古到新：

| 状态 | 神经基础 | 行为表现 | 对话能力 |
| --- | --- | --- | --- |
| **dorsal vagal**（最古老） | 无髓鞘迷走神经（爬行动物保留） | 关闭（shutdown）、解离、装死 | 完全失语 / 拒绝对话 |
| **sympathetic**（中间） | 交感神经系统 | 战 / 逃（fight / flight）、动员能量 | 攻击性发言 / 想立刻逃离 |
| **ventral vagal**（最新） | 有髓鞘迷走神经 + 社会参与系统 | 安全、连接、对话 | 真正能听见对方 |

并提出关键概念 **neuroception**（神经感知，*Polyvagal Theory*, 2011, Ch. 1）："Neuroception is the neural process of evaluating risk in the environment without awareness"——身体在意识层面之前已经决定了进入哪个状态。

### 2.3 → ParallelMe 精确映射

ParallelMe 的五声系统并非 1:1 对应三个 polyvagal 状态（不应过度比附），而是**借鉴其"安全感是对话前提"的核心洞察**：

| Polyvagal 概念 | ParallelMe 实现 |
| --- | --- |
| ventral vagal = 对话前提 | 圆桌的"中立空间"（书记员不站队、五声不互相人身攻击）= 营造 ventral 状态的可对话场域 |
| sympathetic 攻击 ≠ 真对话 | DC-04 "对抗 ≠ 攻击" 4 条边界（[详见 DC-04](../design-concepts/DC-04-confrontational-voice-design.md)）= 把 voice 卡在"高强度但仍 ventral"的窄带 |
| dorsal 关闭 ≠ 安静 | 缺席声音（voice 选择不发言）必须**可见**而不是被隐藏（[DR-03 公理 5](../design-references/DR-03-conversation-stream-references.md)）= 让 dorsal shutdown 不变成 invisible bug |
| neuroception | UI 的视觉安全感（暖色基调、克什米尔木色、不闪烁、不弹窗）在意识层之前已经决定用户能否进入 ventral 状态 |

> **设计推论**：圆桌界面的任何视觉抖动 / 弹窗 / 红色警告都会触发用户的 sympathetic（战逃）状态，让用户无法听见 voice。这是 [DC-01 Tailwind Token](../design-concepts/DC-01-scribe-activity.md) 强制"L1 文案切换不允许位移动画"的神经科学依据。

---

## 3 · Dialogical Self Theory · Hermans · 1992/2010

### 3.1 出处

- Hermans, H. J. M., Kempen, H. J. G., & Van Loon, R. J. P. (1992). The dialogical self: Beyond individualism and rationalism. *American Psychologist, 47*(1), 23–33. DOI: 10.1037/0003-066X.47.1.23. → APA 顶刊，理论奠基论文。
- Hermans, H. J. M., & Hermans-Konopka, A. (2010). *Dialogical Self Theory: Positioning and Counter-Positioning in a Globalizing Society*. Cambridge University Press. ISBN 978-0-521-76526-9.
- Hermans, H. J. M. (2014). Self as a Society of I-Positions: A Dialogical Approach to Counseling. *The Journal of Humanistic Counseling, 53*(2), 134–159.

### 3.2 核心理论

Dialogical Self Theory（DST）提出 **self 是一个内部社会**（*American Psychologist*, 1992），最经典的概念定义（被引用最多的一句）：

> "The dialogical self can be conceived of as a dynamic multiplicity of relatively autonomous I-positions in the (extended) landscape of the mind." — Hermans & Hermans-Konopka (2010)

每个 **I-position** 具有：

- **autonomy**（相对自主性）：每个 position 有自己的视角、记忆、声音
- **dialogical**（可对话性）：不同 position 之间可以**对话**（不只是冲突或共存）
- **landscape**（空间隐喻）：position 在意识的"地形"中分布，可以被命名、定位、走访

DST 与 IFS 的关键差异：DST 更强调 position 之间的**对话过程**，IFS 更强调 part 与 Self 的**层级关系**。两者互补而非冲突。

### 3.3 → ParallelMe 精确映射

| DST 概念 | ParallelMe 实现 |
| --- | --- |
| dynamic multiplicity of I-positions | 圆桌结构 = I-positions 的**视觉化外化**（5 个座位 + 头像 + 名字） |
| relatively autonomous | 每个 voice 拥有独立 PersonaCard + 独立 system_prompt + 独立 chairPrompt |
| landscape of the mind | 圆桌 UI 的物理空间隐喻（座位环绕 + 中心议题 + 时间线纵向流动） |
| dialogical 对话过程 | moveType 系统（continue_all / continue_one / duel / mirror_structure）= 对话过程的可调度化 |
| 用户 = aware ego | 用户是圆桌**第六个座位**，可以追问、续轮、要求对峙——用户作为可在多个 I-position 间移动的元位置 |

> **设计推论**：DST 反对"找到真实自我"的提法（*American Psychologist*, 1992, p. 28），认为这是 monological 错觉。这直接支持 ParallelMe 反对"五声中哪个最对"的产品立场，书记员不能宣布哪个 voice 最大、最好、最正确。

---

## 4 · Voice Dialogue · Stone & Stone · 1989

### 4.1 出处

- Stone, H., & Stone, S. (1989). *Embracing Our Selves: The Voice Dialogue Manual*. Novato, CA: Nataraj Publishing. ISBN 978-1-882591-06-2. → Voice Dialogue 方法的奠基手册。
- Stone, H., & Stone, S. (1993). *Embracing Each Other: How to Make All Your Relationships Work for You*. Nataraj Publishing. → 关系应用版。
- Sage Encyclopedia of Theory in Counseling and Psychotherapy (2015) Voice Dialogue 词条收录（标志学术认可）。

### 4.2 核心理论

Voice Dialogue 提出 **psychology of selves**（*Embracing Our Selves*, 1989, Part I），核心二元对立：

- **primary selves**（主导自我）：用户日常自我认同的 self，已经"开车"
- **disowned selves**（被否认自我）：被压抑、未被听见、与 primary self 相反的 self

**关键原则**：问题**不是某个 self 存在**，而是用户**被某个 self 完全接管**（identification with one self），看不见其他 self 的存在（"awareness ego" 缺位）。

治疗目标 = **aware ego**：不消灭任何 self，而是让用户**在多个 self 之间形成可移动的元位置**——能听见 disowned selves 的声音而不被任何一个 self 接管。

### 4.3 → ParallelMe 精确映射

| Voice Dialogue 概念 | ParallelMe 实现 |
| --- | --- |
| identification with one self（被单一 self 接管） | 用户在面对议题时常被一个声音（焦虑 / 拖延 / 逃避）接管 → ParallelMe 通过强制"五声同台"打破单一 self 接管 |
| disowned selves 必须被听见 | [DC-04 P1](../design-concepts/DC-04-confrontational-voice-design.md) "voice 必须有立场" + drift guard "若你发现自己开始说『其实大家都有道理』——立刻停下重写" = 防止任何 voice 被消音/同化 |
| aware ego = 多 self 间的可移动元位置 | 用户作为**第六个座位**，可以听、可以追问、可以要求对峙、可以最终决定 = aware ego 的产品化 |
| 不让 self 互相说服 | drift guard "你不会被说服，你只会更精确地表达自己" = Voice Dialogue 治疗师"不让 selves 妥协"原则的工程化（[lib/selves.ts:51-58](../../../lib/selves.ts) drift guard） |

---

## 5 · 跨理论共识（4 个传统的 4 条公理）

将 IFS / Polyvagal / DST / Voice Dialogue 4 个独立传统的研究结论交叉，得出 4 条**跨传统稳定的公理**——任何与之冲突的产品决策都应被否决：

### 公理 1 · 心智天生多元，不是单一意识

**IFS** "the mind is naturally multiple" + **DST** "dynamic multiplicity of I-positions" + **Voice Dialogue** "psychology of selves" 三个独立传统得出同一结论。

→ ParallelMe 启示：单 Agent 范式（如 ChatGPT / Pi.ai）不是技术选择，是**与心理学共识相悖**的简化。多 voice 范式不是为了 UI 炫技，是对心智本质的尊重。

### 公理 2 · 没有"最好"的 part / position / self，只有被强占的视角

**IFS** "no part is bad, only extreme" + **DST** "no monological self" + **Voice Dialogue** "no self should be eliminated, only un-identified-with" 三个独立传统**全部反对**"找到正确答案"的提法。

→ ParallelMe 启示：书记员**绝不**宣布哪个 voice 最大、最好、最正确（[DC-04 P3](../design-concepts/DC-04-confrontational-voice-design.md)）。议题卡的"清明落定"不是"定下哪个 voice 赢"，是**让用户自己看清结构**后做选择。

### 公理 3 · 安全感是对话前提，不是对话结果

**Polyvagal** "ventral vagal precedes social engagement" + **IFS** "Self must be in the seat for parts to speak safely" + **Voice Dialogue** "facilitator must hold safe container" 三传统一致。

→ ParallelMe 启示：UI 的视觉安全感（暖色 / 克什米尔木 / 不闪烁 / 不弹窗）**不是装饰**，是让用户能听见 voice 的神经前提。任何打破安全感的设计（红色警告 / 抖动动画 / 弹窗中断）都会让所有内容设计前功尽弃。

### 公理 4 · part / self 的"自我批判"是另一个 part 的工作，不应合并

**IFS** "inner critic is a separate manager part" + **DST** "self-evaluation requires a meta-position" + **Voice Dialogue** "the criticizing voice is itself a self" 三传统一致。

→ ParallelMe 启示：[R18](../requirements/backlog.md#r18) 移除 `overreach_cost` 字段的根本理由——让 voice 自己评论自己，违反三个传统的共识。批判工作必须移交给**独立的人格容器**（书记员 mirror_structure），voice 自己只为自己说话。

---

## 6 · ParallelMe 直接行动建议

| # | 建议 | 对应代码 / 文档 | 优先级 |
| --- | --- | --- | --- |
| 1 | 把 IFSType enum 文档化为产品语言（不只是代码注释），让设计师 / 文案能直接引用 | [lib/selves.ts:10-17](../../../lib/selves.ts) → 提取到 [DC-04 P1 词典](../design-concepts/DC-04-confrontational-voice-design.md) | 高 |
| 2 | 书记员的 8 C's 显式化：把 Schwartz 8C（Curiosity / Calm / Clarity 等）写入书记员 system_prompt 作为人格底色 | 待新建 `lib/scribe.ts` ([R15](../requirements/backlog.md#r15)) | 高 |
| 3 | 圆桌 UI 的视觉安全感预算：制定"violation list"——任何破坏 ventral vagal 的设计（红色警告 / 弹窗 / 抖动）必须经评审 | [DC-01 Tailwind Token](../design-concepts/DC-01-scribe-activity.md) 已部分覆盖，扩充禁用清单 | 中 |
| 4 | 缺席声音必须可见（dorsal shutdown 不应变成 invisible bug）：UI 显式呈现"X 没有发言" | [EXP-03](../experience-log/EXP-03-multi-agent-absence.md) + [DR-03 公理 5](../design-references/DR-03-conversation-stream-references.md) | 中 |
| 5 | 议题清明落定**禁止**"哪个 voice 赢"措辞，措辞向"你看清了什么"靠拢（DST + IFS + VD 三重反对） | [DC-02 阶段 5 文案](../design-concepts/DC-02-scribe-narration-library.md) `settlement` 章节 | 高 |
| 6 | drift guard 文案"你不会被说服"作为 PR-01 的最强工程证据保留，不允许在迭代中被弱化 | [lib/selves.ts:51-58](../../../lib/selves.ts) | 永久 |
| 7 | 旧 `docs/research/` 已删除，PR-01 作为五声心理学依据的唯一深度证据入口保留 | 本文件 | done |

---

## 7 · 反面教材

**Replika** · 单 Agent + 高度认同用户 self → 学术研究记录到大量 **identification with one self** 灾难（用户被"AI 伴侣肯定"接管，丧失对其他 selves 的觉知）。详见 [DR-04 Replika 反面教材](../design-references/DR-04-confrontation-references.md) 与 [PR-03 § 3 Replika CHI 2025](PR-03-anti-sycophancy-autonomy.md)。

**ChatGPT 默认人格** · 单 voice、强 sycophancy → 用户的 disowned selves 永远无法在对话中被听见，违反 Voice Dialogue 核心原则。这是 ParallelMe 多 voice 范式的核心差异化原点。
