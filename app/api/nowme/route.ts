// /api/nowme — 清明句 + NowMe + 24h 承诺草案

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateNowMe,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const petition = String(body.petition || "").trim();
  const workingFocus = String(body.workingFocus || "").trim();
  const voiceTurns = Array.isArray(body.voiceTurns) ? body.voiceTurns : [];
  const followups = Array.isArray(body.followups) ? body.followups : [];
  const roleReversals = Array.isArray(body.roleReversals) ? body.roleReversals : [];
  const crossClarifications = Array.isArray(body.crossClarifications)
    ? body.crossClarifications
    : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);
  if (!llmRuntime) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  if (!petition || !workingFocus || voiceTurns.length === 0) {
    return NextResponse.json(
      { error: "petition, workingFocus and voiceTurns required" },
      { status: 400 },
    );
  }

  if (detectCrisis(`${petition}\n${workingFocus}`)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  try {
    const result = await generateNowMe(
      petition,
      workingFocus,
      voiceTurns,
      followups,
      roleReversals,
      crossClarifications,
      context,
      llmRuntime,
    );
    return NextResponse.json({ crisis: false, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "nowme generation failed" },
      { status: 502 },
    );
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
