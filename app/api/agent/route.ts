// /api/agent — public metadata for discovery and AI integrations.
import { NextResponse } from "next/server";
import { getIntegrationMeta } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({
    ...getIntegrationMeta(),
    version: "1.0.0",
    psychology_grounding:
      "IFS, Voice Dialogue, Chairwork, ACT, MI, Narrative Therapy, and CFT as product inspirations. Not therapy, diagnosis, or crisis intervention.",
    harness: {
      pattern: "scribe-guided five-voice roundtable with invisible observation and alignment report",
      rounds: [
        "1. task frame — scribe turns raw input into a reviewable issue",
        "2. roundtable — fixed five voices present structured opening arguments",
        "3. free discussion — user asks, continues the table, or lets two voices talk directly",
        "4. invisible scribe observation — scribe quietly updates an internal ledger during the table",
        "5. scribe inquiry — scribe confirms the last decisive points with the user",
        "6. 本心落定 — one visible card with four report modules and dialectic synthesis",
      ],
    },
    endpoints: {
      task_frame:     { method: "POST", path: "/api/task-frame" },
      roundtable:     { method: "POST", path: "/api/roundtable" },
      scribe_observation: { method: "POST", path: "/api/scribe-observation" },
      alignment_inquiry: { method: "POST", path: "/api/alignment-inquiry" },
      alignment_report: { method: "POST", path: "/api/alignment-report" },
      test:           { method: "POST", path: "/api/provider/test" },
      taste:          { method: "POST", path: "/api/taste" },
      spec:           { method: "GET",  path: "/api/agent" },
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
