// /api/followup — 用户向某个分身追问
import { NextRequest, NextResponse } from "next/server";
import { followUp } from "@/lib/llm";
import { SELVES, type SelfId } from "@/lib/selves";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { selfId, userInput, prevAnswer, question } = await req.json().catch(() => ({}));
  if (!selfId || !(selfId in SELVES)) return NextResponse.json({ error: "bad selfId" }, { status: 400 });
  if (!question || typeof question !== "string" || question.length > 300) {
    return NextResponse.json({ error: "question required, max 300" }, { status: 400 });
  }
  const text = await followUp(selfId as SelfId, userInput || "", prevAnswer || "", question);
  return NextResponse.json({ text, name: SELVES[selfId as SelfId].name });
}
