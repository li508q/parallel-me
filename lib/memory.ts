// lib/memory.ts — 跨会话轻量记忆层 (localStorage MVP)
// 设计参考：MemGPT 分层 + Generative Agents reflection tree + mem0 importance gating
// 三层：L1 working (当前会话内存) | L2 episodes (事件卡) | L3 insights (跨会话归纳)

import type { SelfId } from "./selves";

export interface Episode {
  id: string;
  ts: number;
  title: string;
  summary: string;
  emotion: string;
  intensity: number;
  importance: number;
  dominant_voice: SelfId;
  silenced_voice: SelfId;
  decision: string;
  raw_excerpt?: string;
  // 用户对自己承诺的 follow-up 状态
  followup?: "done" | "not-done" | "forgot" | null;
}

export interface Insight {
  id: string;
  ts: number;
  statement: string;
  evidence: string[];        // episode ids
  confidence: number;
  superseded_by?: string;
}

const KEY_EP = "parallelme:episodes:v1";
const KEY_IN = "parallelme:insights:v1";

function uid() { return Math.random().toString(36).slice(2, 10); }

// ────────────────────────────────────────────────────────────
// Episodes
// ────────────────────────────────────────────────────────────
export function loadEpisodes(): Episode[] {
  if (typeof window === "undefined") return [];
  try {
    const s = window.localStorage.getItem(KEY_EP);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveEpisodes(eps: Episode[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_EP, JSON.stringify(eps));
}

export function addEpisode(ep: Omit<Episode, "id" | "ts">): Episode {
  const eps = loadEpisodes();
  const full: Episode = { ...ep, id: uid(), ts: Date.now() };
  eps.unshift(full); // 新的在前
  // 保留最多 200 条（防 localStorage 爆）
  saveEpisodes(eps.slice(0, 200));
  return full;
}

export function updateEpisode(id: string, patch: Partial<Episode>) {
  const eps = loadEpisodes();
  const i = eps.findIndex(e => e.id === id);
  if (i < 0) return;
  eps[i] = { ...eps[i], ...patch };
  saveEpisodes(eps);
}

export function deleteEpisode(id: string) {
  saveEpisodes(loadEpisodes().filter(e => e.id !== id));
}

// 最近一条（用于 callback 开场）
export function lastEpisode(): Episode | null {
  const eps = loadEpisodes();
  return eps[0] || null;
}

// 近 N 天
export function recentEpisodes(days = 30, limit = 10): Episode[] {
  const cutoff = Date.now() - days * 86400000;
  return loadEpisodes().filter(e => e.ts >= cutoff).slice(0, limit);
}

// ────────────────────────────────────────────────────────────
// Insights
// ────────────────────────────────────────────────────────────
export function loadInsights(): Insight[] {
  if (typeof window === "undefined") return [];
  try {
    const s = window.localStorage.getItem(KEY_IN);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveInsights(ins: Insight[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_IN, JSON.stringify(ins));
}

export function addInsight(i: Omit<Insight, "id" | "ts">): Insight {
  const ins = loadInsights();
  const full: Insight = { ...i, id: uid(), ts: Date.now() };
  ins.unshift(full);
  saveInsights(ins.slice(0, 50));
  return full;
}

export function deleteInsight(id: string) {
  saveInsights(loadInsights().filter(i => i.id !== id));
}

// ────────────────────────────────────────────────────────────
// Callback opener — "下次回来开场"模板
// ────────────────────────────────────────────────────────────
export function getOpeningLine(): string | null {
  const ep = lastEpisode();
  if (!ep) return null;
  const days = Math.max(1, Math.round((Date.now() - ep.ts) / 86400000));
  const dominantName = SELF_NAMES[ep.dominant_voice] || "某一个我";
  const silencedName = SELF_NAMES[ep.silenced_voice] || "另一个我";

  if (days > 30) {
    return `好久没见。我还记得你上次来，是为了「${ep.title}」。\n那时${dominantName}赢了。你说会「${ep.decision}」——\n做了吗？`;
  }
  return `${days} 天前，你在这里聊过「${ep.title}」。\n那天${dominantName}赢了，${silencedName}被你按下来了。\n你说会「${ep.decision}」——\n\n做了吗？`;
}

const SELF_NAMES: Record<SelfId, string> = {
  lay: "躺平的我",
  money: "搞钱的我",
  roam: "出走的我",
  filial: "讨妈欢心的我",
  future: "5 年后的我",
};

// ────────────────────────────────────────────────────────────
// Recall — 给主辩论流注入 context
// ────────────────────────────────────────────────────────────
export function getRecentContextForPrompt(): string | null {
  const ep = lastEpisode();
  if (!ep) return null;
  const days = Math.max(1, Math.round((Date.now() - ep.ts) / 86400000));
  return `${days} 天前他来这里聊过「${ep.title}」（${SELF_NAMES[ep.dominant_voice]}赢了）。当时他说会「${ep.decision}」。`;
}

// ────────────────────────────────────────────────────────────
// 全部清空（"忘掉我"按钮）
// ────────────────────────────────────────────────────────────
export function forgetEverything() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_EP);
  window.localStorage.removeItem(KEY_IN);
}

// 统计
export function memoryStats() {
  const eps = loadEpisodes();
  const ins = loadInsights();
  // 各分身被点名次数
  const dominant: Record<string, number> = {};
  const silenced: Record<string, number> = {};
  eps.forEach(e => {
    dominant[e.dominant_voice] = (dominant[e.dominant_voice] || 0) + 1;
    silenced[e.silenced_voice] = (silenced[e.silenced_voice] || 0) + 1;
  });
  return {
    episodes: eps.length,
    insights: ins.length,
    dominant,
    silenced,
    firstAt: eps[eps.length - 1]?.ts,
    lastAt: eps[0]?.ts,
  };
}
