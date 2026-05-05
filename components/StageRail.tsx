// P0 component · 阶段轨 (StageRail)
// The spine of every session. Desktop: horizontal at top of stage column.
// Mobile: pinned to bottom. Always shows where the user is, never blinks.

"use client";

import * as React from "react";

export interface StageItem {
  id: string;
  label: string;
}

interface StageRailProps {
  stages: StageItem[];
  current: string;          // id of current stage
  done?: string[];          // ids of stages already passed
  className?: string;
}

export function StageRail({
  stages,
  current,
  done = [],
  className = "",
}: StageRailProps) {
  const isDone = (id: string) => done.includes(id);
  const isCurrent = (id: string) => id === current;

  return (
    <div
      className={[
        "flex items-center gap-2 text-xs text-ink-mute",
        className,
      ].join(" ")}
      role="navigation"
      aria-label="会谈阶段"
    >
      {stages.map((s, i) => {
        const dotState = isCurrent(s.id) || isDone(s.id) ? "active" : "future";
        return (
          <React.Fragment key={s.id}>
            <span className="flex items-center gap-2">
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  dotState === "active" ? "bg-ink-core" : "bg-paper-edge",
                  isCurrent(s.id) ? "ring-2 ring-ink-core/20" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "tracking-wider uppercase transition-colors",
                  isCurrent(s.id)
                    ? "text-ink-core font-medium"
                    : isDone(s.id)
                      ? "text-ink-mute"
                      : "text-ink-faint",
                ].join(" ")}
              >
                {s.label}
              </span>
            </span>
            {i < stages.length - 1 && (
              <span
                className={[
                  "w-4 h-px transition-colors",
                  isDone(s.id) ? "bg-ink-core" : "bg-paper-edge",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
