// /api/settlement — v0.7 清明落定 (SSE streaming)

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateClaritySettlement,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { scribeEventStream, SSE_HEADERS } from "@/lib/agents/events";

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

  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "settlement", key: "drafting" });
    await sleep(400);

    const clarity = await generateClaritySettlement(
      taskFrame,
      roundtable,
      scribeTrace,
      inquiryAnswers,
      preferenceProfile,
      context,
      llmRuntime,
    );

    emit({ type: "narration", stage: "settlement", key: "commitment" });
    emit({
      type: "token",
      text:
        `${clarity.clarity_sentence}\n` +
        `${clarity.preference_readout}\n` +
        `24 小时内：${clarity.commitment24h}\n`,
    });
    await sleep(200);
    emit({ type: "narration", stage: "settlement", key: "done" });
    emit({ type: "result", payload: { crisis: false, clarity } });
    emit({ type: "done" });
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
