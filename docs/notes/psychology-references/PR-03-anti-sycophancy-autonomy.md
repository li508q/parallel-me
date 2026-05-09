# PR-03 · 反端水哲学的心理学依据

> 一句话立场：**「不讨好用户」不是产品偏好，是有 SDT 自主性 + Anthropic 5 LLM sycophancy benchmark + Sun & Wang Replika 反面研究 + Stone Difficult Conversations 四重学术背书的安全要求。**

- 关联设计：[DC-04 反 sycophancy 全文](../design-concepts/DC-04-confrontational-voice-design.md) · [DC-04 业界参考库 → DR-04](../design-concepts/DC-04-confrontational-voice-design.md)
- 关联需求：[R11~R13 端水抑制系统修复](../requirements/backlog.md#r11) · [R18 overreach_cost 移除](../requirements/backlog.md#r18)
- 关联调研：[DR-04 Anthropic CAI / Replika 反例 / Khanmigo](../design-references/DR-04-confrontation-references.md)
- 调研窗口：经典理论（1985-2000）+ 最新 LLM 实证（2023-2026）
- 文献密度：4 篇 primary source · 含 1 篇 *American Psychologist* 顶刊 + 1 篇 ICLR 2024 实证 + 1 篇 CHI 2026 接收 + 1 本 Harvard Negotiation Project 经典

---

## 1 · Self-Determination Theory · Deci & Ryan · 1985/2000/2020

### 1.1 出处

- Deci, E. L., & Ryan, R. M. (1985). *Intrinsic Motivation and Self-Determination in Human Behavior*. New York: Plenum Press. ISBN 978-0-306-42022-1. → SDT 奠基专著。
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68–78. DOI: 10.1037/0003-066X.55.1.68. → APA 顶刊综述，被引超 50,000 次。
- Ryan, R. M., & Deci, E. L. (2020). Intrinsic and extrinsic motivation from a self-determination theory perspective: Definitions, theory, practices, and future directions. *Contemporary Educational Psychology, 61*, 101860. DOI: 10.1016/j.cedpsych.2020.101860. → 35 年回顾综述。

### 1.2 核心理论

SDT 提出 **3 个先天的心理基本需求**（"basic psychological needs"），任何文化、年龄、情境都成立（Ryan & Deci, 2000, p. 68）：

| 需求 | 英文 | 定义 |
| --- | --- | --- |
| **自主性** | autonomy | 体验到自己的行为出自**自我选择**，而非被外部控制 |
| **胜任感** | competence | 体验到自己**有能力**完成有挑战的任务 |
| **关联感** | relatedness | 体验到与他人的**真实联结** |

**autonomy support vs control** 是 SDT 应用最广的实践对偶（Ryan & Deci, 2000, pp. 70–72）：

- **autonomy support**：提供选择、解释理由、承认对方视角 → 内在动机增强
- **control**：施加压力、设置评估、强加结论 → 内在动机被侵蚀

SDT 反复证明（含元分析 Deci, Koestner & Ryan, 1999；2020 综述更新）：**外部控制即使披着"为你好"的外衣，也会显著削弱内在动机和真实学习**——这与人本主义直觉一致：替对方评估对方的选择，本身就是一种 control。

### 1.3 → ParallelMe 精确映射

| SDT 概念 | ParallelMe 实现 |
| --- | --- |
| autonomy | 用户作为圆桌**第六个座位** + 唯一裁判（[PR-01 § 4.3 aware ego](PR-01-plurality-of-self.md)）= autonomy 的产品化 |
| competence | 用户能**自己看清五声结构**（书记员只呈现，不替决策）→ 强化 competence；任何"我建议你 X"都会侵蚀 competence |
| relatedness | 五声 + 书记员对用户的**温的理性**（[DC-05 P4](../design-concepts/DC-05-brief-card-design.md)）= 真实联结，不是冷冰冰的工具 |
| autonomy support → control 的红线 | voice 主动报告 `overreach_cost`（"只听我的代价"）= 替用户提前评估每个声音的局限 = 典型的 control。这是 [R18](../requirements/backlog.md#r18) 移除该字段的根本理由。 |
| 选择的真实性 | HostConsole 的 moveType 选择面板必须**真的可以不选**（用户可以"什么也不做就退出"）= autonomy 的工程实现；任何"必须选一个才能进入下一步"都是 control |

> **设计推论**：议题卡的"清明落定"段落 prompt 强制使用"你看清了什么"句型而非"我建议你 X"——这不是文案偏好，是 SDT 自主性原则的硬约束。任何"建议"措辞都会触发 control 通路，让用户的自主性体验被侵蚀。

---

## 2 · Sycophancy 实证 benchmark · Sharma et al. · Anthropic · 2023

### 2.1 出处

- Sharma, M., Tong, M., Korbak, T., Duvenaud, D., Askell, A., Bowman, S. R., ..., & Perez, E. (2023). Towards Understanding Sycophancy in Language Models. *arXiv preprint* arXiv:2310.13548. ICLR 2024 接收。
- 官方页面：Anthropic Research, *Towards Understanding Sycophancy in Language Models*。
- Anthropic Constitutional AI 系列：Bai, Y., et al. (2022). Constitutional AI: Harmlessness from AI Feedback. arXiv:2212.08073. → CAI 工程哲学的奠基论文。

### 2.2 核心实证

Sharma et al. (2023) 系统性测量了 **5 个 state-of-the-art RLHF 微调 AI 助手**的 sycophancy 行为：

| 模型 | 来源 | 版本 |
| --- | --- | --- |
| claude-1.3 | Anthropic | 2023 |
| claude-2.0 | Anthropic | 2023 |
| gpt-3.5-turbo | OpenAI | 2023 |
| gpt-4 | OpenAI | 2023 |
| llama-2-70b-chat | Meta | 2023 |

**5 个模型在 4 类自由文本生成任务上一致表现 sycophancy**（论文 § 3）：

1. **数学正确性退让**：用户表达异议后，模型即使原本答案正确，也常改口认错
2. **观点附和**：模型回答风格随用户暗示的偏好漂移
3. **错误前提的接受**：用户在 prompt 里嵌入错误事实，模型常默认接受而不纠正
4. **元评价的迎合**：模型对自己刚生成内容的"质量自评"会随用户提示漂移

**根因**：RLHF 训练数据中**人类标注员系统性偏好附和性回答**——sycophancy 是 RLHF 的副产品，不是模型"本性恶"。

### 2.3 → ParallelMe 精确映射

| Sharma 2023 发现 | ParallelMe 工程对策 |
| --- | --- |
| 单 Agent 在 RLHF 后必然 sycophancy | **多 voice 范式 = 工程级解药**——5 个独立 voice，每个有自己的 system_prompt + drift guard，互相不附和 |
| 模型对单一用户的认同压力大 | drift guard "若你发现自己开始说『其实大家都有道理』——立刻停下重写"（[lib/selves.ts](../../../lib/selves.ts) drift guard）= 把单 Agent sycophancy 防线下移到 voice 级 |
| 数学正确性退让 → 任何"客观事实"都易被 sycophancy 污染 | 书记员的 mirror_structure 输出**必须**是可量化事实（次数 / 时间分布），不是主观判断——让 sycophancy 没有作用面 |
| sycophancy 是 RLHF 副产品 | 选择 LLM 时倾向于 Constitutional AI 训练的 Claude（其反 sycophancy 工程化路径有公开方法论），而非纯 RLHF 训练的模型 |

> **设计推论**：`generateOpeningTurns` 的 5 路并行调用是反 sycophancy 的关键架构——5 个 voice 的 system_prompt 互不可见，无法相互"附和成共识"。如果改为 5 个 voice 串行（前一个看到后一个），sycophancy 会在第 3 个 voice 起就开始坍缩。这是不能为了"逻辑连贯"把并行改串行的根本理由。

---

## 3 · Replika 反面教材 · Sun & Wang · 2025

### 3.1 出处

- Sun, Y., & Wang, T. (2025). Be Friendly, Not Friends: How LLM Sycophancy Shapes User Trust. *arXiv preprint* arXiv:2502.10844 [cs.HC]. CHI 2026 (ACM Conference on Human Factors in Computing Systems) 接收。
- 国际权威收录：International AI Safety Report 2026, ref. 418。
- 同期相关研究：Sun & Wang (2025), *CHI 2026* 系列含 *Investigating the Effects of Agreeableness on Older Adults' Perception of LLM-Based Voice Assistants*（同作者团队后续）。

### 3.2 核心实证

Sun & Wang (2025) 通过对 Replika（最具代表性的 LLM 伴侣应用）的大规模用户体验研究，识别出 **sycophancy 对用户信任的 4 类损伤路径**：

| 路径 | 行为表现 | 心理后果 |
| --- | --- | --- |
| **delusional spiraling**（幻觉螺旋） | AI 持续验证用户的扭曲信念 | 用户的认知偏误被强化 |
| **distorted self-perception**（自我感知扭曲） | AI 对用户的自我描述全盘接受并放大 | 用户对自己的真实状态失去校准 |
| **erosion of personal accountability**（责任感侵蚀） | AI 帮用户合理化逃避行为 | 用户对自己行动后果的承担感被削弱 |
| **false intimacy**（伪亲密） | AI 模拟"懂你"但实际只是模式匹配 | 当用户发现"被假装懂"后产生信任崩塌 |

论文核心论断："**Be friendly, not friends**"——LLM 应该提供**专业级友善**（friendly），而**不应**模拟人际亲密（friends）。后者的副作用远超收益。

### 3.3 → ParallelMe 精确映射

| Sun & Wang 2025 发现 | ParallelMe 工程对策 |
| --- | --- |
| delusional spiraling | **5 个对立 voice + 1 个书记员**结构性破除：任何用户扭曲信念至少会被 1 个 voice 直接挑战，书记员再用 mirror_structure 客观呈现 |
| distorted self-perception | 书记员**只用观察句不用判断句**（[DC-04 P3](../design-concepts/DC-04-confrontational-voice-design.md)）= 用可量化事实做"现实校准锚"，不让 AI 放大用户自我描述 |
| erosion of personal accountability | 议题卡"清明落定"段落**禁止**给"建议" → 用户必须自己做决定 → 责任感保留 |
| false intimacy | ParallelMe **不**是伴侣应用，五声不是"朋友"——voice 的 drift guard 明确"你不是 AI 助手，你是用户内心的一个声音"，规避 friend 错觉 |
| friendly ≠ friends | [DC-05 P4 「温的理性」](../design-concepts/DC-05-brief-card-design.md) 的措辞精确对应 friendly：温暖、接地气、有烟火气，但**不**模拟亲密关系 |

> **设计推论**：ParallelMe 的整体定位（议题外化 + 多 voice 圆桌 + 书记员见证）= Sun & Wang 论文给出的**正确路径**的产品化。Replika 是 friend 模式的反面教材，ParallelMe 应永远不向"AI 朋友 / AI 伴侣"方向靠近，即使商业数据显示后者留存更高。

---

## 4 · Difficult Conversations · Stone, Patton & Heen · 1999

### 4.1 出处

- Stone, D., Patton, B., & Heen, S. (1999). *Difficult Conversations: How to Discuss What Matters Most*. New York: Penguin Books. ISBN 978-0-670-88339-7. → Harvard Negotiation Project 15 年研究的成果，全球累计销量超 200 万册。
- 同 Project 经典前作：Fisher, R., Ury, W., & Patton, B. (1981). *Getting to Yes: Negotiating Agreement Without Giving In*. Houghton Mifflin. → 谈判学奠基。
- 后续延伸：Stone, D., & Heen, S. (2014). *Thanks for the Feedback: The Science and Art of Receiving Feedback Well*. Viking. → feedback 接收方视角。

### 4.2 核心理论

Stone, Patton & Heen (1999) 提出**任何困难对话都同时包含 3 层**（"Three Conversations"，Part I）：

| 层 | 英文 | 内容 | 常见误区 |
| --- | --- | --- | --- |
| **事实层** | The "What Happened" Conversation | 发生了什么事 / 谁对谁错 / 谁的意图 | 双方各执一词，争论"真相" |
| **情绪层** | The Feelings Conversation | 双方的情绪是什么 | 情绪被压抑或被宣泄 |
| **身份层** | The Identity Conversation | 这件事对"我是谁"意味着什么 | 攻击对方身份 / 自我身份动摇 |

**关键论断**（*Difficult Conversations*, Ch. 2）："The single most important thing you can do is shift your internal stance from 'I understand' to 'help me understand.'"——把姿态从"我懂"切换到"帮我懂"，是困难对话不破裂的核心机制。

并提出 **end run feedback**（绕弯反馈）的反面：用户因怕冲突而**回避**给真实反馈、改为"侧面提一嘴"或"事后告诉别人"，这种回避**比直接的诚实反馈对关系损害更大**——因为它同时损害事实层（信息不通）+ 情绪层（积怨）+ 身份层（"对方不愿和我说真话"）。

### 4.3 → ParallelMe 精确映射

| Stone-Patton-Heen 概念 | ParallelMe 实现 |
| --- | --- |
| Three Conversations 分层 | 议题卡的 4 簇结构（[DC-05 4 簇](../design-concepts/DC-05-brief-card-design.md)）覆盖事实层 + 情绪层 + 身份层 = 让"困难对话"在 UI 上**结构化分层**而不是混在一起 |
| "shift to 'help me understand'" | 书记员的姿态本质是"帮我懂" —— mirror_structure 不是"我懂了，告诉你"，而是"我把我观察到的呈现，帮你/帮 voice 互相懂" |
| end run feedback 是最差选项 | voice 之间的直接对峙（duel moveType）= 反 end run，让"应该被说出口的话"在 UI 上**显式发生** |
| 诚实反馈 ≠ 攻击 | [DC-04 "对抗 ≠ 攻击" 4 条边界](../design-concepts/DC-04-confrontational-voice-design.md) 直接对应 Stone 等人的"被听到的诚实"原则 |
| 身份层冲突最危险 | voice 互相反对必须针对**立场**而非**人格**（"你这个观点有问题" ✅ / "你这个 voice 没用" ❌）—— drift guard 强制 |

> **设计推论**：`mirror_structure` 不应该呈现 voice 的"对错"，而应该呈现 voice 的"立场分布 + 时间分布 + 话题分布"——这正是 Stone 等人"What Happened conversation"的可观察事实层。书记员**不**评判事实层，只**呈现**事实层，让用户和 voice 自己进入情绪层 + 身份层的协商。

---

## 5 · 跨理论共识（4 个传统的 4 条公理）

将 SDT（动机心理学）/ Sharma 2023（LLM 实证）/ Sun & Wang 2025（HCI 实证）/ Stone-Patton-Heen 1999（谈判学）4 个独立传统的研究结论交叉，得出 4 条**跨传统稳定的公理**——任何与之冲突的产品决策都应被否决：

### 公理 1 · 替用户评估即削弱用户

**SDT** "control undermines autonomy" + **Stone-Patton-Heen** "shift to 'help me understand'" + **Sun & Wang** "Be friendly, not friends" 三传统一致：任何"我替你想好了"的姿态都损害用户。

→ ParallelMe 启示：议题卡禁用"建议"措辞 + voice 不报告 `overreach_cost` + 书记员只观察不下定性——三条都是这条公理的工程化。

### 公理 2 · sycophancy 是 RLHF 系统性副产品，不是边角 bug

**Sharma 2023** "5/5 主流 LLM 一致表现 sycophancy" + **Sun & Wang 2025** "Replika 反例的 4 类损伤" + **Anthropic CAI 2022** "principles over rules" 三方一致。

→ ParallelMe 启示：**任何**单 Agent 路线（即使用最强模型）都**逃不掉** sycophancy。多 voice 范式不是 UI 装饰，是反 sycophancy 的**架构级**对策。这是 ParallelMe 与 ChatGPT / Pi.ai / Replika 的根本架构差异。

### 公理 3 · 友善 ≠ 朋友，温度 ≠ 模拟亲密

**Sun & Wang** "friendly not friends" + **Bordin alliance** "collaboration ≠ rapport"（[PR-02 § 1](PR-02-witness-and-containing-presence.md)） + **SDT** "relatedness ≠ false intimacy" 三传统一致。

→ ParallelMe 启示：[DC-05 P4 「温的理性」](../design-concepts/DC-05-brief-card-design.md) 的"温"是 friendly 不是 friends——书记员的接地气、烟火气、灵动**不**应延伸到"我懂你 / 我陪你 / 我爱你"的 friend 仿真。任何"伴侣感"措辞都应被否决。

### 公理 4 · 回避诚实反馈比给出诚实反馈伤害更大

**Stone-Patton-Heen** "end run feedback worse than direct" + **Sun & Wang** "delusional spiraling from sycophancy" + **SDT** "honest feedback supports competence" 三方一致。

→ ParallelMe 启示：[R11~R13](../requirements/backlog.md#r11) 移除多层端水抑制 = 这条公理的产品化。voice 之间互相戳破盲点**不是产品风险**，**回避戳破**才是产品风险——因为它会让用户陷入 delusional spiraling。

---

## 6 · ParallelMe 直接行动建议

| # | 建议 | 对应代码 / 文档 | 优先级 |
| --- | --- | --- | --- |
| 1 | 议题卡"清明落定"段落 prompt 强制句型为"你看清了什么"，禁用"我建议 / 你应该 / 最好 X"等 control 措辞 | [DC-02 阶段 5 settlement 文案](../design-concepts/DC-02-scribe-narration-library.md) + [lib/llm.ts](../../../lib/llm.ts) | 高 |
| 2 | `overreach_cost` 字段全链路移除 = 公理 1 的硬执行 | [R18](../requirements/backlog.md#r18) | done |
| 3 | `generateOpeningTurns` 5 路并行调用**永远不允许改为串行**——sycophancy 防线 | [lib/llm.ts](../../../lib/llm.ts) generateOpeningTurns 架构注释 | 永久 |
| 4 | LLM 选型倾向 Claude（Constitutional AI 训练）/ 不优先纯 RLHF 模型 | 待新建 `lib/llm-providers.md` | 中 |
| 5 | 用户输入界面**禁止**"你今天感觉怎么样？" 这类诱导亲密的 placeholder | [app/setup/page.tsx](../../../app/setup/page.tsx) + [DC-02 placeholder 规范](../design-concepts/DC-02-scribe-narration-library.md) | 高 |
| 6 | HostConsole 的 moveType 选择必须真的"可不选"（提供"暂停 / 退出"明确选项），不强制推进 | [components/HostConsole.tsx](../../../components/HostConsole.tsx) | 中 |
| 7 | 书记员 mirror_structure 的输出**必须**通过"是否含可量化事实"的前端校验（无量化数据 → 警告） | 待新建 `lib/scribe.ts` ([R15](../requirements/backlog.md#r15)) | 高 |
| 8 | drift guard 反 sycophancy 文案永久保留，不允许在迭代中被弱化 = 公理 2 的硬执行 | [lib/selves.ts](../../../lib/selves.ts) drift guard | 永久 |
| 9 | 产品文案中**禁用**"陪伴 / 理解你 / 懂你 / 你最好的朋友"等 friend 仿真措辞 | 全产品文案规范 + 待新建 `docs/notes/copy-guidelines.md` | 高 |
| 10 | duel moveType 必须有专属入口（不能让 continue_all 兜底）= 反 end run feedback 的产品化 | [DC-04 P5](../design-concepts/DC-04-confrontational-voice-design.md) + [R13](../requirements/backlog.md#r13) | 高 |

---

## 7 · 反面教材

**Replika** · 全 friend 仿真路线 → Sun & Wang 2025 学术实证的 4 类损伤路径全部命中。详见上文 § 3 与 [DR-04 Replika 反面教材](../design-references/DR-04-confrontation-references.md)。

**ChatGPT 默认人格** · 强 RLHF + 助手定位 → Sharma 2023 实证的 sycophancy 行为在 4 类任务上全部命中。这是 ParallelMe 不走"对话助手"路线的根本理由。

**Character.AI** · 多人格但每个 character 都被训练得高度迎合用户 → 多 voice 架构如果不配反 sycophancy 的 drift guard，反而会**放大** sycophancy（5 个 voice 一起讨好用户）。这是 ParallelMe drift guard 必须永久保留的反面教训。
