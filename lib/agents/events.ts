// Legacy generic event type (kept for backward compat)
export type AgentStreamEvent =
  | { type: "status"; label: string; detail?: string }
  | { type: "token"; text: string }
  | { type: "tool"; name: string; state: "called" | "completed"; detail?: string }
  | { type: "result"; payload: unknown }
  | { type: "error"; message: string };

// DC-01/DC-02 aligned event protocol
export type ScribeStreamEvent =
  | { type: "narration"; stage: string; key: string; payload?: Record<string, string | number> }
  | { type: "token"; text: string }
  | { type: "tool"; name: string; state: "called" | "completed"; detail?: string }
  | { type: "decision"; prompt: string; options: Array<{ id: string; label: string; subtitle?: string }> }
  | { type: "result"; payload: unknown }
  | { type: "error"; message: string }
  | { type: "done"; summary?: string };

export function encodeEvent(event: ScribeStreamEvent | AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** @deprecated use encodeEvent */
export const encodeAgentEvent = encodeEvent;

export function scribeEventStream(
  generate: (emit: (event: ScribeStreamEvent) => void) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const emit = (event: ScribeStreamEvent) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };
      try {
        await generate(emit);
      } catch (error: any) {
        emit({ type: "error", message: error?.message || "stream failed" });
      } finally {
        controller.close();
      }
    },
  });
}

/** Legacy stream helper */
export function agentEventStream(events: AsyncIterable<AgentStreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        }
      } catch (error: any) {
        controller.enqueue(encoder.encode(encodeEvent({ type: "error", message: error?.message || "agent stream failed" })));
      } finally {
        controller.close();
      }
    },
  });
}

/** Standard SSE response headers */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;
