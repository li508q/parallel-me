// P0 component · 24h 承诺条 (SignatureSlip)
// The emotional peak: the verdict carved on a deep-ink ritual surface, with
// three honest exits — commit / defer / "I'm avoiding". 24h action is editable
// because users own their own commitment. Surface uses surface-deep token.

"use client";

import * as React from "react";

interface SignatureSlipProps {
  verdict: string;
  defaultAction24h?: string;
  onSign: (action: string) => void;
  className?: string;
}

export function SignatureSlip({
  verdict,
  defaultAction24h = "",
  onSign,
  className = "",
}: SignatureSlipProps) {
  const [action, setAction] = React.useState(defaultAction24h);
  const [saved, setSaved] = React.useState(false);

  const trimmed = action.trim();
  const canSign = trimmed.length > 0 && !saved;

  function handleSign() {
    if (!canSign) return;
    setSaved(true);
    onSign(trimmed);
  }

  return (
    <article
      className={[
        "rounded-lg overflow-hidden",
        "bg-surface-deep text-paper-lift",
        "shadow-[0_8px_16px_rgba(25,23,19,0.12),0_24px_48px_-16px_rgba(25,23,19,0.18)]",
        className,
      ].join(" ")}
    >
      <header className="px-6 sm:px-8 pt-6 pb-3 border-b border-paper-lift/10">
        <div className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase">
          清明落定
        </div>
      </header>

      <div className="px-6 sm:px-8 pt-5 pb-2">
        <p className="font-serif text-verdict text-paper-lift leading-relaxed whitespace-pre-line">
          {verdict}
        </p>
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-paper-lift/10">
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase block mb-2">
            接下来 24 小时，你愿意做的一步
          </span>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value.slice(0, 200))}
            disabled={saved}
            rows={2}
            placeholder="一个具体的、24 小时之内可执行的小动作"
            className="w-full bg-transparent border-b border-paper-lift/30 focus:border-paper-lift/70 outline-none py-2 text-body text-paper-lift placeholder-paper-lift/30 font-serif resize-none transition-colors disabled:opacity-60"
          />
        </label>
      </div>

      <footer className="px-6 sm:px-8 py-5 border-t border-paper-lift/10 flex flex-wrap gap-3 items-center">
        <button
          onClick={handleSign}
          disabled={!canSign}
          className="px-5 py-2.5 rounded-md bg-paper-lift text-ink-core text-body-sm font-medium hover:bg-paper-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {saved ? "已落定" : "保存承诺"}
        </button>
      </footer>

      {saved && (
        <div className="px-6 sm:px-8 py-3 bg-paper-lift/5 text-body-sm text-paper-lift/70 italic font-serif">
          已写下。不是完美答案，是先走一步。
        </div>
      )}
    </article>
  );
}
