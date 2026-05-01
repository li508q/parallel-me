# ParallelMe · 调研档案

> 这个文件夹是 ParallelMe 设计与实现的"知识地基"。
> 凡是查到、读到、看到对产品设计有启发的内容，先落档案再谈实施。

## 目录

```
docs/
├── research/                  ← 原始调研（按主题分）
│   ├── 00-INDEX.md            ← 你正在读
│   ├── harness/               ← Multi-agent 辩论 / harness 工程
│   ├── memory/                ← 跨会话记忆 / 用户画像
│   ├── ux-product/            ← UX 模式 / 报告设计 / 仪式感
│   ├── leaked-prompts/        ← Claude Code/Cursor/Aider 等的 system prompt 拆解
│   ├── taste-personalization/ ← 让 AI"认识 me"：书/影/乐 品味数据
│   ├── competitors/           ← 直接对标产品（Replika/Pi/Dot 等）
│   └── inspiration/           ← 文学、电影、音乐等灵感片段
└── design/                    ← 综合调研后的产品宪法
    ├── DESIGN-V2.md           ← V2 综合设计稿（待生成）
    ├── PERSONA-CARDS.md       ← 5 分身人格卡（待生成）
    └── INFORMATION-ARCHITECTURE.md ← 页面/路由架构（待生成）
```

## 已完成调研

| 主题 | 文件 | 字数 | 关键产出 |
|---|---|---|---|
| Harness + Memory | `harness/01-debate-harness-and-memory.md` | ~2100 | 8 条 harness 升级原则、动态选 pair 伪代码、3 层记忆架构 |
| UX / 报告 / 仪式感 | `ux-product/01-top-products-design-patterns.md` | ~1900 | 10 条 UX 模式、Wrapped 7 帧报告、30s first-run 脚本 |

## 待完成调研

- `leaked-prompts/` — Claude Code / Cursor / Aider / OpenCode / Manus 的 system prompt 拆解
- `taste-personalization/` — Spotify/Last.fm/Letterboxd/Goodreads 等品味产品如何让 AI 认识 me
- `competitors/` — Pi.ai / Replika / Dot / Character.AI 的逐项功能拆解
- `inspiration/` — 心理学家原话（Esther Perel / IFS / Susan David）金句库

## 工作纪律

1. **先档案，再实施** — 任何设计决策都要能在档案中找到出处
2. **粗读 → 精炼 → 落地** — 每份原始资料读完都要写一句"对 ParallelMe 的具体启发"
3. **冲突要标注** — 不同源的设计建议如果冲突，写明双方观点 + 我们的选择 + 理由
4. **持续更新** — 实施过程中发现的新启发反过来更新档案
