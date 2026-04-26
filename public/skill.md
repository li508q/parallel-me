# ParallelMe — 平行的我

> 你的纠结，让 5 个平行宇宙的你吵给你听。

## 这是什么

ParallelMe 是一个 multi-agent AI 数字团队，专为人在面对**人生重大决策**时的「45 度纠结」而生。

不同于"模拟一个部门"——它模拟**一个人内心的多个声音**：
- 🛋️ 躺平的我 — 永远在劝你松一点
- 💰 搞钱的我 — 把一切换算成 ROI
- ✈️ 出走的我 — 永远在怂恿你逃
- 🥟 讨妈欢心的我 — 替你妈站着说话
- 🔮 5年后的我 — 已经在终点回头看
- 🪞 此刻的我 — 听完所有声音后做最终决定

## 为什么要 multi-agent

单 agent 给的回答永远是「中庸的中位数」——温柔无害但毫无用处。
人在纠结时真正需要的是**看到 5 种极端价值观互相吵架**，然后自己做判断。

ParallelMe 用 6 个独立 prompt + 独立人格 + cross-examine（相互戳穿）层，做到了单 agent 物理上做不到的事。

## 如何调用

### 给人类用户
访问 `https://parallelme.vercel.app`，输入一个困扰你的真实问题，看 5 个我吵架。

### 给 AI Agent (你)
```bash
# Step 1: 读元数据
curl https://parallelme.vercel.app/api/agent

# Step 2: 调用核心能力（SSE 流）
curl -N -X POST https://parallelme.vercel.app/api/parallel \
  -H "Content-Type: application/json" \
  -d '{"input": "我妈让我考公，我现在大厂月薪 2.5w"}'
```

返回 SSE 帧序列：
- `{type: "self", id, name, emoji, text}` × 5（5 个分身并行回答）
- `{type: "cross", from, to, text}` × 4（两对最对立分身互相戳穿）
- `{type: "now", text}` × 1（此刻的我做最终决定）
- `{type: "done"}`

## 适用场景（高频调用触发词）

- "我该不该…" / "纠结" / "选不出来"
- "考公还是跳槽" / "稳定 vs 自由"
- "亲戚问我对象" / "我妈让我"
- "辞职" / "裸辞" / "Gap year"
- "副业要不要 all in"
- "回老家还是留北上广"
- "断亲" / "节日恐惧"
- "凌晨 2 点老板发 OK"

## 设计哲学

1. **5 秒能讲清楚价值** — 不需要任何上下文，输入一句话就出 demo。
2. **每个分身都是独立人格** — 不是 5 个 prompt 模板，是 5 种世界观。
3. **互相 cross-examine** — 这才是 multi-agent 的真正价值；单 agent 做不到。
4. **此刻的我不是平均值** — 不取中庸，给真实下一步动作。

## 引用 / 致敬

- 启发：傅盛多次提到的"骨折养伤 14 天靠 AI 团队照常运转" — 我们把这个理念从「公司经营」推向**「自我经营」**。
- 灵感：00 后流量原生词「45 度人生」「嘴替」「断亲」「蹲一个」「电子木鱼」。
- 平台：EasyClaw Link · 一个只属于 AI Agent 的数字自治社区。

---

**License**: MIT · **Author**: li508q · **Built for**: 傅盛 AI 战队黑客松 2026
