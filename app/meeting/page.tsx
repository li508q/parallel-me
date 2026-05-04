"use client";

// V3 Meeting state machine — Quick (3 seats) and Full (5 seats + cross-exam +
// revision) share the same scaffold; full-only stages branch off where needed.
//
// Hard rules (V3-IVY-FINAL § 3.3): four user gates are non-skippable in both
// modes — case confirm / 点名追问 / 签字 / Memory Consent. Full mode adds two
// optional-but-strongly-encouraged gates: assembly confirm and cross-exam
// judgement. Verdict + insight arrive early on the SSE; we hold them until
// the user has discharged interrogation (and cross-exam, in full mode).

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { SELVES, type SelfId } from "@/lib/selves";
import { DocketPaper } from "@/components/DocketPaper";
import { SeatNameplate } from "@/components/SeatNameplate";
import { StageRail } from "@/components/StageRail";
import { SignatureSlip } from "@/components/SignatureSlip";
import { MemoryConsentGate } from "@/components/MemoryConsentGate";
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
  | "assembly"        // full only
  | "statements"
  | "interrogation"
  | "cross_exam"      // full only
  | "revision_check"  // full only
  | "verdict"
  | "signature"
  | "memory_consent"
  | "archived";

const STAGE_RAIL_QUICK: { id: string; label: string }[] = [
  { id: "case", label: "立案" },
  { id: "statements", label: "三席表态" },
  { id: "interrogation", label: "点名追问" },
  { id: "verdict", label: "裁决" },
  { id: "signature", label: "签字" },
];

const STAGE_RAIL_FULL: { id: string; label: string }[] = [
  { id: "case", label: "立案" },
  { id: "assembly", label: "组阁" },
  { id: "statements", label: "五席表态" },
  { id: "interrogation", label: "点名追问" },
  { id: "cross_exam", label: "交叉质询" },
  { id: "revision_check", label: "议案修订" },
  { id: "verdict", label: "裁决" },
  { id: "signature", label: "签字" },
];

interface SeatTurn {
  id: SelfId;
  name: string;
  emoji: string;
  tagline: string;
  text: string;
}

interface FollowupRecord {
  seatId: SelfId;
  question: string;
  answer: string;
}

interface CrossEvent {
  fromId: SelfId;
  toId: SelfId;
  fromName: string;
  toName: string;
  text: string;
}

function MeetingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const topicParam = (params.get("topic") ?? "").trim();
  const modeParam: MeetingMode = params.get("mode") === "full" ? "full" : "quick";

  const meetingIdRef = useRef<string>(newMeetingId());
  const startedAtRef = useRef<number>(Date.now());

  const [stage, setStage] = useState<Stage>("loading");

  const [topic, setTopic] = useState("");
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState("");

  const [provider, setProvider] = useState<ProviderConfig | null>(null);

  // SSE state
  const [seats, setSeats] = useState<SeatTurn[]>([]);
  const [loudestId, setLoudestId] = useState<SelfId | null>(null);
  const [verdict, setVerdict] = useState("");
  const [insight, setInsight] = useState("");
  const [episode, setEpisode] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  // Interrogation
  const [calledSeatId, setCalledSeatId] = useState<SelfId | null>(null);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followupAsking, setFollowupAsking] = useState(false);
  const [followup, setFollowup] = useState<FollowupRecord | null>(null);

  // Full-only: cross-exam
  const [crossEvents, setCrossEvents] = useState<CrossEvent[]>([]);
  const [crossIndex, setCrossIndex] = useState(0);
  const [userMarks, setUserMarks] = useState<UserMark[]>([]);
  const [iWantToReply, setIWantToReply] = useState("");

  // Full-only: revision
  const [topicRevised, setTopicRevised] = useState("");
  const [verdictBasedOn, setVerdictBasedOn] =
    useState<"original" | "revised" | "both">("original");

  // Signature
  const [signature, setSignature] = useState<{
    decision: SignatureDecision;
    action: string;
  } | null>(null);

  // Memory candidates
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);

  // ─── init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!topicParam) {
      router.replace("/");
      return;
    }
    setTopic(topicParam);
    setProvider(loadActiveProvider());
    setStage("case");
  }, [topicParam, router]);

  const stageRail = modeParam === "full" ? STAGE_RAIL_FULL : STAGE_RAIL_QUICK;

  // ─── stage 1: case ────────────────────────────────────────────────────
  function confirmCase() {
    if (modeParam === "full") {
      setStage("assembly");
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
    if (topicDraft.trim()) setTopic(topicDraft.trim());
    setEditingTopic(false);
  }

  // ─── stage 2 (full only): assembly ────────────────────────────────────
  function confirmAssembly() {
    setStage("statements");
    void runSse();
  }

  // ─── SSE statements (+ cross events buffer in full mode) ─────────────
  async function runSse() {
    setRunning(true);
    setError("");

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

    const providerPayload = toRuntimePayload(provider);

    try {
      const r = await fetch("/api/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: topic,
          context,
          mode: modeParam,
          provider: providerPayload,
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
            setSeats((prev) => [
              ...prev,
              { id: f.id, name: f.name, emoji: f.emoji, tagline: f.tagline, text: f.text },
            ]);
          } else if (f.type === "cross") {
            setCrossEvents((prev) => [
              ...prev,
              {
                fromId: f.fromId,
                toId: f.toId,
                fromName: f.from,
                toName: f.to,
                text: f.text,
              },
            ]);
          } else if (f.type === "loudest") {
            setLoudestId(f.id);
          } else if (f.type === "now") {
            setVerdict(f.text);
          } else if (f.type === "insight") {
            setInsight(f.text);
          } else if (f.type === "episode") {
            setEpisode(f.ep);
          } else if (f.type === "error") {
            setError(f.message || "出错");
          } else if (f.type === "done") {
            setStage("interrogation");
            setRunning(false);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || "出错了");
      setRunning(false);
    }
  }

  // ─── stage 3: interrogation ───────────────────────────────────────────
  function callOnSeat(seatId: SelfId) {
    setCalledSeatId(seatId);
    setFollowupQuestion("");
  }

  async function submitFollowup() {
    if (!calledSeatId || !followupQuestion.trim() || followupAsking) return;
    setFollowupAsking(true);
    try {
      const seat = seats.find((s) => s.id === calledSeatId);
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
          question: followupQuestion.trim(),
          context,
          provider: toRuntimePayload(provider),
        }),
      });
      const j = await r.json();
      setFollowup({
        seatId: calledSeatId,
        question: followupQuestion.trim(),
        answer: j.text || j.error || "（没回应）",
      });
    } catch (e: any) {
      setError(e?.message || "追问失败");
    } finally {
      setFollowupAsking(false);
    }
  }

  function resetFollowup() {
    setCalledSeatId(null);
    setFollowupQuestion("");
    setFollowup(null);
  }

  function advanceFromInterrogation() {
    if (modeParam === "full" && crossEvents.length > 0) {
      setStage("cross_exam");
    } else {
      setStage("verdict");
    }
  }

  // ─── stage 4 (full only): cross-exam ──────────────────────────────────
  function judgeCross(judgement: UserMark["judgement"]) {
    const mark: UserMark = {
      targetKind: "cross",
      targetIndex: crossIndex,
      judgement,
      reply: judgement === "i-want-to-answer" ? iWantToReply.trim() : undefined,
      at: Date.now(),
    };
    setUserMarks((prev) => [...prev, mark]);
    setIWantToReply("");
    if (crossIndex + 1 >= crossEvents.length) {
      setStage("revision_check");
      setCrossIndex(0);
    } else {
      setCrossIndex(crossIndex + 1);
    }
  }

  function skipRemainingCross() {
    setStage("revision_check");
  }

  // ─── stage 5 (full only): revision check ──────────────────────────────
  function chooseRevision(based: "original" | "revised" | "both") {
    setVerdictBasedOn(based);
    setStage("verdict");
  }

  // ─── stage 6: verdict → signature ─────────────────────────────────────
  function startSignature() {
    setStage("signature");
  }
  function handleSign(action: string) {
    const sig = { decision: "signed" as SignatureDecision, action };
    setSignature(sig);
    enterMemoryConsent(sig);
  }
  function handlePause() {
    const sig = { decision: "paused" as SignatureDecision, action: "" };
    setSignature(sig);
    enterMemoryConsent(sig);
  }
  function handleEscape() {
    const sig = { decision: "escaped" as SignatureDecision, action: "" };
    setSignature(sig);
    enterMemoryConsent(sig);
  }

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

    const silenced = (episode?.silenced_voice as SelfId | undefined) ?? null;
    if (silenced && SELVES[silenced] && silenced !== loudestId) {
      cands.push({
        id: "c-silent",
        statement: `「${SELVES[silenced].name}」被你按下来了。`,
        category: "avoided",
      });
    }

    // Full-only: hit rate
    const hitMarks = userMarks.filter((m) => m.judgement === "hit");
    if (modeParam === "full" && hitMarks.length > 0) {
      const example = crossEvents[hitMarks[0].targetIndex];
      if (example) {
        cands.push({
          id: "c-cross-hit",
          statement: `「${example.fromName}」对「${example.toName}」的质询你说了"问中了"。`,
          category: "pattern",
        });
      }
    }

    // Topic revision
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

  // ─── archive ──────────────────────────────────────────────────────────
  async function archiveMeeting(savedIds: string[]) {
    const status: Meeting["status"] =
      signature?.decision === "signed"
        ? "signed"
        : signature?.decision === "paused"
          ? "paused"
          : signature?.decision === "escaped"
            ? "escaped"
            : "abandoned";

    const crossExamRecords: CrossExam[] = crossEvents.map((c) => ({
      fromSeatId: c.fromId,
      toSeatId: c.toId,
      text: c.text,
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
      verdict: verdict
        ? {
            text: verdict,
            loudestSeatId: loudestId || undefined,
            insight: insight || undefined,
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
    setStage("archived");
    setTimeout(() => router.push("/"), 1600);
  }

  // ─── stage rail computation ───────────────────────────────────────────
  const railIds = stageRail.map((s) => s.id);
  let currentRailId: string;
  if (stage === "memory_consent" || stage === "archived") {
    currentRailId = "signature";
  } else if (stage === "loading") {
    currentRailId = "case";
  } else {
    currentRailId = stage;
  }
  const currentIdx = railIds.indexOf(currentRailId);
  const doneStageIds = railIds.slice(0, Math.max(0, currentIdx));
  if (stage === "memory_consent" || stage === "archived") {
    doneStageIds.push("signature");
  }

  // ─── render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-10 flex items-start justify-between gap-3 flex-wrap">
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
          <StageRail stages={stageRail} current={currentRailId} done={doneStageIds} />
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-md border border-seal-action/40 bg-paper-lift text-seal-action text-body-sm">
          {error}
        </div>
      )}

      {stage === "loading" && <p className="text-ink-mute">…</p>}

      {/* ─── stage: case ─── */}
      {stage === "case" && (
        <DocketPaper stage="立案">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
            本次议题
          </div>
          {!editingTopic ? (
            <>
              <p className="font-serif text-headline text-ink-core leading-snug mb-3">
                {topic}
              </p>
              <p className="text-body-sm text-ink-mute mb-6">
                {modeParam === "full"
                  ? "下一步，先组阁——决定这次让谁入席。"
                  : "下一步，三席会同时表态。"}
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={confirmCase}
                  className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
                >
                  就按这个开会 →
                </button>
                <button
                  onClick={startEditTopic}
                  className="px-4 py-2 rounded-md text-body-sm text-ink-body hover:bg-paper-base transition-colors"
                >
                  改一下
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="ml-auto text-body-sm text-ink-mute hover:text-ink-core transition-colors"
                >
                  其实不是这个 →
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value.slice(0, 800))}
                rows={4}
                autoFocus
                className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={commitTopicEdit}
                  className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
                >
                  改完了
                </button>
                <button
                  onClick={() => setEditingTopic(false)}
                  className="px-4 py-2 text-body-sm text-ink-mute"
                >
                  取消
                </button>
              </div>
            </>
          )}
        </DocketPaper>
      )}

      {/* ─── stage: assembly (full only) ─── */}
      {stage === "assembly" && modeParam === "full" && (
        <>
          <DocketPaper stage="议题" dense className="mb-6">
            <p className="font-serif text-title text-ink-core leading-snug">{topic}</p>
          </DocketPaper>

          <DocketPaper
            stage="组阁"
            marginalia="先决定谁入席。这是你的会议，你是主持人。"
          >
            <p className="text-body text-ink-body leading-relaxed mb-5">
              本次会议，建议这五席入席：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.values(SELVES) as any[]).map((s) => (
                <div
                  key={s.id}
                  className="bg-paper-base border border-paper-edge rounded-md p-3"
                  style={{
                    borderLeft: `3px solid var(--color-seat-${
                      s.id === "lay"
                        ? "rest"
                        : s.id === "money"
                          ? "money"
                          : s.id === "roam"
                            ? "roam"
                            : s.id === "filial"
                              ? "filial"
                              : "future"
                    })`,
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
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={confirmAssembly}
                className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
              >
                确认组阁，开始表态 →
              </button>
              <span className="text-body-sm text-ink-mute self-center italic">
                替换 / 旁听是 Week 4 功能
              </span>
            </div>
          </DocketPaper>
        </>
      )}

      {/* ─── stage: statements + interrogation share UI ─── */}
      {(stage === "statements" || stage === "interrogation") && (
        <>
          <DocketPaper stage="议题" dense className="mb-6">
            <p className="font-serif text-title text-ink-core leading-snug">
              {topic}
            </p>
          </DocketPaper>

          <div
            className={`grid gap-3 mb-8 ${
              modeParam === "full"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-3"
            }`}
          >
            {seats.map((s) => (
              <SeatNameplate
                key={s.id}
                seatId={s.id}
                name={s.name}
                state={
                  calledSeatId === s.id
                    ? "called"
                    : loudestId === s.id && stage === "statements"
                      ? "speaking"
                      : "default"
                }
                text={s.text}
              />
            ))}
            {running && seats.length < (modeParam === "full" ? 5 : 3) && (
              <div className="p-4 text-body-sm text-ink-mute italic font-serif">
                正在召集中…
              </div>
            )}
          </div>

          {stage === "interrogation" && !followup && (
            <DocketPaper
              stage="点名追问"
              marginalia="一席一问。这是你的会议。"
            >
              {!calledSeatId ? (
                <>
                  <p className="text-body text-ink-body mb-4">
                    谁让你最不舒服？或者最想再问一句？点它。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {seats.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => callOnSeat(s.id)}
                        className="px-4 py-2 rounded-md bg-paper-base border border-paper-edge hover:border-ink-core text-body-sm text-ink-body transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-body-sm text-ink-mute mb-2">
                    问 {SELVES[calledSeatId]?.name}：
                  </p>
                  <textarea
                    value={followupQuestion}
                    onChange={(e) =>
                      setFollowupQuestion(e.target.value.slice(0, 200))
                    }
                    rows={2}
                    autoFocus
                    placeholder="你真正想保护我什么？／你是不是在吓我？／这句话来自哪一次经历？"
                    className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body resize-none"
                  />
                  <div className="mt-4 flex gap-3 items-center">
                    <button
                      onClick={submitFollowup}
                      disabled={!followupQuestion.trim() || followupAsking}
                      className="px-4 py-2 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {followupAsking ? "等回应…" : "问出去"}
                    </button>
                    <button
                      onClick={() => {
                        setCalledSeatId(null);
                        setFollowupQuestion("");
                      }}
                      className="text-body-sm text-ink-mute hover:text-ink-core"
                    >
                      换一席
                    </button>
                  </div>
                </>
              )}
            </DocketPaper>
          )}

          {stage === "interrogation" && followup && (
            <>
              <DocketPaper stage="追问回答" marginalia="它说出来了。">
                <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
                  {SELVES[followup.seatId]?.name} · 回应
                </div>
                <p className="font-serif text-body-long text-ink-body leading-relaxed mb-3">
                  「{followup.question}」
                </p>
                <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
                  {followup.answer}
                </p>
              </DocketPaper>
              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={advanceFromInterrogation}
                  className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
                >
                  {modeParam === "full" && crossEvents.length > 0
                    ? "进入交叉质询 →"
                    : "够了，让此刻的我裁决 →"}
                </button>
                <button
                  onClick={resetFollowup}
                  className="px-4 py-2 text-body-sm text-ink-mute hover:text-ink-core"
                >
                  再问一席
                </button>
              </div>
            </>
          )}

          {stage === "statements" && running && (
            <p className="text-body-sm text-ink-mute italic font-serif">
              此刻的我正在听…
            </p>
          )}
        </>
      )}

      {/* ─── stage: cross_exam (full only) ─── */}
      {stage === "cross_exam" && modeParam === "full" && (
        <CrossExamStage
          events={crossEvents}
          index={crossIndex}
          marks={userMarks}
          iWantToReply={iWantToReply}
          onIWantToReplyChange={setIWantToReply}
          onJudge={judgeCross}
          onSkipRest={skipRemainingCross}
        />
      )}

      {/* ─── stage: revision_check (full only) ─── */}
      {stage === "revision_check" && modeParam === "full" && (
        <DocketPaper
          stage="议案修订"
          marginalia="原议题不一定是真问题。修订是一种诚实。"
        >
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
            原议题
          </div>
          <p className="font-serif text-title text-ink-core leading-snug mb-5">
            {topic}
          </p>

          <p className="text-body text-ink-body mb-3 leading-relaxed">
            质询之后，你看见的真问题，可能是另一个：
          </p>
          <textarea
            value={topicRevised}
            onChange={(e) => setTopicRevised(e.target.value.slice(0, 400))}
            rows={3}
            placeholder={"重写一个更精准的议题。\n比如：「我要不要在不让妈妈失望的前提下，找到自己的步调」"}
            className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none mb-4"
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => chooseRevision("original")}
              className="px-4 py-2 rounded-md bg-paper-base border border-paper-edge hover:border-ink-core text-body-sm text-ink-body transition-colors"
            >
              按原议题裁决 →
            </button>
            <button
              onClick={() => chooseRevision("revised")}
              disabled={!topicRevised.trim()}
              className="px-4 py-2 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              按修订议题裁决 →
            </button>
            <button
              onClick={() => chooseRevision("both")}
              disabled={!topicRevised.trim()}
              className="px-4 py-2 rounded-md text-body-sm text-ink-body hover:bg-paper-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              两个都记入
            </button>
          </div>
        </DocketPaper>
      )}

      {/* ─── stage: verdict ─── */}
      {stage === "verdict" && (
        <>
          <DocketPaper stage="议题" dense className="mb-6">
            <p className="font-serif text-title text-ink-core leading-snug">
              {verdictBasedOn === "revised" && topicRevised ? topicRevised : topic}
            </p>
            {verdictBasedOn === "both" && topicRevised && (
              <p className="mt-2 text-body-sm text-ink-mute italic">
                + 修订议题：{topicRevised}
              </p>
            )}
          </DocketPaper>

          <DocketPaper
            stage="此刻的我"
            marginalia={insight || undefined}
            className="mb-6"
          >
            <p className="font-serif text-verdict text-ink-core leading-relaxed whitespace-pre-line">
              {verdict}
            </p>
            {loudestId && (
              <p className="mt-4 text-body-sm text-ink-mute">
                这次最响的是「{SELVES[loudestId].name}」。
              </p>
            )}
          </DocketPaper>

          <button
            onClick={startSignature}
            className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
          >
            进入签字 →
          </button>
        </>
      )}

      {/* ─── stage: signature ─── */}
      {stage === "signature" && (
        <SignatureSlip
          verdict={verdict}
          loudestSeatName={loudestId ? SELVES[loudestId].name : undefined}
          defaultAction24h={episode?.decision || ""}
          onSign={handleSign}
          onPause={handlePause}
          onEscape={handleEscape}
        />
      )}

      {/* ─── stage: memory consent ─── */}
      {stage === "memory_consent" && (
        <MemoryConsentGate
          candidates={memoryCandidates}
          onDecide={archiveMeeting}
        />
      )}

      {/* ─── stage: archived ─── */}
      {stage === "archived" && (
        <DocketPaper stage="档案">
          <p className="font-serif text-title text-ink-core mb-3">已归档。</p>
          <p className="text-body text-ink-body">
            下次回来，我会问你：那件事，做了吗。
          </p>
        </DocketPaper>
      )}
    </main>
  );
}

// ───────────────────────────────────────────────────────────
// Cross-exam stage UI
// ───────────────────────────────────────────────────────────
function CrossExamStage({
  events,
  index,
  marks,
  iWantToReply,
  onIWantToReplyChange,
  onJudge,
  onSkipRest,
}: {
  events: CrossEvent[];
  index: number;
  marks: UserMark[];
  iWantToReply: string;
  onIWantToReplyChange: (v: string) => void;
  onJudge: (j: UserMark["judgement"]) => void;
  onSkipRest: () => void;
}) {
  const ev = events[index];
  if (!ev) return null;
  const showReply =
    marks.find((m) => m.targetIndex === index)?.judgement === "i-want-to-answer";
  const replyMode = !showReply && iWantToReply.length > 0;

  return (
    <DocketPaper
      stage={`交叉质询 · ${index + 1} / ${events.length}`}
      marginalia="问中了？没问中？还是你想替它回答？"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-6">
        <div className="text-center sm:text-right">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
            发问
          </div>
          <div className="font-medium text-ink-core">{ev.fromName}</div>
        </div>
        <div className="text-center text-ink-mute">→</div>
        <div className="text-center sm:text-left">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
            被问
          </div>
          <div className="font-medium text-ink-core">{ev.toName}</div>
        </div>
      </div>

      <blockquote className="border-l-3 border-ink-core pl-5 py-2 mb-6">
        <p className="font-serif text-verdict text-ink-core leading-relaxed">
          「{ev.text}」
        </p>
      </blockquote>

      {!replyMode ? (
        <>
          <p className="text-body-sm text-ink-mute mb-3 tracking-wider uppercase text-[11px]">
            你怎么看
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => onJudge("hit")}
              className="px-4 py-2 rounded-md bg-safe-green/10 border border-safe-green/40 text-safe-green text-body-sm hover:bg-safe-green/20 transition-colors"
            >
              问中了
            </button>
            <button
              onClick={() => onJudge("miss")}
              className="px-4 py-2 rounded-md bg-paper-base border border-paper-edge text-ink-body text-body-sm hover:border-ink-mute transition-colors"
            >
              没问中
            </button>
            <button
              onClick={() => onIWantToReplyChange(" ")}
              className="px-4 py-2 rounded-md text-body-sm text-ink-mute hover:text-ink-core hover:bg-paper-base transition-colors"
            >
              我想回答
            </button>
          </div>
          <div className="text-xs text-ink-faint">
            {index + 1} / {events.length} ·{" "}
            <button onClick={onSkipRest} className="underline-offset-4 hover:underline">
              跳过剩下，进入修订
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-body-sm text-ink-mute mb-2">
            你替自己回答：
          </p>
          <textarea
            value={iWantToReply.trimStart()}
            onChange={(e) => onIWantToReplyChange(e.target.value.slice(0, 300))}
            rows={3}
            autoFocus
            placeholder="说出口的那一句。"
            className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => onJudge("i-want-to-answer")}
              disabled={!iWantToReply.trim()}
              className="px-4 py-2 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              记入档案
            </button>
            <button
              onClick={() => onIWantToReplyChange("")}
              className="px-3 py-2 text-body-sm text-ink-mute hover:text-ink-core"
            >
              算了
            </button>
          </div>
        </>
      )}
    </DocketPaper>
  );
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
