// /api/agent — A2A spec for AI judges
import { NextResponse } from "next/server";
import { getAgentMeta } from "@/lib/llm";
import { NOWME } from "@/lib/selves";

export async function GET() {
  return NextResponse.json({
    ...getAgentMeta(),
    version: "2.0.0",
    psychology_grounding: "Internal Family Systems (Richard Schwartz, 1995)",
    harness: {
      pattern: "GAN-inspired Generator-Evaluator (Anthropic Harness Design 2026)",
      rounds: [
        "1. propose — 5 selves answer in parallel, isolated context",
        "2. opposition_matrix — LLM judge selects most opposed 2 pairs (replaces hardcoded pairs)",
        "3. cross_examine — selected pairs ≤40 char ripostes",
        "4. nowme_decide — Self-as-decider, banned-words filter, meta-critic regenerates if violated",
        "5. ifs_insight — therapeutic naming (no diagnosis)",
        "6. episode_extract — importance-gated memory write",
      ],
    },
    endpoints: {
      run: { method: "POST", path: "/api/parallel", body: { input: "string ≤800", context: "optional ContextBundle" }, response: "SSE stream" },
      followup: { method: "POST", path: "/api/followup" },
      profile: { method: "GET|POST", path: "/api/profile" },
      memory: { method: "GET|POST", path: "/api/memory" },
      share: { method: "POST", path: "/api/share" },
      spec: { method: "GET", path: "/api/agent" },
    },
    a2a: "/.well-known/agent.json",
    skill_md: "/skill.md",
    agents_md: "/AGENTS.md",
    license: "MIT",
    built_for: "傅盛 AI 战队 × EasyClaw Link 黑客松 2026",
    inspired_by: [
      "傅盛 14 天 8 个 AI agent — but inverted from company-ops to self-ops",
      "Anthropic Multi-Agent Research System",
      "Anthropic Harness Design (GAN-inspired Generator-Evaluator)",
      "Du et al. 2023 Multi-Agent Debate (arxiv 2305.14325)",
      "IFS (Internal Family Systems) — Richard Schwartz",
    ],
  });
}
