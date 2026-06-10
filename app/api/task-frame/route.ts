// /api/task-frame — 议题定义阶段：对话式追问 + 4-Key 提案 (SSE streaming)
// 支持 3 种 action: probe / propose / refine
// Production patterns: context compaction, sufficiency-gated loop, graceful degradation

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateScribeQuestions,
  generateIssueProposal,
  refineProposal,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { compactDialogue } from "@/lib/context-manager";
import { scribeEventStream, scribeModelStream, SSE_HEADERS } from "@/lib/agents/events";
import { runtimeFromProvider } from "@/lib/server-runtime";
import type { DefiningDialogue, IssueProposal } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "probe");
  const rawInput = String(body.rawInput || "").trim();
  const dialogue: DefiningDialogue = Array.isArray(body.dialogue) ? body.dialogue : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = runtimeFromProvider(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!rawInput || rawInput.length > 2000) {
    return NextResponse.json({ error: "rawInput required, max 2000 chars" }, { status: 400 });
  }
  if (detectCrisis(rawInput)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  // ─── Action: probe — 生成追问 (带上下文压缩 + 循环保护) ───
  if (action === "probe") {
    const effectiveDialogue = dialogue;
    const dialogueWasCompacted = compactDialogue(dialogue).wasCompacted;

    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "taskFrame", key: "reading" });

      const probeResult = await generateScribeQuestions(
        rawInput,
        effectiveDialogue,
        context,
        llmRuntime,
        scribeModelStream(emit, "probe"),
      );

      if (probeResult.readyToPropose) {
        emit({ type: "narration", stage: "taskFrame", key: "proposing" });
        const proposalResult = await generateIssueProposal(
          rawInput,
          effectiveDialogue,
          context,
          llmRuntime,
          scribeModelStream(emit, "proposal"),
        );
        emit({ type: "narration", stage: "taskFrame", key: "done" });
        emit({ type: "result", payload: {
          action: "propose",
          readyToPropose: true,
          proposal: proposalResult.proposal,
          taskFrame: proposalResult.taskFrame,
          thinking: probeResult.thinking,
          confidence: probeResult.confidence,
          missingKeys: probeResult.missingKeys,
          _contextCompacted: dialogueWasCompacted,
        }});
      } else {
        emit({ type: "narration", stage: "taskFrame", key: "questioning" });
        emit({ type: "result", payload: {
          action: "probe",
          readyToPropose: false,
          questions: probeResult.questions,
          thinking: probeResult.thinking,
          confidence: probeResult.confidence,
          missingKeys: probeResult.missingKeys,
          _contextCompacted: dialogueWasCompacted,
        }});
      }
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ─── Action: propose — 直接生成提案 ───
  if (action === "propose") {
    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "taskFrame", key: "proposing" });
      await sleep(200);

      const proposalResult = await generateIssueProposal(
        rawInput,
        dialogue,
        context,
        llmRuntime,
        scribeModelStream(emit, "proposal"),
      );

      emit({ type: "narration", stage: "taskFrame", key: "done" });
      emit({ type: "result", payload: {
        action: "propose",
        readyToPropose: true,
        proposal: proposalResult.proposal,
        taskFrame: proposalResult.taskFrame,
      }});
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ─── Action: refine — 用户反馈后修正 ───
  if (action === "refine") {
    const currentProposal = body.currentProposal as IssueProposal | undefined;
    const userFeedback = String(body.userFeedback || "").trim();

    if (!currentProposal || !userFeedback) {
      return NextResponse.json({ error: "currentProposal and userFeedback required" }, { status: 400 });
    }

    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "taskFrame", key: "reading" });
      await sleep(200);
      emit({ type: "narration", stage: "taskFrame", key: "refining" });

      const refineResult = await refineProposal(
        rawInput,
        dialogue,
        currentProposal,
        userFeedback,
        context,
        llmRuntime,
        scribeModelStream(emit, "refine"),
      );

      if (refineResult.needMoreInfo && refineResult.questions?.length) {
        emit({ type: "narration", stage: "taskFrame", key: "questioning" });
        emit({ type: "result", payload: {
          action: "probe",
          readyToPropose: false,
          questions: refineResult.questions,
          thinking: refineResult.thinking,
          confidence: refineResult.confidence,
          missingKeys: refineResult.missingKeys,
        }});
      } else {
        emit({ type: "narration", stage: "taskFrame", key: "done" });
        emit({ type: "result", payload: {
          action: "propose",
          readyToPropose: true,
          proposal: refineResult.proposal,
          taskFrame: refineResult.taskFrame,
          thinking: refineResult.thinking,
          confidence: refineResult.confidence,
          missingKeys: refineResult.missingKeys,
        }});
      }
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  return NextResponse.json(
    { error: "unknown action. Use probe, propose, or refine." },
    { status: 400 },
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
