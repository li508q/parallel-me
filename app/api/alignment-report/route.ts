// /api/alignment-report — v1 本心落定 report (SSE streaming).

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateAlignmentReport,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { scribeEventStream, SSE_HEADERS, type ScribeStreamEvent } from "@/lib/agents/events";
import type { AlignmentProfile, IssueProposal, ScribeObservationLedger } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const taskFrame = body.taskFrame;
  const issueProposal = body.issueProposal as IssueProposal | undefined;
  const ledger = body.scribeObservationLedger as ScribeObservationLedger | undefined;
  const inquiryAnswers = Array.isArray(body.inquiryAnswers) ? body.inquiryAnswers : [];
  const alignmentProfile = body.alignmentProfile as AlignmentProfile | undefined;
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible || !ledger || !alignmentProfile) {
    return NextResponse.json(
      { error: "taskFrame, scribeObservationLedger and alignmentProfile required" },
      { status: 400 },
    );
  }
  if (detectCrisis(JSON.stringify({ taskFrame, inquiryAnswers }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "settlement", key: "drafting" });
    await sleep(300);

    const alignmentReport = await generateAlignmentReport(
      taskFrame,
      issueProposal,
      ledger,
      inquiryAnswers,
      alignmentProfile,
      context,
      llmRuntime,
      modelStream(emit, "settlement"),
    );

    emit({ type: "narration", stage: "settlement", key: "commitment" });
    await sleep(160);
    emit({ type: "narration", stage: "settlement", key: "done" });
    emit({ type: "result", payload: { crisis: false, alignmentReport } });
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
