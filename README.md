# ParallelMe / 平行的我

> 你内心的多个声音，第一次被允许同时讲话。

ParallelMe 是一个结构化多声部自我澄清工具。它不是让某个声音赢，也不是让 AI 给出建议，而是帮助你在重要困惑里听见五种内在保护逻辑，最后由 NowMe 收束成一句「清明句」和一个 24h 可执行承诺。

当前 v0.5 的核心体验叫「五声会谈」，长期空间叫「我的声音」，核心机制叫「五声」。

v0.6 的产品规划见 [docs/design/PRODUCT-DESIGN.md](./docs/design/PRODUCT-DESIGN.md)，调研证据链见 [docs/research/README.md](./docs/research/README.md)。后续方向只保留两条主线：用户真实介入流程、固定五声长期演化。

## 当前阶段基线

这一轮阶段性收口后的产品边界：

- 主体验只有「五声会谈」，不再提供旧的模式选择或本地预设生成。
- 首次使用必须经 `/setup` 接入真实模型；默认推荐 DeepSeek，同时支持百炼、Kimi、MiniMax、豆包和自定义兼容接口。
- 旧档案自然切断：会谈记录使用 `ParallelMeV4`，API 配置使用 `parallelme:v4:*`。
- 项目文档只保留两组：`docs/design` 放产品、交互、视觉和技术设计；`docs/research` 放能继续指导产品判断的研究依据。
- v0.6 只推进两条骨架：用户能真正介入流程，固定五声能长期演化。

## 产品方向

- 品牌：`ParallelMe / 平行的我`
- 长期空间：`我的声音`
- 单次体验：`五声会谈`
- 常任五声：躺平的我、搞钱的我、出走的我、怕妈担心的我、5 年后的我
- 收束位置：NowMe，它是 Self 领导位置，不是第六个声音
- 产物：工作焦点、五声表达、互问澄清、清明句、24h 承诺、用户同意后的本地纸页

## 心理学基础与产品转译

| 框架 | 核心产品转译 |
| --- | --- |
| IFS | 每个声音必须说明「它在保护什么 / 它最怕什么」；NowMe 是 Self 领导位置，不参与抢答。参考 [IFS Institute](https://ifs-institute.com/outline-of-the-Internal-family-systems-model.html)。 |
| Voice Dialogue | 目标不是让某个声音胜出，而是让用户发展能听见 primary selves 与被压住声音的 aware ego。参考 [Voice Dialogue International](https://sidrastone.com/)。 |
| Schema Therapy Modes | 五声入席前识别当前激活模式；v0.6 前不新增声音，只用它解释固定五声为何被触发。参考 [ISST](https://www.schematherapysociety.org/Schema-Therapy/Schema-Questionnaires)。 |
| Chairwork | UI 以声音牌和换位回答为中心，让用户能「坐到某一声的位置」纠正或补充。参考 [Chairwork review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12876151/)。 |
| ACT | 结尾不是建议清单，而是价值对齐、24h 内可执行的 committed action。参考 [ACBS ACT](https://contextualscience.org/act)。 |
| MI | 追问尽量采用开放问题、反映式倾听和低阻抗语言。 |
| Narrative Therapy | 将困惑外化为可以被观看和重述的「工作焦点」，降低自我等同。 |
| CFT | 在高羞耻、高自责内容里优先使用温和、保护性语言，避免审判和攻击。 |

ParallelMe 不提供治疗、诊断、危机干预或疗效承诺。它是自我澄清与反思工具。

## Experience Flow

### 1. 困惑成形

用户先写下「陈情」：那件让自己睡不着、卡住、反复想的事。

系统进行 2-4 轮轻量追问，重点包括事实边界、关系位置、最怕失去什么、哪个声音最响。之后生成「工作焦点」：本次先聊清楚什么。用户必须确认或改写，才能进入五声。

### 2. 五声入席

系统基于陈情、追问回答和工作焦点识别当前激活模式。

固定五声都会出现。每个声音展示：

- 本次为什么被激活
- 它在保护什么
- 它最怕什么

v0.6 前不新增声音，所有会谈先围绕固定五声做深。

### 3. 五声对话

五声依次表态，每声回答：

- 我想保护什么
- 我怕什么
- 我希望你别忽略什么

随后用户必须点名追问一声，也可以换位回答：坐到某一声的位置，替它说得更准。之后进入五声互问，重点是暴露代价、盲点和被忽略的保护意图，而不是制造对抗。

### 4. 清明落定

系统生成「清明句」：

> 我现在看清楚的是……

用户可以改写。NowMe 随后说明：我听见了哪些声音、我不再被哪一声单独带走、我选择朝哪个价值行动。

最后写下一个具体、低门槛、今天或明天能做的 24h 承诺。纸页只有在用户同意后写入本地。

## 数据策略

v0.5 使用新的 IndexedDB 库名 `ParallelMeV4`，不读取旧记录，不迁移旧结构。

新记录字段包括：

- `petition`
- `clarifyingAnswers`
- `workingFocus`
- `activatedVoices`
- `voiceTurns`
- `calledVoice`
- `followups`
- `roleReversalTurns`
- `crossClarifications`
- `claritySentence`
- `nowMe`
- `commitment24h`
- `memoryConsent`

## API

新体验拆成四个主端点：

- `POST /api/focus`：追问与工作焦点生成
- `POST /api/voices`：激活模式识别与五声表态
- `POST /api/clarify`：点名追问、换位回应、五声互问
- `POST /api/nowme`：清明句、NowMe、24h 承诺草案

连接测试、品味画像和分享卡仍保留：

- `POST /api/provider/test`
- `POST /api/taste`
- `POST /api/share`
- `GET /api/agent`

## 本地运行

```bash
npm install
npm run dev
```

首次使用需要在 `/setup` 配置真实模型。默认推荐 DeepSeek `deepseek-chat`，并内置百炼、Kimi、MiniMax、豆包和自定义兼容接口；长期部署可把 DeepSeek model 手动改为 `deepseek-v4-flash`。密钥只保存在当前浏览器或当前会话中，服务端不持久化。

## 安全边界

- 本地优先：纸页、画像、品味和记忆同意保存在浏览器本地。
- 用户可清空：`我的声音` 和 `底片` 页面提供本地清理入口。
- 危机 off-ramp：当输入包含明确自伤、自杀或伤害他人的表达时，应用提示寻求即时真人帮助，不继续普通会谈。
- 非替代专业帮助：README、产品文案与接口元数据均声明它不是治疗、诊断或危机干预。
- 数字心理健康评估参考：NICE Evidence Standards Framework 与 APA App Evaluation Model 相关研究。参考 [NICE ESF](https://www.nice.org.uk/corporate/ecd7)、[APA App Evaluation Model study](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2022.1003181/full)。

## Test Plan

- 首页没有旧会谈模式选择，主按钮为「开始五声会谈 →」。
- 用户必须先完成陈情、追问和工作焦点确认，不能直接进入五声。
- 五声都有激活理由、保护对象、恐惧。
- 用户能点名追问，也能换位回答。
- 五声互问能暴露代价和盲点，语气不审判、不攻击。
- 清明句可生成、可改写，并成为纸页主标题。
- 24h 承诺必须具体可执行。
- 危机表达触发安全提示和专业资源，不继续普通会谈。
- `npm run build` 通过。

## 当前技术结构

```text
app/
  page.tsx                 # 我的声音工作台
  meeting/page.tsx         # 五声会谈主体验
  voices/page.tsx          # 我的声音概览
  archive/[id]/page.tsx    # 单次纸页详情
  me/                      # 画像、品味、记录、自照
  api/
    focus/
    voices/
    clarify/
    nowme/
components/
  DocketPaper.tsx
  StageRail.tsx
  SeatDock.tsx
  SeatNameplate.tsx
  MemoryConsentGate.tsx
  SignatureSlip.tsx
lib/
  db.ts                    # ParallelMeV4 schema
  llm.ts                   # provider-aware LLM orchestration
  voices.ts                # 我的声音派生统计
  selves.ts                # 常任五声定义
```
