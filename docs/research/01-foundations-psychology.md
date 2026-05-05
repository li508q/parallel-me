# 01 · Psychology Grounding

> ParallelMe 借鉴心理学，但不是治疗工具。研究只用于产品转译：让用户更清楚地听见内在声音，并从单一声音的劫持中退后一步。

## Key Translation

| 框架 | 产品转译 |
| --- | --- |
| IFS | 每声必须有“它在保护什么 / 它最怕什么”；NowMe 是 Self 位置，不是第六声。 |
| Voice Dialogue | 目标不是某声胜利，而是发展 aware ego：能听见多个声音但不被某一个绑架。 |
| Schema Therapy Modes | 用“激活模式”解释固定五声为何在本次被触发，不新增声音。 |
| Chairwork | UI 必须像可切换的位置，支持点名追问和换位回答。 |
| ACT | 结尾必须落到价值对齐的 24h committed action。 |
| MI | 追问用开放问题和低阻抗语言，不审判用户。 |
| Narrative Therapy | 将困惑外化为工作焦点，降低“我就是问题”的粘连。 |
| CFT | 高羞耻、高自责内容里优先使用保护性语言。 |

## IFS

核心启发：

- 人的内心不是单一意识，而是一组有保护意图的 parts。
- 每个 part 都在保护用户，即使方式笨拙或极端。
- Self 不是另一个 part，而是用户退后一步后的领导位置。

ParallelMe 落地：

- `lib/selves.ts` 中五声各自有 core value、fear、voice、taboo words。
- 会谈中每声都要说明保护和恐惧。
- NowMe 不参与抢答，只在听完后收束。

参考：

- https://ifs-institute.com/
- https://ifs-institute.com/outline-of-the-Internal-family-systems-model.html

## Voice Dialogue

核心启发：

- 问题不是某个 self 存在，而是用户被某个 self 完全接管。
- 目标是 aware ego：能与多个 selves 建立关系。

ParallelMe 落地：

- 不让“搞钱的我”或“怕妈担心的我”单独成为结论。
- NowMe 必须写出“不再被哪一声单独带走”。
- 用户必须点名追问或换位，不能只看 AI 输出。

参考：

- https://sidrastone.com/
- https://www.delos-inc.com/

## Schema Therapy Modes

核心启发：

- 具体困惑会激活不同 mode，例如逃避者、顺从者、惩罚性父母、受伤小孩、健康成人。
- v0.6 不把 mode 扩展成新声音，而是用它解释固定五声的激活理由。

ParallelMe 落地：

- `/api/voices` 只返回固定五声。
- 激活理由应体现本次模式：关系依恋、资源焦虑、逃离冲动、身体透支、长期视角。

参考：

- https://schematherapysociety.org/
- https://www.schematherapysociety.org/Schema-Therapy/Schema-Questionnaires

## Chairwork

核心启发：

- 把冲突分放到不同椅子上，用户可以换位说话。
- 这要求 UI 像“位置”，不是普通聊天流。

ParallelMe 落地：

- 五声牌可点击。
- 用户可追问某一声。
- 用户可坐到某一声的位置换位回答。

参考：

- https://pmc.ncbi.nlm.nih.gov/articles/PMC12876151/

## ACT

核心启发：

- 清楚不是为了消除所有焦虑，而是为了按价值走一步。
- committed action 必须具体、近期、低门槛。

ParallelMe 落地：

- 清明句后必须有 24h 承诺。
- 承诺不是人生答案，而是今天或明天能做的一步。

参考：

- https://contextualscience.org/act
