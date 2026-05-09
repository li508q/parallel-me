// lib/voices.ts — v1 derived views for 我的声音.
// Records are reduced from the local v1 roundtable schema.

import { db, type Meeting, type VoiceId } from "./db";
import { SELVES, type SelfId } from "./selves";
import { VOICE_IDS, settlementCommitment, settlementHeadline } from "./v7";

export interface VoiceStats {
  voiceId: VoiceId;
  name: string;
  ifsLabel?: string;
  appearances: number;
  requestedCount: number;
  directQuestionCount: number;
  challengedCount: number;
  lastSeenAt?: number;
}

export interface VoiceActivityEntry {
  recordId: string;
  title: string;
  at: number;
  closedAt?: number;
  status: Meeting["status"];
  text: string;
  requested: boolean;
  directQuestion?: string;
  duel?: string;
}

function emptyStats(id: VoiceId): VoiceStats {
  const meta = SELVES[id as SelfId];
  return {
    voiceId: id,
    name: meta.name,
    ifsLabel: meta.ifs_label,
    appearances: 0,
    requestedCount: 0,
    directQuestionCount: 0,
    challengedCount: 0,
  };
}

export async function aggregateVoiceStats(): Promise<VoiceStats[]> {
  const meetings = await db.meetings.toArray();
  const map = Object.fromEntries(VOICE_IDS.map((id) => [id, emptyStats(id)])) as Record<VoiceId, VoiceStats>;

  for (const meeting of meetings) {
    const seen = new Set<VoiceId>();
    for (const opening of meeting.roundtable.opening_turns) {
      seen.add(opening.voice_id);
    }
    for (const turn of meeting.roundtable.turns) {
      if (turn.voice_id) seen.add(turn.voice_id);
      if (turn.duel) {
        seen.add(turn.duel.from_voice_id);
        seen.add(turn.duel.to_voice_id);
      }
    }
    for (const id of seen) {
      if (!map[id]) continue;
      map[id].appearances += 1;
      if (!map[id].lastSeenAt || meeting.createdAt > map[id].lastSeenAt!) {
        map[id].lastSeenAt = meeting.createdAt;
      }
    }
    for (const move of meeting.roundtable.moves) {
      if (move.target_voice_id && map[move.target_voice_id]) {
        map[move.target_voice_id].requestedCount += 1;
        if (move.type === "user_to_voice") map[move.target_voice_id].directQuestionCount += 1;
      }
      if (move.from_voice_id && map[move.from_voice_id]) map[move.from_voice_id].challengedCount += 1;
      if (move.to_voice_id && map[move.to_voice_id]) map[move.to_voice_id].challengedCount += 1;
    }
  }

  return VOICE_IDS.map((id) => map[id]).sort(
    (a, b) => b.appearances - a.appearances || b.requestedCount - a.requestedCount,
  );
}

export async function aggregateVoiceActivity(
  voiceId: VoiceId,
): Promise<VoiceActivityEntry[]> {
  const meetings = await db.meetings.orderBy("createdAt").reverse().toArray();
  const out: VoiceActivityEntry[] = [];
  for (const meeting of meetings) {
    const opening = meeting.roundtable.opening_turns.find((t) => t.voice_id === voiceId);
    const firstTurn = meeting.roundtable.turns.find((t) => t.voice_id === voiceId);
    const direct = meeting.roundtable.moves.find(
      (m) => m.type === "user_to_voice" && m.target_voice_id === voiceId,
    );
    const duelTurn = meeting.roundtable.turns.find(
      (t) => t.duel?.from_voice_id === voiceId || t.duel?.to_voice_id === voiceId,
    );
    if (!opening && !firstTurn && !direct && !duelTurn) continue;
    out.push({
      recordId: meeting.id,
      title:
        settlementHeadline(meeting.alignment_report) ||
        meeting.task_frame?.visible.problem_definition ||
        meeting.raw_input,
      at: meeting.createdAt,
      closedAt: meeting.closedAt,
      status: meeting.status,
      text: firstTurn?.text || opening?.thesis || "它在第一轮里参与了这次圆桌。",
      requested: meeting.roundtable.moves.some((m) => m.target_voice_id === voiceId),
      directQuestion: direct?.user_text,
      duel: duelTurn?.duel
        ? `${duelTurn.duel.from_name} → ${duelTurn.duel.to_name}：${duelTurn.duel.question}`
        : undefined,
    });
  }
  return out;
}

export interface VoiceOverview {
  totalRecords: number;
  settledCount: number;
  abandonedCount: number;
  followupCompletedCount: number;
  pendingCommitmentCount: number;
}

export async function aggregateVoiceOverview(): Promise<VoiceOverview> {
  const all = await db.meetings.toArray();
  let settled = 0;
  let abandoned = 0;
  let followupDone = 0;
  let pendingCommit = 0;
  for (const meeting of all) {
    if (meeting.status === "settled") settled += 1;
    if (meeting.status === "abandoned") abandoned += 1;
    if (meeting.commitmentFollowup) followupDone += 1;
    if (meeting.status === "settled" && settlementCommitment(meeting.alignment_report) && !meeting.commitmentFollowup) {
      pendingCommit += 1;
    }
  }
  return {
    totalRecords: all.length,
    settledCount: settled,
    abandonedCount: abandoned,
    followupCompletedCount: followupDone,
    pendingCommitmentCount: pendingCommit,
  };
}
