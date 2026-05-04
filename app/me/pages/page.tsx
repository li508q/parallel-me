"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadEpisodes, updateEpisode, deleteEpisode, type Episode } from "@/lib/memory";
import { SelfAvatar } from "@/components/SelfAvatar";
import { SELVES, type SelfId } from "@/lib/selves";

type FU = "done" | "not-done" | "forgot";

const FOLLOWUP_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: "做了 ✓", cls: "text-money" },
  "not-done": { label: "没做", cls: "text-filial" },
  forgot: { label: "忘了", cls: "text-ink3" },
};

export default function PagesView() {
  const [eps, setEps] = useState<Episode[]>([]);

  useEffect(() => { setEps(loadEpisodes()); }, []);

  const setFU = (id: string, v: FU | null) => {
    updateEpisode(id, { followup: v });
    setEps(loadEpisodes());
  };
  const del = (id: string) => {
    if (!confirm("把这一张纸撕掉？这个动作不可撤销。")) return;
    deleteEpisode(id);
    setEps(loadEpisodes());
  };

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12">
        <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
        <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">纸页 · {eps.length} 张</span>
      </div>

      <section className="mb-12 animate-ink-in">
        <p className="font-display text-base text-ink3 italic mb-3">— 你和 5 个我谈过的事，每次一张。</p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          纸<span className="scribble">页</span>
        </h1>
      </section>

      {eps.length === 0 ? (
        <div className="text-center py-20 text-ink3">
          <div className="font-display text-2xl mb-3">还没有纸。</div>
          <Link href="/" className="text-ink underline-offset-4 hover:underline">回去和 5 个我聊一次 →</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {eps.map(ep => {
            const days = Math.max(1, Math.round((Date.now() - ep.ts) / 86400000));
            const dom = SELVES[ep.dominant_voice];
            const sil = SELVES[ep.silenced_voice];
            return (
              <article key={ep.id} className={`bg-paper border-l-2 border-${ep.dominant_voice} pl-5 sm:pl-6 py-5 lift relative`}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-display text-2xl text-ink">「{ep.title}」</h3>
                  <span className="text-xs text-ink3">{days} 天前</span>
                </div>
                <p className="text-[15px] text-ink2 leading-[1.85] mb-4">{ep.summary}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                  <div className="flex items-center gap-1.5">
                    <SelfAvatar id={ep.dominant_voice} size={20}/>
                    <span className={`text-${ep.dominant_voice} font-semibold`}>{dom?.name}</span>
                    <span className="text-ink3">赢了</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <SelfAvatar id={ep.silenced_voice} size={20}/>
                    <span className={`text-${ep.silenced_voice}`}>{sil?.name}</span>
                    <span className="text-ink3">被按住</span>
                  </div>
                </div>

                {ep.decision && (
                  <div className="bg-now-soft border-l border-ink/30 pl-3 py-2 text-sm text-ink2 italic mb-3">
                    "我会 {ep.decision}"
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-3 border-t rule">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-ink3">那件事：</span>
                    {ep.followup ? (
                      <span className={FOLLOWUP_LABEL[ep.followup].cls}>{FOLLOWUP_LABEL[ep.followup].label}</span>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={()=>setFU(ep.id, "done")} className="px-2 py-0.5 rounded-full border border-money text-money hover:bg-money hover:text-paper transition-colors">做了</button>
                        <button onClick={()=>setFU(ep.id, "not-done")} className="px-2 py-0.5 rounded-full border border-filial text-filial hover:bg-filial hover:text-paper transition-colors">没做</button>
                        <button onClick={()=>setFU(ep.id, "forgot")} className="px-2 py-0.5 rounded-full border border-ink3 text-ink3 hover:bg-ink3 hover:text-paper transition-colors">忘了</button>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>del(ep.id)} className="text-xs text-ink3 hover:text-filial">撕掉</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
