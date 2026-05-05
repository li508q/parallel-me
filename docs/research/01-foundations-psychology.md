# 01 · 心理学根基

> **命题**：ParallelMe 的 5 + 1 席结构、4 道用户参与门、反讨好 NowMe、Memory Consent Gate——每一个设计决策都有具体心理学流派的依据。它不是"AI 应用借用心理学概念装饰"，而是把五个流派的核心方法**翻译成产品形态**。

---

## 关键结论

```
1. IFS（Internal Family Systems）→ 5 + 1 席的本体结构
2. Voice Dialogue → 用户为何必须主持（4 道参与门第一道存在的理由）
3. Schema Therapy（Modes）→ 议题驱动的临时席机制（V0.6）
4. Chairwork（椅子技术）→ 圆桌 / 席位牌的视觉隐喻
5. ACT（接纳承诺疗法）→ NowMe 不追求"想清楚"，追求"承诺一步"
```

---

## 1 · IFS · Internal Family Systems

### 1.1 · 来源

**Richard Schwartz 1995** 创立。核心专著：*Internal Family Systems Therapy* (Guilford Press, 1995, 2020 修订版)。

[**IFS Institute**](https://ifs-institute.com/) 是官方培训与认证机构，分 Level 1/2/3。

### 1.2 · 三个核心发现

1. 人内心**不是单一意识**，是一组各自有立场、有恐惧、有保护意图的子人格（parts）
2. 每个 part 都在保护用户，**即使方式笨拙、极端或痛苦**
3. 目标不是消灭某个 part，而是让 **Self**（核心人格）与 parts 建立关系

### 1.3 · Part 类型

| 类型 | 职能 | 例子 |
|---|---|---|
| **Manager · Prevent** | 预防型保护者，避免触发痛苦 | 躺平的我（防过劳） |
| **Manager · Realist** | 现实型保护者，用规则 / 数字屏蔽情绪 | 搞钱的我（现金流逻辑） |
| **Firefighter** | 应急保护者，冲动逃离痛苦现场 | 出走的我（gap year 冲动） |
| **Exile** | 被流放的内在小孩，携带未被照顾的伤 | 讨妈欢心的我（幼年被认同需求） |
| **Self** | 核心 Self：好奇、平静、清晰、有同情心、有边界 | 此刻的我 |

### 1.4 · Self 的状态

IFS 的"Self"不是另一个 part，而是用户在所有 parts 都被听见后回归的**核心状态**。

特征（"8C"）：
- Curiosity（好奇）
- Calm（平静）
- Clarity（清晰）
- Confidence（信心）
- Compassion（同情）
- Courage（勇气）
- Creativity（创造力）
- Connectedness（连接感）

### 1.5 · 对 ParallelMe 的产品转译

```
✓ 每个席位都必须有「它在保护什么」 → lib/selves.ts core_value 字段
✓ 每个席位都必须有「它最害怕什么」 → fear 字段
✓ NowMe 不是第六个声音，是用户恢复主权后的裁决者 → ifs_type: "self-decider"
✓ 系统不说「你这个声音错了」，只说「它在用什么方式保护你」 → psychInsight() 的非诊断 prompt
✓ Voice Dialogue 的 Aware Ego 要求最终选择来自 Self 而非任何单一 part → callNowMeWithCritic 反讨好 + meta-critic
```

### 1.6 · IFS 数字化产品参考

| 产品 | 形态 | 与 ParallelMe 的差异 |
|---|---|---|
| [IFS Guide / Sunny](https://ifsguide.com/) | 1v1 chat (AI 治疗师) | 单 agent 对话 vs ParallelMe 多 part 同时辩论 |
| [InnerOS](https://inneros.ai/ifs-therapy-app) | 多视角 Council（8 固定 archetype） | 固定 archetype vs ParallelMe 5 默认 + 动态临时席 |
| [Mindscape](https://www.mymindscape.co/) | "Group Chat Style Journaling" | 用户手动建立 parts vs ParallelMe 系统组阁 |
| [Unblend](https://unblend.me/) | "between-session IFS support" | 急救 check-in vs ParallelMe 完整决策会议 |

详见 `docs/research/06-competitive-landscape.md` § 1。

---

## 2 · Voice Dialogue · Aware Ego

### 2.1 · 来源

**Hal Stone & Sidra Stone** (1980s)，专著 *Embracing Our Selves: The Voice Dialogue Manual*。

### 2.2 · 核心原则

- 人的内在有 **many selves**
- 问题不在于某个 self 存在，而在于**用户被某个 self 完全接管**（identification）
- 成熟不是选择一个声音永远正确，而是发展出 **Aware Ego**——能听见多个声音但**不被其中任何一个绑架**

### 2.3 · 对 ParallelMe 的产品转译

```
✓ 会议的目的不是让某个席位胜利
  → NowMe 系统 prompt 强制「暂时听 X，暂时不听 Y」而非「全部都对」

✓ 用户主权的设计：4 道参与门
  → 立案确认（用户问准）
  → 点名追问（用户主动）
  → 签字（用户决定）
  → 记忆同意（用户授权）
  四道门均不让 AI 替代

✓ 权力图谱要显示谁常常掌权 / 谁常常沉默 / 谁总在关键场景接管用户
  → /cabinet 的派生统计（最响 / 被点名 / 出席）
  → V0.6 Loop D 沉默席召回
```

---

## 3 · Schema Therapy · Modes

### 3.1 · 来源

**Jeffrey Young** (1990s)，*Schema Therapy: A Practitioner's Guide* (Guilford, 2003)。

### 3.2 · 核心概念

一个议题会激活不同的**情绪状态和应对模式（modes）**。常见 mode：

- 受伤小孩（Vulnerable Child）
- 愤怒小孩（Angry Child）
- 顺从者（Compliant Surrenderer）
- 逃避者（Detached Protector）
- 惩罚性父母（Punitive Parent）
- 健康成人（Healthy Adult）

### 3.3 · 对 ParallelMe 的产品转译

```
✓ 组阁不能只根据主题分类，还要识别「当前激活的模式」
  → V0.6 临时席机制：用户能在 assembly 加「怕选错的我」「想被坚定选择的我」

✓ 临时席通常从模式里长出来
  → 模板 prompt 接收 protect / fear 两个字段，
    用户填写时本质上在描述自己当前激活的 mode

✓ 常任席必须覆盖稳定心理功能，临时席必须贴近具体议题和当下情绪
  → 5 默认席 = 5 种核心 mode 的恒常基底
  → V0.6 临时席 = 此次议题特有的 mode
```

---

## 4 · Chairwork · 椅子技术

### 4.1 · 来源

**Gestalt Therapy (Fritz Perls, 1960s)** + **Schema Therapy (Young, 2003)** + IFS 的 unblending 技术。

### 4.2 · 核心做法

把内在冲突分开放在不同椅子上。用户可以站在不同位置说话，也可以回到自己的位置作选择。

### 4.3 · 对 ParallelMe 的产品转译

这是 ParallelMe **视觉隐喻**的根。

```
✓ UI 应该像席位，而不是普通聊天流
  → SeatNameplate 组件（席位牌，有名字 / IFS label / 状态）
  → DocketPaper（议案纸）+ 席位围绕

✓ 用户可以点名某个席位，也可以「换位回答」
  → 4 道门中第二道：点名追问
  → cross-exam 中的"我想回答"用户判定

✓ 会议室是强隐喻，用户要感觉自己真的在主持一场内在会议
  → V0.5 Week 5 重设计的核心命题：从"5 步式表单"变"真正的会议室"
  → Timeline + SeatDock + HostConsole 三层
```

---

## 5 · ACT · Acceptance and Commitment Therapy

### 5.1 · 来源

**Steven C. Hayes** (1986)，*Acceptance and Commitment Therapy* (Guilford, 1999)。

### 5.2 · 核心原则

- 焦虑不一定要消失，用户仍然可以**按价值行动**
- 重要的不是想清楚所有事，而是做一个**与价值一致的下一步**
- 反复纠结的根本问题不是"想得不够清楚"，是"逃避动作"

### 5.3 · 对 ParallelMe 的产品转译

```
✓ NowMe 的结尾不是建议，是「承诺行动」
  → system_prompt 强制输出 5 项结构，最后一项必须是 24h 具体动作

✓ 下一步必须是 24 小时内可执行的小动作
  → SignatureSlip 默认 placeholder："一个具体的、24 小时之内可执行的小动作"

✓ 签字不是保证人生正确，是承认「我愿意为这个选择承担一点代价」
  → 签字文案："这不是保证永远正确。这是我愿意先走一步。"
  → 配「暂缓」与「我在逃避」两个诚实出口

✓ 反讨好的 NowMe 拒绝「平衡 / 兼顾 / 都很重要 / 综合考虑」
  → 这些词都是"避免承诺"的语言外壳；ACT 视角下属于体验性回避（experiential avoidance）
  → callNowMeWithCritic 的 banned words 直接对应这一治疗目标
```

---

## 6 · 安全边界（共同规范）

### 6.1 · ParallelMe 不是治疗

所有 5 个流派的临床应用都需要专业治疗师。ParallelMe 的边界：

```
❌ 不诊断
❌ 不给医学化标签
❌ 不声称治愈焦虑或抑郁
❌ 不用权威口吻替用户决定人生
❌ 不鼓励自伤、断联、冲动辞职、重大财务行为

✓ 命名感受
✓ 识别保护功能
✓ 提供低风险下一步
✓ 保留用户主权
✓ 高风险内容出现时温和转向安全支持
```

### 6.2 · 危机词触发清单

详见 `docs/design/PRODUCT-DESIGN.md` § 7.3 + `docs/research/04-mental-safety.md`。

---

## 7 · 完整 URL 清单

```
https://ifs-institute.com/
https://www.psychotherapy.net/interview/richard-schwartz-internal-family-systems

# Voice Dialogue
https://www.delos-inc.com/

# Schema Therapy
https://schematherapysociety.org/

# ACT
https://contextualscience.org/

# IFS 数字化产品
https://ifsguide.com/
https://inneros.ai/ifs-therapy-app
https://www.mymindscape.co/
https://unblend.me/
```

---

**最后更新**：项目调研整合后定稿。
