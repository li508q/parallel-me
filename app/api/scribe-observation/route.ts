// /api/scribe-observation — invisible v1 scribe observation ledger update.

import { NextRequest, NextResponse } from "next/server";
import {
  generateScribeObservationLedger,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { runtimeFromProvider } from "@/lib/server-runtime";
import type { IssueProposal, ScribeObservationLedger } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const taskFrame = body.taskFrame;
  const issueProposal = body.issueProposal as IssueProposal | undefined;
  const roundtable = body.roundtable;
  const previousLedger = body.scribeObservationLedger as ScribeObservationLedger | null | undefined;
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = runtimeFromProvider(body.provider);

  if (!llmRuntime || !taskFrame?.visible || !roundtable) {
    return NextResponse.json({ skipped: true, scribeObservationLedger: previousLedger ?? null });
  }

  const scribeObservationLedger = await generateScribeObservationLedger(
    taskFrame,
    issueProposal,
    roundtable,
    previousLedger,
    context,
    llmRuntime,
  );

  return NextResponse.json({ skipped: false, scribeObservationLedger });
}
