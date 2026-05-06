"use client";

// 纸页 — v0.7 roundtable records.

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Meeting } from "@/lib/db";

const STATUS_LABEL: Record<Meeting["status"], string> = {
  in_progress: "进行中",
  settled: "已落定",
  abandoned: "未完成",
};

const STATUS_DOT: Record<Meeting["status"], string> = {
  in_progress: "bg-attention-copper",
  settled: "bg-safe-green",
  abandoned: "bg-ink-faint",
};

export default function PagesView() {
  const records =
    useLiveQuery(
      () => db.meetings.orderBy("createdAt").reverse().toArray(),
      [],
    ) ?? [];

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-sans text-ink-body">
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/me"
          className="text-xs tracking-[0.18em] text-ink-mute hover:text-ink-core uppercase transition-colors"
        >
          ← 底片
        </Link>
        <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
          纸页 · {records.length} 张
        </span>
      </div>

      <section className="mb-10 animate-ink-in">
        <p className="text-body sm:text-body-long text-ink-mute italic font-serif mb-3">
          — 你曾经把哪些困惑听清楚过。每次一页。
        </p>
        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core mb-2 leading-[1.05]">
          纸页
        </h1>
      </section>

      {records.length === 0 && (
        <div className="text-center py-20">
          <p className="font-serif text-title text-ink-core mb-3">还没有纸页。</p>
          <Link
            href="/"
            className="text-ink-core underline-offset-4 hover:underline"
          >
            回去开始五声圆桌 →
          </Link>
        </div>
      )}

      {records.length > 0 && (
        <section>
          <div className="space-y-3">
            {records.map((m) => (
              <RecordCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function RecordCard({ meeting }: { meeting: Meeting }) {
  const display =
    meeting.clarity?.clarity_sentence ||
    meeting.task_frame?.visible.problem_definition ||
    meeting.raw_input;

  return (
    <Link href={`/archive/${meeting.id}`} className="block">
      <article className="bg-paper-lift border border-paper-edge rounded-md px-5 py-4 transition-colors hover:border-ink-mute">
        <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
          <h3 className="font-serif text-title text-ink-core leading-snug line-clamp-2 flex-1 min-w-0">
            {display}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[meeting.status]}`} />
            {STATUS_LABEL[meeting.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-mute flex-wrap">
          <span>{timeAgo(meeting.createdAt)}</span>
          <span>·</span>
          <span>{meeting.roundtable.opening_turns.length} 声立论</span>
        </div>

        {meeting.clarity?.commitment24h && (
          <p className="mt-3 text-body-sm text-ink-body italic font-serif border-l border-paper-edge pl-3">
            「{meeting.clarity.commitment24h}」
          </p>
        )}
      </article>
    </Link>
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
