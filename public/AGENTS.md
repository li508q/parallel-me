# AGENTS.md

> Public API documentation for AI agents that want to integrate with ParallelMe.

## What ParallelMe is

A multi-agent system that helps a person host an *internal cabinet meeting* with
five inner voices when facing a hard life decision. It is not a chatbot — it is
an object system where the user is the meeting chair.

- **Five inner seats** mapped to Internal Family Systems (IFS) parts:
  `lay` (rest), `money` (resource), `roam` (freedom), `filial` (attachment),
  `future` (long view).
- **One arbiter** (`now`) — Self-as-decider, not an averager.
- **Two modes**: `quick` (3 seats, 3-5 min) and `full` (5 seats + cross-exam +
  topic revision, 10-15 min).

## Endpoints

### `POST /api/parallel` — start a meeting (SSE)

```bash
curl -N -X POST https://parallelme.app/api/parallel \
  -H "Content-Type: application/json" \
  -d '{"input": "我该不该考公", "mode": "quick"}'
```

Body:
- `input` (string, ≤ 800 chars) — the dilemma
- `mode` (`"quick"` | `"full"`, default `"quick"`)
- `context` (optional `ContextBundle` with `meCard` / `tasteProfile` /
  `recentEpisode`)
- `provider` (optional `{ baseUrl, model, apiKey }` — user's own LLM key)

Returns `text/event-stream` of:

```
data: {"type":"self","id":"lay","name":"躺平的我","text":"…"}
data: {"type":"cross","fromId":"money","toId":"lay","text":"…"}      # full only
data: {"type":"cross_response","fromId":"lay","text":"…"}            # full only
data: {"type":"loudest","id":"future"}
data: {"type":"now","text":"…"}
data: {"type":"insight","text":"…"}
data: {"type":"episode","ep":{...}}
data: {"type":"done"}
```

### `POST /api/followup` — call on a single seat

```ts
{
  selfId: "lay" | "money" | "roam" | "filial" | "future",
  userInput: string,
  prevAnswer: string,
  question: string,             // ≤ 300 chars
  context?: ContextBundle,
  provider?: { baseUrl, model, apiKey }
}
```

### `POST /api/provider/test` — verify a user-supplied provider config

```ts
{ baseUrl: string, model: string, apiKey: string }
→ { ok: boolean, model?: string, latencyMs?: number, error?: string }
```

### `GET /api/agent` — full agent metadata (this file's machine version)

## Design rationale (one paragraph)

A single agent's answer is the median view — soft and forgettable. What a
person actually needs in the middle of a life-sized dilemma is *to hear the
extremes argue* and then make their own call. Five independent personas
arguing under a self-aware arbiter is what no single agent can deliver,
because a single agent is rewarded for averaging.

## Where the prompts live

`/lib/selves.ts` — every persona's system prompt is open-source. Read,
fork, criticize.

## License

MIT.
