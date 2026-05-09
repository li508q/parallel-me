// /api/roundtable — v1 fixed five-voice opening and free roundtable moves (SSE streaming).

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateOpeningTurns,
  generateRoundtableMove,
  type ContextBundle,
  type LlmRuntime,
  type RoundtableMoveInput,
} from "@/lib/llm";
import { scribeEventStream, SSE_HEADERS, type ScribeStreamEvent } from "@/lib/agents/events";
import { runtimeFromProvider } from "@/lib/server-runtime";
import type { IssueProposal } from "@/lib/v7";
import { voiceName } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const taskFrame = body.taskFrame;
  const issueProposal = body.issueProposal as IssueProposal | undefined;
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = runtimeFromProvider(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible) {
    return NextResponse.json({ error: "taskFrame required" }, { status: 400 });
  }
  if (detectCrisis(JSON.stringify({ taskFrame, issueProposal, userText: body.userText }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  if (action === "opening") {
    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "opening", key: "seating" });
      await sleep(300);

      const openingTurns = await generateOpeningTurns(
        taskFrame,
        issueProposal,
        context,
        llmRuntime,
        modelStream(emit, "opening"),
      );

      emit({ type: "narration", stage: "opening", key: "done" });
      emit({ type: "result", payload: { crisis: false, openingTurns } });
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  if (action === "move") {
    const stream = scribeEventStream(async (emit) => {
      const moveType = body.moveType || "continue_all";
      if (moveType === "duel") {
        emit({ type: "narration", stage: "roundtable", key: "duelPicking" });
      } else {
        const targetName = body.targetVoiceId ? voiceName(body.targetVoiceId) : "五声";
        emit({ type: "narration", stage: "roundtable", key: "voiceThinking", payload: { "角色名": targetName } });
      }
      await sleep(200);

      const input: RoundtableMoveInput = {
        moveType,
        taskFrame,
        issueProposal,
        roundtable: body.roundtable,
        targetVoiceId: body.targetVoiceId,
        fromVoiceId: body.fromVoiceId,
        toVoiceId: body.toVoiceId,
        userText: body.userText,
      };
      const result = await generateRoundtableMove(
        input,
        context,
        llmRuntime,
        modelStream(emit, "roundtable"),
      );

      if (moveType === "duel" && result.turns[0]?.duel) {
        const x = result.turns[0].duel.from_name;
        const y = result.turns[0].duel.to_name;
        emit({ type: "narration", stage: "roundtable", key: "duelOngoing", payload: { X: x, Y: y } });
        await sleep(300);
      }

      emit({ type: "narration", stage: "roundtable", key: "done" });
      emit({ type: "result", payload: { crisis: false, ...result } });
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
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
