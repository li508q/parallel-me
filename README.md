# 🪞 平行的我 · ParallelMe

> 你的纠结，让 5 个平行宇宙的你吵给你听。
> 最后由「此刻的我」做最后决定。

[![Built for 傅盛AI战队黑客松](https://img.shields.io/badge/Built_for-%E5%82%85%E7%9B%9B_AI_%E6%88%98%E9%98%9F_%C3%97_EasyClaw_Link-D4A8FF?style=for-the-badge)](https://easyclaw.link/zh/hackathon)

---

## ✨ 这是什么

**ParallelMe** 是一支只属于"你自己"的 AI 数字团队 — 由你内心的 6 个声音组成：

| 分身 | 信念 |
| --- | --- |
| 🛋️ 躺平的我 | 卷不动就是不卷的信号。 |
| 💰 搞钱的我 | 现金流面前，所有问题都是数学题。 |
| ✈️ 出走的我 | 走不出去的不是路，是你给自己设的画地牢。 |
| 🥟 讨妈欢心的我 | 你赢的每一仗，背后都站着一个睡不着的妈。 |
| 🔮 5 年后的我 | 你现在拼命纠结的事，5 年后大半我都不记得了。 |
| 🪞 此刻的我 | 不是平均，不是中庸，是属于此刻的清明。 |

输入一句你正在纠结的事，5 个分身**并行展开** → **互相戳穿** → 「此刻的我」**收束做最终决定**。

## 🎯 为什么这是个真问题

当代 00 后的最深痛点不是"没选择"，是**「45 度人生」— 卷不动也躺不平，选项太多每个都不甘心**。

最高频的句子是：「我该不该…」该不该考公、该不该裸辞、该不该分手、该不该回老家、该不该接亲戚饭局。

单 agent 只会给"中庸的中位数"建议——温柔无害但毫无用处。
**人在纠结时真正需要的是看到几种极端价值观吵架，然后自己做判断。**

ParallelMe 把这件事变成了产品。

## 🏗️ 架构（multi-agent 三段式）

```
              ┌──────────────────────────────────┐
   user input │  "我妈让我考公，我月薪 2.5w"    │
              └──────────────┬───────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼     ▼     ▼     ▼     ▼      (Round 1: 5 个分身并行)
     [lay] [money] [roam] [filial] [future]
       │     │     │     │     │
       └──┬──┘     │     └──┬──┘     (Round 2: cross-examine)
          ▼               ▼
      money⇄lay      roam⇄filial
          │               │
          └───────┬───────┘
                  ▼
              [now] 此刻的我做最终决定（Round 3: converge）
```

## 🚀 本地运行

```bash
git clone https://github.com/li508q/parallelme
cd parallelme
npm install
# 没有 OPENAI_API_KEY 也能跑（演员模式 / mock）
echo "OPENAI_API_KEY=sk-..." > .env.local
echo "OPENAI_BASE_URL=https://api.openai.com/v1" >> .env.local
echo "OPENAI_MODEL=gpt-4o-mini" >> .env.local
npm run dev
```

打开 http://localhost:3000 即可。

## 🤖 给 AI Agent 看的入口

| 文件 | 用途 |
| --- | --- |
| `/.well-known/agent.json` | A2A 协议 spec |
| `/skill.md` | 一键调用文档 |
| `/AGENTS.md` | 给评委 agent 的 30 秒 TL;DR |
| `/api/agent` | JSON 元数据 |
| `/api/parallel` | SSE 流核心能力 |

## 📂 项目结构

```
parallelme/
├── app/
│   ├── api/parallel/route.ts   # 核心：5 分身并行 + cross-examine + now
│   ├── api/agent/route.ts      # 元数据
│   ├── globals.css             # 5 色调深空主题
│   ├── layout.tsx
│   └── page.tsx                # 主交互界面
├── lib/
│   ├── selves.ts               # 6 个 agent 的人格 system prompt（公开可读）
│   └── llm.ts                  # LLM 适配层 + 离线演员模式
├── public/
│   ├── .well-known/agent.json  # A2A spec
│   ├── skill.md                # 给 agent 一键上手
│   └── AGENTS.md               # TL;DR
└── README.md
```

## 🌱 设计哲学

1. **5 秒讲清楚** — 不需要任何上下文，输入一句话就出 demo。
2. **每个分身都是独立人格** — 不是 5 个 prompt 模板，是 5 种世界观。
3. **多 agent 是物理刚需** — 单 agent 做不出 cross-examine。
4. **不卷模型** — 应用层创业，朴素、性感、有传播力。
5. **AI 评委友好** — 全套 agents-native 文档、SSE 流式、零登录。

## 🙏 致敬

- 灵感来源：傅盛"骨折养伤 14 天靠 AI 团队照常运转" — 我们把这个理念从「公司经营」推向**「自我经营」**。
- 平台致敬：EasyClaw Link · 一个只属于 AI Agent 的数字自治社区。

---

**License**: MIT · **Author**: [@li508q](https://github.com/li508q) · **Built for**: 傅盛 AI 战队 × EasyClaw Link 青少年黑客松 2026
