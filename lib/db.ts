// lib/db.ts — Local Workspace · IndexedDB via Dexie
// MVP scope: a single denormalized Meeting record covers the entire
// Quick Meeting trace (case → statements → followup → verdict → signature →
// memory consent). Cross-cutting Cabinet/Seat/Issue tables are intentionally
// deferred to Week 3+; see TECH-ARCHITECTURE.md § 5.3 for the full
// shape.

import Dexie, { type Table } from "dexie";
import type { SelfId } from "./selves";

export interface MeetingTurn {
  seatId: SelfId;
  text: string;
  at: number;
}

export interface MeetingFollowup {
  seatId: SelfId;
  question: string;
  answer: string;
  at: number;
}

/** Cross-examine event: one seat reframes/challenges another (full mode only). */
export interface CrossExam {
  fromSeatId: SelfId;
  toSeatId: SelfId;
  text: string;          // the challenging question
  at: number;
}

/** User judgement on a cross-exam or seat statement. */
export interface UserMark {
  /** What the mark targets — references CrossExam by index or SeatTurn by id. */
  targetKind: "cross" | "turn";
  targetIndex: number;
  judgement: "hit" | "miss" | "i-want-to-answer";
  reply?: string;        // when judgement is "i-want-to-answer"
  at: number;
}

export interface MeetingVerdict {
  text: string;
  loudestSeatId?: SelfId;
  insight?: string;
  at: number;
}

export type SignatureDecision = "signed" | "paused" | "escaped";

export interface MeetingSignature {
  decision: SignatureDecision;
  action24h?: string;     // empty when paused/escaped
  at: number;
}

export interface MemoryCandidate {
  id: string;
  statement: string;
  category: "pattern" | "seat-power" | "decision" | "avoided";
}

export interface MemoryConsentRecord {
  candidates: MemoryCandidate[];
  savedIds: string[];     // candidate ids user opted to keep
  decidedAt: number;
}

/** Loop A · 24h commitment follow-up record (set when user reviews a signed
 *  action24h from the home page or archive). */
export type CommitmentFollowupResult = "done" | "not-done" | "forgot";

export interface CommitmentFollowup {
  result: CommitmentFollowupResult;
  at: number;
  note?: string;          // optional one-line note from user
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
  mode: "quick" | "full";

  topicRaw: string;
  topicRefined?: string;
  /** Set if user revised the issue mid-meeting (full mode only). */
  topicRevised?: string;
  /** Whether the verdict was made on the revised vs original topic. */
  verdictBasedOn?: "original" | "revised" | "both";

  seatIds: SelfId[];
  turns: MeetingTurn[];
  followups: MeetingFollowup[];
  /** Full-mode only: cross-examine exchanges. */
  crossExams?: CrossExam[];
  /** Full-mode only: user judgement of cross-exams or turns. */
  userMarks?: UserMark[];

  verdict?: MeetingVerdict;
  signature?: MeetingSignature;
  memoryConsent?: MemoryConsentRecord;

  /** Loop A · written when the user reviews their 24h commitment. */
  commitmentFollowup?: CommitmentFollowup;
}

class CabinetDB extends Dexie {
  meetings!: Table<Meeting, string>;

  constructor() {
    super("ParallelMeV3");
    // v1: initial Quick Meeting schema (Week 2)
    this.version(1).stores({
      meetings: "id, createdAt, closedAt, status, mode",
    });
    // v2: same indexes, extended fields (crossExams, userMarks, topicRevised)
    // Index set unchanged → no migration callback needed; new fields are
    // optional and read as undefined on old rows.
    this.version(2).stores({
      meetings: "id, createdAt, closedAt, status, mode",
    });
    // v3: added commitmentFollowup. Same story — optional field on existing rows.
    this.version(3).stores({
      meetings: "id, createdAt, closedAt, status, mode",
    });
  }
}

export const db = new CabinetDB();

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

export function newMeetingId(): string {
  return `meeting_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
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
        !!m.signature?.action24h &&
        !m.commitmentFollowup &&     // not yet reviewed
        (m.closedAt ?? 0) > cutoff
    )
    .reverse()
    .limit(5)
    .toArray();
}

/** Loop A · record the user's review of a signed 24h commitment. */
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
