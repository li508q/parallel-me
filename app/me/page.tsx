"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile, loadTaste, profileToMarkdown, type MeProfile, type Taste } from "@/lib/profile";
import { loadEpisodes, loadInsights, memoryStats, forgetEverything, type Episode } from "@/lib/memory";
import { SelfAvatar } from "@/components/SelfAvatar";
import { SELVES, type SelfId } from "@/lib/selves";

export default function MePage() {
  const [profile, setProfile] = useState<MeProfile>({});
  const [taste, setTaste] = useState<Taste>({ books: [], films: [], music: [] });
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setTaste(loadTaste());
    setEpisodes(loadEpisodes());
    setStats(memoryStats());
  }, []);

  const profileFilled = !!(profile.nickname || profile.season);
  const tasteFilled = (taste.books?.length || 0) + (taste.films?.length || 0) + (taste.music?.length || 0) > 0;
  const hasMemory = (stats?.episodes || 0) > 0;

  let dominantTop: [string, number] | null = null;
  let silencedTop: [string, number] | null = null;
  if (stats) {
    const dom = Object.entries(stats.dominant || {}) as any[];
    const sil = Object.entries(stats.silenced || {}) as any[];
    dom.sort((x, y) => y[1] - x[1]);
    sil.sort((x, y) => y[1] - x[1]);
    dominantTop = dom[0] || null;
    silencedTop = sil[0] || null;
  }

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-4xl mx-auto font-body">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-12 gap-3 flex-wrap">
        <Link href="/" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 我的阁工作台</Link>
        <div className="flex items-center gap-4">
          <Link href="/cabinet" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase underline-offset-4 hover:underline">
            我的阁 →
          </Link>
          <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">底片 · ParallelMe</span>
        </div>
      </div>

      {/* Hero — 你是谁 */}
      <section className="mb-16 animate-ink-in">
        <p className="font-display text-base sm:text-lg text-ink3 italic mb-3 leading-relaxed">— 像照片之前的样子。被冲洗之前的你。</p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          底<span className="scribble">片</span>
        </h1>
        <p className="font-display text-xl sm:text-2xl text-ink2 leading-relaxed max-w-2xl">
          这一页是你自己的。<br className="hidden sm:block" />
          5 个分身从这里读你——你越具体，他们越像你。
        </p>
        {profile.nickname && (
          <p className="mt-6 font-display text-lg text-ink2 italic">— 你好，{profile.nickname}{profile.season ? `，${profile.season}里的你。` : "。"}</p>
        )}
      </section>

      {/* 4 cards */}
      <div className="grid sm:grid-cols-2 gap-5 mb-16">
        {/* 染色 — Taste */}
        <Link href="/me/taste" className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">染色</div>
            <span className={`text-xs ${tasteFilled ? "text-money" : "text-ink3"}`}>{tasteFilled ? `已染色 · ${taste.books.length+taste.films.length+taste.music.length}件` : "未染色"}</span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">你喜欢的，把你<br/>染成你的颜色</div>
          {taste.profile?.identity_hint && (
            <div className="mt-4 pt-4 border-t rule">
              <div className="text-xs text-ink3 mb-1">你看起来像——</div>
              <div className="font-display text-lg text-roam italic">「{taste.profile.identity_hint}」</div>
            </div>
          )}
          {!tasteFilled && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">把 3 本书 / 3 部电影 / 3 首歌写下来，分身就开始懂你 →</p>
          )}
        </Link>

        {/* 我是 — me.md */}
        <Link href="/me/edit" className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">我是</div>
            <span className={`text-xs ${profileFilled ? "text-money" : "text-ink3"}`}>{profileFilled ? "已填" : "未填"}</span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">三句话<br/>告诉他们你是谁</div>
          {profile.season && <p className="mt-3 text-sm text-ink2 italic">— {profile.season}</p>}
          {!profileFilled && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">不上传服务器，只在这里。越具体，分身回应越精准 →</p>
          )}
        </Link>

        {/* 纸页 — episodes */}
        <Link href="/me/pages" className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">纸页</div>
            <span className={`text-xs ${hasMemory ? "text-money" : "text-ink3"}`}>{hasMemory ? `${stats.episodes} 张` : "0 张"}</span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">你和 5 个我<br/>谈过的事</div>
          {hasMemory && episodes[0] && (
            <div className="mt-4 pt-4 border-t rule">
              <div className="text-xs text-ink3 mb-1">最近一张</div>
              <div className="font-display text-lg text-ink2 italic">「{episodes[0].title}」</div>
            </div>
          )}
          {!hasMemory && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">每次和 5 个我聊过，会自动留下一张纸。攒 30 张，拼一本季度册 →</p>
          )}
        </Link>

        {/* 自照 — wrapped/insights */}
        <Link href="/me/insights" className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">自照</div>
            <span className="text-xs text-ink3">{stats?.episodes >= 3 ? "可看" : `还差 ${Math.max(0, 3 - (stats?.episodes||0))} 次`}</span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">看看你<br/>这段时间的样子</div>
          {dominantTop && silencedTop && stats?.episodes >= 3 && (
            <div className="mt-4 pt-4 border-t rule space-y-2">
              <div className="flex items-center gap-2">
                <SelfAvatar id={dominantTop[0] as SelfId} size={24}/>
                <span className="text-sm text-ink2">最常出现：<span className={`font-semibold text-${dominantTop[0]}`}>{SELVES[dominantTop[0] as SelfId]?.name}</span></span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <SelfAvatar id={silencedTop[0] as SelfId} size={24}/>
                <span className="text-sm text-ink2">最被压住：<span className={`font-semibold text-${silencedTop[0]}`}>{SELVES[silencedTop[0] as SelfId]?.name}</span></span>
              </div>
            </div>
          )}
          {(!dominantTop || stats?.episodes < 3) && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">谈过 3 次以上，这里会出现你内心的光谱 →</p>
          )}
        </Link>
      </div>

      {/* Footer ops */}
      <div className="border-t rule pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-ink3">
        <div>
          <div>所有数据存在你的浏览器本地，不上传任何服务器。</div>
          <div className="mt-1">不发推送，不要账号，不打扰。</div>
        </div>
        <button
          onClick={() => {
            if (window.confirm("确定要把这一切清空吗？\n你的画像、品味、所有纸页都会被擦掉。\n这个动作不可撤销。")) {
              forgetEverything();
              window.localStorage.removeItem("parallelme:profile:v1");
              window.localStorage.removeItem("parallelme:taste:v1");
              window.location.reload();
            }
          }}
          className="text-xs text-ink3 hover:text-filial underline-offset-4 hover:underline"
        >
          忘掉我（清空全部数据）
        </button>
      </div>
    </main>
  );
}
