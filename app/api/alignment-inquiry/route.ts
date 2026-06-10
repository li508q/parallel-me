// /api/alignment-inquiry — v1 final scribe inquiry before 本心落定 (SSE streaming).

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateAlignmentInquiry,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { scribeEventStream, SSE_HEADERS, type ScribeStreamEvent } from "@/lib/agents/events";
import { runtimeFromProvider } from "@/lib/server-runtime";
import type { IssueProposal, ScribeObservationLedger } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const taskFrame = body.taskFrame;
  const issueProposal = body.issueProposal as IssueProposal | undefined;
  const roundtable = body.roundtable;
  const ledger = body.scribeObservationLedger as ScribeObservationLedger | null | undefined;
  const inquiryQuestions = Array.isArray(body.inquiryQuestions) ? body.inquiryQuestions : [];
  const inquiryAnswers = Array.isArray(body.inquiryAnswers) ? body.inquiryAnswers : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = runtimeFromProvider(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible || !roundtable) {
    return NextResponse.json({ error: "taskFrame and roundtable required" }, { status: 400 });
  }
  if (detectCrisis(JSON.stringify({ taskFrame, inquiryAnswers }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "inquiry", key: "reviewing" });
    emitInquiryThinking(emit, inquiryAnswers.length, inquiryQuestions.length);
    await sleep(250);
    emit({ type: "narration", stage: "inquiry", key: "drafting" });

    const result = await generateAlignmentInquiry(
      taskFrame,
      issueProposal,
      roundtable,
      ledger,
      inquiryQuestions,
      inquiryAnswers,
      context,
      llmRuntime,
      modelStream(emit, "inquiry"),
    );

    if (result.readyForReport) {
      emit({ type: "narration", stage: "inquiry", key: "analyzing" });
    } else {
      emit({ type: "narration", stage: "inquiry", key: "done", payload: { n: result.questions.length } });
    }

    emit({
      type: "result",
      payload: {
        crisis: false,
        questions: result.questions,
        readyForReport: result.readyForReport,
        alignmentProfile: result.alignmentProfile,
        scribeObservationLedger: result.ledger,
        confidence: result.confidence,
        missingModules: result.missingModules,
      },
    });
    emit({ type: "done" });
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function modelStream(emit: (event: ScribeStreamEvent) => void, source: string) {
  return {
    onToken: (text: string) => emit({ type: "model_delta", source, text }),
    onPartial: (payload: unknown) => emit({ type: "object_delta", source, payload }),
    onReasoning: (text: string, meta?: { source?: string; mode?: "native" | "public" }) =>
      emit({ type: "reasoning_delta", source: meta?.source || source, mode: meta?.mode || "public", text }),
    onEvent: (event: ScribeStreamEvent) => emit(event),
  };
}

function emitInquiryThinking(
  emit: (event: ScribeStreamEvent) => void,
  answeredCount: number,
  askedCount: number,
) {
  const text =
    answeredCount <= 0
      ? "我先按这场圆桌已有线索检查本心落定还缺哪些落点；问题数量不固定，只问会改变结论的缺口。\n"
      : `我把已问的 ${askedCount} 个问题和你的 ${answeredCount} 个回答放回落点里复核：缺哪个就补哪个，足够了才进入本心落定。\n`;
  emit({ type: "reasoning_delta", source: "inquiry", mode: "public", text });
}
