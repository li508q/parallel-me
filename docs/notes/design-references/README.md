# Design References · 设计参考库

> 5 个 DR 文档对应 5 个 DC 设计构想，沉淀**硅谷顶级产品的具体实例研究**——截图级 / 交互级 / 时间线级，不是产品名罗列。
> 调研窗口：**2024-2026 年最新版本**（用户偏好"最主流/最新/最好的，无历史包袱"）。
> 与 [design-concepts/](../design-concepts/README.md) 的关系：DR 是 DC 的"业界证据库"——DC 给方案，DR 给"为什么这个方案在最强的产品里被验证过"。

---

## 索引

| 文档 | 对应 DC | 主要参考产品 | 调研维度 |
| --- | --- | --- | --- |
| [DR-01](DR-01-streaming-ui-references.md) | [DC-01 书记员工作台四层结构](../design-concepts/DC-01-scribe-activity.md) | ChatGPT / Claude / Cursor / Linear / Vercel v0 | 流式 UI · 状态条 · Trace 面板 · 决策面板 |
| [DR-02](DR-02-narration-tone-references.md) | [DC-02 书记员叙事文案库](../design-concepts/DC-02-scribe-narration-library.md) | Linear changelog / Stripe Docs / Apple HIG voice / Notion AI / Granola | tone of voice · 微叙事 · 失败语态 · 主语选择 |
| [DR-03](DR-03-conversation-stream-references.md) | [DC-03 圆桌信息架构](../design-concepts/DC-03-roundtable-information-architecture.md) | Slack threads / Discord / AutoGen Studio / Pi.ai / Character.AI | 多代理对话 · 时间线 · Round/Turn · 引用关系 |
| [DR-04](DR-04-confrontation-references.md) | [DC-04 Confrontational Voice Design](../design-concepts/DC-04-confrontational-voice-design.md) | Anthropic CAI / ChatGPT Devil's Advocate / OpenAI Study Mode + Khanmigo / Kialo / Replika（反例） | 反 sycophancy · 苏格拉底追问 · 论点可视化 · 反面教训 |
| [DR-05](DR-05-brief-card-references.md) | [DC-05 议题卡设计语言](../design-concepts/DC-05-brief-card-design.md) | Linear issue / Notion database / Granola / Stripe Checkout / Apple Notes | Brief ≠ Form · 多视图 · 黑字灰字二分 · 元数据耳语 |
| [DR-06](DR-06-agent-loop-streaming-references.md) | [DC-06 Agent Loop 化设计](../design-concepts/DC-06-agent-loop-design.md) | Vercel AI SDK 6 / OpenAI Agents SDK / LangGraph / ChatGPT / Cursor | Agent Loop · ToolLoopAgent · Streaming UI · Human-in-the-loop · 中断 |

---

## 调研规范

每个 DR 文件遵循统一结构，避免后续维护时各 DR 散落：

1. **对应 DC**（哪一条原则需要这个产品作证据）
2. **产品 / 版本 / 截图位置**（明确到年份和具体功能页）
3. **可观测细节**（截图描述、字号、留白、动效、文案原文）
4. **为什么有效**（背后的设计原理 / 心理学 / 信息论）
5. **对应 DC 的哪条原则**（明确反向引用，避免脱节）
6. **不该照抄的部分**（这家产品的反面教训，避免走偏）

> **第 6 项最重要**——任何调研都不应该是"无脑膜拜"，硅谷产品也有走偏的细节，DR 必须明确标注哪些不该学。
