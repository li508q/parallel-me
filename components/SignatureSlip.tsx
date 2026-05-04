// V3 P0 component · 签字条 (SignatureSlip)
// The emotional peak: the verdict carved on a deep-ink ritual surface, with
// three honest exits — sign / defer / "I'm avoiding". 24h action is editable
// because users own their own commitment. Surface uses surface-deep token.

"use client";

import * as React from "react";

interface SignatureSlipProps {
  verdict: string;
  loudestSeatName?: string;
  defaultAction24h?: string;
  onSign: (action: string) => void;
  onPause: () => void;
  onEscape: () => void;
  className?: string;
}

export function SignatureSlip({
  verdict,
  loudestSeatName,
  defaultAction24h = "",
  onSign,
  onPause,
  onEscape,
  className = "",
}: SignatureSlipProps) {
  const [action, setAction] = React.useState(defaultAction24h);
  const [signed, setSigned] = React.useState(false);

  const trimmed = action.trim();
  const canSign = trimmed.length > 0 && !signed;

  function handleSign() {
    if (!canSign) return;
    setSigned(true);
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
          会议决议
        </div>
      </header>

      <div className="px-6 sm:px-8 pt-5 pb-2">
        <p className="font-serif text-verdict text-paper-lift leading-relaxed whitespace-pre-line">
          {verdict}
        </p>
        {loudestSeatName && (
          <p className="mt-3 text-body-sm text-paper-lift/50">
            最响的声音：{loudestSeatName}
          </p>
        )}
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-paper-lift/10">
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase block mb-2">
            接下来 24 小时，你愿意做的一步
          </span>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value.slice(0, 200))}
            disabled={signed}
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
          {signed ? "已签字" : "签字"}
        </button>
        <button
          onClick={onPause}
          disabled={signed}
          className="px-4 py-2 rounded-md text-body-sm text-paper-lift/80 hover:text-paper-lift hover:bg-paper-lift/10 disabled:opacity-30 transition-colors"
        >
          暂缓
        </button>
        <button
          onClick={onEscape}
          disabled={signed}
          className="ml-auto px-4 py-2 rounded-md text-body-sm text-paper-lift/50 hover:text-paper-lift/80 hover:bg-paper-lift/10 disabled:opacity-30 transition-colors"
        >
          我在逃避
        </button>
      </footer>

      {signed && (
        <div className="px-6 sm:px-8 py-3 bg-paper-lift/5 text-body-sm text-paper-lift/70 italic font-serif">
          已签字。不是完美答案，是先走一步。
        </div>
      )}
    </article>
  );
}
