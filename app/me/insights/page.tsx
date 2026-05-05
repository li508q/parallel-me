"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { SelfAvatar } from "@/components/SelfAvatar";
import { SELVES, type SelfId } from "@/lib/selves";
import { db } from "@/lib/db";

const STANDING_IDS: SelfId[] = ["lay", "money", "roam", "filial", "future"];

const VOICE_TEXT_CLASS: Record<SelfId, string> = {
  lay: "text-lay",
  money: "text-money",
  roam: "text-roam",
  filial: "text-filial",
  future: "text-future",
};

const VOICE_BG_CLASS: Record<SelfId, string> = {
  lay: "bg-lay",
  money: "bg-money",
  roam: "bg-roam",
  filial: "bg-filial",
  future: "bg-future",
};

export default function InsightsPage() {
  const records = useLiveQuery(() => db.meetings.orderBy("createdAt").reverse().toArray(), []);

  const ranking = useMemo(() => {
    const counts: Record<SelfId, number> = {
      lay: 0,
      money: 0,
      roam: 0,
      filial: 0,
      future: 0,
    };
    for (const record of records || []) {
      for (const turn of record.voiceTurns) {
        const id = turn.voiceId as SelfId;
        if (counts[id] !== undefined) counts[id] += 1;
      }
    }
    const total = Math.max(1, records?.length || 0);
    return STANDING_IDS.map((id) => ({
      id,
      n: counts[id],
      pct: Math.round((counts[id] / total) * 100),
    })).sort((a, b) => b.n - a.n);
  }, [records]);

  const leastAsked = useMemo(() => {
    const asked: Record<SelfId, number> = {
      lay: 0,
      money: 0,
      roam: 0,
      filial: 0,
      future: 0,
    };
    for (const record of records || []) {
      for (const followup of record.followups) {
        const id = followup.voiceId as SelfId;
        if (asked[id] !== undefined) asked[id] += 1;
      }
    }
    return STANDING_IDS.map((id) => ({ id, n: asked[id] })).sort((a, b) => a.n - b.n);
  }, [records]);

  const totalRecords = records?.length || 0;
  const latest = records?.[0];
  const oldest = records?.[records.length - 1];
  const days =
    oldest && totalRecords > 0
      ? Math.max(1, Math.round((Date.now() - oldest.createdAt) / 86_400_000))
      : 0;

  if (!records || totalRecords === 0) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-16 max-w-2xl mx-auto font-body">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/me"
            className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase"
          >
            ← 底片
          </Link>
          <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
            自照
          </span>
        </div>
        <div className="text-center py-20">
          <h1 className="font-display text-display mb-4">
            自<span className="scribble">照</span>
          </h1>
          <p className="font-display text-base text-ink3 italic mb-6">
            — 先留下一张纸页。
          </p>
          <p className="text-ink2 mb-8">
            至少留下 3 张纸页，这里才会整理出一段时间里的声音倾向。
          </p>
          <Link
            href="/"
            className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85"
          >
            先聊一次 →
          </Link>
        </div>
      </main>
    );
  }

  if (totalRecords < 3) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-16 max-w-2xl mx-auto font-body">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/me"
            className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase"
          >
            ← 底片
          </Link>
        </div>
        <h1 className="font-display text-display mb-4">
          自<span className="scribble">照</span>
        </h1>
        <p className="font-display text-xl text-ink2 mb-8">
          还差 {3 - totalRecords} 次，就能照出这段时间的声音倾向。
        </p>
        <p className="text-ink3 mb-8">已经留下 {totalRecords} 张纸页。</p>
        <Link
          href="/"
          className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85"
        >
          再进行一次五声会谈 →
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12">
        <Link
          href="/me"
          className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase"
        >
          ← 底片
        </Link>
        <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
          自照
        </span>
      </div>

      <section className="mb-14 animate-ink-in">
        <p className="font-display text-base text-ink3 italic mb-3">
          — 不是结论，是一段时间里的声音纹理。
        </p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          自<span className="scribble">照</span>
        </h1>
        <p className="font-display text-xl text-ink2 leading-relaxed">
          {days > 0 ? `这 ${days} 天里` : "这段时间里"}，
          <br />
          你和五声一共谈了{" "}
          <span className="text-ink font-semibold">{totalRecords}</span> 次。
        </p>
      </section>

      <section className="mb-14 animate-fade-up">
        <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-4">
          ⓵ 哪些声音最常出现
        </div>
        <div className="space-y-3">
          {ranking.map((r) => {
            const meta = SELVES[r.id];
            return (
              <div key={r.id} className="flex items-center gap-3">
                <SelfAvatar id={r.id} size={32} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-display ${VOICE_TEXT_CLASS[r.id]} font-semibold`}>
                      {meta.name}
                    </span>
                    <span className="text-xs text-ink3">
                      {r.n} 次 · {r.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-rule/40 rounded-full overflow-hidden">
                    <div className={`h-full ${VOICE_BG_CLASS[r.id]}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {ranking[0] && (
          <p className="mt-6 font-display text-lg text-ink2 italic">
            — 最近最常响起的，是
            <span className={`${VOICE_TEXT_CLASS[ranking[0].id]} font-semibold not-italic`}>
              {SELVES[ranking[0].id].name}
            </span>
            。
          </p>
        )}
      </section>

      {leastAsked[0] && (
        <section className="mb-14 animate-fade-up bg-paper border-2 border-dashed border-ink/15 rounded-3xl p-7">
          <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-3">
            ⓶ 最少被追问的声音
          </div>
          <div className="flex items-center gap-4">
            <div className="opacity-60">
              <SelfAvatar id={leastAsked[0].id} size={56} />
            </div>
            <div>
              <div
                className={`font-display text-2xl ${VOICE_TEXT_CLASS[leastAsked[0].id]} font-semibold mb-1`}
              >
                {SELVES[leastAsked[0].id].name}
              </div>
              <div className="text-sm text-ink3">
                被点名追问 {leastAsked[0].n} 次。下次可以多坐到它的位置听一听。
              </div>
            </div>
          </div>
        </section>
      )}

      {latest && (
        <section className="mb-14 animate-fade-up text-center">
          <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-4">
            ⓷ 最近的清明句
          </div>
          <div className="bg-surface-deep text-paper p-8 sm:p-12 rounded-3xl">
            <div className="font-display text-3xl sm:text-4xl mb-4 leading-tight">
              「{latest.claritySentence || latest.workingFocus || latest.petition}」
            </div>
            {latest.commitment24h && (
              <p className="text-paper/80 text-base leading-relaxed mb-5">
                24h 承诺：{latest.commitment24h}
              </p>
            )}
            <div className="text-xs text-paper/50">
              — {new Date(latest.createdAt).toLocaleDateString("zh-CN")}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
