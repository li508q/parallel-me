# DC-01 ·「书记员工作台 / Scribe Activity」四层结构

- 性质：全局 UI 范式（不是某个具体页面）
- 来源痛点：[EXP-01 等待态沉默](../experience-log/EXP-01-waiting-state-silence.md) · Step 2 schema key 修复 · [EXP-03 缺席声音](../experience-log/EXP-03-multi-agent-absence.md)
- 子文档：[DC-02 叙事文案库](DC-02-scribe-narration-library.md)（Layer 1 文案物料）
- 关联需求：[S1~S5](../requirements/backlog.md)
- 关联心理学：[PR-02 书记员人格的心理学依据](../psychology-references/PR-02-witness-and-containing-presence.md)（Bordin 治疗同盟 / Bion containing / Kabat-Zinn mindfulness / Rogers UPR——四层结构的心理学根基）

---

## 命名与定位

> 它**不是一个具体页面**，而是一个**贯穿全局的 UI 范式**——产品里所有"AI 工作中"时刻的统一表达方式。
> 之所以叫"工作台"而不是"加载条"：加载条只解决"等多久"，工作台解决"它在做什么"。让用户感觉是坐在书记员对面，看他翻笔记、抬头确认、再低头写字——而不是看一个进度条转圈。

## 三个核心原则（在写代码与文案前先记住）

1. **永远说人话** — 任何对外可见的文字，都应该是书记员"在跟你说话"，不是"在打日志"。schema / key / tag / 置信度等技术内部表征**默认不外露**
2. **过程叙事化** — 不再是死板的"整理中…"，而是一串带情绪和节奏的微叙事（"正在阅读…/ 已识别…/ 正在起草…"），让等待变成"听书记员低声汇报"
3. **细节按需展开** — 用户想看更深的推理（包括那些 key-value、模型调用、引用片段），点开 `查看思考过程 ›` 进入 Agent Trace 面板，那里才是技术信息的归属地
4. **交互节点用选项卡** — 当书记员需要用户拍板时，以一组干净的「选择卡」呈现，文案纯人话；技术 schema 收进可展开的 Trace 里

---

## 四层结构（从用户感知到技术实现）

### Layer 1 · 状态条（Status Strip） — 默认全程可见

页面底部或顶部一条窄窄的状态带，**永远只有一行人话**：

```
📖 书记员正在读你的话…
    ↓ （自动切换）
🎯 已识别 2 个核心张力
    ↓
🪑 正在为你起草第 1 张选择卡…
    ↓
✓ 整理完成 · 请看下方
```

对应概念：**Streaming UI / Optimistic UI**。目标：消灭"沉默感"。

文案物料见：[DC-02 叙事文案库](DC-02-scribe-narration-library.md)

### Layer 2 · 思考过程面板（Trace Panel） — 默认收起，按需展开

状态条右侧一个 `查看思考过程 ›` 链接，点开是一个可滚动的时间线：

```
14:32:01  📖  阅读原始输入
          → 输入字数：47
          → 识别到主语：「我」
          → 识别到关键关系人：「妈妈」

14:32:03  🎯  抽取张力
          → 张力 1：稳定 vs 增长（confidence 0.87）
          → 张力 2：母亲期待 vs 自我意愿（confidence 0.92）

14:32:05  🪑  起草选择卡 1/3
          → primary_fear: 失去人生可能性
          → pressure_source: 对低容错环境的担忧
          → 措辞候选：×3，已选第 2 个

14:32:08  ✓  整理完成
```

对应概念：**Agent Trace / Working Memory Panel**。
schema key、置信度、模型调用细节、引用的 prompt 片段——**所有技术裸数据的归属地都在这里**，不再污染主界面。
Step 2 修掉的 `primary_fear: 失去人生可能性` 一类 schema key 外泄，本来就该住在这一层。

### Layer 3 · 交互节点（Decision Pane） — 需要用户拍板时

当书记员需要用户决策，状态条暂停，弹出一组**干净的选择卡**，但是：
- **只有人话**，没有英文 key
- 副标题如果有，是书记员的"轻声补充"，自然语言
- 卡片旁边仍然有 `查看书记员怎么想出这些选项的 ›`，回到 Layer 2

交互模式上等价于"AI 在执行任务前向用户发送一个确认面板"。

### Layer 4 · 完成回收（Resolution）

状态条变成"✓ 整理完成"后，自动 fade 进入下一阶段；Trace 面板的内容**永久归档**到本次会议的 `archive` 里，用户后续翻看 `/archive/[id]` 时也能回看"那一次书记员是怎么想的"。这是产品长期的**透明度资产**。

对 [EXP-03](../experience-log/EXP-03-multi-agent-absence.md) 缺席声音的呼应：Layer 4 同样要回收"失败/缺席"事件，让 Trace 面板能记录"哪一声没说话、为什么没说话、是否已自动重试"。

---

## 信息流向

```
用户 ←(Layer 1 持续低声汇报)— 书记员 ←(Layer 3 偶尔抬头确认)— 书记员 ←(Layer 2 默默记录全过程)— LLM
```

---

## 工程依赖（→ 转化为 S 系列原子需求）

- 后端 14 个 route 需要从"一次性 JSON 响应"改造成 **SSE 或 ReadableStream** → [S2](../requirements/backlog.md#s2)
- 前端需要一套可复用组件：`<ScribeStatusStrip />`、`<ScribeTracePanel />`、`<ScribeDecisionPane />` → [S3](../requirements/backlog.md#s3)
- 需要一份**事件协议**：书记员每完成一个推理子步骤就发一个 `event`，前端订阅渲染 → [S1](../requirements/backlog.md#s1)
- 文案库首版 → [S4](../requirements/backlog.md#s4)
- `/archive/[id]` 回看历史 Trace → [S5](../requirements/backlog.md#s5)

---

## 三个核心组件 · Props 接口草案

> 给前端工程师的"明天就能 stub 出来"级别接口契约。所有事件类型与 [S1 事件协议](../requirements/backlog.md#s1) 对齐，由文案库 [DC-02](DC-02-scribe-narration-library.md) 负责文案查表。

```ts
// 通用类型
type ScribeStage = "taskFrame" | "opening" | "roundtable" | "inquiry" | "settlement";
type ScribeEvent = {
  stage: ScribeStage;
  key: string;             // DC-02 文案库的键名，如 "draftingCard"
  payload?: Record<string, string | number>; // 文案插值变量
  timestamp: number;       // ms epoch，用于 Trace 时间戳
  trace?: ScribeTrace;     // 同步携带的内部推理细节（不展开则不消费）
};
type ScribeTrace = {
  rawInput?: string;
  derivedFields?: Record<string, unknown>;  // schema key/value，归属 Layer 2
  modelCalls?: Array<{ provider: string; model: string; latencyMs: number }>;
  confidence?: number;
};

// Layer 1
interface ScribeStatusStripProps {
  events$: AsyncIterable<ScribeEvent>;     // SSE/ReadableStream 来源
  position?: "top" | "bottom";              // 默认 bottom
  onTraceClick?: () => void;                // 点击「查看思考过程」回调
  fallbackOnError?: ScribeEvent;            // 流断开时的兜底
}

// Layer 2
interface ScribeTracePanelProps {
  events: ScribeEvent[];                    // 累积事件，倒序展示
  open: boolean;
  onClose: () => void;
  archiveId?: string;                       // 若来自 /archive/[id]，开启只读态
}

// Layer 3
interface ScribeDecisionPaneProps {
  prompt: string;                           // 书记员的"轻声补充"，自然语言
  options: Array<{
    id: string;                             // 内部 key，仅做事件回传
    label: string;                          // 给用户看的纯人话
    subtitle?: string;                      // 可选副标题，禁止暴露 schema key
  }>;
  onSelect: (optionId: string) => void;
  onTraceClick?: () => void;                // 「看书记员怎么想出这些选项」
}
```

> **守则**：三个组件都**不直接持有任何中文字符串**——所有文案通过 [DC-02 SCRIBE_NARRATION 表](DC-02-scribe-narration-library.md) 查表注入。这样改 tone of voice 永远不需要动组件代码。

---

## Layer × Stage 触发矩阵

> 给产品经理与工程师的"哪一层在哪个阶段必须存在"对照表。✅ 必须 / ⚪ 可选 / ❌ 禁止。

| Layer | taskFrame | opening | roundtable | inquiry | settlement | error |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| **L1 状态条** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **L2 Trace 面板** | ✅（可展开） | ✅ | ✅ | ✅ | ✅ | ✅（含 stack） |
| **L3 决策面板** | ✅（议题确认） | ❌ | ❌ | ✅（问题分页） | ✅（落定确认） | ⚪（重试/放弃二选一） |
| **L4 完成回收** | ✅（→ opening） | ✅（→ roundtable） | ✅（每轮归档） | ✅（→ settlement） | ✅（→ archive） | ✅（失败也归档） |

**关键约束**：
- L1 永远在线，**任何 stage 没有 L1 = bug**（呼应 [EXP-01](../experience-log/EXP-01-waiting-state-silence.md)）
- L3 在 `opening` / `roundtable` 阶段**禁止出现**——这两个阶段是五声的舞台，书记员不应打断（呼应 [R1](../requirements/backlog.md#r1)）
- L4 必须包含**失败/缺席事件**的归档（呼应 [EXP-03](../experience-log/EXP-03-multi-agent-absence.md)）

---

## Tailwind 视觉 Token 规范

> 给 UI 工程师的"直接落到 `app/globals.css @theme`"级别规范。色值采用项目既有 `--color-seat-*` 与"克什米尔木色"基调延续，避免新色系污染。

| Token | 用途 | 值（建议） |
| --- | --- | --- |
| `bg-scribe-strip` | L1 状态条背景 | `#f5f1eb`（暖米白）/ dark mode `#1f1c19` |
| `text-scribe-strip` | L1 状态条文案 | `#5a4f44`（克什米尔木深灰）/ dark `#cfc6b9` |
| `bg-scribe-trace` | L2 Trace 面板背景 | `#fbfaf7`（更浅一档）|
| `border-scribe-trace` | L2 边框 | `#e8e1d4`（一像素细线）|
| `bg-scribe-decision` | L3 选择卡背景 | 卡片底用 `#ffffff`，hover `#faf6ee` |
| `ring-scribe-decision-selected` | L3 选中态描边 | 2px `#a8916b` |
| `h-scribe-strip` | L1 高度 | `2.25rem`（36px，单行 + 上下 6px） |
| `gap-scribe-event` | L2 事件间距 | `0.75rem`（12px）|
| `text-scribe-time` | L2 时间戳 | `text-xs text-neutral-400 tabular-nums` |
| `font-scribe` | 全 4 层共用 | 与产品主字一致（不引入新字族） |

**动效**：
- L1 文案切换：`transition-opacity duration-200 ease-out`，**不允许位移动画**（位移会让用户误以为是新元素）
- L2 展开：`transition-[max-height,opacity] duration-300`，从 `max-h-0/opacity-0` 到 `max-h-[60vh]/opacity-100`
- L3 选中：仅描边渐变，**不允许卡片缩放**（缩放暗示"被点击了"，但实际行为是"选定"，语义错配）

> **禁用清单**：emoji 不得作为唯一信息载体（[DC-02 原则 4](DC-02-scribe-narration-library.md)）；不得使用 spinner/进度条（违背"叙事化等待"原则）；不得在 L1 出现任何技术名词（schema/token/embedding 等）。

---

## 业界参考库 → DR-01

> 本 DC 的所有设计决策（四层结构 / 状态条克制 / Trace 默认折叠 / 决策面板 / 不打扰原则）都有截图级 / 交互级的业界证据库支撑。详见 **[DR-01 流式 UI 与 AI 工作台 · 业界参考](../design-references/DR-01-streaming-ui-references.md)**（268 行 · 5 产品截图级调研）。

| DR-01 章节 | 印证 DC-01 哪条原则 |
| --- | --- |
| ChatGPT typing indicator + streaming token | L1 状态条的"叙事化等待"原则 |
| Claude artifact 折叠 | Layer 2 Trace Panel 默认折叠 |
| Cursor agent trace（Composer） | Trace 面板的事件流呈现范式 |
| Linear AI 状态条克制 | L1 文案"永远说人话"约束 + 反工程感 |
| Vercel v0 决策面板 | Layer 3 决策卡片的渐进展开 |
| **跨产品 7 条公理** | DC-01 所有原则均有公理级背书 |
| **6 项行动建议** | DR-01 给出可立即写进 backlog 的具体动作 |

> **DR vs DC 的关系**：DC 给方案，DR 给"为什么这个方案在最强的产品里被验证过"。如果对 DC-01 的某条原则产生怀疑，应先去 DR-01 找对应章节的业界证据，再决定是否调整。
