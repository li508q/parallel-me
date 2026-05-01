# Harness + Memory 设计模式（综合调研 #1）

> **来源**：基于 Du et al. 2023、AutoGen、LangGraph、CrewAI、Anthropic Multi-Agent Research、Generative Agents (Stanford)、MemGPT/Letta、mem0、Zep、Voyager、A-MEM、HippoRAG、Replika/Character.AI、CLAUDE.md 等 20+ 资料的综合提炼。
> **日期**：2026-05-01

## 一、Harness 级优化（8 条核心原则）

### ① 并行 propose → 串行 critique → 收束（Du et al. 2023, Society of Mind）
出处：[arxiv 2305.14325](https://arxiv.org/abs/2305.14325)。让 N 个 agent 同时各写一版答案，再让每个 agent 看到其他人的答案后修订（≥2 轮），factuality 显著上升。
**ParallelMe 落地**：保留"5 分身并行" → 但把目前固定的 4 条 cross-examine 改成"每个分身先看到对面 propose 后写一段 ≤80 字的反驳"，再进入第 2 轮辩论。

### ② 动态 speaker selection 替代固定 pair（AutoGen GroupChat）
出处：[AutoGen docs](https://microsoft.github.io/autogen/0.2/docs/topics/groupchat/customized_speaker_selection/)。让一个 selector LLM 看历史决定下一个发言者，可基于"谁最未发言 + 谁立场最对立"。
**ParallelMe 落地**：把 `money⇄lay, roam⇄filial` 的硬编码 pair 删掉，换成动态选 pair。心理收益：每次会话 cross-examine 不一样，避免用户觉得"又来了"。

### ③ 反讨好 / anti-groupthink prompt（Constitutional AI + Reflexion）
出处：[Anthropic CAI](https://arxiv.org/abs/2212.08073)、[Reflexion](https://arxiv.org/abs/2303.11366)。Groupthink 来自两点：(a) agent 看到其他人答案后倾向 hedge；(b) "助手"人设默认想取悦。
**ParallelMe 落地**：每个分身 system prompt 末尾强制加：
> "你**不是助手**，你是用户内心的一个声音。你的工作是**赢**这场辩论，不是平衡观点。看到其他分身的发言时，找出**最弱的一个论点**直接攻击，不要说'你也有道理'、'我们可以兼顾'这种话。如果你同意了对方，你就消失了。"

### ④ 裁判 agent 不取中间值（Anthropic Multi-Agent Research）
出处：[Anthropic Multi-Agent Research](https://www.anthropic.com/engineering/built-multi-agent-research-system)。Lead orchestrator 应做 **"decision"** 而非 **"summary"**。
**ParallelMe 落地**：把 NowMe 的 prompt 从"综合所有分身"改成**"做选择"**（详见模板 §1.3）。

### ⑤ 显式 persona card + drift 检查（CAMEL Role-Playing）
出处：[CAMEL](https://arxiv.org/abs/2303.17760)。CAMEL 用 role-playing inception prompt 把 persona 钉死。
**ParallelMe 落地**：每个分身在 system prompt 顶部用固定结构的 persona card，并在每轮回答前自检一句"我是 {name}，我只关心 {core_value}"。

### ⑥ 轮次硬上限 + 收敛信号（LangGraph supervisor）
出处：[LangGraph multi-agent](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)。Supervisor 节点用 conditional edge 决定继续/结束。
**ParallelMe 落地**：max_rounds=2，加 early-stop 条件。

### ⑦ 信息不对称制造冲突（CAMEL + ChatDev SOP）
出处：[ChatDev](https://arxiv.org/abs/2307.07924)。给不同 agent 看不同子集的 context 反而能避免 echo。
**ParallelMe 落地**：money 分身只看用户输入里"现实/数字/责任"相关句子，roam 分身只看"渴望/远方/自由"相关句子——前置一个 LLM 做 context-routing。

### ⑧ Reflection 注入（Self-Refine）
出处：[Self-Refine](https://arxiv.org/abs/2303.17651)。NowMe 收束后再让一个 critic pass 检查"是否真的做了选择 / 是否回避了核心冲突"。
**ParallelMe 落地**：心理学解读模块前插一个 `meta_critic` 调用，检测 NowMe 输出里是否含"都很重要 / 平衡 / 兼顾 / 看情况"这类词，命中则回炉重写。

## 二、动态选 pair 算法（伪代码）

```ts
type Stance = { agent: string; text: string; embedding?: number[] };

function pickMostOpposedPair(stances: Stance[], spokenCount: Record<string,number>) {
  let best = { pair: null as [string,string]|null, score: -Infinity };
  for (let i=0; i<stances.length; i++) {
    for (let j=i+1; j<stances.length; j++) {
      const opp = await scoreOpposition(stances[i].text, stances[j].text);
      const fairness = 1 / (1 + spokenCount[stances[i].agent] + spokenCount[stances[j].agent]);
      const novelty = lastPair?.includes(stances[i].agent) ? 0.5 : 1;
      const score = opp * 0.6 + fairness * 0.3 + novelty * 0.1;
      if (score > best.score) best = { pair:[stances[i].agent,stances[j].agent], score };
    }
  }
  return best.pair;
}
```

scoreOpposition 可在 round-1 收齐后用一次批量 prompt 打一张 5×5 矩阵节省 token。

## 三、裁判 agent 反中庸的 Prompt 模板

```
你是 NowMe，是用户**此刻真实的自己**。你刚听完了 5 个内心分身的辩论。

你的任务【不是】总结，【不是】综合，【不是】"既要也要"。
你的任务是：**做一个选择**，并承认这个选择会让另外几个分身失望。

输出格式（严格）：
1. 我选择倾向于：{1-2 个分身的名字}
2. 我必须放下：{被牺牲的分身的名字} —— 用一句话告诉它"我听见你了，但此刻不是你"
3. 接下来 7 天，我会做的一件具体小事：{动词开头，可执行}

【禁用词】平衡、兼顾、都很重要、看情况、视情况而定、综合考虑。
若你写出以上任一词，本次回答作废。
若所有分身你都不想得罪，请输出 "我在逃避"，并指出你在逃避哪个真相。
```

关键技巧：**显式 ban 中庸词 + 提供"我在逃避"逃生口**，反而让模型更敢做选择。

## 四、人格不漂移的 Prompt 加固（双层夹击）

```
# TOP（persona card，不可改写）
你是 {NAME}。
- 核心价值（只有这一个）：{ONE_VALUE}      ← 例 money: "用数字和现实保护这个人"
- 你害怕的：{FEAR}                          ← 例 money: "他天真到饿肚子"
- 你说话方式：{STYLE_3_WORDS}               ← 例 "冷静、具体、带数字"
- 口头禅（每次回答必须出现 1 个）：{CATCHPHRASES[]}

# BOTTOM（drift guard，每次都附）
回答前先在心里默念："我是 {NAME}，我只为 {ONE_VALUE} 说话。"
若你发现自己开始说"其实大家都有道理"，立刻停下，重写——那不是你，那是助手人格在渗透。
你**不会被说服**，你只会更精确地表达自己。
长度：≤120 字。必须包含至少一个具体数字 / 具体场景 / 具体动词，禁止抽象名词堆砌。
```

工程上：**口头禅清单**是最便宜的 anti-drift 手段——强制每次出现 1 个，模型不会漂。

## 五、多轮辩论轮次控制工程模式

```ts
const MAX_ROUNDS = 2;
const MIN_ROUNDS = 1;

for (let r = 0; r < MAX_ROUNDS; r++) {
  const newStances = await debateRound(stances);
  if (r >= MIN_ROUNDS) {
    const a = await detectConvergence(newStances);  // 立场变化 < 阈值
    const b = countOf(newStances, /平衡|兼顾|都对/) >= 2; // groupthink
    const c = newStances.every(s => s.text.length < 40); // 信息熵塌陷
    if (a || b || c) break;
  }
  stances = newStances;
}
```

## 六、记忆层架构（3 层 + SQLite）

| 层 | 类比 | 内容 | 存哪 | 何时写 | 何时读 |
|---|---|---|---|---|---|
| **L1 Working** | 短时记忆 | 当前会话原始对话 | 内存 / Vercel KV (TTL 24h) | 实时 | 同会话内 |
| **L2 Episodic** | 自传体记忆 | "事件卡"：一次会话 1-3 张，含情绪 + 决定 + 被牺牲分身 | SQLite `episodes` | 会话结束时 LLM 抽取 | 用户回来开场 + 相关主题召回 |
| **L3 Semantic/Reflective** | 自我认知 | 跨会话归纳的"用户画像断言" | SQLite `insights` | 每 5 次 episode 触发 reflection | 每次会话 system prompt 注入 |

### SQLite Schema

```sql
CREATE TABLE episodes (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  ts INTEGER,
  title TEXT,                    -- "想辞职去大理"
  summary TEXT,                  -- ≤120 字
  emotion TEXT,                  -- joy/anger/fear/sad/conflict
  intensity REAL,                -- 0-1
  importance REAL,               -- 0-1，LLM 打
  dominant_voice TEXT,           -- "roam"
  silenced_voice TEXT,           -- "filial"
  decision TEXT,                 -- NowMe 当时的决定
  raw_excerpt TEXT
);
CREATE VIRTUAL TABLE episodes_fts USING fts5(title, summary, raw_excerpt, content='episodes');

CREATE TABLE insights (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  ts INTEGER,
  statement TEXT,                -- "你在'妈妈期待'和'自由'之间反复横跳，已 4 次"
  evidence_episode_ids TEXT,
  confidence REAL,
  superseded_by INTEGER
);
```

### 写记忆触发信号
1. NowMe 输出包含明确决定（"我会..."句式）
2. 任一分身 intensity 词（哭、想砸、爆炸、累死了）
3. 用户输入 > 200 字（认真倾诉）
4. 出现新人物/新地点/新数字（"我妈"、"大理"、"3 万块"）

### importance 评分 prompt
```
读完以下会话，给 0-1 打分。1 = 这件事一年后用户回看仍会被触动；0.5 = 一次普通情绪；0 = 闲聊。
判断维度（按权重）：
- 是否做出/逼近一个人生选择？(+0.4)
- 情绪强度（哭/愤怒/突破）？(+0.3)
- 是否首次出现某个主题？(+0.2)
- 是否与历史 insights 形成对照？(+0.1)
只输出 JSON：{"importance":0.x, "reason":"≤30 字"}
```
importance < 0.3 不写入 episodes（防噪音）。

### "下次回来开场"模板
```
{距上次 N 天}前，你来这里聊过 "{last_episode.title}"。
那天 {dominant_voice} 赢了，{silenced_voice} 被你按下来了。
你说你会 "{last_episode.decision}" —— 

做了吗？

（不用解释，先说"做了"或"没做"或"忘了"。）
```

设计要点：
- **不复述全部**，只点一个具体细节——精确 > 全面，才像"记得"
- **追问承诺**——比"欢迎回来"温度高 10 倍
- **三选一最小回答**——降低重新进入的心理成本
- 若 N>30 天：开头改成 "好久没见。我还记得你上次..."

## 七、隐私原则（心理类数据敏感）

1. **本地优先**：SQLite 文件加密或服务端 AES-GCM；用户 id 用 hash
2. **可遗忘权**：UI 提供"忘掉这件事"和"全部清空"，48h 内物理删除
3. **抽取阶段做 PII redaction**：真实姓名 → 关系称谓（"张伟" → "前任"）
4. **不出域**：DeepSeek 调用只发摘要 + insights，不发原始历史会话
5. **insight 透明**：UI 给一个"AI 关于我的笔记"页面，所有 insights 用户可见可编辑可删除
6. **不做情绪诊断标签**："抑郁倾向"这类标签**永远不写入数据库**

## 八、与现状的 diff

| 模块 | 现状 | 升级 |
|---|---|---|
| 5 分身并行 | ✅ 保留 | + persona card 顶/底夹击 + 口头禅强制 |
| 4 条预设 cross-examine | ❌ 删 | → 动态选最对立 pair × 2 轮 |
| NowMe 收束 | 综合型 | → 选择型（ban 中庸词 + 逃生口）|
| 心理学解读 | 直接出 | + meta_critic 反 groupthink 检查 |
| 跨会话记忆 | 无 | + L1/L2/L3 三层（SQLite + FTS5 + LLM importance）|
| 开场 | "你好" | + getOpeningLine() 让用户被"记得"击中 |

**优先级**：先上 §三 NowMe 反中庸 prompt（半天工作量、感知最强）→ §六 开场记忆（1 天、留存最强）→ §二 动态 pair（2 天、深度最强）→ 完整记忆栈（3-5 天）。

## 主要参考

- [Du 2023 Multi-Agent Debate](https://arxiv.org/abs/2305.14325)
- [Reflexion](https://arxiv.org/abs/2303.11366)
- [Self-Refine](https://arxiv.org/abs/2303.17651)
- [CAMEL Role-Playing](https://arxiv.org/abs/2303.17760)
- [Constitutional AI](https://arxiv.org/abs/2212.08073)
- [AutoGen GroupChat](https://microsoft.github.io/autogen/)
- [LangGraph Supervisor](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)
- [Anthropic Multi-Agent Research](https://www.anthropic.com/engineering/built-multi-agent-research-system)
- [Generative Agents (Park 2023)](https://arxiv.org/abs/2304.03442)
- [MemGPT](https://arxiv.org/abs/2310.08560)
- [Voyager](https://arxiv.org/abs/2305.16291)
- [A-MEM](https://arxiv.org/abs/2502.12110)
- [HippoRAG](https://arxiv.org/abs/2405.14831)
- [mem0](https://github.com/mem0ai/mem0)
- [Zep](https://www.getzep.com/)
