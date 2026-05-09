# ParallelMe · 设计与工程笔记索引

> 本目录沉淀产品迭代过程中的**事实记录、设计构想、设计参考、心理学依据、工程调研、原子需求、依赖安全**七类文档。
> 拆分原则：**事实归事实、设计归设计、调研归调研、需求归需求、运维归运维**，避免单一文档膨胀失控。
> 拆分时间：2026-05-06，前身是单一文件 `2026-05-06-nextjs-security-audit.md`，已按主题拆分到下述目录，原文件已删除。

---

## 目录结构

```
docs/notes/
├── README.md                                      # 本文件 · 索引
│
├── experience-log/                                # 体验记录（实测中遇到的问题，事实陈述）
│   ├── README.md
│   ├── EXP-01-waiting-state-silence.md            # #1 + #3 等待态过于沉默（含全代码库扫描）
│   ├── EXP-03-multi-agent-absence.md              # #4「再来一轮」缺席声音
│   └── EXP-08-fixed-call-count-limits-agent-depth.md  # 固定调用次数限制 Agent 分析深度 · 架构级
│
├── design-concepts/                               # 设计构想（针对体验问题的产品化方案）
│   ├── README.md
│   ├── DC-01-scribe-activity.md                   # 「书记员工作台 / Scribe Activity」四层结构
│   ├── DC-02-scribe-narration-library.md          # 「书记员状态条」叙事文案库（DC-01 子文档）
│   ├── DC-03-roundtable-information-architecture.md  # 圆桌信息架构与设计原则四维度
│   ├── DC-04-confrontational-voice-design.md      # Confrontational Voice Design · 核心产品哲学
│   ├── DC-05-brief-card-design.md                 # Brief Card Design · 议题卡设计语言
│   └── DC-06-agent-loop-design.md                 # Agent Loop 化设计 · 关键环节 LLM 自主循环 + Streaming UI
│
├── engineering-research/                          # 工程调研（业界模式、技术参考）
│   ├── README.md
│   └── ER-01-multi-agent-structured-output.md     # 多 Agent 结构化输出可靠性 · 四层组合
│
├── design-references/                             # 设计参考库（硅谷顶级产品截图级/交互级调研）
│   ├── README.md
│   ├── DR-01-streaming-ui-references.md           # 对应 DC-01 · ChatGPT/Claude/Cursor/Linear/Vercel v0
│   ├── DR-02-narration-tone-references.md         # 对应 DC-02 · Linear changelog/Stripe Docs/Apple HIG/Notion AI/Granola
│   ├── DR-03-conversation-stream-references.md    # 对应 DC-03 · Slack threads/Discord/AutoGen Studio/Pi.ai/Character.AI
│   ├── DR-04-confrontation-references.md          # 对应 DC-04 · Anthropic CAI/ChatGPT Devil's Advocate/Study Mode+Khanmigo/Kialo/Replika(反例)
│   ├── DR-05-brief-card-references.md             # 对应 DC-05 · Linear issue/Notion database/Granola/Stripe Checkout/Apple Notes
│   └── DR-06-agent-loop-streaming-references.md   # 对应 DC-06 · Vercel AI SDK 6/OpenAI Agents SDK/LangGraph/ChatGPT/Cursor
│
├── psychology-references/                         # 心理学依据库（DOI/作者/年份/原话引用，文献级支撑）
│   ├── README.md
│   ├── PR-01-plurality-of-self.md                 # 五声哲学 · IFS/Polyvagal/Dialogical Self/Voice Dialogue
│   ├── PR-02-witness-and-containing-presence.md   # 书记员人格 · Bordin/Bion/Kabat-Zinn/Rogers
│   ├── PR-03-anti-sycophancy-autonomy.md          # 反端水哲学 · Deci&Ryan SDT/Anthropic Sycophancy/Replika CHI 2025/Stone
│   └── PR-04-productive-disagreement.md           # 碰撞哲学 · Edmondson/De Dreu/Page/Janis
│
├── requirements/                                  # 原子需求 backlog（可独立排期/验收）
│   ├── README.md
│   └── backlog.md                                 # R 系列 + S 系列全部原子需求一表
```

---

## 阅读路径建议

### 我是新加入项目的开发者
1. 先看 `experience-log/`，了解产品当前实测的体验痛点
2. 再看 `design-concepts/`，了解针对痛点的设计构想
3. 想动手改代码 → `requirements/backlog.md` 找对应原子需求
4. 改之前需要技术参考 → `engineering-research/`
5. 怀疑某条产品哲学/设计方向时 → `psychology-references/`（心理学文献级证据）+ `design-references/`（业界产品截图级证据）

### 我是产品/设计
1. `experience-log/` — 实测问题
2. `design-concepts/` — 设计原则与方案
3. `design-references/` — 业界顶级产品对照
4. `psychology-references/` — 心理学文献级背书（用于评审/答辩）
5. `requirements/backlog.md` — 待办与验收标准

## 内容关系图

```
体验记录（事实层）          设计构想（产品层）          工程调研（技术层）
─────────────────         ─────────────────          ─────────────────
═══════════════════════════════════════════════════════════════════
产品需求（第一~第六步 · 技术基座已完成）
═══════════════════════════════════════════════════════════════════

EXP-01 等待态沉默   ─┬─→  DC-01 书记员工作台（4 层）
EXP-03 缺席声音      │     └─→ Layer 1 状态条 ──→  DC-02 叙事文案库
                     │     └─→ Layer 2 Trace
选择卡 schema 泄漏（Step 2 已修复） ─┴─→  （DC-01 Layer 2 自然消解）
                                                    ER-01 多 Agent 结构化输出
EXP-03 缺席声音    ────────────────────────────→   （为 EXP-03 提供方法论）
Step 3 圆桌时间线 ───→   DC-03 圆桌信息架构（R4~R10 已完成）

                                                    ↓
                                         requirements/backlog.md
                                         （R1~R21 产品需求 + S1~S17 工程改造）

Step 4 端水修复 ───→ DC-04 Confrontational Voice Design（R11~R13 已完成）
                          ↓
                    R11 移除软约束 + R12 编排器反碰撞改造 + R13 新增对抗 moveType
                    S10 + S11 危机闸门移除（blocked，等用户决策）

Step 5 议题卡升级 ──→ DC-05 Brief Card Design（R14~R17 已完成）
                                    ↓
                              R14 议题卡 4 簇 UI 重构 + R15 书记员 soul 沉淀（lib/scribe.ts）
                              R16 schema 8→4（blocked，等 D8） + R17 元数据耳语降级

Step 2 「只听我的代价」移除 ──→ DC-04 P1/P2（角色沉浸 + 不自我反对）的延伸应用
                                    ↓
                              R18 overreach_cost 字段全链路移除（已完成）

EXP-08 固定调用次数限制 Agent 深度 ──→ DC-06 Agent Loop 化设计（LLM 自主循环 + Streaming UI）
                                          ↓
                              S16 Agent 运行时（Vercel AI SDK 6）→ S17 全链路 Streaming UI
                              R19 defining Agent Loop / R20 inquiry Agent Loop / R21 Voice 自主插入

证据库（横向支撑层 · 不绑定单一 EXP/DC）
────────────────────────────────────────
design-references/   ←─ 6 个 DR 一一对应 6 个 DC：业界顶级产品截图级/交互级证据
                          DR-01 streaming UI ─→ DC-01
                          DR-02 叙事语态 ─→ DC-02
                          DR-03 对话流 ─→ DC-03
                          DR-04 碰撞参考 ─→ DC-04
                          DR-05 议题卡参考 ─→ DC-05
                          DR-06 Agent Loop + Streaming ─→ DC-06
psychology-references/ ←─ 4 个 PR 对应 4 大产品哲学：心理学文献级（DOI/原话）证据
                          PR-01 五声 ─→ DC-04 + lib/selves.ts
                          PR-02 书记员 ─→ DC-01 + DC-04 P3
                          PR-03 反端水 ─→ DC-04 + R11~R13 + R18
                          PR-04 碰撞 ─→ DC-04 + DC-03 + R12
```

---

## 维护约定

1. **新增体验问题** → 在 `experience-log/` 新建 `EXP-XX-<slug>.md`，并在本 README 的目录结构里登记
2. **新增设计构想** → 在 `design-concepts/` 新建 `DC-XX-<slug>.md`，并在 `experience-log/` 对应记录的「关联设计」字段反向链接
3. **新增工程调研** → 在 `engineering-research/` 新建 `ER-XX-<slug>.md`
4. **拆分出新的原子需求** → 在 `requirements/backlog.md` 表格里追加一行，ID 用 `R{n}`（产品体验类）或 `S{n}`（工程改造类）
5. **新增设计参考** → 在 `design-references/` 新建 `DR-XX-<slug>.md`，对应一个 DC，沉淀业界顶级产品的截图级/交互级证据
6. **新增心理学依据** → 在 `psychology-references/` 新建 `PR-XX-<slug>.md`，对应一条产品哲学，沉淀文献级（DOI/作者/年份/原话）证据
7. **跨文档引用** → 用相对路径 markdown 链接，配合 HTML 显式锚点（`<a id="..."></a>`）。**示例**（从本 README 视角）：`[R4](requirements/backlog.md#r4)`；从子目录文档（如 `design-concepts/DC-04.md`）回引时则前缀 `../`。**核心原则**：用相对路径 + 显式锚点，避免依赖 GitHub Slugger 自动生成中文锚点（不同渲染器规则不一致）。
8. **不要把多个不相关主题塞进同一个文件** — 这是本次拆分要解决的核心问题

---

## 命名规约

- 文件名前缀代表类型：`EXP-`（体验）/ `DC-`（设计构想）/ `ER-`（工程调研）/ `DR-`（设计参考）/ `PR-`（心理学依据）
- 编号两位数字（`01`~`99`），保证文件名按字典序排序也是阅读顺序
- 后缀 slug 用 `kebab-case`，简短描述主题
- 需求 ID 用 `R1`/`S1` 这类短编号（不带前导零），便于在表格、commit message、issue 标题中快速引用
