// /api/taste — extract identity hint from user's books/films/music
import { NextRequest, NextResponse } from "next/server";
import { extractTasteProfile, type LlmRuntime, type TasteInput } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.books || !body.films || !body.music) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const llmRuntime = toRuntime(body.provider);
  if (!llmRuntime) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }
  // 只把必要字段传给 LLM，过滤空
  const cleaned: TasteInput = {
    books: (body.books || []).filter((x: any) => x.title?.trim()).map((x: any) => ({ title: x.title, why: x.why })),
    films: (body.films || []).filter((x: any) => x.title?.trim()).map((x: any) => ({ title: x.title, why: x.why })),
    music: (body.music || []).filter((x: any) => x.title?.trim()).map((x: any) => ({ title: x.title, why: x.why })),
  };
  const total = cleaned.books.length + cleaned.films.length + cleaned.music.length;
  if (total < 3) {
    return NextResponse.json({ error: "need at least 3 items total" }, { status: 400 });
  }
  const profile = await extractTasteProfile(cleaned, llmRuntime);
  if (!profile) {
    return NextResponse.json({ error: "extraction failed" }, { status: 500 });
  }
  return NextResponse.json({ profile });
}

function toRuntime(provider: any): LlmRuntime | undefined {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return undefined;
  return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey };
}
