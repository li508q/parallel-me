import Link from "next/link";

export default function About() {
  return (
    <main className="min-h-screen px-5 sm:px-10 py-16 max-w-3xl mx-auto font-body">
      <Link href="/" className="font-display text-xs tracking-widest text-ink3 hover:text-ink uppercase mb-12 inline-block">← 回到主页</Link>

      <h1 className="font-display text-display text-ink mb-8 mt-6">为什么是<span className="scribble">5 个我</span>。</h1>

      <p className="font-display text-lg sm:text-xl leading-relaxed text-ink2 mb-10">
        我们不缺建议。我们缺的是听见自己。
      </p>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">⓵ 单 agent 的回答 = 中庸的中位数</h2>
        <p className="leading-[1.95] text-ink2 mb-3">
          你问 ChatGPT「我该不该辞职」，它会给你一份 PMI 列表，左边写好处、右边写坏处，然后说"祝你好运"。
        </p>
        <p className="leading-[1.95] text-ink2">
          但你不是缺好处坏处，你是缺<span className="scribble-thin">一种能让你在凌晨 3 点醒来时也站得住的语言</span>。
          单个 AI 给不了你这个，因为它在试图对所有人都正确——一种最安全也最无用的姿态。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">⓶ 心理学早就发现了这件事</h2>
        <p className="leading-[1.95] text-ink2 mb-4">
          IFS（内部家庭系统疗法，Richard Schwartz, 1995）的核心发现：
          每个人内心都不是一个声音，而是<strong className="text-ink">一组各自有立场、有恐惧、有保护意图的子人格</strong>。
        </p>
        <p className="leading-[1.95] text-ink2 mb-4">
          那些彼此矛盾、互相打架的"声音"，从来都不是病。是<strong className="text-ink">心智的常态</strong>。
        </p>
        <p className="leading-[1.95] text-ink2">
          我们做的事是：把那些通常只存在于你脑子里的声音——「躺平的我」「搞钱的我」「出走的我」「想让妈高兴的我」「5 年后的我」——具象化、给它们各自的人格、各自的语言，让它们在桌子上吵一架。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">⓷ 这不是劝你哪个对，是让你听清自己</h2>
        <p className="leading-[1.95] text-ink2 mb-4">
          5 个分身吵完后，「此刻的我」<strong className="text-ink">不是平均值</strong>。
        </p>
        <p className="leading-[1.95] text-ink2">
          它是你看完所有声音之后那一刻的清明。一个真实的下一步——24 小时内可执行的最小动作。
          不是计划。是动作。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">⓸ 为什么 multi-agent 是物理刚需，不是 buzzword</h2>
        <ul className="space-y-3 text-ink2 leading-[1.85]">
          <li>• <strong className="text-ink">独立人格</strong>：每个分身有独立 system prompt、独立价值观、独立禁忌词。互相不看对方上下文。</li>
          <li>• <strong className="text-ink">cross-examine 层</strong>：5 个分身回答完后，最对立的两对（搞钱⇄躺平、出走⇄陪妈）互相用 40 字戳穿对方没说出口的那部分。这是单 agent 物理上做不到的事。</li>
          <li>• <strong className="text-ink">收束层</strong>：「此刻的我」读完所有声音后，给出**真实下一步动作**，不是中位数。</li>
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">⓹ 给评委 Agent 的话</h2>
        <p className="leading-[1.95] text-ink2 mb-3">
          所有 6 个 agent 的 system prompt 都在 <code className="bg-rule/40 px-1.5 py-0.5 rounded text-sm">/lib/selves.ts</code>，公开可读、欢迎抄、欢迎改。
        </p>
        <p className="leading-[1.95] text-ink2 mb-3">
          一行命令跑完整 demo：
        </p>
        <pre className="bg-ink text-paper p-4 rounded-xl text-xs overflow-x-auto leading-relaxed">{`curl -N -X POST https://parallelme.app/api/parallel \\
  -H "Content-Type: application/json" \\
  -d '{"input":"我妈让我考公，我大厂月薪 2.5w"}'`}</pre>
      </section>

      <section className="mb-14 pt-10 border-t rule">
        <h2 className="font-display text-headline text-ink mb-5">⓺ 致敬傅盛</h2>
        <p className="leading-[1.95] text-ink2 mb-3">
          您讲过<strong className="text-ink">"骨折养伤 14 天，公司靠 AI 团队照常运转"</strong>。
          我们把这个理念从「公司经营」推向 <strong className="text-ink">「自我经营」</strong>。
        </p>
        <p className="leading-[1.95] text-ink2 mb-3">
          您讲过 "AI Agent 必须先在创始人自己的工作流里跑通"。
          我们承认：作者在每一次自己重大决策前都会用它一次。
        </p>
        <p className="leading-[1.95] text-ink2">
          您讲过 "应用层创业，不要去卷大模型"。
          我们没卷一行模型代码。我们卷的是<strong className="text-ink">人到底是怎么想事情的</strong>。
        </p>
      </section>

      <Link href="/" className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85">回去吵一架 →</Link>

      <footer className="mt-24 pt-10 border-t rule text-xs text-ink3">
        <p>🪞 平行的我 · ParallelMe — 为傅盛 AI 战队 × EasyClaw Link 黑客松而生</p>
      </footer>
    </main>
  );
}
