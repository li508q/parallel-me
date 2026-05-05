"use client";

// Cabinet workbench home.
// Submits route to /meeting (Quick Meeting state machine).
// V2's SSE rendering, callback opener, follow-up sidecar, and share-card
// helpers have been retired here — the surfaces still live in /me/*.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ProviderStatusPill } from "@/components/ProviderStatusPill";
import { DocketPaper } from "@/components/DocketPaper";
import {
  db,
  recordCommitmentFollowup,
  type Meeting,
  type CommitmentFollowupResult,
} from "@/lib/db";
import { lastEpisode, type Episode } from "@/lib/memory";

const PRESETS = [
  "我妈让我考公，我现在大厂月薪 2.5w，回老家月薪能到 6k。",
  "处了 3 年的对象想结婚了，但我一想到结婚就喘不过气。",
  "副业月入 8k，本职 2w，要不要 all in 副业？",
  "26 岁，朋友都开始定居了，我还想去清迈待半年。",
  "凌晨 2 点老板在群里发了个 OK?，我现在心率 120。",
];

type MeetingMode = "quick" | "full";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MeetingMode>("quick");
  const [legacyEpisode, setLegacyEpisode] = useState<Episode | null>(null);

  // Live queries — auto-refresh when meetings are written from any tab.
  const meetings =
    useLiveQuery(
      () => db.meetings.orderBy("createdAt").reverse().limit(3).toArray(),
      []
    ) ?? [];
  const pending =
    useLiveQuery(
      () =>
        db.meetings
          .where("status")
          .equals("signed")
          .filter(
            (m) =>
              !!m.signature?.action24h &&
              !m.commitmentFollowup &&
              (m.closedAt ?? 0) > Date.now() - 14 * 86_400_000
          )
          .reverse()
          .limit(5)
          .toArray()
          .then((arr) => arr.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))),
      []
    ) ?? [];

  useEffect(() => {
    setLegacyEpisode(lastEpisode());
  }, []);

  function startMeeting(topic: string, modeOverride?: MeetingMode) {
    const t = topic.trim();
    if (!t) return;
    const m = modeOverride ?? mode;
    const suffix = m === "full" ? "&mode=full" : "";
    router.push(`/meeting?topic=${encodeURIComponent(t)}${suffix}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startMeeting(input);
  }

  // Cabinet snapshot resolution: prefer current Dexie; gracefully fall back to
  // pre-existing V2 episodes so users with V2 data still see a populated home.
  const recentMeetingCard: CardData | null = meetings[0]
    ? {
        title: meetings[0].topicRefined ?? meetings[0].topicRaw,
        meta: timeAgo(meetings[0].createdAt),
        href: `/archive/${meetings[0].id}`,
      }
    : legacyEpisode
      ? {
          title: legacyEpisode.title,
          meta: `${timeAgo(legacyEpisode.ts)} · 旧版档案`,
          href: "/me/pages",
        }
      : null;

  const pendingMeeting = pending[0] ?? null;

  return (
    <main className="min-h-screen px-5 sm:px-10 pt-10 sm:pt-16 pb-24 max-w-4xl mx-auto font-sans text-ink-body">
      {/* ─── header ─── */}
      <header className="mb-10 sm:mb-14 animate-ink-in">
        <div className="flex items-center justify-between mb-10 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-ink-mute uppercase">
            <span className="w-1 h-1 rounded-full bg-ink-core animate-soft-pulse" />
            ParallelMe · 我的阁
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ProviderStatusPill />
            <Link
              href="/cabinet"
              className="text-xs tracking-wider text-ink-mute hover:text-ink-core underline-offset-4 hover:underline"
            >
              我的阁
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
          今天<br />
          要开什么会？
        </h1>
        <p className="text-body sm:text-body-long text-ink-body max-w-xl leading-relaxed">
          写下那个没人能替你决定的议题。<br className="hidden sm:block" />
          这里不是聊天框，是你的内在会议室。
        </p>
      </header>

      {/* ─── topic input ─── */}
      <form onSubmit={onSubmit} className="mb-8">
        <DocketPaper>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 800))}
            placeholder={
              "把那件让你睡不着的事，原原本本地写下来。\n越具体，三席越能为你较劲。"
            }
            rows={4}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit(e as any);
            }}
            className="w-full bg-transparent outline-none resize-none text-body-long text-ink-body placeholder-ink-faint font-serif"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-paper-edge">
            <span className="text-xs text-ink-mute">
              ⌘ / Ctrl + Enter 立刻开会 · {input.length}/800
            </span>
            <div className="flex items-center gap-3">
              <div
                className="inline-flex items-center text-xs rounded-md border border-paper-edge overflow-hidden"
                role="radiogroup"
                aria-label="会议模式"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "quick"}
                  onClick={() => setMode("quick")}
                  className={`px-3 py-1.5 transition-colors ${
                    mode === "quick"
                      ? "bg-ink-core text-paper-base"
                      : "text-ink-mute hover:text-ink-core"
                  }`}
                  title="3 席 · 5 分钟"
                >
                  快速
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "full"}
                  onClick={() => setMode("full")}
                  className={`px-3 py-1.5 transition-colors ${
                    mode === "full"
                      ? "bg-ink-core text-paper-base"
                      : "text-ink-mute hover:text-ink-core"
                  }`}
                  title="5 席 + 交叉质询 + 议案修订 · 10-15 分钟"
                >
                  完整
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                开会 →
              </button>
            </div>
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
              onClick={() => startMeeting(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-paper-edge text-ink-body hover:border-ink-core hover:bg-paper-lift transition-colors"
            >
              {p.length > 22 ? p.slice(0, 22) + "…" : p}
            </button>
          ))}
        </div>
      </form>

      {/* ─── cabinet snapshot ─── */}
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PendingCommitmentCard meeting={pendingMeeting} legacy={legacyEpisode} />
        <CabinetCard
          label="反复议题"
          data={null}
          emptyHint="同一个问题反复回来时，这里会标记。"
        />
        <CabinetCard
          label="最近会议"
          data={recentMeetingCard}
          emptyHint="第一次开会后，这里会显示档案。"
        />
      </section>

      {/* ─── footer ─── */}
      <footer className="mt-32 pt-10 border-t border-paper-edge text-xs text-ink-mute leading-relaxed">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-ink-body mb-1">
              平行的我 · ParallelMe
            </div>
            <div>你内心的多个声音，第一次被允许同时讲话。</div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Link href="/me" className="hover:text-ink-core underline-offset-4 hover:underline">
              底片
            </Link>
            <a href="/AGENTS.md" className="hover:text-ink-core underline-offset-4 hover:underline">
              AGENTS.md
            </a>
            <a href="/.well-known/agent.json" className="hover:text-ink-core underline-offset-4 hover:underline">
              A2A spec
            </a>
            <a href="/api/agent" className="hover:text-ink-core underline-offset-4 hover:underline">
              API
            </a>
            <Link href="/about" className="hover:text-ink-core underline-offset-4 hover:underline">
              关于
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ───────────────────────────────────────────────────────────
// Cabinet snapshot card — empty-friendly, optional href
// ───────────────────────────────────────────────────────────
interface CardData {
  title: string;
  meta?: string;
  href?: string;
}

function CabinetCard({
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
          {data.meta && (
            <p className="text-xs text-ink-mute">{data.meta}</p>
          )}
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

function timeAgo(ts: number): string {
  const days = Math.max(0, Math.round((Date.now() - ts) / 86_400_000));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}

// ───────────────────────────────────────────────────────────
// Loop A · 24h commitment review card
// ───────────────────────────────────────────────────────────
function PendingCommitmentCard({
  meeting,
  legacy,
}: {
  meeting: Meeting | null;
  legacy: Episode | null;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Empty case — no pending commitments and no V2 legacy
  const hasMeeting = !!meeting?.signature?.action24h;
  const hasLegacy = !hasMeeting && legacy?.followup == null && !!legacy?.decision;

  if (!hasMeeting && !hasLegacy) {
    return (
      <CabinetCard
        label="待复盘承诺"
        data={null}
        emptyHint="签字之后，这里会出现你的 24 小时承诺。"
      />
    );
  }

  if (hasMeeting && meeting) {
    const action = meeting.signature!.action24h!;
    const ts = meeting.closedAt ?? meeting.createdAt;

    async function record(result: CommitmentFollowupResult) {
      if (submitting || !meeting) return;
      setSubmitting(true);
      await recordCommitmentFollowup(meeting.id, result);
      // useLiveQuery picks up the change and removes this card automatically.
    }

    return (
      <div className="h-full p-4 rounded-md bg-paper-lift border border-paper-edge transition-colors">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
          待复盘承诺
        </div>
        <p className="text-body-sm text-ink-body italic font-serif leading-snug line-clamp-2 mb-1">
          「{action}」
        </p>
        <p className="text-xs text-ink-mute mb-3">
          {timeAgo(ts)} · 你说会做
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

  // V2 legacy fallback — read-only link to /me/pages where the legacy controls live
  return (
    <Link href="/me/pages" className="block h-full">
      <div className="h-full p-4 rounded-md bg-paper-lift border border-paper-edge transition-colors hover:border-ink-mute">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
          待复盘承诺
        </div>
        <p className="text-body-sm text-ink-body italic font-serif leading-snug line-clamp-2 mb-1">
          「{legacy!.decision}」
        </p>
        <p className="text-xs text-ink-mute">
          {timeAgo(legacy!.ts)} · 旧版承诺，去纸页复盘 →
        </p>
      </div>
    </Link>
  );
}
