// /api/followup — 用户向某个分身追问（带 context 注入 + V3 provider 透传）
import { NextRequest, NextResponse } from "next/server";
import { followUp, type ContextBundle, type LlmRuntime } from "@/lib/llm";
import { SELVES, type SelfId } from "@/lib/selves";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { selfId, userInput, prevAnswer, question, context, provider } = body as any;
  if (!selfId || !(selfId in SELVES)) return NextResponse.json({ error: "bad selfId" }, { status: 400 });
  if (!question || typeof question !== "string" || question.length > 300) {
    return NextResponse.json({ error: "question required, max 300" }, { status: 400 });
  }
  const runtime: LlmRuntime | undefined =
    provider && (provider.apiKey || provider.baseUrl || provider.model)
      ? { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey }
      : undefined;
  const text = await followUp(
    selfId as SelfId,
    userInput || "",
    prevAnswer || "",
    question,
    context as ContextBundle | undefined,
    runtime,
  );
  return NextResponse.json({ text, name: SELVES[selfId as SelfId].name });
}
