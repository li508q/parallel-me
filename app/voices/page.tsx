"use client";

// 我的声音 · /voices — standing voice statistics derived from v0.7 roundtables.

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  aggregateVoiceOverview,
  aggregateVoiceStats,
  type VoiceStats,
} from "@/lib/voices";
import { DocketPaper } from "@/components/DocketPaper";
import { SelfAvatar } from "@/components/SelfAvatar";

const VOICE_COLOR_VAR: Record<SelfId, string> = {
  lay: "color-seat-rest",
  money: "color-seat-money",
  roam: "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

export default function VoicesPage() {
  const stats = useLiveQuery(() => aggregateVoiceStats(), []) ?? [];
  const overview = useLiveQuery(() => aggregateVoiceOverview(), []);
  const isEmpty = (overview?.totalRecords ?? 0) === 0;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-10 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 回到首页
        </Link>
        <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
          ParallelMe · 我的声音
        </span>
      </header>

      <section className="mb-10 animate-ink-in">
        <p className="text-body sm:text-body-long text-ink-mute italic font-serif mb-3">
          — 那些在重大选择、挫折和焦虑里保护你、也拉扯你的声音。
        </p>
        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core leading-[1.05]">
          我的声音
        </h1>
        <p className="mt-5 text-body-long text-ink-body leading-relaxed max-w-2xl">
          这里不是角色收藏，是五种内在保护逻辑的长期画像。
          它们把混乱拆开，让你看见自己真正害怕什么、守护什么、
          逃避什么、承担什么、想成为什么。
        </p>
      </section>

      {overview && overview.totalRecords > 0 && (
        <DocketPaper stage="总览" className="mb-8" dense>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="纸页" value={overview.totalRecords} />
            <Stat label="已落定" value={overview.settledCount} accent="safe" />
            <Stat label="未完成" value={overview.abandonedCount} accent="mute" />
            <Stat
              label="待复盘"
              value={overview.pendingCommitmentCount}
              accent={overview.pendingCommitmentCount > 0 ? "warn" : "mute"}
            />
          </div>
        </DocketPaper>
      )}

      {isEmpty && (
        <p className="mb-7 text-body-sm text-ink-mute leading-relaxed font-serif italic">
          五声已经在。第一次圆桌后，下面会逐渐显出哪些声音常出现、
          哪一声经常被你继续追问，以及哪些声音常被拉去对峙。
        </p>
      )}

      <section className="mb-10">
        <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-4">
          五声画像 · {stats.length || 5}
        </h2>
        <div className="space-y-4">
          {stats.map((s) => (
            <StandingVoiceCard key={s.voiceId} stats={s} />
          ))}
        </div>
      </section>

      <footer className="text-xs text-ink-faint border-t border-paper-edge pt-6 mt-12">
        所有统计都来自这台设备上的纸页。删除某张纸页，下次刷新就消失。
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "safe" | "warn" | "mute";
}) {
  const cls =
    accent === "safe"
      ? "text-safe-green"
      : accent === "warn"
        ? "text-attention-copper"
        : accent === "mute"
          ? "text-ink-mute"
          : "text-ink-core";
  return (
    <div>
      <div className={`font-serif text-headline ${cls} leading-none`}>{value}</div>
      <div className="mt-2 text-[10px] tracking-[0.18em] text-ink-mute uppercase">
        {label}
      </div>
    </div>
  );
}

function StandingVoiceCard({ stats }: { stats: VoiceStats }) {
  const id = stats.voiceId as SelfId;
  const colorVar = VOICE_COLOR_VAR[id];
  const seat = SELVES[id];
  const soul = seat.soul;
  const lastSeenLabel = stats.lastSeenAt ? timeAgo(stats.lastSeenAt) : "从未";
  return (
    <Link
      href={`/voices/${stats.voiceId}`}
      className="block bg-paper-lift border border-paper-edge rounded-md p-4 sm:p-5 hover:border-ink-mute transition-colors"
      style={{ borderLeft: `3px solid var(--${colorVar})` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <SelfAvatar id={id} size={42} />
          <div>
            <div className="font-serif text-title-sm text-ink-core leading-snug">
              {stats.name}
            </div>
            <p className="text-body-sm text-ink-body italic font-serif leading-snug">
              {soul?.line}
            </p>
          </div>
        </div>
        <span className="text-xs text-ink-mute flex-shrink-0">最近 {lastSeenLabel}</span>
      </div>

      {soul && (
        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3 mb-4 text-body-sm">
          <SoulBrief label="守护" body={soul.protects} />
          <SoulBrief label="盔甲" body={soul.armor} />
          <SoulBrief label="代价" body={soul.cost} />
          <SoulBrief label="看清" body={soul.clarityRole} />
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-mute mb-2">
        <span>
          出现 <span className="text-ink-core font-medium">{stats.appearances}</span>
        </span>
        <span>
          被继续 <span className="text-ink-core font-medium">{stats.requestedCount}</span>
        </span>
        <span>
          被提问 <span className="text-ink-core font-medium">{stats.directQuestionCount}</span>
        </span>
        <span>
          被对峙 <span className="text-ink-core font-medium">{stats.challengedCount}</span>
        </span>
      </div>

      {(stats.appearances > 0 || stats.requestedCount > 0) && (
        <p className="text-body-sm text-ink-body italic font-serif leading-snug">
          {describeStanding(stats)}
        </p>
      )}
    </Link>
  );
}

function SoulBrief({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase mb-1">
        {label}
      </div>
      <p className="text-ink-body leading-relaxed">{body}</p>
    </div>
  );
}

function describeStanding(s: VoiceStats): string {
  if (s.appearances === 0) return "还没在纸页中出现过。";
  if (s.requestedCount === 0)
    return `出现过 ${s.appearances} 次，但还很少被你主动叫出来继续说。`;
  if (s.directQuestionCount > 0)
    return `你直接问过它 ${s.directQuestionCount} 次，说明你在主动确认它背后的价值。`;
  if (s.challengedCount > 0)
    return `它参与过 ${s.challengedCount} 次对峙，常站在冲突比较亮的地方。`;
  return "稳定出现，也开始被你主动听见。";
}

function timeAgo(ts: number): string {
  const days = Math.max(0, Math.round((Date.now() - ts) / 86_400_000));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}
