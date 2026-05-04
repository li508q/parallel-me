"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadEpisodes, memoryStats, type Episode } from "@/lib/memory";
import { SelfAvatar } from "@/components/SelfAvatar";
import { SELVES, type SelfId } from "@/lib/selves";

// 「自照」/「侧记」合并页 — Wrapped 风格 + AI 笔记
export default function InsightsPage() {
  const [eps, setEps] = useState<Episode[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setEps(loadEpisodes());
    setStats(memoryStats());
  }, []);

  const ranking = useMemo(() => {
    if (!stats) return [];
    const total = (stats.episodes || 1);
    return Object.entries(stats.dominant || {})
      .map(([id, n]: any) => ({ id: id as SelfId, n: n as number, pct: Math.round(((n as number)/total)*100) }))
      .sort((a, b) => b.n - a.n);
  }, [stats]);

  const silentRanking = useMemo(() => {
    if (!stats || !eps.length) return [];
    return Object.entries(stats.silenced || {})
      .map(([id, n]: any) => ({ id: id as SelfId, n: n as number }))
      .sort((a, b) => b.n - a.n);
  }, [stats, eps]);

  // 筛个最高强度 episode 作为「标志性时刻」
  const peak = useMemo(() => {
    if (!eps.length) return null;
    return [...eps].sort((a, b) => b.intensity - a.intensity)[0];
  }, [eps]);

  if (!stats || stats.episodes === 0) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-16 max-w-2xl mx-auto font-body">
        <div className="flex items-center justify-between mb-12">
          <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
          <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">自照</span>
        </div>
        <div className="text-center py-20">
          <h1 className="font-display text-display mb-4">自<span className="scribble">照</span></h1>
          <p className="font-display text-base text-ink3 italic mb-6">— 以铜为镜，可以正衣冠。</p>
          <p className="text-ink2 mb-8">至少和 5 个我谈过 3 次，这里才能照出你来。</p>
          <Link href="/" className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85">
            回去先聊一次 →
          </Link>
        </div>
      </main>
    );
  }

  if (stats.episodes < 3) {
    return (
      <main className="min-h-screen px-5 sm:px-10 py-16 max-w-2xl mx-auto font-body">
        <div className="flex items-center justify-between mb-12">
          <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
        </div>
        <h1 className="font-display text-display mb-4">自<span className="scribble">照</span></h1>
        <p className="font-display text-xl text-ink2 mb-8">还差 {3 - stats.episodes} 次，就能照出你了。</p>
        <p className="text-ink3 mb-8">已经留下 {stats.episodes} 张纸页。</p>
        <Link href="/" className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85">回去和 5 个我谈一次 →</Link>
      </main>
    );
  }

  const totalEpisodes = stats.episodes;
  const days = peak ? Math.round((Date.now() - eps[eps.length-1].ts) / 86400000) : 0;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12">
        <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
        <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">自照</span>
      </div>

      <section className="mb-14 animate-ink-in">
        <p className="font-display text-base text-ink3 italic mb-3">— 以铜为镜，可以正衣冠；以人为镜，可以明得失。</p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          自<span className="scribble">照</span>
        </h1>
        <p className="font-display text-xl text-ink2 leading-relaxed">
          {days > 0 ? `这 ${days} 天里` : "这段时间里"}，<br/>
          你和 5 个自己一共谈了 <span className="text-ink font-semibold">{totalEpisodes}</span> 次。
        </p>
      </section>

      {/* Frame 2: 光谱 */}
      <section className="mb-14 animate-fade-up">
        <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-4">⓵ 你内心的光谱</div>
        <div className="space-y-3">
          {ranking.map((r, i) => {
            const meta = SELVES[r.id];
            return (
              <div key={r.id} className="flex items-center gap-3">
                <SelfAvatar id={r.id} size={32}/>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-display text-${r.id} font-semibold`}>{meta.name}</span>
                    <span className="text-xs text-ink3">{r.n} 次 · {r.pct}%</span>
                  </div>
                  <div className="h-2 bg-rule/40 rounded-full overflow-hidden">
                    <div className={`h-full bg-${r.id}`} style={{width: `${r.pct}%`}} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {ranking[0] && (
          <p className="mt-6 font-display text-lg text-ink2 italic">
            — 你最常召唤的，是<span className={`text-${ranking[0].id} font-semibold not-italic`}>{SELVES[ranking[0].id].name}</span>。
          </p>
        )}
      </section>

      {/* Frame 3: 你按住的那个声音 */}
      {silentRanking[0] && (
        <section className="mb-14 animate-fade-up bg-paper border-2 border-dashed border-ink/15 rounded-3xl p-7">
          <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-3">⓶ 你按住的那个</div>
          <div className="flex items-center gap-4">
            <div className="opacity-50">
              <SelfAvatar id={silentRanking[0].id} size={56}/>
            </div>
            <div>
              <div className={`font-display text-2xl text-${silentRanking[0].id} font-semibold mb-1`}>{SELVES[silentRanking[0].id].name}</div>
              <div className="text-sm text-ink3">被你按下来 {silentRanking[0].n} 次。她想说的话，攒到了不少。</div>
            </div>
          </div>
          <p className="mt-5 font-display text-base text-ink2 italic leading-relaxed">
            — IFS 里把这种声音叫做 {SELVES[silentRanking[0].id].ifs_label}。她不是错的，她只是没被听见。
          </p>
        </section>
      )}

      {/* Frame 4: 标志性时刻 */}
      {peak && (
        <section className="mb-14 animate-fade-up text-center">
          <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-4">⓷ 那一刻</div>
          <div className="bg-[#1A1B20] text-paper p-8 sm:p-12 rounded-3xl">
            <div className="font-display text-3xl sm:text-4xl mb-4 leading-tight">「{peak.title}」</div>
            <p className="text-paper/80 text-base leading-relaxed mb-5">{peak.summary}</p>
            <div className="text-xs text-paper/50">— 你, {new Date(peak.ts).toLocaleDateString("zh-CN")}</div>
          </div>
        </section>
      )}

      {/* Frame 5: 分享卡 */}
      <section className="mb-12 animate-fade-up text-center">
        <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-4">⓸ 带走它</div>
        <button
          onClick={() => {
            // 用现有 /api/share 接口
            const last = eps[0];
            const fakeSelves = ranking.slice(0, 5).map(r => ({ id: r.id, text: "" }));
            fetch("/api/share", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                input: peak?.title || "这段时间的我",
                selves: fakeSelves,
                loudestId: ranking[0]?.id,
              }),
            }).then(r=>r.text()).then(svg => {
              const blob = new Blob([svg], { type: "image/svg+xml" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `parallelme-self-portrait-${Date.now()}.svg`;
              a.click();
            });
          }}
          className="inline-block px-8 py-4 bg-ink text-paper rounded-full font-display text-base hover:bg-ink/85 shadow-[6px_6px_0_-1px_#0E0F12]"
        >
          ↓ 让另一个我也看到
        </button>
      </section>
    </main>
  );
}
