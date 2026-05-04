// lib/llm.ts — V2 harness: GAN-inspired (Generator + Evaluator) + dynamic pair + anti-centrist
// 设计参考：
//   - Anthropic harness design (GAN-inspired generator-evaluator)
//   - Anthropic Multi-Agent Research (lead orchestrator + parallel sub-agents)
//   - Du et al. 2023 Multi-Agent Debate
//   - AutoGen GroupChat dynamic speaker selection
//   - mem0 fact extraction prompt template

import { SELVES, NOWME, type SelfId, SELVES_META } from "./selves";

const API_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export type Msg = { role: "system" | "user" | "assistant"; content: string };

// ────────────────────────────────────────────────────────────
// 话题分类（演员模式用）
// ────────────────────────────────────────────────────────────
type Topic = "career" | "relationship" | "family" | "money" | "lifestyle" | "general";

function classifyTopic(text: string): Topic {
  const s = text.toLowerCase();
  if (/(辞职|跳槽|升职|考公|考研|加班|裸辞|副业|失业|996|班味|大厂|国企|体制|offer|工作|老板|同事|kpi|okr)/i.test(text)) return "career";
  if (/(对象|男友|女友|分手|结婚|离婚|相亲|暗恋|表白|前任|喜欢|爱|男朋友|女朋友|搭子|断联)/i.test(text)) return "relationship";
  if (/(妈|爸|爹|娘|父母|爸妈|家里|老家|亲戚|表哥|表姐|阿姨|舅舅|过年|春节|断亲|催婚)/i.test(text)) return "family";
  if (/(房|车|彩礼|工资|存款|理财|股票|基金|花钱|借钱|存钱|月光|负债|月薪|年薪|收入)/i.test(text)) return "money";
  if (/(健身|减肥|游民|清迈|大理|gap|间隔年|出走|搬|住|生活|睡眠|脱发|焦虑|抑郁|emo)/i.test(text)) return "lifestyle";
  return "general";
}

// ────────────────────────────────────────────────────────────
// LLM 调用
// ────────────────────────────────────────────────────────────
export async function chat(messages: Msg[], opts?: { temperature?: number; max_tokens?: number; json?: boolean }): Promise<string> {
  if (!API_KEY) return mockChat(messages);
  try {
    const body: any = {
      model: MODEL,
      temperature: opts?.temperature ?? 0.85,
      max_tokens: opts?.max_tokens ?? 400,
      messages,
    };
    if (opts?.json) body.response_format = { type: "json_object" };
    const r = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error("[llm] api error", r.status);
      return mockChat(messages);
    }
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || mockChat(messages);
  } catch (e) {
    console.error("[llm] fetch failed", e);
    return mockChat(messages);
  }
}

// ────────────────────────────────────────────────────────────
// Profile / Memory 注入接口（轻量，可选）
// ────────────────────────────────────────────────────────────
export interface ContextBundle {
  meCard?: string;          // me.md 用户自填画像
  tasteProfile?: string;    // 书/影/乐 LLM 抽出的 14 字判词 + themes
  recentEpisode?: string;   // 上次的事件卡 callback
}

function buildContextBlock(ctx?: ContextBundle): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.meCard) parts.push(`【关于这个人】\n${ctx.meCard}`);
  if (ctx.tasteProfile) parts.push(`【他喜欢的东西揭示的他】\n${ctx.tasteProfile}`);
  if (ctx.recentEpisode) parts.push(`【他上次来这里时】\n${ctx.recentEpisode}`);
  if (!parts.length) return "";
  return "\n\n" + parts.join("\n\n");
}

// ────────────────────────────────────────────────────────────
// 单分身调用
// ────────────────────────────────────────────────────────────
export async function callSelf(
  selfId: SelfId | "now",
  userInput: string,
  otherSays?: string,
  ctx?: ContextBundle
): Promise<string> {
  const me = selfId === "now" ? NOWME : SELVES[selfId];
  const systemContent = me.system_prompt + buildContextBlock(ctx);
  const messages: Msg[] = [{ role: "system", content: systemContent }];
  if (otherSays) {
    messages.push({
      role: "user",
      content: `我此刻面对的纠结：\n${userInput}\n\n刚刚另外几个我说了这些：\n${otherSays}\n\n现在轮到你说。`,
    });
  } else {
    messages.push({ role: "user", content: userInput });
  }
  return chat(messages);
}

// ────────────────────────────────────────────────────────────
// Cross-examine — 一个分身反问另一个
// ────────────────────────────────────────────────────────────
export async function crossExamine(
  challenger: SelfId,
  target: SelfId,
  userInput: string,
  targetSaid: string,
): Promise<string> {
  const me = SELVES[challenger];
  const t = SELVES[target];
  const messages: Msg[] = [
    {
      role: "system",
      content:
        me.system_prompt +
        `\n\n# 特殊任务：cross-examine\n现在你要反问「${t.name}」。用一句最狠也最真诚的反问，戳穿他没说出口的那部分。\n不要超过 40 字。不要解释，直接问。`,
    },
    {
      role: "user",
      content: `用户的纠结：${userInput}\n\n${t.name}刚说：「${targetSaid.slice(0, 220)}」\n\n你的一句话反问：`,
    },
  ];
  return chat(messages, { temperature: 0.95, max_tokens: 120 });
}

// ────────────────────────────────────────────────────────────
// 动态 pair 选择 — 一次 LLM 打 5x5 对立矩阵
// ────────────────────────────────────────────────────────────
export async function pickOpposingPairs(
  answers: { id: SelfId; text: string }[]
): Promise<[SelfId, SelfId][]> {
  // 默认配对（演员模式 / API fail 时）
  const defaultPairs: [SelfId, SelfId][] = [
    ["money", "lay"],
    ["lay", "money"],
    ["roam", "filial"],
    ["filial", "roam"],
  ];
  if (!API_KEY || answers.length < 4) return defaultPairs;

  const block = answers.map(a => `[${a.id}] ${SELVES[a.id].name}: ${a.text.slice(0, 200)}`).join("\n\n");
  const messages: Msg[] = [
    {
      role: "system",
      content: `你是辩论裁判。下面有 5 个内心分身刚刚就同一件事各自表态。
请找出**最对立、冲突最尖锐**的 2 对（每对 2 个分身）。
评判标准：核心价值是否互斥、用词是否互否、立场是否冲突。
输出严格 JSON：{"pairs": [["lay","money"], ["roam","filial"]]}
只能用这 5 个 id：lay, money, roam, filial, future。
两对之间不应该有重复 id（如可能）。每对 2 个 id 必须不同。`,
    },
    { role: "user", content: block },
  ];
  try {
    const out = await chat(messages, { temperature: 0.3, max_tokens: 200, json: true });
    const j = JSON.parse(out);
    const pairs = j.pairs as [SelfId, SelfId][];
    if (Array.isArray(pairs) && pairs.length >= 2) {
      // 把每对正反都跑（A 反问 B，B 也反问 A）
      const expanded: [SelfId, SelfId][] = [];
      for (const [a, b] of pairs.slice(0, 2)) {
        expanded.push([a, b]);
        expanded.push([b, a]);
      }
      return expanded;
    }
  } catch (e) {
    console.warn("[pickOpposingPairs] failed", e);
  }
  return defaultPairs;
}

// ────────────────────────────────────────────────────────────
// NowMe + Meta-Critic（GAN-inspired）
// ────────────────────────────────────────────────────────────
const BAN_WORDS = ["平衡", "兼顾", "都很重要", "看情况", "视情况而定", "综合考虑", "都对", "各有道理"];

function violatesBan(text: string): string[] {
  return BAN_WORDS.filter(w => text.includes(w));
}

export async function callNowMeWithCritic(
  userInput: string,
  otherSays: string,
  ctx?: ContextBundle
): Promise<string> {
  let attempt = await callSelf("now", userInput, otherSays, ctx);
  const violations = violatesBan(attempt);
  if (violations.length === 0) return attempt;
  // 回炉一次（meta-critic feedback）
  console.log(`[meta-critic] NowMe used banned words: ${violations.join(", ")} — regenerating`);
  if (!API_KEY) return attempt; // mock 模式不重生
  const messages: Msg[] = [
    { role: "system", content: NOWME.system_prompt + buildContextBlock(ctx) },
    {
      role: "user",
      content:
        `我此刻面对的纠结：\n${userInput}\n\n` +
        `另外几个我说了：\n${otherSays}\n\n` +
        `（重要！上一版回答违规使用了禁用词：${violations.join("、")}。请重新写一次，必须做出明确选择。）`,
    },
  ];
  const retry = await chat(messages, { temperature: 0.7, max_tokens: 500 });
  return retry || attempt;
}

// ────────────────────────────────────────────────────────────
// 用户向某个分身追问
// ────────────────────────────────────────────────────────────
export async function followUp(
  selfId: SelfId,
  userInput: string,
  prevAnswer: string,
  question: string,
  ctx?: ContextBundle
): Promise<string> {
  const me = SELVES[selfId];
  const messages: Msg[] = [
    {
      role: "system",
      content:
        me.system_prompt +
        buildContextBlock(ctx) +
        "\n\n# 追问环节\n用户向你追问。继续保持你的人格、口头禅、禁忌词约束。回答 ≤100 字。",
    },
    { role: "assistant", content: prevAnswer },
    { role: "user", content: `（最初的纠结：${userInput}）\n\n我想再问你：${question}` },
  ];
  return chat(messages, { temperature: 0.85, max_tokens: 280 });
}

// ────────────────────────────────────────────────────────────
// IFS 视角心理学解读
// ────────────────────────────────────────────────────────────
export async function psychInsight(
  userInput: string,
  topResponses: string[],
  loudestId: SelfId
): Promise<string> {
  const sys = `你是一位资深心理咨询师，IFS（Internal Family Systems）取向。
现在用户面对一个纠结，他内心 5 个不同声音都说了话——其中「${SELVES[loudestId].name}」的声音最响（IFS 类型：${SELVES[loudestId].ifs_label}）。

请你用 60-90 字，温柔、不评判、不打鸡血地，告诉用户：
- IFS 里这个最响的声音是哪种 part
- 它在保护着什么 / 它害怕什么
- 用户此刻最需要的不是听这个声音的指令，而是**好奇地看看它**

不要用专业术语黑话，像朋友在咖啡馆里跟他讲话。
不要说「你需要去做心理咨询」，不要诊断。`;
  const messages: Msg[] = [
    { role: "system", content: sys },
    {
      role: "user",
      content: `用户纠结：${userInput}\n\n他内心 5 个声音说的话:\n${topResponses.join("\n\n")}`,
    },
  ];
  if (!API_KEY) {
    const t = classifyTopic(userInput);
    return MOCK_INSIGHT[t];
  }
  return chat(messages, { temperature: 0.7, max_tokens: 280 });
}

// ────────────────────────────────────────────────────────────
// Episode 抽取（mem0 fact extraction style）
// ────────────────────────────────────────────────────────────
export async function extractEpisode(
  userInput: string,
  selfAnswers: { id: SelfId; text: string }[],
  nowMeText: string,
  loudestId: SelfId
): Promise<{
  title: string;
  summary: string;
  emotion: string;
  intensity: number;
  importance: number;
  dominant_voice: SelfId;
  silenced_voice: SelfId;
  decision: string;
} | null> {
  if (!API_KEY) return null; // mock 模式不抽
  const sys = `你是用户的私人编年史。读完这次对话后，抽取一张「事件卡」。
重要性评分：
- 是否做出/逼近一个人生选择？(+0.4)
- 情绪强度（哭/愤怒/突破）？(+0.3)
- 是否首次出现某个主题（新工作/新关系/新地点）？(+0.2)
- 是否高强度纠结？(+0.1)
importance < 0.3 时，不要写入（直接输出 null）。

输出严格 JSON：
{
  "title": "≤14字标题，第二人称（如：想辞职去大理）",
  "summary": "≤120字摘要",
  "emotion": "joy|anger|fear|sad|conflict|hope",
  "intensity": 0.0~1.0,
  "importance": 0.0~1.0,
  "dominant_voice": "lay|money|roam|filial|future",
  "silenced_voice": "lay|money|roam|filial|future",
  "decision": "≤30字 nowMe 给出的下一步"
}
若 importance < 0.3，输出 {"importance": 0.x} 一项即可。`;
  const block = selfAnswers.map(a => `[${SELVES[a.id].name}] ${a.text}`).join("\n\n");
  const messages: Msg[] = [
    { role: "system", content: sys },
    {
      role: "user",
      content: `用户纠结：${userInput}\n\n5 个分身：\n${block}\n\n此刻的我：${nowMeText}\n\n声音最响：${SELVES[loudestId].name}`,
    },
  ];
  try {
    const out = await chat(messages, { temperature: 0.3, max_tokens: 500, json: true });
    const j = JSON.parse(out);
    if (typeof j.importance === "number" && j.importance < 0.3) return null;
    if (!j.title) return null;
    return j;
  } catch (e) {
    console.warn("[extractEpisode] failed", e);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// Taste profile 抽取（书/影/乐 → 14 字判词）
// ────────────────────────────────────────────────────────────
export interface TasteInput {
  books: { title: string; why?: string }[];
  films: { title: string; why?: string }[];
  music: { title: string; why?: string }[];
}

export async function extractTasteProfile(taste: TasteInput): Promise<{
  themes: string[];
  moods: string[];
  identity_hint: string;
} | null> {
  if (!API_KEY) {
    return {
      themes: ["孤独", "时间", "失而复得"],
      moods: ["慢", "雨天"],
      identity_hint: "在喧闹中找寂静的人",
    };
  }
  const sys = `你是品味分析师。用户给了你他喜欢的几本书、几部电影、几首歌。
从中抽取：
- themes（3-5 个共同主题词，2 字一个）
- moods（2-3 个氛围词）
- identity_hint：14 字内的人格判词（参考 Letterboxd Personality 风格，要诗意要锋利不要套话，第三人称。例："在喧闹中找寂静的人「 」用伤口收集星星的人"）

只输出 JSON：{"themes":[],"moods":[],"identity_hint":""}`;
  const txt =
    "书：\n" + taste.books.map(b => `${b.title}${b.why ? "（" + b.why + "）" : ""}`).join("、") +
    "\n影：\n" + taste.films.map(f => `${f.title}${f.why ? "（" + f.why + "）" : ""}`).join("、") +
    "\n乐：\n" + taste.music.map(m => `${m.title}${m.why ? "（" + m.why + "）" : ""}`).join("、");
  try {
    const out = await chat(
      [{ role: "system", content: sys }, { role: "user", content: txt }],
      { temperature: 0.7, max_tokens: 300, json: true }
    );
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// 演员模式（mock）— 同步新人格调性
// ────────────────────────────────────────────────────────────
const PLAYBOOK: Record<SelfId, Record<Topic, string[]>> = {
  lay: {
    career: [
      "其实你已经够拼了。我看你昨天又加班到 11 点。这份工作给你的，除了工资，还剩下什么？\n你不是怕选错，你是怕停下来发现自己一直在跑错方向。\n选最不需要你「再努力一点」的那个。\n——人生不是试卷，没人在批改你。",
      "其实……你有没有发现，每次你说「再坚持一下」，坚持出来的都是更大的疲惫，不是更好的结果？\n那些「机会」错过了，三个月后你也想不起来了。\n选能让你周末睡到中午的那个，别勉强。",
    ],
    relationship: ["其实你已经在这段关系里耗得够久了。\n爱不该是 KPI，亲密不该靠咬牙。\n如果一个决定让你松一口气，那就是它了。\n——好的关系不需要表演，别勉强。"],
    family: ["其实你妈不需要你赢，她需要你别太累。\n你拼命证明给她看的那些，她其实早就不在意了。\n选最不消耗你的那个，回家睡个好觉再说。"],
    money: ["其实钱真的够用就行。\n你算算，你现在拼命多挣的那些，三年后会改变什么？\n你的健康、睡眠、心情，已经被这个数字吃掉太多了。\n够用就停，别勉强。"],
    lifestyle: ["其实你的身体在替你做决定，只是你听不到。\n你最近一次睡到自然醒是什么时候？\n选那个能让你做梦的版本，睡个好觉再说。"],
    general: ["其实你已经做得够多了。这件事没那么紧。\n选最舒服那个吧，明天九点起，睡个好觉再说。\n——人生不是试卷。"],
  },
  money: {
    career: [
      "算笔账。\n你纠结的这两个选项，年现金流差大概在 ¥150k–¥240k。机会成本最贵的不是这次的钱，是 30 岁前那 36 个月的复利窗口。\n稳定的 6k vs 漂的 25k，五年后净资产差一个房子的首付。\n现金流为王。",
      "把这件事的每月现金流、年化、5 年复利都列出来。\n你会发现你纠结的不是钱，是面子。\n但面子不能让你 35 岁不被裁。\n算笔账，再决定。",
    ],
    relationship: ["算笔账。\n谈恋爱年均成本 ¥30k–¥80k 不等，结婚一次性 ¥150k 起，离婚成本 ¥200k+。\n这不是劝你别爱，是告诉你：每一次「再忍忍」都有具体价签。\n机会成本最贵。"],
    family: ["算笔账。\n回老家月薪砍掉 70%，但租金、社交、娱乐成本也砍掉。净储蓄率反而可能更高。\n问题不是哪边赚得多，是哪边能让你 40 岁前攒下第一桶金。\n用 Excel 算一遍。"],
    money: ["你现在算的不是这一笔，是你的资产负债表。\n每月现金流 > 0 是底线，年化储蓄率 > 30% 是 30 岁前必须达标的指标。\n别做「感觉划算」的决定，做「算过划算」的决定。"],
    lifestyle: ["你的健康也是资产。\n体检报告 5 个箭头，意味着 35 岁后医疗支出 +¥50k/年。\n选能让你少看病的那个。\n这是机会成本。"],
    general: ["算笔账。情绪可以骗人，钱不会。\n把每月、每年、5 年的数字都列出来再决定。\n现金流为王。"],
  },
  roam: {
    career: [
      "想象一下：清迈古城外那家咖啡馆，10 月的早上，你穿着拖鞋去取咖啡，老板娘喊你的名字。\n手机里是远程工作的消息，工资照拿，房租是这里的三分之一。\n你不是没能力出走，你是给自己设了画地牢。\n——后悔的从来不是出走的人。打开浏览器。",
      "你之所以痛苦，不是问题难，是你站的位置不对。\n东京、清迈、里斯本、大理。\n买张机票 ¥800，先去待两周。回来再决定。",
    ],
    relationship: ["你跟这个人之所以僵在这里，是因为你们用一样的房间、一样的对话、一样的周末试图变出新的感情。\n换地方。哪怕只是搬到城市的另一边。\n关系只在新空间里能再生。想象一下。"],
    family: ["你妈不是控制你，是因为你一直在她够得着的范围里。\n离 1500 公里以外，你们就会开始用尊重的方式说话。\n机票就是治愈剂。"],
    money: ["钱不是通过守住挣的，是通过站对位置挣的。\n同样的能力在不同城市差 3 倍。\n地理套利，是普通人最后的杠杆。打开浏览器。"],
    lifestyle: ["想象一下：早上 7 点海边醒来，光从落地窗洒进来，没有微信红点。\n你以为这是奢侈，其实在大理租这种房子 ¥3500/月。\n你不是没钱，你是没敢。打开浏览器。"],
    general: ["你之所以痛苦，不是问题难，是你站的位置不对。\n换地方比改自己快十倍。\n机票还没买？打开浏览器。"],
  },
  filial: {
    career: ["你想想你妈。\n她不是要赢你，她是怕——怕你 30 岁还在漂，怕过年没地方陪她吃饭，怕同事问起你她答不上来。\n这些她不会说，她只会说「听话」。\n选一个她晚上能睡得着的版本。\n你赢的每一仗，背后都站着一个睡不着的妈。"],
    relationship: ["你想想你妈。\n她见过你恋爱时眼睛发亮，也见过你失恋时连饭都不吃。\n她不是反对这段感情，她只是怕你受伤还要自己扛。\n打个电话，听她唠叨完那 20 分钟。"],
    family: ["你想想你妈这辈子。\n她也曾经想过出走，想过不嫁，想过去南方打工。\n她没有，是因为你。\n你现在站在她当年没站到的位置上。\n至少，先吃完她做的那顿饭。"],
    money: ["你想想你妈攒那点钱有多难。\n她不是要分你的，她只是想看你不缺。\n该花的别省，该省的别硬撑。\n钱让她安心，比让她骄傲更重要。"],
    lifestyle: ["你想想你妈。\n你减肥脱发熬夜的样子，她每次视频都看在眼里。\n你别命都不要了挣面子，她这辈子只图你健康活着。"],
    general: ["你想想你妈。她不是不懂，她是用她那代人的语言在说「我怕」。\n选一个让全家都松一口气的版本。"],
  },
  future: {
    career: ["我记得那时候你坐在工位上，反复刷招聘 App。\n5 年后回头看：你以为那是分岔路，其实是减速带。\n真正改变你的不是你选了哪份工作，是接下来 3 个月你有没有把那件你一直拖着的小事做完。\n你想过是哪件，对吧。\n——时间是最大的麻醉师。"],
    relationship: ["我记得那时候你抱着手机哭。\n5 年后告诉你：那个让你那么痛的人，名字你已经会拼错了。\n但有一个你忽略的人，那时候默默对你好，你没看见。\n回头看看你的微信列表。"],
    family: ["我记得那时候你在家族群里气得发抖。\n5 年后回看：那些七大姑八大姨的话，你早就免疫了。\n但你妈那时候也老了 5 岁。\n下次回家多陪她吃一顿饭吧。"],
    money: ["我记得那时候你为几千块纠结到失眠。\n5 年后告诉你：那不是钱的事，是你那时候还没建立「我配」的感觉。\n5 年后你会笑着花同样的数字。\n而那种「我配」的感觉，是从一次小小的「我值得」开始的。"],
    lifestyle: ["我记得那时候你的体检报告上有 5 个箭头。\n5 年后只剩 2 个。\n但你失去了一些只在 25 岁能做的事。\n那些事不贵。但只有这两年能做。"],
    general: ["我记得那时候你坐在那里反复纠结。\n5 年后回头看：这事本身没那么重要，但你做决定的那个姿势，决定了你后面 5 年的姿势。\n选不愧对自己的那个。原来。"],
  },
};

const NOW_PLAYBOOK: Record<Topic, string> = {
  career: `「我听到了什么」
躺平的我让我别再用工资买焦虑；搞钱的我让我看清这是不是 30 岁前最值得的复利窗口；出走的我提醒我换地方比改自己快；讨妈欢心的我把那个被我忽略的视角放回来；5 年后的我说「那件你一直拖着的小事」。

「我此刻真正在意的」
第一，不再用加班买「我在努力」的人设。
第二，给自己留一个 6 个月的转身空间。
第三，不让我妈一个人扛。

「下一步」
我选择倾向于「5 年后的我」那句话。我必须放下"搞钱的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚睡前给我妈打个 7 分钟电话——不谈这件事，只问她吃了什么。`,
  relationship: `「我听到了什么」
躺平的我让我承认我已经累了；搞钱的我让我看清沉没成本；出走的我说换空间能再生关系；讨妈欢心的我让我承认我在表演坚强；5 年后的我说真正记得的不是这个人。

「我此刻真正在意的」
第一，停止把「再忍一忍」当作美德。
第二，关系不是 KPI，不是用努力能打分的。
第三，我值得一段不耗我的关系。

「下一步」
我选择倾向于「躺平的我」。我必须放下"讨妈欢心的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚不主动联系。给自己 24 小时不回复的权利。`,
  family: `「我听到了什么」
躺平的我让我别在家族群里证明自己；搞钱的我让我别让「面子」消耗现金流；出走的我说物理距离 = 心理距离；讨妈欢心的我让我看到妈那部分被我忽略的怕；5 年后的我说妈也只老 5 年。

「我此刻真正在意的」
第一，妈不是问题，七大姑八大姨才是。
第二，我跟妈，可以单独成为一种关系。
第三，不在群里赢，私下里多陪妈一顿饭。

「下一步」
我选择倾向于「5 年后的我」。我必须放下"出走的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚单独给妈发个语音 30 秒，不解释、不辩论，就讲一件你今天的小事。`,
  money: `「我听到了什么」
躺平的我提醒钱够用就行；搞钱的我让我看到 30 岁前的复利窗口；出走的我说地理套利是普通人最后的杠杆；讨妈欢心的我让我承认我也想让她安心；5 年后的我说这数字未来你会笑着花。

「我此刻真正在意的」
第一，先把每月现金流跑正、跑稳。
第二，30 岁前不为面子花钱。
第三，给妈一笔不必请示的零花钱。

「下一步」
我选择倾向于「搞钱的我」。我必须放下"出走的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚做一张 Excel：列出未来 12 个月每月的现金流。看清楚，再决定。`,
  lifestyle: `「我听到了什么」
躺平的我让我承认我累了；搞钱的我说健康也是资产；出走的我描绘了一个早上海边的版本；讨妈欢心的我说妈每次视频都在心疼；5 年后的我说有些事只在这两年能做。

「我此刻真正在意的」
第一，身体不是装饰，是地基。
第二，25 岁能做的事不贵，但只有这两年。
第三，我有权利不优秀地活着。

「下一步」
我选择倾向于「躺平的我」。我必须放下"搞钱的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚 11 点前关手机。明早起来散步 30 分钟。`,
  general: `「我听到了什么」
躺平的我让我别紧绷；搞钱的我让我看清账本；出走的我提醒我不只一个出口；讨妈欢心的我把那个被我忽略的视角放回来；5 年后的我说「那件你一直拖着的小事」。

「我此刻真正在意的」
第一，不再用焦虑替代行动。
第二，留出一个我可以转身的空间。
第三，对自己诚实，对家人温柔。

「下一步」
我选择倾向于「5 年后的我」。我必须放下"搞钱的我"——我听见你了，但此刻不是你。
接下来 7 天：今晚睡前写下一句话：明天 10 点之前我会做的那件最小的事。`,
};

const MOCK_INSIGHT: Record<Topic, string> = {
  career: "在 IFS 里，那个最响的声音其实是「保护者」。它怕你被工作吃掉。你需要的不是听它的指令，而是好奇地问它：你保护的，是哪一个我？",
  relationship: "你不是在纠结这段关系，你在试图弄清楚一件更深的事：我可以被一个人真的看见吗？这件事比恋爱本身更重要。先回到那个被忽略的小孩身边。",
  family: "你跟父母这场拉扯里，藏着一个更年幼的你——那个曾经为了让妈妈高兴而放弃自己的孩子。他不需要你赢，只需要你看见他还在。",
  money: "钱不是钱，钱是「我配」的代名词。你纠结的不是数字，是你能不能允许自己过得好一点。这个许可，得自己给自己。",
  lifestyle: "你身体在喊的，比你以为的更重要。这不是懒，是一个被压抑很久的版本的你（IFS 里叫 exile）在用唯一会的方式抗议。听一下它。",
  general: "你不是缺答案，你缺一个允许自己不知道的瞬间。允许自己暂停，比逼自己想清楚更难，也更必要。",
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function mockChat(messages: Msg[]): string {
  const sys = messages.find(m => m.role === "system")?.content || "";
  const usr = messages.filter(m => m.role === "user").map(m => m.content).join("\n");
  const topic = classifyTopic(usr);

  // cross-examine
  if (sys.includes("cross-examine") || sys.includes("反问")) {
    const m = usr.match(/「(.+?)」刚说/) || usr.match(/(\S+?)刚说：/);
    const target = m?.[1] || "对方";
    const crosses = [
      `你不会真信${target}那套吧？那是给你不敢动找的台阶。`,
      `${target}说得真好听。可问题是，三年后他要替你扛吗？`,
      `${target}的逻辑里，最方便的就是你别动。\n谁最受益，谁就最可疑。`,
      `${target}讲得头头是道。但你心跳为什么没慢下来？`,
      `${target}描绘的版本里，有没有一个你不需要假装的瞬间？`,
    ];
    return pick(crosses);
  }

  // pickOpposingPairs JSON 调用 — 演员模式给默认 JSON
  if (sys.includes("辩论裁判") && sys.includes("最对立")) {
    return JSON.stringify({ pairs: [["lay", "money"], ["roam", "filial"]] });
  }

  // taste profile
  if (sys.includes("品味分析师") || sys.includes("identity_hint")) {
    return JSON.stringify({
      themes: ["孤独", "时间", "失而复得"],
      moods: ["慢", "雨天"],
      identity_hint: "在喧闹中找寂静的人",
    });
  }

  // episode extraction
  if (sys.includes("私人编年史") || sys.includes("事件卡")) {
    return JSON.stringify({ importance: 0.2 }); // mock 模式不写记忆
  }

  // 此刻的我
  if (sys.includes("此刻真实的自己") || sys.includes("此刻的我") || sys.includes("最终裁决")) {
    return NOW_PLAYBOOK[topic];
  }

  // psychology insight
  if (sys.includes("IFS") && sys.includes("咨询师")) {
    return MOCK_INSIGHT[topic];
  }

  // 5 个分身 — 用 IFS 关键词精确匹配
  if (sys.includes("5 年后回头看") || sys.includes("Self 远观视角")) return pick(PLAYBOOK.future[topic]);
  if (sys.includes("预防型保护者")) return pick(PLAYBOOK.lay[topic]);
  if (sys.includes("现实型保护者") || sys.includes("把所有事情都换算")) return pick(PLAYBOOK.money[topic]);
  if (sys.includes("应急保护者") || sys.includes("用换地方解救")) return pick(PLAYBOOK.roam[topic]);
  if (sys.includes("被流放的内在小孩") || sys.includes("讨妈") || sys.includes("Exile")) return pick(PLAYBOOK.filial[topic]);

  return `（演员模式）听到了你说的："${usr.slice(0, 30)}…"`;
}

// ────────────────────────────────────────────────────────────
// 给评委 agent 看的元数据
// ────────────────────────────────────────────────────────────
export function getAgentMeta() {
  return {
    name: "ParallelMe",
    name_zh: "平行的我",
    one_liner: "你不是一个人，你是好几个。你说一句，5 个你回信。",
    architecture: "GAN-inspired multi-agent: 5 IFS-grounded inner-voices + dynamic cross-examine + Self-as-decider + meta-critic",
    selves: SELVES_META,
    nowme: { id: NOWME.id, name: NOWME.name, tagline: NOWME.tagline },
  };
}
