// lib/request-lifecycle.ts — Explicit request state machine for Agent UX.
// Reference: UX Patterns (idle/sending/streaming/complete/interrupted/error)
// + Vercel AI SDK useChat (reload, onError, onFinish patterns).

import type { LlmErrorCode } from "./llm";

// ─── Request Phase (生命周期阶段) ───

export type RequestPhase =
  | "idle"         // 等待用户操作
  | "sending"      // 请求已发出，等待首字节
  | "streaming"    // 正在接收流
  | "complete"     // 成功完成
  | "interrupted"  // 用户主动中断
  | "error";       // 失败

// ─── Recovery Action (可执行的恢复动作) ───

export type RecoveryAction =
  | { type: "retry"; label: string }          // 重发上一次请求
  | { type: "shorten"; label: string }        // 缩短输入后重试
  | { type: "switch_model"; label: string }   // 切换模型
  | { type: "skip"; label: string }           // 跳过当前步骤
  | { type: "reset"; label: string };         // 重来

// ─── Request State (完整状态) ───

export interface RequestState {
  phase: RequestPhase;
  error?: { code: LlmErrorCode; message: string; retryable: boolean };
  /** 用户可执行的恢复动作 */
  recoveryActions: RecoveryAction[];
  /** 连续重试次数 */
  retryCount: number;
  /** 上一次请求的参数（用于 reload 重发） */
  lastAction?: { path: string; body: unknown };
}

// ─── State Transitions ───

export function idleState(): RequestState {
  return { phase: "idle", recoveryActions: [], retryCount: 0 };
}

export function sendingState(path: string, body: unknown): RequestState {
  return { phase: "sending", recoveryActions: [], retryCount: 0, lastAction: { path, body } };
}

export function streamingState(prev: RequestState): RequestState {
  return { ...prev, phase: "streaming" };
}

export function completeState(): RequestState {
  return { phase: "complete", recoveryActions: [], retryCount: 0 };
}

export function interruptedState(prev: RequestState): RequestState {
  const actions: RecoveryAction[] = [
    { type: "retry", label: "继续" },
  ];
  return { ...prev, phase: "interrupted", recoveryActions: actions };
}

export function errorState(
  code: LlmErrorCode,
  message: string,
  retryable: boolean,
  prev?: RequestState,
): RequestState {
  const actions = buildRecoveryActions(code, retryable);
  return {
    phase: "error",
    error: { code, message, retryable },
    recoveryActions: actions,
    retryCount: (prev?.retryCount ?? 0) + 1,
    lastAction: prev?.lastAction,
  };
}

// ─── Recovery Logic (根据错误类型推荐不同恢复动作) ───

function buildRecoveryActions(code: LlmErrorCode, retryable: boolean): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  if (retryable) {
    actions.push({ type: "retry", label: "重试" });
  }

  switch (code) {
    case "rate_limit":
      // Already has retry; just wait
      break;
    case "timeout":
    case "server_error":
      actions.push({ type: "retry", label: "再试一次" });
      break;
    case "context_overflow":
      actions.push({ type: "shorten", label: "缩短输入后重试" });
      break;
    case "auth_error":
      actions.push({ type: "switch_model", label: "检查 API Key" });
      break;
    case "empty_response":
    case "parse_error":
      actions.push({ type: "retry", label: "再试一次" });
      break;
    default:
      if (!retryable) {
        actions.push({ type: "reset", label: "重新开始" });
      }
  }

  // Always offer skip if not auth error
  if (code !== "auth_error") {
    actions.push({ type: "skip", label: "跳过这一步" });
  }

  // Dedupe retry
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Helper: check if busy (for UI disable states) ───

export function isBusy(state: RequestState): boolean {
  return state.phase === "sending" || state.phase === "streaming";
}
