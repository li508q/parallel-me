// /api/voices — 激活模式识别 + 五声表态

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateActivatedVoices,
  generateVoiceTurns,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const petition = String(body.petition || "").trim();
  const workingFocus = String(body.workingFocus || "").trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];
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

  if (detectCrisis(`${petition}\n${workingFocus}`)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  try {
    const activatedVoices = await generateActivatedVoices(
      petition,
      workingFocus,
      answers,
      llmRuntime,
    );
    const voiceTurns = await generateVoiceTurns(
      petition,
      workingFocus,
      activatedVoices,
      context,
      llmRuntime,
    );
    return NextResponse.json({ crisis: false, activatedVoices, voiceTurns });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "voice generation failed" },
      { status: 502 },
    );
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
