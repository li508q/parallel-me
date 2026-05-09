// /api/provider/test — Connection test for a user-supplied provider config.
// Stateless: the server forwards a single 1-token chat-completion request and
// returns { ok, model, latencyMs, error? }. Nothing is persisted.
//
// Local-first provider boundary: API keys are forwarded per request and are not persisted server-side.

import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "无效请求体" }, { status: 400 });
  }
  const { baseUrl, model, apiKey } = body || {};
  if (!baseUrl || !model || !apiKey) {
    return Response.json(
      { ok: false, error: "baseUrl / model / apiKey 三项必填" },
      { status: 400 }
    );
  }

  const url = `${String(baseUrl).replace(/\/+$/, "")}/chat/completions`;
  const start = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
        temperature: 0.2,
      }),
      // Reasonable timeout — providers vary, but we don't want to hang the UI.
      signal: AbortSignal.timeout(15_000),
    });
    const latencyMs = Date.now() - start;

    if (!r.ok) {
      const txt = (await r.text()).slice(0, 300);
      return Response.json({
        ok: false,
        error: `HTTP ${r.status}：${txt}`,
        latencyMs,
      });
    }
    const j: any = await r.json().catch(() => null);
    return Response.json({
      ok: true,
      model: j?.model || model,
      latencyMs,
    });
  } catch (e: any) {
    return Response.json({
      ok: false,
      error:
        e?.name === "TimeoutError"
          ? "请求超时（15s）。检查 base URL 是否可达。"
          : e?.message || "网络错误（检查 base URL 与网络连接）",
      latencyMs: Date.now() - start,
    });
  }
}
