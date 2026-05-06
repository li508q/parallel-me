// /api/task-frame — v0.7 本次议题 + 高密度选择卡

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateTaskFrame,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawInput = String(body.rawInput || "").trim();
  const choiceAnswers = Array.isArray(body.choiceAnswers) ? body.choiceAnswers : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);

  if (!llmRuntime) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!rawInput || rawInput.length > 1200) {
    return NextResponse.json({ error: "rawInput required, max 1200 chars" }, { status: 400 });
  }
  if (detectCrisis(`${rawInput}\n${JSON.stringify(choiceAnswers)}`)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  try {
    const result = await generateTaskFrame(rawInput, choiceAnswers, context, llmRuntime);
    return NextResponse.json({ crisis: false, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "task frame generation failed" }, { status: 502 });
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
