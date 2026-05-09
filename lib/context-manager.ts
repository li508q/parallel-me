// lib/context-manager.ts — Dialogue and roundtable context compaction.
// Reference: Claude Agent SDK auto-compaction, useChat message truncation/summarization.
// When dialogue or roundtable context grows too large for LLM context windows,
// automatically compress older entries into a summary block.

import type { DefiningDialogue, RoundtableRecord, RoundtableTurn } from "./v7";
import { getEncoding } from "js-tiktoken";

// ─── Configuration ───

/** Max dialogue entries before compaction kicks in */
const MAX_DIALOGUE_ENTRIES = 10;
/** Max roundtable turns before compaction */
const MAX_ROUNDTABLE_TURNS = 20;

// ─── Dialogue Compaction ───

export interface CompactedDialogue {
  /** Recent dialogue entries (preserved verbatim) */
  compacted: DefiningDialogue;
  /** Summary of older entries (prepended to prompt context) */
  summary?: string;
  /** Whether compaction was applied */
  wasCompacted: boolean;
}

/**
 * Compact dialogue history for LLM context management.
 * Keeps the most recent entries verbatim and summarizes older ones.
 */
export function compactDialogue(dialogue: DefiningDialogue): CompactedDialogue {
  if (dialogue.length <= MAX_DIALOGUE_ENTRIES) {
    return { compacted: dialogue, wasCompacted: false };
  }

  const keepCount = 6; // Keep latest 6 entries
  const early = dialogue.slice(0, -keepCount);
  const recent = dialogue.slice(-keepCount);

  // Generate a text summary of early dialogue
  const summaryLines: string[] = [];
  for (const entry of early) {
    if (entry.role === "scribe" && entry.question) {
      summaryLines.push(`[书记员问] ${entry.question.text}`);
    } else if (entry.role === "user" && entry.answer) {
      const text = entry.answer.free_text || entry.answer.selected_option_id || "(选择)";
      summaryLines.push(`[用户答] ${text}`);
    }
  }

  const summary = summaryLines.length > 0
    ? `[前 ${early.length} 轮对话摘要]\n${summaryLines.join("\n")}`
    : undefined;

  return { compacted: recent, summary, wasCompacted: true };
}

// ─── Roundtable Compaction ───

export interface CompactedRoundtable {
  /** Summary of earlier turns */
  earlySummary?: string;
  /** Recent turns preserved verbatim */
  recentTurns: RoundtableTurn[];
  /** Whether compaction was applied */
  wasCompacted: boolean;
}

/**
 * Compact roundtable turns for LLM context.
 * Keeps opening turns info + recent interaction turns.
 */
export function compactRoundtable(roundtable: RoundtableRecord): CompactedRoundtable {
  const turns = roundtable.turns;
  if (turns.length <= MAX_ROUNDTABLE_TURNS) {
    return { recentTurns: turns, wasCompacted: false };
  }

  const keepCount = 10;
  const early = turns.slice(0, -keepCount);
  const recent = turns.slice(-keepCount);

  // Summarize early turns by voice and content
  const voiceCounts: Record<string, number> = {};
  const keyPoints: string[] = [];

  for (const turn of early) {
    const vid = turn.voice_id || "user";
    voiceCounts[vid] = (voiceCounts[vid] || 0) + 1;
    // Keep only first 40 chars of each turn text for summary
    if (turn.text && keyPoints.length < 8) {
      keyPoints.push(`[${vid}] ${turn.text.slice(0, 40)}${turn.text.length > 40 ? "…" : ""}`);
    }
  }

  const countStr = Object.entries(voiceCounts)
    .map(([v, c]) => `${v}: ${c}次`)
    .join(", ");

  const earlySummary = [
    `[前 ${early.length} 轮讨论摘要 — 发言: ${countStr}]`,
    ...keyPoints,
  ].join("\n");

  return { earlySummary, recentTurns: recent, wasCompacted: true };
}

// ─── Token Counting ───

const cl100k = getEncoding("cl100k_base");

/**
 * Precise token count for GPT-4/GPT-3.5 style models.
 * Keep the old export name for API compatibility with existing callers.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return cl100k.encode(text).length;
}

/**
 * Check if serialized context likely exceeds a safe limit.
 */
export function isContextTooLong(text: string, maxTokens = 6000): boolean {
  return estimateTokens(text) > maxTokens;
}
