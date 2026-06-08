import { NextRequest } from "next/server";
import {
  crisisMessage,
  detectCrisis,
  generateTaskFrame,
  type ContextBundle,
} from "@/lib/llm";
import { agentEventStream, type AgentStreamEvent } from "@/lib/agents/events";
import { scribeDefiningAgentSpec } from "@/lib/agents/scribe-defining";
import { runtimeFromProvider } from "@/lib/server-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawInput = String(body.rawInput || "");
  const choiceAnswers = Array.isArray(body.choiceAnswers) ? body.choiceAnswers : [];
  const context = body.context as ContextBundle | undefined;
  const llmRuntime = runtimeFromProvider(body.provider);

  if (!llmRuntime) {
    return new Response(agentEventStream(singleError("provider required")), streamHeaders());
  }
  if (detectCrisis(rawInput)) {
    return new Response(agentEventStream(singleError(crisisMessage())), streamHeaders());
  }

  async function* events(): AsyncIterable<AgentStreamEvent> {
    yield {
      type: "status",
      label: "书记员开始整理",
      detail: `${scribeDefiningAgentSpec.id} · sufficiency-gated`,
    };
    yield { type: "tool", name: "analyzeInput", state: "called", detail: "读取原始输入与已回答选择卡" };
    yield { type: "tool", name: "analyzeInput", state: "completed" };
    yield { type: "tool", name: "generateTaskFrame", state: "called", detail: "生成议题卡与选择卡" };
    const result = await generateTaskFrame(rawInput, choiceAnswers, context, llmRuntime);
    yield { type: "tool", name: "generateTaskFrame", state: "completed" };
    yield { type: "result", payload: result };
  }

  return new Response(agentEventStream(events()), streamHeaders());
}

function streamHeaders(): ResponseInit {
  return {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  };
}

async function* singleError(message: string): AsyncIterable<AgentStreamEvent> {
  yield { type: "error", message };
}
