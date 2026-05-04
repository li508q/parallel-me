// lib/db.ts — V3 Local Workspace · IndexedDB via Dexie
// MVP scope: a single denormalized Meeting record covers the entire
// Quick Meeting trace (case → statements → followup → verdict → signature →
// memory consent). Cross-cutting Cabinet/Seat/Issue tables are intentionally
// deferred to Week 3+; see V3-LOCAL-FIRST-TECH-ARCH.md § 5.3 for the full
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

  seatIds: SelfId[];
  turns: MeetingTurn[];
  followups: MeetingFollowup[];

  verdict?: MeetingVerdict;
  signature?: MeetingSignature;
  memoryConsent?: MemoryConsentRecord;
}

class CabinetDB extends Dexie {
  meetings!: Table<Meeting, string>;

  constructor() {
    super("ParallelMeV3");
    this.version(1).stores({
      // Indexed fields. status & mode are useful for filtering;
      // createdAt for sort.
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
        (m.closedAt ?? 0) > cutoff
    )
    .reverse()
    .limit(5)
    .toArray();
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
