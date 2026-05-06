// P0 component · 纸面 (DocketPaper)
// The paper-lift surface that holds raw inputs, task frames, settlements, and
// archives.

import * as React from "react";

interface DocketPaperProps {
  /** Uppercase tracker label that floats top-left, e.g. "陈情" or "清明句". */
  stage?: string;
  /** Optional small node rendered top-right (e.g. issue number, timestamp). */
  meta?: React.ReactNode;
  /** Optional Marginalia-style sidenote rendered after the body. */
  marginalia?: React.ReactNode;
  /** Tighter padding for inline use. */
  dense?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DocketPaper({
  stage,
  meta,
  marginalia,
  dense,
  className = "",
  children,
}: DocketPaperProps) {
  return (
    <article
      className={[
        "relative bg-paper-lift border border-paper-edge rounded-lg",
        dense ? "px-5 py-4" : "px-6 sm:px-8 py-6 sm:py-7",
        "shadow-[0_1px_0_rgba(25,23,19,0.04),0_2px_6px_rgba(25,23,19,0.04)]",
        className,
      ].join(" ")}
    >
      {(stage || meta) && (
        <header className="flex items-baseline justify-between gap-3 mb-4">
          {stage && (
            <span className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
              {stage}
            </span>
          )}
          {meta && <div className="text-xs text-ink-faint">{meta}</div>}
        </header>
      )}
      <div className="text-ink-body">{children}</div>
      {marginalia && (
        <div className="mt-5 pt-4 border-t border-paper-edge text-body-sm text-ink-mute italic font-serif">
          {marginalia}
        </div>
      )}
    </article>
  );
}
