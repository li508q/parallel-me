# Atomic Requirements Backlog

> 全部原子需求一表，每条独立排期、独立验收。
> **R 系列**：产品体验/UI 类需求 · 来源 [experience-log](../experience-log/)
> **S 系列**：工程改造类需求 · 来源 [design-concepts](../design-concepts/) + [engineering-research](../engineering-research/)

- 严重度：🔴 阻塞性问题 / 🟡 体验问题 / 🟢 优化项
- 状态：`pending` / `in-progress` / `done` / `blocked` / `cancelled`

---

## R 系列 · 圆桌专题（Step 2/3 已完成）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="r1"></a>**R1** | 移除自由圆桌阶段的「书记员整理」按钮 | 🟢 | done | Step 2 | `buildActions()` 在 `stage === "roundtable"` 时不再返回 `id: "scribe"` 这条 action；后端能力保留 |
| <a id="r2"></a>**R2** | 用户在圆桌的发言入库为 turn | 🔴 | done | Step 2 | `submitRoundtableMove` 在调用后端之前先把 `userText` 作为 `trigger === "user_text"` 的本地 turn 推入 `roundtable.turns`；归档数据有这条；UI 能看见 |
| <a id="r3"></a>**R3** | 用户发言在 UI 中显式渲染 | 🔴 | done | Step 2 | 圆桌与归档均显示用户发言（右对齐 italic 引号风格），与 LLM 发言视觉对称 |
| <a id="r4"></a>**R4** | 自由圆桌阶段切换主视图为时间线 | 🟡 | done | Step 3 | `RoundtableBoard` 已拆为开场席位卡 + Chronological Stream；自由圆桌 turns 按 `at` 排序渲染，五声第一轮立论仍保留在时间线顶部 |
| <a id="r5"></a>**R5** | 时间线引入「轮次分隔符」 | 🟡 | done | Step 3 | 每个 move 生成的 turns 通过 `move_id` 聚为一轮，时间线显示 `第 n 轮 · triggerLabel · time` marker |
| <a id="r6"></a>**R6** | 时间线支持引用关系可视化 | 🟢 | done | Step 3 | `refers_to` 渲染为轻量 pill：`回应了 {目标声音}`，并使用对应 voice 色条 |
| <a id="r7"></a>**R7** |「两声对峙」并入时间线 + 专属模板 | 🟡 | done | Step 3 | Duel turn 已作为时间线卡片渲染，左右双色对置、中央 `↔`、底部未解点，多次对峙各自独立呈现 |
| <a id="r8"></a>**R8** | 圆桌操作输入框就近放置 | 🟡 | done | Step 3 | 需要输入的圆桌操作浮层固定在 HostConsole 上方，紧贴底部操作区；不再落在主内容远处 |
| <a id="r9"></a>**R9** | 收敛输入框为单一 Source | 🟢 | done | Step 3 | 圆桌阶段 HostConsole 不渲染独立 textarea；文本输入仅出现在当前激活操作的就近浮层中，采用上下文唤起路线 |
| <a id="r10"></a>**R10** | 移除 `HostConsole` 阶段标签的视觉冗余 | 🟢 | done | Step 3 | `stage === "roundtable"` 时底部 `stageLabel` 隐藏，由时间线自身标题承担阶段识别 |
| <a id="r11"></a>**R11** | 移除通用软约束（端水抑制层 2） | 🟡 | done | Step 4 · [DC-04 P2](../design-concepts/DC-04-confrontational-voice-design.md) | `generateTaskFrame` 与 `generateClaritySettlement` 已移除会压制 voice 的“不诊断/不治疗/不替用户做重大决定”prompt 软约束，并改为“敢于命名处境 / 把代价摆到台面”；README 保留外部产品边界但移除行为压制式 Safety Boundary |
| <a id="r12"></a>**R12** | 圆桌编排器反碰撞改造（端水抑制层 1，**最高 ROI**） | 🔴 | done | Step 4 · [DC-04 prompt 改写示范](../design-concepts/DC-04-confrontational-voice-design.md) | `generateRoundtableMove` 已改为“对抗 ≠ 攻击”区分版；书记员定义为理性支柱/镜子；第二轮起允许互引、打断、沉默；每轮要求至少一次由 voice 发起的明确不同意 |
| <a id="r13"></a>**R13** | 新增 4 个 moveType · `mirror_structure` 优先 | 🟡 | done | Step 4 · [DC-04 M1~M4](../design-concepts/DC-04-confrontational-voice-design.md) | `RoundtableMoveType` / `VoiceTurnTrigger` 已新增 `challenge`、`name_avoidance`、`cut_through`、`mirror_structure`；后端 normalize/fallback、前端操作入口、时间线专属视觉、Trace 写入均已接通 |

## R 系列 · 议题卡专题（Step 5 已完成）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="r14"></a>**R14** | 议题卡 UI 重构 · 4 簇渲染（**视觉根因**） | 🔴 | done | Step 5 · [DC-05 P1+P2](../design-concepts/DC-05-brief-card-design.md) | `TaskFrameReview` 已从 8 字段平铺改为 4 簇：你在问的是 / 你现在的处境 / 你正在被拉扯 / 我们待会儿要聊的；字段英文 key 不进入 UI |
| <a id="r15"></a>**R15** | 议题卡文案语态升级 · 书记员 soul 沉淀（**文案根因**） | 🔴 | done | Step 5 · [DC-05 P4](../design-concepts/DC-05-brief-card-design.md) | 新增 `lib/scribe.ts` 的 `SCRIBE_SOUL` 与 `scribePersonaBlock()`；`generateTaskFrame` / `generateRoundtableMove` / `generateScribeInquiry` / `generateClaritySettlement` 均已注入对应 persona block |
| <a id="r16"></a>**R16** | schema 字段重审 · 8 → 4 | 🟡 | done | Step 5 | 选择 D8b 保守路线：schema 暂不迁移，UI 层按 4 簇组织 8 字段，避免破坏本地 IndexedDB 记录与 v7 合同 |
| <a id="r17"></a>**R17** | 元数据耳语降级（source label 视觉重写） | 🟡 | done | Step 5 · [DC-05 P3](../design-concepts/DC-05-brief-card-design.md) | `source_labels` 不再作为右上角边框 badge，改为每簇末尾极小灰字 `· 读出 / 我猜的 / 你说的` 合并显示 |

## R 系列 · 立论卡专题（Step 2 已完成）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="r18"></a>**R18** | 移除 `overreach_cost` 字段（"只听我的代价" 全链路清理） | 🟡 | done | Step 2 · [DC-04 P1/P2](../design-concepts/DC-04-confrontational-voice-design.md) | Schema / prompt / normalize / fallback / meeting UI / archive UI 已清理；代码中无 `overreach_cost` 直读残留；五声第一轮立论卡仅保留 thesis / protected_value / concern / task_evidence / pull |

### R9 路线选择记录
- **R9a · 单一底部输入栏方案**（IM 主流）：所有用户发言都从底部走；操作面板只保留模式 chip，不再嵌 textarea
- **R9b · 单一就近输入栏方案**：底部 textarea 彻底移除，所有输入都跟随当前激活模式就近出现（Step 3 已采用）

> Step 3 选择 R9b：当前产品更像"列席一场五声会议"，不是一个普通 IM 对话框。后续若要支持流式打断，可再把 R9a 作为移动端或高频打断模式引入。

---

## S 系列 · 工程改造（来源 DC-01 / DC-02 / ER-01）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="s1"></a>**S1** | 制定全局事件协议 `{ stage, key, payload }` | 🟡 | pending | [DC-01](../design-concepts/DC-01-scribe-activity.md) · [DC-02](../design-concepts/DC-02-scribe-narration-library.md) | 协议文档写明枚举的 stage / key 集合；前端 `<ScribeStatusStrip />` 据此查表渲染；覆盖 14 个 API route 的所有阶段 |
| <a id="s2"></a>**S2** | 14 个阻塞式 API route 改造为 SSE / ReadableStream | 🟡 | pending | [EXP-01](../experience-log/EXP-01-waiting-state-silence.md) · [DC-01](../design-concepts/DC-01-scribe-activity.md) | 按高/中/低优先级分批；高优先级（voices/task-frame/roundtable opening/settlement）四条至少完成一条端到端跑通；前端订阅事件流后能看到过程叙事 |
| <a id="s3"></a>**S3** | 沉淀三个核心组件 | 🟡 | pending | [DC-01](../design-concepts/DC-01-scribe-activity.md) | `<ScribeStatusStrip />` / `<ScribeTracePanel />` / `<ScribeDecisionPane />` 三个组件分别建立、可独立 import；至少在一个高优先级 stage 接入 |
| <a id="s4"></a>**S4** | `lib/scribe-narration.ts` 文案库首版 | 🟢 | pending | [DC-02](../design-concepts/DC-02-scribe-narration-library.md) | 文件创建，覆盖五个阶段（task-frame / opening / 追问对峙 / inquiry / settlement）的"读入/进行/完成"三段式微叙事；异常态可后补 |
| <a id="s5"></a>**S5** | `/archive/[id]` 历史 Trace 回看 | 🟢 | pending | [DC-01 Layer 4](../design-concepts/DC-01-scribe-activity.md) | 归档详情页能展示某次会议的 Trace 时间线；缺席事件（如 EXP-03）也在 Trace 里能看到 |
| <a id="s6"></a>**S6** | 排查所有把 schema key 渲染到 UI 的位置 | 🟢 | done | Step 2 | 选择卡不再渲染 `derived_kv` 的英文 key/value；现存 task-frame 字段只以中文 label 呈现，内部 provenance 留在数据层 |
| <a id="s7"></a>**S7** | `roundtable` 单次 LLM 调用改 Slot-based 或 Fan-out | 🔴 | pending | [EXP-03](../experience-log/EXP-03-multi-agent-absence.md) · [ER-01 模式 3](../engineering-research/ER-01-multi-agent-structured-output.md) | 选择 Slot-based Schema（对象 vs 数组）或 Fan-out N 次并发调用之一落地；`continue_all` 必返回 5 条 voice 完整发言 |
| <a id="s8"></a>**S8** | Schema Gate + Repair Loop 实施 | 🟡 | pending | [ER-01 模式 2](../engineering-research/ER-01-multi-agent-structured-output.md) | `lib/llm.ts` 的 normalize 增加业务级校验（数组长度、枚举完整性、必填非空）；失败时通过 Targeted Re-prompt 补齐 |
| <a id="s9"></a>**S9** | 占位卡 + 重试按钮 UI 兜底 | 🟡 | pending | [EXP-03](../experience-log/EXP-03-multi-agent-absence.md) · [ER-01 模式 4](../engineering-research/ER-01-multi-agent-structured-output.md) | 任意一轮缺席时，时间线仍显式画出该 voice 的"沉默"占位 + 单点重试按钮；点击后只重试缺席部分 |
| <a id="s10"></a>**S10** | 移除危机闸门后端链路 | 🟡 | cancelled | Step 4 | 决策：危机闸门与端水无关，保留为极端场景的硬护栏；不纳入当前六步产品精细化 |
| <a id="s11"></a>**S11** | 移除危机闸门前端状态机 | 🟡 | cancelled | Step 4 | 决策：前端 `safety-offramp` 状态机保留，与 R11/R12 的 prompt 软约束改造解耦 |

## S 系列 · 技术栈最新化（Step 1 已完成）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="s12"></a>**S12** | 基础设施现代化 · Node 22 + TypeScript 5.8 + strict | 🟡 | done | Step 1 | Node baseline / TS strict / Node 22 Vercel runtime / package version 0.8.0 已完成；`npm run typecheck` 通过 |
| <a id="s13"></a>**S13** | 框架核心升级 · Next.js 16 + React 19 | 🔴 | done | Step 1 | Next 16.2.6 / React 19.2.6 / React Compiler 顶层配置已完成；`npm run build` 通过 |
| <a id="s14"></a>**S14** | 样式系统切换 · Tailwind 4 + CSS-first theme | 🟡 | done | Step 1 | Tailwind 4.3 / `@tailwindcss/postcss` / `app/globals.css @theme` / 删除 `tailwind.config.ts` 已完成；Chrome 截图 smoke test 通过 |
| <a id="s15"></a>**S15** | 运行与迁移增益 · erasableSyntaxOnly + 容器化 | 🟢 | done | Step 1 | `erasableSyntaxOnly`、React Compiler、Node 22 Docker multi-stage、Next standalone、Compose/Colima 运行验收已完成；Actions API / `<Activity />` 改造将随对应产品阶段按需落地 |

---

## 依赖关系（用于排期）

```
S1 全局事件协议 ─┬─→ S2 SSE 改造 ─┬─→ S3 三组件 ─┬─→ S4 文案库（独立可先做）
                 │                  │              │
                 │                  │              └─→ S5 Trace 回看
                 ↓                  ↓
              R4 时间线（Step 3 已完成）← R5 轮次分隔符 ─ R6 引用可视化 ─ R7 对峙模板
                 ↑
              R2 用户发言入库 ── R3 UI 渲染（最小独立改动，可先做）

R1 移除按钮（Step 2 已完成）
R8 输入框就近放置 ─┬─→ R9 输入框单一收敛（Step 3 已完成）
                    └─→ R10 stageLabel 清理（Step 3 已完成）

S6 schema 排查（独立）
S7 Slot/Fan-out ─┬─→ S8 Schema Gate
                  └─→ S9 占位卡 UI

R12 圆桌编排器反碰撞改造（端水问题最高 ROI · 独立）─→ R13 新增对抗 moveType（依赖 R12 的 prompt 改造）
R11 移除通用软约束（端水抑制层 2 · 独立）
S10/S11 危机闸门移除已取消：保留硬护栏，端水问题只改软约束与圆桌编排。

R15 书记员 soul 沉淀（lib/scribe.ts，独立基建） ─┬─→ R14 议题卡 UI 重构（依赖 R15 的人话句 value）
                                                    │
R16 schema 重审（blocked，等 D8）  ──不阻塞──┘    └─→ R17 元数据耳语降级（独立可先做）
（D8b 路线下 R16 退化为空操作，R14 直接基于现 schema 做分组）

R18 overreach_cost 全链路清理（Step 2 已完成）
   └─ 4 类必做 + D13/D14/D15/D16 拍板后追加 1 类

S16 Agent 运行时（Vercel AI SDK 6 · 依赖 S13 框架升级）
   └─→ S17 全链路 Streaming UI（依赖 S16）
        ├─→ R19 书记员 defining Agent Loop（依赖 S16）
        ├─→ R20 书记员 inquiry Agent Loop（依赖 S16）
        └─→ R21 圆桌 Voice 自主插入 + 书记员自主 mirror（依赖 S16 + R12 + R13）
```

---

## 推荐起步路径（最小风险 + 最快价值）

> **Step 1 技术基座已完成**：后续产品需求默认写在 Next 16 / React 19 / Tailwind 4 / TypeScript strict / Node 22 container runtime 上。

第一波 · 最小体感（独立、可立即验收）：

1. **[R1](#r1)**（删一行 action，5 分钟）
2. **[R2](#r2) + [R3](#r3)**（一处入库 + 一处 UI 渲染，最小改动让"我说的话"立刻可见）
3. **[S6](#s6)**（全局排查，可与 R1/R2 并行做）

第二波做架构性改造：

4. **R4 + R5 + R6 + R7 + R8 + R9 + R10**（时间线与输入结构）— Step 3 已完成
5. **S7**（Slot-based 改造，解决 EXP-03 缺席问题）

第三波做体验全局升级：

6. **S1 + S2 + S3 + S4**（书记员工作台真正落地）

第四波 · 端水问题专题：

7. **R11 + R12 + R13**（端水软约束 / 编排器反碰撞 / 4 个对抗 moveType）— Step 4 已完成
8. **S10 + S11**（危机闸门移除）— Step 4 已取消，硬护栏保留

第五波 · 议题卡专题：

13. **R14 + R15 + R16 + R17**（议题卡 4 簇、书记员人格、D8b 保守 schema、元数据耳语）— Step 5 已完成

第六波 · 立论卡专题（Step 2 已完成）：

17. **[R18](#r18)**（"只听我的代价" 全链路移除）— Step 2 已完成。

## R 系列 · Agent Loop 化专题（来源 EXP-08 + DC-06）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="r19"></a>**R19** | 书记员 defining Agent Loop 化 | 🔴 | pending · 依赖 S16 | [EXP-08 § 2.1](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md) · [DC-06 § 2.1](../design-concepts/DC-06-agent-loop-design.md) | (1) `lib/agents/scribe-defining.ts` 定义 `ToolLoopAgent`，包含 `analyzeInput` + `askUser`（选择卡）+ `generateTaskFrame` 三个 tool；(2) Agent 自主评估"信息充分度"——复杂议题至少 1 次追问后才生成 taskFrame；(3) prompt 不再硬编码 `choiceCards 2-4 张`；(4) 前端 `app/meeting/page.tsx` defining 阶段改用 `useAgentStream` hook 渲染——token-by-token stream + tool call 可视化；(5) 用户可随时点"够了"中断循环，Agent 用已有信息生成当前最佳 taskFrame；(6) `maxSteps: 10` 安全上限；(7) 跑 3 次复杂议题，书记员至少 1 次自主追问 |
| <a id="r20"></a>**R20** | 书记员 inquiry Agent Loop 化 | 🟡 | pending · 依赖 S16 | [EXP-08 § 2.2](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md) · [DC-06 § 2.2](../design-concepts/DC-06-agent-loop-design.md) | (1) `lib/agents/scribe-inquiry.ts` 定义 `ToolLoopAgent`，包含 `analyzeRoundtable` + `askUser`（验证问题）+ `generateProfile` 三个 tool；(2) 书记员在用户回答后自主判断"是否发现新矛盾"——有则追问，无则结束；(3) 前端 inquiry 阶段改用 `useAgentStream`；(4) `maxSteps: 5` 安全上限；(5) 跑 3 次，至少 1 次自主追问 |
| <a id="r21"></a>**R21** | 圆桌 Voice 自主插入 + 书记员自主 mirror_structure | 🟡 | pending · 依赖 S16 + [R12](#r12) + [R13](#r13) | [EXP-08 § 2.4](../experience-log/EXP-08-fixed-call-count-limits-agent-depth.md) · [DC-06 § 2.4](../design-concepts/DC-06-agent-loop-design.md) · [DC-04 P3](../design-concepts/DC-04-confrontational-voice-design.md) | (1) 每次用户操作或 voice 发言后，`RoundtableAgent` 自主评估"是否有 voice 需要自主插入反驳 / 书记员需要自主 mirror"；(2) Voice 自主插入时有视觉提示（"Money 忍不住了——"）；(3) 书记员自主 mirror 时用 DC-04 M4 专属视觉；(4) 用户可关闭"Voice 自主发言"（尊重 autonomy，[PR-03](../psychology-references/PR-03-anti-sycophancy-autonomy.md)）；(5) 跑 3 次，至少 1 次 voice 自主插入 |

## S 系列 · Agent 运行时 + Streaming UI（来源 DC-06）

| ID | 标题 | 严重度 | 状态 | 来源 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| <a id="s16"></a>**S16** | Agent 运行时引入 · Vercel AI SDK 6 ToolLoopAgent | 🔴 | pending · 依赖 S13 | [DC-06 § 4.1](../design-concepts/DC-06-agent-loop-design.md) · [DR-06 § 1](../design-references/DR-06-agent-loop-streaming-references.md) | (1) `npm install ai@^6`（Vercel AI SDK 6）；(2) 创建 `lib/agents/` 目录 + 基础 Agent 抽象；(3) 至少 1 个 Agent（如 `scribe-defining`）可以跑通 `ToolLoopAgent.streamText` 端到端；(4) tool call 的 Human-in-the-loop 暂停/恢复机制跑通（用户回答选择卡 = tool call result）；(5) `app/api/task-frame/route.ts` 改为 streaming endpoint（`ReadableStream`）；(6) 前端 `useAgentStream` hook 可以渲染 token stream + tool call 卡片 |
| <a id="s17"></a>**S17** | 全链路 Streaming UI 改造 · useAgentStream hook | 🟡 | pending · 依赖 S16 | [DC-06 § 4.2](../design-concepts/DC-06-agent-loop-design.md) · [DR-06 § 4~5](../design-references/DR-06-agent-loop-streaming-references.md) | (1) `components/AgentStreamView.tsx` 通用组件：token streaming + thinking 气泡（可展开）+ tool call 卡片（可折叠）+ 中断按钮；(2) 4 个核心 API route（task-frame / roundtable / scribe-inquiry / settlement）全部改为 streaming endpoint；(3) `app/meeting/page.tsx` 的 5 个 stage 全部从 `postJson` 一次性返回改为 `useAgentStream` 逐步渲染；(4) 所有 LLM 输出都是 token-by-token stream，无一次性整块渲染；(5) DC-01 Layer 1 ScribeStatusStrip 适配 Agent 步骤叙事（"正在分析…(step 1/3)"） |

---

## 排期总览（一图看完全部 21+17 项）

```
第一波 · 最小体感           ─ R1 / R2+R3 / S6（并行）
                                                            ↓
第二波 · 架构基础           ─ R4+R5（时间线）/ S7（Slot-based）
                                                            ↓
第三波 · 书记员工作台       ─ S1+S2+S3+S4（事件协议 + SSE + 三组件 + 文案库）
                                                            ↓
第四波 · 端水问题专题       ─ R12 → R13 P0 → R11 → R13 P1 → R13 P2 → S10+S11(blocked)
                                                            ↓
第五波 · 议题卡专题         ─ R15 → R17(并行) → R14 → R16(blocked)
                                                            ↓
第六波 · 立论卡专题         ─ R18（单独半天）
                                                            ↓
第七波 · Agent Loop 化      ─ S16（Agent 运行时）→ S17（全链路 streaming UI）
  （依赖 S13 已完成的框架基座）      ↓
                           R19（defining loop）/ R20（inquiry loop）/ R21（voice 自主插入）
```
