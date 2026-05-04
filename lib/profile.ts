// lib/profile.ts — 用户画像 + 品味数据 (localStorage MVP)
// 设计参考：CLAUDE.md / AGENTS.md 的轻量跨会话上下文文件思路
// MVP 全部存 localStorage，零基建，私密；后续可加 Vercel KV 同步

import type { SelfId } from "./selves";

// ────────────────────────────────────────────────────────────
// me.md — 用户自填画像
// ────────────────────────────────────────────────────────────
export interface MeProfile {
  // 我是
  nickname?: string;          // 怎么称呼你
  ageBand?: "18-24" | "25-29" | "30-34" | "35+";
  city?: string;
  season?: string;            // 现在是你人生哪个阶段，3-15 字
  // 我此刻
  caringAbout?: string[];     // 最近最在意的事
  avoiding?: string[];        // 最在回避的话题
  // 我的人
  people?: { name: string; relation: string; note?: string }[];
  // 我的红线
  redLines?: string[];
  // 元
  updatedAt?: number;
}

// ────────────────────────────────────────────────────────────
// Taste — 书 / 影 / 乐
// ────────────────────────────────────────────────────────────
export interface TasteItem {
  title: string;
  author?: string;        // 书：作者；影：导演；乐：艺术家
  year?: string;
  why?: string;           // 为什么这部作品对你有意义（自填，可选）
}

export interface Taste {
  books: TasteItem[];
  films: TasteItem[];
  music: TasteItem[];
  profile?: {             // 由 LLM 一次性总结
    themes: string[];
    moods: string[];
    identity_hint: string;   // 14 字内人格判词
    generatedAt: number;
  };
}

// ────────────────────────────────────────────────────────────
// 序列化为 me.md 文本（注入 prompt 时用）
// ────────────────────────────────────────────────────────────
export function profileToMarkdown(p: MeProfile, t?: Taste): string {
  const parts: string[] = [];
  if (p.nickname) parts.push(`昵称：${p.nickname}`);
  if (p.ageBand) parts.push(`年龄段：${p.ageBand}`);
  if (p.city) parts.push(`城市：${p.city}`);
  if (p.season) parts.push(`人生阶段：${p.season}`);
  if (p.caringAbout?.length) parts.push(`最近在意的：${p.caringAbout.join("、")}`);
  if (p.avoiding?.length) parts.push(`最在回避的：${p.avoiding.join("、")}`);
  if (p.people?.length) {
    parts.push("身边的人：");
    p.people.forEach(x => parts.push(`  - ${x.name}（${x.relation}）${x.note || ""}`));
  }
  if (p.redLines?.length) parts.push(`不要踩的红线：${p.redLines.join("、")}`);
  return parts.join("\n");
}

export function tasteToProfileHint(t?: Taste): string {
  if (!t?.profile) return "";
  const ph = t.profile;
  return `他喜欢的东西显示他是「${ph.identity_hint}」。常出现的主题：${ph.themes.join("、")}。氛围：${ph.moods.join("、")}。`;
}

// ────────────────────────────────────────────────────────────
// localStorage 客户端 helper
// ────────────────────────────────────────────────────────────
const KEY_ME = "parallelme:profile:v1";
const KEY_TASTE = "parallelme:taste:v1";

export function loadProfile(): MeProfile {
  if (typeof window === "undefined") return {};
  try {
    const s = window.localStorage.getItem(KEY_ME);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function saveProfile(p: MeProfile) {
  if (typeof window === "undefined") return;
  p.updatedAt = Date.now();
  window.localStorage.setItem(KEY_ME, JSON.stringify(p));
}

export function loadTaste(): Taste {
  if (typeof window === "undefined") return { books: [], films: [], music: [] };
  try {
    const s = window.localStorage.getItem(KEY_TASTE);
    return s ? JSON.parse(s) : { books: [], films: [], music: [] };
  } catch { return { books: [], films: [], music: [] }; }
}

export function saveTaste(t: Taste) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_TASTE, JSON.stringify(t));
}

export function clearAllProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_ME);
  window.localStorage.removeItem(KEY_TASTE);
}
