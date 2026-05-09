"use client";

import * as React from "react";
import type { AgentStreamEvent } from "@/lib/agents/events";

export function AgentStreamView({
  events,
  onInterrupt,
}: {
  events: AgentStreamEvent[];
  onInterrupt?: () => void;
}) {
  return (
    <section className="rounded-md border border-paper-edge bg-paper-lift px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
          Agent Stream
        </div>
        {onInterrupt && (
          <button
            type="button"
            onClick={onInterrupt}
            className="rounded-md border border-paper-edge px-2.5 py-1 text-xs text-ink-mute hover:border-ink-core hover:text-ink-core"
          >
            停在这里
          </button>
        )}
      </div>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="font-serif text-body-sm text-ink-faint italic">等待书记员开始工作。</p>
        ) : (
          events.map((event, index) => <AgentEventRow key={index} event={event} />)
        )}
      </div>
    </section>
  );
}

function AgentEventRow({ event }: { event: AgentStreamEvent }) {
  if (event.type === "token") {
    return <p className="font-serif text-body text-ink-body leading-relaxed">{event.text}</p>;
  }
  if (event.type === "tool") {
    return (
      <div className="rounded-md border border-paper-edge bg-paper-base px-3 py-2 text-body-sm text-ink-body">
        <span className="text-ink-mute">{event.state === "called" ? "调用" : "完成"} · </span>
        {event.name}
        {event.detail ? <span className="text-ink-mute"> · {event.detail}</span> : null}
      </div>
    );
  }
  if (event.type === "result") {
    return <p className="text-body-sm text-ink-mute">结果已生成。</p>;
  }
  if (event.type === "error") {
    return <p className="text-body-sm text-seal-action">{event.message}</p>;
  }
  return (
    <p className="text-body-sm text-ink-mute">
      {event.label}
      {event.detail ? <span className="text-ink-faint"> · {event.detail}</span> : null}
    </p>
  );
}
