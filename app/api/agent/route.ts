// /api/agent — public agent metadata for A2A discovery and AI integrations.
import { NextResponse } from "next/server";
import { getAgentMeta } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({
    ...getAgentMeta(),
    version: "0.7.0",
    psychology_grounding:
      "IFS, Voice Dialogue, Chairwork, ACT, MI, Narrative Therapy, and CFT as product inspirations. Not therapy, diagnosis, or crisis intervention.",
    harness: {
      pattern: "scribe-guided five-voice roundtable with clarity settlement",
      rounds: [
        "1. task frame — scribe turns raw input into a reviewable issue",
        "2. roundtable — fixed five voices present structured opening arguments",
        "3. free discussion — user asks, continues voices, or selects two voices to confront",
        "4. scribe inquiry — scribe validates user preference patterns",
        "5. clarity settlement — clarity sentence, preference readout, tradeoff, posture, and 24h commitment",
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
      "Chairwork · role reversal",
      "Acceptance and Commitment Therapy · committed action",
      "Motivational Interviewing · open questions and reflective listening",
      "Narrative Therapy · externalizing conversations",
      "Compassion Focused Therapy · reducing shame and self-criticism",
    ],
  });
}
