// /api/clarify — 点名追问 / 五声互问

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateCrossClarifications,
  generateVoiceFollowup,
  type ActivatedVoiceResult,
  type ContextBundle,
  type LlmRuntime,
  type VoiceTurnResult,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const petition = String(body.petition || "").trim();
  const workingFocus = String(body.workingFocus || "").trim();
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);
  if (!llmRuntime) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  if (!petition || !workingFocus) {
    return NextResponse.json(
      { error: "petition and workingFocus required" },
      { status: 400 },
    );
  }

  if (detectCrisis(`${petition}\n${workingFocus}\n${body.question || ""}`)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  if (action === "followup") {
    const voice = body.voice as ActivatedVoiceResult | undefined;
    const question = String(body.question || "").trim();
    const prevAnswer = String(body.prevAnswer || "");
    if (!voice || !question) {
      return NextResponse.json(
        { error: "voice and question required" },
        { status: 400 },
      );
    }
    try {
      const answer = await generateVoiceFollowup(
        voice,
        petition,
        workingFocus,
        prevAnswer,
        question,
        context,
        llmRuntime,
      );
      return NextResponse.json({ crisis: false, answer });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "followup generation failed" },
        { status: 502 },
      );
    }
  }

  if (action === "cross") {
    const turns = Array.isArray(body.voiceTurns)
      ? (body.voiceTurns as VoiceTurnResult[])
      : [];
    try {
      const crossClarifications = await generateCrossClarifications(
        petition,
        workingFocus,
        turns,
        llmRuntime,
      );
      return NextResponse.json({ crisis: false, crossClarifications });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "cross clarification generation failed" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
