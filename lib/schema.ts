// lib/schema.ts — Zod schemas for structured LLM output validation.
// Reference: Vercel AI SDK Output.object() pattern — validate + auto-repair.

import { z } from "zod";

// ─── Probe (追问) ───

export const ScribeProbeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const ScribeQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(ScribeProbeOptionSchema).min(1),
  purpose: z.string(),
});

export const ProbeResultSchema = z.object({
  questions: z.array(ScribeQuestionSchema).default([]),
  readyToPropose: z.boolean().default(false),
  thinking: z.string().optional().default(""),
});

export type ValidatedProbeResult = z.infer<typeof ProbeResultSchema>;

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

export const InquiryOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  meaning: z.string().optional(),
});

export const InquiryQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(InquiryOptionSchema).min(1),
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
  questions: z.array(InquiryQuestionSchema).default([]),
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
