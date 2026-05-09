# Design Concepts · 设计构想

> 本目录沉淀**针对体验问题的产品化方案**——设计原则、信息架构、视觉语言、交互范式。
> 事实陈述见 `../experience-log/`，可执行需求见 `../requirements/`。

## 索引

| ID | 主题 | 类别 | 来源 |
| --- | --- | --- | --- |
| [DC-01](DC-01-scribe-activity.md) |「书记员工作台 / Scribe Activity」四层结构 | 全局 UI 范式 | [EXP-01](../experience-log/EXP-01-waiting-state-silence.md) · Step 2 schema key 修复 · [EXP-03](../experience-log/EXP-03-multi-agent-absence.md) |
| [DC-02](DC-02-scribe-narration-library.md) |「书记员状态条」叙事文案库 | DC-01 子文档 / 文案物料 | DC-01 Layer 1 |
| [DC-03](DC-03-roundtable-information-architecture.md) | 圆桌信息架构与设计原则四维度 | 单阶段信息架构 | Step 3 · [R4~R10](../requirements/backlog.md#r4) |
| [DC-04](DC-04-confrontational-voice-design.md) | Confrontational Voice Design · 让五声敢于碰撞 | **核心产品哲学**（跨阶段） | Step 4 · [R11~R13](../requirements/backlog.md#r11) |
| [DC-05](DC-05-brief-card-design.md) | Brief Card Design · 议题卡设计语言（4 簇 + 书记员人格 + 元数据耳语） | **单阶段信息架构 + 文案语态规范** | Step 5 · [R14~R17](../requirements/backlog.md#r14) |
| [DC-06](DC-06-agent-loop-design.md) | Agent Loop 化设计 · 关键环节 LLM 自主循环 + Streaming UI | **架构级 · 跨所有 Stage** | [EXP-08](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md) |

## 文档间关系

- **DC-01 是总纲**：定义"AI 工作中"时刻的全局表达范式（4 层结构）
- **DC-02 是 DC-01 的物料库**：提供 Layer 1 状态条的文案物料，可独立维护
- **DC-03 是单阶段专题**：处理 `roundtable` 阶段的对话型信息架构，与 DC-01 互不冲突——DC-03 的"时间线"是 DC-01 Layer 1/2 落地的物理基础
- **DC-04 是产品哲学层**：跨所有阶段的 voice 编排原则；它会反向升级 DC-01 Layer 3（新增 `mirror_structure` 书记员观察卡片 + voice 间对抗卡片）、DC-02（新增"结构化观察"语态——书记员只用观察句，不用判断句）、DC-03（轮次分隔符升级为"轮次 + 本轮是否有不同意"双标）——见 DC-04 文末"与现有设计文档的关系"。注意：DC-04 把书记员重新定义为「激烈对话中的理性支柱」，**不是**"敢说话的第六声"
- **DC-05 是 task-frame review 阶段专题 + 书记员人格中心**：处理议题卡的视觉/IA 与文案语态。它会反向升级 DC-01 Layer 3（新增 `BriefCard` 卡片样式 · 4 簇分章 + 元数据耳语 + 可点编辑）、DC-02（新增"议题卡复述"语态分组——章节标题模板、簇内段落连接句、元数据耳语模板）。**DC-05 P4「温的理性」与 DC-04 P3「书记员是理性支柱」互补不冲突**——DC-04 划定了能力边界（不下场、不预设观点），DC-05 在边界内补齐了语气温度。DC-05 提议的 `lib/scribe.ts · SCRIBE_SOUL` 是全产品复用的书记员人格中心（brief / inquiry / settlement / mirror 四种次级人格）
- **DC-06 是架构级改造 · 跨所有 Stage**：将书记员的 defining/inquiry/settlement 三个环节从"固定调用次数 Workflow"升级为"Agent Loop（LLM 自主判断终止条件）"+ 现代 Streaming UI。**关键区分**：书记员需要 Agent Loop（Human-in-the-loop 交互循环），五声不需要 Agent Loop 但需要 Deep Reasoning（充分思考后给出有洞见的回答）——两者改进机制完全不同。DC-06 会反向升级 DC-01 Layer 1（从"阶段叙事"升级为"Agent 步骤叙事"）、DC-01 Layer 2（记录 Agent 每一步决策链）。前置依赖 [S13](../requirements/backlog.md#s13)（Next 16 + React 19）+ [S16](../requirements/backlog.md#s16)（Vercel AI SDK 6）
