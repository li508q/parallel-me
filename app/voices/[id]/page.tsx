"use client";

// 声音详情 · /voices/[id] — one voice's activity feed across v0.7 records.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  aggregateVoiceActivity,
  aggregateVoiceStats,
  type VoiceActivityEntry,
} from "@/lib/voices";
import { DocketPaper } from "@/components/DocketPaper";

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay:    "color-seat-rest",
  money:  "color-seat-money",
  roam:   "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

export default function VoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? "") as SelfId;
  const seat = SELVES[id];

  const stats = useLiveQuery(
    () =>
      aggregateVoiceStats().then(
        (all) => all.find((s) => s.voiceId === id) ?? undefined
      ),
    [id]
  );

  const activity =
    useLiveQuery(
      () => (seat ? aggregateVoiceActivity(id) : Promise.resolve([])),
      [id]
    ) ?? [];

  if (!seat) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-14 max-w-3xl mx-auto font-sans text-ink-body">
        <Link
          href="/voices"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core"
        >
          ← 我的声音
        </Link>
        <DocketPaper stage="声音" className="mt-10">
          <p className="font-serif text-title text-ink-core mb-3">没有这个声音。</p>
          <p className="text-body text-ink-mute">
            id：<span className="font-mono">{id}</span> 不在五声名册里。
          </p>
        </DocketPaper>
      </main>
    );
  }

  const colorVar = SEAT_COLOR_VAR[id];

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-10 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/voices"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 我的声音
        </Link>
        <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
          声音详情
        </span>
      </header>

      <section className="mb-8 animate-ink-in">
        <div
          className="inline-block w-1.5 h-1.5 rounded-full mb-4"
          style={{ background: `var(--${colorVar})` }}
        />
        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core leading-[1.05] mb-3">
          {seat.name}
        </h1>
        <p className="text-body-sm tracking-wider text-ink-mute uppercase mb-3">
          {seat.ifs_label}
        </p>
        <p className="text-body-long text-ink-body italic font-serif leading-relaxed max-w-xl">
          {seat.tagline}
        </p>
      </section>

      {/* Persona card */}
      <DocketPaper stage="它在保护什么" className="mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <PersonaField label="核心价值" body={seat.core_value} />
          <PersonaField label="它最怕" body={seat.fear} />
          <PersonaField label="语言风格" body={seat.voice} />
          <PersonaField label="信念" body={seat.core_belief} />
        </div>
      </DocketPaper>

      {/* Stats */}
      {stats && stats.appearances > 0 && (
        <DocketPaper stage="它在你的纸页里" dense className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="出现" value={stats.appearances} />
            <Stat label="被继续" value={stats.requestedCount} accent="warn" />
            <Stat label="被提问" value={stats.directQuestionCount} />
            <Stat label="被对峙" value={stats.challengedCount} accent="safe" />
          </div>
        </DocketPaper>
      )}

      {/* Activity feed */}
      {activity.length === 0 ? (
        <DocketPaper stage="纸页">
          <p className="text-body-sm text-ink-mute italic font-serif">
            它还没有在会谈中出现过。
          </p>
        </DocketPaper>
      ) : (
        <section className="space-y-4">
          <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
            出现记录 · {activity.length} 次
          </h2>
          {activity.map((a) => (
            <ActivityCard key={a.recordId} entry={a} colorVar={colorVar} />
          ))}
        </section>
      )}
    </main>
  );
}

// ───────────────────────────────────────────────────────────
function PersonaField({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1.5">
        {label}
      </div>
      <p className="text-body text-ink-body leading-snug font-serif">{body}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "safe" | "warn";
}) {
  const cls =
    accent === "safe"
      ? "text-safe-green"
      : accent === "warn"
        ? "text-attention-copper"
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

function ActivityCard({
  entry,
  colorVar,
}: {
  entry: VoiceActivityEntry;
  colorVar: string;
}) {
  return (
    <Link
      href={`/archive/${entry.recordId}`}
      className="block bg-paper-lift border border-paper-edge rounded-md p-4 sm:p-5 hover:border-ink-mute transition-colors"
      style={{ borderLeft: `3px solid var(--${colorVar})` }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <h3 className="font-serif text-title-sm text-ink-core leading-snug min-w-0 flex-1">
          {entry.title}
        </h3>
        <span className="text-xs text-ink-mute flex-shrink-0">
          {timeAgo(entry.at)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {entry.requested && <Pill kind="warn">被继续听见</Pill>}
        {entry.directQuestion && <Pill kind="default">被直接提问</Pill>}
        {entry.duel && <Pill kind="safe">参与对峙</Pill>}
        <Pill kind="muted">{entry.status === "settled" ? "已落定" : "未完成"}</Pill>
      </div>

      <p className="text-body-sm text-ink-body leading-relaxed line-clamp-3 italic font-serif">
        「{entry.text}」
      </p>

      {entry.directQuestion && (
        <div className="mt-3 pt-3 border-t border-paper-edge">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
            你问它
          </div>
          <p className="text-body-sm text-ink-body italic">「{entry.directQuestion}」</p>
        </div>
      )}
      {entry.duel && (
        <div className="mt-3 pt-3 border-t border-paper-edge">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
            对峙记录
          </div>
          <p className="text-body-sm text-ink-body italic">「{entry.duel}」</p>
        </div>
      )}
    </Link>
  );
}

function Pill({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: "warn" | "safe" | "default" | "muted";
}) {
  const cls =
    kind === "warn"
      ? "bg-attention-copper/10 text-attention-copper border-attention-copper/30"
      : kind === "safe"
        ? "bg-safe-green/10 text-safe-green border-safe-green/30"
        : kind === "muted"
          ? "bg-paper-base text-ink-faint border-paper-edge"
          : "bg-paper-base text-ink-mute border-paper-edge";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border ${cls}`}
    >
      {children}
    </span>
  );
}

function timeAgo(ts: number): string {
  const days = Math.max(0, Math.round((Date.now() - ts) / 86_400_000));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}
