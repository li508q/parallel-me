# AGENTS.md

> Public API documentation for AI agents that want to integrate with ParallelMe.

## What ParallelMe Is

ParallelMe is a structured five-voice self-clarification system for life-sized dilemmas. It is not a chatbot, therapy, diagnosis, or crisis intervention. The user stays in the host position while five fixed inner voices help turn a vague petition into a working focus, clarify costs and blind spots, and end with a clarity sentence plus a 24-hour commitment.

## Core Objects

- `petition`: the user's raw concern.
- `clarifyingAnswers`: short answers that help shape the concern.
- `workingFocus`: what this session will listen for first.
- `activatedVoices`: the fixed five voices and why each is present.
- `voiceTurns`: each voice stating what it protects, fears, and asks not to ignore.
- `followups`: user-named questions to a selected voice.
- `roleReversalTurns`: the user sitting in a voice's position and correcting it.
- `crossClarifications`: nonjudgmental voice-to-voice questions about costs and blind spots.
- `claritySentence`: “what I can now see clearly.”
- `nowMe`: Self / aware ego synthesis, not a sixth voice.
- `commitment24h`: a concrete action within 24 hours.

## Fixed Five Voices

| ID | Voice | Protects |
|---|---|---|
| `lay` | 躺平的我 | body, rest, lower-cost survival |
| `money` | 搞钱的我 | cashflow, resources, options |
| `roam` | 出走的我 | freedom, breathing room, exits |
| `filial` | 怕妈担心的我 | attachment, belonging, family connection |
| `future` | 5 年后的我 | long view, continuity, compounding choices |

`now` is not part of the five voices. It is the user's Self / aware ego position.

## Provider Requirement

Generation endpoints require a user-supplied provider payload:

```ts
{ baseUrl: string, model: string, apiKey: string }
```

The client setup flow includes DeepSeek, 阿里云百炼, Kimi, MiniMax, 豆包 / 火山方舟, and a custom compatible endpoint. API keys are stored only in the user's browser or current session.

## Endpoints

### `POST /api/focus`

Turns the petition and clarifying answers into questions plus a working focus.

```ts
{
  petition: string,
  answers?: { question: string, answer: string }[],
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

Returns:

```ts
{
  crisis: boolean,
  questions: string[],
  workingFocus: string
}
```

### `POST /api/voices`

Identifies why the fixed five voices are activated and generates their statements.

```ts
{
  petition: string,
  workingFocus: string,
  answers?: { question: string, answer: string }[],
  context?: ContextBundle,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/clarify`

Supports named follow-up and voice-to-voice clarification.

```ts
{
  action: "followup" | "cross",
  petition: string,
  workingFocus: string,
  provider: { baseUrl: string, model: string, apiKey: string }
}
```

### `POST /api/nowme`

Produces the clarity sentence, NowMe synthesis, insight, and 24-hour commitment.

```ts
{
  petition: string,
  workingFocus: string,
  voiceTurns: VoiceTurn[],
  followups?: Followup[],
  roleReversals?: RoleReversalTurn[],
  crossClarifications?: CrossClarification[],
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

`/api/parallel` and `/api/followup` now return `410 Gone`. Use the structured endpoints above.

## Where The Prompts Live

`/lib/selves.ts` contains the fixed five voice prompts and NowMe prompt.

## License

MIT.
