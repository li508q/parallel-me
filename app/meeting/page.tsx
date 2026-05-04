"use client";

// V3 Quick Meeting — 5-stage state machine.
// case → statements → interrogation → verdict → signature → memory_consent → archived
//
// Hard rules (V3-IVY-FINAL § 3.3):
//   1. 立案确认  · user must confirm topic before SSE starts
//   2. 点名追问  · user must call on one seat AND ask one question
//   3. 签字/暂缓 · user makes a 24h commitment or honest pause
//   4. Memory Consent · user explicitly opts memories in/out before write
// All four gates are non-skippable. SSE delivers verdict + insight early but
// they are kept hidden until the user has discharged the interrogation gate.

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
} from "@/lib/db";
import {
  loadProfile,
  loadTaste,
  profileToMarkdown,
  tasteToProfileHint,
} from "@/lib/profile";
import { getRecentContextForPrompt } from "@/lib/memory";

type Stage =
  | "loading"
  | "case"
  | "statements"
  | "interrogation"
  | "verdict"
  | "signature"
  | "memory_consent"
  | "archived";

const STAGE_RAIL: { id: string; label: string }[] = [
  { id: "case", label: "立案" },
  { id: "statements", label: "三席表态" },
  { id: "interrogation", label: "点名追问" },
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

function MeetingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const topicParam = (params.get("topic") ?? "").trim();

  // Refs that survive re-renders without triggering them
  const meetingIdRef = useRef<string>(newMeetingId());
  const startedAtRef = useRef<number>(Date.now());

  // Stage
  const [stage, setStage] = useState<Stage>("loading");

  // Topic
  const [topic, setTopic] = useState("");
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState("");

  // Provider (snapshot at meeting start)
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

  // Signature
  const [signature, setSignature] = useState<{
    decision: SignatureDecision;
    action: string;
  } | null>(null);

  // Memory candidates (computed at signature → memory_consent transition)
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);

  // ─── init: validate topic, snapshot provider, advance to case ─────────
  useEffect(() => {
    if (!topicParam) {
      router.replace("/");
      return;
    }
    setTopic(topicParam);
    setProvider(loadActiveProvider());
    setStage("case");
  }, [topicParam, router]);

  // ─── stage 1: case confirm ────────────────────────────────────────────
  function confirmCase() {
    setStage("statements");
    void runSse();
  }
  function startEditTopic() {
    setTopicDraft(topic);
    setEditingTopic(true);
  }
  function commitTopicEdit() {
    if (topicDraft.trim()) setTopic(topicDraft.trim());
    setEditingTopic(false);
  }

  // ─── stage 2: SSE statements ──────────────────────────────────────────
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
          mode: "quick",
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

  function advanceToVerdict() {
    setStage("verdict");
  }

  // ─── stage 4-5: verdict → signature ───────────────────────────────────
  function startSignature() {
    setStage("signature");
  }
  function handleSign(action: string) {
    setSignature({ decision: "signed", action });
    enterMemoryConsent({ decision: "signed", action });
  }
  function handlePause() {
    setSignature({ decision: "paused", action: "" });
    enterMemoryConsent({ decision: "paused", action: "" });
  }
  function handleEscape() {
    setSignature({ decision: "escaped", action: "" });
    enterMemoryConsent({ decision: "escaped", action: "" });
  }

  // ─── memory candidate generation ──────────────────────────────────────
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

    const silenced =
      (episode?.silenced_voice as SelfId | undefined) ?? null;
    if (silenced && SELVES[silenced] && silenced !== loudestId) {
      cands.push({
        id: "c-silent",
        statement: `「${SELVES[silenced].name}」被你按下来了。`,
        category: "avoided",
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

  // ─── stage 6: archive to Dexie ────────────────────────────────────────
  async function archiveMeeting(savedIds: string[]) {
    const status: Meeting["status"] =
      signature?.decision === "signed"
        ? "signed"
        : signature?.decision === "paused"
          ? "paused"
          : signature?.decision === "escaped"
            ? "escaped"
            : "abandoned";

    const meeting: Meeting = {
      id: meetingIdRef.current,
      createdAt: startedAtRef.current,
      closedAt: Date.now(),
      status,
      mode: "quick",
      topicRaw: topicParam,
      topicRefined: topic !== topicParam ? topic : undefined,
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

  // ─── derive stage rail visuals ────────────────────────────────────────
  const doneStageIds = (() => {
    const out: string[] = [];
    const order: Stage[] = [
      "case",
      "statements",
      "interrogation",
      "verdict",
      "signature",
    ];
    const currentIdx = order.indexOf(
      stage === "memory_consent" || stage === "archived" ? "signature" : (stage as any)
    );
    for (let i = 0; i < currentIdx; i++) out.push(order[i]);
    if (stage === "memory_consent" || stage === "archived") out.push("signature");
    return out;
  })();
  const currentRailId =
    stage === "loading"
      ? "case"
      : stage === "memory_consent" || stage === "archived"
        ? "signature"
        : stage;

  // ─── render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-3xl mx-auto font-sans text-ink-body">
      <header className="mb-10 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 我的阁
        </Link>
        <StageRail stages={STAGE_RAIL} current={currentRailId} done={doneStageIds} />
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
                这是你刚才提交的议题。下一步，三席会同时表态。
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

      {/* ─── stage: statements + interrogation share UI ─── */}
      {(stage === "statements" || stage === "interrogation") && (
        <>
          <DocketPaper stage="议题" dense className="mb-6">
            <p className="font-serif text-title text-ink-core leading-snug">
              {topic}
            </p>
          </DocketPaper>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
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
            {running && seats.length < 3 && (
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
                  onClick={advanceToVerdict}
                  className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
                >
                  够了，让此刻的我裁决 →
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

      {/* ─── stage: verdict ─── */}
      {stage === "verdict" && (
        <>
          <DocketPaper stage="议题" dense className="mb-6">
            <p className="font-serif text-title text-ink-core leading-snug">
              {topic}
            </p>
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
