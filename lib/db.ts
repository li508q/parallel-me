// lib/db.ts — Local Workspace · IndexedDB via Dexie
// Current local schema: one clean denormalized record for a structured
// five-voice self-clarification session. This intentionally uses a new DB
// name so pre-refactor records are left untouched and unread.

import Dexie, { type Table } from "dexie";
import type { SelfId } from "./selves";

export type VoiceId = SelfId;

export interface ClarifyingAnswer {
  question: string;
  answer: string;
  at: number;
}

export interface ActivatedVoice {
  voiceId: VoiceId;
  name: string;
  source: "standing";
  protect: string;
  fear: string;
  activatedReason: string;
  ifsLabel?: string;
}

export interface VoiceTurn {
  voiceId: VoiceId;
  name: string;
  text: string;
  at: number;
}

export interface VoiceFollowup {
  voiceId: VoiceId;
  voiceName: string;
  question: string;
  answer: string;
  at: number;
}

export interface RoleReversalTurn {
  voiceId: VoiceId;
  voiceName: string;
  text: string;
  at: number;
}

export interface CrossClarification {
  fromVoiceId: VoiceId;
  fromName: string;
  toVoiceId: VoiceId;
  toName: string;
  question: string;
  response?: string;
  at: number;
}

export interface NowMeRecord {
  text: string;
  insight?: string;
  loudestVoiceId?: VoiceId;
  loudestVoiceName?: string;
  at: number;
}

export type SignatureDecision = "signed" | "paused" | "escaped";

export interface MeetingSignature {
  decision: SignatureDecision;
  at: number;
}

export interface MemoryCandidate {
  id: string;
  statement: string;
  category: "pattern" | "voice-power" | "decision" | "avoided";
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

export type MeetingStatus =
  | "in_progress"
  | "signed"
  | "paused"
  | "escaped"
  | "abandoned";

export interface Meeting {
  id: string;
  createdAt: number;
  closedAt?: number;
  status: MeetingStatus;

  petition: string;
  clarifyingAnswers: ClarifyingAnswer[];
  workingFocus: string;
  activatedVoices: ActivatedVoice[];
  voiceTurns: VoiceTurn[];
  calledVoice?: VoiceId;
  followups: VoiceFollowup[];
  roleReversalTurns: RoleReversalTurn[];
  crossClarifications: CrossClarification[];
  claritySentence?: string;
  nowMe?: NowMeRecord;
  commitment24h?: string;
  signature?: MeetingSignature;
  memoryConsent?: MemoryConsentRecord;

  commitmentFollowup?: CommitmentFollowup;
}

class VoiceDB extends Dexie {
  meetings!: Table<Meeting, string>;

  constructor() {
    super("ParallelMeV4");
    this.version(1).stores({
      meetings: "id, createdAt, closedAt, status",
    });
  }
}

export const db = new VoiceDB();

export function newMeetingId(): string {
  return `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function getMeeting(id: string): Promise<Meeting | undefined> {
  return db.meetings.get(id);
}

export async function recentMeetings(limit = 5): Promise<Meeting[]> {
  return db.meetings.orderBy("createdAt").reverse().limit(limit).toArray();
}

export async function pendingCommitments(maxDays = 14): Promise<Meeting[]> {
  const cutoff = Date.now() - maxDays * 86_400_000;
  return db.meetings
    .where("status")
    .equals("signed")
    .filter(
      (m) =>
        !!m.commitment24h &&
        !m.commitmentFollowup &&
        (m.closedAt ?? 0) > cutoff
    )
    .reverse()
    .limit(5)
    .toArray();
}

export async function recordCommitmentFollowup(
  meetingId: string,
  result: CommitmentFollowupResult,
  note?: string,
): Promise<void> {
  const m = await db.meetings.get(meetingId);
  if (!m) return;
  m.commitmentFollowup = { result, at: Date.now(), note };
  await db.meetings.put(m);
}

export async function saveMeeting(m: Meeting): Promise<void> {
  await db.meetings.put(m);
}

export async function deleteMeeting(id: string): Promise<void> {
  await db.meetings.delete(id);
}

export async function meetingCount(): Promise<number> {
  return db.meetings.count();
}
