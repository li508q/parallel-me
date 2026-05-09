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
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible || !roundtable) {
    return NextResponse.json({ error: "taskFrame and roundtable required" }, { status: 400 });
  }
  if (detectCrisis(JSON.stringify({ taskFrame, inquiryAnswers }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "inquiry", key: "reviewing" });
    emitInquiryThinking(emit, inquiryAnswers.length);
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
      },
    });
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

function modelStream(emit: (event: ScribeStreamEvent) => void, source: string) {
  return {
    onToken: (text: string) => emit({ type: "model_delta", source, text }),
    onPartial: (payload: unknown) => emit({ type: "object_delta", source, payload }),
  };
}

function emitInquiryThinking(emit: (event: ScribeStreamEvent) => void, answeredCount: number) {
  const text =
    answeredCount <= 0
      ? "我先检查五个落点：哪一个幻想需要被宣判，哪条主轴最像本心，哪些痛必须被认领，24 小时动作是否够具体，以及正反合能不能被用户认领。\n"
      : `我把前面 ${answeredCount} 个回答放回五个落点里复核：如果只剩一个关键缺口，就只问那一个；如果已经足够，我会直接进入本心落定。\n`;
  emit({ type: "reasoning_delta", source: "inquiry", mode: "public", text });
}
