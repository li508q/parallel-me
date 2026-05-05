# 项目早期调研档案

> 这些是 ParallelMe V1/V2 时期的调研档案。它们见证了产品早期的设计决策，**但不再是当前的权威引用**。
>
> 当前的项目调研以 `docs/research/01-07-*.md` 为准。

---

## 为什么保留

1. **产品演化溯源** — 想知道为什么 lib/llm.ts 用 GAN-inspired harness？答案在 `harness/`。为什么有 me.md / 染色 / 14 字判词？答案在 `taste-personalization/`。
2. **学术礼貌** — 这些素材引用了真实研究（mem0、Generative Agents、IFS 论文等），保留作引用链。
3. **文学价值** — `inspiration/` 里的金句、概念、文化语料对未来文案设计仍有用。

---

## 目录

```
archive/
├── harness/              # V1/V2 multi-agent 辩论 / harness 工程调研
├── memory/               # 三层记忆架构 / mem0 / MemGPT 等
├── ux-product/           # V1/V2 时期 UX / 报告 / 仪式感模式
├── leaked-prompts/       # Claude Code / Cursor / Aider system prompt 拆解
├── taste-personalization/ # V2 染色（书 / 影 / 乐 → 14 字判词）调研
└── inspiration/          # 文学 / 电影 / 心理学家原话 / 文案灵感
```

---

## 引用规范

如需在新文档中引用这些素材：

- 标注 `(V1/V2 archive · year)` 以区别于当前权威资料
- 优先用 `docs/research/01-07-*.md` 中的对应章节，再追溯到 archive
- 不要在新设计决策中作为唯一依据

---

**最后更新**：项目整理后定稿，归档保留。
