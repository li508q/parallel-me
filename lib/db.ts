// lib/db.ts — v1 local workspace · IndexedDB via Dexie
// v1 intentionally starts a fresh local database. Old records are not
// migrated or read; the product now follows one scribe-guided roundtable path.

import Dexie, { type Table } from "dexie";
import type {
  CommitmentFollowup,
  CommitmentFollowupResult,
  Meeting,
} from "./v7";
import { settlementCommitment } from "./v7";

export type {
  ChoiceAnswer,
  ChoiceCard,
  ChoiceOption,
  AlignmentAction,
  AlignmentCost,
  AlignmentProfile,
  AlignmentReport,
  CommitmentFollowup,
  CommitmentFollowupResult,
  ConcernNote,
  EvidenceStatus,
  FactKV,
  InternalTaskFrame,
  IssueProposal,
  Meeting,
  MeetingStatus,
  MemoryCandidate,
  MemoryCategory,
  MemoryConsentRecord,
  RoundtableMove,
  RoundtableMoveType,
  RoundtableRecord,
  RoundtableTurn,
  ScribeObservation,
  ScribeObservationLedger,
  ScribeInquiryAnswer,
  ScribeInquiryOption,
  ScribeInquiryQuestion,
  UnansweredRoundtableQuestion,
  SourceLabelMap,
  TaskFrame,
  VisibleSourceLabel,
  VisibleTaskFrame,
  VisibleTaskFrameKey,
  VoiceId,
  VoiceOpeningPayload,
  VoiceOpeningTurn,
  VoiceTurnTrigger,
} from "./v7";

class ParallelMeDB extends Dexie {
  meetings!: Table<Meeting, string>;

  constructor() {
    super("ParallelMeV10");
    this.version(1).stores({
      meetings: "id, createdAt, closedAt, status",
    });
  }
}

export const db = new ParallelMeDB();

export function newMeetingId(): string {
  return `round_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
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
    .equals("settled")
    .filter(
      (m) =>
        !!settlementCommitment(m.alignment_report) &&
        !m.commitmentFollowup &&
        (m.closedAt ?? 0) > cutoff,
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
  const meeting = await db.meetings.get(meetingId);
  if (!meeting) return;
  const followup: CommitmentFollowup = { result, at: Date.now(), note };
  meeting.commitmentFollowup = followup;
  await db.meetings.put(meeting);
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  await db.meetings.put(meeting);
}

export async function deleteMeeting(id: string): Promise<void> {
  await db.meetings.delete(id);
}

export async function meetingCount(): Promise<number> {
  return db.meetings.count();
}
