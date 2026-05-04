import Link from "next/link";

export default function About() {
  return (
    <main className="min-h-screen px-5 sm:px-10 py-16 max-w-3xl mx-auto font-body">
      <Link
        href="/"
        className="font-display text-xs tracking-widest text-ink3 hover:text-ink uppercase mb-12 inline-block"
      >
        ← 回到我的阁
      </Link>

      <h1 className="font-display text-display text-ink mb-8 mt-6">
        为什么是<span className="scribble">5 个我</span>。
      </h1>

      <p className="font-display text-lg sm:text-xl leading-relaxed text-ink2 mb-10">
        我们不缺建议。我们缺的是听见自己。
      </p>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">
          ⓵ 单个 AI 的回答 = 中庸的中位数
        </h2>
        <p className="leading-[1.95] text-ink2 mb-3">
          你问 ChatGPT「我该不该辞职」，它会给你一份对照表，左边写好处、右边写坏处，
          然后说「祝你好运」。
        </p>
        <p className="leading-[1.95] text-ink2">
          但你不是缺好处坏处，你是缺
          <span className="scribble-thin">
            一种能让你在凌晨 3 点醒来时也站得住的语言
          </span>
          。 单个 AI 给不了你这个，因为它在试图对所有人都正确——一种最安全也最无用的姿态。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">
          ⓶ 心理学早就发现了这件事
        </h2>
        <p className="leading-[1.95] text-ink2 mb-4">
          Internal Family Systems（内部家庭系统疗法，Richard Schwartz, 1995）的核心发现：
          每个人内心都不是一个声音，而是
          <strong className="text-ink">
            一组各自有立场、有恐惧、有保护意图的子人格
          </strong>
          。
        </p>
        <p className="leading-[1.95] text-ink2 mb-4">
          那些彼此矛盾、互相打架的「声音」，从来都不是病。
          是<strong className="text-ink">心智的常态</strong>。
        </p>
        <p className="leading-[1.95] text-ink2">
          ParallelMe 做的事是：把那些通常只存在于你脑子里的声音
          ——「躺平的我」「搞钱的我」「出走的我」「想让妈高兴的我」「5 年后的我」
          ——具象化、给它们各自的人格、各自的语言，让它们坐在一张桌子上吵一架。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">
          ⓷ 这不是劝你哪个对，是让你听清自己
        </h2>
        <p className="leading-[1.95] text-ink2 mb-4">
          5 个分身吵完后，「此刻的我」<strong className="text-ink">不是平均值</strong>。
        </p>
        <p className="leading-[1.95] text-ink2">
          它是你看完所有声音之后那一刻的清明。一个真实的下一步——24
          小时内可执行的最小动作。 不是计划。是动作。
        </p>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">
          ⓸ 为什么是 multi-agent，不是单 chat
        </h2>
        <ul className="space-y-3 text-ink2 leading-[1.85]">
          <li>
            • <strong className="text-ink">独立人格</strong>
            ：每个分身有独立 system prompt、独立价值观、独立禁忌词。互相不看对方上下文。
          </li>
          <li>
            • <strong className="text-ink">cross-examine 层</strong>
            ：5 个分身回答完后，最对立的两对（搞钱⇄躺平、出走⇄陪妈）互相用 40 字戳穿对方没说出口的那部分。
            被戳穿的席位会真的回应一句——这是单 agent 物理上做不到的事。
          </li>
          <li>
            • <strong className="text-ink">收束层</strong>
            ：「此刻的我」读完所有声音后，给出
            <strong className="text-ink">真实下一步动作</strong>
            ，不是中位数。
          </li>
          <li>
            • <strong className="text-ink">你是主持人</strong>
            ：4 道用户参与门——立案确认 / 点名追问 / 签字 / 记忆同意——
            每一道都不能跳过。会议是你主持的，不是 AI 演给你看的。
          </li>
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-headline text-ink mb-5">
          ⓹ 你的阁是你的
        </h2>
        <p className="leading-[1.95] text-ink2 mb-3">
          所有数据存在你的浏览器本地。每次会议、签字、复盘、记忆同意都写在 IndexedDB 里。
          ParallelMe 的服务器永远不保存你的内容、你的钥匙、你的纠结。
        </p>
        <p className="leading-[1.95] text-ink2">
          关掉浏览器，你的阁就消失。它本来就该是这样——
          <span className="scribble-thin">内心独白，不该住在云上</span>。
        </p>
      </section>

      <Link
        href="/"
        className="font-display inline-block px-6 py-3 bg-ink text-paper rounded-full text-sm font-semibold hover:bg-ink/85"
      >
        回去开会 →
      </Link>

      <footer className="mt-24 pt-10 border-t rule text-xs text-ink3">
        <p>🪞 平行的我 · ParallelMe — 你内心的多个声音，第一次被允许同时讲话。</p>
      </footer>
    </main>
  );
}
