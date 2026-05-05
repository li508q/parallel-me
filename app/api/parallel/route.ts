// /api/parallel — SSE: GAN-inspired harness, now provider-aware and mode-aware
//   - mode="quick" (default for /meeting): 3 seats by topic, no cross-exam
//   - mode="full"  (V2 legacy main page): 5 seats + dynamic pair + cross-exam
//   - body.provider.{baseUrl,model,apiKey} threads through every LLM call so
//     the user-supplied key from /setup actually drives the meeting.

import { NextRequest } from "next/server";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  callSelf,
  crossExamine,
  crossExamRespond,
  callNowMeWithCritic,
  pickOpposingPairs,
  psychInsight,
  extractEpisode,
  classifyTopic,
  type ContextBundle,
  type LlmRuntime,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Frame =
  | { type: "self"; id: string; name: string; emoji: string; tagline: string; text: string }
  | { type: "cross"; from: string; fromId: string; to: string; toId: string; text: string }
  | { type: "cross_response"; fromId: string; from: string; text: string }
  | { type: "now"; text: string }
  | { type: "insight"; text: string }
  | { type: "loudest"; id: string; name: string }
  | { type: "episode"; ep: any }
  | { type: "done" }
  | { type: "error"; message: string };

const QUICK_SEATS_BY_TOPIC: Record<ReturnType<typeof classifyTopic>, SelfId[]> = {
  career:       ["money", "lay", "future"],
  relationship: ["filial", "lay", "roam"],
  family:       ["filial", "future", "lay"],
  money:        ["money", "future", "lay"],
  lifestyle:    ["roam", "lay", "future"],
  general:      ["lay", "money", "future"],
};

function findLoudest(answers: { id: SelfId; text: string }[]): SelfId {
  const score = (t: string) => {
    let s = t.length;
    s += (t.match(/[!！？?]/g) || []).length * 8;
    s += (t.match(/(必须|绝对|永远|一定|根本|真的|只是)/g) || []).length * 6;
    s += (t.match(/——/g) || []).length * 4;
    return s;
  };
  return [...answers].sort((a, b) => score(b.text) - score(a.text))[0].id;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input: string = body.input;
  const ctx: ContextBundle | undefined = body.context;
  const mode: "quick" | "full" = body.mode === "quick" ? "quick" : "full";

  // User-supplied provider override (from Setup Wizard).
  const provider = body.provider as
    | { baseUrl?: string; model?: string; apiKey?: string }
    | undefined;
  const runtime: LlmRuntime | undefined =
    provider && (provider.apiKey || provider.baseUrl || provider.model)
      ? { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKey }
      : undefined;

  if (!input || typeof input !== "string" || input.length > 800) {
    return new Response(JSON.stringify({ error: "input required, max 800 chars" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (frame: Frame) => controller.enqueue(enc.encode(`data: ${JSON.stringify(frame)}\n\n`));

      try {
        // ─── Decide seat lineup
        const allSelfIds = Object.keys(SELVES) as SelfId[];
        const selfIds: SelfId[] =
          mode === "quick"
            ? (QUICK_SEATS_BY_TOPIC[classifyTopic(input)] ?? ["lay", "money", "future"])
            : allSelfIds;

        // ─── Round 1: 并行 selves
        const answers = await Promise.all(
          selfIds.map(async (id) => {
            const text = await callSelf(id, input, undefined, ctx, runtime);
            const me = SELVES[id];
            send({ type: "self", id, name: me.name, emoji: me.emoji, tagline: me.tagline, text });
            return { id, text };
          })
        );

        // ─── Round 2: cross-examine — full mode only
        // Week 5: each cross is now followed by the addressed seat's response
        // so the timeline shows a real exchange, not a one-sided question.
        if (mode === "full") {
          const pairs = await pickOpposingPairs(answers, runtime);
          for (const [from, to] of pairs) {
            const targetSaid = answers.find(a => a.id === to)?.text || "";
            const cross = await crossExamine(from, to, input, targetSaid, runtime);
            send({
              type: "cross",
              from: SELVES[from].name,
              fromId: from,
              to: SELVES[to].name,
              toId: to,
              text: cross,
            });
            try {
              const reply = await crossExamRespond(to, from, input, cross, runtime);
              send({
                type: "cross_response",
                fromId: to,
                from: SELVES[to].name,
                text: reply,
              });
            } catch (e) {
              console.warn("[cross-response] failed", e);
            }
          }
        }

        // ─── 找最响的声音
        const loudest = findLoudest(answers);
        send({ type: "loudest", id: loudest, name: SELVES[loudest].name });

        // ─── Round 3: 此刻的我（meta-critic 反中庸）
        const otherSays = answers.map(a => `[${SELVES[a.id].name}] ${a.text}`).join("\n\n");
        const nowText = await callNowMeWithCritic(input, otherSays, ctx, runtime);
        send({ type: "now", text: nowText });

        // ─── IFS 视角心理学解读
        const insight = await psychInsight(input, answers.map(a => a.text), loudest, runtime);
        send({ type: "insight", text: insight });

        // ─── 异步抽取 episode（importance 阈值过滤）
        try {
          const ep = await extractEpisode(input, answers, nowText, loudest, runtime);
          if (ep) send({ type: "episode", ep });
        } catch (e) {
          console.warn("[episode] extract failed", e);
        }

        send({ type: "done" });
        controller.close();
      } catch (e: any) {
        send({ type: "error", message: e?.message || String(e) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
