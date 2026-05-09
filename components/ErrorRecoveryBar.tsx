"use client";

/**
 * ErrorRecoveryBar — Production error recovery UI.
 * Reference: UX Patterns "differentiate failure modes and give recovery actions that match each one."
 * 
 * Replaces the simple error text notice with actionable recovery buttons,
 * preserving context for retry (like useChat's reload() pattern).
 */

import * as React from "react";
import type { LlmErrorCode } from "@/lib/llm";

export interface ErrorRecoveryProps {
  /** Error code for icon/color selection */
  code?: LlmErrorCode;
  /** Human-readable error message */
  message: string;
  /** Whether this error is retryable */
  retryable?: boolean;
  /** Retry handler (re-sends last request) */
  onRetry?: () => void;
  /** Skip this step and continue */
  onSkip?: () => void;
  /** Reset to beginning */
  onReset?: () => void;
  /** Dismiss the error */
  onDismiss?: () => void;
  /** Number of auto-retries already attempted */
  autoRetryCount?: number;
}

const ERROR_META: Record<string, { icon: string; label: string; color: string }> = {
  rate_limit: { icon: "⏱", label: "请求过于频繁", color: "#d97706" },
  timeout: { icon: "⏳", label: "响应超时", color: "#d97706" },
  server_error: { icon: "⚡", label: "服务暂时不可用", color: "#dc2626" },
  parse_error: { icon: "📋", label: "结果需要复核", color: "#d97706" },
  empty_response: { icon: "💨", label: "模型返回为空", color: "#d97706" },
  context_overflow: { icon: "📏", label: "上下文过长", color: "#dc2626" },
  auth_error: { icon: "🔑", label: "认证失败", color: "#dc2626" },
  safety_block: { icon: "🛡", label: "内容安全", color: "#7c3aed" },
  unknown: { icon: "⚠", label: "出了点问题", color: "#d97706" },
};

export function ErrorRecoveryBar({
  code = "unknown",
  message,
  retryable = true,
  onRetry,
  onSkip,
  onReset,
  onDismiss,
  autoRetryCount,
}: ErrorRecoveryProps) {
  const meta = ERROR_META[code] || ERROR_META.unknown;

  return (
    <div
      className="rounded-lg border px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}08` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon + Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{meta.icon}</span>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {autoRetryCount != null && autoRetryCount > 0 && (
              <span className="text-[10px] text-ink-mute">
                (已自动重试 {autoRetryCount} 次)
              </span>
            )}
          </div>
          <p className="text-sm text-ink-body leading-relaxed">{message}</p>
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-ink-mute hover:text-ink-core text-sm leading-none mt-0.5"
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>

      {/* Recovery Actions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {retryable && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
            style={{
              borderColor: meta.color,
              color: meta.color,
            }}
          >
            重试
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-200 text-ink-mute hover:text-ink-core hover:border-stone-300 transition-colors"
          >
            跳过这一步
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-200 text-ink-mute hover:text-ink-core hover:border-stone-300 transition-colors"
          >
            重新开始
          </button>
        )}
        {code === "auth_error" && (
          <a
            href="/setup"
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-200 text-ink-mute hover:text-ink-core hover:border-stone-300 transition-colors"
          >
            检查设置
          </a>
        )}
      </div>
    </div>
  );
}
