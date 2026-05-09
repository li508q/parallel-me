# Experience Log · 体验记录

> 本目录沉淀**实测过程中遇到的体验问题**——只做事实陈述，不做方案设计。
> 设计构想另在 `../design-concepts/`，工程调研另在 `../engineering-research/`，可执行的原子需求另在 `../requirements/`。

## 索引

| ID | 主题 | 涉及阶段 | 严重度 | 关联设计 | 关联需求 |
| --- | --- | --- | --- | --- | --- |
| [EXP-01](EXP-01-waiting-state-silence.md) | 等待态过于沉默（含全代码库扫描） | 全局 | 🔴 高 | [DC-01](../design-concepts/DC-01-scribe-activity.md) · [DC-02](../design-concepts/DC-02-scribe-narration-library.md) | S1~S5 |
| [EXP-03](EXP-03-multi-agent-absence.md) |「再来一轮」缺席声音不可见 | roundtable | 🔴 高 | [DC-01 Layer 4](../design-concepts/DC-01-scribe-activity.md) | S7~S9 |
| [EXP-08](EXP-08-fixed-call-count-limits-agent-depth.md) | 固定调用次数限制 Agent 分析深度 · 所有 LLM 环节的架构级问题 | 全局（defining / inquiry / roundtable / settlement） | 🔴 高（架构级） | [DC-06](../design-concepts/DC-06-agent-loop-design.md) | R19 · R20 · R21 · S16 · S17 |

## 编写约定

- 文件名：`EXP-{两位数字}-{kebab-case 主题}.md`
- 必含字段：**触发场景 / 问题描述 / 代码事实（带精确行号）/ 期望体验或诉求 / 关联设计概念**
- 禁止字段：方案设计（去 `design-concepts/`）、原子需求（去 `requirements/backlog.md`）
- 推测内容必须明确标注"推测，非用户陈述"
