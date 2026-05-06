// /api/settlement — v0.7 清明落定

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateClaritySettlement,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const taskFrame = body.taskFrame;
  const roundtable = body.roundtable;
  const scribeTrace = body.scribeTrace;
  const inquiryAnswers = Array.isArray(body.inquiryAnswers) ? body.inquiryAnswers : [];
  const preferenceProfile = body.preferenceProfile;
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible || !roundtable || !scribeTrace || !preferenceProfile) {
    return NextResponse.json(
      { error: "taskFrame, roundtable, scribeTrace and preferenceProfile required" },
      { status: 400 },
    );
  }
  if (detectCrisis(JSON.stringify({ taskFrame, inquiryAnswers }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  try {
    const clarity = await generateClaritySettlement(
      taskFrame,
      roundtable,
      scribeTrace,
      inquiryAnswers,
      preferenceProfile,
      context,
      llmRuntime,
    );
    return NextResponse.json({ crisis: false, clarity });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "settlement generation failed" }, { status: 502 });
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
