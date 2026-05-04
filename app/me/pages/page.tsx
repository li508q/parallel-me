"use client";

// V3 「纸页」/「档案」list — Dexie meetings first, V2 episodes preserved as
// a legacy section so existing users still see their pre-V3 data.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { SELVES, type SelfId } from "@/lib/selves";
import { db, type Meeting } from "@/lib/db";
import {
  loadEpisodes,
  updateEpisode,
  deleteEpisode,
  type Episode,
} from "@/lib/memory";
import { SelfAvatar } from "@/components/SelfAvatar";

type FU = "done" | "not-done" | "forgot";

const FOLLOWUP_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: "做了 ✓", cls: "text-safe-green" },
  "not-done": { label: "没做", cls: "text-seal-action" },
  forgot: { label: "忘了", cls: "text-ink-mute" },
};

const STATUS_LABEL: Record<Meeting["status"], string> = {
  in_progress: "进行中",
  signed: "已签字",
  paused: "暂缓",
  escaped: "我在逃避",
  abandoned: "未完成",
};

const STATUS_DOT: Record<Meeting["status"], string> = {
  in_progress: "bg-attention-copper",
  signed:      "bg-safe-green",
  paused:      "bg-ink-mute",
  escaped:     "bg-seal-action",
  abandoned:   "bg-ink-faint",
};

export default function PagesView() {
  const meetings = useLiveQuery(
    () => db.meetings.orderBy("createdAt").reverse().toArray(),
    [],
    [] as Meeting[]
  );
  const [legacyEps, setLegacyEps] = useState<Episode[]>([]);

  useEffect(() => {
    setLegacyEps(loadEpisodes());
  }, []);

  const setFU = (id: string, v: FU | null) => {
    updateEpisode(id, { followup: v });
    setLegacyEps(loadEpisodes());
  };
  const delLegacy = (id: string) => {
    if (!confirm("把这一张旧版纸撕掉？这个动作不可撤销。")) return;
    deleteEpisode(id);
    setLegacyEps(loadEpisodes());
  };

  const totalCount = (meetings?.length ?? 0) + legacyEps.length;
  const empty = totalCount === 0;

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
          纸页 · {totalCount} 张
        </span>
      </div>

      <section className="mb-10 animate-ink-in">
        <p className="text-body sm:text-body-long text-ink-mute italic font-serif mb-3">
          — 你和你的内阁谈过的事。每次一张。
        </p>
        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core mb-2 leading-[1.05]">
          纸页
        </h1>
      </section>

      {empty && (
        <div className="text-center py-20">
          <p className="font-serif text-title text-ink-core mb-3">还没有纸。</p>
          <Link
            href="/"
            className="text-ink-core underline-offset-4 hover:underline"
          >
            回去开会 →
          </Link>
        </div>
      )}

      {/* V3 Meeting archives */}
      {meetings && meetings.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
              会议档案
            </h2>
            <span className="text-xs text-ink-faint">{meetings.length} 次</span>
          </div>
          <div className="space-y-3">
            {meetings.map((m) => (
              <MeetingArchiveCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}

      {/* V2 legacy episodes */}
      {legacyEps.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
              旧版纸页
              <span className="ml-2 normal-case tracking-normal text-ink-faint italic">
                · V2 时期的事件卡，保留作存档
              </span>
            </h2>
            <span className="text-xs text-ink-faint">{legacyEps.length} 张</span>
          </div>
          <div className="space-y-4">
            {legacyEps.map((ep) => {
              const days = Math.max(
                1,
                Math.round((Date.now() - ep.ts) / 86400000)
              );
              const dom = SELVES[ep.dominant_voice];
              const sil = SELVES[ep.silenced_voice];
              return (
                <article
                  key={ep.id}
                  className="bg-paper-lift border border-paper-edge rounded-md px-5 py-4 transition-colors hover:border-ink-mute"
                  style={{
                    borderLeft: `3px solid var(--color-${
                      seatColorVar(ep.dominant_voice)
                    })`,
                  }}
                >
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <h3 className="font-serif text-title text-ink-core">
                      「{ep.title}」
                    </h3>
                    <span className="text-xs text-ink-mute flex-shrink-0">
                      {days} 天前
                    </span>
                  </div>
                  <p className="text-body text-ink-body leading-relaxed mb-3">
                    {ep.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <SelfAvatar id={ep.dominant_voice} size={20} />
                      <span className={`text-${ep.dominant_voice} font-medium`}>
                        {dom?.name}
                      </span>
                      <span className="text-ink-mute">赢了</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <SelfAvatar id={ep.silenced_voice} size={20} />
                      <span className={`text-${ep.silenced_voice}`}>
                        {sil?.name}
                      </span>
                      <span className="text-ink-mute">被按住</span>
                    </div>
                  </div>

                  {ep.decision && (
                    <div className="bg-paper-base border-l border-ink-core/30 pl-3 py-2 text-body-sm text-ink-body italic font-serif mb-3">
                      「我会 {ep.decision}」
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-paper-edge">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-ink-mute">那件事：</span>
                      {ep.followup ? (
                        <span className={FOLLOWUP_LABEL[ep.followup].cls}>
                          {FOLLOWUP_LABEL[ep.followup].label}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFU(ep.id, "done")}
                            className="px-2 py-0.5 rounded-full border border-safe-green/40 text-safe-green hover:bg-safe-green/10 transition-colors"
                          >
                            做了
                          </button>
                          <button
                            onClick={() => setFU(ep.id, "not-done")}
                            className="px-2 py-0.5 rounded-full border border-seal-action/40 text-seal-action hover:bg-seal-action/10 transition-colors"
                          >
                            没做
                          </button>
                          <button
                            onClick={() => setFU(ep.id, "forgot")}
                            className="px-2 py-0.5 rounded-full border border-paper-edge text-ink-mute hover:bg-paper-base transition-colors"
                          >
                            忘了
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => delLegacy(ep.id)}
                      className="text-xs text-ink-mute hover:text-seal-action transition-colors"
                    >
                      撕掉
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

// ───────────────────────────────────────────────────────────
// V3 Meeting card (links to /archive/[id])
// ───────────────────────────────────────────────────────────
function MeetingArchiveCard({ meeting }: { meeting: Meeting }) {
  const days = Math.max(0, Math.round((Date.now() - meeting.createdAt) / 86_400_000));
  const dateLabel =
    days === 0 ? "今天" :
    days === 1 ? "昨天" :
    days < 7  ? `${days} 天前` :
    days < 30 ? `${Math.floor(days / 7)} 周前` :
                `${Math.floor(days / 30)} 个月前`;

  const display = meeting.topicRefined ?? meeting.topicRaw;
  const loudest = meeting.verdict?.loudestSeatId
    ? SELVES[meeting.verdict.loudestSeatId as SelfId]
    : null;

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
          <span>{dateLabel}</span>
          <span>·</span>
          <span>{meeting.mode === "full" ? "完整内阁" : "快速会议"}</span>
          {loudest && (
            <>
              <span>·</span>
              <span className={`text-${meeting.verdict?.loudestSeatId}`}>
                最响：{loudest.name}
              </span>
            </>
          )}
        </div>

        {meeting.signature?.action24h && (
          <p className="mt-3 text-body-sm text-ink-body italic font-serif border-l border-paper-edge pl-3">
            「{meeting.signature.action24h}」
          </p>
        )}
      </article>
    </Link>
  );
}

function seatColorVar(id: SelfId): string {
  const m: Record<SelfId, string> = {
    lay:    "seat-rest",
    money:  "seat-money",
    roam:   "seat-roam",
    filial: "seat-filial",
    future: "seat-future",
  };
  return m[id];
}
