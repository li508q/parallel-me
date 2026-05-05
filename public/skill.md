# ParallelMe — Skill Description

> Structured five-voice self-clarification for people facing hard life decisions.

## When To Invoke

Invoke ParallelMe when a user expresses a stuck dilemma: “should I…”, “I'm torn between…”, “my mom wants me to…”, “I want to leave but I feel guilty…”. The product is built for moments when a single averaged answer would feel false.

ParallelMe is not therapy, diagnosis, or crisis intervention. Crisis language should trigger immediate human support, not a normal session.

## Session Shape

1. `陈情`: the user writes the raw concern.
2. `困惑成形`: the system asks a few clarifying questions and proposes a working focus.
3. `五声入席`: the fixed five voices appear with activation reason, protection, and fear.
4. `五声对话`: each voice speaks; the user can ask a named follow-up or sit in a voice's position.
5. `清明落定`: NowMe produces a clarity sentence and one concrete 24-hour commitment.

## Fixed Five Voices

| ID | Voice | Protects |
|---|---|---|
| `lay` | 躺平的我 | body / rest / low-cost survival |
| `money` | 搞钱的我 | cashflow / resources / optionality |
| `roam` | 出走的我 | freedom / breathing room / exits |
| `filial` | 怕妈担心的我 | attachment / belonging / family connection |
| `future` | 5 年后的我 | long view / continuity / compounding choices |

`now` is the user's Self / aware ego position, not a sixth voice.

## Provider

Generation requires a user-supplied provider payload:

```ts
{ baseUrl: string, model: string, apiKey: string }
```

The setup UI includes DeepSeek, 阿里云百炼, Kimi, MiniMax, 豆包 / 火山方舟, and custom compatible endpoints. The default recommendation is DeepSeek `deepseek-chat`.

## Source

- Repo: https://github.com/li508q/parallel-me
- Prompts: `/lib/selves.ts`
- License: MIT
