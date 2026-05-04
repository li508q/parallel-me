// /api/agent — public agent metadata for A2A discovery and AI integrations.
import { NextResponse } from "next/server";
import { getAgentMeta } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({
    ...getAgentMeta(),
    version: "0.5.0",
    psychology_grounding: "Internal Family Systems (Richard Schwartz, 1995)",
    harness: {
      pattern: "GAN-inspired Generator-Evaluator with anti-centrist arbiter",
      rounds: [
        "1. propose — N seats answer in parallel, isolated context (3 in quick, 5 in full)",
        "2. opposition_matrix — LLM judge selects most opposed 2 pairs (full mode only)",
        "3. cross_examine — selected pairs ≤40 char ripostes; addressed seat replies in ≤60 chars",
        "4. nowme_decide — Self-as-decider, banned-words filter, meta-critic regenerates if violated",
        "5. ifs_insight — therapeutic naming (no diagnosis)",
        "6. episode_extract — importance-gated memory write",
      ],
    },
    endpoints: {
      run:      { method: "POST", path: "/api/parallel",      body: { input: "string ≤800", mode: "quick|full", provider: "optional", context: "optional ContextBundle" }, response: "SSE stream" },
      followup: { method: "POST", path: "/api/followup" },
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
      "Anthropic · Multi-Agent Research System",
      "Anthropic · Effective Context Engineering for AI Agents",
      "Du et al. 2023 · Improving Factuality and Reasoning via Multiagent Debate (arXiv:2305.14325)",
      "AutoGen · GroupChat dynamic speaker selection",
      "Internal Family Systems · Richard Schwartz 1995",
    ],
  });
}
