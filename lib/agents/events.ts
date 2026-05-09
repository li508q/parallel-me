export type AgentStreamEvent =
  | { type: "status"; label: string; detail?: string }
  | { type: "token"; text: string }
  | { type: "tool"; name: string; state: "called" | "completed"; detail?: string }
  | { type: "result"; payload: unknown }
  | { type: "error"; message: string };

export function encodeAgentEvent(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function agentEventStream(events: AsyncIterable<AgentStreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeAgentEvent(event)));
        }
      } catch (error: any) {
        controller.enqueue(encoder.encode(encodeAgentEvent({ type: "error", message: error?.message || "agent stream failed" })));
      } finally {
        controller.close();
      }
    },
  });
}
