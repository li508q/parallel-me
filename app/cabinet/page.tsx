"use client";

// V3 我的阁 · /cabinet — Standing-seat statistics derived from meetings.
// Loop C (temporary-seat promotion) is reserved as a marginalia placeholder
// because the temporary-seat capture mechanism (assembly UI + backend SSE
// support) lands in Week 5. See V3-IVY-FINAL-DIRECTION.md § 3.4.

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  aggregateSeatStats,
  aggregateCabinetOverview,
  type SeatStats,
  type CabinetOverview,
} from "@/lib/cabinet";
import { DocketPaper } from "@/components/DocketPaper";

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay:    "color-seat-rest",
  money:  "color-seat-money",
  roam:   "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

export default function CabinetPage() {
  const stats = useLiveQuery(() => aggregateSeatStats(), []) ?? [];
  const overview = useLiveQuery(() => aggregateCabinetOverview(), []);

  const isEmpty = (stats?.length ?? 0) === 0 || (overview?.totalMeetings ?? 0) === 0;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-10 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 我的阁工作台
        </Link>
        <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
          我的阁 · 详情
        </span>
      </header>

      <section className="mb-10 animate-ink-in">
        <p className="text-body sm:text-body-long text-ink-mute italic font-serif mb-3">
          — 你长期拥有的内在组织。每次会议后，它都在重新平衡。
        </p>
        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core leading-[1.05]">
          我的阁
        </h1>
      </section>

      {/* Overview */}
      {overview && overview.totalMeetings > 0 && (
        <DocketPaper stage="总览" className="mb-8" dense>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="会议总数" value={overview.totalMeetings} />
            <Stat label="已签字" value={overview.signedCount} accent="safe" />
            <Stat label="暂缓" value={overview.pausedCount} accent="mute" />
            <Stat
              label="待复盘"
              value={overview.pendingCommitmentCount}
              accent={overview.pendingCommitmentCount > 0 ? "warn" : "mute"}
            />
          </div>
        </DocketPaper>
      )}

      {/* Empty state */}
      {isEmpty && (
        <DocketPaper stage="阁还很安静">
          <p className="font-serif text-title text-ink-core leading-snug mb-3">
            5 席已经入席，但还没有任何议题。
          </p>
          <p className="text-body text-ink-body leading-relaxed mb-6">
            开第一次会议后，这里会显示哪些声音最常出现、谁最响、
            谁被你按下来了。你的内在组织会一点点长出来。
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
          >
            去开第一次会议 →
          </Link>
        </DocketPaper>
      )}

      {/* Standing seats */}
      {!isEmpty && stats && stats.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-4">
            常任席 · {stats.length}
          </h2>
          <div className="space-y-3">
            {stats.map((s) => (
              <StandingSeatCard key={s.seatId} stats={s} />
            ))}
          </div>
        </section>
      )}

      {/* Loop C placeholder — temporary seat promotion (Week 5) */}
      <section className="mb-10">
        <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-4">
          临时席
        </h2>
        <DocketPaper
          dense
          marginalia="Week 5 起，组阁阶段加 “+ 新增声音”。同一个临时席累计出现 3 次以上，这里会建议把它转为常任。"
        >
          <p className="text-body-sm text-ink-mute leading-relaxed">
            临时席机制还没就位。它会让你在某次议题里临时召集一个不在常任阵容里的声音
            —— 比如「怕选错的我」「想被坚定选择的我」「不想再解释的我」。
          </p>
        </DocketPaper>
      </section>

      {/* Footer hint */}
      <footer className="text-xs text-ink-faint border-t border-paper-edge pt-6 mt-12">
        所有统计都来自这台设备上的会议档案。删除某次会议，下次刷新就消失。
      </footer>
    </main>
  );
}

// ───────────────────────────────────────────────────────────
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

function StandingSeatCard({ stats }: { stats: SeatStats }) {
  const colorVar = SEAT_COLOR_VAR[stats.seatId];
  const lastSeenLabel = stats.lastSeenAt ? timeAgo(stats.lastSeenAt) : "从未";
  return (
    <Link
      href={`/seat/${stats.seatId}`}
      className="block bg-paper-lift border border-paper-edge rounded-md p-4 sm:p-5 hover:border-ink-mute transition-colors"
      style={{ borderLeft: `3px solid var(--${colorVar})` }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: `var(--${colorVar})` }}
          />
          <span className="font-medium text-ink-core">{stats.name}</span>
          <span className="text-[10px] tracking-wider text-ink-faint uppercase truncate hidden sm:inline">
            {stats.ifsLabel}
          </span>
        </div>
        <span className="text-xs text-ink-mute flex-shrink-0">最近 {lastSeenLabel}</span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-mute mb-2">
        <span>
          出席 <span className="text-ink-core font-medium">{stats.appearances}</span>
        </span>
        <span>
          最响 <span className="text-ink-core font-medium">{stats.loudestCount}</span>
        </span>
        <span>
          被点名 <span className="text-ink-core font-medium">{stats.followedUpCount}</span>
        </span>
        <span>
          质询命中 <span className="text-ink-core font-medium">{stats.hitCount}</span>
        </span>
      </div>

      {(stats.appearances > 0 || stats.loudestCount > 0) && (
        <p className="text-body-sm text-ink-body italic font-serif leading-snug">
          {describeStanding(stats)}
        </p>
      )}
    </Link>
  );
}

function describeStanding(s: SeatStats): string {
  if (s.appearances === 0) return "还没在会议中出现过。";
  if (s.loudestCount === 0)
    return `出席过 ${s.appearances} 次，但还没有最响过——它一直在听。`;
  const ratio = s.loudestCount / s.appearances;
  if (ratio >= 0.6) return `出席的会议里，超过一半是它最响——它最近常常掌权。`;
  if (s.followedUpCount > s.loudestCount)
    return `你点名追问它的次数比它最响还多。`;
  if (s.hitCount > 0)
    return `质询里你说"问中了" ${s.hitCount} 次——它戳得准。`;
  return `稳定出席。`;
}

function timeAgo(ts: number): string {
  const days = Math.max(0, Math.round((Date.now() - ts) / 86_400_000));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}
