# ParallelMe · 调研档案库

> 这个文件夹是 ParallelMe 设计与实现的"知识地基"。
> 凡是查到、读到、看到对产品设计有启发的内容，先落档案再谈实施。

## 目录结构

```
docs/
├── research/
│   ├── 00-INDEX.md            ← 你正在读
│   ├── V3/                    ← V3 时期重设计调研（推荐先读）
│   │   ├── README.md
│   │   ├── 01-apple-liquid-glass-2025.md
│   │   ├── 02-material-3-expressive.md
│   │   ├── 03-multi-agent-ux-patterns.md
│   │   ├── 04-ai-companion-retention.md
│   │   ├── 05-mental-health-ai-safety.md
│   │   ├── 06-color-trends-2026.md
│   │   ├── 07-typography-trends-2026.md
│   │   ├── 08-linear-things-design-philosophy.md
│   │   ├── 09-post-chat-ai-ux.md
│   │   ├── 10-ifs-digital-apps-competitive.md
│   │   └── 11-tech-stack-references.md
│   │
│   ├── harness/               ← Multi-agent 辩论 / harness 工程（V1/V2 时期）
│   ├── memory/                ← 跨会话记忆 / 用户画像（V1/V2 时期）
│   ├── ux-product/            ← UX 模式 / 报告设计 / 仪式感（V1/V2 时期）
│   ├── leaked-prompts/        ← Claude Code/Cursor 等系统 prompt 拆解
│   ├── taste-personalization/ ← 让 AI"认识 me"：书/影/乐 品味数据
│   └── inspiration/           ← 文学、电影、音乐等灵感片段
│
├── design/                    ← 综合调研后的产品宪法（详见 V3-IVY-FINAL-DIRECTION）
└── competitive/               ← 竞品全景分析
```

## 推荐阅读路径

**想了解 V0.5 的设计依据**：
1. 先看 [`V3/README.md`](./V3/README.md) — 11 份分类档案的索引
2. 再看 [`docs/design/V3-IVY-FINAL-DIRECTION.md`](../design/V3-IVY-FINAL-DIRECTION.md) — 上层宪法
3. 最后看 [`docs/competitive/V3-COMPETITIVE-LANDSCAPE.md`](../competitive/V3-COMPETITIVE-LANDSCAPE.md) — 竞品全景

**想看 V1/V2 时期的设计溯源**（产品演化史）：
- `harness/` `memory/` `ux-product/` `leaked-prompts/` `taste-personalization/` `inspiration/`
  这些是早期版本的研究素材，作为产品决策溯源保留。V0.5 已彻底重构，但许多基础原则（GAN harness、三层记忆、IFS 双层 persona）来自这里。

## 工作纪律

1. **先档案，再实施** — 任何设计决策都要能在档案中找到出处
2. **粗读 → 精炼 → 落地** — 每份原始资料读完都要写一句"对 ParallelMe 的具体启发"
3. **冲突要标注** — 不同源的设计建议如果冲突，写明双方观点 + 我们的选择 + 理由
4. **持续更新** — 实施过程中发现的新启发反过来更新档案

## 当前状态（V0.5 · 2026-05）

- V3 调研档案 11 份完整，是路演 / 宣发的权威素材库
- V1/V2 时期档案保留作历史归档，不计入"权威引用"
- DESIGN-V2.md 已删除（V3-IVY-FINAL-DIRECTION 完整取代）
