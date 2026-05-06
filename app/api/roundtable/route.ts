// /api/roundtable — v0.7 fixed five-voice opening and free roundtable moves.

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

  try {
    if (action === "opening") {
      const openingTurns = await generateOpeningTurns(taskFrame, context, llmRuntime);
      return NextResponse.json({ crisis: false, openingTurns });
    }

    if (action === "move") {
      const input: RoundtableMoveInput = {
        moveType: body.moveType,
        taskFrame,
        roundtable: body.roundtable,
        targetVoiceId: body.targetVoiceId,
        fromVoiceId: body.fromVoiceId,
        toVoiceId: body.toVoiceId,
        userText: body.userText,
      };
      const result = await generateRoundtableMove(input, context, llmRuntime);
      return NextResponse.json({ crisis: false, ...result });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "roundtable generation failed" }, { status: 502 });
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
