// DC-01/DC-02 aligned event protocol
export type ScribeStreamEvent =
  | { type: "narration"; stage: string; key: string; payload?: Record<string, string | number> }
  | { type: "token"; text: string }
  | { type: "reasoning_delta"; source: string; text: string; mode?: "native" | "public" }
  | { type: "model_delta"; source: string; text: string }
  | { type: "object_delta"; source: string; payload: unknown }
  | { type: "tool"; name: string; state: "called" | "completed"; detail?: string }
  | { type: "llm_call_started"; operation: string; attempt: number; source?: string }
  | { type: "validation_failed"; operation: string; attempt: number; errors: string[]; source?: string }
  | { type: "repair_started"; operation: string; attempt: number; errors: string[]; source?: string }
  | { type: "retry_scheduled"; operation: string; attempt: number; delayMs: number; reason: string; source?: string }
  | { type: "recoverable_error"; operation: string; code?: string; message: string; retryable?: boolean; source?: string }
  | { type: "decision"; prompt: string; options: Array<{ id: string; label: string; subtitle?: string }> }
  | { type: "result"; payload: unknown }
  | { type: "error"; message: string; code?: string; retryable?: boolean }
  | { type: "done"; summary?: string };

export type ScribeEmit = (event: ScribeStreamEvent) => void;

function withDefaultSource(event: ScribeStreamEvent, source: string): ScribeStreamEvent {
  switch (event.type) {
    case "reasoning_delta":
    case "model_delta":
    case "object_delta":
      return event.source ? event : { ...event, source };
    case "llm_call_started":
    case "validation_failed":
    case "repair_started":
    case "retry_scheduled":
    case "recoverable_error":
      return event.source ? event : { ...event, source };
    default:
      return event;
  }
}

export function scribeModelStream(emit: ScribeEmit, source: string) {
  return {
    onToken: (text: string) => emit({ type: "model_delta", source, text }),
    onPartial: (payload: unknown) => emit({ type: "object_delta", source, payload }),
    onReasoning: (
      text: string,
      meta?: { source?: string; mode?: "native" | "public" },
    ) => emit({
      type: "reasoning_delta",
      source: meta?.source || source,
      text,
      mode: meta?.mode,
    }),
    onEvent: (event: ScribeStreamEvent) => emit(withDefaultSource(event, source)),
  };
}

export function encodeEvent(event: ScribeStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

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
        emit({
          type: "error",
          message: error?.message || "书记员这一步没整理好，请重试一次。",
          code: error?.code,
          retryable: error?.retryable,
        });
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
