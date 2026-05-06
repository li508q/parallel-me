import { SELVES, type SelfId } from "./selves";

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

export interface VoiceOpeningPayload {
  thesis: string;
  protected_value: string;
  concern: string;
  task_evidence: string;
  pull: string;
  overreach_cost: string;
}

export type VoiceTurnTrigger =
  | "opening"
  | "continue_all"
  | "continue_one"
  | "duel"
  | "user_to_voice"
  | "user_to_table"
  | "scribe_summary";

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
  unresolved_point: string;
}

export interface RoundtableTurn {
  id: string;
  trigger: VoiceTurnTrigger;
  voice_id?: VoiceId;
  name?: string;
  text?: string;
  opening?: VoiceOpeningPayload;
  duel?: DuelPayload;
  user_text?: string;
  refers_to?: VoiceId[];
  at: number;
}

export type RoundtableMoveType =
  | "continue_all"
  | "continue_one"
  | "duel"
  | "user_to_voice"
  | "user_to_table"
  | "scribe_summary"
  | "end_free_roundtable";

export interface RoundtableMove {
  id: string;
  type: RoundtableMoveType;
  target_voice_id?: VoiceId;
  from_voice_id?: VoiceId;
  to_voice_id?: VoiceId;
  user_text?: string;
  scribe_note?: string;
  at: number;
}

export interface TraceItem {
  source: "user_action" | "user_text" | "scribe_inferred";
  target_voice_id?: VoiceId;
  target_turn_id?: string;
  text: string;
  evidence_status: EvidenceStatus;
  at: number;
}

export interface ConflictTrace {
  from_voice_id: VoiceId;
  to_voice_id: VoiceId;
  text: string;
  evidence_status: EvidenceStatus;
  at: number;
}

export interface ScribeTrace {
  requested_rounds: TraceItem[];
  requested_voices: TraceItem[];
  direct_questions: TraceItem[];
  table_interventions: TraceItem[];
  selected_conflicts: ConflictTrace[];
  new_information: TraceItem[];
  scribe_summaries: TraceItem[];
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

export interface PreferenceProfile {
  hypotheses: string[];
  validated_leanings: string[];
  resisted_positions: string[];
  requested_perspectives: string[];
  conflict_judgments: string[];
  accepted_tradeoffs: string[];
  refused_tradeoffs: string[];
  unresolved_tensions: string[];
  user_self_statements: string[];
}

export type SettlementPosture =
  | "leaning"
  | "not_ready"
  | "testing"
  | "boundary"
  | "grieving";

export interface ClarityResult {
  clarity_sentence: string;
  preference_readout: string;
  tradeoff_acknowledgement: string;
  settlement_posture: SettlementPosture;
  commitment24h: string;
  user_revision?: string;
}

export type MemoryCategory = "clarity" | "preference" | "tradeoff" | "commitment";

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
  choice_cards: ChoiceCard[];
  choice_answers: ChoiceAnswer[];
  task_frame?: TaskFrame;
  roundtable: RoundtableRecord;
  scribe_trace: ScribeTrace;
  inquiry_questions: ScribeInquiryQuestion[];
  inquiry_answers: ScribeInquiryAnswer[];
  preference_profile?: PreferenceProfile;
  clarity?: ClarityResult;
  memoryConsent?: MemoryConsentRecord;
  commitmentFollowup?: CommitmentFollowup;
}

export function emptyScribeTrace(): ScribeTrace {
  return {
    requested_rounds: [],
    requested_voices: [],
    direct_questions: [],
    table_interventions: [],
    selected_conflicts: [],
    new_information: [],
    scribe_summaries: [],
  };
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

export function isVoiceId(id: string): id is VoiceId {
  return (VOICE_IDS as readonly string[]).includes(id);
}
