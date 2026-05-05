// lib/llm.ts — Provider-aware helpers for the structured five-voice flow.
// Keeps model calls stateless: API routes pass a runtime payload from /setup,
// and local heuristic fallbacks only shape UI continuity after model failures.

import { SELVES, NOWME, type SelfId, SELVES_META } from "./selves";

// Env defaults for self-host / dev. Per-request override supported via
// LlmRuntime — local-first provider config for focused LLM endpoints.
const ENV_API_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ENV_API_KEY = process.env.OPENAI_API_KEY || "";
const ENV_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** Per-request runtime override. Any field omitted falls back to dev env. */
export interface LlmRuntime {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

function resolveRuntime(rt?: LlmRuntime) {
  return {
    apiKey: rt?.apiKey || ENV_API_KEY,
    baseUrl: rt?.baseUrl || ENV_API_BASE,
    model: rt?.model || ENV_MODEL,
  };
}

/** True when there is a usable API key (request override or dev env). */
function hasRealKey(rt?: LlmRuntime): boolean {
  return !!resolveRuntime(rt).apiKey;
}

export type Msg = { role: "system" | "user" | "assistant"; content: string };

// ────────────────────────────────────────────────────────────
// 话题分类（用于本地启发式兜底）
// ────────────────────────────────────────────────────────────
export type Topic = "career" | "relationship" | "family" | "money" | "lifestyle" | "general";

export function classifyTopic(text: string): Topic {
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
export async function chat(
  messages: Msg[],
  opts?: { temperature?: number; max_tokens?: number; json?: boolean; runtime?: LlmRuntime }
): Promise<string> {
  const rt = resolveRuntime(opts?.runtime);
  if (!rt.apiKey) {
    throw new Error("API Key 未配置。请先在设置页接入真实模型。");
  }
  try {
    const body: any = {
      model: rt.model,
      temperature: opts?.temperature ?? 0.85,
      max_tokens: opts?.max_tokens ?? 400,
      messages,
    };
    if (opts?.json) body.response_format = { type: "json_object" };
    const r = await fetch(`${rt.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${rt.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`模型请求失败：HTTP ${r.status} ${text.slice(0, 220)}`);
    }
    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("模型返回为空。");
    return content;
  } catch (e) {
    console.error("[llm] fetch failed", e);
    throw e;
  }
}

// ────────────────────────────────────────────────────────────
// Profile context injection interface.
// ────────────────────────────────────────────────────────────
export interface ContextBundle {
  meCard?: string;          // me.md 用户自填画像
  tasteProfile?: string;    // 书/影/乐 LLM 抽出的 14 字判词 + themes
}

function buildContextBlock(ctx?: ContextBundle): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.meCard) parts.push(`【关于这个人】\n${ctx.meCard}`);
  if (ctx.tasteProfile) parts.push(`【他喜欢的东西揭示的他】\n${ctx.tasteProfile}`);
  if (!parts.length) return "";
  return "\n\n" + parts.join("\n\n");
}

// ────────────────────────────────────────────────────────────
// 单声音调用
// ────────────────────────────────────────────────────────────
export async function callSelf(
  selfId: SelfId | "now",
  userInput: string,
  otherSays?: string,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
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
  return chat(messages, { runtime });
}

// ────────────────────────────────────────────────────────────
// Mutual clarification — 一个声音温和地问另一个
// ────────────────────────────────────────────────────────────
/** 被问到的声音回应。让互问从单向提醒变成真对话。
 *  ≤ 60 字，保持人格，不被说服转向也不无脑反驳。 */
export async function crossExamRespond(
  target: SelfId,
  challenger: SelfId,
  userInput: string,
  challengeText: string,
  runtime?: LlmRuntime,
): Promise<string> {
  const me = SELVES[target];
  const t = SELVES[challenger];
  const messages: Msg[] = [
    {
      role: "system",
      content:
        me.system_prompt +
        `\n\n# 特殊任务：回应另一个声音的提问\n「${t.name}」刚刚问了你。\n` +
        "用 ≤ 60 字诚实回应。继续保持你的人格、口头禅、禁忌词。\n" +
        "不要被说服转向，但也不要无脑反驳——把你真实的反应说出来。",
    },
    {
      role: "user",
      content: `用户的纠结：${userInput}\n\n${t.name}质问你：「${challengeText}」\n\n你的一句话回应：`,
    },
  ];
  return chat(messages, { temperature: 0.85, max_tokens: 160, runtime });
}

export async function crossExamine(
  challenger: SelfId,
  target: SelfId,
  userInput: string,
  targetSaid: string,
  runtime?: LlmRuntime,
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
  return chat(messages, { temperature: 0.95, max_tokens: 120, runtime });
}

// ────────────────────────────────────────────────────────────
// 动态 pair 选择 — 一次 LLM 打 5x5 对立矩阵
// ────────────────────────────────────────────────────────────
export async function pickOpposingPairs(
  answers: { id: SelfId; text: string }[],
  runtime?: LlmRuntime,
): Promise<[SelfId, SelfId][]> {
  // 默认配对（模型无法稳定选对时）
  const defaultPairs: [SelfId, SelfId][] = [
    ["money", "lay"],
    ["lay", "money"],
    ["roam", "filial"],
    ["filial", "roam"],
  ];
  if (!hasRealKey(runtime) || answers.length < 4) return defaultPairs;

  const block = answers.map(a => `[${a.id}] ${SELVES[a.id].name}: ${a.text.slice(0, 200)}`).join("\n\n");
  const messages: Msg[] = [
    {
      role: "system",
      content: `你是会谈整理员。下面有 5 个内在声音刚刚就同一件事各自表态。
请找出最值得互相澄清的 2 对（每对 2 个声音）。
评判标准：核心价值是否互斥、用词是否互否、立场是否冲突。
输出严格 JSON：{"pairs": [["lay","money"], ["roam","filial"]]}
只能用这 5 个 id：lay, money, roam, filial, future。
两对之间不应该有重复 id（如可能）。每对 2 个 id 必须不同。`,
    },
    { role: "user", content: block },
  ];
  try {
    const out = await chat(messages, { temperature: 0.3, max_tokens: 200, json: true, runtime });
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
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<string> {
  let attempt = await callSelf("now", userInput, otherSays, ctx, runtime);
  const violations = violatesBan(attempt);
  if (violations.length === 0) return attempt;
  // 回炉一次（meta-critic feedback）
  console.log(`[meta-critic] NowMe used banned words: ${violations.join(", ")} — regenerating`);
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
  const retry = await chat(messages, { temperature: 0.7, max_tokens: 500, runtime });
  return retry || attempt;
}

// ────────────────────────────────────────────────────────────
// 用户向某个声音追问
// ────────────────────────────────────────────────────────────
export async function followUp(
  selfId: SelfId,
  userInput: string,
  prevAnswer: string,
  question: string,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
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
  return chat(messages, { temperature: 0.85, max_tokens: 280, runtime });
}

// ────────────────────────────────────────────────────────────
// IFS 视角心理学解读
// ────────────────────────────────────────────────────────────
export async function psychInsight(
  userInput: string,
  topResponses: string[],
  loudestId: SelfId,
  runtime?: LlmRuntime,
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
  return chat(messages, { temperature: 0.7, max_tokens: 280, runtime });
}

// ────────────────────────────────────────────────────────────
// Episode 抽取（mem0 fact extraction style）
// ────────────────────────────────────────────────────────────
export async function extractEpisode(
  userInput: string,
  selfAnswers: { id: SelfId; text: string }[],
  nowMeText: string,
  loudestId: SelfId,
  runtime?: LlmRuntime,
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
  if (!hasRealKey(runtime)) return null;
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
      content: `用户纠结：${userInput}\n\n五声：\n${block}\n\n此刻的我：${nowMeText}\n\n声音最响：${SELVES[loudestId].name}`,
    },
  ];
  try {
    const out = await chat(messages, { temperature: 0.3, max_tokens: 500, json: true, runtime });
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

export async function extractTasteProfile(
  taste: TasteInput,
  runtime?: LlmRuntime,
): Promise<{
  themes: string[];
  moods: string[];
  identity_hint: string;
} | null> {
  if (!hasRealKey(runtime)) return null;
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
      { temperature: 0.7, max_tokens: 300, json: true, runtime }
    );
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// Structured helpers for the current five-voice flow.
// ────────────────────────────────────────────────────────────
export interface FocusResult {
  questions: string[];
  workingFocus: string;
}

export interface ActivatedVoiceResult {
  voiceId: string;
  name: string;
  source: "standing";
  protect: string;
  fear: string;
  activatedReason: string;
  ifsLabel?: string;
}

export interface VoiceTurnResult {
  voiceId: string;
  name: string;
  text: string;
}

export interface CrossClarificationResult {
  fromVoiceId: string;
  fromName: string;
  toVoiceId: string;
  toName: string;
  question: string;
  response?: string;
}

export interface NowMeResult {
  claritySentence: string;
  nowMe: string;
  insight: string;
  commitment24h: string;
  loudestVoiceId?: string;
  loudestVoiceName?: string;
}

const CRISIS_RE =
  /(自杀|轻生|不想活|活不下去|结束生命|杀了自己|伤害自己|自残|割腕|跳楼| overdose |suicide|kill myself|end my life|self-harm)/i;

export function detectCrisis(text: string): boolean {
  return CRISIS_RE.test(text);
}

export function crisisMessage(): string {
  return "我听见这件事可能已经很危险。ParallelMe 不能替代真人危机支持。若你可能伤害自己或他人，请立刻联系当地紧急服务；在美国可拨打或短信 988。也请尽快联系一个真实的人陪你待一会儿。";
}

export async function generateFocus(
  petition: string,
  answers: { question: string; answer: string }[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<FocusResult> {
  const answered = answers.length
    ? answers.map((a, i) => `${i + 1}. 问：${a.question}\n答：${a.answer}`).join("\n\n")
    : "（用户还没有回答追问）";
  const sys = `你是 ParallelMe 的会谈整理员。你的任务不是给建议，而是用 MI、叙事疗法和 IFS 的方式，把用户的困惑整理成一次五声会谈的工作焦点。

原则：
- 不诊断，不治疗承诺，不使用病理标签。
- 问题外化：不要说"你有问题"，而说"这份困惑/拉扯/害怕"。
- 追问要少而准，帮助用户说出事实、关系、恐惧、价值和最响的内在声音。
- 工作焦点是一句话，格式接近："我想听清楚：……"

输出严格 JSON：
{
  "questions": ["2-4 个追问，每个不超过 26 字"],
  "workingFocus": "一句工作焦点，不超过 56 字"
}`;
  const out = await chat(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content: `用户陈情：\n${petition}\n\n已回答：\n${answered}`,
      },
    ],
    { temperature: 0.55, max_tokens: 520, json: true, runtime },
  );
  try {
    const j = JSON.parse(out);
    const fallback = fallbackFocus(petition, answers);
    return {
      questions: Array.isArray(j.questions) && j.questions.length
        ? j.questions.slice(0, 4).map(String)
        : fallback.questions,
      workingFocus: typeof j.workingFocus === "string" && j.workingFocus.trim()
        ? j.workingFocus.trim()
        : fallback.workingFocus,
    };
  } catch {
    return fallbackFocus(petition, answers);
  }
}

export async function generateActivatedVoices(
  petition: string,
  workingFocus: string,
  _answers: { question: string; answer: string }[] = [],
  _runtime?: LlmRuntime,
): Promise<ActivatedVoiceResult[]> {
  return (Object.keys(SELVES) as SelfId[]).map((id) => {
    const s = SELVES[id];
    return {
      voiceId: id,
      name: s.name,
      source: "standing" as const,
      protect: s.core_value,
      fear: s.fear,
      activatedReason: activationReason(id, petition, workingFocus),
      ifsLabel: s.ifs_label,
    };
  });
}

export async function generateVoiceTurns(
  petition: string,
  workingFocus: string,
  voices: ActivatedVoiceResult[],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<VoiceTurnResult[]> {
  return Promise.all(
    voices.map(async (v) => {
      const id = v.voiceId as SelfId;
      return {
        voiceId: id,
        name: SELVES[id].name,
        text: await callSelf(
          id,
          `陈情：${petition}\n\n本次工作焦点：${workingFocus}\n\n请只回答：我想保护什么 / 我怕什么 / 我希望你别忽略什么。`,
          undefined,
          ctx,
          runtime,
        ),
      };
    }),
  );
}

export async function generateVoiceFollowup(
  voice: ActivatedVoiceResult,
  petition: string,
  workingFocus: string,
  prevAnswer: string,
  question: string,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<string> {
  if (!SELVES[voice.voiceId as SelfId]) {
    return "这次会谈只保留固定五声。请在五声里重新点名追问。";
  }
  return followUp(voice.voiceId as SelfId, workingFocus || petition, prevAnswer, question, ctx, runtime);
}

export async function generateCrossClarifications(
  petition: string,
  workingFocus: string,
  turns: VoiceTurnResult[],
  runtime?: LlmRuntime,
): Promise<CrossClarificationResult[]> {
  const standingTurns = turns.filter((t) => SELVES[t.voiceId]);
  const available = new Set(standingTurns.map((t) => t.voiceId));
  const pairs = ([
    ["money", "lay"],
    ["lay", "money"],
    ["roam", "filial"],
    ["filial", "roam"],
    ["future", "money"],
  ] as [SelfId, SelfId][]).filter(([from, to]) => available.has(from) && available.has(to));
  const out: CrossClarificationResult[] = [];
  for (const [from, to] of pairs.slice(0, 3)) {
    const targetSaid = turns.find((t) => t.voiceId === to)?.text || "";
    let question = `${SELVES[to].name}，你的保护会让什么被忽略？`;
    let response = "";
    question = await chat(
      [
        {
          role: "system",
          content:
            `你是「${SELVES[from].name}」。请向「${SELVES[to].name}」提出一个温和、准确的问题。\n` +
            "目标是帮助它看见代价、盲点或被忽略的保护意图，不攻击、不讽刺、不审判。\n" +
            "只输出问题本身，≤42 字。",
        },
        {
          role: "user",
          content:
            `陈情：${petition}\n\n工作焦点：${workingFocus}\n\n` +
            `${SELVES[to].name}刚才说：${targetSaid}`,
        },
      ],
      { temperature: 0.6, max_tokens: 120, runtime },
    );
    response = await chat(
      [
        {
          role: "system",
          content:
            SELVES[to].system_prompt +
            `\n\n# 特殊任务：回应另一个声音的澄清问题\n「${SELVES[from].name}」刚刚问了你一个问题。\n` +
            "≤70 字。承认一个代价或盲点，同时保留你的保护意图。不要反击。",
        },
        {
          role: "user",
          content: `问题：${question}\n\n本次工作焦点：${workingFocus || petition}`,
        },
      ],
      { temperature: 0.65, max_tokens: 180, runtime },
    );
    out.push({
      fromVoiceId: from,
      fromName: SELVES[from].name,
      toVoiceId: to,
      toName: SELVES[to].name,
      question,
      response,
    });
  }
  return out;
}

export async function generateNowMe(
  petition: string,
  workingFocus: string,
  voiceTurns: VoiceTurnResult[],
  followups: { voiceName: string; question: string; answer: string }[] = [],
  roleReversals: { voiceName: string; text: string }[] = [],
  crossClarifications: CrossClarificationResult[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<NowMeResult> {
  const loudest = findLoudestVoice(voiceTurns);
  const voices = voiceTurns.map((t) => `[${t.name}] ${t.text}`).join("\n\n");
  const asked = followups.length
    ? followups.map((f) => `问 ${f.voiceName}：${f.question}\n${f.answer}`).join("\n\n")
    : "（无）";
  const reversed = roleReversals.length
    ? roleReversals.map((r) => `用户坐到「${r.voiceName}」的位置说：${r.text}`).join("\n\n")
    : "（无）";
  const crosses = crossClarifications.length
    ? crossClarifications.map((c) => `${c.fromName} 问 ${c.toName}：${c.question}\n${c.toName} 回应：${c.response || "（无）"}`).join("\n\n")
    : "（无）";

  const sys = `你是 ParallelMe 中的 NowMe：Self / Healthy Adult / Aware Ego 的位置。
你不是第六个声音，不替用户做治疗，不给泛泛建议。你的任务是把五声会谈落成清明句和一个 24 小时内能做的小承诺。

规则：
- 不说"平衡/兼顾/都很重要/综合考虑/看情况"。
- 不让某个声音赢，也不压扁任何声音。
- 明确指出：我不再被哪一声单独带走。
- 24h 承诺必须是一个具体动作，不是计划，不超过 28 字。

输出严格 JSON：
{
  "claritySentence": "我现在看清楚的是……",
  "nowMe": "3-5 行，第一人称",
  "insight": "60 字内，温柔命名这次模式",
  "commitment24h": "24 小时内可执行动作"
}`;
  const out = await chat(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content:
          `陈情：${petition}\n\n工作焦点：${workingFocus}\n\n五声：\n${voices}\n\n追问：\n${asked}\n\n换位回答：\n${reversed}\n\n五声互问：\n${crosses}`,
      },
    ],
    { temperature: 0.65, max_tokens: 760, json: true, runtime },
  );
  try {
    const j = JSON.parse(out);
    const fallback = fallbackNowMe(petition, workingFocus, loudest);
    return {
      claritySentence: typeof j.claritySentence === "string" ? j.claritySentence.trim() : fallback.claritySentence,
      nowMe: typeof j.nowMe === "string" ? j.nowMe.trim() : fallback.nowMe,
      insight: typeof j.insight === "string" ? j.insight.trim() : fallback.insight,
      commitment24h: typeof j.commitment24h === "string" ? j.commitment24h.trim() : fallback.commitment24h,
      loudestVoiceId: loudest?.voiceId,
      loudestVoiceName: loudest?.name,
    };
  } catch {
    return fallbackNowMe(petition, workingFocus, loudest);
  }
}

function activationReason(id: SelfId, petition: string, workingFocus: string): string {
  const topic = classifyTopic(`${petition}\n${workingFocus}`);
  const reasons: Record<SelfId, Record<Topic, string>> = {
    lay: {
      career: "它听见了身体和精力正在被透支。",
      relationship: "它想确认这段关系有没有让你太累。",
      family: "它想让你先停下证明自己的冲动。",
      money: "它担心数字背后藏着过度消耗。",
      lifestyle: "它被睡眠、身体和低消耗需求叫醒。",
      general: "它想保护你不要在混乱里硬撑。",
    },
    money: {
      career: "它被收入、机会成本和现实风险激活。",
      relationship: "它想看清这段选择的长期代价。",
      family: "它在计算责任、资源和退路。",
      money: "它听见了现金流和安全感的警报。",
      lifestyle: "它想确认自由感是否有现实支点。",
      general: "它要求把模糊担心落到可承受成本。",
    },
    roam: {
      career: "它想知道换地方是否能救回呼吸感。",
      relationship: "它听见了想逃离重复剧本的冲动。",
      family: "它想用距离保护你的边界。",
      money: "它在寻找资源之外的出口。",
      lifestyle: "它被新的空间、早晨和可能性叫醒。",
      general: "它提醒你：还有别的出口。",
    },
    filial: {
      career: "它听见了家人的期待和你的牵挂。",
      relationship: "它在保护被爱、被认可和归属感。",
      family: "它正站在亲密关系的疼点旁边。",
      money: "它想让重要的人安心。",
      lifestyle: "它担心你的选择会让亲近的人睡不着。",
      general: "它把关系和亏欠感带回桌面。",
    },
    future: {
      career: "它把眼前的焦虑放到更长时间里看。",
      relationship: "它想问五年后你还会记得什么。",
      family: "它提醒你关系也在随时间变化。",
      money: "它关心这一步会怎样改变长期自由。",
      lifestyle: "它想保护你不被此刻吞掉。",
      general: "它负责把这次拉扯放进人生连续性。",
    },
  };
  return reasons[id][topic];
}

function fallbackFocus(petition: string, answers: { question: string; answer: string }[]): FocusResult {
  const topic = classifyTopic(petition + answers.map((a) => a.answer).join(" "));
  const questionsByTopic: Record<Topic, string[]> = {
    career: ["这件事里最让你睡不着的事实是什么？", "你最怕失去的是钱、自由，还是关系？", "现在最响的是哪一种声音？"],
    relationship: ["你真正舍不得的是什么？", "你最怕说出口哪句话？", "如果不讨好任何人，你会承认什么？"],
    family: ["你想让家人知道什么？", "你最怕伤到谁？", "哪部分你已经解释累了？"],
    money: ["这件事最硬的数字是什么？", "哪个风险你不敢看？", "你想用钱保护什么？"],
    lifestyle: ["身体最近给过你什么信号？", "你想逃离的具体场景是什么？", "你想靠近的生活是什么样？"],
    general: ["这件事最具体的场景是什么？", "你最怕哪个结果发生？", "哪个声音现在最吵？"],
  };
  const focusByTopic: Record<Topic, string> = {
    career: "我想听清楚：这一步是在保护未来，还是在牺牲自己。",
    relationship: "我想听清楚：我是在靠近爱，还是在维持一个让我缩小的关系。",
    family: "我想听清楚：怎样不把自己交出去，也不把重要的人推开。",
    money: "我想听清楚：哪些现实必须看见，哪些恐惧不该掌权。",
    lifestyle: "我想听清楚：我想逃离的是什么，又真正想靠近什么。",
    general: "我想听清楚：这份困惑背后，哪个需要一直没被好好听见。",
  };
  return { questions: questionsByTopic[topic], workingFocus: focusByTopic[topic] };
}

function findLoudestVoice(turns: VoiceTurnResult[]): VoiceTurnResult | undefined {
  if (!turns.length) return undefined;
  const score = (t: string) => {
    let s = t.length;
    s += (t.match(/[!！？?]/g) || []).length * 8;
    s += (t.match(/(必须|绝对|永远|一定|根本|真的|只是|怕|保护)/g) || []).length * 6;
    return s;
  };
  return [...turns].sort((a, b) => score(b.text) - score(a.text))[0];
}

function fallbackNowMe(
  petition: string,
  workingFocus: string,
  loudest?: VoiceTurnResult,
): NowMeResult {
  const topic = classifyTopic(`${petition}\n${workingFocus}`);
  const clarity: Record<Topic, string> = {
    career: "我现在看清楚的是：我不是只在选工作，我是在选怎样不把自己耗空。",
    relationship: "我现在看清楚的是：我不是只在判断对错，我是在确认自己能不能被好好看见。",
    family: "我现在看清楚的是：我想回应亲近的人，但不想用交出自己来证明爱。",
    money: "我现在看清楚的是：钱在保护我，但它不该替我决定全部人生。",
    lifestyle: "我现在看清楚的是：我想换的不是地点，而是重新拥有呼吸的方式。",
    general: "我现在看清楚的是：这份困惑里有一个需要，终于开始被我听见。",
  };
  const commitment: Record<Topic, string> = {
    career: "今晚列出三个不可牺牲的边界",
    relationship: "今晚写下那句不敢说的话",
    family: "今天发一条不解释的近况",
    money: "今晚列一张 12 个月现金流",
    lifestyle: "明早出门散步 20 分钟",
    general: "今晚写下明天最小一步",
  };
  return {
    claritySentence: clarity[topic],
    nowMe:
      `我听见了这些声音都在保护我，只是方式不同。\n` +
      `我不再让「${loudest?.name ?? "最响的声音"}」单独带走我。\n` +
      `此刻我选择先朝一个更诚实、更低消耗的方向走一步。`,
    insight: "这次不是谁赢了，而是你终于从单一声音里退后半步，看见了整组拉扯。",
    commitment24h: commitment[topic],
    loudestVoiceId: loudest?.voiceId,
    loudestVoiceName: loudest?.name,
  };
}

// ────────────────────────────────────────────────────────────
// 给评委 agent 看的元数据
// ────────────────────────────────────────────────────────────
export function getAgentMeta() {
  return {
    name: "ParallelMe",
    name_zh: "平行的我",
    one_liner: "结构化五声会谈，帮助用户把困惑听清楚。",
    architecture:
      "five-voice self-clarification: focus formation + activated voices + role reversal + mutual clarification + NowMe committed action",
    selves: SELVES_META,
    nowme: { id: NOWME.id, name: NOWME.name, tagline: NOWME.tagline },
  };
}
