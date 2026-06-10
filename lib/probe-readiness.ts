import { extractAnchorTerms } from "./llm-harness.ts";
import type { ValidatedStrictProbeResult } from "./schema.ts";
import type { DefiningDialogue, ScribeAnswer, ScribeQuestion } from "./v7.ts";

export const PROBE_PURPOSES = [
  "surface_dilemma",
  "current_constraints",
  "core_fears",
  "expected_resolution",
] as const;

export type ProbePurpose = (typeof PROBE_PURPOSES)[number];

export const PROBE_PURPOSE_LABEL: Record<ProbePurpose, string> = {
  surface_dilemma: "选择岔路",
  current_constraints: "现实边界",
  core_fears: "隐秘关切",
  expected_resolution: "圆桌验证任务",
};

export const MIN_PROBE_USER_ANSWERS = 4;
export const MIN_ARTICULATED_ANSWERS = 1;
export const MIN_BOUNDARY_CONFIRMATIONS = 1;

interface ProbePurposeEvidence {
  answered: boolean;
  selectedCount: number;
  articulatedCount: number;
  snippets: string[];
}

type ProbeEvidenceMap = Record<ProbePurpose, ProbePurposeEvidence>;

export interface ProbeCoverage {
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

function textSnippet(text: string, max = 34): string {
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/^(书记员问|用户答|用户选择|用户补充|对应问题|原始输入)[:：]\s*/g, "")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
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

export function collectProbeCoverage(
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

export function readinessIssues(coverage: ProbeCoverage): string[] {
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

export function normalizeProbePurpose(value: unknown): ProbePurpose | null {
  const purpose = String(value || "").trim();
  return (PROBE_PURPOSES as readonly string[]).includes(purpose)
    ? (purpose as ProbePurpose)
    : null;
}

export function inferProbePurpose(text: string): ProbePurpose | null {
  if (/(岔路|选项|选择|该不该|要不要|一边|另一边|A|B)/.test(text)) return "surface_dilemma";
  if (/(现实|约束|条件|钱|时间|收入|家庭|身体|失败成本|现金流|边界)/.test(text)) return "current_constraints";
  if (/(害怕|失去|恐惧|关切|底线|价值|安全感|体面|亏欠|后悔)/.test(text)) return "core_fears";
  if (/(圆桌|验证|确认|看清|讨论|产出|判断规则|最终帮你)/.test(text)) return "expected_resolution";
  return null;
}

export function normalizeProbeQuestions(
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

export function isCustomFreeTextOption(option: { id: string; label: string }): boolean {
  const id = option.id.trim().toLowerCase();
  const label = option.label.trim();
  if (id === "custom" || id === "other" || id === "free_text") return true;
  return /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(label);
}

export function areSimilarQuestions(a: string, b: string): boolean {
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

export function shouldForceProbe(
  rawInput: string,
  dialogue: DefiningDialogue,
  result: { readyToPropose: boolean },
  reasoningMemo = "",
): boolean {
  if (!result.readyToPropose) return false;
  const coverage = collectProbeCoverage(rawInput, dialogue, reasoningMemo);
  return readinessIssues(coverage).length > 0;
}

export function probeAuditForPrompt(rawInput: string, dialogue: DefiningDialogue, reasoningMemo: string): string {
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

export function extractProbeAnchorTerms(text: string, limit = 12): string[] {
  return extractAnchorTerms(text.replace(INTERNAL_PROMPT_ANCHOR_RE, " "), {
    dictionary: PROBE_ANCHOR_DICTIONARY,
    limit,
  });
}

export function probeAnchorSource(rawInput: string, dialogue: DefiningDialogue): string {
  const answerParts = dialogue
    .filter((entry) => entry.role === "user" && entry.answer)
    .map((entry) => [
      entry.answer?.selected_option_label,
      entry.answer?.free_text,
    ].filter(Boolean).join("\n"));
  return [rawInput, ...answerParts].filter(Boolean).join("\n");
}

export function textIncludesAnchor(text: string, anchor: string): boolean {
  return text.toLowerCase().includes(anchor.toLowerCase());
}

export function validateStrictProbeQuality(
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
