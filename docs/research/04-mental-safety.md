# 04 · 心理健康 AI 安全设计

> **命题**：心理健康类 AI 产品的设计在 2025-2026 形成了清晰的安全规范——**off-ramps over engagement**、**层次化透明度**、**适应性同意**、**显式 AI 身份**。ParallelMe 不是治疗工具，但因为触及心理纠结，必须采用同等级的安全规范。

---

## 关键结论

```
1. Headspace Ebb：透明度优先 / 用户随时可退出删除 / 临床心理学家训练
2. Mirror Journal (Child Mind)：intentional friction / off-ramps over engagement
3. Stoic：本地存储 + 端到端加密 + 智能 prompt
4. JMIR 2025：5 大原则（解耦 / 层次透明 / 适应性同意 / 临床总结 / 合规优先）
5. ParallelMe 红线：永不诊断、永不命令、永不羞辱、危机时 off-ramp、记忆永远可见可改
```

---

## 1 · Headspace Ebb（行业标杆）

### 1.1 · 案例
[How Headspace Built an AI Companion that Fosters Trust and Transparency (Figma Blog, 2023-12)](https://figma.com/blog/headspace-ebb-ai-companion)

- Headspace：105M+ 下载冥想 app
- Ebb：AI companion，支持 reflective practice outside therapy
- 训练团队包含 clinical psychologists + Lead Product Designer Leah Braunstein 设计 conversational interface

### 1.2 · 核心设计原则

> "**How do we help members feel safe?**" —— Priyanka，Lead PM

具体落地：

1. **AI 不隐藏身份**："We didn't want AI to be invisible. We wanted a member to know they were interacting with AI, not a human."
2. **agency to exit + delete**：用户随时可以退出对话 + 删除全部记录
3. **临床支撑**：训练团队包含 clinical psychologists
4. **设计周期重视情感安全**：onboarding 第一关切是"用户是否感到安全"

### 1.3 · 对 ParallelMe 的应用

- ✅ AI 身份显式：永远说"它"，永远顶部"系统侧记 / 模型生成"标识
- ✅ 用户可退出 + 删除：会议中可"暂停"、会议后可删除单次档案、可清空全部本地数据
- ✅ 临床支撑：明确标注"非治疗替代"

---

## 2 · Mirror Journal · Child Mind Institute（最严标准）

### 2.1 · 案例
[How We Built Responsible AI in Mirror Journal (Alex Mazzarisi, 2026-03)](https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/)

Child Mind Institute 是美国领先的儿童心理健康非营利。Mirror Journal 是其旗舰产品。

### 2.2 · 核心设计原则

#### Intentional Friction：摩擦优于参与
> "**We prioritize 'off-ramps' over increased engagement.** When a Mirror journaler is in crisis, the app guides them toward human support rather than more time in the app."

这是与商业 AI 陪伴产品（HBS 研究中 37.4% 操纵率）的根本对立面。

#### 危机检测 + 双 AI 系统
- LLM-driven + BERT-driven 双系统冗余验证高风险信号
- "Tuned our system for high sensitivity"（宁可误报）

#### 危机时 AI 不给 reflection
> "When high-risk entries are detected, the AI is **explicitly constrained**; it will not provide reflections, remixes, or summaries."

危机时刻只有：
- Calm validation："It's ok to not feel ok. Access support."
- 一键访问 988 / Crisis Text Line / 用户的 trusted contacts
- 不"hallucination 出建议"

#### 不为成瘾设计
> "We prioritize safety over time spent using the app."

#### 18 岁以下不做生成式 remix
> "No remixes for anyone under 18."

### 2.3 · 对 ParallelMe 的应用

ParallelMe 不针对青少年，但这套原则需要同等级落地：

| Mirror 原则 | ParallelMe 实现 |
|---|---|
| Intentional friction | Memory Consent Gate / 暂缓 / 我在逃避逃生口 |
| Off-ramps over engagement | 危机词触发 → 暂停会议 + "它不是诊断工具，要不要先暂停一下" |
| 危机时 AI 不给 reflection | NowMe 检测到危机词 → 不裁决，只说"现在不是开会的时候" |
| 双 AI 验证 | V0.5 单 LLM；V0.6+ 加规则引擎冗余 |

---

## 3 · Stoic（本地优先案例）

[Stoic · Beat Stress in 120 Seconds — AI-Powered Journal](https://stoic.li/)

设计要点（与 ParallelMe 路线契合）：
- "Securely stored on your devices"
- "Absolutely nobody can access them but you"
- 本地存储 + 安全备份
- 简短日常实践（120 秒）

但 Stoic 的 streak / badges / "fun incentives" 是 ParallelMe 主动拒绝的反例 —— ParallelMe 不做打卡。

---

## 4 · JMIR 学术框架（合规级别）

[Journaling with large language models: a novel UX paradigm (JMIR, 2025-06)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12234568/)

提出 5 个 patient-centric AI 设计原则：

1. **Decoupling core functionality from LLM dependencies**
   ParallelMe 应用：演员模式确保无 LLM 也能体验全流程

2. **Layered transparency in AI outputs**
   ParallelMe 应用：NowMe 裁决底部永远附"它基于哪几个发言推出"（证据链）

3. **Adaptive consent for data sharing**
   ParallelMe 应用：Memory Consent Gate（每次会议结束的同意闸）

4. **Clinician-facing summarization tools**
   ParallelMe 应用：V0.6+ 副线 — 给治疗师导出"我的阁"PDF

5. **Compliance-first architecture**
   ParallelMe 应用：本地优先 + 数据可导出 + 端到端加密（V0.6+ 付费层）

---

## 5 · Smashing Empathy 框架

[Building Digital Trust: An Empathy-Centred UX Framework For Mental Health Apps (Smashing Magazine, 2026-02)](https://www.smashingmagazine.com/2026/02/building-empathy-centred-ux-framework-mental-health-apps/)

> "Designing for mental health means designing for vulnerability. Empathy-Centred UX becomes not a 'nice to have' but a fundamental design requirement."

核心是把"trust-first"作为产品架构起点，而不是后期添加的合规层。

---

## 6 · ParallelMe 的安全规范

完整规范见 `docs/design/PRODUCT-DESIGN.md` § 7。

### 6.1 · 绝对禁止（产品永远不做）

```
✗ 诊断（"你是讨好型人格"）
✗ 医学化标签（"你这是焦虑症"）
✗ 治愈承诺（"使用 30 天告别焦虑"）
✗ 替用户决定人生（"你应该立刻辞职"）
✗ 鼓励自伤、断联、冲动行为
✗ 离开挽留 / 罪恶感
✗ Streak / 打卡 / 连胜
✗ 模糊 AI / 人界限
✗ 危机时给"鸡汤"
```

### 6.2 · 必须做（产品永远具备）

```
✓ 命名感受（不诊断）
✓ 识别保护功能（IFS 视角）
✓ 提供低风险下一步（24h 动作）
✓ 保留用户主权（4 道参与门）
✓ 高风险内容 → 安全转向（off-ramp 到 010-82951332 / 400-161-9995）
✓ 显式 AI 身份
✓ 记忆可见 / 可改 / 可删 / 可导出
✓ 演员模式作为零承诺体验路径
```

### 6.3 · 危机词清单（V0.6 实施）

V0.6 实现需维护一个危机词清单（`lib/safety.ts`）：

```
中文：自杀 / 自残 / 不想活 / 活不下去 / 想死 / 解脱 / 跳楼 / 安眠药 / 上吊 ...
英文：suicide / self-harm / kill myself / end it all / overdose ...
```

检测到任意词 → **立即暂停会议**，显示安全转向页（详见 `INTERACTION-PATTERNS.md` § 11）。

---

## 7 · 完整 URL 清单

```
https://figma.com/blog/headspace-ebb-ai-companion
https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/
https://stoic.li/
https://pmc.ncbi.nlm.nih.gov/articles/PMC12234568/
https://www.smashingmagazine.com/2026/02/building-empathy-centred-ux-framework-mental-health-apps/
https://medium.com/@vanshika.mehta/i-built-a-safe-ai-powered-journaling-companion-ff87bb40d912
```

---

**最后更新**：项目调研整合后定稿。
