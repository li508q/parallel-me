// lib/cabinet.ts — Cabinet derivation layer
//
// Week 4 deliberately does NOT introduce a separate Cabinet/Seat table.
// All seat-level statistics are derived from the meetings table by reducing
// over historical records. This keeps the schema lean and avoids the sync-
// drift class of bugs (where the derived view disagrees with the source of
// truth). When Loop C / temporary seats / promotion mechanics arrive in
// Week 5+, we may introduce a real Seat table — but only if we genuinely
// need persistent state that meetings can't carry.
//
// See V3-LOCAL-FIRST-TECH-ARCH.md § 5.3 for the eventual full Seat shape.

import { db, type Meeting } from "./db";
import { SELVES, type SelfId } from "./selves";

export interface SeatStats {
  seatId: SelfId;
  name: string;
  ifsLabel: string;
  emoji: string;

  appearances: number;       // turns this seat appears in
  loudestCount: number;      // verdicts where this seat was loudest
  followedUpCount: number;   // user called on this seat for a follow-up
  hitCount: number;          // user said "问中了" on a cross-exam this seat asked

  lastSeenAt?: number;       // createdAt of most recent appearance
  lastLoudestAt?: number;    // createdAt of most recent verdict where loudest
}

export interface SeatActivityEntry {
  meetingId: string;
  topic: string;
  at: number;
  closedAt?: number;
  status: Meeting["status"];
  mode: Meeting["mode"];
  text: string;              // this seat's opening turn
  isLoudest: boolean;
  followup?: { question: string; answer: string };
  hits: number;              // # of "问中了" marks for cross-exams this seat asked in this meeting
}

const SEAT_IDS: SelfId[] = ["lay", "money", "roam", "filial", "future"];

function emptyStats(seatId: SelfId): SeatStats {
  const meta = SELVES[seatId];
  return {
    seatId,
    name: meta.name,
    ifsLabel: meta.ifs_label,
    emoji: meta.emoji,
    appearances: 0,
    loudestCount: 0,
    followedUpCount: 0,
    hitCount: 0,
  };
}

/** Aggregate stats across every meeting on disk. Returns one row per standing
 *  seat (currently 5), sorted by appearance count desc. */
export async function aggregateSeatStats(): Promise<SeatStats[]> {
  const meetings = await db.meetings.toArray();
  const map: Record<SelfId, SeatStats> = {} as Record<SelfId, SeatStats>;
  for (const id of SEAT_IDS) map[id] = emptyStats(id);

  for (const m of meetings) {
    for (const turn of m.turns) {
      const id = turn.seatId as SelfId;
      if (!map[id]) continue;
      map[id].appearances += 1;
      const ts = m.createdAt;
      if (!map[id].lastSeenAt || ts > map[id].lastSeenAt!) {
        map[id].lastSeenAt = ts;
      }
    }

    const loud = m.verdict?.loudestSeatId as SelfId | undefined;
    if (loud && map[loud]) {
      map[loud].loudestCount += 1;
      const ts = m.createdAt;
      if (!map[loud].lastLoudestAt || ts > map[loud].lastLoudestAt!) {
        map[loud].lastLoudestAt = ts;
      }
    }

    for (const f of m.followups) {
      const id = f.seatId as SelfId;
      if (map[id]) map[id].followedUpCount += 1;
    }

    if (m.userMarks && m.crossExams) {
      for (const mark of m.userMarks) {
        if (mark.judgement !== "hit" || mark.targetKind !== "cross") continue;
        const cross = m.crossExams[mark.targetIndex];
        if (!cross) continue;
        const id = cross.fromSeatId as SelfId;
        if (map[id]) map[id].hitCount += 1;
      }
    }
  }

  return SEAT_IDS.map((id) => map[id]).sort(
    (a, b) => b.appearances - a.appearances
  );
}

/** Single-seat activity feed across all meetings, newest first. */
export async function aggregateSeatActivity(
  seatId: SelfId
): Promise<SeatActivityEntry[]> {
  const meetings = await db.meetings.orderBy("createdAt").reverse().toArray();
  const out: SeatActivityEntry[] = [];
  for (const m of meetings) {
    const turn = m.turns.find((t) => t.seatId === seatId);
    if (!turn) continue;
    const followup = m.followups.find((f) => f.seatId === seatId);
    let hits = 0;
    if (m.userMarks && m.crossExams) {
      for (const mark of m.userMarks) {
        if (mark.judgement !== "hit" || mark.targetKind !== "cross") continue;
        const cross = m.crossExams[mark.targetIndex];
        if (cross?.fromSeatId === seatId) hits += 1;
      }
    }
    out.push({
      meetingId: m.id,
      topic: m.topicRefined ?? m.topicRaw,
      at: m.createdAt,
      closedAt: m.closedAt,
      status: m.status,
      mode: m.mode,
      text: turn.text,
      isLoudest: m.verdict?.loudestSeatId === seatId,
      followup: followup
        ? { question: followup.question, answer: followup.answer }
        : undefined,
      hits,
    });
  }
  return out;
}

export interface CabinetOverview {
  totalMeetings: number;
  signedCount: number;
  pausedCount: number;
  escapedCount: number;
  followupCompletedCount: number;
  pendingCommitmentCount: number;
}

export async function aggregateCabinetOverview(): Promise<CabinetOverview> {
  const all = await db.meetings.toArray();
  let signed = 0, paused = 0, escaped = 0, followupDone = 0, pendingCommit = 0;
  for (const m of all) {
    if (m.status === "signed") signed += 1;
    else if (m.status === "paused") paused += 1;
    else if (m.status === "escaped") escaped += 1;
    if (m.commitmentFollowup) followupDone += 1;
    if (m.status === "signed" && m.signature?.action24h && !m.commitmentFollowup) {
      pendingCommit += 1;
    }
  }
  return {
    totalMeetings: all.length,
    signedCount: signed,
    pausedCount: paused,
    escapedCount: escaped,
    followupCompletedCount: followupDone,
    pendingCommitmentCount: pendingCommit,
  };
}
