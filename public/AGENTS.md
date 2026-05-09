# AGENTS.md

> Public API documentation for AI agents that want to integrate with ParallelMe.

## What ParallelMe Is

ParallelMe is a local-first, scribe-guided five-voice roundtable for life-sized dilemmas. It is not a chatbot, therapy, diagnosis, or crisis intervention. The user gives one raw input, the scribe turns it into a confirmed issue proposal, five fixed inner voices discuss it, and later stages confirm the last decisive points before producing one 本心落定 card.

## Core Objects

- `raw_input`: the user's original concern.
- `issue_proposal`: the confirmed issue sentence plus 4-Key proposal used to enter the roundtable.
- `task_frame`: legacy-compatible issue frame, with visible fields and internal evidence status.
- `roundtable`: fixed five-voice opening turns plus free roundtable moves.
- `inquiry_questions`: scribe questions that confirm the final settlement gaps.
- `alignment_profile`: natural-language fantasy, core-axis, cost, tension, and synthesis records.
- `alignment_report`: the visible 本心落定 card with four report modules and dialectic synthesis.

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

Runs the scribe-led defining flow: probe, refine, or produce a confirmed issue proposal.

```ts
{
  action: "probe" | "refine",
  rawInput: string,
  dialogue?: DefiningDialogueEntry[],
  currentProposal?: IssueProposal,
  userFeedback?: string,
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
  issueProposal?: IssueProposal,
  roundtable?: RoundtableRecord,
  moveType?: "continue_all" | "duel" | "user_to_voice" | "user_to_table",
  targetVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  fromVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  toVoiceId?: "lay" | "money" | "roam" | "filial" | "future",
  userText?: string,
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/alignment-inquiry`

Creates or refreshes the final scribe questions after the free roundtable.

```ts
{
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  scribeObservationLedger?: ScribeObservationLedger,
  inquiryQuestions?: ScribeInquiryQuestion[],
  inquiryAnswers?: ScribeInquiryAnswer[],
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/alignment-report`

Produces the visible 本心落定 card.

```ts
{
  taskFrame: TaskFrame,
  scribeObservationLedger: ScribeObservationLedger,
  inquiryAnswers: ScribeInquiryAnswer[],
  alignmentProfile: AlignmentProfile,
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
