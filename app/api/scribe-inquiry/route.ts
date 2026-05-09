// /api/scribe-inquiry — v0.7 preference validation after free roundtable (SSE streaming).

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateScribeInquiry,
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
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible || !roundtable || !scribeTrace) {
    return NextResponse.json({ error: "taskFrame, roundtable and scribeTrace required" }, { status: 400 });
  }
  if (detectCrisis(JSON.stringify({ taskFrame, inquiryAnswers }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "inquiry", key: "reviewing" });
    await sleep(300);
    emit({ type: "narration", stage: "inquiry", key: "drafting" });

    const result = await generateScribeInquiry(
      taskFrame,
      roundtable,
      scribeTrace,
      inquiryAnswers,
      context,
      llmRuntime,
    );

    const qCount = result.questions?.length || 0;
    if (qCount > 0) {
      emit({ type: "narration", stage: "inquiry", key: "done", payload: { n: qCount } });
      for (const question of result.questions) {
        emit({ type: "token", text: `问：${question.question}\n${question.options.map((o) => `- ${o.label}`).join("\n")}\n` });
      }
    } else {
      emit({ type: "narration", stage: "inquiry", key: "analyzing" });
      emit({
        type: "token",
        text: result.preferenceProfile.validated_leanings.join("\n") || "书记员正在整合你的回答。\n",
      });
    }

    emit({ type: "result", payload: { crisis: false, ...result } });
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
