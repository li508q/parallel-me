"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile, saveProfile, type MeProfile } from "@/lib/profile";

type ListField = "caringAbout" | "avoiding" | "redLines";

export default function MeEditPage() {
  const [p, setP] = useState<MeProfile>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { setP(loadProfile()); }, []);

  const update = (k: keyof MeProfile, v: any) => {
    setP((x: MeProfile) => ({ ...x, [k]: v }));
    setSaved(false);
  };

  const save = () => {
    saveProfile(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setList = (k: ListField, text: string) => {
    update(k, text.split("\n").map(s => s.trim()).filter(Boolean));
  };

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-2xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12">
        <Link href="/me" className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase">← 底片</Link>
        <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">我是</span>
      </div>

      <section className="mb-14 animate-ink-in">
        <p className="font-display text-base text-ink3 italic mb-3">— 三句话告诉他们你是谁。</p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          我<span className="scribble">是</span>
        </h1>
        <p className="font-display text-base text-ink2 leading-relaxed">
          这页从来不上传服务器，只在你浏览器里。<br/>
          越具体，五声越像你——它们会从这里读你的语境。
        </p>
      </section>

      <section className="mb-10 space-y-5">
        <Field label="怎么称呼你">
          <input value={p.nickname || ""} onChange={e=>update("nickname", e.target.value)}
            placeholder="昵称即可，越亲近越好"
            className="w-full bg-transparent border-b-2 border-ink/15 focus:border-ink outline-none py-2 font-body text-lg"/>
        </Field>
        <Field label="年龄段">
          <div className="flex flex-wrap gap-2">
            {(["18-24","25-29","30-34","35+"] as const).map(b => (
              <button key={b} onClick={()=>update("ageBand", b)}
                className={`px-4 py-1.5 rounded-full border text-sm transition-all ${p.ageBand===b ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink2 hover:border-ink"}`}>
                {b}
              </button>
            ))}
          </div>
        </Field>
        <Field label="现在在哪个城市">
          <input value={p.city || ""} onChange={e=>update("city", e.target.value)}
            placeholder="北京 / 上海 / 大理 / 老家小镇 ..."
            className="w-full bg-transparent border-b-2 border-ink/15 focus:border-ink outline-none py-2"/>
        </Field>
        <Field label="现在是你人生哪个阶段（3-15 字）">
          <input value={p.season || ""} onChange={e=>update("season", e.target.value)}
            placeholder="例：刚毕业第二年、和前任分手三个月、攒裸辞底气..."
            className="w-full bg-transparent border-b-2 border-ink/15 focus:border-ink outline-none py-2 italic"/>
        </Field>
      </section>

      <section className="mb-10 space-y-5">
        <h2 className="font-display text-headline text-ink mb-3">此刻</h2>
        <Field label="最近最在意的（一行一件）">
          <textarea
            defaultValue={(p.caringAbout||[]).join("\n")}
            onBlur={e=>setList("caringAbout", e.target.value)}
            rows={3}
            placeholder={"加薪没下文\n妈又催相亲\n那个项目老板没回复"}
            className="w-full bg-transparent border-2 border-ink/10 focus:border-ink/30 outline-none p-3 rounded-xl resize-none text-sm leading-relaxed placeholder-ink3/60"/>
        </Field>
        <Field label="最在回避的话题（一行一件）">
          <textarea
            defaultValue={(p.avoiding||[]).join("\n")}
            onBlur={e=>setList("avoiding", e.target.value)}
            rows={3}
            placeholder={"体检报告\n户口\n那个未读消息"}
            className="w-full bg-transparent border-2 border-ink/10 focus:border-ink/30 outline-none p-3 rounded-xl resize-none text-sm leading-relaxed placeholder-ink3/60"/>
        </Field>
      </section>

      <section className="mb-14 space-y-4">
        <h2 className="font-display text-headline text-ink mb-1">红线</h2>
        <p className="text-xs text-ink3 mb-2">五声永远不会踩你的这些话题。</p>
        <textarea
          defaultValue={(p.redLines||[]).join("\n")}
          onBlur={e=>setList("redLines", e.target.value)}
          rows={2}
          placeholder={"不要替我妈说话\n不要叫我加油"}
          className="w-full bg-transparent border-2 border-filial/30 focus:border-filial outline-none p-3 rounded-xl resize-none text-sm leading-relaxed placeholder-ink3/60"/>
      </section>

      <div className="sticky bottom-4 sm:bottom-6 bg-paper/90 backdrop-blur border-2 border-ink rounded-full px-5 py-3 flex items-center gap-3 shadow-[4px_4px_0_-1px_var(--color-ink-core)]">
        <span className="text-xs text-ink3 flex-1">{saved ? "✓ 已保存到这台设备" : "改完点保存即可"}</span>
        <button onClick={save} className="text-sm bg-ink text-paper px-6 py-2 rounded-full font-display hover:bg-ink/85">保存</button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <label className="block font-display text-sm text-ink3 tracking-wider uppercase mb-2">{label}</label>
      {children}
    </div>
  );
}
