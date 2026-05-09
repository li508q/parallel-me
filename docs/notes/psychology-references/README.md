# Psychology References · 心理学依据库

> 4 个 PR 文档对应 ParallelMe 4 大核心产品哲学，沉淀**心理学文献级支撑**——DOI / 作者 / 年份 / 章节 / 原话引用，避免空中楼阁。
> 调研窗口：**经典文献（1985-2020）+ 最新综述（2020-2026）双覆盖**，不只引用最新，也不只引用经典。
> 与 [design-concepts/](../design-concepts/README.md) 和 [experience-log/](../experience-log/README.md) 的关系：DC 给方案、EXP 记录痛点、PR 给"为什么这个方案在心理学上是对的"。

---

## 索引

| 文档 | 对应产品哲学 | 对应 DC / EXP | 主要文献来源 |
| --- | --- | --- | --- |
| [PR-01](PR-01-plurality-of-self.md) | **五声哲学** · 内心是多个 part 的合奏，不是单一意识 | [DC-04](../design-concepts/DC-04-confrontational-voice-design.md) · [lib/selves.ts](../../../lib/selves.ts) | Schwartz IFS (1995/2020) · Porges Polyvagal (2011) · Hermans Dialogical Self (1992) · Stone Voice Dialogue (1989) |
| [PR-02](PR-02-witness-and-containing-presence.md) | **书记员人格** · 临在的见证者，不评判、不替代、不消失 | [DC-04 P3](../design-concepts/DC-04-confrontational-voice-design.md) · [DC-01](../design-concepts/DC-01-scribe-activity.md) · [R12](../requirements/backlog.md#r12) | Bordin Therapeutic Alliance (1979) · Bion Containing (1962) · Kabat-Zinn MBSR (1990) · Rogers Unconditional Positive Regard (1957) |
| [PR-03](PR-03-anti-sycophancy-autonomy.md) | **反端水哲学** · 不讨好用户即是对用户的尊重 | [DC-04](../design-concepts/DC-04-confrontational-voice-design.md) · [R11~R13](../requirements/backlog.md#r11) · [R18](../requirements/backlog.md#r18) | Deci & Ryan SDT (1985/2020) · Sharma et al. Sycophancy benchmark (2023) · Zhang et al. Replika CHI 2025 · Stone Difficult Conversations (1999) |
| [PR-04](PR-04-productive-disagreement.md) | **碰撞哲学** · 高质量分歧产生高质量洞察 | [DC-04 对抗 ≠ 攻击](../design-concepts/DC-04-confrontational-voice-design.md) · [R12](../requirements/backlog.md#r12) · [DC-03 duel](../design-concepts/DC-03-roundtable-information-architecture.md) | Edmondson Psychological Safety (1999/2018) · De Dreu Task Conflict (2003) · Page Cognitive Diversity (2007) · Janis Groupthink (1972) |

---

## 调研规范

每个 PR 文件遵循统一结构，避免后续维护时各 PR 散落：

1. **一句话立场**（这条产品哲学要解决什么心理问题）
2. **核心文献**（≥4 篇，每篇必含：作者 / 年份 / 标题 / 出处 / DOI 或 ISBN / 关键章节 / 原话引用）
3. **理论与产品的精确映射**（理论术语 → ParallelMe 概念 / 文件 / 行号）
4. **跨理论共识**（多个心理学传统对同一问题的一致结论 → 给出产品级公理）
5. **反面教材**（业界产品违反这条哲学的失败案例，含具体数据/引用）
6. **对应 DC / EXP 的反向引用**（哪一条原则有这条文献做底气）

> **第 6 项最重要**——任何文献都不应该是"无根据引用"，必须明确指向 ParallelMe 的某条具体设计决策，否则属于"摆书袋"。

---

## 与旧 research 文档的关系

旧 `docs/research/` 已被 `docs/notes/` 取代并删除。`psychology-references/` 是当前唯一的文献级证据库，用于产品 / 设计 / 学术 quality check。
