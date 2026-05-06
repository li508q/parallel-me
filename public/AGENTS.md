# AGENTS.md

> Public API documentation for AI agents that want to integrate with ParallelMe.

## What ParallelMe Is

ParallelMe is a local-first, scribe-guided five-voice roundtable for life-sized dilemmas. It is not a chatbot, therapy, diagnosis, or crisis intervention. The user gives one raw input, the scribe turns it into a clear task frame, five fixed inner voices discuss it, the scribe validates preference patterns, and the session ends with a clarity sentence plus a 24-hour commitment.

## Core Objects

- `raw_input`: the user's original concern.
- `choice_cards`: high-density multiple-choice cards used to clarify the issue.
- `task_frame`: the confirmed issue frame, with visible fields and internal evidence status.
- `roundtable`: fixed five-voice opening turns plus free roundtable moves.
- `scribe_trace`: structured record of user actions such as continuing a voice, asking the table, or selecting a duel.
- `inquiry_questions`: scribe questions that validate user preference patterns.
- `preference_profile`: natural-language leaning, resistance, tradeoff, and unresolved-tension records.
- `clarity`: clarity sentence, preference readout, tradeoff acknowledgement, posture, and 24-hour commitment.

## Fixed Five Voices

| ID | Voice | Protects |
|---|---|---|
| `lay` | 躺平的我 | body, rest, lower-cost survival |
| `money` | 搞钱的我 | cashflow, resources, options |
| `roam` | 出走的我 | freedom, breathing room, exits |
| `filial` | 被牵挂的我 | attachment, belonging, family connection |
| `future` | 5 年后的我 | long view, continuity, compounding choices |

There is no sixth voice. The scribe organizes evidence and language, but does not take a value position.

## Provider Requirement

Generation endpoints require a user-supplied provider payload:

```ts
{ baseUrl: string, model: string, apiKey: string }
```

The client setup flow includes DeepSeek, 阿里云百炼, Kimi, MiniMax, 豆包 / 火山方舟, and a custom compatible endpoint. API keys are stored only in the user's browser or current session.

## Endpoints

### `POST /api/task-frame`

Turns raw input and optional choice answers into high-density choice cards plus a reviewable task frame.

```ts
{
  rawInput: string,
  choiceAnswers?: ChoiceAnswer[],
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/roundtable`

Generates the fixed five-voice opening or advances one free roundtable move.

```ts
{
  action: "opening" | "move",
  taskFrame: TaskFrame,
  roundtable?: RoundtableRecord,
  moveType?: "continue_all" | "continue_one" | "duel" | "user_to_voice" | "user_to_table" | "scribe_summary",
  targetVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  fromVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  toVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  userText?: string,
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/scribe-inquiry`

Creates or refreshes scribe questions and preference-profile observations after the free roundtable.

```ts
{
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  scribeTrace: ScribeTrace,
  inquiryAnswers?: ScribeInquiryAnswer[],
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/settlement`

Produces the clarity settlement.

```ts
{
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  scribeTrace: ScribeTrace,
  inquiryAnswers: ScribeInquiryAnswer[],
  preferenceProfile: PreferenceProfile,
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/provider/test`

Verifies a user-supplied provider config.

```ts
{ baseUrl: string, model: string, apiKey: string }
```

Returns:

```ts
{ ok: boolean, model?: string, latencyMs?: number, error?: string }
```

### Retired Endpoints

`/api/focus`, `/api/voices`, `/api/clarify`, `/api/nowme`, `/api/parallel`, `/api/followup`, and `/api/share` return `410 Gone`.

## Where The Prompts Live

`/lib/selves.ts` contains the fixed five voice prompts. `/lib/llm.ts` contains the scribe, roundtable, inquiry, and settlement orchestration prompts.

## License

MIT.
