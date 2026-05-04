// V3 Week 5 · MeetingTimeline — the long scroll where every turn lives.
// Auto-scrolls to bottom on new entries unless the user has scrolled up.

"use client";

import * as React from "react";
import { TurnEntry, type TurnEntryProps } from "./TurnEntry";

export interface TimelineEntry extends TurnEntryProps {
  /** Stable key. */
  key: string;
}

export interface MeetingTimelineProps {
  entries: TimelineEntry[];
  /** Render a custom node at the bottom of the timeline (e.g. inline buttons). */
  trailing?: React.ReactNode;
  className?: string;
}

export function MeetingTimeline({
  entries,
  trailing,
  className = "",
}: MeetingTimelineProps) {
  const endRef = React.useRef<HTMLDivElement>(null);
  const stickRef = React.useRef(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Detect if user has scrolled up — if so, stop forcing scroll-to-bottom.
  React.useEffect(() => {
    function onScroll() {
      const root = document.scrollingElement || document.documentElement;
      const distanceFromBottom =
        root.scrollHeight - (root.scrollTop + root.clientHeight);
      stickRef.current = distanceFromBottom < 200;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!stickRef.current) return;
    const id = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [entries.length, trailing]);

  return (
    <div ref={containerRef} className={className}>
      {entries.map((e) => {
        const { key, ...rest } = e;
        return <TurnEntry key={key} {...rest} />;
      })}
      {trailing}
      <div ref={endRef} />
    </div>
  );
}
