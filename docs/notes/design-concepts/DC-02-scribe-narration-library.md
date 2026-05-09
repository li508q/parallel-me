# DC-02 ·「书记员状态条」叙事文案库

- 性质：[DC-01](DC-01-scribe-activity.md) Layer 1 状态条的文案物料库
- 落地形式：TS 常量文件（建议路径 `lib/scribe-narration.ts`）
- 关联需求：[S4 文案库首版](../requirements/backlog.md#s4)
- 关联心理学：[PR-02 书记员人格](../psychology-references/PR-02-witness-and-containing-presence.md)（"主语永远是书记员"= Bion alpha function 的产品化）· [PR-03 反端水文案约束](../psychology-references/PR-03-anti-sycophancy-autonomy.md)（"清明落定"段落禁用"建议/你应该"措辞 = SDT autonomy support 的硬执行）

---

## 设计原则

1. **三段式微叙事** — 每段文案分三种语态：`正在做`（进行时） / `已经做完`（结果） / `下一步`（衔接）。无论卡在哪一步，状态条都不会"失语"
2. **永远主语是书记员，不是系统** — "正在分析数据" ❌ → "正在读你的话" ✅。让用户感觉是"一个人"在做，不是"一台机器"在跑
3. **节奏感优先于精确性** — 更新频率控制在 **1.5 ~ 3 秒一条**，不是流式吐字。书记员人格是"沉稳的"
4. **无 emoji 备份方案** — 每条文案都要有不带 emoji 的版本，避免后续设计风格调整返工。emoji 只是轻装饰，不承担信息
5. **失败语态也要写好** — 网络错误、模型超时、安全闸门触发，每种异常都有对应的"书记员人话"，绝不暴露 stack trace

---

## 文案库结构（按阶段组织）

### 通用态（贯穿全程）
```
启动        · 书记员正在落座…
连接中      · 正在和你的钥匙打招呼…
失败重试    · 这一句没听清，让书记员再试一次…
被打断      · 已经记下你说到这里。
```

### 阶段 1 · 议题整理（task-frame）
```
读入        · 书记员在读你的话…
张力识别    · 正在听其中的几股力。
张力识别完  · 听到了 {n} 股力，正在为它们找位置。
起草选择卡  · 正在起草第 {i} 张选择卡…
完成        · 三张选择卡准备好了，请你看一眼。
```

### 阶段 2 · 五声开场（roundtable opening）
```
落座        · 五位正在依次入席…
{X} 发言    · 「{角色名}」正在开口…
轮换        · 「{角色名}」收声，「{下一位}」接过来…
完成        · 第一轮立论已经写在桌上。
```

### 阶段 3 · 圆桌追问 / 对峙
```
追问起草    · 主持人正在想下一个问题…
对峙挑选    · 正在挑出最尖锐的两声…
对峙进行    · 「{X}」和「{Y}」开始正面交锋…
```

### 阶段 4 · 书记员问询（scribe-inquiry）
```
回看        · 书记员在回看刚才的圆桌…
问询起草    · 正在挑出还没说清楚的那几处…
完成        · 写好了 {n} 个问题，请你慢慢答。
```

### 阶段 5 · 清明落定（settlement）
```
凝句        · 书记员在试着写清明句…
凝句中改    · 第 {i} 稿不太对，再改一次…
承诺起草    · 正在为你写出今天能做的那一小步…
完成        · 落定了。请你看一眼是不是这个意思。
```

### 异常态
```
模型慢      · 这次有点慢，书记员还在等回音…
网络断      · 和外面断了线，正在重新接通…
钥匙过期    · 钥匙好像不认了，需要你回头看看…
安全闸门    · 这里有点重。书记员先停一下，等你愿意再走。
```

> **注**：最后一条对应产品的 `safety-offramp` 机制——这是用户**情绪可能正在崩盘的时刻**，状态条这一刻的措辞直接决定产品的温度，措辞要格外谨慎。

---

## 工程落地形式

文案库本身是一个 TS 常量文件（建议路径 `lib/scribe-narration.ts`），导出形如：

```ts
export const SCRIBE_NARRATION = {
  taskFrame: {
    reading: "书记员在读你的话…",
    extractingTension: "正在听其中的几股力。",
    extractedTension: (n: number) => `听到了 ${n} 股力，正在为它们找位置。`,
    draftingCard: (i: number) => `正在起草第 ${i} 张选择卡…`,
    done: "三张选择卡准备好了，请你看一眼。",
  },
  // ... 其他阶段
};
```

后端每完成一个推理子步骤，通过 SSE 发一个结构化事件：

```ts
event: { stage: "taskFrame", key: "draftingCard", payload: { i: 2 } }
```

前端 `<ScribeStatusStrip />` 订阅事件流，**查表渲染对应文案**。这样：

- **文案集中可维护** — 后续改 tone of voice 只动一个文件
- **后端不写中文文案** — 只发结构化事件，避免 prompt / 代码里到处散落字符串
- **i18n 友好** — 未来要做英文版只换文案表
- **A/B 测试友好** — 想试试不同语气直接换表

事件协议本身另见：[S1 全局事件协议](../requirements/backlog.md#s1)

---

## 文案变量命名约定

> 所有 `payload` 中的插值变量必须遵循下表。**禁止临时起意造新变量名**——任何新场景如需新变量，先在本表登记，避免不同 stage 用 `n`/`count`/`total` 三种叫法指同一个东西。

| 变量名 | 类型 | 含义 | 出现位置 | 示例值 |
| --- | --- | --- | --- | --- |
| `{n}` | `number` | "数量" 通用计数 | extractedTension / 完成态 | `2` `3` |
| `{i}` | `number` | "第几个" 序号（1-based） | draftingCard / 凝句中改 | `1` `2` `3` |
| `{角色名}` | `string` | voice 的中文显示名（不是 voice_id） | 五声开场全段 | `远行人` `安稳者` |
| `{X}` `{Y}` | `string` | 两声对峙时的角色名占位 | 阶段 3 对峙进行 | `远行人` / `安稳者` |
| `{下一位}` | `string` | 轮换语境下的下一个角色名 | 阶段 2 轮换 | `务实派` |
| `{seconds}` | `number` | 等待已经持续的秒数（仅异常态） | 模型慢 / 网络断 | `8` `15` |

**约束**：
- voice_id（`lay`/`future`/`money` 等）**禁止**出现在文案 payload 里——它是技术 ID，文案永远使用中文显示名
- 数字变量永远用阿拉伯数字（`3`），不用中文（`三`）
- 不允许在文案 token 内嵌套表达式（如 `{n + 1}`）——计算放在调用方完成

---

## 完整 TS 类型签名

> 给前端工程师的"复制粘贴就能用"级别契约。文案表的形状必须是**强类型**的，避免后端发了一个不存在的 key 而前端默默渲染空字符串。

```ts
// 文案条目：纯字符串 或 含变量的函数
type NarrationText = string | ((payload: Record<string, string | number>) => string);

// 单个 stage 的文案集合
type NarrationStage = Record<string, NarrationText>;

// 全表
export interface ScribeNarration {
  common: NarrationStage;        // 通用态
  taskFrame: NarrationStage;     // 阶段 1
  opening: NarrationStage;       // 阶段 2
  roundtable: NarrationStage;    // 阶段 3
  inquiry: NarrationStage;       // 阶段 4
  settlement: NarrationStage;    // 阶段 5
  error: NarrationStage;         // 异常态
}

export const SCRIBE_NARRATION: ScribeNarration = {
  common: {
    booting: "书记员正在落座…",
    connecting: "正在和你的钥匙打招呼…",
    retrying: "这一句没听清，让书记员再试一次…",
    interrupted: "已经记下你说到这里。",
  },
  taskFrame: {
    reading: "书记员在读你的话…",
    extractingTension: "正在听其中的几股力。",
    extractedTension: ({ n }) => `听到了 ${n} 股力，正在为它们找位置。`,
    draftingCard: ({ i }) => `正在起草第 ${i} 张选择卡…`,
    done: "三张选择卡准备好了，请你看一眼。",
  },
  // ... 其他 stage 完全对应文案库章节
};

// 查表函数：保证类型安全 + 缺 key 时降级
export function narrate(
  stage: keyof ScribeNarration,
  key: string,
  payload?: Record<string, string | number>
): string {
  const entry = SCRIBE_NARRATION[stage]?.[key];
  if (!entry) return SCRIBE_NARRATION.common.booting; // 兜底：永不空白
  return typeof entry === "function" ? entry(payload ?? {}) : entry;
}
```

> **类型守则**：`SCRIBE_NARRATION` 的 key 集合应通过 `as const` 推导出 union type 给后端共享，让"后端发的 key 必须存在于文案表"成为编译期约束（参见 [S1 事件协议](../requirements/backlog.md#s1)）。

---

## 状态机切换规则

> 文案库本身只是"物料仓库"，**什么时候切到哪一句**由状态机决定。下表给出每个 stage 内部的合法切换路径——避免出现"还在 reading 就跳 done"的非法跃迁。

```
taskFrame:
  reading ──(SSE: extracting_started)──> extractingTension
  extractingTension ──(SSE: tension_count, payload.n)──> extractedTension
  extractedTension ──(SSE: card_drafting, payload.i)──> draftingCard
  draftingCard ──(SSE: card_drafting, i+1)──> draftingCard  // 自循环
  draftingCard ──(SSE: all_done)──> done

opening:
  seating ──(SSE: voice_speaking, X)──> voiceSpeaking
  voiceSpeaking ──(SSE: voice_finished, X)──> voiceRotating
  voiceRotating ──(SSE: voice_speaking, Y)──> voiceSpeaking  // 自循环
  voiceRotating ──(SSE: round_done)──> done

roundtable: （无固定终态，由用户操作驱动）
  inquiryDrafting ⇄ duelPicking ⇄ duelOngoing
```

**全局规则**：
- **任何 stage 都可被 `error.*` 抢占**，恢复后回到被抢占前的最后一个文案
- **降级策略**：如果连续 5 秒没有新事件，自动切到 `common.retrying`，避免文案"卡住不动"造成假死感（呼应 [DC-01 原则 1 永远说人话](DC-01-scribe-activity.md)）
- **节流**：同一文案 key 在 1.5 秒内重复触发，**不重新渲染**（避免视觉抖动；呼应本文档原则 3 节奏感优先）

---

## 业界参考库 → DR-02

> 本 DC 的所有 voice/tone 决策（书记员人格句、五个 stage 文案、异常态语气、节奏感）都有截图级 / 文案原话级的业界证据库支撑。详见 **[DR-02 AI 叙事文案与语态 · 业界参考](../design-references/DR-02-narration-tone-references.md)**（271 行 · 5 产品截图级调研）。

| DR-02 章节 | 印证 DC-02 哪条原则 |
| --- | --- |
| Linear changelog · 极致克制的产品语态 | 原则 1 永远说人话 + 原则 4 反营销腔 |
| Stripe Docs · 中性温度基准 | 异常态文案"无情绪词"约束 |
| Apple HIG · Writing voice/tone 方法论 | voice/tone 二分方法论的业界官方背书 |
| Notion AI · "Ask AI" 状态文案人格化 | 书记员"主语永远不是系统"原则 |
| Granola · 黑字 / 灰字 + "Jot a few notes…" 占位 | 占位文案轻量动词 + AI 不抢主 |
| **跨产品 7 条公理** | 7 条公理（人格容器 / voice 不变 tone 变 / 反营销腔等）全部对齐 DC-02 |
| **8 项行动建议** | 含中文版禁词表、动词词典、placeholder 规范等可直接落地的动作 |

> **强校准信号**：DC-02 当前的"5 stage × N tone" 矩阵 + voice 人格化主语 + 异常态克制 全部在 DR-02 的 5 个产品中找到对应实证，方向正确。
