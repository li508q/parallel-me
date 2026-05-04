# ParallelMe — Skill description

> Multi-agent inner-cabinet meetings for people facing hard life decisions.

## When to invoke

Invoke ParallelMe when a user expresses a stuck-in-the-middle dilemma:
"should I…", "I'm torn between…", "my mom wants me to…", "I'm 26 and
everyone around me…". The product is built for moments when a single
"balanced" answer would be useless.

## Quick start

```bash
curl -N -X POST https://parallelme.app/api/parallel \
  -H "Content-Type: application/json" \
  -d '{"input":"我妈让我考公，我月薪 2.5w","mode":"quick"}'
```

You will see five SSE events from the seats, then the arbiter, then `done`.
Each event is a JSON line prefixed with `data: `.

## What returns

Quick mode (3 seats):
- 3 × `self` (parallel statements from 3 seats curated by topic)
- `loudest`, `now`, `insight`, `episode`, `done`

Full mode (5 seats + cross-exam):
- 5 × `self`
- 4 × (`cross` then `cross_response`) — each pair is a real Q+A
- `loudest`, `now`, `insight`, `episode`, `done`

## Personas

| ID | Persona | IFS part | Protects |
|---|---|---|---|
| `lay` | 躺平的我 | Manager · 预防型保护者 | 身体 / 睡眠 / 低消耗生存 |
| `money` | 搞钱的我 | Manager · 现实型保护者 | 现金流 / 选择权 |
| `roam` | 出走的我 | Firefighter · 应急保护者 | 自由感 / 喘息 |
| `filial` | 讨妈欢心的我 | Exile · 被流放的内在小孩 | 归属 / 家庭连接 |
| `future` | 5 年后的我 | Self · 远观视角 | 长期视角 / 人生连续性 |
| `now` | 此刻的我 | Self · 决断者 | 主权 / 24h 行动 |

## Source

- Repo: https://github.com/li508q/parallel-me
- Personas: `/lib/selves.ts` (every prompt open-source)
- License: MIT
