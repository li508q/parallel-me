// /api/focus — 陈情追问 + 工作焦点
// Stateless: receives provider/context in the request and persists nothing.

import { NextRequest, NextResponse } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateFocus,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const petition = String(body.petition || "").trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = toRuntime(body.provider);
  if (!llmRuntime) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  if (!petition || petition.length > 1200) {
    return NextResponse.json(
      { error: "petition required, max 1200 chars" },
      { status: 400 },
    );
  }

  const joined = `${petition}\n${answers.map((a: any) => `${a.question || ""} ${a.answer || ""}`).join("\n")}`;
  if (detectCrisis(joined)) {
    return NextResponse.json({ crisis: true, message: crisisMessage() });
  }

  try {
    const result = await generateFocus(petition, answers, context, llmRuntime);
    return NextResponse.json({ crisis: false, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "focus generation failed" },
      { status: 502 },
    );
  }
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
