"use client";
import { useState, useRef, useEffect } from "react";
import { SELVES, NOWME, type SelfId } from "@/lib/selves";
import { SelfAvatar } from "@/components/SelfAvatar";

type SelfFrame = { id: SelfId; name: string; emoji: string; tagline: string; text: string };
type CrossFrame = { from: string; fromId: SelfId; to: string; toId: SelfId; text: string };
type FollowMsg = { role: "user" | "self"; text: string };

const PRESETS = [
  "我妈让我考公，我现在大厂月薪 2.5w，回老家月薪能到 6k 吗？",
  "处了 3 年的对象想结婚了，但我一想到结婚就喘不过气。",
  "副业月入 8k，本职 2w，要不要辞职 all in 副业？",
  "26 岁，朋友都开始定居了，我还想去清迈待半年。",
  "凌晨 2 点老板在群里发了个 OK?，我现在心率 120。"
];

// 凌晨/夜晚的钩子文案 — 击中 emo 时刻
const HOOKS = [
  "凌晨 2 点睡不着的那个问题，写在这里。",
  "白天不敢说的那个想法，5 个我帮你一起想。",
  "你心里那个还没承认的答案，让另外 5 个我先说。",
  "你不需要更多建议。你需要听见自己。"
];

export default function Home() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"idle"|"selves"|"cross"|"now"|"insight"|"done">("idle");
  const [selves, setSelves] = useState<SelfFrame[]>([]);
  const [crosses, setCrosses] = useState<CrossFrame[]>([]);
  const [now, setNow] = useState<string>("");
  const [insight, setInsight] = useState<string>("");
  const [loudestId, setLoudestId] = useState<SelfId | null>(null);
  const [error, setError] = useState<string>("");
  const [openSelf, setOpenSelf] = useState<SelfId | null>(null);
  const [followups, setFollowups] = useState<Record<SelfId, FollowMsg[]>>({} as any);
  const [followAsking, setFollowAsking] = useState<SelfId | null>(null);
  const [hookIdx, setHookIdx] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 仅在客户端挂载后随机选钩子文案，避免 SSR/CSR 水合不一致
  useEffect(() => {
    setHookIdx(Math.floor(Math.random() * HOOKS.length));
  }, []);

  async function run(text?: string) {
    const q = (text ?? input).trim();
    if (!q || running) return;
    setRunning(true); setStage("selves");
    setSelves([]); setCrosses([]); setNow(""); setInsight(""); setLoudestId(null);
    setError(""); setOpenSelf(null); setFollowups({} as any); setInput(q);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    try {
      const r = await fetch("/api/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: q })
      });
      if (!r.ok || !r.body) throw new Error("请求失败");
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const p of parts) {
          if (!p.startsWith("data: ")) continue;
          const f = JSON.parse(p.slice(6));
          if (f.type === "self") setSelves(s => [...s, f]);
          else if (f.type === "cross") { setCrosses(c => [...c, f]); setStage("cross"); }
          else if (f.type === "loudest") setLoudestId(f.id);
          else if (f.type === "now") { setNow(f.text); setStage("now"); }
          else if (f.type === "insight") { setInsight(f.text); setStage("insight"); }
          else if (f.type === "done") setStage("done");
          else if (f.type === "error") setError(f.message || "出错");
        }
      }
    } catch (e: any) {
      setError(e?.message || "出错了");
    } finally {
      setRunning(false);
    }
  }

  async function askFollow(selfId: SelfId, q: string) {
    if (!q.trim() || followAsking) return;
    setFollowAsking(selfId);
    setFollowups(prev => ({ ...prev, [selfId]: [...(prev[selfId]||[]), { role: "user", text: q }] }));
    try {
      const prevAnswer = selves.find(s => s.id === selfId)?.text || "";
      const r = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfId, userInput: input, prevAnswer, question: q })
      });
      const j = await r.json();
      setFollowups(prev => ({ ...prev, [selfId]: [...(prev[selfId]||[]), { role: "self", text: j.text || j.error || "..." }] }));
    } finally { setFollowAsking(null); }
  }

  function shareCard() {
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, selves, loudestId })
    }).then(r => r.text()).then(svg => {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `parallelme-${Date.now()}.svg`;
      a.click();
    });
  }

  function reset() {
    setSelves([]); setCrosses([]); setNow(""); setInsight(""); setStage("idle"); setInput("");
    setLoudestId(null); setOpenSelf(null); setFollowups({} as any);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen px-5 sm:px-10 pt-10 sm:pt-16 pb-24 max-w-4xl mx-auto font-body">

      {/* HEADER */}
      <header className="mb-14 sm:mb-20 animate-ink-in">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-ink3 uppercase">
            <span className="w-1 h-1 rounded-full bg-ink animate-soft-pulse"/>
            ParallelMe · v1.0
          </div>
          <a href="/about" className="text-xs tracking-wider text-ink3 hover:text-ink underline-offset-4 hover:underline">关于</a>
        </div>

        {/* HOOK + TITLE */}
        <p className="font-display text-base sm:text-lg text-ink3 italic mb-5 leading-relaxed">— {HOOKS[hookIdx]}</p>
        <h1 className="font-display text-display text-ink mb-7 leading-[1.02]">
          平行的<span className="scribble">我</span>
        </h1>
        <p className="font-display text-xl sm:text-2xl text-ink2 leading-relaxed max-w-2xl">
          你的纠结，让 5 个平行宇宙的你吵给你听。<br className="hidden sm:block"/>
          最后由 <span className="text-ink font-semibold">「此刻的我」</span> 做最后决定。
        </p>

        {/* 5 selves intro — 命运感卡片排布 */}
        <div className="mt-12 grid grid-cols-5 gap-2 sm:gap-3">
          {(Object.values(SELVES) as any[]).map((s, i) => (
            <div key={s.id} className="text-center group cursor-default" style={{ animationDelay: `${i*60}ms` }}>
              <div className="flex justify-center mb-2 transition-transform group-hover:-translate-y-0.5">
                <SelfAvatar id={s.id} size={56}/>
              </div>
              <div className={`font-display text-[11px] sm:text-sm font-semibold text-${s.id} leading-tight`}>{s.name}</div>
            </div>
          ))}
        </div>
      </header>

      {/* INPUT */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-3">
          <label className="font-display text-sm text-ink3 tracking-wider uppercase">写下你的纠结</label>
          <span className="text-xs text-ink3">{input.length}/800</span>
        </div>
        <div className="hand-box bg-paper p-1">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 800))}
            placeholder={"把那件让你睡不着的事，原原本本地写下来。\n越具体越好——越具体，5 个我才越能为你较劲。"}
            rows={4}
            disabled={running}
            className="w-full bg-transparent text-ink placeholder-ink3/60 px-5 py-4 outline-none resize-none font-body text-base leading-relaxed"
            onKeyDown={e => { if ((e.metaKey||e.ctrlKey) && e.key==="Enter") run(); }}
          />
          <div className="flex items-center justify-between px-5 pb-3 pt-2 border-t rule">
            <span className="text-xs text-ink3">⌘/Ctrl + Enter 直接召唤</span>
            <button
              onClick={() => run()}
              disabled={running || !input.trim()}
              className="font-display px-7 py-3 bg-[#C65D4A] text-paper rounded-full text-sm font-semibold hover:bg-[#A8482F] disabled:bg-[#C65D4A]/40 disabled:cursor-not-allowed transition-all shadow-[0_4px_0_-1px_rgba(20,22,26,0.85)] hover:shadow-[0_2px_0_-1px_rgba(20,22,26,0.85)] hover:translate-y-[2px]"
            >
              {running ? "5 个我正在赶来…" : "让 5 个我都来吵一吵 →"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="text-xs text-ink3 self-center mr-1">没头绪？试试：</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              disabled={running}
              onClick={() => run(p)}
              className="text-xs px-3 py-1.5 rounded-full border rule text-ink2 hover:bg-ink hover:text-paper hover:border-ink transition-all disabled:opacity-30"
            >
              {p.length > 22 ? p.slice(0, 22) + "…" : p}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="mb-12 p-4 rounded-xl border border-filial bg-filial-soft text-filial text-sm">{error}</div>
      )}

      {/* RESULTS */}
      <div ref={resultsRef}>

        {/* Stage 1: 5 selves speak */}
        {selves.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">第一幕</span>
              <span className="flex-1 h-px bg-rule"/>
              <span className="font-display text-xs text-ink3">五个我，同时开口</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {selves.map((s, i) => {
                const meta = (SELVES as any)[s.id];
                const isLoud = loudestId === s.id;
                return (
                  <article
                    key={s.id}
                    className={`relative bg-${s.id}-soft border-l-2 border-${s.id} p-5 sm:p-6 rounded-r-2xl lift animate-fade-up`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {isLoud && (
                      <div className="absolute -top-2 -right-2 px-2.5 py-0.5 bg-ink text-paper text-[10px] tracking-wider rounded-full font-display font-semibold">
                        声音最响
                      </div>
                    )}
                    <div className="flex items-start gap-3 mb-4">
                      <SelfAvatar id={s.id} size={44}/>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className={`font-display font-semibold text-${s.id}`}>{s.name}</div>
                        <div className="text-xs text-ink3 italic mt-0.5 leading-snug">{s.tagline || meta?.tagline}</div>
                      </div>
                    </div>
                    <p className="font-body text-[15px] leading-[1.85] text-ink2 whitespace-pre-line">{s.text}</p>
                    <div className="mt-4 pt-3 border-t rule flex items-center justify-between gap-3">
                      <span className="text-[11px] text-ink3 italic line-clamp-1 flex-1">{meta?.core_belief}</span>
                      <button
                        onClick={() => setOpenSelf(openSelf === s.id ? null : s.id)}
                        className="text-xs text-ink2 hover:text-ink underline-offset-4 hover:underline shrink-0"
                      >
                        {openSelf === s.id ? "合上" : "继续问 ta →"}
                      </button>
                    </div>

                    {openSelf === s.id && (
                      <div className="mt-4 pt-4 border-t rule animate-fade-up">
                        {(followups[s.id] || []).map((m, j) => (
                          <div key={j} className={`mb-3 ${m.role === "user" ? "text-right" : ""}`}>
                            <div className={`inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[85%] ${m.role === "user" ? "bg-ink text-paper" : `bg-paper text-ink2 border border-${s.id}`}`}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                        <FollowInput selfId={s.id} disabled={followAsking === s.id} onSubmit={(q) => askFollow(s.id, q)} placeholder={`继续问${s.name}…`}/>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Stage 2: cross-examine — 强对峙视觉 */}
        {crosses.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">第二幕</span>
              <span className="flex-1 h-px bg-rule"/>
              <span className="font-display text-xs text-ink3">他们互相戳穿</span>
            </div>
            <div className="space-y-5">
              {crosses.map((c, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto] items-stretch gap-3 sm:gap-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  {/* Left: from avatar + name */}
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <SelfAvatar id={c.fromId} size={40}/>
                    <span className={`text-[10px] font-display text-${c.fromId} font-semibold`}>{c.from.replace("的我","")}</span>
                  </div>
                  {/* Center: the strike */}
                  <div className="relative flex flex-col justify-center px-4 sm:px-6 py-4 bg-paper border-y rule">
                    <p className="font-display text-lg sm:text-2xl text-ink leading-snug">「{c.text}」</p>
                    <div className="absolute -top-2 left-4 text-xs px-2 py-0.5 bg-paper text-ink3 font-display tracking-wider">⚔ 对峙</div>
                  </div>
                  {/* Right: target avatar (faded) */}
                  <div className="flex flex-col items-center gap-1.5 pt-1 opacity-60">
                    <SelfAvatar id={c.toId} size={32}/>
                    <span className={`text-[10px] font-display text-${c.toId}`}>{c.to.replace("的我","")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stage 3: NowMe — 加重，宽，分量感 */}
        {now && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-display text-xs tracking-[0.18em] text-ink uppercase font-semibold">最 · 终 · 幕</span>
              <span className="flex-1 h-[2px] bg-ink"/>
              <span className="font-display text-xs text-ink">此刻的我</span>
            </div>
            <article className="-mx-2 sm:mx-0 bg-[#1A1B20] text-paper p-7 sm:p-12 rounded-r-3xl border-l-[3px] border-paper animate-fade-up shadow-[0_30px_60px_-30px_rgba(20,22,26,0.5)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-paper rounded-full p-1">
                  <SelfAvatar id="now" size={48}/>
                </div>
                <div>
                  <div className="font-display font-semibold text-paper text-xl">{NOWME.name}</div>
                  <div className="text-sm text-paper/60 italic mt-0.5">{NOWME.tagline}</div>
                </div>
              </div>
              <div className="font-body text-[16px] sm:text-[18px] leading-[1.95] text-paper whitespace-pre-line">{now}</div>
            </article>
          </section>
        )}

        {/* Insight — 提到引文级别 */}
        {insight && (
          <section className="mb-16 animate-fade-up max-w-2xl mx-auto">
            <blockquote className="relative pl-8 py-2">
              <span className="absolute left-0 top-0 font-display text-7xl text-[#C65D4A] leading-[0.7] select-none">"</span>
              <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase mb-3">心理学旁注 · IFS · Internal Family Systems</div>
              <p className="font-display text-lg sm:text-xl leading-relaxed text-ink2 italic">{insight}</p>
              <p className="mt-3 text-xs text-ink3">— 此刻的你，最响的声音背后藏着的</p>
            </blockquote>
          </section>
        )}

        {/* Share + Reset */}
        {stage === "done" && (
          <section className="mb-16 animate-fade-up text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 bg-paper border-2 border-ink rounded-3xl shadow-[6px_6px_0_-1px_#0E0F12]">
              <div className="font-display text-xs tracking-[0.2em] text-ink3 uppercase">带走它</div>
              <div className="font-display text-2xl text-ink">把今天的「内心地图」存下来</div>
              <button
                onClick={shareCard}
                className="font-display px-7 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85"
              >
                ↓ 下载我的内心地图
              </button>
              <button onClick={reset} className="text-xs text-ink3 hover:text-ink underline-offset-4 underline">
                问下一个问题
              </button>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-32 pt-10 border-t rule text-xs text-ink3 leading-relaxed">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-ink mb-1">平行的我 · ParallelMe</div>
            <div>为傅盛 AI 战队 × EasyClaw Link 黑客松而生</div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <a className="hover:text-ink underline-offset-4 hover:underline" href="/AGENTS.md">AGENTS.md</a>
            <a className="hover:text-ink underline-offset-4 hover:underline" href="/skill.md">SKILL.md</a>
            <a className="hover:text-ink underline-offset-4 hover:underline" href="/.well-known/agent.json">A2A spec</a>
            <a className="hover:text-ink underline-offset-4 hover:underline" href="/api/agent">API</a>
            <a className="hover:text-ink underline-offset-4 hover:underline" href="/about">关于</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FollowInput({ selfId, disabled, onSubmit, placeholder }: { selfId: SelfId; disabled?: boolean; onSubmit: (q: string) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && v.trim() && !disabled) { onSubmit(v); setV(""); } }}
        disabled={disabled}
        placeholder={placeholder || "继续问…"}
        className={`flex-1 bg-paper border border-${selfId} rounded-full px-4 py-2 text-sm outline-none focus:border-ink placeholder-ink3 disabled:opacity-50`}
      />
      <button
        onClick={() => { if (v.trim() && !disabled) { onSubmit(v); setV(""); } }}
        disabled={disabled || !v.trim()}
        className="px-4 py-2 bg-ink text-paper text-sm rounded-full disabled:opacity-30 hover:bg-ink/85"
      >
        {disabled ? "…" : "问"}
      </button>
    </div>
  );
}
