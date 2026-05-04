"use client";

// V3 cabinet workbench home.
// Submits route to /meeting (Quick Meeting state machine).
// V2's SSE rendering, callback opener, follow-up sidecar, and share-card
// helpers have been retired here — the surfaces still live in /me/*.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderStatusPill } from "@/components/ProviderStatusPill";
import { DocketPaper } from "@/components/DocketPaper";
import {
  recentMeetings,
  pendingCommitments,
  type Meeting,
} from "@/lib/db";
import { lastEpisode, type Episode } from "@/lib/memory";

const PRESETS = [
  "我妈让我考公，我现在大厂月薪 2.5w，回老家月薪能到 6k。",
  "处了 3 年的对象想结婚了，但我一想到结婚就喘不过气。",
  "副业月入 8k，本职 2w，要不要 all in 副业？",
  "26 岁，朋友都开始定居了，我还想去清迈待半年。",
  "凌晨 2 点老板在群里发了个 OK?，我现在心率 120。",
];

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pending, setPending] = useState<Meeting[]>([]);
  const [legacyEpisode, setLegacyEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    recentMeetings(3).then(setMeetings).catch(() => {});
    pendingCommitments().then(setPending).catch(() => {});
    setLegacyEpisode(lastEpisode());
  }, []);

  function startMeeting(topic: string) {
    const t = topic.trim();
    if (!t) return;
    router.push(`/meeting?topic=${encodeURIComponent(t)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startMeeting(input);
  }

  // Cabinet snapshot resolution: prefer V3 Dexie; gracefully fall back to
  // pre-existing V2 episodes so users with V2 data still see a populated home.
  const recentMeetingCard: CardData | null = meetings[0]
    ? {
        title: meetings[0].topicRefined ?? meetings[0].topicRaw,
        meta: timeAgo(meetings[0].createdAt),
        href: undefined, // direct meeting view is Week 3
      }
    : legacyEpisode
      ? {
          title: legacyEpisode.title,
          meta: `${timeAgo(legacyEpisode.ts)} · 旧版档案`,
          href: "/me/pages",
        }
      : null;

  const pendingCard: CardData | null = pending[0]?.signature?.action24h
    ? {
        title: `「${pending[0].signature.action24h}」`,
        meta: `${timeAgo(pending[0].closedAt ?? pending[0].createdAt)} · 你说会做`,
      }
    : legacyEpisode?.followup == null && legacyEpisode?.decision
      ? {
          title: `「${legacyEpisode.decision}」`,
          meta: `${timeAgo(legacyEpisode.ts)} · 旧版承诺`,
          href: "/me/insights",
        }
      : null;

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
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-paper-edge">
            <span className="text-xs text-ink-mute">
              ⌘ / Ctrl + Enter 立刻开会 · {input.length}/800
            </span>
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              开会 →
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
        <CabinetCard
          label="待复盘承诺"
          data={pendingCard}
          emptyHint="签字之后，这里会出现你的 24 小时承诺。"
        />
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
            <div>为傅盛 AI 战队 × EasyClaw Link 黑客松而生</div>
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
