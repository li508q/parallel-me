// P0 component · 声音牌 (SeatNameplate)
// Identifies a voice in the session with a dot, left border accent, and name.
// State drives visual emphasis.

"use client";

import * as React from "react";
import type { SelfId } from "@/lib/selves";

export type SeatState =
  | "default"        // resting on the table
  | "speaking"       // currently emitting tokens (during streaming)
  | "called"         // user has called on this seat
  | "interrogated"   // being asked by another voice
  | "silent"         // long absent, low-opacity
  | "exiled";        // exiled — small footprint, never threatening

interface SeatNameplateProps {
  seatId: SelfId;
  name: string;
  ifsLabel?: string;
  state?: SeatState;
  text?: string;             // opening statement when present
  onCall?: () => void;       // user calls on this seat
  onAsk?: () => void;        // user wants to follow up with this seat
  className?: string;
}

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay:    "var(--color-seat-rest)",
  money:  "var(--color-seat-money)",
  roam:   "var(--color-seat-roam)",
  filial: "var(--color-seat-filial)",
  future: "var(--color-seat-future)",
};

const STATE_RING: Record<SeatState, string> = {
  default:      "ring-0",
  speaking:     "ring-1 ring-ink-mute",
  called:       "ring-2 ring-ink-core",
  interrogated: "ring-2 ring-seal-action/60",
  silent:       "ring-0 opacity-60",
  exiled:       "ring-0 opacity-40",
};

export function SeatNameplate({
  seatId,
  name,
  ifsLabel,
  state = "default",
  text,
  onCall,
  onAsk,
  className = "",
}: SeatNameplateProps) {
  const accent = SEAT_COLOR_VAR[seatId];
  return (
    <div
      className={[
        "relative bg-paper-lift border border-paper-edge rounded-md transition-all",
        STATE_RING[state],
        className,
      ].join(" ")}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              state === "speaking" ? "animate-soft-pulse" : ""
            }`}
            style={{ background: accent }}
          />
          <span className="font-medium text-ink-core truncate">{name}</span>
          {ifsLabel && (
            <span className="text-[10px] tracking-wider text-ink-faint uppercase">
              {ifsLabel}
            </span>
          )}
        </div>
        {state === "called" && (
          <span className="text-[10px] tracking-[0.18em] text-ink-core uppercase">
            被点名
          </span>
        )}
        {state === "speaking" && (
          <span className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
            发言中
          </span>
        )}
        {state === "exiled" && (
          <span className="text-[10px] tracking-[0.18em] text-seal-action uppercase">
            被流放
          </span>
        )}
        {state === "silent" && (
          <span className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
            沉默
          </span>
        )}
      </div>

      {text && (
        <p className="px-4 pt-2 pb-3 text-body text-ink-body leading-relaxed whitespace-pre-line">
          {text}
        </p>
      )}

      {(onCall || onAsk) && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-3 text-xs">
          {onCall && (
            <button
              onClick={onCall}
              className="text-ink-mute hover:text-ink-core transition-colors underline-offset-4 hover:underline"
            >
              点名 →
            </button>
          )}
          {onAsk && (
            <button
              onClick={onAsk}
              className="text-ink-mute hover:text-ink-core transition-colors underline-offset-4 hover:underline"
            >
              追问 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
