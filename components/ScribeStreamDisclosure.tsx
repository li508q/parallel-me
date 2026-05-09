"use client";

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, LoaderCircle } from "lucide-react";
import type { ScribeStreamEvent } from "@/lib/agents/events";
import { narrate, type ScribeNarration } from "@/lib/scribe-narration";

export interface ScribeStreamDisclosureProps {
  narration?: string;
  events?: ScribeStreamEvent[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
}

export function ScribeStreamDisclosure({
  narration,
  events = [],
  open,
  onOpenChange,
  compact,
}: ScribeStreamDisclosureProps) {
  const [internalOpen, setInternalOpen] = React.useState(true);
  const expanded = open ?? internalOpen;
  const displayText = narration || latestNarration(events) || "书记员正在思考…";
  const trace = React.useMemo(() => publicTrace(events), [events]);

  return (
    <Collapsible.Root
      open={expanded}
      onOpenChange={onOpenChange ?? setInternalOpen}
      className="w-full"
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className={[
            "group flex items-center rounded-2xl rounded-tl-sm bg-paper-lift text-left transition-opacity hover:opacity-85",
            compact
              ? "max-w-[85%] gap-2 px-4 py-2.5"
              : "w-full gap-3 border border-paper-edge px-5 py-3.5 shadow-sm hover:border-ink-mute",
          ].join(" ")}
        >
          <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-ink-faint" />
          <span className="min-w-0 flex-1 truncate text-sm text-ink-mute">
            {displayText}
          </span>
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-md leading-none text-ink-body transition-transform",
              expanded ? "rotate-180" : "",
              compact ? "h-6 w-6" : "h-10 w-10 border border-paper-edge bg-paper-base",
            ].join(" ")}
            aria-hidden="true"
          >
            <ChevronDown className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </span>
        </button>
      </Collapsible.Trigger>

      {trace.reasoning ? (
        <Collapsible.Content>
          <div className="mt-2 overflow-hidden rounded-xl border border-paper-edge bg-paper-base shadow-sm">
            <ScribeReasoningTrace trace={trace} />
          </div>
        </Collapsible.Content>
      ) : null}
    </Collapsible.Root>
  );
}

function ScribeReasoningTrace({ trace }: { trace: PublicTrace }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [trace.reasoning.length]);

  return (
    <div className="p-3">
      <div
        ref={scrollRef}
        className="max-h-[320px] overflow-y-auto rounded-lg bg-paper-lift px-4 py-4 text-sm leading-relaxed text-ink-body"
      >
        <p className="whitespace-pre-wrap">{trace.reasoning}</p>
      </div>
    </div>
  );
}

function latestNarration(events: ScribeStreamEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type === "narration") {
      return narrate(event.stage as keyof ScribeNarration, event.key, event.payload);
    }
  }
  return "";
}

interface PublicTrace {
  reasoning: string;
}

function publicTrace(events: ScribeStreamEvent[]): PublicTrace {
  let reasoning = "";
  for (const event of events) {
    if (event.type === "reasoning_delta") {
      reasoning += event.text;
    } else if (event.type === "token") {
      reasoning += event.text;
    }
  }
  return { reasoning: reasoning.trim() };
}
