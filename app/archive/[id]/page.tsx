"use client";

// 纸页 — saved five-voice session.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  recordCommitmentFollowup,
  type CommitmentFollowupResult,
  type Meeting,
} from "@/lib/db";
import { DocketPaper } from "@/components/DocketPaper";

type Tab = "summary" | "voices" | "after";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "summary", label: "摘要", hint: "清明句 / 承诺" },
  { id: "voices", label: "原声", hint: "五声 / 追问 / 互问" },
  { id: "after", label: "余波", hint: "记忆 / 复盘" },
];

const STATUS_LABEL: Record<Meeting["status"], string> = {
  in_progress: "进行中",
  signed: "已承诺",
  paused: "暂缓",
  escaped: "我在逃避",
  abandoned: "未完成",
};

const STATUS_DOT: Record<Meeting["status"], string> = {
  in_progress: "bg-attention-copper",
  signed: "bg-safe-green",
  paused: "bg-ink-mute",
  escaped: "bg-seal-action",
  abandoned: "bg-ink-faint",
};

export default function ArchivePage() {
  const params = useParams<{ id: string }>();
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
          ← 我的声音
        </Link>
        <DocketPaper stage="纸页" className="mt-10">
          <p className="font-serif text-title text-ink-core mb-3">找不到这次记录。</p>
          <p className="text-body text-ink-mute">
            id：<span className="font-mono">{id}</span> 不在本设备上。
          </p>
        </DocketPaper>
      </main>
    );
  }

  const title = meeting.claritySentence || meeting.workingFocus || meeting.petition;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-8 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 我的声音
        </Link>
        <span className="inline-flex items-center gap-2 text-xs text-ink-mute">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[meeting.status]}`} />
          {STATUS_LABEL[meeting.status]}
        </span>
      </header>

      <DocketPaper stage="纸页" meta={formatDateTime(meeting.createdAt)} className="mb-8">
        <p className="font-serif text-headline text-ink-core leading-snug mb-3">
          {title}
        </p>
        <p className="text-body-sm text-ink-mute leading-relaxed">
          陈情：{meeting.petition}
        </p>
      </DocketPaper>

      <div className="flex border-b border-paper-edge mb-6 -mx-2 sm:mx-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "px-4 sm:px-5 py-3 text-body-sm transition-colors relative",
                active ? "text-ink-core" : "text-ink-mute hover:text-ink-body",
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
      {tab === "voices" && <VoicesTab meeting={meeting} />}
      {tab === "after" && <AfterTab meeting={meeting} />}
    </main>
  );
}

function SummaryTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="space-y-5">
      <DocketPaper stage="工作焦点">
        <p className="font-serif text-title text-ink-core leading-snug">
          {meeting.workingFocus}
        </p>
      </DocketPaper>

      {meeting.nowMe && (
        <DocketPaper stage="NowMe" marginalia={meeting.nowMe.insight || undefined}>
          <p className="font-serif text-verdict text-ink-core leading-relaxed whitespace-pre-line">
            {meeting.nowMe.text}
          </p>
          {meeting.nowMe.loudestVoiceName && (
            <p className="mt-3 text-body-sm text-ink-mute">
              最响的声音：{meeting.nowMe.loudestVoiceName}
            </p>
          )}
        </DocketPaper>
      )}

      {meeting.commitment24h && (
        <DocketPaper stage="24h 承诺">
          <p className="font-serif text-title text-ink-core leading-snug">
            「{meeting.commitment24h}」
          </p>
          {meeting.closedAt && (
            <p className="mt-3 text-body-sm text-ink-mute">
              保存于 {formatDateTime(meeting.closedAt)}
            </p>
          )}
        </DocketPaper>
      )}
    </div>
  );
}

function VoicesTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="space-y-5">
      <DocketPaper stage="五声入席">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meeting.activatedVoices.map((v) => (
            <article key={v.voiceId} className="bg-paper-base border border-paper-edge rounded-md p-3">
              <div className="font-medium text-ink-core mb-1">{v.name}</div>
              <p className="text-body-sm text-ink-mute mb-2">{v.activatedReason}</p>
              <p className="text-body-sm text-ink-body font-serif">保护：{v.protect}</p>
              <p className="text-body-sm text-ink-mute font-serif">怕：{v.fear}</p>
            </article>
          ))}
        </div>
      </DocketPaper>

      <DocketPaper stage="五声表态">
        <div className="space-y-4">
          {meeting.voiceTurns.map((t) => (
            <article key={`${t.voiceId}-${t.at}`} className="border-l-3 border-paper-edge pl-4">
              <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
                {t.name}
              </div>
              <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
                {t.text}
              </p>
            </article>
          ))}
        </div>
      </DocketPaper>

      {meeting.followups.length > 0 && (
        <DocketPaper stage="点名追问">
          <div className="space-y-4">
            {meeting.followups.map((f) => (
              <div key={`${f.voiceId}-${f.at}`}>
                <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
                  问 {f.voiceName}
                </div>
                <p className="font-serif text-body-long text-ink-body italic mb-2">
                  「{f.question}」
                </p>
                <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </DocketPaper>
      )}

      {meeting.roleReversalTurns.length > 0 && (
        <DocketPaper stage="换位回答">
          <div className="space-y-3">
            {meeting.roleReversalTurns.map((r) => (
              <p key={`${r.voiceId}-${r.at}`} className="font-serif italic text-body text-ink-body">
                坐到「{r.voiceName}」的位置：{r.text}
              </p>
            ))}
          </div>
        </DocketPaper>
      )}

      {meeting.crossClarifications.length > 0 && (
        <DocketPaper stage="五声互问">
          <div className="space-y-4">
            {meeting.crossClarifications.map((c) => (
              <div key={`${c.fromVoiceId}-${c.toVoiceId}-${c.at}`} className="border-l-3 border-attention-copper pl-4">
                <div className="text-xs text-ink-mute mb-1">
                  {c.fromName} 问 {c.toName}
                </div>
                <p className="font-serif text-body-long text-ink-core leading-relaxed mb-2">
                  「{c.question}」
                </p>
                {c.response && (
                  <p className="text-body-sm text-ink-body leading-relaxed">
                    {c.toName}：{c.response}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DocketPaper>
      )}
    </div>
  );
}

function AfterTab({ meeting }: { meeting: Meeting }) {
  const consent = meeting.memoryConsent;
  const savedSet = new Set(consent?.savedIds ?? []);
  return (
    <div className="space-y-5">
      {meeting.commitment24h && <CommitmentFollowupCard meeting={meeting} />}

      {consent && (
        <DocketPaper stage="记忆">
          <p className="text-body-sm text-ink-mute mb-4">
            这次你保留了 <span className="text-ink-core font-medium">{savedSet.size}</span> / {consent.candidates.length} 条记忆。
          </p>
          <ol className="space-y-3">
            {consent.candidates.map((c) => {
              const kept = savedSet.has(c.id);
              return (
                <li
                  key={c.id}
                  className={[
                    "p-3 rounded-md border transition-colors",
                    kept ? "bg-paper-base border-paper-edge" : "bg-paper-base border-paper-edge opacity-50",
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
    </div>
  );
}

const FOLLOWUP_LABEL: Record<CommitmentFollowupResult, { text: string; cls: string }> = {
  done: { text: "做了 ✓", cls: "text-safe-green" },
  "not-done": { text: "没做", cls: "text-seal-action" },
  forgot: { text: "忘了", cls: "text-ink-mute" },
};

function CommitmentFollowupCard({ meeting }: { meeting: Meeting }) {
  const [submitting, setSubmitting] = useState(false);
  const followup = meeting.commitmentFollowup;

  if (followup) {
    const label = FOLLOWUP_LABEL[followup.result];
    return (
      <DocketPaper stage="复盘">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`font-serif text-title ${label.cls}`}>{label.text}</span>
          <span className="text-xs text-ink-mute">{formatDateTime(followup.at)}</span>
        </div>
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

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
