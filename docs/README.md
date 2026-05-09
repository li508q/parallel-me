# ParallelMe 文档

这里是 ParallelMe v1 的产品设计文档区。根目录 README 负责对外介绍项目；本目录负责承接更完整的产品机制、设计原则和当前代码实现。

> 说明：`docs/images/` 中的图片是产品设计图，部分视觉或流程细节可能与当前界面不完全一致。具体产品描述以这些 Markdown 文档和当前代码实现为准。

## 阅读顺序

| 顺序 | 文档 | 内容 |
| --- | --- | --- |
| 1 | [产品愿景](01-product-vision.md) | 产品为何存在、服务谁、遵循什么设计原则。 |
| 2 | [阶段一：书记员问题定义](02-stage-one-scribe-problem-definer.md) | 书记员如何把原始困惑追问成可确认议题。 |
| 3 | [五声圆桌](03-five-voices-roundtable.md) | 五个内在声音、人格架构与圆桌运行模式。 |
| 4 | [书记员观察与问询](04-scribe-observation-and-inquiry.md) | 后台观察账本与最终高密度问询循环。 |
| 5 | [本心落定](05-heart-settlement.md) | 最终卡片结构、用户反馈、行动承诺和归档。 |
| 6 | [系统架构](06-system-architecture.md) | 当前 API、数据对象、存储、模型配置和安全边界。 |

## 产品地图

![ParallelMe v1 overview](images/parallel-me-v1-overview.png)

ParallelMe v1 的用户可见主链路是：

```text
原始困惑
  -> 阶段一书记员追问
  -> 用户确认议题提案 + 4 Key
  -> 五声开场立论
  -> 圆桌探索
  -> 书记员后台观察
  -> 最终书记员问询
  -> 本心落定
  -> 本地纸页归档
```

## 核心词汇

| 术语 | 含义 |
| --- | --- |
| 书记员 | 非人格声音的引导者，负责定义议题、后台观察和收束落定。 |
| 议题提案 | 入桌前的确认文件：一句本次议题主句 + 四个 Key。 |
| 4 Key | 具象化的困惑、真实的处境、隐秘的关切、渴望的终局。 |
| 五声 | 躺平的我、搞钱的我、出走的我、被牵挂的我、5 年后的我。 |
| 观察账本 | 用户不可见的内部记录，保存关键分歧、代价、未回答问题和行动线索。 |
| 本心落定 | 最终用户可见的自我对齐卡片。 |
| 纸页 | 一次完成会议的本地归档记录。 |

## 代码锚点

- 核心体验：`app/meeting/page.tsx`
- 阶段一书记员接口：`app/api/task-frame/route.ts`
- 圆桌接口：`app/api/roundtable/route.ts`
- 后台观察接口：`app/api/scribe-observation/route.ts`
- 最终问询接口：`app/api/alignment-inquiry/route.ts`
- 本心落定接口：`app/api/alignment-report/route.ts`
- 五声画像：`lib/selves.ts`
- LLM 编排：`lib/llm.ts`
- 数据模型：`lib/v7.ts`
- 本地数据库：`lib/db.ts`
