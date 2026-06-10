// lib/llm.ts — v1 provider-aware orchestration.
// The product path is now: issue proposal -> five-voice roundtable ->
// invisible scribe observation -> scribe inquiry -> alignment report.
//
// Production patterns applied:
// - Vercel AI SDK for text streaming plus strict object generation via llm-strict
// - LlmError typed error class with error codes
// - Exponential backoff retry with rate-limit header respect
// - Schema validation and repair via the shared strict LLM harness

import { generateText, streamText } from "ai";
import { createProvider } from "./ai-provider";
import { compactDialogue, compactRoundtable } from "./context-manager";
import {
  extractAnchorTerms,
  hasVisibleReasoningLeak,
  sanitizeVisibleReasoning,
} from "./llm-harness";
import {
  generateStrictObjectAttempt,
  runStrictScribeLoop,
} from "./llm-strict";

import {
  StrictAlignmentReportSchema,
  StrictProposalResultSchema,
  StrictRefineResultSchema,
  StrictDuelQuestionSchema,
  StrictDuelResponseSchema,
  StrictRoundtableVoiceTurnSchema,
  StrictScribeObservationLedgerSchema,
  StrictTasteProfileSchema,
  StrictVoiceOpeningPayloadResultSchema,
  StrictInquiryResultSchema,
  StrictProbeResultSchema,
  type ValidatedStrictAlignmentReport,
  type ValidatedStrictDuelQuestion,
  type ValidatedStrictDuelResponse,
  type ValidatedStrictInquiryResult,
  type ValidatedStrictProposalResult,
  type ValidatedStrictRefineResult,
  type ValidatedStrictRoundtableVoiceTurn,
  type ValidatedStrictScribeObservationLedger,
  type ValidatedStrictTasteProfile,
  type ValidatedStrictVoiceOpeningPayloadResult,
  type ValidatedStrictProbeResult,
} from "./schema";

import { SELVES, SELVES_META } from "./selves";
import { scribePersonaBlock } from "./scribe";
import type { ScribeStreamEvent } from "./agents/events";
import {
  VOICE_IDS,
  isVoiceId,
  voiceName,
  proposalToTaskFrame,
  type AlignmentProfile,
  type AlignmentReport,
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
  type ScribeProbeOption,
  type ScribeQuestion,
  type TaskFrame,
  type VoiceId,
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

function splitAiSdkPrompt(messages: Msg[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n") || undefined;
  const modelMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));
  return { system, messages: modelMessages };
}

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
  confidence?: number;
  missingModules?: string[];
}

function resolveRuntime(rt?: LlmRuntime) {
  return {
    apiKey: rt?.apiKey || ENV_API_KEY,
    baseUrl: rt?.baseUrl || ENV_API_BASE,
    model: rt?.model || ENV_MODEL,
  };
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
  onEvent?: (event: ScribeStreamEvent) => void;
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
    const prompt = splitAiSdkPrompt(messages);
    const result = await generateText({
      model,
      ...prompt,
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

// ─── 议题定义阶段重构：对话式追问 + 4-Key 提案 ───

export interface ProbeResult {
  questions: ScribeQuestion[];
  readyToPropose: boolean;
  thinking: string;
  confidence?: number;
  missingKeys?: ProbePurpose[];
}

const PROBE_PURPOSES = [
  "surface_dilemma",
  "current_constraints",
  "core_fears",
  "expected_resolution",
] as const;

export type ProbePurpose = (typeof PROBE_PURPOSES)[number];

const PROBE_PURPOSE_LABEL: Record<ProbePurpose, string> = {
  surface_dilemma: "选择岔路",
  current_constraints: "现实边界",
  core_fears: "隐秘关切",
  expected_resolution: "圆桌验证任务",
};

const MIN_PROBE_USER_ANSWERS = 4;
const MIN_ARTICULATED_ANSWERS = 1;
const MIN_BOUNDARY_CONFIRMATIONS = 1;

interface ProbePurposeEvidence {
  answered: boolean;
  selectedCount: number;
  articulatedCount: number;
  snippets: string[];
}

type ProbeEvidenceMap = Record<ProbePurpose, ProbePurposeEvidence>;

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 7) || "0";
}

function textSnippet(text: string, max = 34): string {
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/^(书记员问|用户答|用户选择|用户补充|对应问题|原始输入)[:：]\s*/g, "")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function optionId(label: string, index: number): string {
  return `option_${index + 1}_${hashText(label)}`;
}

function naturalOptions(labels: string[]): ScribeProbeOption[] {
  const seen = new Set<string>();
  const options = labels
    .map((label) => label.trim())
    .filter(Boolean)
    .filter((label) => {
      const key = normalizeQuestionText(label);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((label, index) => ({ id: optionId(label, index), label }));

  return [...options, { id: "custom", label: "都不准，我自己说" }];
}

function emptyProbeEvidence(): ProbeEvidenceMap {
  return PROBE_PURPOSES.reduce((acc, purpose) => {
    acc[purpose] = {
      answered: false,
      selectedCount: 0,
      articulatedCount: 0,
      snippets: [],
    };
    return acc;
  }, {} as ProbeEvidenceMap);
}

function isArticulatedAnswer(answer: ScribeAnswer, selectedLabel: string): boolean {
  const free = answer.free_text?.trim() || "";
  if (free.length >= 8) return true;
  if (!selectedLabel || isGenericProbeChoice(selectedLabel)) return false;
  return selectedLabel.length >= 22;
}

function isGenericProbeChoice(text: string): boolean {
  return /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(text.trim());
}

function isBoundaryConfirmation(text: string): boolean {
  return /(一变|什么情况下|边界|底线|最坏|失败成本|代价|不能碰|可以承受|观察期|验证|判断规则|停|继续|扛不住|条件)/.test(text);
}

interface ProbeCoverage {
  combined: string;
  reasoningMemo: string;
  userAnswerCount: number;
  articulatedAnswerCount: number;
  boundaryAnswerCount: number;
  askedPurposes: Set<ProbePurpose>;
  answeredPurposes: Set<ProbePurpose>;
  askedTexts: string[];
  evidence: ProbeEvidenceMap;
  rawSignals: Record<ProbePurpose, boolean>;
  has: Record<ProbePurpose, boolean>;
  missing: ProbePurpose[];
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
  const evidence = emptyProbeEvidence();
  const textParts = [rawInput];
  let articulatedAnswerCount = 0;
  let boundaryAnswerCount = 0;

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
      const selectedLabel = entry.answer.selected_option_label
        || question?.options.find((option) => option.id === entry.answer?.selected_option_id)?.label
        || "";
      const answerText = [
        entry.answer.question_text,
        selectedLabel,
        entry.answer.free_text,
      ].filter(Boolean).join(" ");
      textParts.push(answerText);

      const purpose = normalizeProbePurpose(question?.purpose) || inferProbePurpose(entry.answer.question_text || "");
      if (purpose && answerText.trim()) {
        answeredPurposes.add(purpose);
        const purposeEvidence = evidence[purpose];
        purposeEvidence.answered = true;
        if (selectedLabel && !isGenericProbeChoice(selectedLabel)) {
          purposeEvidence.selectedCount += 1;
        }
        if (isArticulatedAnswer(entry.answer, selectedLabel)) {
          purposeEvidence.articulatedCount += 1;
          articulatedAnswerCount += 1;
        }
        if (isBoundaryConfirmation(answerText)) {
          boundaryAnswerCount += 1;
        }
        const snippet = textSnippet(entry.answer.free_text || selectedLabel || answerText, 48);
        if (snippet) purposeEvidence.snippets.push(snippet);
      }
    }
  }

  const combined = textParts.filter(Boolean).join("\n");
  const userAnswerCount = dialogue.filter((entry) => entry.role === "user").length;
  const rawSignals: Record<ProbePurpose, boolean> = {
    surface_dilemma: /(还是|要不要|该不该|留在|回|考公|辞职|选择|一边|另一边|vs|VS|还是说|A|B|哪条路|岔路)/.test(combined),
    current_constraints: /(\d|月薪|年薪|收入|房|钱|父母|妈妈|母亲|老家|大厂|稳定|压力|年龄|时间|健康|婚|孩子|债|存款|合同|签证|身体|睡眠|失败成本|现金流)/.test(combined),
    core_fears: /(害怕|担心|怕|焦虑|愧疚|不甘心|后悔|自由|体面|安全感|价值|身份|尊严|掌控|亏欠|内疚|想证明|不想失去|失去|底线)/.test(combined),
    expected_resolution: /(希望|想让|想知道|验证|确认|看清|圆桌|讨论|帮我|判断规则|产出|结论|代价排序|观察期|下一步验证)/.test(combined),
  };
  const has: Record<ProbePurpose, boolean> = {
    surface_dilemma: answeredPurposes.has("surface_dilemma") || rawSignals.surface_dilemma,
    current_constraints: answeredPurposes.has("current_constraints") || rawSignals.current_constraints,
    core_fears: answeredPurposes.has("core_fears") || rawSignals.core_fears,
    expected_resolution: answeredPurposes.has("expected_resolution") || rawSignals.expected_resolution,
  };

  return {
    combined,
    reasoningMemo,
    userAnswerCount,
    articulatedAnswerCount,
    boundaryAnswerCount,
    askedPurposes,
    answeredPurposes,
    askedTexts,
    evidence,
    rawSignals,
    has,
    missing: PROBE_PURPOSES.filter((purpose) => !has[purpose]),
  };
}

function readinessBlockingPurposes(coverage: ProbeCoverage): ProbePurpose[] {
  const blockers: ProbePurpose[] = [];

  for (const purpose of PROBE_PURPOSES) {
    if (!coverage.answeredPurposes.has(purpose)) {
      blockers.push(purpose);
    }
  }

  if (coverage.userAnswerCount < MIN_PROBE_USER_ANSWERS) {
    for (const purpose of PROBE_PURPOSES) {
      if (!coverage.answeredPurposes.has(purpose)) blockers.push(purpose);
    }
  }

  if (coverage.articulatedAnswerCount < MIN_ARTICULATED_ANSWERS) {
    blockers.push("core_fears", "surface_dilemma");
  }

  if (coverage.boundaryAnswerCount < MIN_BOUNDARY_CONFIRMATIONS) {
    blockers.push("current_constraints", "expected_resolution");
  }

  return dedupeProbePurposes(blockers);
}

function readinessIssues(coverage: ProbeCoverage): string[] {
  const issues: string[] = [];
  const unanswered = PROBE_PURPOSES.filter((purpose) => !coverage.answeredPurposes.has(purpose));
  if (unanswered.length) {
    issues.push(`还有 ${unanswered.map((purpose) => PROBE_PURPOSE_LABEL[purpose]).join("、")} 没有被用户亲口确认`);
  }
  if (coverage.userAnswerCount < MIN_PROBE_USER_ANSWERS) {
    issues.push(`用户回答只有 ${coverage.userAnswerCount} 条，少于阶段一最低探索门槛 ${MIN_PROBE_USER_ANSWERS} 条`);
  }
  if (coverage.articulatedAnswerCount < MIN_ARTICULATED_ANSWERS) {
    issues.push("还缺至少一处用户自己的展开，不能只靠点选项成案");
  }
  if (coverage.boundaryAnswerCount < MIN_BOUNDARY_CONFIRMATIONS) {
    issues.push("还缺现实边界或最坏情形测试");
  }
  return issues;
}

function dedupeProbePurposes(purposes: ProbePurpose[]): ProbePurpose[] {
  const seen = new Set<ProbePurpose>();
  const result: ProbePurpose[] = [];
  for (const purpose of purposes) {
    if (seen.has(purpose)) continue;
    seen.add(purpose);
    result.push(purpose);
  }
  return result;
}

function rankProbePurposes(coverage: ProbeCoverage, purposes: ProbePurpose[] = coverage.missing): ProbePurpose[] {
  const scores = new Map<ProbePurpose, number>();
  const reasoning = coverage.reasoningMemo;
  for (const purpose of purposes) {
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
  return [...purposes].sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
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
  return readinessIssues(coverage).length > 0;
}

function probeAuditForPrompt(rawInput: string, dialogue: DefiningDialogue, reasoningMemo: string): string {
  const coverage = collectProbeCoverage(rawInput, dialogue, reasoningMemo);
  const issues = readinessIssues(coverage);
  const blockers = readinessBlockingPurposes(coverage);
  const ranked = rankProbePurposes(coverage, blockers);
  const answered = PROBE_PURPOSES
    .filter((purpose) => coverage.answeredPurposes.has(purpose))
    .map((purpose) => PROBE_PURPOSE_LABEL[purpose]);
  const asked = PROBE_PURPOSES
    .filter((purpose) => coverage.askedPurposes.has(purpose))
    .map((purpose) => PROBE_PURPOSE_LABEL[purpose]);

  return [
    `用户回答数：${coverage.userAnswerCount}/${MIN_PROBE_USER_ANSWERS}`,
    `用户自然展开数：${coverage.articulatedAnswerCount}/${MIN_ARTICULATED_ANSWERS}`,
    `边界确认数：${coverage.boundaryAnswerCount}/${MIN_BOUNDARY_CONFIRMATIONS}`,
    `已经问过：${asked.join("、") || "无"}`,
    `已经由用户回答覆盖：${answered.join("、") || "无"}`,
    `本轮仍需补足：${ranked.map((purpose) => PROBE_PURPOSE_LABEL[purpose]).join("、") || "无"}`,
    `不能成案的原因：${issues.join("；") || "四个 Key 已经足够，可以进入提案"}`,
  ].join("\n");
}

const FORBIDDEN_PROBE_TEMPLATE_RE =
  /(如果先把情绪放旁边|这件事里，哪个现实条件是真的会卡住选择|这条职业路最需要被切成|先不谈该选哪边，真正让你心里发紧|这次圆桌不是替你做决定，而是要帮你验证哪一种判断规则|我不复读上一题，只校对岔路|我只补现实边界)/;

const PROBE_ANCHOR_DICTIONARY = [
  "辞职",
  "裸辞",
  "跳槽",
  "读博",
  "考博",
  "博士",
  "读研",
  "考研",
  "考公",
  "大厂",
  "国企",
  "体制",
  "父母",
  "爸妈",
  "稳定",
  "老家",
  "月薪",
  "年薪",
  "收入",
  "现金流",
  "存款",
  "年龄",
  "兴趣",
  "业务",
  "代码",
  "code",
  "AI",
  "工作",
  "职业",
  "offer",
  "对象",
  "结婚",
  "分手",
  "房",
  "买房",
  "孩子",
  "健康",
  "睡眠",
  "加班",
  "自由",
  "安全感",
  "后悔",
  "来不及",
] as const;

const INTERNAL_PROMPT_ANCHOR_RE =
  /\b(?:Surface|Dilemma|Current|Constraints|Core|Values?|Fears?|Expected|Resolution|Key|Keys?|JSON|schema|action|proposal|probe|inquiry|module|missing|ready|confidence|question|questions|option|options)\b|[a-z]+(?:_[a-z]+)+/gi;

function extractProbeAnchorTerms(text: string, limit = 12): string[] {
  return extractAnchorTerms(text.replace(INTERNAL_PROMPT_ANCHOR_RE, " "), {
    dictionary: PROBE_ANCHOR_DICTIONARY,
    limit,
  });
}

function probeAnchorSource(rawInput: string, dialogue: DefiningDialogue): string {
  const answerParts = dialogue
    .filter((entry) => entry.role === "user" && entry.answer)
    .map((entry) => [
      entry.answer?.selected_option_label,
      entry.answer?.free_text,
    ].filter(Boolean).join("\n"));
  return [rawInput, ...answerParts].filter(Boolean).join("\n");
}

function textIncludesAnchor(text: string, anchor: string): boolean {
  return text.toLowerCase().includes(anchor.toLowerCase());
}

function validateStrictProbeQuality(
  strict: ValidatedStrictProbeResult,
  normalizedQuestions: ScribeQuestion[],
  rawInput: string,
  dialogue: DefiningDialogue,
  reasoningMemo: string,
): string[] {
  const errors: string[] = [];
  const coverage = collectProbeCoverage(rawInput, dialogue, reasoningMemo);

  if (strict.action === "issue_proposal") {
    const issues = readinessIssues(coverage);
    if (issues.length) {
      errors.push(`还不能进入提案：${issues.join("；")}`);
    }
    return errors;
  }

  if (strict.readyToPropose) {
    errors.push("继续追问时不要同时宣称已经可以进入提案。");
  }

  if (normalizedQuestions.length < 1) {
    errors.push("继续追问时必须给出至少一个能直接展示给用户的问题。");
  }

  const allQuestionText = normalizedQuestions
    .map((question) => `${question.text} ${question.options.map((option) => option.label).join(" ")}`)
    .join("\n");

  if (FORBIDDEN_PROBE_TEMPLATE_RE.test(allQuestionText)) {
    errors.push("追问仍像固定模板，没有体现这轮判断和用户原文。");
  }

  const anchorText = probeAnchorSource(rawInput, dialogue);
  const anchors = extractProbeAnchorTerms(anchorText);
  const anchorHits = anchors.filter((anchor) => textIncludesAnchor(allQuestionText, anchor));
  if (anchors.length >= 2 && anchorHits.length === 0) {
    errors.push("问题和选项没有贴住用户原文或回答里的具体名词、数字、关系。");
  }

  for (const question of normalizedQuestions) {
    if (coverage.askedTexts.some((text) => areSimilarQuestions(text, question.text))) {
      errors.push(`追问重复了历史问题：「${question.text}」`);
    }
    const nonCustomOptions = question.options.filter((option) => !isCustomFreeTextOption(option));
    if (nonCustomOptions.length < 2) {
      errors.push(`问题「${question.text}」缺少至少两个真实可选回应`);
    }
    if (!question.options.some(isCustomFreeTextOption)) {
      errors.push(`问题「${question.text}」缺少“都不准，我自己说”选项`);
    }
  }

  const questionPurposeSet = new Set(normalizedQuestions.map((question) => question.purpose));
  if (questionPurposeSet.size !== normalizedQuestions.length) {
    errors.push("同一轮不要重复追问同一类信息缺口。");
  }

  const missingKeys = new Set(strict.missing_keys);
  for (const question of normalizedQuestions) {
    const purpose = normalizeProbePurpose(question.purpose);
    if (strict.missing_keys.length && (!purpose || !missingKeys.has(purpose))) {
      errors.push(`问题「${question.text}」偏离了本轮仍需补足的信息方向。`);
    }
  }

  return errors;
}

function generateStrictProbeAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictProbeResult> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictProbeResultSchema,
    runtime,
    maxOutputTokens: 1100,
    missingRuntimeMessage: "模型配置不可用，无法生成真实追问。请先在设置页接入模型。",
    timeoutMessage: "追问生成超时，模型响应过慢。",
    failurePrefix: "追问结构化生成失败",
    schemaName: "scribe_probe_v2",
    schemaDescription: "ParallelMe 阶段一书记员追问或议题提案 readiness 判断。",
  });
}

function generateStrictProposalAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictProposalResult> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictProposalResultSchema,
    runtime,
    maxOutputTokens: 1600,
    missingRuntimeMessage: "模型配置不可用，无法生成真实议题提案。请先在设置页接入模型。",
    timeoutMessage: "议题提案生成超时，模型响应过慢。",
    failurePrefix: "议题提案结构化生成失败",
    schemaName: "issue_proposal_v2",
    schemaDescription: "ParallelMe 阶段一 4-Key 议题提案，只生成可校对案由和四个关键面。",
  });
}

function generateStrictRefineAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictRefineResult> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictRefineResultSchema,
    runtime,
    maxOutputTokens: 1600,
    missingRuntimeMessage: "模型配置不可用，无法修正议题提案。请先在设置页接入模型。",
    timeoutMessage: "议题提案修正超时，模型响应过慢。",
    failurePrefix: "议题提案修正结构化生成失败",
    schemaName: "proposal_refine_v2",
    schemaDescription: "ParallelMe 阶段一议题提案修正，选择继续追问或输出更新后的 4-Key 提案。",
  });
}

function generateStrictVoiceOpeningAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictVoiceOpeningPayloadResult> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictVoiceOpeningPayloadResultSchema,
    runtime,
    maxOutputTokens: 700,
    missingRuntimeMessage: "模型配置不可用，无法生成五声开场。请先在设置页接入模型。",
    timeoutMessage: "五声开场生成超时，模型响应过慢。",
    failurePrefix: "五声开场结构化生成失败",
    schemaName: "voice_opening_v2",
    schemaDescription: "ParallelMe 五声圆桌单个声音的结构化开场立论。",
    temperature: 0.5,
  });
}

function generateStrictRoundtableVoiceTurnAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictRoundtableVoiceTurn> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictRoundtableVoiceTurnSchema,
    runtime,
    maxOutputTokens: 700,
    missingRuntimeMessage: "模型配置不可用，无法生成圆桌发言。请先在设置页接入模型。",
    timeoutMessage: "圆桌发言生成超时，模型响应过慢。",
    failurePrefix: "圆桌发言结构化生成失败",
    schemaName: "roundtable_voice_turn_v2",
    schemaDescription: "ParallelMe 五声圆桌自由讨论阶段的单声发言。",
    temperature: 0.58,
  });
}

function generateStrictDuelQuestionAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictDuelQuestion> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictDuelQuestionSchema,
    runtime,
    maxOutputTokens: 450,
    missingRuntimeMessage: "模型配置不可用，无法生成两声追问。请先在设置页接入模型。",
    timeoutMessage: "两声追问生成超时，模型响应过慢。",
    failurePrefix: "两声追问结构化生成失败",
    schemaName: "duel_question_v2",
    schemaDescription: "ParallelMe 五声圆桌中一个声音向另一个声音发出的定向追问。",
    temperature: 0.56,
  });
}

function generateStrictDuelResponseAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictDuelResponse> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictDuelResponseSchema,
    runtime,
    maxOutputTokens: 600,
    missingRuntimeMessage: "模型配置不可用，无法生成两声回应。请先在设置页接入模型。",
    timeoutMessage: "两声回应生成超时，模型响应过慢。",
    failurePrefix: "两声回应结构化生成失败",
    schemaName: "duel_response_v2",
    schemaDescription: "ParallelMe 五声圆桌中一个声音对另一个声音追问的回应。",
    temperature: 0.56,
  });
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
  confidence?: number;
  missingKeys?: ProbePurpose[];
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

interface VisibleReasoningInput {
  source: string;
  systemPrompt: string;
  userPrompt: string;
  runtime?: LlmRuntime;
  onReasoning?: LlmStreamHandlers["onReasoning"];
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

const STAGE_ONE_SCRIBE_SYSTEM = `你是 ParallelMe 阶段一的问题定义者：一位深谙金字塔原理的架构师。

面对用户模糊、情绪化、甚至自相矛盾的初始输入，你的任务不是尽快填满 4-Key 表格，而是防止一个尚未被用户说清的问题过早进入五声圆桌。你要自下而上充分激发用户表达，再自上而下收束成一份结构化的《议题提案》。

核心交互策略：
- 金字塔原理：先找本次议题的中心问题，再把事实、约束、价值冲突和圆桌任务分层放好。不要把同一件事换四种说法。
- 剥洋葱法：拒绝表面叙事。当用户只说焦虑、纠结、委屈或想逃开时，不提供建议，而是追问那股感受背后具体是哪类担忧。
- 边界测试：通过极端假设逼近真实想法。例如把钱、时间、失败成本、家庭期待、关系后果推到边界，观察用户真正不能失去什么。
- 完整确认：原始输入里的关键词只能算线索，不能算用户已经确认。你必须让用户亲口确认关键事实、关键代价、关键害怕和这次圆桌要验证的任务。

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
- 优先问会打开用户表达的问题，而不是让用户用一个抽象选项快速过关。
- 如果用户只点选项、没有展开，下一轮要追问“为什么是这个 / 哪个条件一变会改变判断 / 这句话里最刺痛的是哪一层”。
- 同一轮问题的 purpose 不得重复；如果两个问题会得到同一类答案，只保留更关键的那一个。
- 可以给用户 2-4 个可选回应，但每个选项都必须是完整自然语言，独立可理解。
- 不要把选项写成技术 id 的语义承载；id 只是机器字段，label 才是用户选择的真实含义。
- 成案前必须做审计：四个 Key 是否都被用户回答覆盖？是否至少做过一次现实边界或最坏情形测试？是否至少出现过一处用户自己的自然语言展开？如果没有，继续追问。
- 宁可多问一轮，也不要让一个还没被用户说开的困惑伪装成已经清楚的议题。`;

async function streamScribeReasoning(input: ScribeReasoningInput): Promise<string> {
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

请直接用自然语言输出你现在执行阶段一任务时的判断过程。只写面向用户可见的判断，不提格式、字段、系统提示或任何技术过程。`;

  return streamVisibleReasoning({
    source: input.source,
    systemPrompt: STAGE_ONE_SCRIBE_SYSTEM + buildContextBlock(input.ctx),
    userPrompt: prompt,
    runtime: input.runtime,
    onReasoning: input.onReasoning,
    temperature: 0.45,
    maxOutputTokens: 700,
    timeoutMs: 45_000,
  });
}

async function streamVisibleReasoning(input: VisibleReasoningInput): Promise<string> {
  const rt = resolveRuntime(input.runtime);
  if (!rt.apiKey) return "";

  const { model } = createProvider(input.runtime);

  let reasoningText = "";
  let nativeReasoningSeen = false;

  try {
    const result = streamText({
      model,
      system: input.systemPrompt,
      prompt: input.userPrompt,
      temperature: input.temperature ?? 0.45,
      maxOutputTokens: input.maxOutputTokens ?? 700,
      abortSignal: AbortSignal.timeout(input.timeoutMs ?? 45_000),
    });

    for await (const part of result.fullStream) {
      if (part.type === "reasoning-delta") {
        nativeReasoningSeen = true;
        const delta = part.text || "";
        reasoningText += delta;
      } else if (part.type === "text-delta" && !nativeReasoningSeen) {
        const delta = part.text || "";
        reasoningText += delta;
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
    }
  } catch (err: any) {
    console.warn("[streamVisibleReasoning] failed:", err?.message || err);
  }

  let publicReasoning = sanitizeVisibleReasoning(reasoningText);
  if (hasVisibleReasoningLeak(publicReasoning)) {
    publicReasoning = sanitizeVisibleReasoning(
      publicReasoning.replace(
        /(?:^|\n)[^\n]*(?:JSON|schema|schema_version|No object generated|could not parse|expected string|Too big|结构化生成失败|校验失败|字段|技术词汇|完全符合要求)[^\n]*(?=\n|$)/gi,
        "\n",
      ),
    );
  }
  if (hasVisibleReasoningLeak(publicReasoning)) publicReasoning = "";
  if (publicReasoning && input.onReasoning) {
    input.onReasoning(publicReasoning, {
      source: input.source,
      mode: nativeReasoningSeen ? "native" : "public",
    });
  }
  return publicReasoning;
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
- 不以关键词覆盖作为成案标准。原始输入里的“考公 / 月薪 / 回老家 / 分手 / 买房”等只能说明有线索，不能说明用户已经把问题定义清楚。
- 只有当四个 Key 都已经被用户回答覆盖，并且回答里出现了至少一处用户自己的展开、至少一次现实边界或最坏情形测试，才允许 readyToPropose=true。
- 如果 Surface Dilemma 或 Current Constraints 只是从原始输入推断出来，但没有被用户确认，必须继续追问。
- 如果 Core Values/Fears 只是一个抽象词（安全感、自由、体面等），继续剥洋葱追问它在这件事里的具体含义。
- 如果 Expected Resolution 只是“想知道怎么选”，继续追问圆桌要产出哪种判断规则、边界、代价排序或观察期。
- 不因为模型已经能写出漂亮提案就成案；阶段一的标准是用户材料充分，不是文案可生成。

追问去重：
- 不要问已经在历史里问过、用户也回答过的问题。
- 同一轮最多一个问题服务 core_fears，最多一个问题服务 expected_resolution。
- core_fears 问“哪种失去/恐惧/底线最刺痛”；expected_resolution 问“这次圆桌要帮用户产出什么判断规则”。二者不能互相套话。

你只允许输出两类结果：
- ask_more：readyToPropose=false，并输出 1-3 个高质量追问。
- issue_proposal：readyToPropose=true，questions 为空，表示下一步应生成《议题提案》。
- 当你犹豫是否足够时，选择 ask_more。

你现在处在第二段调用：上一段 LLM 已经完成 thinking。你的任务不是重新长篇分析，而是把 thinking、原始输入和本地审计转译成 UI 可展示的问题 JSON。

输出必须严格符合 probe_v2 JSON：
{
  "schema_version": "probe_v2",
  "action": "ask_more",
  "readyToPropose": false,
  "confidence": 0.64,
  "missing_keys": ["surface_dilemma", "current_constraints"],
  "questions": [
    {
      "id": "q_surface_1",
      "text": "一句自然语言的追问，必须以问号结尾，并咬住用户原文或刚才 thinking 里的具体张力？",
      "options": [
        {"id": "opt_a", "label": "一个完整、自然、可独立理解的回应选项"},
        {"id": "opt_b", "label": "另一个完整回应选项"},
        {"id": "custom", "label": "都不准，我自己说"}
      ],
      "purpose": "surface_dilemma|current_constraints|core_fears|expected_resolution"
    }
  ]
}

字段硬规则：
- schema_version 必须是 "probe_v2"。
- action=ask_more 时：readyToPropose=false，missing_keys 至少 1 个，questions 必须 1-3 个。
- action=issue_proposal 时：readyToPropose=true，missing_keys=[]，questions=[]。
- confidence 是你对“阶段一材料足以进入下一步”的置信度；ask_more 必须 <= 0.74，issue_proposal 必须 >= 0.75。
- 每个问题必须有 3-4 个 options，且恰好一个是 {"id":"custom","label":"都不准，我自己说"}。
- 每个问题和至少两个非自定义选项必须贴住用户原始输入、已有回答或刚才 thinking 中的具体名词/条件/张力；禁止只写“这件事、这条路、现实条件、选择岔路”这种泛化套话。
- 禁止输出模板化兜底句，比如“如果先把情绪放旁边……”“这件事里哪个现实条件……”。如果你不知道怎么问，就回到用户原文和 thinking 里找具体张力。
- 只输出 JSON 对象，不要 Markdown，不要代码块，不要在 JSON 前后添加解释。`;

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

本地阶段一审计：
${probeAuditForPrompt(rawInput, dialogue, reasoningMemo)}

这是第二段“问题生成”调用。请基于 thinking 和审计结果输出 probe_v2 JSON。你提出的问题会直接展示给用户；宿主不会替你兜底改写问题。`;

  return runStrictScribeLoop({
    handlers,
    retrySource: "probe",
    retryNotice: "我再校对一遍问题，让它更贴近你的原话。\n",
    failureLogLabel: "generateScribeQuestions",
    failureMessage: "书记员追问连续没有整理成可展示的问题。请重试一次；如果持续出现，可以换一个更稳定的模型配置。",
    generate: (repairBlock) =>
      generateStrictProbeAttempt(
        [
          { role: "system", content: SCRIBE_PROBE_SYSTEM + buildContextBlock(ctx) },
          { role: "user", content: userMsg + repairBlock },
        ],
        runtime,
      ),
    accept: (strict) => {
      const normalizedQuestions = normalizeProbeQuestions(strict.questions, { rawInput, dialogue, reasoningMemo });
      const qualityErrors = validateStrictProbeQuality(
        strict,
        normalizedQuestions,
        rawInput,
        dialogue,
        reasoningMemo,
      );
      const normalized: ProbeResult = {
        questions: normalizedQuestions,
        readyToPropose: strict.action === "issue_proposal" && strict.readyToPropose,
        thinking: strict.thinking || reasoningMemo,
        confidence: strict.confidence,
        missingKeys: strict.missing_keys,
      };

      if (shouldForceProbe(rawInput, dialogue, normalized, reasoningMemo)) {
        const issues = readinessIssues(collectProbeCoverage(rawInput, dialogue, reasoningMemo));
        qualityErrors.push(`阶段一证据还不够：${issues.join("；")}。必须继续向用户提出真实追问。`);
      }

      return { result: normalized, errors: qualityErrors };
    },
  });
}

const SCRIBE_PROPOSE_SYSTEM = `${STAGE_ONE_SCRIBE_SYSTEM}

${scribePersonaBlock("brief")}

现在信息已经足够形成《议题提案》。请把完整对话收束为一份进入五声圆桌前的问题定义文件。

成案原则：
- MECE：四个 Key 要相互独立、共同穷尽，不要把同一件事换个说法重复写四遍。
- 案由优先：先写出一句“本次议题主句”，再展开四个 Key。
- 只定义问题，不回答用户该怎么选。
- 以用户已经说出和确认过的材料为主。书记员可以做结构化概括，但不能把未经确认的猜测写成既定事实。

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
- 如果某个判断来自书记员推断而非用户明说，必须写成可校对的温和表述，例如“看起来更像是……”，不要装作用户已经确认。
- 绝不允许写"待补充""待挖掘""待明确""未知"等占位符；如果信息确实不足，说明前一阶段不该调用你，但你仍要用已有材料写成可校对草案。
- 不要把议题提前改写成解决方案；书记员先定义问题，再把它交给五声圆桌。
- 没有建议句、诊断句、安慰句。禁止“你应该/我建议/你需要做/最好的选择是/这说明你有某种心理问题”。
- value 必须是完整人话句，不是概念短语。用户看到后的自然动作应该是“校对”，不是“继续解释一大段”。

每个 Key 必须包含：
- title: 给用户看的人话标题
- content: 核心内容（1-2句）
- details: 补充细节数组

输出严格 JSON：
{
  "schema_version": "issue_proposal_v2",
  "proposal": {
    "issue_sentence": "本次议题主句",
    "surface_dilemma": { "title": "具象化的困惑", "content": "", "details": [] },
    "current_constraints": { "title": "真实的处境", "content": "", "details": [] },
    "core_fears": { "title": "隐秘的关切", "content": "", "details": [] },
    "expected_resolution": { "title": "渴望的终局", "content": "", "details": [] }
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

请基于以上信息生成 4-Key 议题提案。`;

  return runStrictScribeLoop({
    handlers,
    retrySource: "proposal",
    retryNotice: "我再校对一遍案由，让四个关键面更贴住你的原话。\n",
    failureLogLabel: "generateIssueProposal",
    failureMessage: "议题提案连续没有整理成可校对案由。请重试一次；如果持续出现，可以换一个更稳定的模型配置。",
    generate: (repairBlock) =>
      generateStrictProposalAttempt(
        [
          { role: "system", content: SCRIBE_PROPOSE_SYSTEM + buildContextBlock(ctx) },
          {
            role: "user",
            content:
              `${userMsg}\n\n` +
              `请输出 issue_proposal_v2 JSON，只包含 schema_version 和 proposal。taskFrame 由宿主从 proposal 派生，不要输出 taskFrame。\n` +
              `proposal 必须包含 issue_sentence 与四个 Key；四个 Key 的 title 必须分别是「具象化的困惑」「真实的处境」「隐秘的关切」「渴望的终局」。` +
              repairBlock,
          },
        ],
        runtime,
      ),
    accept: (strict) => {
      const proposal = strict.proposal as IssueProposal;
      const errors = validateStrictProposalQuality(strict, rawInput, dialogue, reasoningMemo);
      if (!errors.length) handlers.onPartial?.(strict);
      return {
        result: { proposal, taskFrame: buildTaskFrameFromProposal(proposal)! },
        errors,
      };
    },
  });
}

function proposalText(proposal: IssueProposal): string {
  return [
    proposal.issue_sentence,
    proposal.surface_dilemma.content,
    ...proposal.surface_dilemma.details,
    proposal.current_constraints.content,
    ...proposal.current_constraints.details,
    proposal.core_fears.content,
    ...proposal.core_fears.details,
    proposal.expected_resolution.content,
    ...proposal.expected_resolution.details,
  ].filter(Boolean).join("\n");
}

function validateStrictProposalQuality(
  strict: ValidatedStrictProposalResult,
  rawInput: string,
  dialogue: DefiningDialogue,
  reasoningMemo: string,
): string[] {
  const proposal = strict.proposal as IssueProposal;
  const errors: string[] = [];
  const allProposalText = proposalText(proposal);
  const anchors = extractProbeAnchorTerms(probeAnchorSource(rawInput, dialogue), 12);
  const anchorHits = anchors.filter((anchor) => textIncludesAnchor(allProposalText, anchor));

  if (anchors.length >= 2 && anchorHits.length === 0) {
    errors.push("议题提案没有贴住用户原文或回答里的具体名词、数字、关系。");
  }
  if (hasVisibleReasoningLeak(allProposalText)) {
    errors.push("议题提案包含内部标记或技术词。");
  }
  if (areSimilarQuestions(proposal.core_fears.content, proposal.expected_resolution.content)) {
    errors.push("隐秘关切和渴望终局太相似：前者写怕失去什么，后者写圆桌要验证什么。");
  }
  if (areSimilarQuestions(proposal.surface_dilemma.content, proposal.current_constraints.content)) {
    errors.push("具象化困惑和真实处境太相似：前者写选择岔路，后者写客观约束。");
  }

  const surfaceText = `${proposal.surface_dilemma.content}\n${proposal.surface_dilemma.details.join("\n")}`;
  if (!/(一边|另一边|还是|或|选择|要不要|该不该|继续|辞职|读博|考公|留下|离开|换|不换)/.test(surfaceText)) {
    errors.push("具象化困惑没有写成真实选择岔路。");
  }

  const resolutionText = `${proposal.expected_resolution.content}\n${proposal.expected_resolution.details.join("\n")}`;
  if (!/(验证|判断规则|判断标准|边界|观察期|现实信号|信号|排序|产出|确认)/.test(resolutionText)) {
    errors.push("渴望终局没有写成圆桌要验证的规则、边界或现实信号。");
  }

  if (reasoningMemo && /待补充|待挖掘|待明确|未知|不清楚|无法判断/.test(allProposalText)) {
    errors.push("议题提案仍包含占位符，不能直接给用户校对。");
  }

  return errors;
}

function normalizeStrictRefineResult(
  strict: ValidatedStrictRefineResult,
  context: { rawInput: string; dialogue: DefiningDialogue; reasoningMemo: string },
): RefineResult {
  if (strict.action === "ask_more") {
    return {
      needMoreInfo: true,
      questions: normalizeProbeQuestions(strict.questions, context),
      thinking: strict.thinking || "",
      confidence: strict.confidence,
      missingKeys: strict.missing_keys,
    };
  }

  const proposal = strict.proposal as IssueProposal;
  return {
    needMoreInfo: false,
    proposal,
    taskFrame: buildTaskFrameFromProposal(proposal)!,
    thinking: strict.thinking || "",
    confidence: strict.confidence,
    missingKeys: strict.missing_keys,
  };
}

function validateStrictRefineQuality(
  strict: ValidatedStrictRefineResult,
  normalized: RefineResult,
  rawInput: string,
  dialogue: DefiningDialogue,
  userFeedback: string,
  reasoningMemo: string,
): string[] {
  if (strict.action === "ask_more") {
    return validateStrictProbeQuality(
      {
        schema_version: "probe_v2",
        action: "ask_more",
        readyToPropose: false,
        confidence: strict.confidence,
        missing_keys: strict.missing_keys,
        questions: strict.questions,
        thinking: strict.thinking,
      },
      normalized.questions || [],
      rawInput,
      dialogue,
      reasoningMemo,
    );
  }

  const proposal = normalized.proposal;
  if (!proposal) return ["update_proposal 必须输出可展示的议题提案"];

  const errors: string[] = [];
  const feedbackAnchors = extractProbeAnchorTerms(userFeedback, 8);
  const allProposalText = proposalText(proposal);
  const anchorHits = feedbackAnchors.filter((anchor) => textIncludesAnchor(allProposalText, anchor));
  if (feedbackAnchors.length >= 1 && anchorHits.length === 0) {
    errors.push(`修正后的议题没有吸收用户反馈里的具体锚点，例如：${feedbackAnchors.slice(0, 4).join("、")}`);
  }
  if (/待补充|待挖掘|待明确|未知|不清楚|无法判断|建议你|我建议/.test(allProposalText)) {
    errors.push("修正后的议题仍包含占位符或建议口吻");
  }
  return errors;
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
1. 如果用户反馈让某个 Key 变得不确定，需要追问确认：action=ask_more。
2. 如果用户反馈已经足够修正提案，直接更新提案：action=update_proposal。

修正标准：
- issue_sentence 必须是一句“本次议题主句”，让用户一眼确认这次圆桌讨论什么。
- 具象化的困惑仍必须是 A vs B 或多重选择岔路。
- 真实的处境只写客观约束。
- 隐秘的关切要向下追到价值/恐惧，但不能替用户贴因果标签。
- 渴望的终局要写成“这次圆桌要验证……”式任务、判断规则、代价排序或观察期，不许替用户决定，也不许复述隐秘关切。
- 不写“待补充/待确认/未知”等占位。
- 不写建议句、诊断句、安慰句。
- 直接更新时必须吸收用户反馈里的具体内容，而不是返回原提案。
- 不要输出 taskFrame；宿主会从 proposal 本地派生。

输出严格 JSON：
{
  "schema_version":"proposal_refine_v2",
  "action":"ask_more|update_proposal",
  "needMoreInfo": true,
  "confidence": 0.62,
  "missing_keys":["surface_dilemma"],
  "questions": [],
  "proposal": {...},
  "thinking":""
}

字段硬规则：
- action=ask_more 时：needMoreInfo=true，confidence<=0.74，missing_keys 至少 1 个，questions 必须 1-3 个，不能输出 proposal。
- action=update_proposal 时：needMoreInfo=false，confidence>=0.75，missing_keys=[]，questions=[]，proposal 必须完整。
- questions 的结构与阶段一追问完全一致：每题 3-4 个自然语言选项，且恰好一个“都不准，我自己说”。
- proposal 的结构与 issue_proposal_v2 完全一致，四个 title 固定，不输出 taskFrame。`;

  const userMsg = `原始输入：${rawInput}

对话历史：
${dialogueText}

当前提案：
${proposalText}

用户反馈：
${userFeedback}

刚才的自然语言判断过程：
${reasoningMemo || "（没有可用判断过程）"}`;

  return runStrictScribeLoop({
    handlers,
    retrySource: "refine",
    retryNotice: "我再校对一遍你的修正意见，让议题提案真正吸收这次反馈。\n",
    failureLogLabel: "refineProposal",
    failureMessage: "议题提案修正连续没有整理成可展示结果。请重试一次；如果持续出现，可以换一个更稳定的模型配置。",
    generate: (repairBlock) =>
      generateStrictRefineAttempt(
        [
          { role: "system", content: sys + buildContextBlock(ctx) },
          { role: "user", content: userMsg + repairBlock },
        ],
        runtime,
    ),
    accept: (strict) => {
      const refineDialogue: DefiningDialogue = [
        ...dialogue,
        {
          role: "user",
          answer: {
            question_id: "proposal_refine_feedback",
            question_text: "用户对议题提案的修正意见",
            free_text: userFeedback,
            at: Date.now(),
          },
        },
      ];
      const normalized = normalizeStrictRefineResult(strict, { rawInput, dialogue: refineDialogue, reasoningMemo });
      const qualityErrors = validateStrictRefineQuality(
        strict,
        normalized,
        rawInput,
        refineDialogue,
        userFeedback,
        reasoningMemo,
      );
      return { result: normalized, errors: qualityErrors };
    },
  });
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
  return Promise.all(
    VOICE_IDS.map((vid, index) =>
      generateOpeningTurnForVoice(vid, taskFrame, brief, ctx, runtime, now + index),
    ),
  );
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
  const sys = `${voice.system_prompt}

你正在参加 ParallelMe 五声圆桌的第一轮立论。
这一轮是结构化开场，不是自由聊天；你只代表「${voice.name}」这一声，不替其他声音综合。
你只能基于用户确认后的《本次议题 + 4 Key》立论，不读取也不引用阶段一书记员的追问过程。

请输出严格 JSON：
{
  "schema_version": "voice_opening_v2",
  "thesis": "当下的痛苦本质是什么，≤36字",
  "pull": "第一步必须做什么，≤32字",
  "concern": "需要承受什么无可挽回的代价，≤36字",
  "protected_value": "我在为用户守护什么底线，≤28字",
  "task_evidence": "来自本次议题的具体线索，≤36字"
}

禁止输出 JSON 以外的任何文字。`;

  const validated = await generateStrictVoiceOpeningAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      { role: "user", content: `用户确认后的入桌材料：\n${brief}` },
    ],
    runtime,
  );
  return normalizeOpeningTurn(voiceId, validated, at);
}

export async function generateRoundtableMove(
  input: RoundtableMoveInput,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
  onPartial?: StreamHandlerArg,
): Promise<RoundtableMoveResult> {
  const brief = compactRoundtableBrief(input.taskFrame, input.issueProposal);
  const history = serializeRoundtable(input.roundtable);

  if (input.moveType === "continue_all" || input.moveType === "user_to_table") {
    return generateParallelVoiceMove(input, brief, history, ctx, runtime);
  }

  if (input.moveType === "user_to_voice") {
    return generateSingleVoiceMove(input, brief, history, ctx, runtime);
  }

  if (input.moveType === "duel") {
    return generateDuelVoiceMove(input, brief, history, ctx, runtime);
  }

  throw new LlmError(`未知圆桌动作：${input.moveType}`, "unknown", false);
}

async function generateParallelVoiceMove(
  input: RoundtableMoveInput,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
): Promise<RoundtableMoveResult> {
  const move = createRoundtableMove(input);
  const at = Date.now();
  const roundIndex = roundIndexForMove(input);
  const payloads = await Promise.all(
    VOICE_IDS.map((voiceId) =>
      generateVoiceTurnText({
        voiceId,
        mode: input.moveType,
        brief,
        history,
        userText: input.userText,
        ctx,
        runtime,
        parallelBatch: true,
      }),
    ),
  );

  const turns = VOICE_IDS.map((voiceId, index) => {
    const payload = payloads[index];
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
): Promise<RoundtableMoveResult> {
  const voiceId = input.targetVoiceId || ("future" as VoiceId);
  const move = createRoundtableMove(input);
  const roundIndex = roundIndexForMove(input);
  const payload = await generateVoiceTurnText({
    voiceId,
    mode: input.moveType,
    brief,
    history,
    userText: input.userText,
    ctx,
    runtime,
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
}

async function generateDuelVoiceMove(
  input: RoundtableMoveInput,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
): Promise<RoundtableMoveResult> {
  if (!input.fromVoiceId || !input.toVoiceId) {
    throw new LlmError("两声对话缺少发问方或回应方。", "unknown", false);
  }

  const move = createRoundtableMove(input);

  const question = await generateDuelQuestion(
    input.fromVoiceId,
    input.toVoiceId,
    brief,
    history,
    ctx,
    runtime,
  );
  const response = await generateDuelResponse(
    input.toVoiceId,
    input.fromVoiceId,
    question,
    brief,
    history,
    ctx,
    runtime,
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
}

async function generateVoiceTurnText({
  voiceId,
  mode,
  brief,
  history,
  userText,
  ctx,
  runtime,
  parallelBatch,
}: {
  voiceId: VoiceId;
  mode: RoundtableMoveType;
  brief: string;
  history: string;
  userText?: string;
  ctx?: ContextBundle;
  runtime?: LlmRuntime;
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
{"schema_version":"roundtable_voice_turn_v2","text":"你的本轮发言","refers_to":["money"]}`;

  const validated = await generateStrictRoundtableVoiceTurnAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}`,
      },
    ],
    runtime,
  );
  const text = String(validated.text || "").trim();
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
): Promise<string> {
  const from = SELVES[fromVoiceId];
  const sys = `${from.system_prompt}

你正在发起一场定向对话。你能看到完整圆桌历史。
你的任务是代表「${from.name}」，向「${voiceName(toVoiceId)}」提出一个具体追问。

规则：
- 问题必须基于已有历史中的具体立场、代价判断或没说清的地方，不要凭空发明。
- 可以直接指出你担心的代价，但不要攻击人格和身份。
- 只输出一个问题，≤80 字。

输出严格 JSON：{"schema_version":"duel_question_v2","question":"..."}`;

  const validated = await generateStrictDuelQuestionAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      { role: "user", content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}` },
    ],
    runtime,
  );
  return String(validated.question || "").trim();
}

async function generateDuelResponse(
  toVoiceId: VoiceId,
  fromVoiceId: VoiceId,
  question: string,
  brief: string,
  history: string,
  ctx: ContextBundle | undefined,
  runtime: LlmRuntime | undefined,
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

输出严格 JSON：{"schema_version":"duel_response_v2","response":"..."}`;

  const validated = await generateStrictDuelResponseAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content: `用户确认后的入桌材料：\n${brief}\n\n完整圆桌历史：\n${history}\n\n对方的问题：\n${question}`,
      },
    ],
    runtime,
  );
  return {
    response: String(validated.response || "").trim(),
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

function generateStrictObservationLedgerAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictScribeObservationLedger> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictScribeObservationLedgerSchema,
    runtime,
    maxOutputTokens: 1600,
    missingRuntimeMessage: "模型配置不可用，无法更新圆桌观察账本。请先在设置页接入模型。",
    timeoutMessage: "圆桌观察账本更新超时，模型响应过慢。",
    failurePrefix: "圆桌观察账本结构化生成失败",
    schemaName: "observation_ledger_v2",
    schemaDescription: "ParallelMe 圆桌后书记员后台观察账本，用于后续问询质量判断。",
  });
}

export async function generateScribeObservationLedger(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  previousLedger?: ScribeObservationLedger | null,
  ctx?: ContextBundle,
  runtime?: LlmRuntime,
): Promise<ScribeObservationLedger> {
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
  "schema_version": "observation_ledger_v2",
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

  const validated = await generateStrictObservationLedgerAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content:
          `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
          `已有观察账本：\n${JSON.stringify(previousLedger || emptyObservationLedger(), null, 2)}\n\n` +
          `圆桌记录：\n${serializeRoundtable(roundtable)}\n\n` +
          `请更新 observation_ledger_v2 JSON。注意：这份账本不直接展示给用户；不要输出解释、Markdown 或代码块。`,
      },
    ],
    runtime,
  );
  return normalizeObservationLedger(validated);
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
  const activeLedger = hasObservationLedgerContent(ledger)
    ? ledger
    : emptyObservationLedger();
  const handlers = streamOpts(onPartial);
  const sys = `你是 ParallelMe v1.0 的书记员。五声会谈之后，你要通过苏格拉底式诘问与黑格尔式正反合，完成最终确认，为「本心落定」做准备。

${scribePersonaBlock("inquiry")}

任务：
- 只基于确认后的议题、圆桌行为和书记员观察账本发问。
- 优先处理五声已经问过、但用户没有回应的关键问题。
- 问题服务最终卡片的五个落点：创造性无望宣判、核心价值主轴提取、痛苦接纳契约、最小阻力行动承诺、正反合。
- 问询不是审讯，也不是补表格；它要让用户越聊越明了：看见自己在圆桌里偏向了谁、回避了什么、真正想守住什么、愿意吞下什么痛、下一步能做什么。
- 每轮最多 1-3 题，每题 2-4 个自然语言选项，最后保留“都不准，我自己说”。
- 如果答案已经足够生成本心落定，readyForReport 设为 true，questions 置空；如果只是模型能写出结论，但用户还没亲口确认关键落点，继续问。
- 如果用户回答揭示新矛盾，可以继续追问；不要因为轮次多而草率进入报告。
- 如果缺口很小，只问最能改变最终卡片的一题。
- 如果用户已经清楚表达反对、修正或承诺，不要围绕同一主题重复追问。
- 不输出“后台观察”字样，不告诉用户你在引用观察账本。

苏格拉底式诘问：
- 问出用户答案背后的假设：如果这个假设不成立，用户还会怎么选？
- 问出用户回避的代价：这条路真正要失去什么，用户是否愿意承认？
- 问出行动偏好：用户在圆桌中追问、反驳、沉默或选择的方向，暴露了什么偏好？
- 问出可证伪标准：什么现实信号会让用户承认“我该调整”？

黑格尔正反合：
- 正：用户真正想坚持的核心价值主轴。
- 反：阻碍用户承认主轴的现实恐惧、关系压力、失败成本或必须接纳的痛。
- 合：一句用户能认领的方向，不抹平冲突，但能把主轴、代价和下一步行动合在一起。

成案前审计：
- 创造性无望、核心价值主轴、痛苦接纳、最小行动、正反合五个落点都必须被用户回答覆盖。
- 至少有足够问询量和一处用户自己的完整表述，不能只靠点选项进入报告。
- 当你犹豫是否足够时，继续问“最后一个会改变落定质量的问题”。

规则：
- 不做建议，不替用户选择，不做临床诊断。
- alignmentProfile 只写自然语言观察和已经被问询或圆桌行为支持的倾向。
- 黑格尔结构中：thesis 是用户想坚持的主轴，antithesis 是阻碍他承认主轴的现实恐惧和代价，synthesis 是能被用户认领的本心方向。

你现在处在第二段调用：前序上下文已经完成观察和判断。你的任务不是重新长篇分析，而是把议题、圆桌、观察账本和问询审计转译成 UI 可展示的问询 JSON。

输出严格 JSON：
{
  "schema_version": "inquiry_v2",
  "action": "ask_more",
  "readyForReport": false,
  "confidence": 0.62,
  "missing_modules": ["core_value_axis", "cost_acceptance"],
  "questions": [
    {
      "id":"inquiry_core_value_1",
      "module":"falsified_fantasy|core_value_axis|cost_acceptance|minimum_action|dialectic_synthesis",
      "question":"一句会直接展示给用户的问询，必须以问号结尾？",
      "options":[
        {"id":"opt_a","label":"完整自然语言选项","meaning":"这个选项对最终落定的含义"},
        {"id":"opt_b","label":"另一个完整自然语言选项","meaning":"这个选项对最终落定的含义"},
        {"id":"custom","label":"都不准，我自己说","meaning":"用户自述"}
      ]
    }
  ]
}

字段硬规则：
- schema_version 必须是 "inquiry_v2"。
- action=ask_more 时：readyForReport=false，missing_modules 至少 1 个，questions 必须 1-3 个。
- action=settlement_report 时：readyForReport=true，missing_modules=[]，questions=[]，alignmentProfile 必须足够支撑本心落定。
- confidence 是你对“已经足够生成本心落定”的置信度；ask_more 必须 <= 0.74，settlement_report 必须 >= 0.75。
- 每个问题必须有 module，且必须属于 missing_modules；同一轮不要重复追问同一个 module。
- settlement_report 的 alignmentProfile 必须写实：falsified_fantasy、core_value_axis、accepted_costs、user_self_statements、hegelian_synthesis.thesis/antithesis/synthesis 都必须来自用户已回答材料，不能留空。
- 每题必须有 3-4 个 options，且恰好一个是 {"id":"custom","label":"都不准，我自己说"}。
- 问题和选项必须引用本次议题、圆桌发言、用户已回答或观察账本中的具体张力；禁止只写“这件事、这场圆桌、代价、主轴”这种泛化套话。
- 如果输出不符合 schema 或质量审计，宿主只会重试，不会替你生成兜底问题。
- 只输出 JSON 对象，不要 Markdown，不要代码块，不要在 JSON 前后添加解释。`;

  const inquiryAudit = inquiryAuditForPrompt(inquiryAnswers, inquiryQuestions);
  const inquiryContext =
    `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
    `圆桌记录：\n${serializeRoundtable(roundtable)}\n\n` +
    `书记员观察账本：\n${JSON.stringify(activeLedger, null, 2)}\n\n` +
    `已提出的问题：\n${JSON.stringify(inquiryQuestions, null, 2)}\n\n` +
    `用户已回答：\n${JSON.stringify(inquiryAnswers, null, 2)}\n\n` +
    `本地问询审计：\n${inquiryAudit}`;
  const reasoningMemo = await streamVisibleReasoning({
    source: "inquiry",
    systemPrompt: sys + buildContextBlock(ctx),
    userPrompt:
      `${inquiryContext}\n\n` +
      "当前任务：先用自然语言判断本心落定前还缺什么。请说明圆桌里哪个张力、用户哪类回答缺口、哪一个落点最可能改变最终结论。只写面向用户可见的判断，不提格式、字段、系统提示或任何技术过程。",
    runtime,
    onReasoning: handlers.onReasoning,
    temperature: 0.42,
    maxOutputTokens: 750,
    timeoutMs: 45_000,
  });

  const userMsg =
    `${inquiryContext}\n\n` +
    `刚才的自然语言判断过程：\n${reasoningMemo || "（没有可用判断过程）"}\n\n` +
    `这是第二段“问询题目生成”调用。请先判断五个落点是否足够，再输出 inquiry_v2 JSON。你提出的问题会直接展示给用户；宿主不会替你兜底改写问题。`;

  return runStrictScribeLoop({
    handlers,
    retrySource: "inquiry",
    retryNotice: "我再校对一遍问询，让它更贴近刚才圆桌里的真实张力。\n",
    failureLogLabel: "generateAlignmentInquiry",
    failureMessage: "书记员问询连续没有整理成可展示的问题。请重试一次；如果持续出现，可以换一个更稳定的模型配置。",
    generate: (repairBlock) =>
      generateStrictInquiryAttempt(
        [
          { role: "system", content: sys + buildContextBlock(ctx) },
          { role: "user", content: userMsg + repairBlock },
        ],
        runtime,
      ),
    accept: (strict) => {
      const normalized = normalizeStrictAlignmentInquiry(strict, activeLedger);
      const qualityErrors = validateStrictInquiryQuality(
        strict,
        normalized,
        taskFrame,
        issueProposal,
        roundtable,
        activeLedger,
        inquiryQuestions,
        inquiryAnswers,
      );

      return { result: normalized, errors: qualityErrors };
    },
  });
}

function inquiryAuditForPrompt(
  answers: ScribeInquiryAnswer[],
  previousQuestions: ScribeInquiryQuestion[],
): string {
  const coverage = collectInquiryCoverage(answers, previousQuestions);
  const issues = inquiryReadinessIssues(coverage);
  const asked = previousQuestions
    .map(inferInquiryModule)
    .filter((module): module is InquiryModule => Boolean(module))
    .map((module) => INQUIRY_MODULE_LABEL[module]);
  const answered = [...coverage.answeredModules].map((module) => INQUIRY_MODULE_LABEL[module]);

  return [
    `用户问询回答数：${coverage.answerCount}/${MIN_INQUIRY_ANSWERS}`,
    `用户完整表述数：${coverage.articulatedAnswerCount}/${MIN_INQUIRY_ARTICULATED_ANSWERS}`,
    `已经问过模块：${asked.join("、") || "无"}`,
    `已经由用户回答覆盖：${answered.join("、") || "无"}`,
    `本轮仍需补足：${coverage.missing.map((module) => INQUIRY_MODULE_LABEL[module]).join("、") || "无"}`,
    `不能落定的原因：${issues.join("；") || "五个落点已足够，可以进入本心落定"}`,
  ].join("\n");
}

function emptyAlignmentProfile(): AlignmentProfile {
  return {
    falsified_fantasy: "",
    core_value_axis: "",
    offended_voices: [],
    accepted_costs: [],
    refused_costs: [],
    unresolved_tensions: [],
    hegelian_synthesis: { thesis: "", antithesis: "", synthesis: "" },
    user_self_statements: [],
  };
}

function normalizeStrictAlignmentInquiry(
  strict: ValidatedStrictInquiryResult,
  ledger: ScribeObservationLedger,
): InquiryResult {
  const questions = strict.action === "settlement_report"
    ? []
    : strict.questions.map((question) => ({
        id: question.id.includes(question.module)
          ? question.id
          : inquiryQuestionId(question.module, question.question),
        question: question.question.trim(),
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label.trim(),
          meaning: option.meaning?.trim(),
        })),
      }));

  return {
    questions,
    readyForReport: strict.action === "settlement_report" && strict.readyForReport,
    alignmentProfile: normalizeAlignmentProfile(strict.alignmentProfile, emptyAlignmentProfile()),
    ledger,
    confidence: strict.confidence,
    missingModules: strict.missing_modules,
  };
}

const FORBIDDEN_INQUIRY_TEMPLATE_RE =
  /(围绕「.*」.*既要又要|这张本心落定如果只能优先服务一条主轴|为了更靠近「.*」，你此刻愿意先吞下|如果不靠继续想，接下来 24 小时内哪个动作最能验证|把这场圆桌合成一句你能认领的话)/;

function inquiryAnchorSource(
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  ledger: ScribeObservationLedger,
  inquiryAnswers: ScribeInquiryAnswer[],
): string {
  const ledgerText = [
    ...ledger.observations.map((observation) => observation.observation),
    ...ledger.observations.flatMap((observation) => observation.evidence),
    ...ledger.unanswered_questions.map((question) => `${question.question} ${question.why_it_matters || ""}`),
    ...Object.values(ledger.module_signals).flat(),
  ].join("\n");
  const answerText = inquiryAnswers
    .map((answer) => [answer.question, answer.selected_label, answer.custom_text].filter(Boolean).join("\n"))
    .join("\n");
  return [
    compactRoundtableBrief(taskFrame, issueProposal),
    serializeRoundtable(roundtable),
    ledgerText,
    answerText,
  ].filter(Boolean).join("\n");
}

function validateStrictInquiryQuality(
  strict: ValidatedStrictInquiryResult,
  normalized: InquiryResult,
  taskFrame: TaskFrame,
  issueProposal: IssueProposal | undefined,
  roundtable: RoundtableRecord,
  ledger: ScribeObservationLedger,
  previousQuestions: ScribeInquiryQuestion[],
  inquiryAnswers: ScribeInquiryAnswer[],
): string[] {
  const errors: string[] = [];
  const coverage = collectInquiryCoverage(inquiryAnswers, previousQuestions);

  if (strict.action === "settlement_report") {
    const issues = inquiryReadinessIssues(coverage);
    if (issues.length) {
      errors.push(`用户材料还不能进入本心落定：${issues.join("；")}`);
    }
    return errors;
  }

  if (strict.readyForReport) {
    errors.push("继续问询时不要同时宣称已经可以进入本心落定。");
  }
  if (normalized.questions.length < 1) {
    errors.push("继续问询时必须给出至少一个能直接展示给用户的问题。");
  }

  const allQuestionText = normalized.questions
    .map((question) => `${question.question} ${question.options.map((option) => option.label).join(" ")}`)
    .join("\n");
  if (FORBIDDEN_INQUIRY_TEMPLATE_RE.test(allQuestionText)) {
    errors.push("问询仍像固定模板，没有体现这轮圆桌和用户答案里的具体张力。");
  }
  if (hasVisibleReasoningLeak(allQuestionText)) {
    errors.push("问询问题或选项包含内部标记或技术词。");
  }

  const anchors = extractProbeAnchorTerms(inquiryAnchorSource(taskFrame, issueProposal, roundtable, ledger, inquiryAnswers));
  const anchorHits = anchors.filter((anchor) => textIncludesAnchor(allQuestionText, anchor));
  if (anchors.length >= 2 && anchorHits.length === 0) {
    errors.push("问询没有贴住本轮议题、圆桌发言、用户回答或观察账本里的具体张力。");
  }

  const previousTexts = previousQuestions.map((question) => question.question);
  for (const question of normalized.questions) {
    if (previousTexts.some((text) => areSimilarQuestions(text, question.question))) {
      errors.push(`问询重复了历史问题：「${question.question}」`);
    }
    const nonCustomOptions = question.options.filter((option) => !isCustomFreeTextOption(option));
    if (nonCustomOptions.length < 2) {
      errors.push(`问题「${question.question}」缺少至少两个真实可选回应`);
    }
    if (!question.options.some(isCustomFreeTextOption)) {
      errors.push(`问题「${question.question}」缺少“都不准，我自己说”选项`);
    }
  }

  const modules = strict.questions.map((question) => question.module);
  if (new Set(modules).size !== modules.length) {
    errors.push("同一轮不要重复追问同一个落点。");
  }

  const missing = new Set(strict.missing_modules);
  for (const question of strict.questions) {
    if (strict.missing_modules.length && !missing.has(question.module)) {
      errors.push(`问题「${question.question}」偏离了本轮仍需补足的落点。`);
    }
  }

  return errors;
}

function generateStrictInquiryAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictInquiryResult> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictInquiryResultSchema,
    runtime,
    maxOutputTokens: 1400,
    missingRuntimeMessage: "模型配置不可用，无法生成真实问询。请先在设置页接入模型。",
    timeoutMessage: "问询生成超时，模型响应过慢。",
    failurePrefix: "问询结构化生成失败",
    schemaName: "alignment_inquiry_v2",
    schemaDescription: "ParallelMe 圆桌后书记员问询或本心落定 readiness 判断。",
  });
}

function generateStrictAlignmentReportAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictAlignmentReport> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictAlignmentReportSchema,
    runtime,
    maxOutputTokens: 2200,
    missingRuntimeMessage: "模型配置不可用，无法生成本心落定。请先在设置页接入模型。",
    timeoutMessage: "本心落定生成超时，模型响应过慢。",
    failurePrefix: "本心落定结构化生成失败",
    schemaName: "alignment_report_v2",
    schemaDescription: "ParallelMe 最终本心落定报告，必须 grounded、可被用户直接校对。",
  });
}

function generateStrictTasteProfileAttempt(
  messages: Msg[],
  runtime: LlmRuntime | undefined,
): Promise<ValidatedStrictTasteProfile> {
  return generateStrictObjectAttempt({
    messages,
    schema: StrictTasteProfileSchema,
    runtime,
    maxOutputTokens: 360,
    missingRuntimeMessage: "模型配置不可用，无法生成品味画像。请先在设置页接入模型。",
    timeoutMessage: "品味画像生成超时，模型响应过慢。",
    failurePrefix: "品味画像结构化生成失败",
    schemaName: "taste_profile_v2",
    schemaDescription: "ParallelMe 用户品味画像，用于补充本地上下文的主题、氛围和一句人格判词。",
    temperature: 0.5,
  });
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
  const handlers = streamOpts(onPartial);
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
- 最后一针见血的价值来自最终问询：不要只复述圆桌立场，要写出用户在问询里亲口承认的幻想、主轴、代价和动作。
- 正反合不能写成折中鸡汤；它必须同时保留“我想守住什么”“我不得不承认什么”“我现在先怎样行动”。
- 不说“后台观察”，不展示 schema，不写 confidence，不写选项 id。
- 不做临床诊断，不把失眠、焦虑等归因为唯一原因，除非用户明确这样说。
- 不输出“清明句”“本心对齐报告”“清明落定”等旧产品词。
- 不写“我建议你”。标题里的建议感已经由产品副标题承接，正文只呈现现实、契约和动作。
- 行动必须具体到时间、动作、完成标准。

输出严格 JSON：
{
  "schema_version": "alignment_report_v2",
  "creative_hopelessness": {"title":"创造性无望宣判","report":"","evidence":[]},
  "core_value_axis": {"title":"核心价值主轴提取","report":"","evidence":[]},
  "cost_acceptance_contract": {"title":"痛苦接纳契约","report":"","evidence":[]},
  "minimum_viable_commitment": {"title":"最小阻力行动承诺","report":"","evidence":[]},
  "dialectic_synthesis": {"thesis":"","antithesis":"","synthesis":""}
}`;

  const draft = await generateStrictAlignmentReportAttempt(
    [
      { role: "system", content: sys + buildContextBlock(ctx) },
      {
        role: "user",
        content:
          `本次议题：\n${compactRoundtableBrief(taskFrame, issueProposal)}\n\n` +
          `书记员观察账本：\n${JSON.stringify(ledger, null, 2)}\n\n` +
          `问询答案：\n${JSON.stringify(inquiryAnswers, null, 2)}\n\n` +
          `本心画像：\n${JSON.stringify(alignmentProfile, null, 2)}\n\n` +
          `请生成 alignment_report_v2 JSON。每个模块必须引用至少一条证据；不要输出解释、Markdown 或代码块。`,
      },
    ],
    runtime,
  );
  handlers.onPartial?.(draft);
  return normalizeAlignmentReport(draft);
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

只输出 JSON：{"schema_version":"taste_profile_v2","themes":[],"moods":[],"identity_hint":""}`;
  const txt =
    "书：\n" + taste.books.map((b) => `${b.title}${b.why ? "（" + b.why + "）" : ""}`).join("、") +
    "\n影：\n" + taste.films.map((f) => `${f.title}${f.why ? "（" + f.why + "）" : ""}`).join("、") +
    "\n乐：\n" + taste.music.map((m) => `${m.title}${m.why ? "（" + m.why + "）" : ""}`).join("、");
  try {
    const profile = await generateStrictTasteProfileAttempt(
      [{ role: "system", content: sys }, { role: "user", content: txt }],
      runtime,
    );
    return {
      themes: profile.themes,
      moods: profile.moods,
      identity_hint: profile.identity_hint,
    };
  } catch {
    return null;
  }
}

function normalizeOpeningTurn(
  vid: VoiceId,
  source: ValidatedStrictVoiceOpeningPayloadResult,
  at: number,
): VoiceOpeningTurn {
  return {
    id: id("open"),
    voice_id: vid,
    name: voiceName(vid),
    thesis: source.thesis.trim(),
    protected_value: source.protected_value.trim(),
    concern: source.concern.trim(),
    task_evidence: source.task_evidence.trim(),
    pull: source.pull.trim(),
    at,
  };
}

function normalizeObservationLedger(parsed: ValidatedStrictScribeObservationLedger): ScribeObservationLedger {
  const now = Date.now();
  return {
    observations: parsed.observations.map((observation) => ({
      id: observation.id,
      round_index: observation.round_index,
      trigger: observation.trigger as ScribeObservationLedger["observations"][number]["trigger"],
      observation: observation.observation.trim(),
      attribution: observation.attribution.trim(),
      module: observation.module,
      evidence: observation.evidence.map((item) => item.trim()),
      at: observation.at ?? now,
    })),
    unanswered_questions: parsed.unanswered_questions.map((question) => ({
      id: question.id,
      from_voice_id: question.from_voice_id,
      from_name: question.from_name,
      question: question.question.trim(),
      why_it_matters: question.why_it_matters.trim(),
      at: question.at,
    })),
    module_signals: {
      creative_hopelessness: parsed.module_signals.creative_hopelessness.map((item) => item.trim()),
      core_values: parsed.module_signals.core_values.map((item) => item.trim()),
      cost_acceptance: parsed.module_signals.cost_acceptance.map((item) => item.trim()),
      minimum_action: parsed.module_signals.minimum_action.map((item) => item.trim()),
    },
    updated_at: parsed.updated_at ?? now,
  };
}

function normalizeAlignmentProfile(input: any, defaults: AlignmentProfile): AlignmentProfile {
  const offended = Array.isArray(input?.offended_voices)
    ? input.offended_voices.filter((id: any) => isVoiceId(String(id))).map((id: any) => String(id) as VoiceId)
    : defaults.offended_voices;
  return {
    falsified_fantasy: stringOr(input?.falsified_fantasy, defaults.falsified_fantasy),
    core_value_axis: stringOr(input?.core_value_axis, defaults.core_value_axis),
    offended_voices: offended,
    accepted_costs: stringArrayOr(input?.accepted_costs, defaults.accepted_costs),
    refused_costs: stringArrayOr(input?.refused_costs, defaults.refused_costs),
    unresolved_tensions: stringArrayOr(input?.unresolved_tensions, defaults.unresolved_tensions),
    hegelian_synthesis: {
      thesis: stringOr(input?.hegelian_synthesis?.thesis, defaults.hegelian_synthesis.thesis),
      antithesis: stringOr(input?.hegelian_synthesis?.antithesis, defaults.hegelian_synthesis.antithesis),
      synthesis: stringOr(input?.hegelian_synthesis?.synthesis, defaults.hegelian_synthesis.synthesis),
    },
    user_self_statements: stringArrayOr(input?.user_self_statements, defaults.user_self_statements),
  };
}

function normalizeAlignmentReport(input: ValidatedStrictAlignmentReport): AlignmentReport {
  return {
    creative_hopelessness: normalizeSettlementModule(input.creative_hopelessness),
    core_value_axis: normalizeSettlementModule(input.core_value_axis),
    cost_acceptance_contract: normalizeSettlementModule(input.cost_acceptance_contract),
    minimum_viable_commitment: normalizeSettlementModule(input.minimum_viable_commitment),
    dialectic_synthesis: {
      thesis: input.dialectic_synthesis.thesis.trim(),
      antithesis: input.dialectic_synthesis.antithesis.trim(),
      synthesis: input.dialectic_synthesis.synthesis.trim(),
    },
  };
}

function normalizeSettlementModule(
  input: ValidatedStrictAlignmentReport["creative_hopelessness"],
): AlignmentReport["creative_hopelessness"] {
  return {
    title: input.title.trim(),
    report: input.report.trim(),
    evidence: input.evidence.map((item) => item.trim()),
  };
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

function hasObservationLedgerContent(
  ledger?: ScribeObservationLedger | null,
): ledger is ScribeObservationLedger {
  return Boolean(
    ledger
    && (
      ledger.observations.length
      || ledger.unanswered_questions.length
      || Object.values(ledger.module_signals).some((signals) => signals.length)
    ),
  );
}

type InquiryModule =
  | "falsified_fantasy"
  | "core_value_axis"
  | "cost_acceptance"
  | "minimum_action"
  | "dialectic_synthesis";

const INQUIRY_MODULE_LABEL: Record<InquiryModule, string> = {
  falsified_fantasy: "完美解证伪",
  core_value_axis: "核心价值主轴",
  cost_acceptance: "痛苦接纳",
  minimum_action: "最小行动",
  dialectic_synthesis: "正反合整合",
};

const INQUIRY_MODULES: InquiryModule[] = [
  "falsified_fantasy",
  "core_value_axis",
  "cost_acceptance",
  "minimum_action",
  "dialectic_synthesis",
];

const MIN_INQUIRY_ANSWERS = 4;
const MIN_INQUIRY_ARTICULATED_ANSWERS = 1;

interface InquiryCoverage {
  combinedAnswers: string;
  userStatements: string[];
  previousTexts: string[];
  answerCount: number;
  articulatedAnswerCount: number;
  answeredModules: Set<InquiryModule>;
  covered: Record<InquiryModule, boolean>;
  missing: InquiryModule[];
}

function collectInquiryCoverage(
  answers: ScribeInquiryAnswer[],
  previousQuestions: ScribeInquiryQuestion[],
): InquiryCoverage {
  const userStatements = answers.map((a) => a.custom_text || a.selected_label).filter(Boolean);
  const combinedAnswers = answers
    .map((a) => [a.question_id, a.question, a.selected_label, a.custom_text].filter(Boolean).join("\n"))
    .join("\n\n");
  const answeredQuestionIds = new Set(answers.map((a) => a.question_id));
  const answeredQuestionText = previousQuestions
    .filter((q) => answeredQuestionIds.has(q.id))
    .map((q) => q.question)
    .join("\n");
  const questionById = new Map(previousQuestions.map((question) => [question.id, question]));
  const answeredModules = new Set<InquiryModule>();
  let articulatedAnswerCount = 0;

  for (const answer of answers) {
    const question = questionById.get(answer.question_id);
    const module = question ? inferInquiryModule(question) : null;
    if (module) answeredModules.add(module);
    const text = `${answer.selected_label || ""}\n${answer.custom_text || ""}`.trim();
    if (isArticulatedInquiryAnswer(text)) articulatedAnswerCount += 1;
  }

  const combined = `${combinedAnswers}\n${answeredQuestionText}`;
  const signalCovered: Record<InquiryModule, boolean> = {
    falsified_fantasy: /(falsified_fantasy|放下|不存在|不可能|完美|既要又要|无望|幻想|承认.*不能|不能同时)/.test(combined),
    core_value_axis: /(core_value_axis|主轴|最重要|优先|宁可|价值|底线|保护|真正要|我想要|我在乎)/.test(combined),
    cost_acceptance: /(cost_acceptance|愿意|接受|接纳|吞下|承受|代价|痛|损失|不舒服|短期|比较|误解)/.test(combined),
    minimum_action: /(minimum_action|24|今天|今晚|明天|下一步|动作|完成标准|写下|发一条|算清|约|记录|确认)/.test(combined),
    dialectic_synthesis: /(正反合|thesis|antithesis|synthesis|一方面|另一方面|但我仍然|虽然|可是|同时承认|整合|合起来|我愿意承认)/.test(combined),
  };
  const covered = INQUIRY_MODULES.reduce((acc, module) => {
    acc[module] = answeredModules.has(module) || signalCovered[module];
    return acc;
  }, {} as Record<InquiryModule, boolean>);

  return {
    combinedAnswers,
    userStatements,
    previousTexts: previousQuestions.map((question) => question.question),
    answerCount: answers.length,
    articulatedAnswerCount,
    answeredModules,
    covered,
    missing: INQUIRY_MODULES.filter((module) => !answeredModules.has(module)),
  };
}

function isArticulatedInquiryAnswer(text: string): boolean {
  const clean = text.trim();
  if (!clean || /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我说一条)/.test(clean)) return false;
  return clean.length >= 24;
}

function inferInquiryModule(question: ScribeInquiryQuestion): InquiryModule | null {
  const text = `${question.id}\n${question.question}`;
  if (/(falsified|幻想|完美|既要|不存在|放下|无望)/.test(text)) return "falsified_fantasy";
  if (/(core|value|主轴|价值|底线|优先|保护)/.test(text)) return "core_value_axis";
  if (/(cost|pain|accept|代价|痛|接纳|承受|愿意)/.test(text)) return "cost_acceptance";
  if (/(minimum|action|commit|24|动作|下一步|完成标准)/.test(text)) return "minimum_action";
  if (/(dialectic|synthesis|正反合|正|反|合|整合|一方面|另一方面|同时承认)/.test(text)) return "dialectic_synthesis";
  return null;
}

function inquiryReadinessIssues(coverage: InquiryCoverage): string[] {
  const issues: string[] = [];
  const missing = INQUIRY_MODULES.filter((module) => !coverage.answeredModules.has(module));
  if (missing.length) {
    issues.push(`还有 ${missing.map((module) => INQUIRY_MODULE_LABEL[module]).join("、")} 没有被用户回答确认`);
  }
  if (coverage.answerCount < MIN_INQUIRY_ANSWERS) {
    issues.push(`用户问询回答只有 ${coverage.answerCount} 条，少于最低澄清门槛 ${MIN_INQUIRY_ANSWERS} 条`);
  }
  if (coverage.articulatedAnswerCount < MIN_INQUIRY_ARTICULATED_ANSWERS) {
    issues.push("还缺至少一处用户自己的完整表述，不能只靠点选项落定");
  }
  return issues;
}

function inquiryQuestionId(module: InquiryModule, text: string): string {
  return `inquiry_${module}_${hashText(text)}`;
}

function stringOr(value: any, defaultValue: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  return s || defaultValue;
}

function stringArrayOr(value: any, defaultValue: string[]): string[] {
  if (!Array.isArray(value)) return defaultValue;
  const arr = value.map((x) => String(x || "").trim()).filter(Boolean);
  return arr.length ? arr : defaultValue;
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
