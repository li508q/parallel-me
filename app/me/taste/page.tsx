"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadTaste, saveTaste, type Taste, type TasteItem } from "@/lib/profile";

type Kind = "books" | "films" | "music";

const PRESETS: Record<Kind, TasteItem[]> = {
  books: [
    { title: "局外人", author: "加缪", why: "" },
    { title: "活着", author: "余华", why: "" },
    { title: "月亮与六便士", author: "毛姆", why: "" },
  ],
  films: [
    { title: "海街日记", author: "是枝裕和", why: "" },
    { title: "爱在黎明破晓前", author: "理查德·林克莱特", why: "" },
    { title: "霸王别姬", author: "陈凯歌", why: "" },
  ],
  music: [
    { title: "漠河舞厅", author: "柳爽", why: "" },
    { title: "晚安", author: "蔡健雅", why: "" },
    { title: "鼓楼", author: "赵雷", why: "" },
  ],
};

const HINT_BY_KIND: Record<Kind, string> = {
  books: "你喜欢的 3-7 本书",
  films: "你喜欢的 3-7 部电影",
  music: "你喜欢的 3-7 首歌",
};

const PLACEHOLDER_BY_KIND: Record<Kind, { title: string; author: string; why: string }> = {
  books: { title: "书名", author: "作者", why: "为什么这本（可选）" },
  films: { title: "片名", author: "导演", why: "为什么这部（可选）" },
  music: { title: "歌名", author: "歌手 / 乐队", why: "为什么这首（可选）" },
};

const COLORS: Record<Kind, string> = {
  books: "lay",
  films: "future",
  music: "filial",
};

const HEADING_BY_KIND: Record<Kind, string> = {
  books: "书",
  films: "影",
  music: "乐",
};

export default function TastePage() {
  const [taste, setTaste] = useState<Taste>({ books: [], films: [], music: [] });
  const [generating, setGenerating] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    setTaste(loadTaste());
  }, []);

  const update = (kind: Kind, idx: number, patch: Partial<TasteItem>) => {
    setTaste(t => {
      const arr = [...((t as any)[kind] || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...t, [kind]: arr };
    });
    setHasUnsaved(true);
  };

  const add = (kind: Kind) => {
    setTaste(t => ({ ...t, [kind]: [...(((t as any)[kind]) || []), { title: "", author: "", why: "" }] }));
    setHasUnsaved(true);
  };

  const remove = (kind: Kind, idx: number) => {
    setTaste(t => {
      const arr = [...((t as any)[kind] || [])];
      arr.splice(idx, 1);
      return { ...t, [kind]: arr };
    });
    setHasUnsaved(true);
  };

  const loadPreset = (kind: Kind) => {
    setTaste(t => ({ ...t, [kind]: [...PRESETS[kind]] }));
    setHasUnsaved(true);
  };

  const save = () => {
    saveTaste(taste);
    setHasUnsaved(false);
  };

  async function generateProfile() {
    save();
    const cleaned: Taste = {
      books: (taste.books || []).filter(b => b.title.trim()),
      films: (taste.films || []).filter(f => f.title.trim()),
      music: (taste.music || []).filter(m => m.title.trim()),
    };
    if (cleaned.books.length + cleaned.films.length + cleaned.music.length < 3) {
      alert("再多写几个吧——至少 3 个东西，分身才能尝到味道。");
      return;
    }
    setGenerating(true);
    try {
      const r = await fetch("/api/taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      const j = await r.json();
      if (j.profile) {
        const updated = { ...taste, profile: { ...j.profile, generatedAt: Date.now() } };
        setTaste(updated);
        saveTaste(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  const statusText = hasUnsaved
    ? "还没保存"
    : taste.profile
    ? "已就绪"
    : "保存后即可生成你的「人格判词」";

  const ctaText = generating
    ? "正在尝你的味道…"
    : taste.profile
    ? "重新尝一次"
    : "让 AI 尝一下你的味道";

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12">
        <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
        <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">染色</span>
      </div>

      <section className="mb-14 animate-ink-in">
        <p className="font-display text-base text-ink3 italic mb-3">— 你是你消费内容的平均值。</p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          染<span className="scribble">色</span>
        </h1>
        <p className="font-display text-lg text-ink2 leading-relaxed">
          写下你最喜欢的书、电影、歌。<br />
          5 个分身会从这里学你的语气、你的颜色、你不愿讲的渴望。
        </p>
      </section>

      {(["books", "films", "music"] as const).map(kind => (
        <section key={kind} className="mb-14">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className={`font-display text-headline text-${COLORS[kind]} font-semibold`}>
              {HEADING_BY_KIND[kind]}
            </h2>
            <div className="flex gap-3 text-xs">
              {(taste[kind]?.length || 0) === 0 && (
                <button onClick={() => loadPreset(kind)} className="text-ink3 hover:text-ink underline-offset-4 hover:underline">
                  借用一份示例
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-ink3 mb-3">{HINT_BY_KIND[kind]}</div>
          <div className="space-y-3">
            {(taste[kind] || []).map((item, idx) => (
              <div key={idx} className={`grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center bg-${COLORS[kind]}-soft rounded-xl p-2`}>
                <input
                  value={item.title}
                  onChange={e => update(kind, idx, { title: e.target.value })}
                  placeholder={PLACEHOLDER_BY_KIND[kind].title}
                  className={`bg-transparent px-3 py-2 outline-none text-sm border-b border-${COLORS[kind]}/30 focus:border-${COLORS[kind]}`}
                />
                <input
                  value={item.author || ""}
                  onChange={e => update(kind, idx, { author: e.target.value })}
                  placeholder={PLACEHOLDER_BY_KIND[kind].author}
                  className={`bg-transparent px-3 py-2 outline-none text-sm border-b border-${COLORS[kind]}/30 focus:border-${COLORS[kind]}`}
                />
                <input
                  value={item.why || ""}
                  onChange={e => update(kind, idx, { why: e.target.value })}
                  placeholder={PLACEHOLDER_BY_KIND[kind].why}
                  className={`bg-transparent px-3 py-2 outline-none text-sm border-b border-${COLORS[kind]}/30 focus:border-${COLORS[kind]} italic placeholder-ink3/60`}
                />
                <button
                  onClick={() => remove(kind, idx)}
                  className="px-2 text-ink3 hover:text-filial text-sm"
                  aria-label="删除"
                >×</button>
              </div>
            ))}
            <button
              onClick={() => add(kind)}
              className={`w-full text-sm text-${COLORS[kind]} border-2 border-dashed border-${COLORS[kind]}/40 hover:border-${COLORS[kind]} rounded-xl py-2 transition-colors`}
            >+ 再加一个</button>
          </div>
        </section>
      ))}

      {/* Profile result */}
      {taste.profile && (
        <section className="mb-14 bg-surface-deep text-paper p-7 sm:p-10 rounded-r-3xl border-l-[3px] border-paper animate-fade-up">
          <div className="font-display text-xs tracking-[0.18em] text-paper/60 uppercase mb-3">你看起来像</div>
          <div className="font-display text-2xl sm:text-3xl mb-5 leading-tight">「{taste.profile.identity_hint}」</div>
          <div className="text-sm text-paper/80 leading-relaxed">
            主题：{taste.profile.themes.join(" · ")}<br />
            氛围：{taste.profile.moods.join(" · ")}
          </div>
          <div className="mt-6 text-xs text-paper/50">这一句会被注入到 5 个分身的每次回应里。</div>
        </section>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 sm:bottom-6 bg-paper/90 backdrop-blur border-2 border-ink rounded-full px-5 py-3 flex items-center gap-3 shadow-[4px_4px_0_-1px_var(--color-ink-core)]">
        <span className="text-xs text-ink3 flex-1">{statusText}</span>
        {hasUnsaved && (
          <button onClick={save} className="text-sm text-ink2 hover:text-ink px-3 py-1.5 rounded-full border border-ink/30">保存</button>
        )}
        <button
          onClick={generateProfile}
          disabled={generating}
          className="text-sm bg-ink text-paper px-5 py-2 rounded-full font-display hover:bg-ink/85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ctaText}
        </button>
      </div>
    </main>
  );
}
