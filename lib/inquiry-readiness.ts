import type { ScribeInquiryAnswer, ScribeInquiryQuestion } from "./v7";

export type InquiryModule =
  | "falsified_fantasy"
  | "core_value_axis"
  | "cost_acceptance"
  | "minimum_action"
  | "dialectic_synthesis";

export const INQUIRY_MODULE_LABEL: Record<InquiryModule, string> = {
  falsified_fantasy: "完美解证伪",
  core_value_axis: "核心价值主轴",
  cost_acceptance: "痛苦接纳",
  minimum_action: "最小行动",
  dialectic_synthesis: "正反合整合",
};

export const INQUIRY_MODULES: InquiryModule[] = [
  "falsified_fantasy",
  "core_value_axis",
  "cost_acceptance",
  "minimum_action",
  "dialectic_synthesis",
];

export const MIN_INQUIRY_ANSWERS = 4;
export const MIN_INQUIRY_ARTICULATED_ANSWERS = 1;

export interface InquiryCoverage {
  combinedAnswers: string;
  userStatements: string[];
  previousTexts: string[];
  answerCount: number;
  articulatedAnswerCount: number;
  answeredModules: Set<InquiryModule>;
  covered: Record<InquiryModule, boolean>;
  missing: InquiryModule[];
}

export function collectInquiryCoverage(
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

export function isArticulatedInquiryAnswer(text: string): boolean {
  const clean = text.trim();
  if (!clean || /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我说一条)/.test(clean)) return false;
  return clean.length >= 24;
}

export function inferInquiryModule(question: ScribeInquiryQuestion): InquiryModule | null {
  const text = `${question.id}\n${question.question}`;
  if (/(falsified|幻想|完美|既要|不存在|放下|无望)/.test(text)) return "falsified_fantasy";
  if (/(core|value|主轴|价值|底线|优先|保护)/.test(text)) return "core_value_axis";
  if (/(cost|pain|accept|代价|痛|接纳|承受|愿意)/.test(text)) return "cost_acceptance";
  if (/(minimum|action|commit|24|动作|下一步|完成标准)/.test(text)) return "minimum_action";
  if (/(dialectic|synthesis|正反合|正|反|合|整合|一方面|另一方面|同时承认)/.test(text)) return "dialectic_synthesis";
  return null;
}

export function inquiryReadinessIssues(coverage: InquiryCoverage): string[] {
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
