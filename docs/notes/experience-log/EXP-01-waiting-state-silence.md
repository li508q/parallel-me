# EXP-01 · 等待态过于沉默（含全代码库扫描）

- 记录时间：2026-05-06
- 涉及阶段：**全局**（最初触发于 `stage === "defining"` · 书记员议题整理；扫描后确认是产品全局问题）
- 严重度：🔴 高
- 关联设计：[DC-01 Scribe Activity 工作台](../design-concepts/DC-01-scribe-activity.md) · [DC-02 叙事文案库](../design-concepts/DC-02-scribe-narration-library.md)
- 关联需求：[S1 全局事件协议](../requirements/backlog.md#s1) · [S2 14 个 API 改 SSE](../requirements/backlog.md#s2) · [S3 三组件](../requirements/backlog.md#s3) · [S4 文案库首版](../requirements/backlog.md#s4) · [S5 历史 Trace 回看](../requirements/backlog.md#s5)

> 本记录由原 #1（局部触发）和原 #3（全代码库扫描）合并而成——后者是前者的全局延伸，两者根因相同（`busy: boolean` 单值 + 阻塞式 API），按"事实归类"应为同一条记录。

---

## Part 1 · 局部触发：「书记员整理中」等待态过于沉默

### 触发场景
进入「五声圆桌 → 本次议题」步骤后，书记员开始整理选择卡，页面长时间停留在：

> 书记员正在整理选择卡。
> 先把散乱内容压缩成少量高密度选择。
> （底部按钮：整理中…）

### 问题描述
- 唯一的反馈就是一句静态文案 + 一个 disabled 的"整理中…"按钮，**没有任何过程性叙事**
- 用户无法判断：书记员是真的在思考、卡住了、还是已经准备好但前端没刷新
- 等待焦虑感强，与本产品"陪你听见自己"的温度感不符——这一刻产品给人的感觉是"冷掉了"

### 期望体验
参考主流 Agent 产品（ChatGPT / Claude / Manus / GenSpark）的执行轨迹面板，把书记员"在做什么"实时叙事化地透出来，例如：

```
📖 正在阅读你的原始输入…
🎯 已识别 2 个核心张力：稳定 vs 增长 / 母亲期待 vs 自我意愿
🪑 正在为五声圆桌起草第 1 张选择卡…
🪑 正在为五声圆桌起草第 2 张选择卡…
✓ 整理完成
```

每一条都是"人话"，并且**可以点开看更深一层的思考过程**（chain-of-thought / 工具调用细节）。

### 关联设计概念
- **Streaming UI / Optimistic UI** — 解决等待焦虑的底层手法
- **Agent Trace / Working Memory Panel** — 实时呈现智能体在做什么
- **Progressive Disclosure** — 默认只露一句叙事，需要细节再点开
- **Glass Box AI / Explainable AI UX** — 整体价值主张：让用户看到"它怎么想的"

---

## Part 2 · 全代码库扫描：这是产品全局问题

### 扫描目的
Part 1 暴露的"等待态沉默"，是否只是「书记员整理议题」一处的局部问题？还是产品全局问题？

### 扫描结论
**这是产品全局问题。** 整个 `app/meeting/page.tsx`（1408 行）里所有等待态共用同一个 `busy: boolean` 标志——一个布尔值无法承载"我现在到底在做哪一步"的信息，只能渲染成 disabled 按钮 + 一句静态文案。

### 证据：前端 `setBusy(true) → await fetch` 各处全部缺乏过程叙事

下表逐条核对自 `app/meeting/page.tsx` 的 `buildActions()` 函数（第 ~460-560 行）以及对应的提交函数实现，**按钮文案均为代码原文**：

| 阶段 (`stage`) | 触发动作 | 按钮文案（busy 时 / 正常时） | 调用的 API |
| --- | --- | --- | --- |
| `defining` | 提交三张选择卡 | `"整理中…"` / `"整理本次议题 →"` | `POST /api/task-frame` |
| `review` | 任务框确认 | `"生成五声中…"` / `"确认，进入五声圆桌 →"` | `POST /api/roundtable`（action=opening） |
| `roundtable` | 再来一轮 / 让某声继续 / 问某一声 / 问全桌 / 两声对峙 / 书记员整理 | **无 busy 文案切换**，仅 `disabled={busy}` | `POST /api/roundtable`（action=move） |
| `roundtable → inquiry` | 进入书记员问询 | 无文案切换，仅 disabled | `POST /api/scribe-inquiry` |
| `inquiry` | 提交问询答案 | `"落定中…"` / `"生成清明落定 →"` | `POST /api/scribe-inquiry` + `POST /api/settlement` 串行 |
| `settlement` | 保存纸页 | `"保存中…"` / `"保存纸页"` | 本地 Dexie |

**结论**：`/meeting` 页面共有 6 类 stage-level 触发，其中 4 类有按钮文案切换（"xx中…"），2 类（roundtable 自由圆桌内部的 6 个 move 按钮、进入问询）连文案切换都没有，只有 disabled 状态。所有触发都共用同一个 `busy: boolean`，过程信息为零。

外加其他页面（已 read_file 核对）：
- `app/setup/page.tsx`：`runTest()` 调 `POST /api/provider/test`，UI 反馈是 `setTesting(true)` 后让按钮 disable + 出 `testResult` 卡。**纯静态等待，无过程叙事**
- `app/me/taste/page.tsx`：`generateProfile()` 调 `POST /api/taste`，UI 反馈是 CTA 文案切到 `"正在尝你的味道…"`。**单条静态文案，无过程叙事**
- `app/voices/page.tsx`：调 `POST /api/voices` 生成五声人格。**这是产品里最具仪式感的高情绪节点**（"我的五个分身长什么样"）

### 证据：后端 14 个 API route 全部是阻塞式

`app/api/` 下 14 个 route 文件长度都在 8 ~ 61 行之间，**没有任何流式实现**——没有 `ReadableStream`、没有 SSE、没有 `TransformStream`。整条链路从前端到后端都是「阻塞式 request → 一次性 response」。

### 改造范围按情绪重要度排序

- **🔴 高优先级**（用户情感投入最高、等待感最重）
  - **五声人格生成**（`/voices` → `/api/voices`）：用户在等"我的五个分身长什么样"，是产品里最具仪式感的一刻
  - **议题整理**（`/api/task-frame`）：第一次让用户感觉到书记员"读懂"了自己
  - **五声开场**（`/api/roundtable` opening）：圆桌正式落座的瞬间
  - **清明落定**（`/api/settlement`）：整场会议的高潮收束

- **🟡 中优先级**（节奏要保持，但情绪没那么重）
  - 圆桌追问 / 对峙 / 自由发言（每一轮都是 LLM 调用）
  - 书记员问询生成

- **🟢 低优先级**（功能性等待，时长短或情绪轻）
  - 钥匙校验（`/api/provider/test`，本质上是一次 ping）
  - 口味画像（`/api/taste`，单次生成，已有"正在尝你的味道…"这种偏拟人的文案，可保留现有形态）
  - 保存纸页（本地 Dexie 写入，毫秒级）

### 结论
原本的「书记员工作台」构想从"局部修复（议题整理）"升级为"全局规范"——凡是涉及 AI 在工作的等待，统一接入过程叙事 + Trace 面板。这件事一旦做了，就要做一致。

→ 设计方案见 [DC-01 Scribe Activity](../design-concepts/DC-01-scribe-activity.md)
→ 文案物料见 [DC-02 叙事文案库](../design-concepts/DC-02-scribe-narration-library.md)
