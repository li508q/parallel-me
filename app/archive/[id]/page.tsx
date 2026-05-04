"use client";

// V3 Meeting Archive — three-tab post-meeting record.
//   摘要 (summary): topic, assembly, loudest, verdict, commitment
//   原声 (raw):     all turns, cross-exams, followups verbatim
//   余波 (aftermath): signature, memory consent, "the cabinet's response"
//
// Reads via dexie-react-hooks useLiveQuery so changes (e.g. follow-up edits)
// propagate without manual refresh. See V3-IA-DESIGN-GUIDE.md and
// docs/research/V3/03-multi-agent-ux-patterns.md for the rationale (Notion AI
// Meeting Notes / Granola: summary / notes / transcript separation).

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  db,
  recordCommitmentFollowup,
  type Meeting,
  type CommitmentFollowupResult,
} from "@/lib/db";
import { DocketPaper } from "@/components/DocketPaper";
import { SeatNameplate } from "@/components/SeatNameplate";

type Tab = "summary" | "raw" | "aftermath";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "summary",   label: "摘要", hint: "议题 / 组阁 / 裁决 / 承诺" },
  { id: "raw",       label: "原声", hint: "所有发言 / 质询 / 判定原文" },
  { id: "aftermath", label: "余波", hint: "签字 / 记忆 / 对阁的影响" },
];

const STATUS_LABEL: Record<Meeting["status"], string> = {
  in_progress: "进行中",
  signed:      "已签字",
  paused:      "暂缓",
  escaped:     "我在逃避",
  abandoned:   "未完成",
};

const STATUS_DOT: Record<Meeting["status"], string> = {
  in_progress: "bg-attention-copper",
  signed:      "bg-safe-green",
  paused:      "bg-ink-mute",
  escaped:     "bg-seal-action",
  abandoned:   "bg-ink-faint",
};

export default function ArchivePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [tab, setTab] = useState<Tab>("summary");

  const meeting = useLiveQuery(() => db.meetings.get(id), [id]);

  if (meeting === undefined) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-14 max-w-3xl mx-auto font-sans text-ink-mute">
        …
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-14 max-w-3xl mx-auto font-sans text-ink-body">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core"
        >
          ← 我的阁
        </Link>
        <DocketPaper stage="档案" className="mt-10">
          <p className="font-serif text-title text-ink-core mb-3">找不到这次会议。</p>
          <p className="text-body text-ink-mute">
            档案 id：<span className="font-mono">{id}</span> 不在本设备上。
          </p>
        </DocketPaper>
      </main>
    );
  }

  const displayTopic = meeting.topicRefined ?? meeting.topicRaw;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-8 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 我的阁
        </Link>
        <span className="inline-flex items-center gap-2 text-xs text-ink-mute">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[meeting.status]}`} />
          {STATUS_LABEL[meeting.status]}
          {meeting.mode === "full" && (
            <span className="ml-2 text-[10px] tracking-[0.18em] text-ink-faint uppercase">
              · 完整内阁会议
            </span>
          )}
        </span>
      </header>

      <DocketPaper
        stage="会议档案"
        meta={formatDateTime(meeting.createdAt)}
        className="mb-8"
      >
        <p className="font-serif text-headline text-ink-core leading-snug mb-1">
          {displayTopic}
        </p>
        {meeting.topicRevised && (
          <p className="mt-2 text-body-sm text-ink-mute italic">
            修订议题：{meeting.topicRevised}
          </p>
        )}
      </DocketPaper>

      {/* Tab bar */}
      <div className="flex border-b border-paper-edge mb-6 -mx-2 sm:mx-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "px-4 sm:px-5 py-3 text-body-sm transition-colors relative",
                active
                  ? "text-ink-core"
                  : "text-ink-mute hover:text-ink-body",
              ].join(" ")}
            >
              <span className="font-medium">{t.label}</span>
              <span className="hidden sm:inline ml-2 text-xs text-ink-faint">
                · {t.hint}
              </span>
              {active && (
                <span className="absolute left-2 right-2 sm:left-3 sm:right-3 -bottom-px h-px bg-ink-core" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "summary" && <SummaryTab meeting={meeting} />}
      {tab === "raw" && <RawTab meeting={meeting} />}
      {tab === "aftermath" && <AftermathTab meeting={meeting} />}
    </main>
  );
}

// ───────────────────────────────────────────────────────────
// Summary
// ───────────────────────────────────────────────────────────
function SummaryTab({ meeting }: { meeting: Meeting }) {
  const loudest = meeting.verdict?.loudestSeatId;
  return (
    <div className="space-y-5">
      <DocketPaper stage="本次组阁">
        <div className="flex flex-wrap gap-2">
          {meeting.seatIds.map((id) => {
            const s = SELVES[id as SelfId];
            if (!s) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-paper-base border border-paper-edge text-body-sm text-ink-body"
                style={{
                  borderLeft: `3px solid var(--color-${seatColorVar(id as SelfId)})`,
                }}
              >
                <span className="font-medium text-ink-core">{s.name}</span>
                <span className="text-xs text-ink-mute">{s.ifs_label}</span>
                {id === loudest && (
                  <span className="text-[10px] tracking-wider text-attention-copper uppercase">
                    最响
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </DocketPaper>

      {meeting.verdict && (
        <DocketPaper
          stage="此刻的我"
          marginalia={meeting.verdict.insight || undefined}
        >
          <p className="font-serif text-verdict text-ink-core leading-relaxed whitespace-pre-line">
            {meeting.verdict.text}
          </p>
        </DocketPaper>
      )}

      {meeting.signature && (
        <DocketPaper stage="签字">
          {meeting.signature.decision === "signed" && meeting.signature.action24h ? (
            <>
              <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
                接下来 24 小时
              </div>
              <p className="font-serif text-title text-ink-core leading-snug">
                「{meeting.signature.action24h}」
              </p>
              <p className="mt-3 text-body-sm text-ink-mute">
                — 签字于 {formatDateTime(meeting.signature.at)}
              </p>
            </>
          ) : meeting.signature.decision === "paused" ? (
            <p className="font-serif text-title text-ink-core italic">
              这次议题选择暂缓——这也是一种诚实。
            </p>
          ) : (
            <p className="font-serif text-title text-ink-core italic">
              你诚实地说了「我在逃避」——这本身就是一步。
            </p>
          )}
        </DocketPaper>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Raw transcript
// ───────────────────────────────────────────────────────────
function RawTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="space-y-5">
      <DocketPaper stage={`${meeting.turns.length} 席表态`}>
        <div className="space-y-3">
          {meeting.turns.map((t, i) => {
            const s = SELVES[t.seatId as SelfId];
            if (!s) return null;
            return (
              <SeatNameplate
                key={i}
                seatId={t.seatId as SelfId}
                name={s.name}
                ifsLabel={s.ifs_label}
                state={
                  meeting.verdict?.loudestSeatId === t.seatId ? "speaking" : "default"
                }
                text={t.text}
              />
            );
          })}
        </div>
      </DocketPaper>

      {meeting.followups.length > 0 && (
        <DocketPaper stage="点名追问">
          <div className="space-y-4">
            {meeting.followups.map((f, i) => {
              const s = SELVES[f.seatId as SelfId];
              return (
                <div key={i}>
                  <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
                    问 {s?.name ?? f.seatId}
                  </div>
                  <p className="font-serif text-body-long text-ink-body italic mb-2">
                    「{f.question}」
                  </p>
                  <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
                    {f.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </DocketPaper>
      )}

      {meeting.crossExams && meeting.crossExams.length > 0 && (
        <DocketPaper stage="交叉质询">
          <div className="space-y-4">
            {meeting.crossExams.map((c, i) => {
              const from = SELVES[c.fromSeatId as SelfId];
              const to = SELVES[c.toSeatId as SelfId];
              const mark = meeting.userMarks?.find(
                (m) => m.targetKind === "cross" && m.targetIndex === i
              );
              return (
                <div
                  key={i}
                  className="border-l-3 border-paper-edge pl-4"
                >
                  <div className="text-xs text-ink-mute mb-1">
                    {from?.name} → {to?.name}
                  </div>
                  <p className="font-serif text-body-long text-ink-body leading-relaxed mb-2">
                    「{c.text}」
                  </p>
                  {mark && <UserMarkBadge mark={mark.judgement} reply={mark.reply} />}
                </div>
              );
            })}
          </div>
        </DocketPaper>
      )}
    </div>
  );
}

function UserMarkBadge({
  mark,
  reply,
}: {
  mark: "hit" | "miss" | "i-want-to-answer";
  reply?: string;
}) {
  if (mark === "hit") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-safe-green/10 text-safe-green border border-safe-green/30">
        你说：问中了
      </span>
    );
  }
  if (mark === "miss") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-paper-base text-ink-mute border border-paper-edge">
        你说：没问中
      </span>
    );
  }
  return (
    <div className="mt-1">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-attention-copper/10 text-attention-copper border border-attention-copper/30">
        你替自己回答
      </span>
      {reply && (
        <p className="mt-2 font-serif italic text-body-sm text-ink-body leading-relaxed">
          「{reply}」
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Aftermath
// ───────────────────────────────────────────────────────────
function AftermathTab({ meeting }: { meeting: Meeting }) {
  const consent = meeting.memoryConsent;
  const savedSet = new Set(consent?.savedIds ?? []);
  const savedCount = savedSet.size;
  const totalCount = consent?.candidates.length ?? 0;

  // "Cabinet's response" — Week 5 will compute true seat-level power deltas
  // and temporary-seat promotion; for now we surface what we can: who was
  // loudest, who was silenced.
  const loudest = meeting.verdict?.loudestSeatId
    ? SELVES[meeting.verdict.loudestSeatId as SelfId]
    : null;

  return (
    <div className="space-y-5">
      <DocketPaper stage="签字状态">
        <p className="font-serif text-title text-ink-core leading-snug mb-2">
          {meeting.signature?.decision === "signed"
            ? "已签字"
            : meeting.signature?.decision === "paused"
              ? "暂缓"
              : meeting.signature?.decision === "escaped"
                ? "我在逃避"
                : "会议中断，未签字"}
        </p>
        {meeting.signature?.action24h && (
          <p className="text-body text-ink-body italic">
            「{meeting.signature.action24h}」
          </p>
        )}
        {meeting.closedAt && (
          <p className="mt-2 text-body-sm text-ink-mute">
            归档于 {formatDateTime(meeting.closedAt)}
          </p>
        )}
      </DocketPaper>

      {meeting.signature?.action24h && (
        <CommitmentFollowupCard meeting={meeting} />
      )}

      {consent && (
        <DocketPaper stage="记忆">
          <p className="text-body-sm text-ink-mute mb-4">
            这次会议结束时，你保留了 <span className="text-ink-core font-medium">{savedCount}</span> / {totalCount} 条记忆。
          </p>
          <ol className="space-y-3">
            {consent.candidates.map((c) => {
              const kept = savedSet.has(c.id);
              return (
                <li
                  key={c.id}
                  className={[
                    "p-3 rounded-md border transition-colors",
                    kept
                      ? "bg-paper-base border-paper-edge"
                      : "bg-paper-base border-paper-edge opacity-50",
                  ].join(" ")}
                >
                  <p className="text-body text-ink-body leading-snug mb-1">
                    {c.statement}
                  </p>
                  <span className="text-[10px] tracking-wider uppercase text-ink-faint">
                    {kept ? "已记入" : "未记入"}
                  </span>
                </li>
              );
            })}
          </ol>
        </DocketPaper>
      )}

      <DocketPaper stage="对阁的影响" marginalia="Week 4 将计算完整的席位权力变化。">
        {loudest ? (
          <p className="text-body text-ink-body leading-relaxed">
            这次会议里，「<span className="text-ink-core font-medium">{loudest.name}</span>」是最响的声音。
            它最近在你的会议中越来越频繁出现。
          </p>
        ) : (
          <p className="text-body-sm text-ink-mute italic">
            没有最响的声音被记录。
          </p>
        )}
      </DocketPaper>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Loop A · in-archive followup card
// ───────────────────────────────────────────────────────────
const FOLLOWUP_LABEL: Record<CommitmentFollowupResult, { text: string; cls: string }> = {
  done:        { text: "做了 ✓",   cls: "text-safe-green" },
  "not-done":  { text: "没做",     cls: "text-seal-action" },
  forgot:      { text: "忘了",     cls: "text-ink-mute" },
};

function CommitmentFollowupCard({ meeting }: { meeting: Meeting }) {
  const [submitting, setSubmitting] = useState(false);
  const followup = meeting.commitmentFollowup;

  if (followup) {
    const label = FOLLOWUP_LABEL[followup.result];
    return (
      <DocketPaper stage="复盘">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`font-serif text-title ${label.cls}`}>
            {label.text}
          </span>
          <span className="text-xs text-ink-mute">
            {formatDateTime(followup.at)}
          </span>
        </div>
        {followup.note && (
          <p className="mt-2 text-body-sm text-ink-body italic font-serif">
            「{followup.note}」
          </p>
        )}
      </DocketPaper>
    );
  }

  async function record(result: CommitmentFollowupResult) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await recordCommitmentFollowup(meeting.id, result);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DocketPaper stage="复盘" marginalia="复盘是一种诚实，不是评分。">
      <p className="text-body text-ink-body mb-3 leading-relaxed">
        那件 24 小时的事，做了吗？
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => record("done")}
          disabled={submitting}
          className="px-3 py-1.5 rounded-md border border-safe-green/40 text-safe-green text-body-sm hover:bg-safe-green/10 transition-colors disabled:opacity-50"
        >
          做了
        </button>
        <button
          onClick={() => record("not-done")}
          disabled={submitting}
          className="px-3 py-1.5 rounded-md border border-seal-action/40 text-seal-action text-body-sm hover:bg-seal-action/10 transition-colors disabled:opacity-50"
        >
          没做
        </button>
        <button
          onClick={() => record("forgot")}
          disabled={submitting}
          className="px-3 py-1.5 rounded-md border border-paper-edge text-ink-mute text-body-sm hover:bg-paper-base transition-colors disabled:opacity-50"
        >
          忘了
        </button>
      </div>
    </DocketPaper>
  );
}

// ───────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────
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

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
}
