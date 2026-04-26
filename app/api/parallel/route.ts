// /api/parallel — 5 分身并行 + cross-examine + 此刻的我 + 心理学解读
import { NextRequest } from "next/server";
import { SELVES, type SelfId } from "@/lib/selves";
import { callSelf, crossExamine, psychInsight } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Frame =
  | { type: "self"; id: string; name: string; emoji: string; tagline: string; text: string }
  | { type: "cross"; from: string; fromId: string; to: string; toId: string; text: string }
  | { type: "now"; text: string }
  | { type: "insight"; text: string }
  | { type: "loudest"; id: string; name: string }
  | { type: "done" }
  | { type: "error"; message: string };

// 投票算法：根据每个分身回答的"语义强度"判定哪个声音最响
function findLoudest(answers: { id: SelfId; text: string }[]): SelfId {
  // 启发式：长度 + 关键词强度（极端用词、绝对化句式、感叹）
  const score = (t: string) => {
    let s = t.length;
    s += (t.match(/[!！？?]/g) || []).length * 8;
    s += (t.match(/(必须|绝对|永远|一定|根本|真的|只是)/g) || []).length * 6;
    s += (t.match(/——/g) || []).length * 4;  // 金句标记
    return s;
  };
  return [...answers].sort((a,b) => score(b.text) - score(a.text))[0].id;
}

export async function POST(req: NextRequest) {
  const { input } = await req.json().catch(() => ({}));
  if (!input || typeof input !== "string" || input.length > 800) {
    return new Response(JSON.stringify({ error: "input required, max 800 chars" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (frame: Frame) => controller.enqueue(enc.encode(`data: ${JSON.stringify(frame)}\n\n`));

      try {
        // Round 1: 5 个分身并行
        const selfIds = Object.keys(SELVES) as SelfId[];
        const answers = await Promise.all(
          selfIds.map(async (id) => {
            const text = await callSelf(id, input);
            const me = SELVES[id];
            send({ type: "self", id, name: me.name, emoji: me.emoji, tagline: me.tagline, text });
            return { id, text };
          })
        );

        // Round 2: cross-examine（搞钱⇄躺平、出走⇄讨妈）
        const pairs: [SelfId, SelfId][] = [
          ["money", "lay"],
          ["lay", "money"],
          ["roam", "filial"],
          ["filial", "roam"]
        ];
        for (const [from, to] of pairs) {
          const targetSaid = answers.find(a => a.id === to)?.text || "";
          const cross = await crossExamine(from, to, input, targetSaid);
          send({ type: "cross", from: SELVES[from].name, fromId: from, to: SELVES[to].name, toId: to, text: cross });
        }

        // 找出最响的声音
        const loudest = findLoudest(answers);
        send({ type: "loudest", id: loudest, name: SELVES[loudest].name });

        // Round 3: 此刻的我
        const otherSays = answers.map(a => `[${SELVES[a.id as SelfId].name}] ${a.text}`).join("\n\n");
        const now = await callSelf("now", input, otherSays);
        send({ type: "now", text: now });

        // Bonus: 心理学解读
        const insight = await psychInsight(input, answers.map(a => a.text));
        send({ type: "insight", text: insight });

        send({ type: "done" });
        controller.close();
      } catch (e: any) {
        send({ type: "error", message: e?.message || String(e) });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
