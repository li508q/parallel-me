"use client";

// Home · ParallelMe / 我的声音
// Starts a scribe-guided five-voice roundtable.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ProviderStatusPill } from "@/components/ProviderStatusPill";
import { DocketPaper } from "@/components/DocketPaper";
import { SelfAvatar } from "@/components/SelfAvatar";
import { SELVES, type SelfId } from "@/lib/selves";
import { loadActiveProvider, toRuntimePayload } from "@/lib/provider";
import {
  db,
  recordCommitmentFollowup,
  type CommitmentFollowupResult,
  type Meeting,
} from "@/lib/db";

const PRESETS = [
  "我妈让我考公，我现在大厂月薪 2.5w，回老家月薪能到 6k。",
  "处了 3 年的对象想结婚了，但我一想到结婚就喘不过气。",
  "副业月入 8k，本职 2w，要不要 all in 副业？",
  "26 岁，朋友都开始定居了，我还想去清迈待半年。",
  "凌晨 2 点老板在群里发了个 OK?，我现在心率 120。",
];

const VOICE_IDS: SelfId[] = ["lay", "money", "roam", "filial", "future"];

const VOICE_COLOR: Record<SelfId, string> = {
  lay: "var(--color-seat-rest)",
  money: "var(--color-seat-money)",
  roam: "var(--color-seat-roam)",
  filial: "var(--color-seat-filial)",
  future: "var(--color-seat-future)",
};

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [apiReady, setApiReady] = useState(false);

  const records =
    useLiveQuery(
      () => db.meetings.orderBy("createdAt").reverse().limit(3).toArray(),
      [],
    ) ?? [];
  const pending =
    useLiveQuery(
      () =>
        db.meetings
          .where("status")
          .equals("settled")
          .filter(
            (m) =>
              !!m.clarity?.commitment24h &&
              !m.commitmentFollowup &&
              (m.closedAt ?? 0) > Date.now() - 14 * 86_400_000,
          )
          .reverse()
          .limit(5)
          .toArray()
          .then((arr) => arr.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))),
      [],
    ) ?? [];

  useEffect(() => {
    const refresh = () => setApiReady(!!toRuntimePayload(loadActiveProvider()));
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  function startSession(text: string) {
    if (!toRuntimePayload(loadActiveProvider())) {
      router.push("/setup");
      return;
    }
    const rawInput = text.trim();
    if (!rawInput) return;
    router.push(`/meeting?petition=${encodeURIComponent(rawInput)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startSession(input);
  }

  const recentRecord: CardData | null = records[0]
    ? {
        title:
          records[0].clarity?.clarity_sentence ||
          records[0].task_frame?.visible.problem_definition ||
          records[0].raw_input,
        meta: timeAgo(records[0].createdAt),
        href: `/archive/${records[0].id}`,
      }
    : null;
  const pendingMeeting = pending[0] ?? null;

  return (
    <main className="min-h-screen px-5 sm:px-10 pt-10 sm:pt-16 pb-24 max-w-4xl mx-auto font-sans text-ink-body">
      <header className="mb-8 sm:mb-10 animate-ink-in">
        <div className="flex items-center justify-between mb-10 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-ink-mute uppercase">
            <span className="w-1 h-1 rounded-full bg-ink-core animate-soft-pulse" />
            ParallelMe · 平行的我
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ProviderStatusPill />
            <Link
              href="/voices"
              className="text-xs tracking-wider text-ink-mute hover:text-ink-core underline-offset-4 hover:underline"
            >
              我的声音
            </Link>
            <Link
              href="/me"
              className="text-xs tracking-wider text-ink-mute hover:text-ink-core underline-offset-4 hover:underline"
            >
              底片
            </Link>
            <Link
              href="/about"
              className="text-xs tracking-wider text-ink-mute hover:text-ink-core underline-offset-4 hover:underline"
            >
              序
            </Link>
          </div>
        </div>

        <h1 className="font-serif font-semibold text-headline sm:text-display text-ink-core leading-[1.05] mb-4">
          今天，<br />
          想听见哪件事？
        </h1>
        <p className="text-body sm:text-body-long text-ink-body max-w-xl leading-relaxed">
          写下那份还没被说清楚的困惑。<br className="hidden sm:block" />
          书记员先帮你定义议题，再让五声坐下来慢慢摊开。
        </p>
      </header>

      <FiveVoicesPrimer />

      <form onSubmit={onSubmit} className="mb-8">
        <DocketPaper>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 1200))}
            placeholder={
              "把那件让你反复想起的事，原原本本地写下来。\n事实、关系、身体反应、最怕失去什么，都可以先放在这里。"
            }
            rows={5}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit(e as any);
            }}
            className="w-full bg-transparent outline-none resize-none text-body-long text-ink-body placeholder-ink-faint font-serif"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-paper-edge">
            <span className="text-xs text-ink-mute">
              ⌘ / Ctrl + Enter 开始 · {input.length}/1200
            </span>
            <button
              type="submit"
              disabled={apiReady && !input.trim()}
              className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {apiReady ? "开始五声圆桌 →" : "先配置 API →"}
            </button>
          </div>
        </DocketPaper>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-ink-mute self-center mr-1">
            没头绪？试试：
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => startSession(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-paper-edge text-ink-body hover:border-ink-core hover:bg-paper-lift transition-colors"
            >
              {p.length > 22 ? p.slice(0, 22) + "…" : p}
            </button>
          ))}
        </div>
      </form>

      <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PendingCommitmentCard meeting={pendingMeeting} />
        <SnapshotCard
          label="反复模式"
          data={null}
          emptyHint="相似的拉扯反复出现时，这里会标记。"
        />
        <SnapshotCard
          label="最近记录"
          data={recentRecord}
          emptyHint="第一次五声圆桌后，这里会显示纸页。"
        />
      </section>

      <footer className="mt-32 pt-10 border-t border-paper-edge text-xs text-ink-mute leading-relaxed">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-ink-body mb-1">
              🪞 平行的我 · ParallelMe — 你内心的多个声音，第一次被允许同时讲话。
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <a href="/AGENTS.md" className="hover:text-ink-core underline-offset-4 hover:underline">
              AGENTS.md
            </a>
            <a href="/.well-known/agent.json" className="hover:text-ink-core underline-offset-4 hover:underline">
              A2A spec
            </a>
            <a href="/api/agent" className="hover:text-ink-core underline-offset-4 hover:underline">
              API
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FiveVoicesPrimer() {
  return (
    <section
      aria-label="五声圆桌的五个声音"
      className="mb-7 sm:mb-8 animate-fade-up"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="h-px flex-1 bg-paper-edge" />
        <p className="font-serif italic text-body-sm text-ink-mute text-center">
          不是投票，是让五个熟悉的自己都被听见。
        </p>
        <span className="h-px flex-1 bg-paper-edge" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        {VOICE_IDS.map((id) => {
          const seat = SELVES[id];
          const color = VOICE_COLOR[id];
          return (
            <Link
              key={id}
              href={`/voices/${id}`}
              className="min-w-[132px] sm:min-w-0 rounded-md border border-paper-edge bg-paper-lift/70 px-3 py-3 text-center transition-colors hover:border-ink-mute focus:outline-none focus:ring-2 focus:ring-ink-faint/40"
              style={{ borderTopColor: color }}
            >
              <div className="mb-2 flex justify-center" aria-hidden="true">
                <SelfAvatar id={id} size={46} />
              </div>
              <div className="font-serif text-[15px] leading-tight text-ink-core">
                {seat.name}
              </div>
              <div
                className="mx-auto my-2 h-1 w-1 rounded-full"
                style={{ background: color }}
              />
              <div className="text-[13px] leading-snug text-ink-body">
                {seat.soul?.line}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

interface CardData {
  title: string;
  meta?: string;
  href?: string;
}

function SnapshotCard({
  label,
  data,
  emptyHint,
}: {
  label: string;
  data: CardData | null;
  emptyHint: string;
}) {
  const inner = (
    <div className="h-full p-4 rounded-md bg-paper-lift border border-paper-edge transition-colors hover:border-ink-mute">
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
        {label}
      </div>
      {!data ? (
        <p className="text-body-sm text-ink-faint italic leading-snug font-serif">
          {emptyHint}
        </p>
      ) : (
        <>
          <p className="text-body-sm text-ink-body leading-snug line-clamp-2 mb-1">
            {data.title}
          </p>
          {data.meta && <p className="text-xs text-ink-mute">{data.meta}</p>}
        </>
      )}
    </div>
  );

  return data?.href ? (
    <Link href={data.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function PendingCommitmentCard({ meeting }: { meeting: Meeting | null }) {
  const [submitting, setSubmitting] = useState(false);

  if (!meeting?.clarity?.commitment24h) {
    return (
      <SnapshotCard
        label="待复盘承诺"
        data={null}
        emptyHint="写下 24h 承诺后，这里会提醒你回来看看。"
      />
    );
  }

  async function record(result: CommitmentFollowupResult) {
    if (submitting || !meeting) return;
    setSubmitting(true);
    await recordCommitmentFollowup(meeting.id, result);
  }

  return (
    <div className="h-full p-4 rounded-md bg-paper-lift border border-paper-edge transition-colors">
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
        待复盘承诺
      </div>
      <p className="text-body-sm text-ink-body italic font-serif leading-snug line-clamp-2 mb-1">
        「{meeting.clarity.commitment24h}」
      </p>
      <p className="text-xs text-ink-mute mb-3">
        {timeAgo(meeting.closedAt ?? meeting.createdAt)} · 你说会做
      </p>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={() => record("done")}
          disabled={submitting}
          className="px-2.5 py-1 rounded-full border border-safe-green/40 text-safe-green hover:bg-safe-green/10 transition-colors disabled:opacity-50"
        >
          做了
        </button>
        <button
          onClick={() => record("not-done")}
          disabled={submitting}
          className="px-2.5 py-1 rounded-full border border-seal-action/40 text-seal-action hover:bg-seal-action/10 transition-colors disabled:opacity-50"
        >
          没做
        </button>
        <button
          onClick={() => record("forgot")}
          disabled={submitting}
          className="px-2.5 py-1 rounded-full border border-paper-edge text-ink-mute hover:bg-paper-base transition-colors disabled:opacity-50"
        >
          忘了
        </button>
      </div>
    </div>
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
