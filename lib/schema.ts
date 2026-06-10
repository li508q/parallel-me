// lib/schema.ts — Zod schemas for structured LLM output validation.
// Reference: Vercel AI SDK Output.object() pattern — validate + auto-repair.

import { z } from "zod";

// ─── Probe (追问) ───

export const ProbePurposeSchema = z.enum([
  "surface_dilemma",
  "current_constraints",
  "core_fears",
  "expected_resolution",
]);

export const ScribeProbeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const ScribeQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(ScribeProbeOptionSchema).min(2).max(4),
  purpose: ProbePurposeSchema,
});

export const ProbeResultSchema = z.object({
  questions: z.array(ScribeQuestionSchema).max(3).default([]),
  readyToPropose: z.boolean().default(false),
  thinking: z.string().optional().default(""),
});

export type ValidatedProbeResult = z.infer<typeof ProbeResultSchema>;

export const StrictScribeProbeOptionSchema = z.object({
  id: z.string().min(2).max(48).regex(/^[A-Za-z0-9_-]+$/),
  label: z.string().min(6).max(180),
});

export const StrictScribeQuestionSchema = z.object({
  id: z.string().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  text: z.string().min(14).max(280).refine((text) => /[？?]$/.test(text.trim()), {
    message: "question text must end with a question mark",
  }),
  options: z.array(StrictScribeProbeOptionSchema).min(3).max(4),
  purpose: ProbePurposeSchema,
}).superRefine((question, ctx) => {
  const customOptions = question.options.filter((option) =>
    /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(option.label.trim())
    || option.id === "custom"
  );
  if (customOptions.length !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "each question must include exactly one custom/free-text option",
    });
  }
});

export const StrictProbeResultSchema = z.object({
  schema_version: z.literal("probe_v2"),
  action: z.enum(["ask_more", "issue_proposal"]),
  readyToPropose: z.boolean(),
  confidence: z.number().min(0).max(1),
  missing_keys: z.array(ProbePurposeSchema).max(4),
  questions: z.array(StrictScribeQuestionSchema).max(3),
  thinking: z.string().max(900).optional().default(""),
}).superRefine((result, ctx) => {
  if (result.action === "ask_more") {
    if (result.confidence > 0.74) {
      ctx.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "ask_more requires confidence <= 0.74",
      });
    }
    if (result.readyToPropose) {
      ctx.addIssue({
        code: "custom",
        path: ["readyToPropose"],
        message: "ask_more requires readyToPropose=false",
      });
    }
    if (result.questions.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "ask_more requires 1-3 questions",
      });
    }
    if (result.missing_keys.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["missing_keys"],
        message: "ask_more requires at least one missing key",
      });
    }
  }

  if (result.action === "issue_proposal") {
    if (result.confidence < 0.75) {
      ctx.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "issue_proposal requires confidence >= 0.75",
      });
    }
    if (!result.readyToPropose) {
      ctx.addIssue({
        code: "custom",
        path: ["readyToPropose"],
        message: "issue_proposal requires readyToPropose=true",
      });
    }
    if (result.questions.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "issue_proposal must not include questions",
      });
    }
    if (result.missing_keys.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["missing_keys"],
        message: "issue_proposal must not include missing keys",
      });
    }
  }
});

export type ValidatedStrictProbeResult = z.infer<typeof StrictProbeResultSchema>;

// ─── Issue Proposal (4-Key 议题提案) ───

export const ProposalKeySchema = z.object({
  title: z.string(),
  content: z.string(),
  details: z.array(z.string()).default([]),
});

export const IssueProposalSchema = z.object({
  issue_sentence: z.string().default(""),
  surface_dilemma: ProposalKeySchema,
  current_constraints: ProposalKeySchema,
  core_fears: ProposalKeySchema,
  expected_resolution: ProposalKeySchema,
});

export type ValidatedIssueProposal = z.infer<typeof IssueProposalSchema>;

const StrictProposalContentSchema = z.string()
  .min(18)
  .max(360)
  .refine((value) => !/(待补充|待挖掘|待明确|未知|不清楚|无法判断|建议你|我建议)/.test(value), {
    message: "proposal content must be concrete and must not use placeholders or advice tone",
  });

const StrictProposalDetailSchema = z.string()
  .min(2)
  .max(80)
  .refine((value) => !/(待补充|待挖掘|待明确|未知|不清楚|无法判断)/.test(value), {
    message: "proposal detail must be concrete",
  });

export const StrictIssueProposalSchema = z.object({
  issue_sentence: z.string()
    .min(24)
    .max(280)
    .refine((value) => !/(待补充|待挖掘|待明确|未知|不清楚|无法判断|建议你|我建议)/.test(value), {
      message: "issue sentence must be concrete and must not use placeholders or advice tone",
    }),
  surface_dilemma: z.object({
    title: z.literal("具象化的困惑"),
    content: StrictProposalContentSchema,
    details: z.array(StrictProposalDetailSchema).min(2).max(6),
  }),
  current_constraints: z.object({
    title: z.literal("真实的处境"),
    content: StrictProposalContentSchema,
    details: z.array(StrictProposalDetailSchema).min(2).max(6),
  }),
  core_fears: z.object({
    title: z.literal("隐秘的关切"),
    content: StrictProposalContentSchema,
    details: z.array(StrictProposalDetailSchema).min(2).max(6),
  }),
  expected_resolution: z.object({
    title: z.literal("渴望的终局"),
    content: StrictProposalContentSchema,
    details: z.array(StrictProposalDetailSchema).min(2).max(6),
  }),
}).superRefine((proposal, ctx) => {
  const key3 = proposal.core_fears.content;
  const key4 = proposal.expected_resolution.content;
  if (/怕失去|恐惧|安全感|体面|掌控/.test(key4) && !/验证|判断规则|边界|观察期|产出|排序|标准/.test(key4)) {
    ctx.addIssue({
      code: "custom",
      path: ["expected_resolution", "content"],
      message: "expected_resolution must be a validation task or decision rule, not another fear statement",
    });
  }
  if (key3 === key4) {
    ctx.addIssue({
      code: "custom",
      path: ["core_fears", "content"],
      message: "core_fears and expected_resolution must not be identical",
    });
  }
});

export const StrictProposalResultSchema = z.object({
  schema_version: z.literal("issue_proposal_v2"),
  proposal: StrictIssueProposalSchema,
});

export type ValidatedStrictProposalResult = z.infer<typeof StrictProposalResultSchema>;

// ─── Opening Turns (五声开场) ───

export const OpeningTurnSchema = z.object({
  voice_id: z.string(),
  thesis: z.string(),
  protected_value: z.string(),
  concern: z.string(),
  task_evidence: z.string().default(""),
  pull: z.string().default(""),
});

export const OpeningTurnsResultSchema = z.object({
  turns: z.array(OpeningTurnSchema).min(1),
});

export type ValidatedOpeningTurns = z.infer<typeof OpeningTurnsResultSchema>;

// ─── Roundtable Move (圆桌推进) ───

export const RoundtableTurnSchema = z.object({
  id: z.string().optional(),
  voice_id: z.string(),
  text: z.string(),
  reply_to: z.string().optional(),
  stance: z.string().optional(),
});

export const RoundtableMoveResultSchema = z.object({
  move: z.object({
    id: z.string(),
    type: z.string(),
    triggered_by: z.string().optional(),
    at: z.number().optional(),
  }),
  turns: z.array(RoundtableTurnSchema).default([]),
});

export type ValidatedRoundtableMove = z.infer<typeof RoundtableMoveResultSchema>;

// ─── Scribe Observation + Alignment Inquiry (书记员问询 / 本心落定) ───

export const ScribeObservationSchema = z.object({
  id: z.string(),
  round_index: z.number().optional(),
  trigger: z.string().default("summary"),
  observation: z.string(),
  attribution: z.string().default(""),
  module: z.enum(["creative_hopelessness", "core_values", "cost_acceptance", "minimum_action", "none"]).default("none"),
  evidence: z.array(z.string()).default([]),
  at: z.number().optional(),
});

export const UnansweredRoundtableQuestionSchema = z.object({
  id: z.string(),
  from_voice_id: z.string().optional(),
  from_name: z.string().optional(),
  question: z.string(),
  why_it_matters: z.string().default(""),
  at: z.number().optional(),
});

export const ScribeObservationLedgerSchema = z.object({
  observations: z.array(ScribeObservationSchema).default([]),
  unanswered_questions: z.array(UnansweredRoundtableQuestionSchema).default([]),
  module_signals: z.object({
    creative_hopelessness: z.array(z.string()).default([]),
    core_values: z.array(z.string()).default([]),
    cost_acceptance: z.array(z.string()).default([]),
    minimum_action: z.array(z.string()).default([]),
  }).default({
    creative_hopelessness: [],
    core_values: [],
    cost_acceptance: [],
    minimum_action: [],
  }),
  updated_at: z.number().optional(),
});

export type ValidatedScribeObservationLedger = z.infer<typeof ScribeObservationLedgerSchema>;

export const ObservationModuleSchema = z.enum([
  "creative_hopelessness",
  "core_values",
  "cost_acceptance",
  "minimum_action",
  "none",
]);

export const StrictScribeObservationSchema = z.object({
  id: z.string().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  round_index: z.number().int().min(0).max(999).optional(),
  trigger: z.string().min(2).max(48).default("summary"),
  observation: z.string().min(6).max(260),
  attribution: z.string().max(180).default(""),
  module: ObservationModuleSchema.default("none"),
  evidence: z.array(z.string().min(1).max(140)).max(6).default([]),
  at: z.number().optional(),
});

export const StrictUnansweredRoundtableQuestionSchema = z.object({
  id: z.string().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  from_voice_id: z.enum(["lay", "money", "roam", "filial", "future"]).optional(),
  from_name: z.string().max(40).optional(),
  question: z.string().min(6).max(220).refine((text) => /[？?]$/.test(text.trim()), {
    message: "unanswered question must end with a question mark",
  }),
  why_it_matters: z.string().max(220).default(""),
  at: z.number().optional(),
});

const StrictLedgerSignalListSchema = z.array(z.string().min(1).max(140)).max(8).default([]);

export const StrictScribeObservationLedgerSchema = z.object({
  schema_version: z.literal("observation_ledger_v2"),
  observations: z.array(StrictScribeObservationSchema).max(12).default([]),
  unanswered_questions: z.array(StrictUnansweredRoundtableQuestionSchema).max(8).default([]),
  module_signals: z.object({
    creative_hopelessness: StrictLedgerSignalListSchema,
    core_values: StrictLedgerSignalListSchema,
    cost_acceptance: StrictLedgerSignalListSchema,
    minimum_action: StrictLedgerSignalListSchema,
  }).default({
    creative_hopelessness: [],
    core_values: [],
    cost_acceptance: [],
    minimum_action: [],
  }),
  updated_at: z.number().optional(),
}).superRefine((ledger, ctx) => {
  if (!ledger.observations.length && !ledger.unanswered_questions.length) {
    ctx.addIssue({
      code: "custom",
      path: ["observations"],
      message: "ledger must contain at least one observation or one unanswered roundtable question",
    });
  }
});

export type ValidatedStrictScribeObservationLedger = z.infer<typeof StrictScribeObservationLedgerSchema>;

export const InquiryOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  meaning: z.string().optional(),
});

export const InquiryQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(InquiryOptionSchema).min(2).max(4),
});

export const AlignmentProfileSchema = z.object({
  falsified_fantasy: z.string().default(""),
  core_value_axis: z.string().default(""),
  offended_voices: z.array(z.string()).default([]),
  accepted_costs: z.array(z.string()).default([]),
  refused_costs: z.array(z.string()).default([]),
  unresolved_tensions: z.array(z.string()).default([]),
  hegelian_synthesis: z.object({
    thesis: z.string().default(""),
    antithesis: z.string().default(""),
    synthesis: z.string().default(""),
  }).default({ thesis: "", antithesis: "", synthesis: "" }),
  user_self_statements: z.array(z.string()).default([]),
});

export const InquiryResultSchema = z.object({
  questions: z.array(InquiryQuestionSchema).max(3).default([]),
  readyForReport: z.boolean().default(false),
  alignmentProfile: AlignmentProfileSchema.default({
    falsified_fantasy: "",
    core_value_axis: "",
    offended_voices: [],
    accepted_costs: [],
    refused_costs: [],
    unresolved_tensions: [],
    hegelian_synthesis: { thesis: "", antithesis: "", synthesis: "" },
    user_self_statements: [],
  }),
});

export type ValidatedInquiry = z.infer<typeof InquiryResultSchema>;

export const InquiryModuleSchema = z.enum([
  "falsified_fantasy",
  "core_value_axis",
  "cost_acceptance",
  "minimum_action",
  "dialectic_synthesis",
]);

export const StrictInquiryOptionSchema = z.object({
  id: z.string().min(2).max(48).regex(/^[A-Za-z0-9_-]+$/),
  label: z.string().min(6).max(180),
  meaning: z.string().min(4).max(180).optional(),
});

export const StrictInquiryQuestionSchema = z.object({
  id: z.string().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  module: InquiryModuleSchema,
  question: z.string().min(14).max(320).refine((text) => /[？?]$/.test(text.trim()), {
    message: "inquiry question must end with a question mark",
  }),
  options: z.array(StrictInquiryOptionSchema).min(3).max(4),
}).superRefine((question, ctx) => {
  const customOptions = question.options.filter((option) =>
    /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(option.label.trim())
    || option.id === "custom"
  );
  if (customOptions.length !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "each inquiry question must include exactly one custom/free-text option",
    });
  }
});

export const StrictInquiryResultSchema = z.object({
  schema_version: z.literal("inquiry_v2"),
  action: z.enum(["ask_more", "settlement_report"]),
  readyForReport: z.boolean(),
  confidence: z.number().min(0).max(1),
  missing_modules: z.array(InquiryModuleSchema).max(5),
  questions: z.array(StrictInquiryQuestionSchema).max(3),
  alignmentProfile: AlignmentProfileSchema.optional().default({
    falsified_fantasy: "",
    core_value_axis: "",
    offended_voices: [],
    accepted_costs: [],
    refused_costs: [],
    unresolved_tensions: [],
    hegelian_synthesis: { thesis: "", antithesis: "", synthesis: "" },
    user_self_statements: [],
  }),
}).superRefine((result, ctx) => {
  if (result.action === "ask_more") {
    if (result.confidence > 0.74) {
      ctx.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "ask_more requires confidence <= 0.74",
      });
    }
    if (result.readyForReport) {
      ctx.addIssue({
        code: "custom",
        path: ["readyForReport"],
        message: "ask_more requires readyForReport=false",
      });
    }
    if (result.questions.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "ask_more requires 1-3 questions",
      });
    }
    if (result.missing_modules.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["missing_modules"],
        message: "ask_more requires at least one missing module",
      });
    }
  }

  if (result.action === "settlement_report") {
    if (result.confidence < 0.75) {
      ctx.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "settlement_report requires confidence >= 0.75",
      });
    }
    if (!result.readyForReport) {
      ctx.addIssue({
        code: "custom",
        path: ["readyForReport"],
        message: "settlement_report requires readyForReport=true",
      });
    }
    if (result.questions.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "settlement_report must not include questions",
      });
    }
    if (result.missing_modules.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["missing_modules"],
        message: "settlement_report must not include missing modules",
      });
    }
  }
});

export type ValidatedStrictInquiryResult = z.infer<typeof StrictInquiryResultSchema>;

// ─── Heart Settlement (本心落定) ───

export const SettlementModuleSchema = z.object({
  title: z.string().default(""),
  report: z.string().default(""),
  evidence: z.array(z.string()).optional().default([]),
  user_feedback: z.object({
    status: z.enum(["agree", "disagree"]),
    user_text: z.string().optional(),
  }).optional(),
});

export const AlignmentReportSchema = z.object({
  creative_hopelessness: SettlementModuleSchema,
  core_value_axis: SettlementModuleSchema,
  cost_acceptance_contract: SettlementModuleSchema,
  minimum_viable_commitment: SettlementModuleSchema,
  dialectic_synthesis: z.object({
    thesis: z.string().default(""),
    antithesis: z.string().default(""),
    synthesis: z.string().default(""),
    user_revision: z.string().optional(),
  }),
});

export type ValidatedAlignmentReport = z.infer<typeof AlignmentReportSchema>;

export const StrictSettlementModuleSchema = z.object({
  title: z.string().min(4).max(40),
  report: z.string().min(30).max(900),
  evidence: z.array(z.string().min(2).max(180)).min(1).max(6),
});

export const StrictAlignmentReportSchema = z.object({
  schema_version: z.literal("alignment_report_v2"),
  creative_hopelessness: StrictSettlementModuleSchema,
  core_value_axis: StrictSettlementModuleSchema,
  cost_acceptance_contract: StrictSettlementModuleSchema,
  minimum_viable_commitment: StrictSettlementModuleSchema,
  dialectic_synthesis: z.object({
    thesis: z.string().min(6).max(260),
    antithesis: z.string().min(6).max(260),
    synthesis: z.string().min(20).max(700),
  }),
}).superRefine((report, ctx) => {
  const modules = [
    ["creative_hopelessness", report.creative_hopelessness],
    ["core_value_axis", report.core_value_axis],
    ["cost_acceptance_contract", report.cost_acceptance_contract],
    ["minimum_viable_commitment", report.minimum_viable_commitment],
  ] as const;

  for (const [key, module] of modules) {
    if (/建议你|我建议|应该|清明句|清明落定|本心对齐报告/.test(module.report)) {
      ctx.addIssue({
        code: "custom",
        path: [key, "report"],
        message: "settlement module must not use advice tone or legacy product labels",
      });
    }
  }
});

export type ValidatedStrictAlignmentReport = z.infer<typeof StrictAlignmentReportSchema>;

// ─── TaskFrame (legacy choice-card path) ───

export const VisibleTaskFrameSchema = z.object({
  problem_definition: z.string().default(""),
  current_state: z.string().default(""),
  key_facts: z.array(z.string()).default([]),
  main_choices: z.array(z.string()).default([]),
  core_conflict: z.string().default(""),
  central_question: z.string().default(""),
  main_concerns: z.array(z.string()).default([]),
  discussion_focus: z.string().default(""),
});

export const TaskFrameSchema = z.object({
  visible: VisibleTaskFrameSchema,
  internal: z.record(z.string(), z.unknown()).default({}),
});

export const ChoiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  derived_kv: z.record(z.string(), z.string()).optional(),
});

export const ChoiceCardSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(ChoiceOptionSchema).default([]),
});

export const TaskFrameResultSchema = z.object({
  choiceCards: z.array(ChoiceCardSchema).default([]),
  taskFrame: TaskFrameSchema,
});

// Full proposal result (proposal + taskFrame) for generateValidated usage
export const ProposalResultSchema = z.object({
  proposal: IssueProposalSchema,
  taskFrame: TaskFrameSchema.optional(),
});

export type ValidatedProposalResult = z.infer<typeof ProposalResultSchema>;

// ─── Refinement / flexible roundtable payloads ───

export const RefineResultSchema = z.object({
  needMoreInfo: z.boolean().default(false),
  questions: z.array(ScribeQuestionSchema).optional(),
  proposal: IssueProposalSchema.optional(),
  taskFrame: TaskFrameSchema.optional(),
  thinking: z.string().optional().default(""),
});

export const RoundtableRawResultSchema = z.object({
  turns: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  duel: z.record(z.string(), z.unknown()).optional(),
});

export const TasteProfileSchema = z.object({
  themes: z.array(z.string()).default([]),
  moods: z.array(z.string()).default([]),
  identity_hint: z.string().default(""),
});
