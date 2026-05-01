// /api/parallel — V2: GAN-inspired harness with dynamic pair selection + meta-critic
import { NextRequest } from "next/server";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  callSelf,
  crossExamine,
  callNowMeWithCritic,
  pickOpposingPairs,
  psychInsight,
  extractEpisode,
  type ContextBundle,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Frame =
  | { type: "self"; id: string; name: string; emoji: string; tagline: string; text: string }
  | { type: "cross"; from: string; fromId: string; to: string; toId: string; text: string }
  | { type: "now"; text: string }
  | { type: "insight"; text: string }
  | { type: "loudest"; id: string; name: string }
  | { type: "episode"; ep: any }
  | { type: "done" }
  | { type: "error"; message: string };

// 找最响的声音 — 长度 + 关键词强度 + 金句标记
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
  const ctx: ContextBundle | undefined = body.context; // 可选注入 me.md / taste / recent episode

  if (!input || typeof input !== "string" || input.length > 800) {
    return new Response(JSON.stringify({ error: "input required, max 800 chars" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (frame: Frame) => controller.enqueue(enc.encode(`data: ${JSON.stringify(frame)}\n\n`));

      try {
        // ─── Round 1: 5 分身并行（每个分身只看 user input + ctx，不看其他分身）
        const selfIds = Object.keys(SELVES) as SelfId[];
        const answers = await Promise.all(
          selfIds.map(async (id) => {
            const text = await callSelf(id, input, undefined, ctx);
            const me = SELVES[id];
            send({ type: "self", id, name: me.name, emoji: me.emoji, tagline: me.tagline, text });
            return { id, text };
          })
        );

        // ─── 动态选最对立的 2 对（取代固定 pair）
        const pairs = await pickOpposingPairs(answers);

        // ─── Round 2: cross-examine（动态 pair）
        for (const [from, to] of pairs) {
          const targetSaid = answers.find(a => a.id === to)?.text || "";
          const cross = await crossExamine(from, to, input, targetSaid);
          send({
            type: "cross",
            from: SELVES[from].name,
            fromId: from,
            to: SELVES[to].name,
            toId: to,
            text: cross,
          });
        }

        // ─── 找最响的声音
        const loudest = findLoudest(answers);
        send({ type: "loudest", id: loudest, name: SELVES[loudest].name });

        // ─── Round 3: 此刻的我（带 meta-critic 反中庸）
        const otherSays = answers.map(a => `[${SELVES[a.id].name}] ${a.text}`).join("\n\n");
        const nowText = await callNowMeWithCritic(input, otherSays, ctx);
        send({ type: "now", text: nowText });

        // ─── IFS 视角心理学解读
        const insight = await psychInsight(input, answers.map(a => a.text), loudest);
        send({ type: "insight", text: insight });

        // ─── 异步抽取 episode（带 importance 阈值过滤）
        try {
          const ep = await extractEpisode(input, answers, nowText, loudest);
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
