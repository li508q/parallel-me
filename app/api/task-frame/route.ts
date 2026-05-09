// /api/task-frame — 议题定义阶段：对话式追问 + 4-Key 提案 (SSE streaming)
// 支持 3 种 action: probe / propose / refine
// Production patterns: context compaction, max_turns guard, graceful degradation

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateScribeQuestions,
  generateIssueProposal,
  refineProposal,
  generateTaskFrame,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";
import { scribeEventStream, SSE_HEADERS } from "@/lib/agents/events";
import type { DefiningDialogue, IssueProposal } from "@/lib/v7";
import { compactDialogue } from "@/lib/context-manager";

// ─── Agent Loop Guard (参考 smolagents max_steps + graceful degradation) ───
const MAX_PROBE_TURNS = 5;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "probe");
  const rawInput = String(body.rawInput || "").trim();
  const dialogue: DefiningDialogue = Array.isArray(body.dialogue) ? body.dialogue : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!rawInput || rawInput.length > 2000) {
    return NextResponse.json({ error: "rawInput required, max 2000 chars" }, { status: 400 });
  }
  if (detectCrisis(rawInput)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  // ─── Action: probe — 生成追问 (带上下文压缩 + 循环保护) ───
  if (action === "probe") {
    // Agent loop guard: max 5 probe turns then force propose
    const dialogueTurns = dialogue.filter((d) => d.role === "user").length;
    const forcePropose = dialogueTurns >= MAX_PROBE_TURNS;

    // Context compaction: compress old dialogue for LLM
    const { compacted, summary } = compactDialogue(dialogue);
    const effectiveDialogue = compacted;

    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "taskFrame", key: "reading" });

      if (forcePropose) {
        // Graceful degradation: don't ask more, generate proposal from what we have
        emit({ type: "narration", stage: "taskFrame", key: "proposing" });
        const proposalResult = await generateIssueProposal(rawInput, effectiveDialogue, context, llmRuntime);
        emit({ type: "narration", stage: "taskFrame", key: "done" });
        emitProposalTokens(emit, proposalResult.proposal);
        emit({ type: "result", payload: {
          action: "propose",
          readyToPropose: true,
          proposal: proposalResult.proposal,
          taskFrame: proposalResult.taskFrame,
          thinking: `已达 ${MAX_PROBE_TURNS} 轮追问上限，自动生成提案。`,
          _contextCompacted: !!summary,
        }});
        emit({ type: "done" });
        return;
      }

      const probeResult = await generateScribeQuestions(rawInput, effectiveDialogue, context, llmRuntime);

      if (probeResult.readyToPropose) {
        emit({ type: "narration", stage: "taskFrame", key: "proposing" });
        const proposalResult = await generateIssueProposal(rawInput, effectiveDialogue, context, llmRuntime);
        emit({ type: "narration", stage: "taskFrame", key: "done" });
        emitProposalTokens(emit, proposalResult.proposal);
        emit({ type: "result", payload: {
          action: "propose",
          readyToPropose: true,
          proposal: proposalResult.proposal,
          taskFrame: proposalResult.taskFrame,
          thinking: probeResult.thinking,
          _contextCompacted: !!summary,
        }});
      } else {
        emit({ type: "narration", stage: "taskFrame", key: "questioning" });
        emit({ type: "result", payload: {
          action: "probe",
          readyToPropose: false,
          questions: probeResult.questions,
          thinking: probeResult.thinking,
          _contextCompacted: !!summary,
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

      const proposalResult = await generateIssueProposal(rawInput, dialogue, context, llmRuntime);

      emit({ type: "narration", stage: "taskFrame", key: "done" });
      emitProposalTokens(emit, proposalResult.proposal);
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
        rawInput, dialogue, currentProposal, userFeedback, context, llmRuntime,
      );

      if (refineResult.needMoreInfo && refineResult.questions?.length) {
        emit({ type: "narration", stage: "taskFrame", key: "questioning" });
        emit({ type: "result", payload: {
          action: "probe",
          readyToPropose: false,
          questions: refineResult.questions,
          thinking: refineResult.thinking,
        }});
      } else {
        emit({ type: "narration", stage: "taskFrame", key: "done" });
        emitProposalTokens(emit, refineResult.proposal || currentProposal);
        emit({ type: "result", payload: {
          action: "propose",
          readyToPropose: true,
          proposal: refineResult.proposal || currentProposal,
          taskFrame: refineResult.taskFrame,
          thinking: refineResult.thinking,
        }});
      }
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ─── Fallback: legacy action (backward compat) ───
  const choiceAnswers = Array.isArray(body.choiceAnswers) ? body.choiceAnswers : [];
  const stream = scribeEventStream(async (emit) => {
    emit({ type: "narration", stage: "taskFrame", key: "reading" });
    emit({ type: "narration", stage: "taskFrame", key: "extractingTension" });

    const result = await generateTaskFrame(rawInput, choiceAnswers, context, llmRuntime);

    emit({ type: "narration", stage: "taskFrame", key: "done" });
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

function emitProposalTokens(
  emit: (event: any) => void,
  proposal: IssueProposal,
) {
  const keys = [
    proposal.surface_dilemma,
    proposal.current_constraints,
    proposal.core_fears,
    proposal.expected_resolution,
  ];
  for (const key of keys) {
    emit({ type: "token", text: `${key.title}：${key.content}\n` });
  }
}
