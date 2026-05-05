// HostConsole — persistent bottom bar where the user stays in the host position.
// Stage actions live on the right; a small free-text input lets the user pause,
// correct, or add a note without leaving the structured flow.

"use client";

import * as React from "react";

export interface ConsoleAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "muted" | "destructive";
  disabled?: boolean;
}

export interface HostConsoleProps {
  /** Short label in the upper-left, e.g. "困惑成形 · 等你确认". */
  stageLabel?: string;
  /** Stage-specific actions, rendered right-aligned. */
  actions: ConsoleAction[];
  /** Submit handler for free-text. Returns whether to clear input. */
  onSpeak?: (text: string) => boolean | void | Promise<boolean | void>;
  /** Disable free-input while a request is running. */
  inputDisabled?: boolean;
  inputPlaceholder?: string;
}

export function HostConsole({
  stageLabel,
  actions,
  onSpeak,
  inputDisabled,
  inputPlaceholder,
}: HostConsoleProps) {
  const [draft, setDraft] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const keep = await onSpeak?.(text);
      if (keep !== true) setDraft("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-paper-lift/95 backdrop-blur border-t border-paper-edge">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {stageLabel && (
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
            {stageLabel}
          </div>
        )}
        <div className="flex items-end gap-2 sm:gap-3">
          {onSpeak && (
            <div className="flex-1 min-w-0 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 400))}
                placeholder={
                  inputPlaceholder ?? "等等 · 我想问 · 我有话说…（Enter 发送）"
                }
                rows={1}
                disabled={inputDisabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="flex-1 bg-transparent border-b border-paper-edge focus:border-ink-core outline-none resize-none py-1.5 text-body text-ink-body placeholder-ink-faint font-serif disabled:opacity-50 transition-colors"
                style={{ minHeight: 32 }}
              />
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || submitting || inputDisabled}
                className="text-xs px-2.5 py-1.5 rounded-md text-ink-mute hover:text-ink-core disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="把这句话记入档案"
              >
                ↵
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={a.onClick}
                disabled={a.disabled}
                className={actionClass(a.variant)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function actionClass(variant: ConsoleAction["variant"]) {
  const base =
    "px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-body-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap";
  switch (variant) {
    case "primary":
    case undefined:
      return `${base} bg-ink-core text-paper-base hover:bg-ink-body`;
    case "secondary":
      return `${base} bg-paper-base border border-paper-edge text-ink-body hover:border-ink-core`;
    case "muted":
      return `${base} text-ink-mute hover:text-ink-core hover:bg-paper-base`;
    case "destructive":
      return `${base} bg-seal-action text-paper-base hover:bg-seal-action/90`;
  }
}
