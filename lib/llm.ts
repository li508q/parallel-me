// lib/llm.ts — v1 provider-aware orchestration.
// The product path is now: issue proposal -> five-voice roundtable ->
// invisible scribe observation -> scribe inquiry -> alignment report.
//
// Production patterns applied:
// - Vercel AI SDK (generateText / generateObject) for LLM calls
// - LlmError typed error class with error codes
// - Exponential backoff retry with rate-limit header respect
// - Schema validation via AI SDK generateObject (auto-repair built-in)

import { generateText, generateObject, streamObject, streamText } from "ai";
import { createProvider } from "./ai-provider";
import { compactDialogue, compactRoundtable } from "./context-manager";

import {
  AlignmentReportSchema,
  ProbeResultSchema,
  ProposalResultSchema,
  RefineResultSchema,
  InquiryResultSchema,
  ScribeObservationLedgerSchema,
  TaskFrameResultSchema,
  TasteProfileSchema,
} from "./schema";

import { SELVES, type SelfId, SELVES_META } from "./selves";
import { scribePersonaBlock } from "./scribe";
import {
  VOICE_IDS,
  isVoiceId,
  voiceName,
  proposalToTaskFrame,
  type AlignmentProfile,
  type AlignmentReport,
  type ChoiceAnswer,
  type ChoiceCard,
  type DefiningDialogue,
  type IssueProposal,
  type ProposalKey,
  type RoundtableMove,
  type RoundtableMoveType,
  type RoundtableRecord,
  type RoundtableTurn,
  type ScribeObservationLedger,
  type ScribeAnswer,
  type ScribeInquiryAnswer,
  type ScribeInquiryQuestion,
  type ScribeQuestion,
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

// ─── Error Classification (主流实践: 区分错误类型以支持智能重试) ───

export type LlmErrorCode =
  | "rate_limit"       // 429
  | "timeout"          // 网络超时 / AbortController
  | "server_error"     // 500/502/503
  | "parse_error"      // JSON 解析失败
  | "empty_response"   // 模型返回空
  | "context_overflow" // 上下文过长 (400 + context_length)
  | "auth_error"       // 401/403
  | "safety_block"     // 内容安全拦截
  | "unknown";

export class LlmError extends Error {
  code: LlmErrorCode;
  retryable: boolean;
  retryAfterMs?: number;

  constructor(
    message: string,
    code: LlmErrorCode,
    retryable: boolean,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function classifyHttpError(status: number, body: string, headers?: Headers): LlmError {
  if (status === 429) {
    const retryAfter = headers?.get("retry-after-ms")
      ? Number(headers.get("retry-after-ms"))
      : headers?.get("retry-after")
        ? Number(headers.get("retry-after")) * 1000
        : undefined;
    return new LlmError(
      `请求过于频繁，请稍后再试 (429)`,
      "rate_limit",
      true,
      retryAfter || 5000,
    );
  }
  if (status === 401 || status === 403) {
    return new LlmError(`API Key 无效或已过期 (${status})`, "auth_error", false);
  }
  if (status >= 500) {
    return new LlmError(`模型服务暂时不可用 (${status})`, "server_error", true);
  }
  if (status === 400 && /context.*(length|limit|too long|max)/i.test(body)) {
    return new LlmError(`上下文过长，请缩短输入`, "context_overflow", false);
  }
  return new LlmError(
    `模型请求失败：HTTP ${status} ${body.slice(0, 200)}`,
    "unknown",
    status >= 500,
  );
}

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
  issueProposal?: IssueProposal;
  roundtable: RoundtableRecord;
  targetVoiceId?: VoiceId;
  fromVoiceId?: VoiceId;
  toVoiceId?: VoiceId;
  userText?: string;
}

export interface RoundtableMoveResult {
  move: RoundtableMove;
  turns: RoundtableTurn[];
}

export interface InquiryResult {
  questions: ScribeInquiryQuestion[];
  readyForReport: boolean;
  alignmentProfile: AlignmentProfile;
  ledger: ScribeObservationLedger;
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

// ─── Chat with Retry (主流实践: exponential backoff + rate-limit header) ───

export interface ChatOpts {
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
  runtime?: LlmRuntime;
  maxRetries?: number;
  timeoutMs?: number;
  onPartial?: (partial: unknown) => void;
  onToken?: (delta: string) => void;
  onFallback?: (reason: string) => void;
}

export interface LlmStreamHandlers {
  onPartial?: (partial: unknown) => void;
  onToken?: (delta: string) => void;
  onReasoning?: (delta: string, meta?: { source?: string; mode?: "native" | "public" }) => void;
  onFallback?: (reason: string) => void;
}

type StreamHandlerArg = ((partial: unknown) => void) | LlmStreamHandlers | undefined;

function streamOpts(stream?: StreamHandlerArg): LlmStreamHandlers {
  if (!stream) return {};
  if (typeof stream === "function") return { onPartial: stream };
  return stream;
}

/**
 * Single attempt LLM call via Vercel AI SDK — throws typed LlmError on failure.
 */
async function chatOnce(
  messages: Msg[],
  opts?: ChatOpts,
): Promise<string> {
  const rt = resolveRuntime(opts?.runtime);
  if (!rt.apiKey) {
    throw new LlmError("API Key 未配置。请先在设置页接入真实模型。", "auth_error", false);
  }

  const { model } = createProvider(opts?.runtime);
  const timeoutMs = opts?.timeoutMs ?? 60_000;

  try {
    const result = await generateText({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.75,
      maxOutputTokens: opts?.max_tokens ?? 600,
      abortSignal: AbortSignal.timeout(timeoutMs),
    });

    const content = result.text?.trim();
    if (!content) {
      throw new LlmError("模型返回为空", "empty_response", true);
    }
    return content;
  } catch (err: any) {
    if (err instanceof LlmError) throw err;
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new LlmError("请求超时，模型响应过慢", "timeout", true);
    }
    // Classify API errors from AI SDK
    const status = err?.status || err?.statusCode;
    if (status) {
      throw classifyHttpError(status, err?.message || "", undefined);
    }
    throw new LlmError(`LLM 调用失败：${err?.message || "unknown"}`, "unknown", true);
  }
}

/**
 * Production chat function with exponential backoff retry.
 * Respects rate-limit headers, classifies errors, and enforces timeouts.
 */
export async function chat(
  messages: Msg[],
  opts?: ChatOpts,
): Promise<string> {
  const maxRetries = opts?.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await chatOnce(messages, opts);
    } catch (e: any) {
      lastError = e;
      if (e instanceof LlmError && e.retryable && attempt < maxRetries) {
        const delay = e.retryAfterMs ?? Math.min(1000 * 2 ** attempt, 30_000);
        console.warn(`[chat] attempt ${attempt + 1} failed (${e.code}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new LlmError("重试耗尽", "unknown", false);
}

// ─── Schema-Validated Generation (Vercel AI SDK generateObject) ───

import { z } from "zod";

const VoiceOpeningPayloadResultSchema = z.object({
  thesis: z.string().default(""),
  pull: z.string().default(""),
  concern: z.string().default(""),
  protected_value: z.string().default(""),
  task_evidence: z.string().default(""),
});

const VoiceTurnTextResultSchema = z.object({
  text: z.string().default(""),
  refers_to: z.array(z.string()).optional().default([]),
});

const DuelQuestionResultSchema = z.object({
  question: z.string().default(""),
});

const DuelResponseResultSchema = z.object({
  response: z.string().default(""),
});

/**
 * Generate LLM output with Zod schema validation via AI SDK generateObject.
 * AI SDK handles JSON parsing, validation, and auto-repair internally.
 * Falls back to provided default on any failure.
 */
export async function generateValidated<T>(
  messages: Msg[],
  schema: z.ZodType<T>,
  opts: ChatOpts & { fallback: T },
): Promise<T> {
  const rt = resolveRuntime(opts?.runtime);
  if (!rt.apiKey) {
    console.warn("[generateValidated] no API key, using fallback");
    opts.onFallback?.("no_api_key");
    return opts.fallback;
  }

  const { model } = createProvider(opts?.runtime);
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const maxRetries = opts?.maxRetries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (opts.onPartial || opts.onToken) {
        const result = streamObject({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          schema,
          temperature: opts?.temperature ?? 0.75,
          maxOutputTokens: opts?.max_tokens ?? 600,
          abortSignal: AbortSignal.timeout(timeoutMs),
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            opts.onToken?.(part.textDelta);
          } else if (part.type === "object") {
            opts.onPartial?.(part.object);
          } else if (part.type === "error") {
            throw part.error instanceof Error ? part.error : new Error(String(part.error));
          }
        }

        return (await result.object) as T;
      }

      const result = await generateObject({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        schema,
        temperature: opts?.temperature ?? 0.75,
        maxOutputTokens: opts?.max_tokens ?? 600,
        abortSignal: AbortSignal.timeout(timeoutMs),
      });
      return result.object;
    } catch (err: any) {
      if (err instanceof LlmError) {
        if (err.retryable && attempt < maxRetries) {
          const delay = err.retryAfterMs ?? Math.min(1000 * 2 ** attempt, 30_000);
          await sleep(delay);
          continue;
        }
        break;
      }
      // Map AI SDK errors
      const status = err?.status || err?.statusCode;
      if (status === 429 && attempt < maxRetries) {
        await sleep(Math.min(2000 * 2 ** attempt, 30_000));
        continue;
      }
      if (status >= 500 && attempt < maxRetries) {
        await sleep(Math.min(1000 * 2 ** attempt, 15_000));
        continue;
      }
      console.warn(`[generateValidated] attempt ${attempt + 1} failed:`, err?.message);
      break;
    }
  }

  console.warn("[generateValidated] all attempts failed, using fallback");
  opts.onFallback?.("generation_failed");
  return opts.fallback;
}

function buildContextBlock(ctx?: ContextBundle): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.meCard) parts.push(`【关于这个人】\n${ctx.meCard}`);
  if (ctx.tasteProfile) parts.push(`【他喜欢的东西揭示的他】\n${ctx.tasteProfile}`);
  return parts.length
    ? "\n\n【长期背景｜低优先级】\n以下资料只在和当前议题直接相关时使用；不要为了呼应画像而偏离本轮问题，也不要围绕长期背景重复追问。\n\n" + parts.join("\n\n")
    : "";
}

const CRISIS_RE =
  /(自杀|轻生|不想活|活不下去|结束生命|杀了自己|伤害自己|自残|割腕|跳楼| overdose |suicide|kill myself|end my life|self-harm)/i;

export function detectCrisis(text: string): boolean {
  return CRISIS_RE.test(text);
}

export function crisisMessage(): string {
  return "我听见这件事可能已经很危险。ParallelMe 不能替代真人危机支持。若你可能伤害自己或他人，请立刻联系当地紧急服务；在美国可拨打或短信 988。也请尽快联系一个真实的人陪你待一会儿。";
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

function compactIssueProposal(proposal: IssueProposal): string {
  const keyPairs: Array<[string, ProposalKey]> = [
    ["当下的选择岔路是什么？", proposal.surface_dilemma],
    ["限制选择的现实边界是什么？", proposal.current_constraints],
    ["真正害怕失去的是什么？", proposal.core_fears],
    ["这次圆桌要验证什么？", proposal.expected_resolution],
  ];
  const keyLines = keyPairs.map(([question, key]) => {
    const details = key.details.length ? `\n  线索：${key.details.join("；")}` : "";
    return `- ${question}\n  ${key.content}${details}`;
  });
  return [`本次议题：${proposal.issue_sentence}`, "4 Key：", ...keyLines].join("\n");
}

function compactRoundtableBrief(taskFrame: TaskFrame, proposal?: IssueProposal): string {
  if (proposal) return compactIssueProposal(proposal);
  return compactTaskFrame(taskFrame);
}

function serializeRoundtable(roundtable: RoundtableRecord): string {
  const compacted = compactRoundtable(roundtable);
  const openings = roundtable.opening_turns
    .map(
      (t) =>
        `[${t.name}] 痛苦本质：${t.thesis} / 第一步：${t.pull} / 苦果：${t.concern} / 守护底线：${t.protected_value}`,
    )
    .join("\n");
  const turns = compacted.recentTurns
    .map((t) => {
      if (t.duel) {
        return `[两声对话] ${t.duel.from_name} 问 ${t.duel.to_name}: ${t.duel.question} / ${t.duel.to_name}: ${t.duel.response}`;
      }
      if (t.trigger === "user_reaction") {
        const target = t.reply_to_name || (t.reply_to_voice_id ? voiceName(t.reply_to_voice_id) : "这条发言");
        const quoted = t.reply_to_text ? `（原话：${t.reply_to_text}）` : "";
        return `[用户答复/反驳 ${target}] ${t.user_text || t.text}${quoted}`;
      }
      if (t.trigger === "user_text") return `[用户] ${t.user_text || t.text}`;
      if (t.voice_id) return `[${t.name}] ${t.text}`;
      return `[圆桌记录] ${t.text}`;
    })
    .join("\n");
  const early = compacted.earlySummary ? `\n\n压缩摘要：\n${compacted.earlySummary}` : "";
  return `第一轮：\n${openings || "（还没有）"}${early}\n\n后续：\n${turns || "（还没有）"}`;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateTaskFrame(
  rawInput: string,
  choiceAnswers: ChoiceAnswer[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
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

  const sys = `你是 ParallelMe v1.0 的书记员。你的任务是把用户原始输入整理成“本次议题”，并设计少量高密度选择卡。

${scribePersonaBlock("brief")}

产品原则：
- 书记员半显性，不是第六声。
- 敢于把处境命名清楚，但只用用户能改写的人话，不用心理学术语压人。
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
    const validated = await generateValidated(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        { role: "user", content: `原始输入：\n${rawInput}\n\n选择卡答案：\n${answersText}` },
      ],
      TaskFrameResultSchema,
      { temperature: 0.45, max_tokens: 1800, json: true, runtime, fallback: fallback as any, ...streamOpts(onPartial) },
    );
    return normalizeTaskFrameResult(validated, rawInput, choiceAnswers, fallback);
  } catch (e) {
    console.warn("[generateTaskFrame] fallback", e);
    return fallback;
  }
}

// ─── 议题定义阶段重构：对话式追问 + 4-Key 提案 ───

export interface ProbeResult {
  questions: ScribeQuestion[];
  readyToPropose: boolean;
  thinking: string;
}

const PROBE_PURPOSES = [
  "surface_dilemma",
  "current_constraints",
  "core_fears",
  "expected_resolution",
] as const;

type ProbePurpose = (typeof PROBE_PURPOSES)[number];

const PROBE_PURPOSE_LABEL: Record<ProbePurpose, string> = {
  surface_dilemma: "选择岔路",
  current_constraints: "现实边界",
  core_fears: "隐秘关切",
  expected_resolution: "圆桌验证任务",
};

interface ProbeCoverage {
  combined: string;
  reasoningMemo: string;
  userAnswerCount: number;
  askedPurposes: Set<ProbePurpose>;
  answeredPurposes: Set<ProbePurpose>;
  askedTexts: string[];
  has: Record<ProbePurpose, boolean>;
  missing: ProbePurpose[];
}

function safeProbeFallback(
  rawInput: string,
  dialogue: DefiningDialogue = [],
  reasoningMemo = "",
): ProbeResult {
  const coverage = collectProbeCoverage(rawInput, dialogue, reasoningMemo);
  if (!coverage.missing.length) {
    return {
      readyToPropose: true,
      thinking: "四个 Key 的主要边界已经足够清楚，不再追问，直接生成议题提案。",
      questions: [],
    };
  }

  const topic = classifyTopic(`${rawInput}\n${coverage.combined}`);
  const ranked = rankProbePurposes(coverage);
  const freshPurposes = ranked.filter((purpose) => !coverage.askedPurposes.has(purpose));
  const selectedPurposes = (freshPurposes.length ? freshPurposes : ranked).slice(0, 2);
  const questions = selectedPurposes
    .map((purpose) => fallbackProbeQuestionForPurpose(purpose, topic, coverage.askedPurposes.has(purpose)))
    .filter((question) => !coverage.askedTexts.some((text) => areSimilarQuestions(text, question.text)));

  const finalQuestions = questions.length
    ? questions
    : [
        fallbackProbeQuestionForPurpose(
          ranked[0] || "expected_resolution",
          topic,
          true,
        ),
      ];

  return {
    readyToPropose: false,
    thinking: `结构化输出不可用时，改用缺口感知追问。当前优先补：${selectedPurposes.map((p) => PROBE_PURPOSE_LABEL[p]).join("、")}。`,
    questions: finalQuestions.slice(0, 2),
  };
}

function collectProbeCoverage(
  rawInput: string,
  dialogue: DefiningDialogue,
  reasoningMemo = "",
): ProbeCoverage {
  const questionById = new Map<string, ScribeQuestion>();
  const askedPurposes = new Set<ProbePurpose>();
  const answeredPurposes = new Set<ProbePurpose>();
  const askedTexts: string[] = [];
  const textParts = [rawInput];

  for (const entry of dialogue) {
    if (entry.role === "scribe" && entry.question) {
      questionById.set(entry.question.id, entry.question);
      askedTexts.push(entry.question.text);
      textParts.push(entry.question.text, ...entry.question.options.map((option) => option.label));
      const purpose = normalizeProbePurpose(entry.question.purpose) || inferProbePurpose(entry.question.text);
      if (purpose) askedPurposes.add(purpose);
      continue;
    }

    if (entry.role === "user" && entry.answer) {
      const question = questionById.get(entry.answer.question_id);
      const answerText = [
        entry.answer.question_text,
        entry.answer.selected_option_label,
        entry.answer.free_text,
      ].filter(Boolean).join(" ");
      textParts.push(answerText);

      const purpose = normalizeProbePurpose(question?.purpose) || inferProbePurpose(entry.answer.question_text || "");
      if (purpose && answerText.trim()) answeredPurposes.add(purpose);
    }
  }

  const combined = textParts.filter(Boolean).join("\n");
  const userAnswerCount = dialogue.filter((entry) => entry.role === "user").length;
  const has: Record<ProbePurpose, boolean> = {
    surface_dilemma:
      answeredPurposes.has("surface_dilemma") ||
      /(还是|要不要|该不该|留在|回|考公|辞职|选择|一边|另一边|vs|VS|还是说|A|B|哪条路|岔路)/.test(combined),
    current_constraints:
      answeredPurposes.has("current_constraints") ||
      /(\d|月薪|年薪|收入|房|钱|父母|妈妈|母亲|老家|大厂|稳定|压力|年龄|时间|健康|婚|孩子|债|存款|合同|签证|身体|睡眠|失败成本|现金流)/.test(combined),
    core_fears:
      answeredPurposes.has("core_fears") ||
      /(害怕|担心|怕|焦虑|愧疚|不甘心|后悔|自由|体面|安全感|价值|身份|尊严|掌控|亏欠|内疚|想证明|不想失去|失去|底线)/.test(combined),
    expected_resolution:
      answeredPurposes.has("expected_resolution") ||
      /(希望|想让|想知道|验证|确认|看清|圆桌|讨论|帮我|判断规则|产出|结论|代价排序|观察期|下一步验证)/.test(combined),
  };

  return {
    combined,
    reasoningMemo,
    userAnswerCount,
    askedPurposes,
    answeredPurposes,
    askedTexts,
    has,
    missing: PROBE_PURPOSES.filter((purpose) => !has[purpose]),
  };
}

function rankProbePurposes(coverage: ProbeCoverage): ProbePurpose[] {
  const scores = new Map<ProbePurpose, number>();
  const reasoning = coverage.reasoningMemo;
  for (const purpose of coverage.missing) {
    let score = 10;
    if (!coverage.askedPurposes.has(purpose)) score += 3;
    if (coverage.answeredPurposes.has(purpose)) score -= 6;
    if (purpose === "surface_dilemma") score += 4;
    if (purpose === "current_constraints") score += 3;
    if (purpose === "core_fears") score += 2;
    if (purpose === "expected_resolution") score += 1;

    if (purpose === "surface_dilemma" && /(岔路|选项|选择|A|B|该不该|要不要)/.test(reasoning)) score += 5;
    if (purpose === "current_constraints" && /(现实|约束|现金流|钱|时间|失败成本|家庭压力|边界|条件)/.test(reasoning)) score += 5;
    if (purpose === "core_fears" && /(害怕|失去|恐惧|关切|底线|价值|真正不能失去)/.test(reasoning)) score += 5;
    if (purpose === "expected_resolution" && /(验证|圆桌|讨论任务|希望|产出|判断规则|要确认什么)/.test(reasoning)) score += 5;
    scores.set(purpose, score);
  }
  return [...coverage.missing].sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
}

function normalizeProbePurpose(value: unknown): ProbePurpose | null {
  const purpose = String(value || "").trim();
  return (PROBE_PURPOSES as readonly string[]).includes(purpose)
    ? (purpose as ProbePurpose)
    : null;
}

function inferProbePurpose(text: string): ProbePurpose | null {
  if (/(岔路|选项|选择|该不该|要不要|一边|另一边|A|B)/.test(text)) return "surface_dilemma";
  if (/(现实|约束|条件|钱|时间|收入|家庭|身体|失败成本|现金流|边界)/.test(text)) return "current_constraints";
  if (/(害怕|失去|恐惧|关切|底线|价值|安全感|体面|亏欠|后悔)/.test(text)) return "core_fears";
  if (/(圆桌|验证|确认|看清|讨论|产出|判断规则|最终帮你)/.test(text)) return "expected_resolution";
  return null;
}

function fallbackProbeQuestionForPurpose(
  purpose: ProbePurpose,
  topic: Topic,
  followup: boolean,
): ScribeQuestion {
  const commonCustom = { id: "custom", label: "都不准，我自己说" };
  const topicLabel = topic === "career"
    ? "这条职业路"
    : topic === "family"
      ? "这件和家人有关的事"
      : topic === "relationship"
        ? "这段关系"
        : topic === "money"
          ? "这笔现实账"
          : "这件事";

  if (purpose === "surface_dilemma") {
    return {
      id: followup ? "q_surface_recheck" : "q_surface_dilemma",
      purpose,
      text: followup
        ? `我不再重问感受，只校对一下：${topicLabel}现在真正的岔路是哪两边？`
        : `如果先把情绪放旁边，${topicLabel}表面上最像哪一个选择岔路？`,
      options: [
        { id: "stay_or_leave", label: "一边是沿着现在的路继续走，一边是明显换方向。" },
        { id: "delay_or_decide", label: "一边是现在做决定，一边是先设观察期再说。" },
        { id: "speak_or_hold", label: "一边是把话说开，一边是先把局面稳住。" },
        commonCustom,
      ],
    };
  }

  if (purpose === "current_constraints") {
    return {
      id: followup ? "q_constraints_recheck" : "q_current_constraints",
      purpose,
      text: followup
        ? "我只补现实边界：哪一个条件如果变化，你的选择会立刻跟着变？"
        : "这件事里，哪个现实条件是真的会卡住选择，而不是单纯让你心烦？",
      options: [
        { id: "money_time", label: "钱和时间窗口最硬，拖久或动错都会有实际成本。" },
        { id: "family_relation", label: "家人或亲近关系会被牵动，后果不是我一个人承受。" },
        { id: "body_workload", label: "身体、精力或工作制度已经把余量压得很窄。" },
        commonCustom,
      ],
    };
  }

  if (purpose === "core_fears") {
    return {
      id: followup ? "q_core_fear_recheck" : "q_core_fears",
      purpose,
      text: followup
        ? "不问圆桌要验证什么，只问底线：哪一种失去最让你不敢轻易动？"
        : "先不谈该选哪边，真正让你心里发紧的是怕失去什么？",
      options: [
        { id: "lose_safety", label: "失去安全感和退路，最后发现自己扛不住。" },
        { id: "lose_self_respect", label: "失去对自己的认可，觉得自己背叛了真正想要的活法。" },
        { id: "lose_belonging", label: "失去重要关系里的理解、认可或亲近。" },
        commonCustom,
      ],
    };
  }

  return {
    id: followup ? "q_expected_resolution_recheck" : "q_expected_resolution",
    purpose: "expected_resolution",
    text: followup
      ? "不再追问你怕什么了，只定圆桌任务：你希望它最后帮你产出哪一种判断？"
      : "这次圆桌不是替你做决定，而是要帮你验证哪一种判断规则？",
    options: [
      { id: "cost_order", label: "帮我把几个代价排出先后：哪个不能碰，哪个可以吞下。" },
      { id: "boundary_rule", label: "帮我确认一条边界：什么情况下继续，什么情况下停。" },
      { id: "timebox", label: "帮我定一个观察期或下一步验证动作，而不是立刻判终局。" },
      commonCustom,
    ],
  };
}

function normalizeProbeQuestions(
  questions: ScribeQuestion[] = [],
  context?: { rawInput?: string; dialogue?: DefiningDialogue; reasoningMemo?: string },
): ScribeQuestion[] {
  const coverage = context?.rawInput
    ? collectProbeCoverage(context.rawInput, context.dialogue || [], context.reasoningMemo || "")
    : null;
  const seenPurposes = new Set<ProbePurpose>();
  const seenTexts: string[] = [];
  const normalizedQuestions: ScribeQuestion[] = [];

  for (const [questionIndex, question] of questions.entries()) {
    const purpose = normalizeProbePurpose(question.purpose) || inferProbePurpose(question.text);
    if (!purpose) continue;
    if (seenPurposes.has(purpose)) continue;
    if (coverage?.askedTexts.some((text) => areSimilarQuestions(text, question.text))) continue;
    if (seenTexts.some((text) => areSimilarQuestions(text, question.text))) continue;

    const options = question.options
      .map((option, index) => ({
        id: String(option.id || "").trim() || `option_${index + 1}`,
        label: String(option.label || "").trim(),
      }))
      .filter((option) => option.label);

    if (!options.some(isCustomFreeTextOption) && options.length >= 4) {
      options.splice(3, options.length - 3, { id: "custom", label: "都不准，我自己说" });
    } else if (!options.some(isCustomFreeTextOption)) {
      options.push({ id: "custom", label: "都不准，我自己说" });
    }

    seenPurposes.add(purpose);
    seenTexts.push(question.text);

    normalizedQuestions.push({
      ...question,
      id: String(question.id || `q_${purpose}_${questionIndex + 1}`),
      purpose,
      text: String(question.text || "").trim(),
      options: options.slice(0, 4),
    });
  }

  return normalizedQuestions
    .filter((question) => question.text && question.options.length >= 2)
    .slice(0, 3);
}

function isCustomFreeTextOption(option: { id: string; label: string }): boolean {
  const id = option.id.trim().toLowerCase();
  const label = option.label.trim();
  if (id === "custom" || id === "other" || id === "free_text") return true;
  return /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(label);
}

function areSimilarQuestions(a: string, b: string): boolean {
  const left = normalizeQuestionText(a);
  const right = normalizeQuestionText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 10 && right.length >= 10 && (left.includes(right) || right.includes(left))) return true;

  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);
  if (!leftBigrams.size || !rightBigrams.size) return false;
  let overlap = 0;
  for (const item of leftBigrams) {
    if (rightBigrams.has(item)) overlap += 1;
  }
  const union = leftBigrams.size + rightBigrams.size - overlap;
  return overlap / union >= 0.58;
}

function normalizeQuestionText(text: string): string {
  return Array.from(text)
    .filter((char) => /[\p{Script=Han}A-Za-z0-9]/u.test(char))
    .join("")
    .replace(/你希望这次圆桌最终帮你验证什么/g, "圆桌验证任务")
    .replace(/你希望这次圆桌讨论帮自己验证什么/g, "圆桌验证任务")
    .toLowerCase();
}

function bigrams(text: string): Set<string> {
  const result = new Set<string>();
  if (text.length <= 2) {
    if (text) result.add(text);
    return result;
  }
  for (let i = 0; i < text.length - 1; i += 1) {
    result.add(text.slice(i, i + 2));
  }
  return result;
}

function shouldForceProbe(
  rawInput: string,
  dialogue: DefiningDialogue,
  result: ProbeResult,
  reasoningMemo = "",
): boolean {
  if (!result.readyToPropose) return false;
  const coverage = collectProbeCoverage(rawInput, dialogue, reasoningMemo);
  if (!coverage.missing.length) return false;
  if (
    coverage.userAnswerCount >= 3 &&
    coverage.has.surface_dilemma &&
    coverage.has.current_constraints &&
    (coverage.has.core_fears || coverage.has.expected_resolution)
  ) {
    return false;
  }
  return true;
}

export interface ProposalResult {
  proposal: IssueProposal;
  taskFrame: TaskFrame;
}

export interface RefineResult {
  needMoreInfo: boolean;
  questions?: ScribeQuestion[];
  proposal?: IssueProposal;
  taskFrame?: TaskFrame;
  thinking: string;
}

function serializeDialogue(dialogue: DefiningDialogue): string {
  if (dialogue.length === 0) return "（还没有对话）";
  const compacted = compactDialogue(dialogue);
  const questions = new Map<string, ScribeQuestion>();
  for (const entry of compacted.compacted) {
    if (entry.role === "scribe" && entry.question) {
      questions.set(entry.question.id, entry.question);
    }
  }
  const recent = compacted.compacted.map((entry) => {
    if (entry.role === "scribe" && entry.question) {
      const thinking = extractDialogueThinking(entry.thinking_events);
      const opts = entry.question.options
        .map((o, index) => `${index + 1}. ${o.label}`)
        .join("\n");
      return [
        thinking ? `书记员上一轮思考：${thinking}` : "",
        `书记员问：${entry.question.text}`,
        `可选回应：\n${opts}`,
      ].filter(Boolean).join("\n");
    }
    if (entry.role === "user" && entry.answer) {
      const question = questions.get(entry.answer.question_id);
      const selectedLabel = entry.answer.selected_option_label
        || question?.options.find((o) => o.id === entry.answer?.selected_option_id)?.label
        || "";
      const questionText = entry.answer.question_text || question?.text || "";
      const selected = selectedLabel ? `用户选择：${selectedLabel}` : "";
      const free = entry.answer.free_text ? entry.answer.free_text : "";
      return [
        questionText ? `对应问题：${questionText}` : "",
        selected,
        free ? `用户补充：${free}` : "",
      ].filter(Boolean).join("\n");
    }
    return "";
  }).filter(Boolean).join("\n\n");
  return [compacted.summary, recent].filter(Boolean).join("\n\n");
}

function extractDialogueThinking(events: DefiningDialogue[number]["thinking_events"]) {
  if (!events?.length) return "";
  return events
    .filter((event) => event.type === "reasoning_delta")
    .map((event) => event.text)
    .join("")
    .trim();
}

type ScribeReasoningMode = "probe" | "proposal" | "refine" | "taskFrame";

interface ScribeReasoningInput {
  mode: ScribeReasoningMode;
  source: string;
  rawInput: string;
  dialogueText?: string;
  currentProposal?: IssueProposal;
  userFeedback?: string;
  ctx?: ContextBundle;
  runtime?: LlmRuntime;
  onReasoning?: LlmStreamHandlers["onReasoning"];
}

const STAGE_ONE_SCRIBE_SYSTEM = `你是 ParallelMe 阶段一的问题定义者：一位深谙金字塔原理的架构师。

面对用户模糊、情绪化、甚至自相矛盾的初始输入，你的任务是自下而上地收集信息，自上而下地构建逻辑，最终输出一份结构化的《议题提案》。

核心交互策略：
- 剥洋葱法：拒绝表面叙事。当用户只说焦虑、纠结、委屈或想逃开时，不提供建议，而是追问那股感受背后具体是哪类担忧。
- 边界测试：通过极端假设逼近真实想法。例如把钱、时间、失败成本、家庭期待、关系后果推到边界，观察用户真正不能失去什么。

阶段一只做一件事：完成问题定义。你不替用户做决定，不给建议，不做临床判断，不安慰，也不进入五声圆桌。

你需要在对话中反复判断：
1. 具象化的困惑是否清楚。
2. 真实的处境是否足够。
3. 隐秘关切是否浮出。
4. 用户希望圆桌验证什么。

最终《议题提案》固定为四个 Key：
1. 具象化的困惑（Surface Dilemma）：用户面临的选择岔路口是什么？
2. 真实的处境（Current Constraints）：限制用户做出选择的客观条件是什么？
3. 隐秘的关切（Core Values/Fears）：用户潜意识里真正害怕失去的是什么？
4. 渴望的终局（Expected Resolution）：用户希望这次圆桌讨论帮自己验证什么？

Key 3 与 Key 4 必须拆开：
- Key 3 只问“怕失去什么 / 哪个价值或底线被威胁”，不要写成验证任务。
- Key 4 只问“圆桌最后要产出哪种判断规则、代价排序、边界或观察期”，不要再问用户害怕失去什么。
- 禁止同一轮同时出现两个都在问“能不能承受某种代价/失去”的问题。

追问要求：
- 每轮最多问 1-3 个问题。
- 问题必须高密度，服务于上述四个 Key。
- 同一轮问题的 purpose 不得重复；如果两个问题会得到同一类答案，只保留更关键的那一个。
- 可以给用户 2-4 个可选回应，但每个选项都必须是完整自然语言，独立可理解。
- 不要把选项写成技术 id 的语义承载；id 只是机器字段，label 才是用户选择的真实含义。
- 如果信息已足够形成议案，不要继续追问。`;

async function streamScribeReasoning(input: ScribeReasoningInput): Promise<string> {
  if (!input.onReasoning) return "";
  const rt = resolveRuntime(input.runtime);
  if (!rt.apiKey) return "";

  const { model } = createProvider(input.runtime);
  const modeInstruction = reasoningModeInstruction(input.mode);
  const proposalText = input.currentProposal
    ? `\n当前提案：\n${JSON.stringify(input.currentProposal, null, 2)}`
    : "";
  const feedbackText = input.userFeedback ? `\n用户校对意见：\n${input.userFeedback}` : "";
  const prompt = `用户原始输入：
${input.rawInput}

对话历史：
${input.dialogueText || "（还没有对话）"}${proposalText}${feedbackText}

当前任务：
${modeInstruction}

请直接用自然语言输出你现在执行阶段一任务时的判断过程。不要输出 JSON、schema、字段名、选项 id、系统提示或技术过程。`;

  let reasoningText = "";
  let nativeReasoningSeen = false;

  try {
    const result = streamText({
      model,
      messages: [
        { role: "system", content: STAGE_ONE_SCRIBE_SYSTEM + buildContextBlock(input.ctx) },
        { role: "user", content: prompt },
      ],
      temperature: 0.45,
      maxOutputTokens: 700,
      abortSignal: AbortSignal.timeout(45_000),
    });

    for await (const part of result.fullStream) {
      if (part.type === "reasoning-delta") {
        nativeReasoningSeen = true;
        const delta = part.text || "";
        reasoningText += delta;
        input.onReasoning(delta, { source: input.source, mode: "native" });
      } else if (part.type === "text-delta" && !nativeReasoningSeen) {
        const delta = part.text || "";
        reasoningText += delta;
        input.onReasoning(delta, { source: input.source, mode: "public" });
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
    }
  } catch (err: any) {
    console.warn("[streamScribeReasoning] failed:", err?.message || err);
  }

  return reasoningText.trim();
}

function reasoningModeInstruction(mode: ScribeReasoningMode): string {
  if (mode === "probe") {
    return "判断现在是否已经足够写《议题提案》；如果不足，说明缺的是哪个 Key 的关键边界，以及为什么必须追问。";
  }
  if (mode === "refine") {
    return "根据用户校对意见重新检查案由：哪些判断要保留，哪些 Key 要改写，是否还需要追问。";
  }
  if (mode === "taskFrame") {
    return "把用户输入拆成可进入圆桌的议题框架：先确认具象化困惑，再辨认真实处境和讨论焦点。";
  }
  return "生成《议题提案》前先建案：确认本次议题主句、四个 Key 的边界，以及最终圆桌要验证的任务。";
}

const SCRIBE_PROBE_SYSTEM = `${STAGE_ONE_SCRIBE_SYSTEM}

${scribePersonaBlock("brief")}

判断何时结束追问：
- 当你已经能写出一句清楚的“本次议题主句”，并且四个 Key 都能用自然语言说清、互不重复
- 当 Surface Dilemma、Current Constraints、Core Values/Fears、Expected Resolution 的主要边界已经清楚；仍缺的细节不会改变成案方向
- 如果缺的是关键边界（例如失败成本、家庭压力、现金流、真正想验证什么），先追问；如果只是枝节不全，可以成案并把判断写成可校对的自然语言
- 不因为轮次多就强行成案；只有信息足够或用户主动确认时才生成提案

追问去重：
- 不要问已经在历史里问过、用户也回答过的问题。
- 同一轮最多一个问题服务 core_fears，最多一个问题服务 expected_resolution。
- core_fears 问“哪种失去/恐惧/底线最刺痛”；expected_resolution 问“这次圆桌要帮用户产出什么判断规则”。二者不能互相套话。

你只允许输出两类结果：
- ask_more：readyToPropose=false，并输出 1-3 个高质量追问。
- issue_proposal：readyToPropose=true，questions 为空，表示下一步应生成《议题提案》。

输出严格 JSON：
{
  "questions": [
    {
      "id": "q_xxx",
      "text": "一句自然语言的追问",
      "options": [{"id": "opt_a", "label": "一个完整、自然、可独立理解的回应选项"}, {"id": "opt_b", "label": "另一个完整回应选项"}],
      "purpose": "surface_dilemma|current_constraints|core_fears|expected_resolution"
    }
  ],
  "readyToPropose": false,
  "thinking": "给 Trace 用的公开工作笔记：说明缺了哪个 Key 的关键边界，为什么要问"
}`;

export async function generateScribeQuestions(
  rawInput: string,
  dialogue: DefiningDialogue,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<ProbeResult> {
  const dialogueText = serializeDialogue(dialogue);
  const handlers = streamOpts(onPartial);
  const reasoningMemo = await streamScribeReasoning({
    mode: "probe",
    source: "probe",
    rawInput,
    dialogueText,
    ctx,
    runtime,
    onReasoning: handlers.onReasoning,
  });
  const userMsg = `用户原始输入：
${rawInput}

已有对话：
${dialogueText}

刚才的自然语言判断过程：
${reasoningMemo || "（没有可用判断过程）"}

请基于以上信息，决定是继续追问还是信息已经足够可以生成提案。如果继续追问，输出 1-3 个问题。`;

  const fallback: ProbeResult = safeProbeFallback(rawInput, dialogue, reasoningMemo);
  let fallbackReason = "";
  try {
    const validated = await generateValidated(
      [
        { role: "system", content: SCRIBE_PROBE_SYSTEM + buildContextBlock(ctx) },
        { role: "user", content: userMsg },
      ],
      ProbeResultSchema,
      {
        temperature: 0.6,
        max_tokens: 800,
        json: true,
        runtime,
        fallback,
        ...handlers,
        onFallback: (reason) => {
          fallbackReason = reason;
          handlers.onReasoning?.(
            reason === "no_api_key"
              ? "没有可用模型配置，先用本地缺口规则生成追问。\n"
              : "结构化追问生成失败，先用刚才的判断过程和已回答内容生成兜底追问。\n",
            { source: "probe", mode: "public" },
          );
        },
      },
    );
    const normalized: ProbeResult = {
      questions: normalizeProbeQuestions(validated.questions, { rawInput, dialogue, reasoningMemo }),
      readyToPropose: validated.readyToPropose,
      thinking: validated.thinking || "",
    };
    if (!normalized.readyToPropose && normalized.questions.length === 0) {
      const gapFallback = safeProbeFallback(rawInput, dialogue, reasoningMemo);
      return {
        ...gapFallback,
        thinking: `${normalized.thinking || gapFallback.thinking}\n已过滤掉重复追问，改问剩余缺口。`.trim(),
      };
    }
    if (shouldForceProbe(rawInput, dialogue, normalized, reasoningMemo)) {
      const gapFallback = safeProbeFallback(rawInput, dialogue, reasoningMemo);
      handlers.onReasoning?.(
        "刚才的结构化结果说可以成案，但四个 Key 还有关键边界没落稳；我先只补剩余缺口。\n",
        { source: "probe", mode: "public" },
      );
      return {
        ...gapFallback,
        thinking: `${normalized.thinking || gapFallback.thinking}\n${gapFallback.thinking}`.trim(),
      };
    }
    return {
      questions: normalized.questions,
      readyToPropose: normalized.readyToPropose,
      thinking: [
        normalized.thinking,
        fallbackReason ? fallback.thinking : "",
      ].filter(Boolean).join("\n"),
    };
  } catch (e) {
    console.warn("[generateScribeQuestions] error", e);
    return safeProbeFallback(rawInput, dialogue, reasoningMemo);
  }
}

const SCRIBE_PROPOSE_SYSTEM = `${STAGE_ONE_SCRIBE_SYSTEM}

${scribePersonaBlock("brief")}

现在信息已经足够形成《议题提案》。请把完整对话收束为一份进入五声圆桌前的问题定义文件。

成案原则：
- MECE：四个 Key 要相互独立、共同穷尽，不要把同一件事换个说法重复写四遍。
- 案由优先：先写出一句“本次议题主句”，再展开四个 Key。
- 只定义问题，不回答用户该怎么选。

本次议题主句（issue_sentence）：
- 一句话写清“这次圆桌的案由”，不是标题，不是摘要，不是建议。
- 好的句式：你不是单纯在问 X，而是在确认 Y。
- 必须可被用户校对，像一份进入圆桌前的案由。

4 个 Key 的要求：
- Key 1 具象化的困惑 / Surface Dilemma（surface_dilemma）：回答“用户面临的选择岔路口是什么？”必须写成真实岔路，不能写成泛泛困扰。
- Key 2 真实的处境 / Current Constraints（current_constraints）：回答“限制用户做出选择的客观条件是什么？”只收钱、时间、家庭、职业制度、身体状态、失败成本等客观约束。
- Key 3 隐秘的关切 / Core Values/Fears（core_fears）：回答“用户潜意识里真正害怕失去的是什么？”写价值/恐惧，不替用户贴因果标签。
- Key 4 渴望的终局 / Expected Resolution（expected_resolution）：回答“用户希望这次圆桌讨论帮自己验证什么？”必须写成验证任务或判断规则，不许写成“五声会帮你决定/建议”，也不许重复 Key 3 的恐惧/失去。

【关键规则】
- 即使对话信息有限，每个 Key 也必须基于已有信息做出合理推断和分析，绝不允许写"待补充""待挖掘""待明确""未知"等占位符。
- 宁可给出一个基于推理的初步分析（即使不完全准确），也不能留空或写占位文字。
- 不要把议题提前改写成解决方案；书记员先定义问题，再把它交给五声圆桌。
- 没有建议句、诊断句、安慰句。禁止“你应该/我建议/你需要做/最好的选择是/这说明你有某种心理问题”。
- value 必须是完整人话句，不是概念短语。用户看到后的自然动作应该是“校对”，不是“继续解释一大段”。

每个 Key 必须包含：
- title: 给用户看的人话标题
- content: 核心内容（1-2句）
- details: 补充细节数组

同时生成兼容的 taskFrame（visible + internal）供后续圆桌阶段使用。

输出严格 JSON：
{
  "proposal": {
    "issue_sentence": "本次议题主句",
    "surface_dilemma": { "title": "具象化的困惑", "content": "", "details": [] },
    "current_constraints": { "title": "真实的处境", "content": "", "details": [] },
    "core_fears": { "title": "隐秘的关切", "content": "", "details": [] },
    "expected_resolution": { "title": "渴望的终局", "content": "", "details": [] }
  },
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
      "facts": [], "parties": [], "options": [],
      "state_tags": {"clarity":"medium","decision_readiness":"exploring","urgency":"medium","emotional_charge":"medium"},
      "value_axes": [], "pressure_sources": [], "concern_notes": [],
      "source_labels": {}, "choice_answers": []
    }
  }
}`;

/** Build a minimal taskFrame from proposal when LLM omits it */
function buildTaskFrameFromProposal(proposal: any): TaskFrame | null {
  if (!proposal?.surface_dilemma) return null;
  const visible = proposalToTaskFrame(proposal as IssueProposal);
  return {
    visible,
    internal: {
      facts: [], parties: [], options: [],
      state_tags: { clarity: "low", decision_readiness: "exploring", urgency: "medium", emotional_charge: "medium" },
      value_axes: [], pressure_sources: [], concern_notes: [],
      source_labels: {}, choice_answers: [],
    },
  };
}

function normalizeProposalKey(
  proposalKey: Partial<ProposalKey> | undefined,
  fallback: ProposalKey,
  defaultTitle: string,
): ProposalKey {
  const rawDetails = Array.isArray(proposalKey?.details)
    ? proposalKey.details
    : fallback.details;

  return {
    title: proposalKey?.title?.trim() || defaultTitle,
    content: proposalKey?.content?.trim() || fallback.content,
    details: rawDetails
      .map((detail) => String(detail).trim())
      .filter(Boolean),
  };
}

function normalizeIssueProposal(proposal: Partial<IssueProposal> | undefined, fallback: IssueProposal): IssueProposal {
  return {
    issue_sentence: proposal?.issue_sentence?.trim() || fallback.issue_sentence,
    surface_dilemma: normalizeProposalKey(proposal?.surface_dilemma, fallback.surface_dilemma, "具象化的困惑"),
    current_constraints: normalizeProposalKey(proposal?.current_constraints, fallback.current_constraints, "真实的处境"),
    core_fears: normalizeProposalKey(proposal?.core_fears, fallback.core_fears, "隐秘的关切"),
    expected_resolution: normalizeProposalKey(proposal?.expected_resolution, fallback.expected_resolution, "渴望的终局"),
  };
}

export async function generateIssueProposal(
  rawInput: string,
  dialogue: DefiningDialogue,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<ProposalResult> {
  const dialogueText = serializeDialogue(dialogue);
  const handlers = streamOpts(onPartial);
  const reasoningMemo = await streamScribeReasoning({
    mode: "proposal",
    source: "proposal",
    rawInput,
    dialogueText,
    ctx,
    runtime,
    onReasoning: handlers.onReasoning,
  });
  const userMsg = `用户原始输入：
${rawInput}

完整对话历史：
${dialogueText}

刚才的自然语言判断过程：
${reasoningMemo || "（没有可用判断过程）"}

请基于以上信息生成 4-Key 议题提案和兼容的 taskFrame。`;

  const inputSnippet = rawInput.slice(0, 100);
  const fallbackProposal: IssueProposal = {
    issue_sentence: inputSnippet
      ? `你不是单纯在说「${inputSnippet}」，而是在确认这件事到底该被怎样带进圆桌讨论。`
      : "你不是单纯在处理一个选择，而是在确认这件事真正值得被圆桌讨论的案由是什么。",
    surface_dilemma: {
      title: "具象化的困惑",
      content: inputSnippet
        ? `一边是顺着现有惯性继续处理「${inputSnippet}」，一边是停下来重新确认这件事真正的选择岔路口。`
        : "一边是顺着当前惯性继续处理，一边是停下来重新确认真正的选择岔路口。",
      details: ["继续沿着当前惯性", "重新界定本次议题"],
    },
    current_constraints: {
      title: "真实的处境",
      content: "现有信息还不足以确认全部边界，但这件事已经受到时间、责任、资源和外部评价的共同挤压。",
      details: ["时间窗口", "责任归属", "资源余量", "他人评价"],
    },
    core_fears: {
      title: "隐秘的关切",
      content: "真正牵动你的可能不是单个选项，而是担心一旦处理错，就会失去安全感、体面或对局面的掌控。",
      details: ["安全感", "体面", "对局面的掌控"],
    },
    expected_resolution: {
      title: "渴望的终局",
      content: "这次圆桌要验证：在最坏情况下依然能接受的处理边界是什么，以及哪些声音会把这件事推向不同方向。",
      details: ["明确底线", "看清不同声音的拉扯", "避免把问题继续滚大"],
    },
  };

  const messages: Msg[] = [
    { role: "system", content: SCRIBE_PROPOSE_SYSTEM + buildContextBlock(ctx) },
    { role: "user", content: userMsg },
  ];

  try {
    const validated = await generateValidated(
      messages,
      ProposalResultSchema,
      { temperature: 0.4, max_tokens: 2000, json: true, runtime, fallback: { proposal: fallbackProposal }, ...handlers },
    );

    const proposal = normalizeIssueProposal(validated.proposal as IssueProposal, fallbackProposal);
    const taskFrame = validated.taskFrame
      ? (validated.taskFrame as unknown as TaskFrame)
      : buildTaskFrameFromProposal(proposal)!;

    return { proposal, taskFrame };
  } catch (e) {
    console.warn("[generateIssueProposal] error", e);
    const visible = proposalToTaskFrame(fallbackProposal);
    return {
      proposal: fallbackProposal,
      taskFrame: {
        visible,
        internal: {
          facts: [], parties: [], options: [],
          state_tags: { clarity: "low", decision_readiness: "exploring", urgency: "medium", emotional_charge: "medium" },
          value_axes: [], pressure_sources: [], concern_notes: [],
          source_labels: {}, choice_answers: [],
        },
      },
    };
  }
}

export async function refineProposal(
  rawInput: string,
  dialogue: DefiningDialogue,
  currentProposal: IssueProposal,
  userFeedback: string,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<RefineResult> {
  const dialogueText = serializeDialogue(dialogue);
  const proposalText = JSON.stringify(currentProposal, null, 2);
  const handlers = streamOpts(onPartial);
  const reasoningMemo = await streamScribeReasoning({
    mode: "refine",
    source: "refine",
    rawInput,
    dialogueText,
    currentProposal,
    userFeedback,
    ctx,
    runtime,
    onReasoning: handlers.onReasoning,
  });

  const sys = `${STAGE_ONE_SCRIBE_SYSTEM}

用户在看到《议题提案》后提出了修改意见。你仍然只做阶段一的问题定义：根据用户反馈继续追问，或修正这份进入五声圆桌前的议题提案。

${scribePersonaBlock("brief")}

你需要决定：
1. 如果用户的反馈包含新信息，可能需要追问确认（needMoreInfo: true，输出 questions）
2. 如果可以直接更新提案（needMoreInfo: false，输出更新后的 proposal + taskFrame）

修正标准：
- issue_sentence 必须是一句“本次议题主句”，让用户一眼确认这次圆桌讨论什么。
- 具象化的困惑仍必须是 A vs B 或多重选择岔路。
- 真实的处境只写客观约束。
- 隐秘的关切要向下追到价值/恐惧，但不能替用户贴因果标签。
- 渴望的终局要写成“这次圆桌要验证……”式任务、判断规则、代价排序或观察期，不许替用户决定，也不许复述隐秘关切。
- 不写“待补充/待确认/未知”等占位。
- 不写建议句、诊断句、安慰句。

输出 JSON：
{
  "needMoreInfo": true|false,
  "questions": [...],
  "proposal": {...},
  "taskFrame": {...},
  "thinking": "内部思考"
}`;

  const userMsg = `原始输入：${rawInput}

对话历史：
${dialogueText}

当前提案：
${proposalText}

用户反馈：
${userFeedback}

刚才的自然语言判断过程：
${reasoningMemo || "（没有可用判断过程）"}`;

  try {
    const validated = await generateValidated(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        { role: "user", content: userMsg },
      ],
      RefineResultSchema,
      { temperature: 0.5, max_tokens: 2000, json: true, runtime, fallback: { needMoreInfo: false, thinking: "" }, ...handlers },
    );
    const proposal = validated.proposal
      ? normalizeIssueProposal(validated.proposal as IssueProposal, currentProposal)
      : undefined;
    const taskFrame = validated.taskFrame
      ? (validated.taskFrame as unknown as TaskFrame)
      : proposal
        ? buildTaskFrameFromProposal(proposal) ?? undefined
        : undefined;
    return {
      needMoreInfo: !!validated.needMoreInfo,
      questions: validated.questions
        ? normalizeProbeQuestions(validated.questions, { rawInput, dialogue, reasoningMemo })
        : undefined,
      proposal,
      taskFrame,
      thinking: validated.thinking || "",
    };
  } catch (e) {
    console.warn("[refineProposal] error", e);
    return { needMoreInfo: false, thinking: "修正失败，保留原提案" };
  }
}

export async function generateOpeningTurns(
  taskFrame: TaskFrame,
  issueProposal?: IssueProposal,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<VoiceOpeningTurn[]> {
  const brief = compactRoundtableBrief(taskFrame, issueProposal);
  const now = Date.now();
  const results = await Promise.allSettled(
    VOICE_IDS.map((vid, index) =>
      generateOpeningTurnForVoice(vid, taskFrame, brief, ctx, runtime, now + index),
    ),
  );
  return VOICE_IDS.map((vid, index) => {
    const result = results[index];
    if (result.status === "fulfilled") return result.value;
    console.warn(`[generateOpeningTurns] ${vid} fallback`, result.reason);
    return normalizeOpeningTurn(vid, fallbackOpeningPayload(vid, taskFrame), now + index);
  });
}

async function generateOpeningTurnForVoice(
  voiceId: VoiceId,
  taskFrame: TaskFrame,
  brief: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  at: number,
): Promise<VoiceOpeningTurn> {
  const voice = SELVES[voiceId];
  const fallback = fallbackOpeningPayload(voiceId, taskFrame);
  const sys = `${voice.system_prompt}

你正在参加 ParallelMe 五声圆桌的第一轮立论。
这一轮是结构化开场，不是自由聊天；你只代表「${voice.name}」这一声，不替其他声音综合。
你只能基于用户确认后的《本次议题 + 4 Key》立论，不读取也不引用阶段一书记员的追问过程。

请输出严格 JSON：
{
  "thesis": "当下的痛苦本质是什么，≤36字",
  "pull": "第一步必须做什么，≤32字",
  "concern": "需要承受什么无可挽回的代价，≤36字",
  "protected_value": "我在为用户守护什么底线，≤28字",
  "task_evidence": "来自本次议题的具体线索，≤36字"
}

禁止输出 JSON 以外的任何文字。`;

  const validated = await generateValidated(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      { role: "user", content: `用户确认后的入桌材料：\n${brief}` },
    ],
    VoiceOpeningPayloadResultSchema,
    { temperature: 0.68, max_tokens: 700, json: true, runtime, fallback },
  );
  return normalizeOpeningTurn(voiceId, validated, at);
}

export async function generateRoundtableMove(
  input: RoundtableMoveInput,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<RoundtableMoveResult> {
  const fallback = fallbackRoundtableMove(input);
  const brief = compactRoundtableBrief(input.taskFrame, input.issueProposal);
  const history = serializeRoundtable(input.roundtable);

  if (input.moveType === "continue_all" || input.moveType === "user_to_table") {
    return generateParallelVoiceMove(input, brief, history, ctx, runtime, fallback);
  }

  if (input.moveType === "user_to_voice") {
    return generateSingleVoiceMove(input, brief, history, ctx, runtime, fallback);
  }

  if (input.moveType === "duel") {
    return generateDuelVoiceMove(input, brief, history, ctx, runtime, fallback);
  }

  return fallback;
}

async function generateParallelVoiceMove(
  input: RoundtableMoveInput,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  fallback: RoundtableMoveResult,
): Promise<RoundtableMoveResult> {
  const move = createRoundtableMove(input);
  const at = Date.now();
  const roundIndex = roundIndexForMove(input);
  const results = await Promise.allSettled(
    VOICE_IDS.map((voiceId) =>
      generateVoiceTurnText({
        voiceId,
        mode: input.moveType,
        brief,
        history,
        userText: input.userText,
        ctx,
        runtime,
        fallbackText: fallbackContinuationText(voiceId, input),
        parallelBatch: true,
      }),
    ),
  );

  const turns = VOICE_IDS.map((voiceId, index) => {
    const result = results[index];
    const payload =
      result.status === "fulfilled"
        ? result.value
        : { text: fallbackContinuationText(voiceId, input), refers_to: [] as VoiceId[] };
    if (result.status === "rejected") {
      console.warn(`[generateParallelVoiceMove] ${voiceId} fallback`, result.reason);
    }
    return makeVoiceRoundtableTurn({
      input,
      move,
      voiceId,
      text: payload.text,
      refersTo: payload.refers_to,
      at: at + index,
      roundIndex,
      parallelBatch: true,
    });
  });

  return { move, turns };
}

async function generateSingleVoiceMove(
  input: RoundtableMoveInput,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  fallback: RoundtableMoveResult,
): Promise<RoundtableMoveResult> {
  const voiceId = input.targetVoiceId || ("future" as VoiceId);
  const move = createRoundtableMove(input);
  const roundIndex = roundIndexForMove(input);
  try {
    const payload = await generateVoiceTurnText({
      voiceId,
      mode: input.moveType,
      brief,
      history,
      userText: input.userText,
      ctx,
      runtime,
      fallbackText: fallbackContinuationText(voiceId, input),
      parallelBatch: false,
    });
    return {
      move,
      turns: [
        makeVoiceRoundtableTurn({
          input,
          move,
          voiceId,
          text: payload.text,
          refersTo: payload.refers_to,
          at: Date.now(),
          roundIndex,
          parallelBatch: false,
        }),
      ],
    };
  } catch (err) {
    console.warn("[generateSingleVoiceMove] fallback", err);
    return fallback;
  }
}

async function generateDuelVoiceMove(
  input: RoundtableMoveInput,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  fallback: RoundtableMoveResult,
): Promise<RoundtableMoveResult> {
  if (!input.fromVoiceId || !input.toVoiceId) return fallback;

  const move = createRoundtableMove(input);
  const fallbackDuel = fallback.turns[0]?.duel;
  const questionFallback =
    fallbackDuel?.question || `${voiceName(input.toVoiceId)}，如果只听你，什么代价会被你轻轻放过去？`;
  const responseFallback = fallbackDuel?.response || `我承认有代价，但我守的是${SELVES[input.toVoiceId].core_value}。`;

  try {
    const question = await generateDuelQuestion(
      input.fromVoiceId,
      input.toVoiceId,
      brief,
      history,
      ctx,
      runtime,
      questionFallback,
    );
    const response = await generateDuelResponse(
      input.toVoiceId,
      input.fromVoiceId,
      question,
      brief,
      history,
      ctx,
      runtime,
      responseFallback,
    );
    return {
      move,
      turns: [
        {
          id: id("turn"),
          move_id: move.id,
          trigger: "duel",
          duel: {
            from_voice_id: input.fromVoiceId,
            from_name: voiceName(input.fromVoiceId),
            to_voice_id: input.toVoiceId,
            to_name: voiceName(input.toVoiceId),
            question,
            response: response.response,
          },
          round_index: roundIndexForMove(input),
          at: Date.now(),
        },
      ],
    };
  } catch (err) {
    console.warn("[generateDuelVoiceMove] fallback", err);
    return fallback;
  }
}

async function generateVoiceTurnText({
  voiceId,
  mode,
  brief,
  history,
  userText,
  ctx,
  runtime,
  fallbackText,
  parallelBatch,
}: {
  voiceId: VoiceId;
  mode: RoundtableMoveType;
  brief: string;
  history: string;
  userText?: string;
  ctx?: ContextBundle;
  runtime?: LlmRuntime;
  fallbackText: string;
  parallelBatch: boolean;
}): Promise<{ text: string; refers_to: VoiceId[] }> {
  const voice = SELVES[voiceId];
  const modeInstruction =
    mode === "user_to_table"
      ? `用户刚向全桌发问：${userText || "（未提供文字）"}。五声会同时各自接住这个问题，从自己的位置说话。`
      : mode === "user_to_voice"
        ? `用户这一轮只请你说话：${userText || "（未提供文字）"}。只有你发言，但你仍然能看到完整圆桌历史。`
        : "这是全员自由轮次。五声将同时基于同一份历史快照，各自把这一轮想说的话放到桌面上。";
  const participationRules = parallelBatch
    ? [
        "- 这是并发批次：你不能假装看见本批次里其他声音尚未生成的发言。",
        "- 这一轮不是接力，也不是互相追打；如果承接，只承接已经存在于历史里的内容。",
        "- 你可以接住既有历史和用户问题，但发言重心必须是你自己的立场、判断和保护意图。",
        "- refers_to 固定输出空数组。",
      ].join("\n")
    : [
        "- 这是定向发言：你可以引用历史里任何已经发生的发言，但不要替其他声音说话。",
        "- 如果你明确回应某个声音，把它的 voice_id 放进 refers_to；可选：lay, money, roam, filial, future。",
      ].join("\n");

  const sys = `${voice.system_prompt}

你正在 ParallelMe 五声圆桌的自由讨论阶段发言。
你只代表「${voice.name}」这一声。你不是助手，不做总结，不替用户做最终决定。
五声立论、所有五声发言、用户发言和两声对话都会作为上下文给你。

当前任务：
${modeInstruction}

规则：
- 基于场上已有历史，说出这一轮你最想放到桌面上的判断、担心或提醒。
${participationRules}
- 不要输出 opening 的四格字段，不要说“大家都有道理”，不要端水。
- 非定向对话模式下，不为了冲突而冲突；自然承认分歧即可。
- text ≤120 字，必须像这一声真的在圆桌上说话。

输出严格 JSON：
{"text":"你的本轮发言","refers_to":["money"]}`;

  const validated = await generateValidated(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}`,
      },
    ],
    VoiceTurnTextResultSchema,
    { temperature: 0.76, max_tokens: 650, json: true, runtime, fallback: { text: fallbackText, refers_to: [] } },
  );
  const text = String(validated.text || "").trim() || fallbackText;
  return {
    text,
    refers_to: parallelBatch
      ? []
      : Array.isArray(validated.refers_to)
      ? validated.refers_to.filter(isVoiceId)
      : [],
  };
}

async function generateDuelQuestion(
  fromVoiceId: VoiceId,
  toVoiceId: VoiceId,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  fallbackQuestion: string,
): Promise<string> {
  const from = SELVES[fromVoiceId];
  const sys = `${from.system_prompt}

你正在发起一场定向对话。你能看到完整圆桌历史。
你的任务是代表「${from.name}」，向「${voiceName(toVoiceId)}」提出一个具体追问。

规则：
- 问题必须基于已有历史中的具体立场、代价判断或没说清的地方，不要凭空发明。
- 可以直接指出你担心的代价，但不要攻击人格和身份。
- 只输出一个问题，≤80 字。

输出严格 JSON：{"question":"..."}`;

  const validated = await generateValidated(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      { role: "user", content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}` },
    ],
    DuelQuestionResultSchema,
    { temperature: 0.78, max_tokens: 450, json: true, runtime, fallback: { question: fallbackQuestion } },
  );
  return String(validated.question || "").trim() || fallbackQuestion;
}

async function generateDuelResponse(
  toVoiceId: VoiceId,
  fromVoiceId: VoiceId,
  question: string,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
  fallbackResponse: string,
): Promise<{ response: string }> {
  const to = SELVES[toVoiceId];
  const sys = `${to.system_prompt}

你正在被「${voiceName(fromVoiceId)}」具体追问。你能看到完整圆桌历史和对方刚刚的问题。
你的任务是代表「${to.name}」正面回应，并继续守住你自己的核心价值。

规则：
- 不要端水式综合，也不要替对方总结。
- 可以承认对方说中的部分，但要说清你仍然在守什么底线。
- 回应必须承接完整历史和对方问题。
- response ≤110 字。

输出严格 JSON：{"response":"..."}`;

  const validated = await generateValidated(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}\n\n对方的问题：\n${question}`,
      },
    ],
    DuelResponseResultSchema,
    {
      temperature: 0.76,
      max_tokens: 600,
      json: true,
      runtime,
      fallback: { response: fallbackResponse },
    },
  );
  return {
    response: String(validated.response || "").trim() || fallbackResponse,
  };
}

function createRoundtableMove(input: RoundtableMoveInput): RoundtableMove {
  return {
    id: id("move"),
    type: input.moveType,
    target_voice_id: input.targetVoiceId,
    from_voice_id: input.fromVoiceId,
    to_voice_id: input.toVoiceId,
    user_text: input.userText,
    at: Date.now(),
  };
}

function makeVoiceRoundtableTurn({
  input,
  move,
  voiceId,
  text,
  refersTo,
  at,
  roundIndex,
  parallelBatch,
}: {
  input: RoundtableMoveInput;
  move: RoundtableMove;
  voiceId: VoiceId;
  text: string;
  refersTo: VoiceId[];
  at: number;
  roundIndex: number;
  parallelBatch: boolean;
}): RoundtableTurn {
  return {
    id: id("turn"),
    move_id: move.id,
    trigger: input.moveType,
    voice_id: voiceId,
    name: voiceName(voiceId),
    text,
    user_text: input.userText,
    refers_to: refersTo.length ? refersTo : undefined,
    round_index: roundIndex,
    is_parallel_batch: parallelBatch || undefined,
    at,
  };
}

function roundIndexForMove(input: RoundtableMoveInput): number {
  return input.roundtable.moves.length + 2;
}

export async function generateScribeObservationLedger(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  previousLedger?: ScribeObservationLedger | null,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<ScribeObservationLedger> {
  const fallback = fallbackObservationLedger(taskFrame, issueProposal, roundtable, previousLedger);
  const sys = `你是 ParallelMe v1.0 的书记员。你在五声会谈期间后台观察，不下场、不打断、不改变圆桌。

你的任务不是生成用户可见内容，而是更新内部观察账本，服务最终「书记员问询」与「本心落定」。

${scribePersonaBlock("inquiry")}

任务：
- 观察用户与五声的行为、选择、追问方向和回避处。
- 围绕四类线索更新：被证伪幻想、核心价值主轴、必须接纳的痛苦、最小行动线索。
- 整理五声问过但用户还没有回应的关键问题。
- 可以写“本轮没有形成有效观察”。不要为了显得有洞察强行归因。
- 不做临床诊断，不把用户贴成某种人格，不写治疗建议。
- 只输出自然语言观察，不输出给用户看的话术。

输出严格 JSON：
{
  "observations": [
    {"id":"snake_case","round_index":1,"trigger":"opening","observation":"","attribution":"","module":"creative_hopelessness|core_values|cost_acceptance|minimum_action|none","evidence":[]}
  ],
  "unanswered_questions": [
    {"id":"snake_case","from_voice_id":"future","from_name":"","question":"","why_it_matters":""}
  ],
  "module_signals": {
    "creative_hopelessness": [],
    "core_values": [],
    "cost_acceptance": [],
    "minimum_action": []
  }
}`;

  try {
    const validated = await generateValidated(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
            `已有观察账本：\n${JSON.stringify(previousLedger || emptyObservationLedger(), null, 2)}\n\n` +
            `圆桌记录：\n${serializeRoundtable(roundtable)}\n\n` +
            `请更新观察账本。注意：这份账本不直接展示给用户。`,
        },
      ],
      ScribeObservationLedgerSchema,
      { temperature: 0.35, max_tokens: 1800, json: true, runtime, fallback },
    );
    return normalizeObservationLedger(validated as any, fallback);
  } catch (e) {
    console.warn("[generateScribeObservationLedger] fallback", e);
    return fallback;
  }
}

export async function generateAlignmentInquiry(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  ledger: ScribeObservationLedger | null | undefined,
  inquiryQuestions: ScribeInquiryQuestion[] = [],
  inquiryAnswers: ScribeInquiryAnswer[] = [],
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<InquiryResult> {
  const activeLedger = ledger?.observations?.length
    ? ledger
    : fallbackObservationLedger(taskFrame, issueProposal, roundtable, ledger);
  const fallback = fallbackAlignmentInquiry(taskFrame, issueProposal, activeLedger, inquiryAnswers);
  const sys = `你是 ParallelMe v1.0 的书记员。五声会谈之后，你要通过少量高密度选择题完成最终确认，为「本心落定」做准备。

${scribePersonaBlock("inquiry")}

任务：
- 只基于确认后的议题和书记员观察账本发问。
- 优先处理五声已经问过、但用户没有回应的关键问题。
- 问题服务最终卡片的五个落点：创造性无望宣判、核心价值主轴提取、痛苦接纳契约、最小阻力行动承诺、正反合。
- 每轮最多 1-3 题，每题 2-4 个自然语言选项，最后保留“都不准，我自己说”。
- 如果答案已经足够生成本心落定，readyForReport 设为 true，questions 置空。
- 如果用户回答揭示新矛盾，可以继续追问；不要因为轮次多而草率进入报告。
- 如果缺口很小，只问最能改变最终卡片的一题。
- 如果用户已经清楚表达反对、修正或承诺，不要围绕同一主题重复追问。
- 不输出“后台观察”字样，不告诉用户你在引用观察账本。

规则：
- 不做建议，不替用户选择，不做临床诊断。
- alignmentProfile 只写自然语言观察和已经被问询或圆桌行为支持的倾向。
- 黑格尔结构中：thesis 是用户想坚持的主轴，antithesis 是阻碍他承认主轴的现实恐惧和代价，synthesis 是能被用户认领的本心方向。

输出严格 JSON：
{
  "questions": [
    {"id":"snake_case","question":"","options":[{"id":"snake_case","label":"","meaning":""}]}
  ],
  "readyForReport": false,
  "alignmentProfile": {
    "falsified_fantasy": "",
    "core_value_axis": "",
    "offended_voices": [],
    "accepted_costs": [],
    "refused_costs": [],
    "unresolved_tensions": [],
    "hegelian_synthesis": {"thesis":"","antithesis":"","synthesis":""},
    "user_self_statements": []
  }
}`;

  try {
    const validated = await generateValidated(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
            `书记员观察账本：\n${JSON.stringify(activeLedger, null, 2)}\n\n` +
            `已提出的问题：\n${JSON.stringify(inquiryQuestions, null, 2)}\n\n` +
            `用户已回答：\n${JSON.stringify(inquiryAnswers, null, 2)}\n\n` +
            `请先判断五个落点是否足够，再决定继续问询或生成可供本心落定使用的 alignmentProfile。`,
        },
      ],
      InquiryResultSchema,
      { temperature: 0.45, max_tokens: 2000, json: true, runtime, fallback, ...streamOpts(onPartial) },
    );
    const normalized = normalizeAlignmentInquiry(
      validated as any,
      fallback,
      activeLedger,
      inquiryQuestions,
    );
    return normalized;
  } catch (e) {
    console.warn("[generateAlignmentInquiry] fallback", e);
    return fallback;
  }
}

export async function generateAlignmentReport(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  ledger: ScribeObservationLedger,
  inquiryAnswers: ScribeInquiryAnswer[],
  alignmentProfile: AlignmentProfile,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<AlignmentReport> {
  const fallback = fallbackAlignmentReport(taskFrame, issueProposal, ledger, alignmentProfile);
  const sys = `你是 ParallelMe v1.0 的书记员。请基于本次议题、观察账本和最终问询答案，生成用户可见的「本心落定」。

${scribePersonaBlock("settlement")}

本心落定不是建议书，也不是心理诊断。它是一张单一收束卡片，帮助用户：
1. 对不可能的完美解死心。
2. 看见真正的核心价值主轴。
3. 主动接纳随之而来的具体痛苦。
4. 把宏大叙事切成 24 小时内的微动作。
5. 用正反合把冲突、代价和行动整合成用户能认领的表达。

固定模块：
- creative_hopelessness：创造性无望宣判。report 里写现实报告，不要拆成旧字段。
- core_value_axis：核心价值主轴提取。report 里写主轴和判断规则。
- cost_acceptance_contract：痛苦接纳契约。report 里写“我同意……”式契约，并点明具体痛苦。
- minimum_viable_commitment：最小阻力行动承诺。report 里写 deadline、动作和完成标准，必须能在 24 小时内完成。
- dialectic_synthesis：正反合。thesis 写“正”，antithesis 写“反”，synthesis 写“合”。合要是一段用户可直接修改、可认领的本心表达。

黑格尔正反合：
- 正：核心价值主轴。
- 反：被证伪幻想与必然痛苦。
- 合：用户可以认领的本心方向、契约和微动作。

规则：
- 文案可以锋利，但必须来自账本和用户回答的线索。
- 不说“后台观察”，不展示 schema，不写 confidence，不写选项 id。
- 不做临床诊断，不把失眠、焦虑等归因为唯一原因，除非用户明确这样说。
- 不输出“清明句”“本心对齐报告”“清明落定”等旧产品词。
- 不写“我建议你”。标题里的建议感已经由产品副标题承接，正文只呈现现实、契约和动作。
- 行动必须具体到时间、动作、完成标准。

输出严格 JSON：
{
  "creative_hopelessness": {"title":"创造性无望宣判","report":"","evidence":[]},
  "core_value_axis": {"title":"核心价值主轴提取","report":"","evidence":[]},
  "cost_acceptance_contract": {"title":"痛苦接纳契约","report":"","evidence":[]},
  "minimum_viable_commitment": {"title":"最小阻力行动承诺","report":"","evidence":[]},
  "dialectic_synthesis": {"thesis":"","antithesis":"","synthesis":""}
}`;

  try {
    const draft = await generateValidated(
      [
        { role: "system", content: sys + buildContextBlock(ctx) },
        {
          role: "user",
          content:
            `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
            `书记员观察账本：\n${JSON.stringify(ledger, null, 2)}\n\n` +
            `问询答案：\n${JSON.stringify(inquiryAnswers, null, 2)}\n\n` +
            `本心画像：\n${JSON.stringify(alignmentProfile, null, 2)}`,
        },
      ],
      AlignmentReportSchema,
      { temperature: 0.55, max_tokens: 1900, json: true, runtime, fallback, ...streamOpts(onPartial) },
    );
    return normalizeAlignmentReport(draft as any, fallback);
  } catch (e) {
    console.warn("[generateAlignmentReport] fallback", e);
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
    const profile = await generateValidated(
      [{ role: "system", content: sys }, { role: "user", content: txt }],
      TasteProfileSchema,
      { temperature: 0.7, max_tokens: 300, json: true, runtime, fallback: { themes: [], moods: [], identity_hint: "" } },
    );
    return profile.identity_hint || profile.themes.length || profile.moods.length ? profile : null;
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
      const hasCustom = normalizedOptions.some((o: ChoiceCard["options"][number]) => /不准|自己|补/.test(o.label));
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
    at,
  };
}

function normalizeObservationLedger(parsed: any, fallback: ScribeObservationLedger): ScribeObservationLedger {
  const base = parsed && typeof parsed === "object" ? parsed : {};
  const observations = Array.isArray(base.observations)
    ? base.observations
        .slice(-12)
        .map((o: any, i: number) => ({
          id: String(o.id || `obs_${i + 1}`),
          round_index: typeof o.round_index === "number" ? o.round_index : undefined,
          trigger: String(o.trigger || "summary") as any,
          observation: String(o.observation || "").trim(),
          attribution: String(o.attribution || "").trim(),
          module: safeEnum(
            o.module,
            ["creative_hopelessness", "core_values", "cost_acceptance", "minimum_action", "none"],
            "none",
          ) as ScribeObservationLedger["observations"][number]["module"],
          evidence: stringArrayOr(o.evidence, []),
          at: typeof o.at === "number" ? o.at : Date.now(),
        }))
        .filter((o: ScribeObservationLedger["observations"][number]) => o.observation)
    : fallback.observations;

  const unanswered = Array.isArray(base.unanswered_questions)
    ? base.unanswered_questions
        .slice(0, 8)
        .map((q: any, i: number) => ({
          id: String(q.id || `unanswered_${i + 1}`),
          from_voice_id: isVoiceId(String(q.from_voice_id || "")) ? String(q.from_voice_id) as VoiceId : undefined,
          from_name: q.from_name ? String(q.from_name) : undefined,
          question: String(q.question || "").trim(),
          why_it_matters: String(q.why_it_matters || "").trim(),
          at: typeof q.at === "number" ? q.at : undefined,
        }))
        .filter((q: ScribeObservationLedger["unanswered_questions"][number]) => q.question)
    : fallback.unanswered_questions;

  const signals = base.module_signals || {};
  return {
    observations: observations.length ? observations : fallback.observations,
    unanswered_questions: unanswered,
    module_signals: {
      creative_hopelessness: stringArrayOr(signals.creative_hopelessness, fallback.module_signals.creative_hopelessness).slice(0, 8),
      core_values: stringArrayOr(signals.core_values, fallback.module_signals.core_values).slice(0, 8),
      cost_acceptance: stringArrayOr(signals.cost_acceptance, fallback.module_signals.cost_acceptance).slice(0, 8),
      minimum_action: stringArrayOr(signals.minimum_action, fallback.module_signals.minimum_action).slice(0, 8),
    },
    updated_at: typeof base.updated_at === "number" ? base.updated_at : Date.now(),
  };
}

function normalizeAlignmentInquiry(
  parsed: any,
  fallback: InquiryResult,
  ledger: ScribeObservationLedger,
  previousQuestions: ScribeInquiryQuestion[] = [],
): InquiryResult {
  const previousTexts = previousQuestions.map((question) => question.question);
  const seenTexts: string[] = [];
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .slice(0, 3)
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
        .filter((q: ScribeInquiryQuestion) => {
          if (!q.question || q.options.length < 2) return false;
          if (previousTexts.some((text) => areSimilarQuestions(text, q.question))) return false;
          if (seenTexts.some((text) => areSimilarQuestions(text, q.question))) return false;
          seenTexts.push(q.question);
          return true;
        })
    : [];
  const fallbackQuestions = fallback.questions
    .filter((q) => !previousTexts.some((text) => areSimilarQuestions(text, q.question)))
    .slice(0, 3);
  const normalizedQuestions = questions.length ? questions : fallbackQuestions;
  for (const q of normalizedQuestions) {
    if (!q.options.some((o: ScribeInquiryQuestion["options"][number]) => /不准|自己|补/.test(o.label)) && q.options.length >= 4) {
      q.options.splice(3, q.options.length - 3, { id: "custom", label: "都不准，我自己说" });
    } else if (!q.options.some((o: ScribeInquiryQuestion["options"][number]) => /不准|自己|补/.test(o.label))) {
      q.options.push({ id: "custom", label: "都不准，我自己说" });
    }
    q.options = q.options.slice(0, 4);
  }
  const ready = Boolean(parsed.readyForReport) || (questions.length === 0 && fallback.readyForReport);
  return {
    questions: ready ? [] : normalizedQuestions,
    readyForReport: ready,
    alignmentProfile: normalizeAlignmentProfile(parsed.alignmentProfile || parsed.alignment_profile, fallback.alignmentProfile),
    ledger,
  };
}

function normalizeAlignmentProfile(input: any, fallback: AlignmentProfile): AlignmentProfile {
  const offended = Array.isArray(input?.offended_voices)
    ? input.offended_voices.filter((id: any) => isVoiceId(String(id))).map((id: any) => String(id) as VoiceId)
    : fallback.offended_voices;
  return {
    falsified_fantasy: stringOr(input?.falsified_fantasy, fallback.falsified_fantasy),
    core_value_axis: stringOr(input?.core_value_axis, fallback.core_value_axis),
    offended_voices: offended,
    accepted_costs: stringArrayOr(input?.accepted_costs, fallback.accepted_costs),
    refused_costs: stringArrayOr(input?.refused_costs, fallback.refused_costs),
    unresolved_tensions: stringArrayOr(input?.unresolved_tensions, fallback.unresolved_tensions),
    hegelian_synthesis: {
      thesis: stringOr(input?.hegelian_synthesis?.thesis, fallback.hegelian_synthesis.thesis),
      antithesis: stringOr(input?.hegelian_synthesis?.antithesis, fallback.hegelian_synthesis.antithesis),
      synthesis: stringOr(input?.hegelian_synthesis?.synthesis, fallback.hegelian_synthesis.synthesis),
    },
    user_self_statements: stringArrayOr(input?.user_self_statements, fallback.user_self_statements),
  };
}

function normalizeAlignmentReport(input: any, fallback: AlignmentReport): AlignmentReport {
  const oldCosts = Array.isArray(input?.cost_acceptance_contract?.accepted_costs)
    ? input.cost_acceptance_contract.accepted_costs
        .slice(0, 5)
        .map((c: any) => {
          const voice = isVoiceId(String(c.voice_id || "")) ? `${voiceName(String(c.voice_id) as VoiceId)}：` : "";
          const cost = String(c.cost || "").trim();
          const pain = String(c.pain || "").trim();
          return `${voice}${cost}${pain ? `；${pain}` : ""}`;
        })
        .filter(Boolean)
    : [];
  const oldActions = Array.isArray(input?.minimum_viable_commitment?.actions)
    ? input.minimum_viable_commitment.actions
        .slice(0, 2)
        .map((a: any) => {
          const deadline = String(a.deadline || "").trim();
          const action = String(a.action || "").trim();
          const criteria = String(a.acceptance_criteria || "").trim();
          return [deadline, action].filter(Boolean).join("：") + (criteria ? `\n完成标准：${criteria}` : "");
        })
        .filter(Boolean)
    : [];
  return {
    creative_hopelessness: normalizeSettlementModule(
      input?.creative_hopelessness,
      fallback.creative_hopelessness,
      "创造性无望宣判",
      [input?.creative_hopelessness?.verdict, input?.creative_hopelessness?.falsified_coordinate].filter(Boolean).join("\n"),
    ),
    core_value_axis: normalizeSettlementModule(
      input?.core_value_axis,
      fallback.core_value_axis,
      "核心价值主轴提取",
      [input?.core_value_axis?.primary_vector, input?.core_value_axis?.decision_rule].filter(Boolean).join("\n"),
    ),
    cost_acceptance_contract: normalizeSettlementModule(
      input?.cost_acceptance_contract,
      fallback.cost_acceptance_contract,
      "痛苦接纳契约",
      [input?.cost_acceptance_contract?.contract_sentence, ...oldCosts].filter(Boolean).join("\n"),
    ),
    minimum_viable_commitment: normalizeSettlementModule(
      input?.minimum_viable_commitment,
      fallback.minimum_viable_commitment,
      "最小阻力行动承诺",
      oldActions.join("\n"),
    ),
    dialectic_synthesis: {
      thesis: stringOr(input?.dialectic_synthesis?.thesis, fallback.dialectic_synthesis.thesis),
      antithesis: stringOr(input?.dialectic_synthesis?.antithesis, fallback.dialectic_synthesis.antithesis),
      synthesis: stringOr(input?.dialectic_synthesis?.synthesis || input?.clarity_sentence, fallback.dialectic_synthesis.synthesis),
      user_revision: typeof input?.dialectic_synthesis?.user_revision === "string"
        ? input.dialectic_synthesis.user_revision
        : undefined,
    },
  };
}

function normalizeSettlementModule(
  input: any,
  fallback: AlignmentReport["creative_hopelessness"],
  title: string,
  oldReport = "",
): AlignmentReport["creative_hopelessness"] {
  const status = input?.user_feedback?.status === "agree" || input?.user_feedback?.status === "disagree"
    ? input.user_feedback.status
    : undefined;
  const userText = typeof input?.user_feedback?.user_text === "string"
    ? input.user_feedback.user_text.trim()
    : "";
  return {
    title: stringOr(input?.title, fallback.title || title),
    report: stringOr(input?.report || oldReport, fallback.report),
    evidence: stringArrayOr(input?.evidence, fallback.evidence || []),
    user_feedback: status
      ? {
          status,
          user_text: userText || undefined,
        }
      : fallback.user_feedback,
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
      thesis: "过载正在吞掉你的判断力。",
      protected_value: "身心健康与神经系统",
      concern: "短期成就感会被放下。",
      task_evidence: focus.slice(0, 34),
      pull: "先停止加码，睡一觉再回看。",
    },
    money: {
      thesis: "现金流不足会放大恐惧。",
      protected_value: "生存底线与选择权",
      concern: "理想主义要先被标价。",
      task_evidence: focus.slice(0, 34),
      pull: "先算清安全垫和机会成本。",
    },
    roam: {
      thesis: "现有轨道压住了生命力。",
      protected_value: "自由与真实性",
      concern: "要承受试错和失败。",
      task_evidence: focus.slice(0, 34),
      pull: "给自己留一个真实出口。",
    },
    filial: {
      thesis: "选择会牵动重要关系。",
      protected_value: "家庭连接与责任",
      concern: "不能享有绝对自由。",
      task_evidence: focus.slice(0, 34),
      pull: "先和关键的人说清楚。",
    },
    future: {
      thesis: "当下情绪遮住了长期路。",
      protected_value: "未来连续性",
      concern: "要忍受慢反馈和孤独。",
      task_evidence: focus.slice(0, 34),
      pull: "把选择放进五年后回看。",
    },
  };
  return map[vid];
}

function fallbackRoundtableMove(input: RoundtableMoveInput): RoundtableMoveResult {
  const at = Date.now();
  const roundIndex = roundIndexForMove(input);
  const move: RoundtableMove = {
    id: id("move"),
    type: input.moveType,
    target_voice_id: input.targetVoiceId,
    from_voice_id: input.fromVoiceId,
    to_voice_id: input.toVoiceId,
    user_text: input.userText,
    at,
  };

  if (input.moveType === "duel" && input.fromVoiceId && input.toVoiceId) {
    return {
      move,
      turns: [
        {
          id: id("turn"),
          move_id: move.id,
          trigger: "duel",
          duel: {
            from_voice_id: input.fromVoiceId,
            from_name: voiceName(input.fromVoiceId),
            to_voice_id: input.toVoiceId,
            to_name: voiceName(input.toVoiceId),
            question: `${voiceName(input.toVoiceId)}，如果只听你，什么代价会被你轻轻放过去？`,
            response: `我承认有代价，但我守的是${SELVES[input.toVoiceId].core_value}。`,
          },
          round_index: roundIndex,
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
  return {
    move,
    turns: voices.map((vid) => ({
      id: id("turn"),
      move_id: move.id,
      trigger: input.moveType,
      voice_id: vid,
      name: voiceName(vid),
      text: fallbackContinuationText(vid, input),
      user_text: input.userText,
      round_index: roundIndex,
      is_parallel_batch:
        input.moveType === "continue_all" || input.moveType === "user_to_table" || undefined,
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

function emptyObservationLedger(): ScribeObservationLedger {
  return {
    observations: [],
    unanswered_questions: [],
    module_signals: {
      creative_hopelessness: [],
      core_values: [],
      cost_acceptance: [],
      minimum_action: [],
    },
    updated_at: Date.now(),
  };
}

function fallbackObservationLedger(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  previousLedger?: ScribeObservationLedger | null,
): ScribeObservationLedger {
  const issue = compactRoundtableBrief(taskFrame, issueProposal);
  const previous = previousLedger || emptyObservationLedger();
  const now = Date.now();
  const unanswered = roundtable.turns
    .filter((t) => t.duel?.question || /[？?]/.test(t.text || ""))
    .slice(-5)
    .map((t, i) => ({
      id: `unanswered_${now}_${i}`,
      from_voice_id: t.voice_id,
      from_name: t.name,
      question: t.duel?.question || t.text || "",
      why_it_matters: "这句话可能关系到用户最终愿意认领哪一种痛苦。",
      at: t.at,
    }));
  const observations = previous.observations.length
    ? previous.observations
    : [
        {
          id: `obs_${now}`,
          trigger: "summary" as const,
          observation: "本轮只形成了基础议题线索，还需要最终问询确认。",
          attribution: "目前不能强行归因，只能把选择岔路和代价先放在桌面上。",
          module: "none" as const,
          evidence: [issue],
          at: now,
        },
      ];
  return {
    observations,
    unanswered_questions: previous.unanswered_questions.length ? previous.unanswered_questions : unanswered,
    module_signals: {
      creative_hopelessness: previous.module_signals.creative_hopelessness.length
        ? previous.module_signals.creative_hopelessness
        : [taskFrame.visible.core_conflict].filter(Boolean),
      core_values: previous.module_signals.core_values.length
        ? previous.module_signals.core_values
        : [taskFrame.visible.central_question].filter(Boolean),
      cost_acceptance: previous.module_signals.cost_acceptance.length
        ? previous.module_signals.cost_acceptance
        : taskFrame.visible.main_concerns.slice(0, 3),
      minimum_action: previous.module_signals.minimum_action,
    },
    updated_at: now,
  };
}

function fallbackAlignmentInquiry(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  ledger: ScribeObservationLedger,
  answers: ScribeInquiryAnswer[],
): InquiryResult {
  const userStatements = answers.map((a) => a.custom_text || a.selected_label).filter(Boolean);
  const answeredEnough = answers.length >= 2;
  const firstUnanswered = ledger.unanswered_questions[0];
  const questions: ScribeInquiryQuestion[] = answeredEnough
    ? []
    : [
        {
          id: "falsified_fantasy",
          question: firstUnanswered?.question || "如果必须承认一条路不存在，你最不愿意放下的是哪一种“既要又要”？",
          options: [
            { id: "safety_growth", label: "既想要足够安全，又想要立刻获得巨大成长" },
            { id: "approval_autonomy", label: "既想完全自主，又想不让重要的人失望" },
            { id: "no_loss", label: "既想换一种活法，又想不损失现在拥有的一切" },
            { id: "custom", label: "都不准，我自己说" },
          ],
        },
        {
          id: "accepted_pain",
          question: "为了更靠近你的主轴，你此刻愿意先吞下哪一种具体的痛？",
          options: [
            { id: "money", label: "收益或安全感短期没有最大化" },
            { id: "comparison", label: "看到同龄人走得更稳时产生落差和怀疑" },
            { id: "relationship", label: "让重要关系里的人继续担心或不理解一段时间" },
            { id: "custom", label: "都不准，我自己说" },
          ],
        },
      ];
  const core = ledger.module_signals.core_values[0] || taskFrame.visible.central_question;
  return {
    questions,
    readyForReport: answeredEnough,
    ledger,
    alignmentProfile: {
      falsified_fantasy: ledger.module_signals.creative_hopelessness[0] || taskFrame.visible.core_conflict,
      core_value_axis: core,
      offended_voices: ["money", "filial", "lay"].filter((id) => isVoiceId(id)) as VoiceId[],
      accepted_costs: userStatements.length ? userStatements : ledger.module_signals.cost_acceptance,
      refused_costs: [],
      unresolved_tensions: [taskFrame.visible.core_conflict].filter(Boolean),
      hegelian_synthesis: {
        thesis: core,
        antithesis: ledger.module_signals.creative_hopelessness[0] || taskFrame.visible.core_conflict,
        synthesis: `先承认${issueProposal?.expected_resolution.content || taskFrame.visible.central_question}`,
      },
      user_self_statements: userStatements,
    },
  };
}

function fallbackAlignmentReport(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  ledger: ScribeObservationLedger,
  alignmentProfile: AlignmentProfile,
): AlignmentReport {
  const firstAction = issueProposal?.current_constraints.details[0] || "写下一个 24 小时内可验证的小事实";
  const primary = alignmentProfile.core_value_axis || ledger.module_signals.core_values[0] || taskFrame.visible.central_question;
  const fantasy = alignmentProfile.falsified_fantasy || ledger.module_signals.creative_hopelessness[0] || taskFrame.visible.core_conflict;
  const acceptedCosts = (alignmentProfile.accepted_costs.length ? alignmentProfile.accepted_costs : taskFrame.visible.main_concerns)
    .slice(0, 3);
  return {
    creative_hopelessness: {
      title: "创造性无望宣判",
      report: `这个幻想被证伪了：${fantasy}。继续寻找一条完全不需要代价、却能同时满足所有声音的路，只会把真正需要面对的选择推迟到下一轮内耗里。`,
      evidence: ledger.observations.slice(0, 3).map((o) => o.observation),
    },
    core_value_axis: {
      title: "核心价值主轴提取",
      report: `此刻最需要被优先服务的主轴是：${primary}。接下来的判断先服务这个主轴；不能增加它、反而只是在拖延承认现实的事情，先降级。`,
      evidence: (alignmentProfile.refused_costs.length
        ? alignmentProfile.refused_costs
        : taskFrame.visible.main_concerns.slice(0, 3)),
    },
    cost_acceptance_contract: {
      title: "痛苦接纳契约",
      report: `我同意：为了走向第一主轴，我愿意让一部分声音暂时不被完整安抚。${acceptedCosts.join("；")}。我承认这部分会不舒服，但不再让它偷偷替我否决主轴。`,
      evidence: acceptedCosts,
    },
    minimum_viable_commitment: {
      title: "最小阻力行动承诺",
      report: `今晚 24:00 前：${firstAction}。完成标准：留下一个可回看的文档、清单或数字结果，而不是只在脑子里想过。`,
      evidence: [firstAction],
    },
    dialectic_synthesis: {
      thesis: primary,
      antithesis: fantasy,
      synthesis: `本心是：我先承认“${fantasy}”这条完美路不存在，再用一个小动作服务“${primary}”。`,
    },
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

export function getIntegrationMeta() {
  return {
    name: "ParallelMe",
    name_zh: "平行的我",
    one_liner: "书记员牵引的固定五声圆桌，帮助用户把议题定义清楚并完成本心落定。",
    architecture:
      "scribe-guided issue proposal + fixed five-voice opening + free roundtable actions + invisible scribe observation + alignment inquiry + alignment report",
    selves: SELVES_META,
    endpoints: {
      task_frame: "/api/task-frame",
      roundtable: "/api/roundtable",
      scribe_observation: "/api/scribe-observation",
      alignment_inquiry: "/api/alignment-inquiry",
      alignment_report: "/api/alignment-report",
    },
  };
}
