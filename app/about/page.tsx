import Link from "next/link";

const PSYCHOLOGY = [
  {
    name: "IFS",
    text: "每一声都必须说清：它在保护什么、它最怕什么。NowMe 是退后一步后的 Self 位置，不是第六个声音。",
  },
  {
    name: "Voice Dialogue",
    text: "目标不是让某一声胜出，而是让你不被任何单一声音劫持。最后的签字，是从被动听见走向主动承担。",
  },
  {
    name: "Schema Therapy Modes",
    text: "一个困惑会激活不同的应对模式：逃开、顺从、计算、麻木、远观。它帮助我们理解五声为什么在此刻被叫醒；未来若出现临时声，也必须从被激活的模式里长出来。",
  },
  {
    name: "Chairwork",
    text: "不同立场需要有不同位置。界面不能只是聊天流，而要让你能点名一声，也能坐到某一声的位置上，把它说得更准。",
  },
  {
    name: "ACT",
    text: "结尾不是建议清单，而是回到价值：在 24 小时内做一个低门槛、可承担的承诺动作。",
  },
];

const VOICES = [
  {
    name: "躺平的我",
    line: "它不是懒。它先听见了疲惫、透支和身体的求救。",
  },
  {
    name: "搞钱的我",
    line: "它不是冷。它在确认资源、底线和你还能承受多少风险。",
  },
  {
    name: "出走的我",
    line: "它不是任性。它记得你还需要空间、生命力和另一条路。",
  },
  {
    name: "怕妈担心的我",
    line: "它不是软弱。它怕重要的人难过，也怕你像是把她丢下。",
  },
  {
    name: "5 年后的我",
    line: "它不是旁观。它只是把眼前这一刻放回更长的时间里。",
  },
];

const FOOTNOTES = [
  "Internal Family Systems：parts / Self / protective intention；Richard C. Schwartz, 1995；IFS Institute.",
  "Voice Dialogue：primary selves 与 aware ego；Sidra Stone & Hal Stone.",
  "Schema Therapy Modes：Young、Klosko、Weishaar 等关于模式与健康成人位置的工作。",
  "Chairwork：two-chair / empty-chair / dialogical self 等实践传统。",
  "ACT：values、defusion、committed action；Association for Contextual Behavioral Science.",
  "Motivational Interviewing、Narrative Therapy、CFT：用于开放追问、问题外化和降低羞耻感。",
];

export default function About() {
  return (
    <main className="min-h-screen px-5 sm:px-10 py-16 max-w-3xl mx-auto font-sans text-ink-body">
      <Link
        href="/"
        className="text-xs tracking-[0.18em] text-ink-mute hover:text-ink-core uppercase mb-14 inline-block underline-offset-4 hover:underline"
      >
        ← 回到我的声音
      </Link>

      <header className="mb-16">
        <p className="font-serif italic text-body text-ink-mute mb-5">
          — 我们不缺建议，我们缺的是听见自己。
        </p>
        <h1 className="font-serif font-semibold text-display text-ink-core leading-[1.05] mb-7">
          为什么是
          <span className="scribble">五声</span>
        </h1>
        <p className="font-serif text-title-sm sm:text-title text-ink-body leading-relaxed max-w-2xl">
          人在重要选择前，很少只有一个念头。
          有的声音想停下来，有的声音要算清楚，有的声音想逃，
          有的声音牵挂家人，也有一个声音从更远处看你。
        </p>
      </header>

      <section className="mb-16">
        <h2 className="font-serif text-headline text-ink-core mb-5">
          矛盾不是失败
        </h2>
        <div className="space-y-4 text-body-long leading-relaxed text-ink-body">
          <p>
            很多困惑之所以反复回来，不是因为你不够理性，
            而是因为每一种拉扯都在保护某个真实的东西。
          </p>
          <p>
            利弊分析能给你一张表，却未必能给你一句在凌晨醒来时也站得住的话。
            ParallelMe 做的事，是先把脑子里纠缠成团的念头分开，
            让它们各自有位置、有语气、有保护意图。
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-serif text-headline text-ink-core mb-5">
          心理学给过我们一组语言
        </h2>
        <div className="space-y-4 text-body-long leading-relaxed text-ink-body mb-7">
          <p>
            五声不是凭空捏出来的角色。它借鉴的是一组彼此相通的心理学传统：
            人的内在经验并不总是单一、整齐、立刻一致的。
            许多时候，我们是由不同部分、不同模式、不同位置共同保护着自己。
          </p>
          <p>
            所以这里不会急着问“哪个声音是对的”。更重要的问题是：
            它为什么这么说？它在保护什么？它最怕什么？它有没有把你整个人带走？
          </p>
        </div>

        <div className="space-y-4 border-l border-paper-edge pl-5">
          {PSYCHOLOGY.map((item) => (
            <section key={item.name}>
              <h3 className="font-serif text-title-sm text-ink-core mb-1">
                {item.name}
              </h3>
              <p className="text-body-sm leading-relaxed text-ink-body">
                {item.text}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-7">
          <span className="h-px flex-1 bg-paper-edge" />
          <h2 className="font-serif italic text-body text-ink-mute text-center">
            五个熟悉的自己
          </h2>
          <span className="h-px flex-1 bg-paper-edge" />
        </div>

        <div className="space-y-5">
          {VOICES.map((voice, index) => (
            <section
              key={voice.name}
              className="grid grid-cols-[2.25rem_1fr] gap-4 items-start"
            >
              <div className="font-serif text-title-sm text-ink-faint tabular-nums">
                {index + 1}
              </div>
              <div>
                <h3 className="font-serif text-title-sm text-ink-core mb-1">
                  {voice.name}
                </h3>
                <p className="text-body-long leading-relaxed text-ink-body">
                  {voice.line}
                </p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-7 text-body-long leading-relaxed text-ink-body">
          它们也不是一次性的角色。每一次纸页、每一次点名追问、
          每一次换位回答，都会让「我的声音」更有轮廓。
          五声会慢慢显影：不是变多，而是越来越像你。
        </p>
      </section>

      <section className="mb-16">
        <h2 className="font-serif text-headline text-ink-core mb-5">
          你始终坐在中间
        </h2>
        <div className="space-y-4 text-body-long leading-relaxed text-ink-body">
          <p>
            五声会谈不是让某一声赢。它更像一次慢下来的自我澄清：
            先把困惑放到桌面上，再整理本次真正要谈的焦点。
          </p>
          <p>
            五声说完以后，你可以点名追问，也可以坐到某一声的位置上，
            替它说得更准。最后留下的不是评判，也不是平均值，
            而是一句清明句：我现在看清楚的是……
          </p>
          <p>
            清楚不是为了消灭焦虑。清楚是为了让你能在今天或明天，
            做出一个低门槛、可承担、和自己价值更一致的小动作。
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-serif text-headline text-ink-core mb-5">
          它应当足够私密
        </h2>
        <div className="space-y-4 text-body-long leading-relaxed text-ink-body">
          <p>
            这里不是治疗、诊断或危机干预。它只是一个自我反思的房间，
            帮你把难以启齿的念头放轻一点、看清一点。
          </p>
          <p>
            你的纸页、画像和记忆同意只留在这台设备上。你可以清空它们。
            也应该能清空它们。内心独白，不该被迫永久保存。
          </p>
          <p>
            如果你正处在伤害自己或他人的危险里，或者已经无法保证安全，
            请立刻联系当地紧急服务、身边可信任的人或专业心理援助。
          </p>
        </div>
      </section>

      <Link
        href="/"
        className="inline-block px-6 py-3 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
      >
        开始五声会谈 →
      </Link>

      <footer className="mt-24 pt-10 border-t border-paper-edge text-xs text-ink-mute leading-relaxed">
        <p className="font-medium text-ink-body mb-4">
          参考文献
        </p>
        <ol className="space-y-2 list-decimal list-inside">
          {FOOTNOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ol>
      </footer>
    </main>
  );
}
