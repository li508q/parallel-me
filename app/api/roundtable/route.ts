// /api/roundtable — v0.7 fixed five-voice opening and free roundtable moves (SSE streaming).

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
import { scribeEventStream, SSE_HEADERS } from "@/lib/agents/events";
import { voiceName } from "@/lib/v7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const taskFrame = body.taskFrame;
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!taskFrame?.visible) {
    return NextResponse.json({ error: "taskFrame required" }, { status: 400 });
  }
  if (detectCrisis(JSON.stringify({ taskFrame, userText: body.userText }))) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  if (action === "opening") {
    const stream = scribeEventStream(async (emit) => {
      emit({ type: "narration", stage: "opening", key: "seating" });
      await sleep(300);

      const openingTurns = await generateOpeningTurns(taskFrame, context, llmRuntime);

      // Emit per-voice narration
      for (let i = 0; i < openingTurns.length; i++) {
        const turn = openingTurns[i];
        const name = voiceName(turn.voice_id);
        emit({ type: "narration", stage: "opening", key: "voiceSpeaking", payload: { "角色名": name } });
        emit({ type: "token", text: `${name}：${turn.thesis}\n守护：${turn.protected_value}\n担心：${turn.concern}\n` });
        await sleep(200);
        if (i < openingTurns.length - 1) {
          const nextName = voiceName(openingTurns[i + 1].voice_id);
          emit({ type: "narration", stage: "opening", key: "voiceRotating", payload: { "角色名": name, "下一位": nextName } });
          await sleep(100);
        }
      }

      emit({ type: "narration", stage: "opening", key: "done" });
      emit({ type: "result", payload: { crisis: false, openingTurns } });
      emit({ type: "done" });
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  if (action === "move") {
    const stream = scribeEventStream(async (emit) => {
      const moveType = body.moveType || "continue_one";
      // Determine narration based on move type
      if (moveType === "duel") {
        emit({ type: "narration", stage: "roundtable", key: "duelPicking" });
      } else {
        const targetName = body.targetVoiceId ? voiceName(body.targetVoiceId) : "";
        emit({ type: "narration", stage: "roundtable", key: "voiceThinking", payload: { "角色名": targetName || "圆桌" } });
      }
      await sleep(200);

      const input: RoundtableMoveInput = {
        moveType,
        taskFrame,
        roundtable: body.roundtable,
        targetVoiceId: body.targetVoiceId,
        fromVoiceId: body.fromVoiceId,
        toVoiceId: body.toVoiceId,
        userText: body.userText,
      };
      const result = await generateRoundtableMove(input, context, llmRuntime);

      for (const turn of result.turns) {
        if (turn.duel) {
          emit({
            type: "token",
            text: `${turn.duel.from_name} 问 ${turn.duel.to_name}：${turn.duel.question}\n${turn.duel.to_name}：${turn.duel.response}\n`,
          });
        } else if (turn.text) {
          emit({ type: "token", text: `${turn.name || "书记员"}：${turn.text}\n` });
        }
      }

      // Post-generation narration
      if (moveType === "duel" && result.turns.length >= 2) {
        const x = result.turns[0].voice_id ? voiceName(result.turns[0].voice_id) : "";
        const y = result.turns[1].voice_id ? voiceName(result.turns[1].voice_id) : "";
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

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
