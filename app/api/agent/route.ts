// /api/agent — public agent metadata for A2A discovery and AI integrations.
import { NextResponse } from "next/server";
import { getAgentMeta } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({
    ...getAgentMeta(),
    version: "0.5.0",
    psychology_grounding:
      "IFS, Voice Dialogue, Schema Therapy Modes, Chairwork, ACT, MI, Narrative Therapy, and CFT as product inspirations. Not therapy, diagnosis, or crisis intervention.",
    harness: {
      pattern: "structured five-voice self-clarification with NowMe synthesis",
      rounds: [
        "1. focus — turn petition and clarifying answers into a working focus",
        "2. voices — identify why the fixed five voices are activated",
        "3. dialogue — five voices state what they protect, fear, and ask not to ignore",
        "4. clarify — named follow-up, role reversal, and nonjudgmental cross-clarification",
        "5. nowme — clarity sentence plus values-aligned 24h commitment",
        "6. memory — consent-gated local-only record write",
      ],
    },
    endpoints: {
      focus:    { method: "POST", path: "/api/focus" },
      voices:   { method: "POST", path: "/api/voices" },
      clarify:  { method: "POST", path: "/api/clarify" },
      nowme:    { method: "POST", path: "/api/nowme" },
      test:     { method: "POST", path: "/api/provider/test" },
      taste:    { method: "POST", path: "/api/taste" },
      share:    { method: "POST", path: "/api/share" },
      spec:     { method: "GET",  path: "/api/agent" },
    },
    a2a: "/.well-known/agent.json",
    skill_md: "/skill.md",
    agents_md: "/AGENTS.md",
    license: "MIT",
    inspired_by: [
      "Internal Family Systems · Richard Schwartz 1995",
      "Voice Dialogue · aware ego",
      "Schema Therapy Modes · activated modes",
      "Chairwork · role reversal",
      "Acceptance and Commitment Therapy · committed action",
      "Motivational Interviewing · open questions and reflective listening",
      "Narrative Therapy · externalizing conversations",
      "Compassion Focused Therapy · reducing shame and self-criticism",
    ],
  });
}
