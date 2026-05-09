"use client";

// 纸页 — saved v0.7 roundtable record.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  recordCommitmentFollowup,
  type CommitmentFollowupResult,
  type Meeting,
  type RoundtableTurn,
} from "@/lib/db";
import { DocketPaper } from "@/components/DocketPaper";
import { VOICE_IDS, voiceName } from "@/lib/v7";
import { SELVES } from "@/lib/selves";

type Tab = "summary" | "roundtable" | "scribe";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "summary", label: "落定", hint: "清明句 / 承诺" },
  { id: "roundtable", label: "圆桌", hint: "五声 / 对峙" },
  { id: "scribe", label: "书记员", hint: "议题 / 问询" },
];

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
        <BackLink />
        <DocketPaper stage="纸页" className="mt-10">
          <p className="font-serif text-title text-ink-core mb-3">找不到这次记录。</p>
          <p className="text-body text-ink-mute">
            id：<span className="font-mono">{id}</span> 不在本设备上。
          </p>
        </DocketPaper>
      </main>
    );
  }

  const title =
    meeting.clarity?.clarity_sentence ||
    meeting.task_frame?.visible.problem_definition ||
    meeting.raw_input;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-8 flex items-center justify-between gap-3 flex-wrap">
        <BackLink />
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
          原始输入：{meeting.raw_input}
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
              <span className="hidden sm:inline ml-2 text-xs text-ink-faint">· {t.hint}</span>
              {active && (
                <span className="absolute left-2 right-2 sm:left-3 sm:right-3 -bottom-px h-px bg-ink-core" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "summary" && <SummaryTab meeting={meeting} />}
      {tab === "roundtable" && <RoundtableTab meeting={meeting} />}
      {tab === "scribe" && <ScribeTab meeting={meeting} />}
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
    >
      ← 我的声音
    </Link>
  );
}

function SummaryTab({ meeting }: { meeting: Meeting }) {
  const clarity = meeting.clarity;
  return (
    <div className="space-y-5">
      {clarity && (
        <DocketPaper stage="清明句">
          <p className="font-serif text-verdict text-ink-core leading-relaxed whitespace-pre-line">
            {clarity.clarity_sentence}
          </p>
        </DocketPaper>
      )}

      {clarity && (
        <div className="grid md:grid-cols-2 gap-4">
          <DocketPaper stage="偏好读数" dense>
            <p className="font-serif text-body-long text-ink-body leading-relaxed">
              {clarity.preference_readout}
            </p>
          </DocketPaper>
          <DocketPaper stage="代价承认" dense>
            <p className="font-serif text-body-long text-ink-body leading-relaxed">
              {clarity.tradeoff_acknowledgement}
            </p>
          </DocketPaper>
        </div>
      )}

      {clarity && (
        <DocketPaper stage="24h 承诺">
          <p className="font-serif text-title text-ink-core leading-snug">
            「{clarity.commitment24h}」
          </p>
          <p className="mt-3 text-body-sm text-ink-mute">
            此刻落点：{postureLabel(clarity.settlement_posture)}
          </p>
          {meeting.closedAt && (
            <p className="mt-2 text-body-sm text-ink-mute">
              保存于 {formatDateTime(meeting.closedAt)}
            </p>
          )}
        </DocketPaper>
      )}

      {clarity?.commitment24h && <CommitmentFollowupCard meeting={meeting} />}
    </div>
  );
}

function RoundtableTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="space-y-5">
      <DocketPaper stage="本次议题">
        <p className="font-serif text-title text-ink-core leading-snug mb-4">
          {meeting.task_frame?.visible.problem_definition}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-body-sm">
          <ArchiveField label="这件事问你的是" body={meeting.task_frame?.visible.central_question} />
          <ArchiveField label="圆桌焦点" body={meeting.task_frame?.visible.discussion_focus} />
          <ArchiveField label="核心冲突" body={meeting.task_frame?.visible.core_conflict} />
          <ArchiveField label="主要牵动点" body={meeting.task_frame?.visible.main_concerns.join(" / ")} />
        </div>
      </DocketPaper>

      <DocketPaper stage="五声第一轮">
        <div className="space-y-4">
          {VOICE_IDS.map((id) => {
            const turn = meeting.roundtable.opening_turns.find((t) => t.voice_id === id);
            if (!turn) return null;
            return (
              <article key={id} className="border-l-3 border-paper-edge pl-4">
                <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
                  {voiceName(id)}
                </div>
                <p className="font-serif text-title-sm text-ink-core leading-snug mb-2">
                  {turn.thesis}
                </p>
                <p className="text-body-sm text-ink-body leading-relaxed">
                  保护：{turn.protected_value} · 担心：{turn.concern}
                </p>
                <p className="text-body-sm text-ink-mute leading-relaxed">
                  拉向：{turn.pull}
                </p>
              </article>
            );
          })}
        </div>
      </DocketPaper>

      {meeting.roundtable.turns.length > 0 && (
        <DocketPaper stage="自由圆桌">
          <div className="space-y-4">
            {meeting.roundtable.turns.map((turn) => (
              <RoundtableTurnView key={turn.id} turn={turn} />
            ))}
          </div>
        </DocketPaper>
      )}
    </div>
  );
}

function ScribeTab({ meeting }: { meeting: Meeting }) {
  const profile = meeting.preference_profile;
  return (
    <div className="space-y-5">
      {meeting.choice_answers.length > 0 && (
        <DocketPaper stage="选择卡回答">
          <div className="space-y-3">
            {meeting.choice_answers.map((a) => (
              <div key={`${a.card_id}-${a.at}`} className="border-b border-paper-edge last:border-0 pb-3 last:pb-0">
                <div className="text-xs text-ink-mute mb-1">{a.question}</div>
                <p className="font-serif text-body-long text-ink-body">
                  {a.custom_text || a.selected_label}
                </p>
              </div>
            ))}
          </div>
        </DocketPaper>
      )}

      {meeting.inquiry_answers.length > 0 && (
        <DocketPaper stage="书记员问询">
          <div className="space-y-3">
            {meeting.inquiry_answers.map((a) => (
              <div key={`${a.question_id}-${a.at}`} className="border-b border-paper-edge last:border-0 pb-3 last:pb-0">
                <div className="text-xs text-ink-mute mb-1">{a.question}</div>
                <p className="font-serif text-body-long text-ink-body">
                  {a.custom_text || a.selected_label}
                </p>
              </div>
            ))}
          </div>
        </DocketPaper>
      )}

      {profile && (
        <DocketPaper stage="偏好刻画">
          <div className="grid md:grid-cols-2 gap-4">
            <ListField label="已验证倾向" items={profile.validated_leanings} />
            <ListField label="被抗拒的位置" items={profile.resisted_positions} />
            <ListField label="对峙判断" items={profile.conflict_judgments} />
            <ListField label="未解张力" items={profile.unresolved_tensions} />
          </div>
        </DocketPaper>
      )}
    </div>
  );
}

function RoundtableTurnView({ turn }: { turn: RoundtableTurn }) {
  if (turn.trigger === "user_text") {
    return (
      <article className="ml-auto max-w-2xl border border-paper-edge bg-paper-base rounded-md px-4 py-3 text-right">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
          我
        </div>
        <p className="font-serif italic text-body text-ink-core leading-relaxed whitespace-pre-line">
          「{turn.user_text || turn.text}」
        </p>
      </article>
    );
  }
  if (turn.duel) {
    return (
      <article className="border-l-3 border-attention-copper pl-4">
        <div className="text-xs text-ink-mute mb-1">
          {turn.duel.from_name} 问 {turn.duel.to_name}
        </div>
        <p className="font-serif text-body-long text-ink-core leading-relaxed mb-2">
          「{turn.duel.question}」
        </p>
        <p className="text-body-sm text-ink-body leading-relaxed">
          {turn.duel.to_name}：{turn.duel.response}
        </p>
        <p className="mt-2 text-xs text-ink-mute">
          未解开的点：{turn.duel.unresolved_point}
        </p>
      </article>
    );
  }
  return (
    <article className="border-l-3 border-paper-edge pl-4">
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
        {turn.voice_id ? voiceName(turn.voice_id) : "书记员"}
      </div>
      <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
        {turn.text}
      </p>
    </article>
  );
}

function ArchiveField({ label, body }: { label: string; body?: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase mb-1">
        {label}
      </div>
      <p className="font-serif text-ink-body leading-snug">{body || "未记录"}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
        {label}
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="text-body-sm text-ink-body leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-ink-faint italic font-serif">尚未记录。</p>
      )}
    </div>
  );
}

const FOLLOWUP_LABEL: Record<CommitmentFollowupResult, { text: string; cls: string }> = {
  done: { text: "做了", cls: "text-safe-green" },
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
        <button onClick={() => record("done")} disabled={submitting} className="px-3 py-1.5 rounded-md border border-safe-green/40 text-safe-green text-body-sm hover:bg-safe-green/10 transition-colors disabled:opacity-50">
          做了
        </button>
        <button onClick={() => record("not-done")} disabled={submitting} className="px-3 py-1.5 rounded-md border border-seal-action/40 text-seal-action text-body-sm hover:bg-seal-action/10 transition-colors disabled:opacity-50">
          没做
        </button>
        <button onClick={() => record("forgot")} disabled={submitting} className="px-3 py-1.5 rounded-md border border-paper-edge text-ink-mute text-body-sm hover:bg-paper-base transition-colors disabled:opacity-50">
          忘了
        </button>
      </div>
    </DocketPaper>
  );
}

function postureLabel(posture: string): string {
  const labels: Record<string, string> = {
    leaning: "已有倾向",
    not_ready: "暂不决定",
    testing: "先做验证",
    boundary: "先立边界",
    grieving: "先承认失去",
  };
  return labels[posture] || posture;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
