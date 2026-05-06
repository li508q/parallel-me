# ParallelMe — Skill Description

> Scribe-guided five-voice roundtable for people facing hard life decisions.

## When To Invoke

Invoke ParallelMe when a user expresses a stuck dilemma: “should I…”, “I'm torn between…”, “my mom wants me to…”, “I want to leave but I feel guilty…”. The product is built for moments when a single averaged answer would feel false.

ParallelMe is not therapy, diagnosis, or crisis intervention. Crisis language should trigger immediate human support, not a normal session.

## Session Shape

1. `原始输入`: the user writes one raw concern.
2. `本次议题`: the scribe asks high-density choice questions and proposes a task frame.
3. `五声圆桌`: the fixed five voices give structured opening arguments.
4. `自由圆桌`: the user can continue all voices, continue one voice, ask one voice, ask the table, or select two voices for a duel.
5. `书记员问询`: the scribe validates preference patterns with targeted choice questions.
6. `清明落定`: the scribe produces a clarity sentence, preference readout, tradeoff acknowledgement, posture, and one concrete 24-hour commitment.

## Fixed Five Voices

| ID | Voice | Protects |
|---|---|---|
| `lay` | 躺平的我 | body / rest / low-cost survival |
| `money` | 搞钱的我 | cashflow / resources / optionality |
| `roam` | 出走的我 | freedom / breathing room / exits |
| `filial` | 被牵挂的我 | attachment / belonging / family connection |
| `future` | 5 年后的我 | long view / continuity / compounding choices |

The scribe is not a sixth voice. It organizes, records, compares, asks, and settles.

## Provider

Generation requires a user-supplied provider payload:

```ts
{ baseUrl: string, model: string, apiKey: string }
```

The setup UI includes DeepSeek, 阿里云百炼, Kimi, MiniMax, 豆包 / 火山方舟, and custom compatible endpoints.

## Source

- Repo: https://github.com/li508q/parallel-me
- Voice prompts: `/lib/selves.ts`
- Orchestration prompts: `/lib/llm.ts`
- License: MIT
