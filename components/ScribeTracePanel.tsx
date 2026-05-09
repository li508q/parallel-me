"use client";

/**
 * Layer 2 · ScribeTracePanel — DC-01 思考过程面板
 * 默认收起，按需展开。记录 Agent 每一步决策的时间线。
 */

import * as React from "react";
import type { ScribeStreamEvent } from "@/lib/agents/events";
import { narrate, type ScribeNarration } from "@/lib/scribe-narration";

export interface ScribeTracePanelProps {
  /** Accumulated stream events */
  events: ScribeStreamEvent[];
  /** Whether panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Interrupt/stop handler */
  onInterrupt?: () => void;
  /** Whether stream is active (shows interrupt button) */
  isStreaming?: boolean;
}

export function ScribeTracePanel({
  events,
  open,
  onClose,
  onInterrupt,
  isStreaming,
}: ScribeTracePanelProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, open]);

  return (
    <div
      className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
        open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div
        className="rounded-md border px-4 py-3"
        style={{
          backgroundColor: "var(--color-scribe-trace-bg, #fbfaf7)",
          borderColor: "var(--color-scribe-trace-border, #e8e1d4)",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: "#a8916b" }}>
            思考过程
          </span>
          <div className="flex items-center gap-2">
            {isStreaming && onInterrupt && (
              <button
                type="button"
                onClick={onInterrupt}
                className="rounded-md border px-2.5 py-1 text-xs hover:opacity-80 transition-opacity"
                style={{ borderColor: "#e8e1d4", color: "#5a4f44" }}
              >
                停在这里
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "#5a4f44" }}
            >
              收起
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#a8916b" }}>
              等待书记员开始工作。
            </p>
          ) : (
            events.map((event, index) => (
              <TraceEventRow key={index} event={event} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TraceEventRow({ event }: { event: ScribeStreamEvent }) {
  const timeStr = React.useMemo(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  }, []);

  if (event.type === "narration") {
    const text = narrate(event.stage as keyof ScribeNarration, event.key, event.payload);
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 tabular-nums text-xs" style={{ color: "#a8a8a8" }}>
          {timeStr}
        </span>
        <span style={{ color: "#5a4f44" }}>{text}</span>
      </div>
    );
  }

  if (event.type === "token") {
    return (
      <p className="ml-14 text-sm leading-relaxed" style={{ color: "#3d3529" }}>
        {event.text}
      </p>
    );
  }

  if (event.type === "tool") {
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 tabular-nums text-xs" style={{ color: "#a8a8a8" }}>
          {timeStr}
        </span>
        <span style={{ color: "#7a6e5e" }}>
          {event.state === "called" ? "调用" : "完成"} · {event.name}
          {event.detail ? ` · ${event.detail}` : ""}
        </span>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 tabular-nums text-xs" style={{ color: "#a8a8a8" }}>
          {timeStr}
        </span>
        <span className="text-red-600">{event.message}</span>
      </div>
    );
  }

  if (event.type === "result") {
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 tabular-nums text-xs" style={{ color: "#a8a8a8" }}>
          {timeStr}
        </span>
        <span style={{ color: "#5a8a5a" }}>结果已生成</span>
      </div>
    );
  }

  if (event.type === "done") {
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 tabular-nums text-xs" style={{ color: "#a8a8a8" }}>
          {timeStr}
        </span>
        <span style={{ color: "#5a8a5a" }}>{event.summary || "完成"}</span>
      </div>
    );
  }

  return null;
}
