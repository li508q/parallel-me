# 系统架构

本文描述 ParallelMe v1 当前代码实现。

![ParallelMe v1 overview](images/parallel-me-v1-overview.png)

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 应用框架 | Next.js 16 App Router |
| UI | React 19 / TypeScript |
| 样式 | Tailwind CSS v4 / CSS-first design tokens |
| AI 编排 | Vercel AI SDK |
| 模型服务 | OpenAI-compatible endpoint，用户自行配置 |
| Schema 校验 | Zod |
| 客户端状态 | Zustand |
| 本地数据库 | Dexie / IndexedDB |
| 通知 | Sonner |

## 主体验入口

主流程位于 `app/meeting/page.tsx`。

它协调：

- provider 配置与 runtime payload
- stage 状态流转
- 书记员流式事件
- 议题提案确认
- 圆桌动作
- 后台观察
- 最终问询
- 本心落定生成
- 本地保存

状态管理位于 `lib/store/meeting-store.ts`。

## API 路由

| 路由 | 作用 |
| --- | --- |
| `POST /api/task-frame` | 阶段一书记员追问、议题提案生成与修正。 |
| `POST /api/roundtable` | 五声开场立论与圆桌推进。 |
| `POST /api/scribe-observation` | 用户不可见的观察账本更新。 |
| `POST /api/alignment-inquiry` | 最终高密度书记员问询。 |
| `POST /api/alignment-report` | 生成本心落定。 |
| `POST /api/taste` | 可选的品味画像提取。 |
| `POST /api/provider/test` | 模型配置连通性测试。 |

`/api/scribe-inquiry` 与 `/api/settlement` 属于旧链路或兼容接口，不是 v1 主路径。

## 核心数据对象

权威数据模型位于 `lib/v7.ts`。

| 对象 | 作用 |
| --- | --- |
| `IssueProposal` | 阶段一确认后的议题：一句主句 + 四个 Key。 |
| `TaskFrame` | 后续圆桌逻辑使用的兼容框架。 |
| `RoundtableRecord` | 五声开场、后续发言、用户动作和两声对话。 |
| `ScribeObservationLedger` | 用户不可见的观察与未回答问题记录。 |
| `AlignmentProfile` | 最终问询阶段沉淀出的中间画像。 |
| `HeartSettlement` | 最终用户可见的本心落定卡片。 |
| `Meeting` | 一次完整本地会议记录。 |

## LLM 编排

主要模型调用位于 `lib/llm.ts`。

当前模式包括：

- 从用户 provider 配置解析 OpenAI-compatible runtime
- 使用 `generateObject` / `streamObject` 生成结构化输出
- 使用 `lib/schema.ts` 中的 Zod schema 校验模型结果
- LLM 错误分类与有限重试
- 通过 SSE 包装书记员可见叙述和模型增量
- 对用户可见的关键产物使用严格 schema、JSON 修复和重试；连续失败时暴露可重试错误，不用模板兜底替代模型结果
- fallback 只允许用于非关键兼容路径或后台账本保守保留，不用于阶段一追问、最终问询和本心落定的可见内容
- 阶段一追问基于 4-Key purpose 做语义去重，并把对话缺口、用户已答内容、证据质量与书记员判断过程反馈给结构化重试
- 议题提案使用 `issue_proposal_v2` 严格输出，只让模型生成用户可校对的 4-Key 文档；兼容 `TaskFrame` 由本地派生
- 提案修正使用 `proposal_refine_v2`，在“继续追问”和“更新提案”之间显式二选一，不用旧提案兜底
- 五声圆桌使用 `voice_opening_v2`、`roundtable_voice_turn_v2`、`duel_question_v2`、`duel_response_v2` 约束用户可见发言，单声失败才保守降级
- 长对话与长圆桌记录在 prompt 序列化时压缩旧上下文，保留最近关键 turns
- 阶段一追问不设置总轮次硬上限，但必须通过本地证据质量 guard：四个 Key 都需用户回答覆盖，并至少出现足够探索量、用户展开和边界确认
- 最终问询同样使用证据质量 guard：创造性无望、核心价值主轴、痛苦接纳、最小行动、正反合五个落点都需被用户问询回答覆盖，模型不能单方面提前生成本心落定
- 本心落定使用 `alignment_report_v2` 严格输出，每个模块必须有正文和证据；失败时由 SSE error 进入重试，而不是返回模板报告

产品原则是：JSON schema 只是传输层和校验层，不应成为用户界面的一部分。

## 结构化 Harness 策略

主链路里的书记员相关结构化调用遵循同一模式：

1. 先让模型用自然语言完成必要判断，供用户可见思考或后续生成使用。
2. 再单独调用一次结构化生成，要求输出版本化 schema，例如 `probe_v2`、`issue_proposal_v2`、`proposal_refine_v2`、`voice_opening_v2`、`roundtable_voice_turn_v2`、`observation_ledger_v2`、`inquiry_v2`、`alignment_report_v2`。
3. 对解析失败或 schema 失败先做 JSON 修复；修复仍失败时，把错误反馈给模型重试。
4. 本地 guard 负责业务质量，例如锚点引用、重复问题、置信度与 action 一致性、问询覆盖度、报告证据完整性。
5. 用户可见内容不使用静态模板兜底；如果连续失败，UI 应展示可重试状态。

这一策略对齐主流 LLM harness 的做法：schema 用来约束机器可读结构，质量 guard 用来约束产品语义，失败恢复优先修复和重试，而不是把内部格式或默认模板暴露给用户。

## 本地优先存储

ParallelMe 通过 `lib/db.ts` 使用 Dexie / IndexedDB。

当前数据库名为 `ParallelMeV10`，包含 `meetings` 表，索引字段：

- `id`
- `createdAt`
- `closedAt`
- `status`

用户画像与品味上下文通过 `lib/profile.ts` 保存在浏览器 localStorage。

## 模型配置

应用接受 OpenAI API 兼容端点：

```bash
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

用户也可以在 `/setup` 页面配置模型。浏览器中的配置会随请求传给服务端 API 路由。

## 安全边界

`lib/llm.ts` 中包含危机文本检测。如果用户表达可能伤害自己或他人的风险，应用会返回安全提示，引导用户寻求现实世界支持。

产品安全边界：

- 不宣称治疗
- 不做诊断
- 不提供医疗建议
- 不替代危机干预
- 不把隐藏观察包装成权威判断
- 不替用户做最终选择

## 隐私边界

ParallelMe 是 local-first 产品：

- 会议记录保存在浏览器本地
- 不需要账号
- 本地记录可以清空
- API Key 不应进入版本库

同时也要明确：为生成模型回复，用户内容会发送给用户配置的模型服务端点。产品文案在描述隐私时应区分“本地存储”和“模型调用”。

## 开发检查

代码变更提交前建议运行：

```bash
npm run typecheck
npm run build
```

文档变更至少运行：

```bash
git diff --check
```
