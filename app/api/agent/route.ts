// /api/agent — AI 评委 agent 的入口；返回项目元数据 + 直接可调用的能力清单
import { NextResponse } from "next/server";
import { SELVES, NOWME } from "@/lib/selves";

export async function GET() {
  return NextResponse.json({
    name: "ParallelMe",
    name_zh: "平行的我",
    one_liner: "你的纠结，让 5 个平行宇宙的你吵给你听。",
    version: "1.0.0",
    architecture: "multi-agent (5 selves + 1 NowMe + cross-examine layer)",
    selves: Object.values(SELVES).map(s => ({
      id: s.id, name: s.name, tagline: s.tagline, core_belief: s.core_belief
    })),
    nowme: { id: NOWME.id, name: NOWME.name, tagline: NOWME.tagline },
    endpoints: {
      run: { method: "POST", path: "/api/parallel", body: { input: "string (max 800)" }, response: "SSE stream" },
      spec: { method: "GET", path: "/api/agent" }
    },
    a2a: "/.well-known/agent.json",
    skill_md: "/skill.md",
    agents_md: "/AGENTS.md",
    license: "MIT",
    built_for: "傅盛 AI 战队 × EasyClaw Link 黑客松 2026"
  });
}
