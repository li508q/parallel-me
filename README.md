<p align="center">
  <strong>ParallelMe / 平行的我</strong>
</p>

<p align="center">
  A local-first, five-voice self-clarification workspace.
</p>

<p align="center">
  <a href="./LICENSE">MIT License</a>
  ·
  <a href="./docs/design/V0.7-UPGRADE-PLAN.md">v0.7 Design Plan</a>
  ·
  <a href="./docs/research/README.md">Research Notes</a>
</p>

---

ParallelMe 是一个结构化多声部自我澄清工具。

它不是让某个声音赢，也不是让 AI 替用户做决定，而是帮助用户把一团混乱议题摊开，在固定五声的圆桌里看见自己的价值倾向，最后落成一句清明句和一个 24h 可执行承诺。

## Product North Star

v0.7 的方向是从“流程化五声会谈”转向“书记员牵引的五声圆桌”。

```text
原始输入
→ 书记员整理本次议题
→ 用户确认本次议题
→ 五声圆桌
→ 书记员问询并刻画偏好
→ 清明落定
```

完整设计计划见 [docs/design/V0.7-UPGRADE-PLAN.md](./docs/design/V0.7-UPGRADE-PLAN.md)。

## Core Objects

| Object | Role |
| --- | --- |
| 本次议题 | 书记员把原始输入整理成可确认、可讨论的问题框架。 |
| 固定五声 | 五种稳定价值位置：躺平的我、搞钱的我、出走的我、被牵挂的我、5 年后的我。 |
| 五声圆桌 | 五声先立论，再由用户推动续轮、提问、对峙和补充。 |
| 书记员 | 半显性的结构层，负责整理、记录、比较、问询和落定。 |
| 清明落定 | 清明句、偏好读数、代价承认、此刻落点和 24h 承诺。 |

## Design Commitments

- 固定五声，不新增声音、不引入角色市场、不做声音升格。
- 不使用“入席”“声浪最大/最小”等旧流程概念。
- 用户只必须写一次原始输入，后续尽量通过选择、提问、对峙、补一句和原地改写推进。
- 五声第一轮是结构化立论，后续进入自由圆桌。
- 书记员不是第六声，不站队、不诊断、不替用户决定。
- 清明句从用户在圆桌中的选择和问询回答里长出来。

## Psychological Grounding

ParallelMe 借鉴心理学，但不是治疗、诊断或危机干预工具。

| Source | Product Translation |
| --- | --- |
| IFS | 每个声音都有保护意图，没有“坏声音”。 |
| Voice Dialogue | 用户不被单一声音接管，而是在多个位置之间形成觉察。 |
| Chairwork | 把内在冲突外化到可见位置，允许对话与对峙。 |
| Motivational Interviewing | 书记员使用反映、总结和自主支持。 |
| ACT | 最后落到价值澄清和 committed action。 |

研究索引见 [docs/research/README.md](./docs/research/README.md)。

## Repository Map

```text
app/
  page.tsx                 # 我的声音工作台
  meeting/page.tsx         # 当前会谈体验
  voices/                  # 我的声音概览与详情
  archive/[id]/page.tsx    # 本地纸页详情
  setup/page.tsx           # 本地 provider 配置
  api/                     # LLM 编排与工具端点

components/
  DocketPaper.tsx          # 纸面容器
  HostConsole.tsx          # 底部操作台
  MeetingTimeline.tsx      # 会谈记录
  SeatDock.tsx             # 五声轨

lib/
  db.ts                    # IndexedDB 本地记录
  llm.ts                   # provider-aware LLM 编排
  provider.ts              # local-first API key 配置
  selves.ts                # 固定五声定义
  voices.ts                # 我的声音派生统计

docs/
  design/V0.7-UPGRADE-PLAN.md
  research/
```

## Local Development

```bash
npm install
npm run dev
```

首次使用需要在 `/setup` 配置真实模型。API Key 只保存在当前浏览器或当前会话中，服务端不持久化。

## Safety Boundary

- 不诊断，不治疗承诺，不医学化命名用户。
- 不替用户做重大决定。
- 不鼓励自伤、断联、冲动辞职或重大财务行为。
- 危机表达触发安全提示和真人资源，不继续普通会谈。
- 用户内容默认本地优先。

## License

[MIT](./LICENSE)
