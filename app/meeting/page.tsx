"use client";

// Week 5 · /meeting — conversational timeline mode.
//
// Replaces Week 3's stage-paper-swap UX with a continuous meeting timeline:
//   • SeatDock at the top — 3 or 5 seats are always *in the room*
//   • MeetingTimeline in the middle — every turn flows down a single scroll
//   • HostConsole at the bottom — stage-specific actions + free-text input
//
// Stage logic (case → assembly? → statements → interrogation → cross_exam? →
// revision_check? → verdict → signature → memory_consent → archived) is
// preserved from Week 3, including all four mandatory user gates per
// PRODUCT-DESIGN § 3.3. What changed is *how* it's expressed: aside from the
// signature ritual and the memory consent gate, no stage replaces the page.
//
// Cross-exam now shows real exchanges (Q + A) thanks to the cross_response
// SSE event added in Week 5. See PRODUCT-DESIGN.md § 4.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SELVES, type SelfId } from "@/lib/selves";
import { TurnEntry } from "@/components/TurnEntry";
import { MeetingTimeline, type TimelineEntry } from "@/components/MeetingTimeline";
import { SeatDock } from "@/components/SeatDock";
import { HostConsole, type ConsoleAction } from "@/components/HostConsole";
import { StageRail } from "@/components/StageRail";
import { SignatureSlip } from "@/components/SignatureSlip";
import { MemoryConsentGate } from "@/components/MemoryConsentGate";
import { DocketPaper } from "@/components/DocketPaper";
import {
  loadActiveProvider,
  toRuntimePayload,
  type ProviderConfig,
} from "@/lib/provider";
import {
  newMeetingId,
  saveMeeting,
  type Meeting,
  type MemoryCandidate,
  type SignatureDecision,
  type CrossExam,
  type UserMark,
} from "@/lib/db";
import {
  loadProfile,
  loadTaste,
  profileToMarkdown,
  tasteToProfileHint,
} from "@/lib/profile";
import { getRecentContextForPrompt } from "@/lib/memory";

type MeetingMode = "quick" | "full";

type Stage =
  | "loading"
  | "case"
  | "assembly"
  | "statements"
  | "interrogation"
  | "cross_exam"
  | "revision_check"
  | "verdict"
  | "signature"
  | "memory_consent"
  | "archived";

const STAGE_RAIL_QUICK = [
  { id: "case", label: "立案" },
  { id: "statements", label: "三席表态" },
  { id: "interrogation", label: "点名追问" },
  { id: "verdict", label: "裁决" },
  { id: "signature", label: "签字" },
];
const STAGE_RAIL_FULL = [
  { id: "case", label: "立案" },
  { id: "assembly", label: "组阁" },
  { id: "statements", label: "五席表态" },
  { id: "interrogation", label: "点名追问" },
  { id: "cross_exam", label: "交叉质询" },
  { id: "revision_check", label: "议案修订" },
  { id: "verdict", label: "裁决" },
  { id: "signature", label: "签字" },
];

const SEAT_COLOR_VAR_KEY: Record<SelfId, string> = {
  lay:    "rest",
  money:  "money",
  roam:   "roam",
  filial: "filial",
  future: "future",
};

interface SeatTurn {
  id: SelfId;
  name: string;
  text: string;
}

interface FollowupRecord {
  seatId: SelfId;
  question: string;
  answer: string;
}

interface CrossPair {
  q: { fromId: SelfId; from: string; toId: SelfId; to: string; text: string };
  r?: { fromId: SelfId; from: string; text: string };
}

function MeetingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const topicParam = (params.get("topic") ?? "").trim();
  const modeParam: MeetingMode =
    params.get("mode") === "full" ? "full" : "quick";

  const meetingIdRef = useRef<string>(newMeetingId());
  const startedAtRef = useRef<number>(Date.now());
  const entryKeyRef = useRef(0);
  const sseStartedRef = useRef(false);

  const [stage, setStage] = useState<Stage>("loading");

  const [topic, setTopic] = useState("");
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState("");
  const [provider, setProvider] = useState<ProviderConfig | null>(null);

  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const [seats, setSeats] = useState<SeatTurn[]>([]);
  const [speakingId, setSpeakingId] = useState<SelfId | null>(null);
  const [loudestId, setLoudestId] = useState<SelfId | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  // Buffered: shown only at the right stage
  const [verdictBuffered, setVerdictBuffered] = useState("");
  const [insightBuffered, setInsightBuffered] = useState("");
  const [episodeBuffered, setEpisodeBuffered] = useState<any | null>(null);
  const [crossPairs, setCrossPairs] = useState<CrossPair[]>([]);

  // Interrogation
  const [calledSeatId, setCalledSeatId] = useState<SelfId | null>(null);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followupAsking, setFollowupAsking] = useState(false);
  const [followup, setFollowup] = useState<FollowupRecord | null>(null);

  // Cross-exam
  const [crossIndex, setCrossIndex] = useState(0);
  const [userMarks, setUserMarks] = useState<UserMark[]>([]);
  const [iWantReply, setIWantReply] = useState("");
  const [iWantReplyMode, setIWantReplyMode] = useState(false);

  // Revision
  const [topicRevised, setTopicRevised] = useState("");
  const [verdictBasedOn, setVerdictBasedOn] =
    useState<"original" | "revised" | "both">("original");

  // Signature
  const [signature, setSignature] = useState<{
    decision: SignatureDecision;
    action: string;
  } | null>(null);

  // Memory
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);

  // ─── Helpers ───
  const pushEntry = useCallback((entry: Omit<TimelineEntry, "key">) => {
    entryKeyRef.current += 1;
    const key = `e${entryKeyRef.current}`;
    setEntries((prev) => [...prev, { key, ...entry }]);
  }, []);

  const pushScribe = useCallback(
    (text: string) => pushEntry({ kind: "scribe", text }),
    [pushEntry]
  );

  // ─── Init ───
  useEffect(() => {
    if (!topicParam) {
      router.replace("/");
      return;
    }
    setTopic(topicParam);
    setProvider(loadActiveProvider());
    setStage("case");
    pushEntry({ kind: "case", text: topicParam });
    pushScribe(
      modeParam === "full"
        ? "完整内阁会议 · 五席 + 交叉质询 + 议案修订"
        : "快速会议 · 三席表态"
    );
  }, [topicParam, router, modeParam, pushEntry, pushScribe]);

  // ─── Stage 1 · case ───
  function confirmCase() {
    pushScribe("议题已立。");
    if (modeParam === "full") {
      setStage("assembly");
      pushScribe("先组阁——决定这次让谁入席。");
    } else {
      setStage("statements");
      void runSse();
    }
  }
  function startEditTopic() {
    setTopicDraft(topic);
    setEditingTopic(true);
  }
  function commitTopicEdit() {
    if (topicDraft.trim() && topicDraft.trim() !== topic) {
      setTopic(topicDraft.trim());
      pushScribe(`议题改写为：${topicDraft.trim()}`);
    }
    setEditingTopic(false);
  }
  function cancelEditTopic() {
    setEditingTopic(false);
  }

  // ─── Stage 2 · assembly (full only) ───
  function confirmAssembly() {
    pushScribe("五席就位。");
    setStage("statements");
    void runSse();
  }

  // ─── SSE ───
  async function runSse() {
    if (sseStartedRef.current) return;
    sseStartedRef.current = true;
    setRunning(true);
    setError("");
    pushScribe("表态开始。");

    const profile = loadProfile();
    const taste = loadTaste();
    const meCard = profileToMarkdown(profile, taste);
    const tasteProfile = tasteToProfileHint(taste);
    const recent = getRecentContextForPrompt();
    const context =
      meCard || tasteProfile || recent
        ? {
            meCard: meCard || undefined,
            tasteProfile: tasteProfile || undefined,
            recentEpisode: recent || undefined,
          }
        : undefined;

    try {
      const r = await fetch("/api/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: topic,
          context,
          mode: modeParam,
          provider: toRuntimePayload(provider),
        }),
      });
      if (!r.ok || !r.body) throw new Error("请求失败");

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() || "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          const f = JSON.parse(ev.slice(6));
          if (f.type === "self") {
            const seatId = f.id as SelfId;
            setSpeakingId(seatId);
            setSeats((prev) => [
              ...prev,
              { id: seatId, name: f.name, text: f.text },
            ]);
            pushEntry({
              kind: "seat",
              seatId,
              speakerName: f.name,
              text: f.text,
              meta: formatTime(Date.now()),
            });
          } else if (f.type === "loudest") {
            setLoudestId(f.id);
          } else if (f.type === "now") {
            setVerdictBuffered(f.text);
          } else if (f.type === "insight") {
            setInsightBuffered(f.text);
          } else if (f.type === "episode") {
            setEpisodeBuffered(f.ep);
          } else if (f.type === "cross") {
            setCrossPairs((prev) => [
              ...prev,
              {
                q: {
                  fromId: f.fromId,
                  from: f.from,
                  toId: f.toId,
                  to: f.to,
                  text: f.text,
                },
              },
            ]);
          } else if (f.type === "cross_response") {
            setCrossPairs((prev) => {
              const last = prev[prev.length - 1];
              if (!last) return prev;
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  r: { fromId: f.fromId, from: f.from, text: f.text },
                },
              ];
            });
          } else if (f.type === "error") {
            setError(f.message || "出错");
          } else if (f.type === "done") {
            setRunning(false);
            setSpeakingId(null);
            pushScribe(
              modeParam === "full"
                ? "五席表态完毕。轮到主持人点名。"
                : "三席表态完毕。轮到主持人点名。"
            );
            setStage("interrogation");
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || "出错了");
      setRunning(false);
      setSpeakingId(null);
    }
  }

  // ─── Stage 3 · interrogation ───
  function callOnSeat(seatId: SelfId) {
    if (stage !== "interrogation") return;
    if (calledSeatId === seatId) return;
    setCalledSeatId(seatId);
    setFollowupQuestion("");
    setFollowup(null);
    pushScribe(`主持人点名 ${SELVES[seatId].name}。`);
  }

  async function submitFollowup() {
    if (!calledSeatId || !followupQuestion.trim() || followupAsking) return;
    const seat = seats.find((s) => s.id === calledSeatId);
    const question = followupQuestion.trim();
    pushEntry({ kind: "user", speakerName: "你问", text: question });
    setFollowupAsking(true);
    try {
      const profile = loadProfile();
      const taste = loadTaste();
      const context = {
        meCard: profileToMarkdown(profile, taste) || undefined,
        tasteProfile: tasteToProfileHint(taste) || undefined,
      };
      const r = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfId: calledSeatId,
          userInput: topic,
          prevAnswer: seat?.text || "",
          question,
          context,
          provider: toRuntimePayload(provider),
        }),
      });
      const j = await r.json();
      const answer = j.text || j.error || "（没回应）";
      pushEntry({
        kind: "followup",
        seatId: calledSeatId,
        speakerName: SELVES[calledSeatId].name,
        text: answer,
      });
      setFollowup({ seatId: calledSeatId, question, answer });
      setFollowupQuestion("");
    } catch (e: any) {
      setError(e?.message || "追问失败");
    } finally {
      setFollowupAsking(false);
    }
  }

  function changeCalledSeat() {
    setCalledSeatId(null);
    setFollowupQuestion("");
    setFollowup(null);
  }

  function advanceFromInterrogation() {
    if (modeParam === "full" && crossPairs.length > 0) {
      pushScribe(`进入交叉质询。本场共 ${crossPairs.length} 对。`);
      revealCrossPair(0);
      setStage("cross_exam");
    } else {
      pushScribe("裁决送出。");
      pushEntry({
        kind: "verdict",
        text: verdictBuffered,
        marginalia: insightBuffered,
      });
      setStage("verdict");
    }
  }

  // ─── Stage 4 · cross-exam (full only) ───
  function revealCrossPair(idx: number) {
    const pair = crossPairs[idx];
    if (!pair) return;
    pushScribe(`第 ${idx + 1} 对 · ${pair.q.from} 质询 ${pair.q.to}`);
    pushEntry({
      kind: "cross-question",
      seatId: pair.q.fromId,
      speakerName: pair.q.from,
      toSpeakerName: pair.q.to,
      text: pair.q.text,
    });
    if (pair.r) {
      pushEntry({
        kind: "cross-response",
        seatId: pair.r.fromId,
        speakerName: pair.r.from,
        text: pair.r.text,
      });
    }
  }

  function judgeCross(judgement: UserMark["judgement"]) {
    const replyText = judgement === "i-want-to-answer" ? iWantReply.trim() : undefined;
    const mark: UserMark = {
      targetKind: "cross",
      targetIndex: crossIndex,
      judgement,
      reply: replyText,
      at: Date.now(),
    };
    setUserMarks((prev) => [...prev, mark]);
    pushEntry({
      kind: "user-mark",
      text:
        judgement === "hit"
          ? "主持人判定：问中了"
          : judgement === "miss"
            ? "主持人判定：没问中"
            : "主持人替自己回答",
    });
    if (judgement === "i-want-to-answer" && replyText) {
      pushEntry({ kind: "user", speakerName: "你", text: replyText });
    }
    setIWantReply("");
    setIWantReplyMode(false);

    const next = crossIndex + 1;
    setCrossIndex(next);

    if (next < crossPairs.length) {
      revealCrossPair(next);
    } else {
      pushScribe("质询完毕。议案修订环节。");
      setStage("revision_check");
    }
  }

  function skipRemainingCross() {
    pushScribe("跳过剩余质询。");
    setStage("revision_check");
  }

  // ─── Stage 5 · revision (full only) ───
  function chooseRevision(based: "original" | "revised" | "both") {
    setVerdictBasedOn(based);
    if (based === "revised" && topicRevised.trim()) {
      pushScribe(`议题修订为：${topicRevised.trim()}`);
    } else if (based === "both" && topicRevised.trim()) {
      pushScribe("两个议题都记入档案。");
    } else {
      pushScribe("按原议题继续。");
    }
    pushScribe("裁决送出。");
    pushEntry({
      kind: "verdict",
      text: verdictBuffered,
      marginalia: insightBuffered,
    });
    setStage("verdict");
  }

  // ─── Stage 6 · verdict → signature ───
  function startSignature() {
    setStage("signature");
  }
  function handleSign(action: string) {
    pushEntry({ kind: "user-mark", text: `主持人签字：「${action}」` });
    const sig = { decision: "signed" as SignatureDecision, action };
    setSignature(sig);
    enterMemoryConsent(sig);
  }
  function handlePause() {
    pushEntry({ kind: "user-mark", text: "主持人选择暂缓" });
    const sig = { decision: "paused" as SignatureDecision, action: "" };
    setSignature(sig);
    enterMemoryConsent(sig);
  }
  function handleEscape() {
    pushEntry({ kind: "user-mark", text: "主持人说：我在逃避" });
    const sig = { decision: "escaped" as SignatureDecision, action: "" };
    setSignature(sig);
    enterMemoryConsent(sig);
  }

  // ─── Memory ───
  function enterMemoryConsent(sig: { decision: SignatureDecision; action: string }) {
    setMemoryCandidates(buildCandidates(sig));
    setStage("memory_consent");
  }

  function buildCandidates(sig: {
    decision: SignatureDecision;
    action: string;
  }): MemoryCandidate[] {
    const cands: MemoryCandidate[] = [];
    if (loudestId && SELVES[loudestId]) {
      cands.push({
        id: "c-loud",
        statement: `这次「${SELVES[loudestId].name}」的声音最响。`,
        category: "seat-power",
      });
    }
    const silenced = (episodeBuffered?.silenced_voice as SelfId | undefined) ?? null;
    if (silenced && SELVES[silenced] && silenced !== loudestId) {
      cands.push({
        id: "c-silent",
        statement: `「${SELVES[silenced].name}」被你按下来了。`,
        category: "avoided",
      });
    }
    const hitMarks = userMarks.filter((m) => m.judgement === "hit");
    if (modeParam === "full" && hitMarks.length > 0) {
      const example = crossPairs[hitMarks[0].targetIndex];
      if (example) {
        cands.push({
          id: "c-cross-hit",
          statement: `「${example.q.from}」对「${example.q.to}」的质询你说了"问中了"。`,
          category: "pattern",
        });
      }
    }
    if (modeParam === "full" && topicRevised.trim()) {
      cands.push({
        id: "c-revision",
        statement: `质询之后，你看见的真问题：${topicRevised.trim().slice(0, 40)}${topicRevised.length > 40 ? "…" : ""}`,
        category: "pattern",
      });
    }
    if (sig.decision === "signed" && sig.action) {
      cands.push({
        id: "c-decision",
        statement: `你说接下来 24 小时会：${sig.action}`,
        category: "decision",
      });
    } else if (sig.decision === "paused") {
      cands.push({
        id: "c-decision",
        statement: "这次议题你选择暂缓——这也是一种诚实。",
        category: "decision",
      });
    } else if (sig.decision === "escaped") {
      cands.push({
        id: "c-decision",
        statement: "你诚实地说了「我在逃避」——这本身就是一步。",
        category: "decision",
      });
    }
    if (cands.length < 3) {
      cands.push({
        id: "c-topic",
        statement: `这次议题：${topic.slice(0, 28)}${topic.length > 28 ? "…" : ""}`,
        category: "pattern",
      });
    }
    return cands.slice(0, 3);
  }

  async function archiveMeeting(savedIds: string[]) {
    const status: Meeting["status"] =
      signature?.decision === "signed"
        ? "signed"
        : signature?.decision === "paused"
          ? "paused"
          : signature?.decision === "escaped"
            ? "escaped"
            : "abandoned";
    const crossExamRecords: CrossExam[] = crossPairs.map((p) => ({
      fromSeatId: p.q.fromId,
      toSeatId: p.q.toId,
      text: p.q.text,
      at: Date.now(),
    }));
    const meeting: Meeting = {
      id: meetingIdRef.current,
      createdAt: startedAtRef.current,
      closedAt: Date.now(),
      status,
      mode: modeParam,
      topicRaw: topicParam,
      topicRefined: topic !== topicParam ? topic : undefined,
      topicRevised: topicRevised.trim() || undefined,
      verdictBasedOn:
        modeParam === "full" && topicRevised.trim() ? verdictBasedOn : undefined,
      seatIds: seats.map((s) => s.id),
      turns: seats.map((s) => ({ seatId: s.id, text: s.text, at: Date.now() })),
      followups: followup
        ? [
            {
              seatId: followup.seatId,
              question: followup.question,
              answer: followup.answer,
              at: Date.now(),
            },
          ]
        : [],
      crossExams: modeParam === "full" ? crossExamRecords : undefined,
      userMarks: modeParam === "full" ? userMarks : undefined,
      verdict: verdictBuffered
        ? {
            text: verdictBuffered,
            loudestSeatId: loudestId || undefined,
            insight: insightBuffered || undefined,
            at: Date.now(),
          }
        : undefined,
      signature: signature
        ? {
            decision: signature.decision,
            action24h: signature.action || undefined,
            at: Date.now(),
          }
        : undefined,
      memoryConsent: {
        candidates: memoryCandidates,
        savedIds,
        decidedAt: Date.now(),
      },
    };
    try {
      await saveMeeting(meeting);
    } catch (e) {
      console.error("[meeting save] failed", e);
    }
    pushScribe("档案已归档。");
    setStage("archived");
    setTimeout(() => router.push("/"), 1600);
  }

  // ─── Free-text speak ───
  const onSpeak = useCallback(
    (text: string) => {
      pushEntry({ kind: "user", speakerName: "你", text });
      return false;
    },
    [pushEntry]
  );

  // ─── Stage rail ───
  const stageRail = modeParam === "full" ? STAGE_RAIL_FULL : STAGE_RAIL_QUICK;
  const railIds = stageRail.map((s) => s.id);
  const currentRailId =
    stage === "memory_consent" || stage === "archived"
      ? "signature"
      : stage === "loading"
        ? "case"
        : stage;
  const currentIdx = railIds.indexOf(currentRailId);
  const doneStageIds = railIds.slice(0, Math.max(0, currentIdx));
  if (stage === "memory_consent" || stage === "archived") {
    doneStageIds.push("signature");
  }

  // ─── Seat dock ───
  const dockSeatIds: SelfId[] =
    seats.length > 0
      ? seats.map((s) => s.id)
      : modeParam === "full"
        ? (["lay", "money", "roam", "filial", "future"] as SelfId[])
        : [];

  const dockCallable = stage === "interrogation";

  // ─── Console actions ───
  const actions: ConsoleAction[] = [];
  let stageLabel = "";
  let inputDisabled = running || stage === "statements";
  let inputPlaceholder: string | undefined;

  switch (stage) {
    case "loading":
      stageLabel = "…";
      inputDisabled = true;
      break;
    case "case":
      stageLabel = editingTopic ? "立案 · 改写议题" : "立案 · 等你确认议题";
      if (!editingTopic) {
        actions.push({ id: "confirm", label: "就这个 ✓", onClick: confirmCase, variant: "primary" });
        actions.push({ id: "edit", label: "改一下", onClick: startEditTopic, variant: "secondary" });
      } else {
        actions.push({ id: "save", label: "改完了", onClick: commitTopicEdit, variant: "primary" });
        actions.push({ id: "cancel", label: "取消", onClick: cancelEditTopic, variant: "muted" });
      }
      break;
    case "assembly":
      stageLabel = "组阁 · 5 席就位";
      actions.push({ id: "confirm", label: "确认组阁，开始表态 →", onClick: confirmAssembly, variant: "primary" });
      break;
    case "statements":
      stageLabel = running ? "三席同时开口…" : "表态进行中";
      inputDisabled = true;
      break;
    case "interrogation":
      if (followup) {
        stageLabel = `${SELVES[followup.seatId].name} 已回应`;
        actions.push({
          id: "advance",
          label:
            modeParam === "full" && crossPairs.length > 0
              ? "进入交叉质询 →"
              : "够了，让此刻的我裁决 →",
          onClick: advanceFromInterrogation,
          variant: "primary",
        });
        actions.push({
          id: "again",
          label: "再问一席",
          onClick: changeCalledSeat,
          variant: "muted",
        });
      } else if (calledSeatId) {
        stageLabel = `问 ${SELVES[calledSeatId].name}`;
        inputPlaceholder = `你想问 ${SELVES[calledSeatId].name} 什么？`;
        actions.push({
          id: "ask",
          label: followupAsking ? "等回应…" : "问出去",
          onClick: submitFollowup,
          variant: "primary",
          disabled: !followupQuestion.trim() || followupAsking,
        });
        actions.push({
          id: "switch",
          label: "换一席",
          onClick: changeCalledSeat,
          variant: "muted",
        });
      } else {
        stageLabel = "点名 · 从顶部 dock 选一席";
      }
      break;
    case "cross_exam":
      stageLabel = `交叉质询 · ${crossIndex + 1}/${crossPairs.length}`;
      if (!iWantReplyMode) {
        actions.push({ id: "hit", label: "问中了", onClick: () => judgeCross("hit"), variant: "primary" });
        actions.push({ id: "miss", label: "没问中", onClick: () => judgeCross("miss"), variant: "secondary" });
        actions.push({ id: "iwa", label: "我想回答", onClick: () => setIWantReplyMode(true), variant: "muted" });
        if (crossIndex + 1 < crossPairs.length) {
          actions.push({ id: "skip", label: "跳过剩下", onClick: skipRemainingCross, variant: "muted" });
        }
      } else {
        actions.push({
          id: "iwa-submit",
          label: "记入档案",
          onClick: () => judgeCross("i-want-to-answer"),
          variant: "primary",
          disabled: !iWantReply.trim(),
        });
        actions.push({
          id: "iwa-cancel",
          label: "算了",
          onClick: () => {
            setIWantReplyMode(false);
            setIWantReply("");
          },
          variant: "muted",
        });
      }
      break;
    case "revision_check":
      stageLabel = "议案修订";
      actions.push({
        id: "original",
        label: "按原议题",
        onClick: () => chooseRevision("original"),
        variant: "secondary",
      });
      actions.push({
        id: "revised",
        label: "按修订议题",
        onClick: () => chooseRevision("revised"),
        variant: "primary",
        disabled: !topicRevised.trim(),
      });
      actions.push({
        id: "both",
        label: "都记入",
        onClick: () => chooseRevision("both"),
        variant: "muted",
        disabled: !topicRevised.trim(),
      });
      break;
    case "verdict":
      stageLabel = "此刻的我已发言";
      actions.push({
        id: "sign",
        label: "进入签字 →",
        onClick: startSignature,
        variant: "primary",
      });
      break;
    case "signature":
      stageLabel = "签字 · 这是仪式";
      break;
    case "memory_consent":
      stageLabel = "记忆 · 你说可以才记入";
      break;
    case "archived":
      stageLabel = "已归档";
      inputDisabled = true;
      break;
  }

  // ─── Trailing inline UI ───
  let trailing: React.ReactNode = null;
  if (stage === "case" && editingTopic) {
    trailing = (
      <DocketPaper stage="改写议题" className="my-4">
        <textarea
          value={topicDraft}
          onChange={(e) => setTopicDraft(e.target.value.slice(0, 800))}
          rows={4}
          autoFocus
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "assembly") {
    trailing = (
      <DocketPaper stage="本次组阁" className="my-4" marginalia="替换 / 旁听是 Week 6+ 功能。">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.values(SELVES) as any[]).map((s) => (
            <div
              key={s.id}
              className="bg-paper-base border border-paper-edge rounded-md p-3"
              style={{
                borderLeft: `3px solid var(--color-seat-${SEAT_COLOR_VAR_KEY[s.id as SelfId]})`,
              }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="font-medium text-ink-core">{s.name}</span>
                <span className="text-[10px] tracking-wider text-ink-faint uppercase">
                  常任
                </span>
              </div>
              <p className="text-body-sm text-ink-mute leading-snug mb-1.5">
                {s.ifs_label}
              </p>
              <p className="text-body-sm text-ink-body leading-snug italic font-serif">
                保护：{s.core_value}
              </p>
            </div>
          ))}
        </div>
      </DocketPaper>
    );
  } else if (stage === "interrogation" && calledSeatId && !followup) {
    trailing = (
      <DocketPaper stage="点名追问" className="my-4">
        <p className="text-body-sm text-ink-mute mb-3">
          问 {SELVES[calledSeatId].name}（直接在底部输入框输入问题）
        </p>
        <textarea
          value={followupQuestion}
          onChange={(e) => setFollowupQuestion(e.target.value.slice(0, 200))}
          rows={2}
          autoFocus
          placeholder="你真正想保护我什么？／你是不是在吓我？／这句话来自哪一次经历？"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              submitFollowup();
            }
          }}
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "cross_exam" && iWantReplyMode) {
    trailing = (
      <DocketPaper stage="替自己回答" className="my-4">
        <textarea
          value={iWantReply}
          onChange={(e) => setIWantReply(e.target.value.slice(0, 300))}
          rows={3}
          autoFocus
          placeholder="说出口的那一句。"
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "revision_check") {
    trailing = (
      <DocketPaper
        stage="重写议题（可选）"
        className="my-4"
        marginalia="原议题不一定是真问题。修订是一种诚实。"
      >
        <textarea
          value={topicRevised}
          onChange={(e) => setTopicRevised(e.target.value.slice(0, 400))}
          rows={3}
          placeholder={"重写一个更精准的议题。\n比如：「我要不要在不让妈妈失望的前提下，找到自己的步调」"}
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "signature") {
    trailing = (
      <SignatureSlip
        verdict={verdictBuffered}
        loudestSeatName={loudestId ? SELVES[loudestId].name : undefined}
        defaultAction24h={episodeBuffered?.decision || ""}
        onSign={handleSign}
        onPause={handlePause}
        onEscape={handleEscape}
        className="my-4"
      />
    );
  } else if (stage === "memory_consent") {
    trailing = (
      <MemoryConsentGate
        candidates={memoryCandidates}
        onDecide={archiveMeeting}
        className="my-4"
      />
    );
  } else if (stage === "archived") {
    trailing = (
      <DocketPaper stage="档案" className="my-4">
        <p className="font-serif text-title text-ink-core mb-3">已归档。</p>
        <p className="text-body text-ink-body">
          下次回来，我会问你：那件事，做了吗。
        </p>
      </DocketPaper>
    );
  }

  return (
    <div className="min-h-screen bg-paper-base flex flex-col">
      {/* Header */}
      <header className="px-5 sm:px-10 pt-6 pb-3 max-w-3xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <Link
            href="/"
            className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors mt-1"
          >
            ← 我的阁
          </Link>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
              {modeParam === "full" ? "完整内阁会议" : "快速会议"}
            </span>
            <StageRail
              stages={stageRail}
              current={currentRailId}
              done={doneStageIds}
            />
          </div>
        </div>
      </header>

      {/* Persistent SeatDock */}
      {dockSeatIds.length > 0 && (
        <div className="sticky top-0 z-20 bg-paper-base/95 backdrop-blur border-b border-paper-edge">
          <div className="max-w-3xl mx-auto px-5 sm:px-10 py-2">
            <SeatDock
              seatIds={dockSeatIds}
              speakingId={speakingId}
              loudestId={loudestId}
              calledId={calledSeatId}
              spokenIds={seats.map((s) => s.id)}
              callable={dockCallable}
              onCall={callOnSeat}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="max-w-3xl mx-auto w-full px-5 sm:px-10 my-4">
          <div className="p-4 rounded-md border border-seal-action/40 bg-paper-lift text-seal-action text-body-sm">
            {error}
          </div>
        </div>
      )}

      {/* Timeline */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-10 py-6 pb-32 sm:pb-40 font-sans text-ink-body">
        <MeetingTimeline entries={entries} trailing={trailing} />
      </main>

      {/* Host console */}
      <HostConsole
        stageLabel={stageLabel}
        actions={actions}
        onSpeak={onSpeak}
        inputDisabled={inputDisabled}
        inputPlaceholder={inputPlaceholder}
      />
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MeetingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-5 sm:px-10 py-14 max-w-3xl mx-auto text-ink-mute">
          …
        </main>
      }
    >
      <MeetingInner />
    </Suspense>
  );
}
