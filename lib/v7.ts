import { SELVES, type SelfId } from "./selves";
import type { ScribeStreamEvent } from "./agents/events";

export const VOICE_IDS = ["lay", "money", "roam", "filial", "future"] as const;

export type VoiceId = (typeof VOICE_IDS)[number];

export type EvidenceStatus =
  | "raw_explicit"
  | "user_selected"
  | "user_confirmed"
  | "user_edited"
  | "model_inferred"
  | "not_clear";

export type VisibleTaskFrameKey =
  | "problem_definition"
  | "current_state"
  | "key_facts"
  | "main_choices"
  | "core_conflict"
  | "central_question"
  | "main_concerns"
  | "discussion_focus";

export type VisibleSourceLabel = "读出" | "我猜的" | "你说的";

export interface ChoiceOption {
  id: string;
  label: string;
  derived_kv?: Record<string, string>;
}

export interface ChoiceCard {
  id: string;
  question: string;
  options: ChoiceOption[];
}

export interface ChoiceAnswer {
  card_id: string;
  question: string;
  selected_option_id: string;
  selected_label: string;
  custom_text?: string;
  derived_kv?: Record<string, string>;
  at: number;
}

export interface VisibleTaskFrame {
  problem_definition: string;
  current_state: string;
  key_facts: string[];
  main_choices: string[];
  core_conflict: string;
  central_question: string;
  main_concerns: string[];
  discussion_focus: string;
}

export interface FactKV {
  key: string;
  value: string;
  evidence_status: EvidenceStatus;
  source?: "raw_input" | "choice_card" | "user_edit" | "model";
}

export interface PartyKV {
  key: string;
  role: string;
  evidence_status: EvidenceStatus;
}

export interface OptionKV {
  key: string;
  label: string;
  evidence_status: EvidenceStatus;
}

export interface StateTags {
  clarity: "low" | "medium" | "high";
  decision_readiness: "exploring" | "leaning" | "testing" | "not_ready";
  urgency: "low" | "medium" | "high";
  emotional_charge: "low" | "medium" | "high";
}

export interface ValueAxis {
  key: string;
  side_a: string;
  side_b: string;
  evidence_status: EvidenceStatus;
}

export interface PressureSource {
  key: string;
  from: string;
  kind: string;
  evidence_status: EvidenceStatus;
}

export interface ConcernNote {
  key: string;
  text: string;
  evidence_status: EvidenceStatus;
}

export type SourceLabelMap = Partial<Record<VisibleTaskFrameKey, VisibleSourceLabel>>;

export interface InternalTaskFrame {
  facts: FactKV[];
  parties: PartyKV[];
  options: OptionKV[];
  state_tags: StateTags;
  value_axes: ValueAxis[];
  pressure_sources: PressureSource[];
  concern_notes: ConcernNote[];
  source_labels: SourceLabelMap;
  choice_answers: ChoiceAnswer[];
}

export interface TaskFrame {
  visible: VisibleTaskFrame;
  internal: InternalTaskFrame;
  confirmed_at?: number;
  edited_fields?: Partial<Record<VisibleTaskFrameKey, boolean>>;
}

// ─── 4-Key 议题提案（DC 议题定义阶段重构） ───

export interface ProposalKey {
  title: string;       // Key 标题（给用户看的人话）
  content: string;     // 核心内容（1-2 句）
  details: string[];   // 补充细节列表
}

export interface IssueProposal {
  issue_sentence: string;           // 本次议题主句：进入圆桌前的一句话案由
  surface_dilemma: ProposalKey;     // Key 1: 具象化的困惑 — 选择岔路口
  current_constraints: ProposalKey; // Key 2: 真实的处境 — 客观限制
  core_fears: ProposalKey;          // Key 3: 隐秘的关切 — 核心价值/恐惧
  expected_resolution: ProposalKey; // Key 4: 渴望的终局 — 希望圆桌验证什么
}

// ─── 对话式追问 ───

export interface ScribeProbeOption {
  id: string;
  label: string;
}

export interface ScribeQuestion {
  id: string;
  text: string;                     // 书记员问的话（自然语言）
  options: ScribeProbeOption[];     // 猜测选项：基于金字塔原理对用户处境的有根据推测
  purpose: string;                  // 内部：这个问题想挖掘哪个 Key 的信息
}

export interface ScribeAnswer {
  question_id: string;
  selected_option_id?: string;      // 用户选的选项（可选）
  selected_option_label?: string;   // 用户选项的人话文本（给后续模型上下文用）
  question_text?: string;           // 被回答的问题文本（避免历史序列化丢上下文）
  free_text?: string;               // 用户自由输入（可选）
  at: number;
}

export interface DefiningDialogueEntry {
  role: "scribe" | "user";
  question?: ScribeQuestion;        // scribe 的提问
  answer?: ScribeAnswer;            // user 的回答
  thinking_events?: ScribeStreamEvent[]; // 生成这一轮问题前的过程输出
}

export type DefiningDialogue = DefiningDialogueEntry[];

/** 将 IssueProposal 映射为 VisibleTaskFrame（向下兼容圆桌等后续阶段） */
export function proposalToTaskFrame(proposal: IssueProposal): VisibleTaskFrame {
  return {
    problem_definition: proposal.issue_sentence || proposal.surface_dilemma.content,
    current_state: proposal.current_constraints.content,
    key_facts: proposal.current_constraints.details,
    main_choices: proposal.surface_dilemma.details,
    core_conflict: proposal.core_fears.content,
    central_question: proposal.expected_resolution.content,
    main_concerns: proposal.core_fears.details,
    discussion_focus: proposal.expected_resolution.details[0] || "",
  };
}

export interface VoiceOpeningPayload {
  thesis: string;          // 核心诊断：当下的痛苦本质是什么
  protected_value: string; // 正向保护意图：我在为你守护什么底线
  concern: string;         // 必须咽下的苦果：要承受什么代价
  task_evidence: string;   // 议题依据：来自本次议题的具体线索
  pull: string;            // 行动主张：第一步必须做什么
}

export type VoiceTurnTrigger =
  | "opening"
  | "user_text"
  | "user_reaction"
  | "continue_all"
  | "duel"
  | "user_to_voice"
  | "user_to_table";

export interface VoiceOpeningTurn extends VoiceOpeningPayload {
  id: string;
  voice_id: VoiceId;
  name: string;
  at: number;
}

export interface DuelPayload {
  from_voice_id: VoiceId;
  from_name: string;
  to_voice_id: VoiceId;
  to_name: string;
  question: string;
  response: string;
}

export interface RoundtableTurn {
  id: string;
  move_id?: string;
  round_index?: number;
  is_parallel_batch?: boolean;
  trigger: VoiceTurnTrigger;
  voice_id?: VoiceId;
  name?: string;
  text?: string;
  opening?: VoiceOpeningPayload;
  duel?: DuelPayload;
  user_text?: string;
  reply_to?: string;
  reply_to_voice_id?: VoiceId;
  reply_to_name?: string;
  reply_to_text?: string;
  refers_to?: VoiceId[];
  at: number;
}

export type RoundtableMoveType =
  | "continue_all"
  | "duel"
  | "user_to_voice"
  | "user_to_table";

export interface RoundtableMove {
  id: string;
  type: RoundtableMoveType;
  target_voice_id?: VoiceId;
  from_voice_id?: VoiceId;
  to_voice_id?: VoiceId;
  user_text?: string;
  at: number;
}

export interface RoundtableRecord {
  opening_turns: VoiceOpeningTurn[];
  turns: RoundtableTurn[];
  moves: RoundtableMove[];
}

export interface ScribeInquiryOption {
  id: string;
  label: string;
  meaning?: string;
}

export interface ScribeInquiryQuestion {
  id: string;
  question: string;
  options: ScribeInquiryOption[];
}

export interface ScribeInquiryAnswer {
  question_id: string;
  question: string;
  selected_option_id: string;
  selected_label: string;
  custom_text?: string;
  at: number;
}

export interface ScribeObservation {
  id: string;
  round_index?: number;
  trigger: VoiceTurnTrigger | "opening" | "summary";
  observation: string;
  attribution: string;
  module: "creative_hopelessness" | "core_values" | "cost_acceptance" | "minimum_action" | "none";
  evidence: string[];
  at: number;
}

export interface UnansweredRoundtableQuestion {
  id: string;
  from_voice_id?: VoiceId;
  from_name?: string;
  question: string;
  why_it_matters: string;
  at?: number;
}

export interface ScribeObservationLedger {
  observations: ScribeObservation[];
  unanswered_questions: UnansweredRoundtableQuestion[];
  module_signals: {
    creative_hopelessness: string[];
    core_values: string[];
    cost_acceptance: string[];
    minimum_action: string[];
  };
  updated_at: number;
}

export interface AlignmentProfile {
  falsified_fantasy: string;
  core_value_axis: string;
  offended_voices: VoiceId[];
  accepted_costs: string[];
  refused_costs: string[];
  unresolved_tensions: string[];
  hegelian_synthesis: {
    thesis: string;
    antithesis: string;
    synthesis: string;
  };
  user_self_statements: string[];
}

export interface AlignmentCost {
  voice_id: VoiceId;
  cost: string;
  pain: string;
}

export interface AlignmentAction {
  deadline: string;
  action: string;
  acceptance_criteria: string;
}

export type SettlementFeedbackStatus = "agree" | "disagree";

export interface SettlementModuleFeedback {
  status: SettlementFeedbackStatus;
  user_text?: string;
}

export interface SettlementModule {
  title: string;
  report: string;
  evidence?: string[];
  user_feedback?: SettlementModuleFeedback;
}

export interface HeartSettlement {
  creative_hopelessness: SettlementModule;
  core_value_axis: SettlementModule;
  cost_acceptance_contract: SettlementModule;
  minimum_viable_commitment: SettlementModule;
  dialectic_synthesis: {
    thesis: string;
    antithesis: string;
    synthesis: string;
    user_revision?: string;
  };
}

export type AlignmentReport = HeartSettlement;

export type MemoryCategory = "alignment" | "value_axis" | "cost" | "commitment";

export interface MemoryCandidate {
  id: string;
  statement: string;
  category: MemoryCategory;
}

export interface MemoryConsentRecord {
  candidates: MemoryCandidate[];
  savedIds: string[];
  decidedAt: number;
}

export type CommitmentFollowupResult = "done" | "not-done" | "forgot";

export interface CommitmentFollowup {
  result: CommitmentFollowupResult;
  at: number;
  note?: string;
}

export type MeetingStatus = "in_progress" | "settled" | "abandoned";

export interface Meeting {
  id: string;
  createdAt: number;
  closedAt?: number;
  status: MeetingStatus;
  raw_input: string;
  issue_proposal?: IssueProposal;
  choice_cards: ChoiceCard[];
  choice_answers: ChoiceAnswer[];
  task_frame?: TaskFrame;
  roundtable: RoundtableRecord;
  scribe_observation_ledger?: ScribeObservationLedger;
  inquiry_questions: ScribeInquiryQuestion[];
  inquiry_answers: ScribeInquiryAnswer[];
  alignment_profile?: AlignmentProfile;
  alignment_report?: AlignmentReport;
  memoryConsent?: MemoryConsentRecord;
  commitmentFollowup?: CommitmentFollowup;
}

export function emptyRoundtable(): RoundtableRecord {
  return {
    opening_turns: [],
    turns: [],
    moves: [],
  };
}

export function voiceName(id: VoiceId): string {
  return SELVES[id as SelfId]?.name || id;
}

export function settlementHeadline(report?: AlignmentReport | null): string {
  if (!report) return "";
  return (
    report.dialectic_synthesis.user_revision ||
    report.dialectic_synthesis.synthesis ||
    report.core_value_axis.report ||
    report.creative_hopelessness.report ||
    ""
  ).trim();
}

export function settlementCommitment(report?: AlignmentReport | null): string {
  if (!report) return "";
  return (
    report.minimum_viable_commitment.user_feedback?.user_text ||
    report.minimum_viable_commitment.report ||
    ""
  ).trim();
}

export function isVoiceId(id: string): id is VoiceId {
  return (VOICE_IDS as readonly string[]).includes(id);
}
