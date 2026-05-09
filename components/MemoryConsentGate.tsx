// Trust moat · Memory Consent Gate
// Every session ends here: 3 candidate memories the user's voices may keep,
// shown to the user with three honest paths — keep all, pick by hand, drop.

"use client";

import * as React from "react";
import type { MemoryCandidate } from "@/lib/db";

interface MemoryConsentGateProps {
  candidates: MemoryCandidate[];
  onDecide: (savedIds: string[]) => void;
  className?: string;
}

const CATEGORY_LABEL: Record<MemoryCandidate["category"], string> = {
  clarity: "清明句",
  preference: "偏好读数",
  tradeoff: "代价承认",
  commitment: "24h 承诺",
};

export function MemoryConsentGate({
  candidates,
  onDecide,
  className = "",
}: MemoryConsentGateProps) {
  const [granular, setGranular] = React.useState(false);
  const [keepIds, setKeepIds] = React.useState<Set<string>>(
    () => new Set(candidates.map((c) => c.id))
  );

  function toggle(id: string) {
    setKeepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section
      className={[
        "bg-paper-lift border border-paper-edge rounded-lg",
        "px-6 sm:px-8 py-6 sm:py-7",
        "shadow-[0_1px_0_rgba(25,23,19,0.04),0_2px_6px_rgba(25,23,19,0.04)]",
        className,
      ].join(" ")}
    >
      <header className="mb-5">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
          这次想记住
        </div>
        <h2 className="font-serif text-title text-ink-core leading-tight">
          {candidates.length === 1 ? "一件事" : `${candidates.length} 件事`}
        </h2>
        <p className="mt-2 text-body-sm text-ink-mute">
          只有你说可以的，才会写进纸页。它从这台设备走不出去。
        </p>
      </header>

      <ol className="space-y-3 mb-6">
        {candidates.map((c, i) => {
          const checked = keepIds.has(c.id);
          return (
            <li
              key={c.id}
              className={[
                "flex items-start gap-3 p-3 rounded-md border transition-colors",
                granular
                  ? checked
                    ? "border-ink-core bg-paper-base"
                    : "border-paper-edge bg-paper-lift opacity-50"
                  : "border-paper-edge bg-paper-base",
              ].join(" ")}
            >
              <span className="text-body-sm text-ink-faint font-mono w-5 shrink-0 mt-0.5">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-body text-ink-body leading-snug">
                  {c.statement}
                </div>
                <div className="mt-1 text-[10px] tracking-wider text-ink-faint uppercase">
                  {CATEGORY_LABEL[c.category]}
                </div>
              </div>
              {granular && (
                <label className="shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={[
                      "block w-5 h-5 rounded border-2 transition-all",
                      checked
                        ? "bg-ink-core border-ink-core"
                        : "border-paper-edge",
                    ].join(" ")}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="w-full h-full text-paper-lift"
                      >
                        <path
                          d="M5 10.5l3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </label>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap gap-3 items-center pt-4 border-t border-paper-edge">
        {!granular ? (
          <>
            <button
              onClick={() => onDecide(candidates.map((c) => c.id))}
              className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
            >
              全部记住
            </button>
            <button
              onClick={() => setGranular(true)}
              className="px-4 py-2 rounded-md text-body-sm text-ink-body hover:text-ink-core hover:bg-paper-base transition-colors"
            >
              逐条确认
            </button>
            <button
              onClick={() => onDecide([])}
              className="ml-auto px-4 py-2 rounded-md text-body-sm text-ink-mute hover:text-ink-core hover:bg-paper-base transition-colors"
            >
              这次不记
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onDecide(Array.from(keepIds))}
              className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
            >
              {keepIds.size > 0
                ? `保存这 ${keepIds.size} 条`
                : "全部不记"}
            </button>
            <button
              onClick={() => setGranular(false)}
              className="px-4 py-2 rounded-md text-body-sm text-ink-mute hover:text-ink-core hover:bg-paper-base transition-colors"
            >
              ← 返回
            </button>
          </>
        )}
      </footer>
    </section>
  );
}
