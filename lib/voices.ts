// lib/voices.ts — derived views for 我的声音
// New records live in ParallelMeV4 and are reduced directly from saved
// five-voice sessions. No legacy records are read.

import { db, type Meeting, type VoiceId } from "./db";
import { SELVES, type SelfId } from "./selves";

export interface VoiceStats {
  voiceId: VoiceId;
  name: string;
  ifsLabel?: string;
  appearances: number;
  loudestCount: number;
  followedUpCount: number;
  roleReversalCount: number;
  lastSeenAt?: number;
}

export interface VoiceActivityEntry {
  recordId: string;
  title: string;
  at: number;
  closedAt?: number;
  status: Meeting["status"];
  text: string;
  isLoudest: boolean;
  followup?: { question: string; answer: string };
  roleReversal?: string;
}

const STANDING_IDS: SelfId[] = ["lay", "money", "roam", "filial", "future"];

function emptyStats(id: SelfId): VoiceStats {
  const meta = SELVES[id];
  return {
    voiceId: id,
    name: meta.name,
    ifsLabel: meta.ifs_label,
    appearances: 0,
    loudestCount: 0,
    followedUpCount: 0,
    roleReversalCount: 0,
  };
}

export async function aggregateVoiceStats(): Promise<VoiceStats[]> {
  const meetings = await db.meetings.toArray();
  const map: Record<SelfId, VoiceStats> = {} as Record<SelfId, VoiceStats>;
  for (const id of STANDING_IDS) map[id] = emptyStats(id);

  for (const m of meetings) {
    for (const turn of m.voiceTurns) {
      const id = turn.voiceId as SelfId;
      if (!map[id]) continue;
      map[id].appearances += 1;
      if (!map[id].lastSeenAt || m.createdAt > map[id].lastSeenAt!) {
        map[id].lastSeenAt = m.createdAt;
      }
    }
    const loud = m.nowMe?.loudestVoiceId as SelfId | undefined;
    if (loud && map[loud]) map[loud].loudestCount += 1;
    for (const f of m.followups) {
      const id = f.voiceId as SelfId;
      if (map[id]) map[id].followedUpCount += 1;
    }
    for (const r of m.roleReversalTurns) {
      const id = r.voiceId as SelfId;
      if (map[id]) map[id].roleReversalCount += 1;
    }
  }

  return STANDING_IDS.map((id) => map[id]).sort(
    (a, b) => b.appearances - a.appearances,
  );
}

export async function aggregateVoiceActivity(
  voiceId: VoiceId,
): Promise<VoiceActivityEntry[]> {
  const meetings = await db.meetings.orderBy("createdAt").reverse().toArray();
  const out: VoiceActivityEntry[] = [];
  for (const m of meetings) {
    const turn = m.voiceTurns.find((t) => t.voiceId === voiceId);
    if (!turn) continue;
    const followup = m.followups.find((f) => f.voiceId === voiceId);
    const roleReversal = m.roleReversalTurns.find((r) => r.voiceId === voiceId);
    out.push({
      recordId: m.id,
      title: m.claritySentence || m.workingFocus || m.petition,
      at: m.createdAt,
      closedAt: m.closedAt,
      status: m.status,
      text: turn.text,
      isLoudest: m.nowMe?.loudestVoiceId === voiceId,
      followup: followup
        ? { question: followup.question, answer: followup.answer }
        : undefined,
      roleReversal: roleReversal?.text,
    });
  }
  return out;
}

export interface VoiceOverview {
  totalRecords: number;
  signedCount: number;
  pausedCount: number;
  escapedCount: number;
  followupCompletedCount: number;
  pendingCommitmentCount: number;
}

export async function aggregateVoiceOverview(): Promise<VoiceOverview> {
  const all = await db.meetings.toArray();
  let signed = 0, paused = 0, escaped = 0, followupDone = 0, pendingCommit = 0;
  for (const m of all) {
    if (m.status === "signed") signed += 1;
    else if (m.status === "paused") paused += 1;
    else if (m.status === "escaped") escaped += 1;
    if (m.commitmentFollowup) followupDone += 1;
    if (m.status === "signed" && m.commitment24h && !m.commitmentFollowup) {
      pendingCommit += 1;
    }
  }
  return {
    totalRecords: all.length,
    signedCount: signed,
    pausedCount: paused,
    escapedCount: escaped,
    followupCompletedCount: followupDone,
    pendingCommitmentCount: pendingCommit,
  };
}
