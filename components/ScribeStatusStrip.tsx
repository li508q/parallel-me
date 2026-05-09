"use client";

/**
 * Layer 1 · ScribeStatusStrip — DC-01 状态条
 * 页面底部一条窄窄的状态带，永远只有一行人话。
 * 文案由 meeting store 的 streaming narration 驱动，不自带任何中文常量。
 */

import * as React from "react";

export interface ScribeStatusStripProps {
  /** Current narration text from the streaming store */
  narration: string;
  /** Whether the agent is currently streaming */
  isStreaming: boolean;
  /** Callback to open Layer 2 Trace Panel */
  onTraceClick?: () => void;
  /** Fallback label when not streaming (e.g. stage label) */
  fallbackLabel?: string;
}

export function ScribeStatusStrip({
  narration,
  isStreaming,
  onTraceClick,
  fallbackLabel,
}: ScribeStatusStripProps) {
  const displayText = isStreaming && narration ? narration : fallbackLabel || "";

  return (
    <div
      className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 shadow-sm"
      style={{ backgroundColor: "var(--color-scribe-strip-bg, #f5f1eb)" }}
    >
      <span
        className="truncate text-sm font-serif transition-opacity duration-200 ease-out"
        style={{ color: "var(--color-scribe-strip-text, #5a4f44)" }}
        key={displayText}
      >
        {displayText}
      </span>

      {onTraceClick && (
        <button
          type="button"
          onClick={onTraceClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-paper-edge bg-paper-base text-xl leading-none opacity-80 transition-opacity hover:opacity-100"
          style={{ color: "var(--color-scribe-strip-text, #5a4f44)" }}
          aria-label="展开大模型输出"
        >
          ▾
        </button>
      )}
    </div>
  );
}
