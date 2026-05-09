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
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export const IssueProposalSchema = z.object({
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
  scribeNote: z.string().default(""),
});

export type ValidatedRoundtableMove = z.infer<typeof RoundtableMoveResultSchema>;

// ─── Scribe Inquiry (书记员问询) ───

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

export const PreferenceProfileSchema = z.object({
  hypotheses: z.array(z.string()).default([]),
  validated_leanings: z.array(z.string()).default([]),
  resisted_positions: z.array(z.string()).default([]),
  requested_perspectives: z.array(z.string()).default([]),
  conflict_judgments: z.array(z.string()).default([]),
  accepted_tradeoffs: z.array(z.string()).default([]),
  refused_tradeoffs: z.array(z.string()).default([]),
  unresolved_tensions: z.array(z.string()).default([]),
  user_self_statements: z.array(z.string()).default([]),
});

export const InquiryResultSchema = z.object({
  questions: z.array(InquiryQuestionSchema).default([]),
  preferenceProfile: PreferenceProfileSchema.default({
    hypotheses: [],
    validated_leanings: [],
    resisted_positions: [],
    requested_perspectives: [],
    conflict_judgments: [],
    accepted_tradeoffs: [],
    refused_tradeoffs: [],
    unresolved_tensions: [],
    user_self_statements: [],
  }),
});

export type ValidatedInquiry = z.infer<typeof InquiryResultSchema>;

// ─── Clarity Settlement (清明落定) ───

export const ClarityResultSchema = z.object({
  clarity_sentence: z.string(),
  preference_readout: z.string().default(""),
  tradeoff_acknowledgement: z.string().default(""),
  settlement_posture: z.enum(["leaning", "not_ready", "testing", "boundary", "grieving"]).default("leaning"),
  commitment24h: z.string().default(""),
});

export type ValidatedClarity = z.infer<typeof ClarityResultSchema>;

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
  summary: z.string().optional(),
  mirror: z.string().optional(),
  observation: z.string().optional(),
  scribeNote: z.string().optional(),
  scribe_note: z.string().optional(),
});

export const TasteProfileSchema = z.object({
  themes: z.array(z.string()).default([]),
  moods: z.array(z.string()).default([]),
  identity_hint: z.string().default(""),
});
