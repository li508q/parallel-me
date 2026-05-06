// lib/llm.ts — v0.7 provider-aware orchestration.
// The product path is now: task frame -> fixed five-voice roundtable ->
// scribe inquiry -> clarity settlement. Old staged voice-flow contracts are
// not used here.

import { SELVES, type SelfId, SELVES_META } from "./selves";
import {
  VOICE_IDS,
  emptyRoundtable,
  emptyScribeTrace,
  isVoiceId,
  voiceName,
  type ChoiceAnswer,
  type ChoiceCard,
  type ClarityResult,
  type PreferenceProfile,
  type RoundtableMove,
  type RoundtableMoveType,
  type RoundtableRecord,
  type RoundtableTurn,
  type ScribeInquiryAnswer,
  type ScribeInquiryQuestion,
  type ScribeTrace,
  type SettlementPosture,
  type TaskFrame,
  type VisibleTaskFrame,
  type VoiceId,
  type VoiceOpeningPayload,
  type VoiceOpeningTurn,
} from "./v7";

// Env defaults for self-host / dev. Per-request override supported via
// LlmRuntime — local-first provider config for focused LLM endpoints.
const ENV_API_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ENV_API_KEY = process.env.OPENAI_API_KEY || "";
const ENV_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export interface LlmRuntime {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export interface ContextBundle {
  meCard?: string;
  tasteProfile?: string;
}

export type Topic =
  | "career"
  | "relationship"
  | "family"
  | "money"
  | "lifestyle"
  | "general";

export interface TaskFrameResult {
  choiceCards: ChoiceCard[];
  taskFrame: TaskFrame;
}

export interface RoundtableMoveInput {
  moveType: RoundtableMoveType;
  taskFrame: TaskFrame;
  roundtable: RoundtableRecord;
  targetVoiceId?: VoiceId;
  fromVoiceId?: VoiceId;
  toVoiceId?: VoiceId;
  userText?: string;
}

export interface RoundtableMoveResult {
  move: RoundtableMove;
  turns: RoundtableTurn[];
  scribeNote: string;
}

export interface InquiryResult {
  questions: ScribeInquiryQuestion[];
  preferenceProfile: PreferenceProfile;
}

function resolveRuntime(rt?: LlmRuntime) {
  return {
    apiKey: rt?.apiKey || ENV_API_KEY,
    baseUrl: rt?.baseUrl || ENV_API_BASE,
    model: rt?.model || ENV_MODEL,
  };
}

export function classifyTopic(text: string): Topic {
  if (/(辞职|跳槽|升职|考公|考研|加班|裸辞|副业|失业|996|班味|大厂|国企|体制|offer|工作|老板|同事|kpi|okr)/i.test(text)) return "career";
  if (/(对象|男友|女友|分手|结婚|离婚|相亲|暗恋|表白|前任|喜欢|爱|男朋友|女朋友|搭子|断联)/i.test(text)) return "relationship";
  if (/(妈|爸|爹|娘|父母|爸妈|家里|老家|亲戚|表哥|表姐|阿姨|舅舅|过年|春节|断亲|催婚)/i.test(text)) return "family";
  if (/(房|车|彩礼|工资|存款|理财|股票|基金|花钱|借钱|存钱|月光|负债|月薪|年薪|收入)/i.test(text)) return "money";
  if (/(健身|减肥|游民|清迈|大理|gap|间隔年|出走|搬|住|生活|睡眠|脱发|焦虑|抑郁|emo)/i.test(text)) return "lifestyle";
  return "general";
}

export async function chat(
  messages: Msg[],
  opts?: { temperature?: number; max_tokens?: number; json?: boolean; runtime?: LlmRuntime },
): Promise<string> {
  const rt = resolveRuntime(opts?.runtime);
  if (!rt.apiKey) {
    throw new Error("API Key 未配置。请先在设置页接入真实模型。");
  }
  const body: any = {
    model: rt.model,
    temperature: opts?.temperature ?? 0.75,
    max_tokens: opts?.max_tokens ?? 600,
    messages,
  };
  if (opts?.json) body.response_format = { type: "json_object" };
  const r = await fetch(`${rt.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
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
}

function buildContextBlock(ctx?: ContextBundle): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.meCard) parts.push(`【关于这个人】\n${ctx.meCard}`);
  if (ctx.tasteProfile) parts.push(`【他喜欢的东西揭示的他】\n${ctx.tasteProfile}`);
  return parts.length ? "\n\n" + parts.join("\n\n") : "";
}

const CRISIS_RE =
  /(自杀|轻生|不想活|活不下去|结束生命|杀了自己|伤害自己|自残|割腕|跳楼| overdose |suicide|kill myself|end my life|self-harm)/i;

export function detectCrisis(text: string): boolean {
  return CRISIS_RE.test(text);
}

export function crisisMessage(): string {
  return "我听见这件事可能已经很危险。ParallelMe 不能替代真人危机支持。若你可能伤害自己或他人，请立刻联系当地紧急服务；在美国可拨打或短信 988。也请尽快联系一个真实的人陪你待一会儿。";
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function compactTaskFrame(frame: TaskFrame): string {
  const v = frame.visible;
  return [
    `问题定义：${v.problem_definition}`,
    `当前状态：${v.current_state}`,
    `关键事实：${v.key_facts.join("；")}`,
    `主要选择：${v.main_choices.join("；")}`,
    `核心冲突：${v.core_conflict}`,
    `这件事问你的是：${v.central_question}`,
    `主要牵动点：${v.main_concerns.join("；")}`,
    `圆桌焦点：${v.discussion_focus}`,
  ].join("\n");
}

function serializeRoundtable(roundtable: RoundtableRecord): string {
  const openings = roundtable.opening_turns
    .map(
      (t) =>
        `[${t.name}] ${t.thesis} / 保护：${t.protected_value} / 担心：${t.concern} / 拉向：${t.pull}`,
    )
    .join("\n");
  const turns = roundtable.turns
    .slice(-14)
    .map((t) => {
      if (t.duel) {
        return `[对峙] ${t.duel.from_name} 问 ${t.duel.to_name}: ${t.duel.question} / ${t.duel.to_name}: ${t.duel.response}`;
      }
      if (t.voice_id) return `[${t.name}] ${t.text}`;
      return `[书记员] ${t.text}`;
    })
    .join("\n");
  return `第一轮：\n${openings || "（还没有）"}\n\n后续：\n${turns || "（还没有）"}`;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateTaskFrame(
  rawInput: string,
  choiceAnswers: ChoiceAnswer[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<TaskFrameResult> {
  const fallback = fallbackTaskFrame(rawInput, choiceAnswers);
  const answersText = choiceAnswers.length
    ? choiceAnswers
        .map(
          (a, i) =>
            `${i + 1}. ${a.question}\n选择：${a.custom_text || a.selected_label}\nKV：${JSON.stringify(a.derived_kv || {})}`,
        )
        .join("\n\n")
    : "（还没有选择卡答案）";

  const sys = `你是 ParallelMe v0.7 的书记员。你的任务是把用户原始输入整理成“本次议题”，并设计少量高密度选择卡。

产品原则：
- 书记员半显性，不是第六声。
- 不诊断，不治疗承诺，不用心理学术语吓用户。
- 用户懒，所以选项要高密度：一个选择应能更新多个 KV。
- 不做长追问，不逐字段拷问。
- 可见字段要自然、锋利、可被用户改写。

输出严格 JSON：
{
  "choiceCards": [
    {
      "id": "snake_case",
      "question": "一句高密度问题",
      "options": [
        {"id": "snake_case", "label": "用户能直接点选的自然语言", "derived_kv": {"key":"value"}}
      ]
    }
  ],
  "taskFrame": {
    "visible": {
      "problem_definition": "",
      "current_state": "",
      "key_facts": [],
      "main_choices": [],
      "core_conflict": "",
      "central_question": "",
      "main_concerns": [],
      "discussion_focus": ""
    },
    "internal": {
      "facts": [],
      "parties": [],
      "options": [],
      "state_tags": {"clarity":"low|medium|high","decision_readiness":"exploring|leaning|testing|not_ready","urgency":"low|medium|high","emotional_charge":"low|medium|high"},
      "value_axes": [],
      "pressure_sources": [],
      "concern_notes": [],
      "source_labels": {},
      "choice_answers": []
    }
  }
}

字段要求：
- choiceCards 2-4 张，每张 3-5 个选项，最后一个选项必须接近“都不准，我补一句”。
- central_question 尽量用“我能不能……”或“我是不是……”，不要复述表层选项。
- source_labels 只能用：读出 / 我猜的 / 你说的。
- evidence_status 只能用：raw_explicit / user_selected / user_confirmed / user_edited / model_inferred / not_clear。`;

  try {
    const raw = await chat(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        { role: "user", content: `原始输入：\n${rawInput}\n\n选择卡答案：\n${answersText}` },
      ],
      { temperature: 0.45, max_tokens: 1800, json: true, runtime },
    );
    const parsed = parseJson<any>(raw, fallback);
    return normalizeTaskFrameResult(parsed, rawInput, choiceAnswers, fallback);
  } catch (e) {
    console.warn("[generateTaskFrame] fallback", e);
    return fallback;
  }
}

export async function generateOpeningTurns(
  taskFrame: TaskFrame,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<VoiceOpeningTurn[]> {
  const fallback = fallbackOpeningTurns(taskFrame);
  const voiceBrief = VOICE_IDS.map((vid) => {
    const s = SELVES[vid];
    return `[${vid}] ${s.name}
守护：${s.soul?.protects || s.core_value}
注意：${s.soul?.clarityRole || s.core_belief}
风险：${s.soul?.cost || s.fear}`;
  }).join("\n\n");

  const sys = `你是 ParallelMe v0.7 的圆桌编排器。请让固定五声围绕“本次议题”发表第一轮结构化立论。

规则：
- 只使用固定五声：lay, money, roam, filial, future。
- 不新增角色，不说入席，不说声浪。
- 每个声音都要保护某个正向价值，没有反派。
- 第一轮必须结构化、短、可比较，但仍保留人格。
- 不使用心理学术语给用户贴标签。

输出严格 JSON：
{
  "turns": [
    {
      "voice_id": "lay",
      "thesis": "≤36字",
      "protected_value": "≤24字",
      "concern": "≤32字",
      "task_evidence": "≤36字",
      "pull": "≤32字",
      "overreach_cost": "≤36字"
    }
  ]
}`;

  try {
    const raw = await chat(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content: `本次议题：\n${compactTaskFrame(taskFrame)}\n\n五声人格：\n${voiceBrief}`,
        },
      ],
      { temperature: 0.65, max_tokens: 1800, json: true, runtime },
    );
    const parsed = parseJson<any>(raw, { turns: [] });
    const turns = Array.isArray(parsed.turns) ? parsed.turns : [];
    const now = Date.now();
    const normalized = VOICE_IDS.map((vid, i) => {
      const source = turns.find((t: any) => t.voice_id === vid) || fallback[i];
      return normalizeOpeningTurn(vid, source, now + i);
    });
    return normalized;
  } catch (e) {
    console.warn("[generateOpeningTurns] fallback", e);
    return fallback;
  }
}

export async function generateRoundtableMove(
  input: RoundtableMoveInput,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<RoundtableMoveResult> {
  const fallback = fallbackRoundtableMove(input);
  const sys = `你是 ParallelMe v0.7 的圆桌编排器。根据用户动作，生成下一段圆桌内容。

规则：
- 固定五声，不新增角色。
- 自由圆桌阶段可以自然对话，不再套第一轮六项结构。
- 任何声音都不能变成助手，也不能说“大家都有道理”来糊弄。
- 对峙目标是看见代价和盲点，不攻击、不讽刺、不审判。
- 书记员只做整理和记录，不站队。

输出严格 JSON。根据 moveType：
- continue_all / user_to_table：{"turns":[{"voice_id":"lay","text":"短段回应","refers_to":["money"]}],"scribeNote":"一句书记员侧记"}
- continue_one / user_to_voice：{"turns":[{"voice_id":"money","text":"短段回应","refers_to":["future"]}],"scribeNote":"一句书记员侧记"}
- duel：{"duel":{"question":"","response":"","unresolved_point":""},"scribeNote":"一句书记员侧记"}
- scribe_summary：{"summary":"书记员整理，不超过120字","scribeNote":"一句书记员侧记"}`;

  const moveDesc = {
    moveType: input.moveType,
    targetVoiceId: input.targetVoiceId,
    fromVoiceId: input.fromVoiceId,
    toVoiceId: input.toVoiceId,
    userText: input.userText,
  };

  try {
    const raw = await chat(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactTaskFrame(input.taskFrame)}\n\n` +
            `圆桌记录：\n${serializeRoundtable(input.roundtable)}\n\n` +
            `用户动作：\n${JSON.stringify(moveDesc, null, 2)}`,
        },
      ],
      { temperature: 0.7, max_tokens: 1600, json: true, runtime },
    );
    return normalizeRoundtableMoveResult(parseJson<any>(raw, {}), input, fallback);
  } catch (e) {
    console.warn("[generateRoundtableMove] fallback", e);
    return fallback;
  }
}

export async function generateScribeInquiry(
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  scribeTrace: ScribeTrace,
  inquiryAnswers: ScribeInquiryAnswer[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<InquiryResult> {
  const fallback = fallbackInquiry(taskFrame, roundtable, inquiryAnswers);
  const sys = `你是 ParallelMe v0.7 的书记员。自由圆桌结束后，你要通过少量高密度选择题验证用户在五声之间的偏好。

任务：
- 问题不是追问背景，而是验证圆桌里已经出现的偏好。
- 问题以选择题为主，每题最后保留“都不准，我自己说”。
- 不打分，不排名，不判断哪个声音更大。
- preferenceProfile 只写自然语言观察和已验证倾向。
- 未被用户回答验证的内容只能放入 hypotheses。

输出严格 JSON：
{
  "questions": [
    {"id":"snake_case","question":"","options":[{"id":"snake_case","label":"","meaning":""}]}
  ],
  "preferenceProfile": {
    "hypotheses": [],
    "validated_leanings": [],
    "resisted_positions": [],
    "requested_perspectives": [],
    "conflict_judgments": [],
    "accepted_tradeoffs": [],
    "refused_tradeoffs": [],
    "unresolved_tensions": [],
    "user_self_statements": []
  }
}`;

  try {
    const raw = await chat(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactTaskFrame(taskFrame)}\n\n` +
            `圆桌记录：\n${serializeRoundtable(roundtable)}\n\n` +
            `书记员动作痕迹：\n${JSON.stringify(scribeTrace, null, 2)}\n\n` +
            `用户已回答：\n${JSON.stringify(inquiryAnswers, null, 2)}`,
        },
      ],
      { temperature: 0.45, max_tokens: 1800, json: true, runtime },
    );
    const parsed = parseJson<any>(raw, fallback);
    return normalizeInquiry(parsed, fallback);
  } catch (e) {
    console.warn("[generateScribeInquiry] fallback", e);
    return fallback;
  }
}

export async function generateClaritySettlement(
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  scribeTrace: ScribeTrace,
  inquiryAnswers: ScribeInquiryAnswer[],
  preferenceProfile: PreferenceProfile,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<ClarityResult> {
  const fallback = fallbackClarity(taskFrame, preferenceProfile);
  const sys = `你是 ParallelMe v0.7 的书记员。请基于本次议题、五声圆桌、用户动作和问询答案，整理“清明落定”。

必须输出：
- clarity_sentence：一句用户愿意承认的真实判断。
- preference_readout：说明用户更靠近哪些价值、仍在哪些价值之间摇摆；不用分数、不排名、不说声浪。
- tradeoff_acknowledgement：承认一个选择代价。
- settlement_posture：只能是 leaning / not_ready / testing / boundary / grieving。
- commitment24h：24 小时内能做的最小动作，动词开头，不替用户做重大决定。

规则：
- 清明句不是模型总结，要像从用户刚才的选择里长出来。
- 不诊断，不做治疗承诺。
- 不引入独立的收束角色或第六声。
- 如果用户只是看清卡点，也可以给 not_ready，并给澄清动作。

输出严格 JSON：
{
  "clarity_sentence": "",
  "preference_readout": "",
  "tradeoff_acknowledgement": "",
  "settlement_posture": "leaning",
  "commitment24h": ""
}`;

  try {
    const raw = await chat(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactTaskFrame(taskFrame)}\n\n` +
            `圆桌记录：\n${serializeRoundtable(roundtable)}\n\n` +
            `书记员动作痕迹：\n${JSON.stringify(scribeTrace, null, 2)}\n\n` +
            `问询答案：\n${JSON.stringify(inquiryAnswers, null, 2)}\n\n` +
            `偏好刻画：\n${JSON.stringify(preferenceProfile, null, 2)}`,
        },
      ],
      { temperature: 0.55, max_tokens: 1300, json: true, runtime },
    );
    return normalizeClarity(parseJson<any>(raw, fallback), fallback);
  } catch (e) {
    console.warn("[generateClaritySettlement] fallback", e);
    return fallback;
  }
}

export interface TasteInput {
  books: { title: string; why?: string }[];
  films: { title: string; why?: string }[];
  music: { title: string; why?: string }[];
}

export async function extractTasteProfile(
  taste: TasteInput,
  runtime?: LlmRuntime,
): Promise<{ themes: string[]; moods: string[]; identity_hint: string } | null> {
  const sys = `你是品味分析师。用户给了你他喜欢的几本书、几部电影、几首歌。
从中抽取：
- themes（3-5 个共同主题词，2 字一个）
- moods（2-3 个氛围词）
- identity_hint：14 字内的人格判词，第三人称，诗意但不空泛。

只输出 JSON：{"themes":[],"moods":[],"identity_hint":""}`;
  const txt =
    "书：\n" + taste.books.map((b) => `${b.title}${b.why ? "（" + b.why + "）" : ""}`).join("、") +
    "\n影：\n" + taste.films.map((f) => `${f.title}${f.why ? "（" + f.why + "）" : ""}`).join("、") +
    "\n乐：\n" + taste.music.map((m) => `${m.title}${m.why ? "（" + m.why + "）" : ""}`).join("、");
  try {
    const out = await chat(
      [{ role: "system", content: sys }, { role: "user", content: txt }],
      { temperature: 0.7, max_tokens: 300, json: true, runtime },
    );
    return parseJson(out, null);
  } catch {
    return null;
  }
}

function normalizeTaskFrameResult(
  parsed: any,
  rawInput: string,
  choiceAnswers: ChoiceAnswer[],
  fallback: TaskFrameResult,
): TaskFrameResult {
  const cards = normalizeChoiceCards(parsed.choiceCards || parsed.choice_cards, fallback.choiceCards);
  const tf = parsed.taskFrame || parsed.task_frame || parsed;
  const visible = normalizeVisibleTaskFrame(tf?.visible, fallback.taskFrame.visible);
  const sourceLabels = tf?.internal?.source_labels || fallback.taskFrame.internal.source_labels;
  return {
    choiceCards: cards,
    taskFrame: {
      visible,
      internal: {
        facts: Array.isArray(tf?.internal?.facts)
          ? tf.internal.facts
          : [{ key: "raw_input", value: rawInput.slice(0, 180), evidence_status: "raw_explicit", source: "raw_input" }],
        parties: Array.isArray(tf?.internal?.parties) ? tf.internal.parties : fallback.taskFrame.internal.parties,
        options: Array.isArray(tf?.internal?.options) ? tf.internal.options : fallback.taskFrame.internal.options,
        state_tags: {
          clarity: safeEnum(tf?.internal?.state_tags?.clarity, ["low", "medium", "high"], fallback.taskFrame.internal.state_tags.clarity),
          decision_readiness: safeEnum(
            tf?.internal?.state_tags?.decision_readiness,
            ["exploring", "leaning", "testing", "not_ready"],
            fallback.taskFrame.internal.state_tags.decision_readiness,
          ),
          urgency: safeEnum(tf?.internal?.state_tags?.urgency, ["low", "medium", "high"], fallback.taskFrame.internal.state_tags.urgency),
          emotional_charge: safeEnum(
            tf?.internal?.state_tags?.emotional_charge,
            ["low", "medium", "high"],
            fallback.taskFrame.internal.state_tags.emotional_charge,
          ),
        },
        value_axes: Array.isArray(tf?.internal?.value_axes) ? tf.internal.value_axes : fallback.taskFrame.internal.value_axes,
        pressure_sources: Array.isArray(tf?.internal?.pressure_sources)
          ? tf.internal.pressure_sources
          : fallback.taskFrame.internal.pressure_sources,
        concern_notes: Array.isArray(tf?.internal?.concern_notes) ? tf.internal.concern_notes : fallback.taskFrame.internal.concern_notes,
        source_labels: sourceLabels,
        choice_answers: choiceAnswers,
      },
    },
  };
}

function normalizeChoiceCards(input: any, fallback: ChoiceCard[]): ChoiceCard[] {
  const cards = Array.isArray(input) ? input : [];
  const normalized = cards
    .slice(0, 4)
    .map((card: any, i: number) => {
      const options = Array.isArray(card.options) ? card.options : [];
      const normalizedOptions = options
        .slice(0, 5)
        .map((o: any, j: number) => ({
          id: String(o.id || `option_${j + 1}`),
          label: String(o.label || o.text || "").trim(),
          derived_kv: typeof o.derived_kv === "object" && o.derived_kv ? o.derived_kv : undefined,
        }))
        .filter((o: ChoiceCard["options"][number]) => o.label);
      const hasCustom = normalizedOptions.some((o) => /不准|自己|补/.test(o.label));
      if (!hasCustom) normalizedOptions.push({ id: "custom", label: "都不准，我补一句", derived_kv: { user_precision: "custom" } });
      return {
        id: String(card.id || `card_${i + 1}`),
        question: String(card.question || "").trim(),
        options: normalizedOptions,
      };
    })
    .filter((c: ChoiceCard) => c.question && c.options.length >= 2);
  return normalized.length ? normalized : fallback;
}

function normalizeVisibleTaskFrame(input: any, fallback: VisibleTaskFrame): VisibleTaskFrame {
  return {
    problem_definition: stringOr(input?.problem_definition, fallback.problem_definition),
    current_state: stringOr(input?.current_state, fallback.current_state),
    key_facts: stringArrayOr(input?.key_facts, fallback.key_facts),
    main_choices: stringArrayOr(input?.main_choices, fallback.main_choices),
    core_conflict: stringOr(input?.core_conflict, fallback.core_conflict),
    central_question: stringOr(input?.central_question, fallback.central_question),
    main_concerns: stringArrayOr(input?.main_concerns, fallback.main_concerns),
    discussion_focus: stringOr(input?.discussion_focus, fallback.discussion_focus),
  };
}

function normalizeOpeningTurn(vid: VoiceId, source: any, at: number): VoiceOpeningTurn {
  const fallback = fallbackOpeningPayload(vid);
  return {
    id: id("open"),
    voice_id: vid,
    name: voiceName(vid),
    thesis: stringOr(source?.thesis, fallback.thesis),
    protected_value: stringOr(source?.protected_value, fallback.protected_value),
    concern: stringOr(source?.concern, fallback.concern),
    task_evidence: stringOr(source?.task_evidence, fallback.task_evidence),
    pull: stringOr(source?.pull, fallback.pull),
    overreach_cost: stringOr(source?.overreach_cost, fallback.overreach_cost),
    at,
  };
}

function normalizeRoundtableMoveResult(
  parsed: any,
  input: RoundtableMoveInput,
  fallback: RoundtableMoveResult,
): RoundtableMoveResult {
  const at = Date.now();
  const move: RoundtableMove = {
    id: id("move"),
    type: input.moveType,
    target_voice_id: input.targetVoiceId,
    from_voice_id: input.fromVoiceId,
    to_voice_id: input.toVoiceId,
    user_text: input.userText,
    scribe_note: stringOr(parsed.scribeNote || parsed.scribe_note, fallback.scribeNote),
    at,
  };

  if (input.moveType === "duel" && input.fromVoiceId && input.toVoiceId) {
    const duel = parsed.duel || {};
    return {
      move,
      scribeNote: move.scribe_note || fallback.scribeNote,
      turns: [
        {
          id: id("turn"),
          trigger: "duel",
          duel: {
            from_voice_id: input.fromVoiceId,
            from_name: voiceName(input.fromVoiceId),
            to_voice_id: input.toVoiceId,
            to_name: voiceName(input.toVoiceId),
            question: stringOr(duel.question, fallback.turns[0]?.duel?.question || ""),
            response: stringOr(duel.response, fallback.turns[0]?.duel?.response || ""),
            unresolved_point: stringOr(duel.unresolved_point, fallback.turns[0]?.duel?.unresolved_point || ""),
          },
          at,
        },
      ],
    };
  }

  if (input.moveType === "scribe_summary") {
    const text = stringOr(parsed.summary, fallback.turns[0]?.text || "");
    return {
      move,
      scribeNote: move.scribe_note || fallback.scribeNote,
      turns: [{ id: id("turn"), trigger: "scribe_summary", text, at }],
    };
  }

  const rawTurns = Array.isArray(parsed.turns) ? parsed.turns : [];
  const turns = rawTurns
    .map((t: any) => {
      const vid = String(t.voice_id || "");
      if (!isVoiceId(vid) || !String(t.text || "").trim()) return null;
      return {
        id: id("turn"),
        trigger: input.moveType === "end_free_roundtable" ? "scribe_summary" : input.moveType,
        voice_id: vid,
        name: voiceName(vid),
        text: String(t.text).trim(),
        user_text: input.userText,
        refers_to: Array.isArray(t.refers_to) ? t.refers_to.filter(isVoiceId) : undefined,
        at,
      } as RoundtableTurn;
    })
    .filter(Boolean) as RoundtableTurn[];

  return {
    move,
    scribeNote: move.scribe_note || fallback.scribeNote,
    turns: turns.length ? turns : fallback.turns,
  };
}

function normalizeInquiry(parsed: any, fallback: InquiryResult): InquiryResult {
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .slice(0, 4)
        .map((q: any, i: number) => ({
          id: String(q.id || `inquiry_${i + 1}`),
          question: String(q.question || "").trim(),
          options: (Array.isArray(q.options) ? q.options : [])
            .slice(0, 5)
            .map((o: any, j: number) => ({
              id: String(o.id || `option_${j + 1}`),
              label: String(o.label || "").trim(),
              meaning: o.meaning ? String(o.meaning) : undefined,
            }))
            .filter((o: any) => o.label),
        }))
        .filter((q: ScribeInquiryQuestion) => q.question && q.options.length >= 2)
    : [];
  const normalizedQuestions = questions.length ? questions : fallback.questions;
  for (const q of normalizedQuestions) {
    if (!q.options.some((o) => /不准|自己|补/.test(o.label))) {
      q.options.push({ id: "custom", label: "都不准，我自己说" });
    }
  }
  return {
    questions: normalizedQuestions,
    preferenceProfile: normalizePreferenceProfile(parsed.preferenceProfile || parsed.preference_profile, fallback.preferenceProfile),
  };
}

function normalizePreferenceProfile(input: any, fallback: PreferenceProfile): PreferenceProfile {
  return {
    hypotheses: stringArrayOr(input?.hypotheses, fallback.hypotheses),
    validated_leanings: stringArrayOr(input?.validated_leanings, fallback.validated_leanings),
    resisted_positions: stringArrayOr(input?.resisted_positions, fallback.resisted_positions),
    requested_perspectives: stringArrayOr(input?.requested_perspectives, fallback.requested_perspectives),
    conflict_judgments: stringArrayOr(input?.conflict_judgments, fallback.conflict_judgments),
    accepted_tradeoffs: stringArrayOr(input?.accepted_tradeoffs, fallback.accepted_tradeoffs),
    refused_tradeoffs: stringArrayOr(input?.refused_tradeoffs, fallback.refused_tradeoffs),
    unresolved_tensions: stringArrayOr(input?.unresolved_tensions, fallback.unresolved_tensions),
    user_self_statements: stringArrayOr(input?.user_self_statements, fallback.user_self_statements),
  };
}

function normalizeClarity(input: any, fallback: ClarityResult): ClarityResult {
  return {
    clarity_sentence: stringOr(input?.clarity_sentence, fallback.clarity_sentence),
    preference_readout: stringOr(input?.preference_readout, fallback.preference_readout),
    tradeoff_acknowledgement: stringOr(input?.tradeoff_acknowledgement, fallback.tradeoff_acknowledgement),
    settlement_posture: safeEnum(
      input?.settlement_posture,
      ["leaning", "not_ready", "testing", "boundary", "grieving"],
      fallback.settlement_posture,
    ) as SettlementPosture,
    commitment24h: stringOr(input?.commitment24h, fallback.commitment24h),
    user_revision: typeof input?.user_revision === "string" ? input.user_revision : undefined,
  };
}

function fallbackTaskFrame(rawInput: string, choiceAnswers: ChoiceAnswer[]): TaskFrameResult {
  const topic = classifyTopic(rawInput + " " + choiceAnswers.map((a) => a.custom_text || a.selected_label).join(" "));
  const presets: Record<Topic, { conflict: string; question: string; focus: string; concerns: string[] }> = {
    career: {
      conflict: "现实路径、收入安全与自我消耗之间的拉扯。",
      question: "我能不能不靠硬撑来证明自己选得对。",
      focus: "这场圆桌先讨论：这一步到底在保护未来，还是在透支现在。",
      concerns: ["收入与退路", "身体消耗", "长期方向", "他人期待"],
    },
    relationship: {
      conflict: "亲密、承诺、自主和真实感之间的拉扯。",
      question: "我是不是在用拖延保护一句还没说出口的真话。",
      focus: "这场圆桌先讨论：我想靠近什么，又在怕什么被固定下来。",
      concerns: ["承诺压力", "真实表达", "关系代价", "未来生活"],
    },
    family: {
      conflict: "亲近关系的安心与自己的边界之间的拉扯。",
      question: "我能不能回应他们，同时不把决定权交出去。",
      focus: "这场圆桌先讨论：哪些是责任，哪些只是亏欠感在替我说话。",
      concerns: ["家人期待", "自己的边界", "解释疲惫", "选择后果"],
    },
    money: {
      conflict: "现金流、自由感、风险承受和安全感之间的拉扯。",
      question: "我是不是在让钱替我回答一个更大的问题。",
      focus: "这场圆桌先讨论：现实底盘要守到哪里，才不压扁别的价值。",
      concerns: ["收入波动", "机会成本", "退路", "安全感"],
    },
    lifestyle: {
      conflict: "恢复、出走、责任和长期连续性之间的拉扯。",
      question: "我想逃离的是一个地点，还是一种把我耗空的生活方式。",
      focus: "这场圆桌先讨论：我真正想换掉的是什么。",
      concerns: ["身体信号", "生活半径", "自由感", "现实约束"],
    },
    general: {
      conflict: "几个重要价值同时拉住你，但还没有被摊开。",
      question: "我能不能先看清自己在保护什么，而不是急着给答案。",
      focus: "这场圆桌先讨论：这份困惑背后，哪个需要一直没被好好听见。",
      concerns: ["真实需要", "现实限制", "关系牵动", "下一步代价"],
    },
  };
  const p = presets[topic];
  const choiceText = choiceAnswers.map((a) => a.custom_text || a.selected_label).filter(Boolean);
  const visible: VisibleTaskFrame = {
    problem_definition: `你现在卡住的不是单一选择，而是：${p.conflict}`,
    current_state: "你还不需要立刻做最终决定，更像是在确认自己真正抗拒什么、在乎什么。",
    key_facts: [rawInput.slice(0, 140), ...choiceText.slice(0, 2)].filter(Boolean),
    main_choices: ["继续沿当前路径走", "调整方向或关系位置", "暂时不定论，先把卡点说清楚"],
    core_conflict: p.conflict,
    central_question: p.question,
    main_concerns: p.concerns,
    discussion_focus: p.focus,
  };
  return {
    choiceCards: fallbackChoiceCards(topic),
    taskFrame: {
      visible,
      internal: {
        facts: [{ key: "raw_input", value: rawInput.slice(0, 180), evidence_status: "raw_explicit", source: "raw_input" }],
        parties: [],
        options: visible.main_choices.map((label, i) => ({ key: `option_${i + 1}`, label, evidence_status: "model_inferred" })),
        state_tags: { clarity: "medium", decision_readiness: "exploring", urgency: "medium", emotional_charge: "medium" },
        value_axes: [{ key: "main_conflict", side_a: p.concerns[0], side_b: p.concerns[1] || "另一个重要价值", evidence_status: "model_inferred" }],
        pressure_sources: [],
        concern_notes: p.concerns.map((text, i) => ({ key: `concern_${i + 1}`, text, evidence_status: "model_inferred" })),
        source_labels: {
          problem_definition: "我猜的",
          current_state: "我猜的",
          key_facts: "读出",
          main_choices: "我猜的",
          core_conflict: "我猜的",
          central_question: "我猜的",
          main_concerns: "我猜的",
          discussion_focus: "我猜的",
        },
        choice_answers: choiceAnswers,
      },
    },
  };
}

function fallbackChoiceCards(topic: Topic): ChoiceCard[] {
  const common: ChoiceCard[] = [
    {
      id: "stuck_point",
      question: "这件事里，最让你卡住的是哪一层？",
      options: [
        { id: "reality", label: "现实代价太硬，我不敢轻易动", derived_kv: { pressure_type: "reality_cost" } },
        { id: "relationship", label: "关系会被牵动，我怕伤到人", derived_kv: { pressure_type: "relationship" } },
        { id: "self_betrayal", label: "我怕选了以后不像自己", derived_kv: { pressure_type: "self_betrayal" } },
        { id: "custom", label: "都不准，我补一句", derived_kv: { user_precision: "custom" } },
      ],
    },
    {
      id: "desired_protection",
      question: "如果先只保护一个东西，你最想先保护什么？",
      options: [
        { id: "energy", label: "先保护精力和身体，不继续硬撑", derived_kv: { primary_value: "energy" } },
        { id: "choice", label: "先保护选择权和现实退路", derived_kv: { primary_value: "choice" } },
        { id: "relationship", label: "先保护重要关系不被撕裂", derived_kv: { primary_value: "relationship" } },
        { id: "custom", label: "都不准，我补一句", derived_kv: { user_precision: "custom" } },
      ],
    },
  ];
  if (topic === "family") {
    common.push({
      id: "family_meaning",
      question: "家人或亲近的人在这里更像什么？",
      options: [
        { id: "support", label: "他们在担心我，只是表达让我有压力", derived_kv: { family_meaning: "support_with_pressure" } },
        { id: "decision_pressure", label: "他们的期待正在替我做决定", derived_kv: { family_meaning: "decision_pressure" } },
        { id: "love_and_debt", label: "我分不清爱、责任和亏欠", derived_kv: { family_meaning: "love_debt_mix" } },
        { id: "custom", label: "都不准，我补一句", derived_kv: { user_precision: "custom" } },
      ],
    });
  }
  return common;
}

function fallbackOpeningTurns(taskFrame: TaskFrame): VoiceOpeningTurn[] {
  const now = Date.now();
  return VOICE_IDS.map((vid, i) => normalizeOpeningTurn(vid, fallbackOpeningPayload(vid, taskFrame), now + i));
}

function fallbackOpeningPayload(vid: VoiceId, taskFrame?: TaskFrame): VoiceOpeningPayload {
  const focus = taskFrame?.visible.discussion_focus || "这件事先别急着下结论。";
  const map: Record<VoiceId, VoiceOpeningPayload> = {
    lay: {
      thesis: "先别把自己继续往前推。",
      protected_value: "低消耗和身体余量",
      concern: "你可能已经太累，判断会被耗竭带偏。",
      task_evidence: focus.slice(0, 34),
      pull: "先停一停，恢复一点再判断",
      overreach_cost: "只听我，可能把暂停变成逃避。",
    },
    money: {
      thesis: "先把现实底盘算清楚。",
      protected_value: "现金流、退路和选择权",
      concern: "你可能低估了代价和风险。",
      task_evidence: focus.slice(0, 34),
      pull: "先看数字，再谈自由",
      overreach_cost: "只听我，会把人活成表格。",
    },
    roam: {
      thesis: "别把惯性误认成命运。",
      protected_value: "自由、出口和生命力",
      concern: "你可能正在被旧轨道压到没气。",
      task_evidence: focus.slice(0, 34),
      pull: "先给自己留一个出口",
      overreach_cost: "只听我，可能把离开当万能药。",
    },
    filial: {
      thesis: "关系也在这件事里。",
      protected_value: "牵挂、责任和归属",
      concern: "你可能假装重要的人不重要。",
      task_evidence: focus.slice(0, 34),
      pull: "把会被牵动的人也放进图里",
      overreach_cost: "只听我，会替所有人负责。",
    },
    future: {
      thesis: "把今天放进五年里看。",
      protected_value: "长期连续性和未来回看",
      concern: "你可能让此刻情绪替你掌舵。",
      task_evidence: focus.slice(0, 34),
      pull: "选一条五年后仍认得的路",
      overreach_cost: "只听我，会忽略当下疼痛。",
    },
  };
  return map[vid];
}

function fallbackRoundtableMove(input: RoundtableMoveInput): RoundtableMoveResult {
  const at = Date.now();
  const move: RoundtableMove = {
    id: id("move"),
    type: input.moveType,
    target_voice_id: input.targetVoiceId,
    from_voice_id: input.fromVoiceId,
    to_voice_id: input.toVoiceId,
    user_text: input.userText,
    scribe_note: "书记员先把这个动作记下：它透露了你想继续听哪一种价值。",
    at,
  };

  if (input.moveType === "duel" && input.fromVoiceId && input.toVoiceId) {
    return {
      move,
      scribeNote: "这组对峙点亮了一条主要冲突。",
      turns: [
        {
          id: id("turn"),
          trigger: "duel",
          duel: {
            from_voice_id: input.fromVoiceId,
            from_name: voiceName(input.fromVoiceId),
            to_voice_id: input.toVoiceId,
            to_name: voiceName(input.toVoiceId),
            question: `${voiceName(input.toVoiceId)}，如果只听你，什么代价会被你轻轻放过去？`,
            response: `我承认有代价，但我守的是${SELVES[input.toVoiceId].core_value}。`,
            unresolved_point: "保护一个价值时，另一个价值会被暂时放到后面。",
          },
          at,
        },
      ],
    };
  }

  if (input.moveType === "scribe_summary") {
    return {
      move,
      scribeNote: "书记员把当前圆桌压缩成一段可继续使用的记录。",
      turns: [
        {
          id: id("turn"),
          trigger: "scribe_summary",
          text: "目前圆桌里浮出的不是单一答案，而是几个保护方向：现实退路、关系牵动、身体余量、自由出口和长期回看。你正在确认哪一个此刻更不能被牺牲。",
          at,
        },
      ],
    };
  }

  const voices =
    input.moveType === "continue_all" || input.moveType === "user_to_table"
      ? VOICE_IDS
      : input.targetVoiceId
        ? [input.targetVoiceId]
        : ["future" as VoiceId];
  const trigger: RoundtableTurn["trigger"] =
    input.moveType === "end_free_roundtable" ? "scribe_summary" : input.moveType;
  return {
    move,
    scribeNote: "书记员记录到：你选择让这些声音继续参与判断。",
    turns: voices.map((vid) => ({
      id: id("turn"),
      trigger,
      voice_id: vid,
      name: voiceName(vid),
      text: fallbackContinuationText(vid, input),
      user_text: input.userText,
      at,
    })),
  };
}

function fallbackContinuationText(vid: VoiceId, input: RoundtableMoveInput): string {
  const prefix = input.userText ? `听见你说“${input.userText.slice(0, 30)}”，` : "";
  const map: Record<VoiceId, string> = {
    lay: `${prefix}我还是想问：你有没有把累当成不够努力？先让身体回来，判断才会准。`,
    money: `${prefix}我需要你把代价摊开。不是为了吓自己，是为了别用模糊恐惧替代真实数字。`,
    roam: `${prefix}我在意的是出口。如果现在这条路让你越来越不像活着，就要承认出口的价值。`,
    filial: `${prefix}我不想让关系替你决定，但也别把牵挂当噪音。有人会被这一步牵动。`,
    future: `${prefix}我会把这件事放远一点：五年后你更怕后悔没走，还是后悔没照顾好自己？`,
  };
  return map[vid];
}

function fallbackInquiry(
  taskFrame: TaskFrame,
  roundtable: RoundtableRecord,
  answers: ScribeInquiryAnswer[],
): InquiryResult {
  const askedVoices = roundtable.moves.map((m) => m.target_voice_id).filter(Boolean).map(String);
  const profile: PreferenceProfile = {
    hypotheses: ["你似乎不是在找唯一正确答案，而是在确认哪个代价此刻更能承认。"],
    validated_leanings: answers.map((a) => a.custom_text || a.selected_label).filter(Boolean),
    resisted_positions: [],
    requested_perspectives: askedVoices.map((v) => `你主动要求继续听见「${voiceName(v as VoiceId)}」。`),
    conflict_judgments: roundtable.moves
      .filter((m) => m.type === "duel" && m.from_voice_id && m.to_voice_id)
      .map((m) => `你选择让「${voiceName(m.from_voice_id!)}」向「${voiceName(m.to_voice_id!)}」发问。`),
    accepted_tradeoffs: [],
    refused_tradeoffs: [],
    unresolved_tensions: [taskFrame.visible.core_conflict],
    user_self_statements: answers.map((a) => a.custom_text).filter(Boolean) as string[],
  };
  return {
    questions: [
      {
        id: "value_first",
        question: "听完这一轮，你此刻更想先保护哪一边？",
        options: [
          { id: "reality", label: "先保护现实退路和可承受成本" },
          { id: "autonomy", label: "先保护自主感和呼吸感" },
          { id: "relationship", label: "先保护重要关系不被撕裂" },
          { id: "custom", label: "都不准，我自己说" },
        ],
      },
      {
        id: "tradeoff",
        question: "如果只能先承认一个代价，哪一句更接近？",
        options: [
          { id: "others_worry", label: "我可能要接受别人继续担心一段时间" },
          { id: "money_risk", label: "我可能要接受现实收益没有立刻最大化" },
          { id: "delay_decision", label: "我可能要接受现在还不能立刻决定" },
          { id: "custom", label: "都不准，我自己说" },
        ],
      },
    ],
    preferenceProfile: profile,
  };
}

function fallbackClarity(taskFrame: TaskFrame, preferenceProfile: PreferenceProfile): ClarityResult {
  const posture: SettlementPosture = preferenceProfile.validated_leanings.length ? "leaning" : "testing";
  return {
    clarity_sentence: `我现在看清楚的是：${taskFrame.visible.central_question}`,
    preference_readout:
      preferenceProfile.validated_leanings[0] ||
      "你更需要先把几个价值分开放在桌上，而不是立刻让其中一个替你决定。",
    tradeoff_acknowledgement:
      preferenceProfile.accepted_tradeoffs[0] ||
      "如果我先保护一个价值，就要承认另一个价值会暂时得不到完整安抚。",
    settlement_posture: posture,
    commitment24h:
      posture === "testing"
        ? "写下一个 24 小时内可验证的小事实"
        : "写下此刻最不能牺牲的一件事",
  };
}

function stringOr(value: any, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  return s || fallback;
}

function stringArrayOr(value: any, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const arr = value.map((x) => String(x || "").trim()).filter(Boolean);
  return arr.length ? arr : fallback;
}

function safeEnum<T extends string>(value: any, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value) ? value : fallback;
}

export function getAgentMeta() {
  return {
    name: "ParallelMe",
    name_zh: "平行的我",
    one_liner: "书记员牵引的固定五声圆桌，帮助用户把议题定义清楚并落成清明句。",
    architecture:
      "scribe-guided task frame + fixed five-voice opening + free roundtable actions + scribe inquiry + clarity settlement",
    selves: SELVES_META,
    endpoints: {
      task_frame: "/api/task-frame",
      roundtable: "/api/roundtable",
      scribe_inquiry: "/api/scribe-inquiry",
      settlement: "/api/settlement",
    },
  };
}
