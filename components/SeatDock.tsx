// V3 Week 5 · SeatDock — persistent ribbon of seats at the top of /meeting.
// Seats are *in the room* the entire meeting, even when they aren't speaking.

"use client";

import * as React from "react";
import { SELVES, type SelfId } from "@/lib/selves";

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay:    "color-seat-rest",
  money:  "color-seat-money",
  roam:   "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

export interface SeatDockProps {
  seatIds: SelfId[];
  /** Currently emitting tokens. Pulses. */
  speakingId?: SelfId | null;
  /** Marked as loudest by the verdict event. */
  loudestId?: SelfId | null;
  /** User has called on this seat (for follow-up). */
  calledId?: SelfId | null;
  /** Seats that have already finished speaking (less prominent dot). */
  spokenIds?: SelfId[];
  /** Whether tapping a chip should call on that seat. */
  callable?: boolean;
  onCall?: (id: SelfId) => void;
}

export function SeatDock({
  seatIds,
  speakingId,
  loudestId,
  calledId,
  spokenIds = [],
  callable = false,
  onCall,
}: SeatDockProps) {
  return (
    <nav
      aria-label="本次组阁"
      className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-x-visible py-2 -mx-1 px-1"
    >
      {seatIds.map((id) => {
        const seat = SELVES[id];
        if (!seat) return null;

        const isSpeaking = speakingId === id;
        const isCalled = calledId === id;
        const isLoudest = loudestId === id;
        const hasSpoken = spokenIds.includes(id);

        const colorVar = SEAT_COLOR_VAR[id];
        const dotClass = `w-1.5 h-1.5 rounded-full ${
          isSpeaking ? "animate-soft-pulse" : ""
        }`;

        const stateClass = isCalled
          ? "ring-1 ring-ink-core border-ink-core"
          : isLoudest
            ? "ring-1 ring-attention-copper/60 border-attention-copper/40"
            : isSpeaking
              ? "border-ink-mute"
              : "border-paper-edge";

        const opacity = !isSpeaking && !isCalled && !isLoudest && hasSpoken
          ? "opacity-70"
          : "";

        const inner = (
          <span
            className={[
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-lift border text-xs whitespace-nowrap transition-all",
              stateClass,
              opacity,
              callable ? "hover:border-ink-core cursor-pointer" : "",
            ].join(" ")}
            style={{
              borderLeft: `2px solid var(--${colorVar})`,
            }}
          >
            <span className={dotClass} style={{ background: `var(--${colorVar})` }} />
            <span className="text-ink-core font-medium">{seat.name}</span>
            {isLoudest && (
              <span className="text-[9px] tracking-wider text-attention-copper uppercase">
                最响
              </span>
            )}
          </span>
        );

        return callable && onCall ? (
          <button
            key={id}
            type="button"
            onClick={() => onCall(id)}
            title={`点名 ${seat.name}`}
            className="appearance-none bg-transparent p-0 border-0"
          >
            {inner}
          </button>
        ) : (
          <span key={id} title={seat.ifs_label}>
            {inner}
          </span>
        );
      })}
    </nav>
  );
}
