"use client";

// /meeting — 五声会谈
// A structured self-clarification flow: petition → working focus → five voices
// → follow-up / role reversal / mutual clarification → clarity sentence → 24h
// commitment. Clean V4 records with a single five-voice path.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SELVES, type SelfId } from "@/lib/selves";
import { MeetingTimeline, type TimelineEntry } from "@/components/MeetingTimeline";
import { HostConsole, type ConsoleAction } from "@/components/HostConsole";
import { StageRail } from "@/components/StageRail";
import { DocketPaper } from "@/components/DocketPaper";
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
  type ActivatedVoice,
  type ClarifyingAnswer,
  type CrossClarification,
  type Meeting,
  type MemoryCandidate,
  type RoleReversalTurn,
  type SignatureDecision,
  type VoiceFollowup,
  type VoiceId,
  type VoiceTurn,
} from "@/lib/db";
import {
  loadProfile,
  loadTaste,
  profileToMarkdown,
  tasteToProfileHint,
} from "@/lib/profile";

type Stage =
  | "forming"
  | "focus"
  | "voices"
  | "dialogue"
  | "clarifying"
  | "clarity"
  | "commitment"
  | "memory"
  | "archived";

const BIG_STAGES = [
  { id: "forming", label: "困惑成形" },
  { id: "voices", label: "五声入席" },
  { id: "dialogue", label: "五声对话" },
  { id: "clarity", label: "清明落定" },
];

const STANDING_IDS: SelfId[] = ["lay", "money", "roam", "filial", "future"];

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay: "color-seat-rest",
  money: "color-seat-money",
  roam: "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

function MeetingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const petitionParam = (params.get("petition") ?? "").trim();

  const meetingIdRef = useRef<string>(newMeetingId());
  const startedAtRef = useRef<number>(Date.now());
  const entryKeyRef = useRef(0);
  const initializedPetitionRef = useRef<string | null>(null);

  const [stage, setStage] = useState<Stage>("forming");
  const [provider, setProvider] = useState<ProviderConfig | null>(null);
  const [petition, setPetition] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [workingFocus, setWorkingFocus] = useState("");
  const [focusDraft, setFocusDraft] = useState("");

  const [activatedVoices, setActivatedVoices] = useState<ActivatedVoice[]>([]);
  const [voiceTurns, setVoiceTurns] = useState<VoiceTurn[]>([]);
  const [calledVoiceId, setCalledVoiceId] = useState<VoiceId | null>(null);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followups, setFollowups] = useState<VoiceFollowup[]>([]);
  const [roleReversalMode, setRoleReversalMode] = useState(false);
  const [roleReversalText, setRoleReversalText] = useState("");
  const [roleReversalTurns, setRoleReversalTurns] = useState<RoleReversalTurn[]>([]);
  const [crossClarifications, setCrossClarifications] = useState<CrossClarification[]>([]);

  const [claritySentence, setClaritySentence] = useState("");
  const [clarityDraft, setClarityDraft] = useState("");
  const [nowMe, setNowMe] = useState("");
  const [insight, setInsight] = useState("");
  const [commitment24h, setCommitment24h] = useState("");
  const [loudestVoiceId, setLoudestVoiceId] = useState<VoiceId | undefined>();
  const [loudestVoiceName, setLoudestVoiceName] = useState<string | undefined>();

  const [signature, setSignature] = useState<{
    decision: SignatureDecision;
    action: string;
  } | null>(null);
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState("");

  const pushEntry = useCallback((entry: Omit<TimelineEntry, "key">) => {
    entryKeyRef.current += 1;
    setEntries((prev) => [...prev, { key: `e${entryKeyRef.current}`, ...entry }]);
  }, []);

  const pushScribe = useCallback(
    (text: string) => pushEntry({ kind: "scribe", text }),
    [pushEntry],
  );

  const context = useCallback(() => {
    const profile = loadProfile();
    const taste = loadTaste();
    const meCard = profileToMarkdown(profile, taste);
    const tasteProfile = tasteToProfileHint(taste);
    return meCard || tasteProfile
      ? {
          meCard: meCard || undefined,
          tasteProfile: tasteProfile || undefined,
        }
      : undefined;
  }, []);

  useEffect(() => {
    if (!petitionParam) {
      router.replace("/");
      return;
    }
    if (initializedPetitionRef.current === petitionParam) return;
    const activeProvider = loadActiveProvider();
    if (!toRuntimePayload(activeProvider)) {
      router.replace("/setup");
      return;
    }
    initializedPetitionRef.current = petitionParam;
    setPetition(petitionParam);
    setProvider(activeProvider);
    pushEntry({ kind: "case", text: petitionParam });
    pushScribe("先把困惑放在桌面上，不急着回答。");
    void loadInitialFocus(petitionParam, activeProvider);
  }, [petitionParam, router, pushEntry, pushScribe]);

  async function postJson(
    path: string,
    body: any,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    const runtimePayload = toRuntimePayload(runtimeProvider);
    if (!runtimePayload) throw new Error("请先配置可用的 API Key");
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        context: context(),
        provider: runtimePayload,
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "请求失败");
    if (j.crisis) {
      setCrisis(j.message || "这件事需要真人支持。");
      throw new Error("safety-offramp");
    }
    return j;
  }

  async function loadInitialFocus(
    p: string,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    setBusy(true);
    setError("");
    try {
      const j = await postJson("/api/focus", { petition: p, answers: [] }, runtimeProvider);
      setQuestions(j.questions ?? []);
      setAnswers((j.questions ?? []).map(() => ""));
      setWorkingFocus(j.workingFocus || "");
      setFocusDraft(j.workingFocus || "");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "整理失败");
    } finally {
      setBusy(false);
    }
  }

  async function refineFocus() {
    if (busy) return;
    setBusy(true);
    setError("");
    const payloadAnswers = questions.map((question, i) => ({
      question,
      answer: answers[i]?.trim() || "（未回答）",
    }));
    try {
      const j = await postJson("/api/focus", {
        petition,
        answers: payloadAnswers,
      });
      const clarifyingAnswers: ClarifyingAnswer[] = payloadAnswers.map((a) => ({
        ...a,
        at: Date.now(),
      }));
      clarifyingAnswers.forEach((a) => {
        if (a.answer !== "（未回答）") {
          pushEntry({ kind: "user", speakerName: "你", text: `${a.question}\n${a.answer}` });
        }
      });
      setWorkingFocus(j.workingFocus);
      setFocusDraft(j.workingFocus);
      setStage("focus");
      pushScribe("工作焦点已经浮出来了。你可以改到更像自己的话。");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "整理失败");
    } finally {
      setBusy(false);
    }
  }

  async function confirmFocus() {
    const nextFocus = focusDraft.trim();
    if (!nextFocus || busy) return;
    setWorkingFocus(nextFocus);
    pushEntry({ kind: "user-mark", text: `工作焦点：${nextFocus}` });
    setStage("voices");
    setBusy(true);
    setError("");
    try {
      const payloadAnswers = questions.map((question, i) => ({
        question,
        answer: answers[i]?.trim() || "（未回答）",
      }));
      const j = await postJson("/api/voices", {
        petition,
        workingFocus: nextFocus,
        answers: payloadAnswers,
      });
      setActivatedVoices(j.activatedVoices ?? []);
      setVoiceTurns(
        (j.voiceTurns ?? []).map((t: any) => ({ ...t, at: Date.now() })),
      );
      pushScribe("五声已经入席。先看见它们为什么被唤起。");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "五声入席失败");
    } finally {
      setBusy(false);
    }
  }

  function revealVoiceTurns() {
    if (!voiceTurns.length) return;
    for (const turn of voiceTurns) {
      pushEntry({
        kind: "seat",
        seatId: isStanding(turn.voiceId) ? (turn.voiceId as SelfId) : undefined,
        speakerName: turn.name,
        text: turn.text,
        meta: formatTime(Date.now()),
      });
    }
    pushScribe("五声都说完了。现在轮到你点名追问。");
    setStage("dialogue");
  }

  function selectVoice(id: VoiceId) {
    setCalledVoiceId(id);
    setFollowupQuestion("");
    setRoleReversalMode(false);
    setRoleReversalText("");
    pushScribe(`你点名了「${voiceName(id)}」。`);
  }

  async function submitFollowup() {
    if (!calledVoiceId || !followupQuestion.trim() || busy) return;
    const voice = activatedVoices.find((v) => v.voiceId === calledVoiceId);
    const turn = voiceTurns.find((t) => t.voiceId === calledVoiceId);
    if (!voice) return;
    const question = followupQuestion.trim();
    pushEntry({ kind: "user", speakerName: "你问", text: question });
    setBusy(true);
    setError("");
    try {
      const j = await postJson("/api/clarify", {
        action: "followup",
        petition,
        workingFocus,
        voice,
        prevAnswer: turn?.text || "",
        question,
      });
      const record: VoiceFollowup = {
        voiceId: calledVoiceId,
        voiceName: voice.name,
        question,
        answer: j.answer,
        at: Date.now(),
      };
      setFollowups((prev) => [...prev, record]);
      setFollowupQuestion("");
      pushEntry({
        kind: "followup",
        seatId: isStanding(calledVoiceId) ? (calledVoiceId as SelfId) : undefined,
        speakerName: voice.name,
        text: j.answer,
      });
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "追问失败");
    } finally {
      setBusy(false);
    }
  }

  function saveRoleReversal() {
    if (!calledVoiceId || !roleReversalText.trim()) return;
    const voice = activatedVoices.find((v) => v.voiceId === calledVoiceId);
    if (!voice) return;
    const record: RoleReversalTurn = {
      voiceId: calledVoiceId,
      voiceName: voice.name,
      text: roleReversalText.trim(),
      at: Date.now(),
    };
    setRoleReversalTurns((prev) => [...prev, record]);
    pushEntry({
      kind: "user",
      speakerName: `你坐到「${voice.name}」的位置`,
      text: record.text,
    });
    setRoleReversalText("");
    setRoleReversalMode(false);
  }

  async function enterClarifying() {
    if (busy) return;
    setStage("clarifying");
    setBusy(true);
    setError("");
    try {
      const j = await postJson("/api/clarify", {
        action: "cross",
        petition,
        workingFocus,
        voiceTurns: voiceTurns.map(({ voiceId, name, text }) => ({ voiceId, name, text })),
      });
      const records: CrossClarification[] = (j.crossClarifications ?? []).map((c: any) => ({
        ...c,
        at: Date.now(),
      }));
      setCrossClarifications(records);
      for (const c of records) {
        pushEntry({
          kind: "cross-question",
          seatId: isStanding(c.fromVoiceId) ? (c.fromVoiceId as SelfId) : undefined,
          speakerName: c.fromName,
          toSpeakerName: c.toName,
          text: c.question,
        });
        if (c.response) {
          pushEntry({
            kind: "cross-response",
            seatId: isStanding(c.toVoiceId) ? (c.toVoiceId as SelfId) : undefined,
            speakerName: c.toName,
            text: c.response,
          });
        }
      }
      pushScribe("互问结束。现在把整场会谈落成一句清明的话。");
      setStage("clarity");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "五声互问失败");
    } finally {
      setBusy(false);
    }
  }

  async function generateClarity() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const j = await postJson("/api/nowme", {
        petition,
        workingFocus,
        voiceTurns: voiceTurns.map(({ voiceId, name, text }) => ({ voiceId, name, text })),
        followups: followups.map(({ voiceName, question, answer }) => ({ voiceName, question, answer })),
        roleReversals: roleReversalTurns.map(({ voiceName, text }) => ({ voiceName, text })),
        crossClarifications,
      });
      setClaritySentence(j.claritySentence);
      setClarityDraft(j.claritySentence);
      setNowMe(j.nowMe);
      setInsight(j.insight);
      setCommitment24h(j.commitment24h);
      setLoudestVoiceId(j.loudestVoiceId);
      setLoudestVoiceName(j.loudestVoiceName);
      pushEntry({ kind: "verdict", text: j.nowMe, marginalia: j.insight });
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "清明句生成失败");
    } finally {
      setBusy(false);
    }
  }

  function enterCommitment() {
    const sentence = clarityDraft.trim();
    if (!sentence) return;
    setClaritySentence(sentence);
    pushEntry({ kind: "user-mark", text: `清明句：${sentence}` });
    setStage("commitment");
  }

  function handleSign(action: string) {
    pushEntry({ kind: "user-mark", text: `24h 承诺：「${action}」` });
    const sig = { decision: "signed" as SignatureDecision, action };
    setSignature(sig);
    setCommitment24h(action);
    setMemoryCandidates(buildMemoryCandidates(sig));
    setStage("memory");
  }

  function handlePause() {
    const sig = { decision: "paused" as SignatureDecision, action: "" };
    setSignature(sig);
    setMemoryCandidates(buildMemoryCandidates(sig));
    setStage("memory");
  }

  function handleEscape() {
    const sig = { decision: "escaped" as SignatureDecision, action: "" };
    setSignature(sig);
    setMemoryCandidates(buildMemoryCandidates(sig));
    setStage("memory");
  }

  function buildMemoryCandidates(sig: { decision: SignatureDecision; action: string }): MemoryCandidate[] {
    const candidates: MemoryCandidate[] = [];
    if (claritySentence) {
      candidates.push({
        id: "clarity",
        statement: `清明句：${claritySentence}`,
        category: "pattern",
      });
    }
    if (loudestVoiceName) {
      candidates.push({
        id: "loudest",
        statement: `这次「${loudestVoiceName}」最响。`,
        category: "voice-power",
      });
    }
    if (sig.decision === "signed" && sig.action) {
      candidates.push({
        id: "commitment",
        statement: `24 小时承诺：${sig.action}`,
        category: "decision",
      });
    } else if (sig.decision === "paused") {
      candidates.push({
        id: "paused",
        statement: "这次你选择暂缓，不用硬给答案。",
        category: "decision",
      });
    } else if (sig.decision === "escaped") {
      candidates.push({
        id: "escaped",
        statement: "你承认自己在逃避，这也是看见。",
        category: "decision",
      });
    }
    return candidates.slice(0, 3);
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
    const meeting: Meeting = {
      id: meetingIdRef.current,
      createdAt: startedAtRef.current,
      closedAt: Date.now(),
      status,
      petition,
      clarifyingAnswers: questions.map((question, i) => ({
        question,
        answer: answers[i]?.trim() || "（未回答）",
        at: Date.now(),
      })),
      workingFocus,
      activatedVoices,
      voiceTurns,
      calledVoice: calledVoiceId ?? undefined,
      followups,
      roleReversalTurns,
      crossClarifications,
      claritySentence,
      nowMe: nowMe
        ? {
            text: nowMe,
            insight,
            loudestVoiceId,
            loudestVoiceName,
            at: Date.now(),
          }
        : undefined,
      commitment24h: commitment24h || undefined,
      signature: signature ? { decision: signature.decision, at: Date.now() } : undefined,
      memoryConsent: {
        candidates: memoryCandidates,
        savedIds,
        decidedAt: Date.now(),
      },
    };
    try {
      await saveMeeting(meeting);
    } catch (e) {
      console.error("[voice session save] failed", e);
    }
    pushScribe("纸页已保存。");
    setStage("archived");
    setTimeout(() => router.push("/"), 1300);
  }

  const onSpeak = useCallback(
    (text: string) => {
      pushEntry({ kind: "user", speakerName: "你", text });
      return false;
    },
    [pushEntry],
  );

  const bigStage = toBigStage(stage);
  const done = doneBigStages(bigStage);
  const actions: ConsoleAction[] = [];
  let stageLabel = "";
  let inputDisabled = busy;

  if (stage === "forming") {
    stageLabel = busy ? "困惑成形 · 正在整理" : "困惑成形 · 回答几个小问题";
    actions.push({
      id: "focus",
      label: busy ? "整理中…" : "整理工作焦点 →",
      onClick: refineFocus,
      variant: "primary",
      disabled: busy || questions.length === 0,
    });
  } else if (stage === "focus") {
    stageLabel = "困惑成形 · 确认工作焦点";
    actions.push({
      id: "confirm",
      label: "让五声入席 →",
      onClick: confirmFocus,
      variant: "primary",
      disabled: !focusDraft.trim() || busy,
    });
  } else if (stage === "voices") {
    stageLabel = busy ? "五声入席 · 正在唤起" : "五声入席 · 看见它们";
    actions.push({
      id: "reveal",
      label: "听五声表态 →",
      onClick: revealVoiceTurns,
      variant: "primary",
      disabled: busy || voiceTurns.length === 0,
    });
  } else if (stage === "dialogue") {
    stageLabel = calledVoiceId ? `五声对话 · ${voiceName(calledVoiceId)}` : "五声对话 · 点名一声";
    if (calledVoiceId && !latestFollowupFor(calledVoiceId)) {
      actions.push({
        id: "ask",
        label: busy ? "等回应…" : "问出去",
        onClick: submitFollowup,
        variant: "primary",
        disabled: !followupQuestion.trim() || busy,
      });
    } else if (calledVoiceId) {
      actions.push({
        id: "role",
        label: roleReversalMode ? "记下换位回答" : "坐到这一声回答",
        onClick: roleReversalMode ? saveRoleReversal : () => setRoleReversalMode(true),
        variant: roleReversalMode ? "primary" : "secondary",
        disabled: roleReversalMode && !roleReversalText.trim(),
      });
      actions.push({
        id: "cross",
        label: "进入五声互问 →",
        onClick: enterClarifying,
        variant: "primary",
        disabled: busy,
      });
    }
  } else if (stage === "clarifying") {
    stageLabel = "五声对话 · 互相照见盲点";
    inputDisabled = true;
  } else if (stage === "clarity") {
    stageLabel = nowMe ? "清明落定 · 确认清明句" : "清明落定 · 生成清明句";
    actions.push({
      id: nowMe ? "commitment" : "generate",
      label: nowMe ? "进入 24h 承诺 →" : busy ? "生成中…" : "生成清明句 →",
      onClick: nowMe ? enterCommitment : generateClarity,
      variant: "primary",
      disabled: busy || (nowMe ? !clarityDraft.trim() : false),
    });
  } else if (stage === "commitment") {
    stageLabel = "清明落定 · 24h 承诺";
  } else if (stage === "memory") {
    stageLabel = "记忆同意 · 你说可以才记";
  } else {
    stageLabel = "已保存";
    inputDisabled = true;
  }

  function latestFollowupFor(id: VoiceId) {
    return [...followups].reverse().find((f) => f.voiceId === id);
  }

  function voiceName(id: VoiceId): string {
    return activatedVoices.find((v) => v.voiceId === id)?.name || SELVES[id as SelfId]?.name || String(id);
  }

  let trailing: React.ReactNode = null;
  if (stage === "forming") {
    trailing = (
      <DocketPaper stage="追问" className="my-4" marginalia="不用答得漂亮，只要答得具体。">
        <div className="space-y-4">
          {questions.map((q, i) => (
            <label key={q} className="block">
              <span className="block text-body-sm text-ink-mute mb-2">{q}</span>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value.slice(0, 240);
                    return next;
                  })
                }
                rows={2}
                className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
              />
            </label>
          ))}
        </div>
      </DocketPaper>
    );
  } else if (stage === "focus") {
    trailing = (
      <DocketPaper stage="工作焦点" className="my-4" marginalia="它不是题目，也不是答案，只是这次先听清楚什么。">
        <textarea
          value={focusDraft}
          onChange={(e) => setFocusDraft(e.target.value.slice(0, 180))}
          rows={3}
          autoFocus
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body-long text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "voices") {
    trailing = (
      <DocketPaper stage="五声入席" className="my-4" marginalia="每一声都先被看见：它在保护什么，它怕什么。">
        {busy ? (
          <p className="font-serif text-title text-ink-core">正在听见五声…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activatedVoices.map((v) => (
              <VoiceCard key={v.voiceId} voice={v} />
            ))}
          </div>
        )}
      </DocketPaper>
    );
  } else if (stage === "dialogue" && !calledVoiceId) {
    trailing = (
      <DocketPaper stage="点名追问" className="my-4">
        <p className="text-body-sm text-ink-mute mb-4">
          选一声追问。让会谈从“听它说”进入“你和它说”。
        </p>
        <div className="flex flex-wrap gap-2">
          {activatedVoices.map((v) => (
            <button
              key={v.voiceId}
              type="button"
              onClick={() => selectVoice(v.voiceId)}
              className="px-3 py-1.5 rounded-full bg-paper-base border border-paper-edge text-body-sm text-ink-body hover:border-ink-core transition-colors"
            >
              {v.name}
            </button>
          ))}
        </div>
      </DocketPaper>
    );
  } else if (stage === "dialogue" && calledVoiceId && !latestFollowupFor(calledVoiceId)) {
    trailing = (
      <DocketPaper stage="追问这一声" className="my-4">
        <p className="text-body-sm text-ink-mute mb-3">
          问「{voiceName(calledVoiceId)}」一句。
        </p>
        <textarea
          value={followupQuestion}
          onChange={(e) => setFollowupQuestion(e.target.value.slice(0, 220))}
          rows={3}
          autoFocus
          placeholder="你真正想保护我什么？／如果我听你，会牺牲什么？"
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "dialogue" && calledVoiceId && roleReversalMode) {
    trailing = (
      <DocketPaper stage="换位回答" className="my-4" marginalia="坐到这一声的位置，替它说一句更准确的话。">
        <textarea
          value={roleReversalText}
          onChange={(e) => setRoleReversalText(e.target.value.slice(0, 300))}
          rows={3}
          autoFocus
          className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
        />
      </DocketPaper>
    );
  } else if (stage === "clarity") {
    trailing = (
      <DocketPaper
        stage="清明句"
        className="my-4"
        marginalia={nowMe ? "这句会成为本次纸页的标题。" : undefined}
      >
        {!nowMe ? (
          <p className="font-serif text-title text-ink-core">
            准备把整场会谈落成一句话。
          </p>
        ) : (
          <textarea
            value={clarityDraft}
            onChange={(e) => setClarityDraft(e.target.value.slice(0, 180))}
            rows={3}
            className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body-long text-ink-body font-serif resize-none"
          />
        )}
      </DocketPaper>
    );
  } else if (stage === "commitment") {
    trailing = (
      <SignatureSlip
        verdict={`${claritySentence}\n\n${nowMe}`}
        loudestSeatName={loudestVoiceName}
        defaultAction24h={commitment24h}
        onSign={handleSign}
        onPause={handlePause}
        onEscape={handleEscape}
        className="my-4"
      />
    );
  } else if (stage === "memory") {
    trailing = (
      <MemoryConsentGate
        candidates={memoryCandidates}
        onDecide={archiveMeeting}
        className="my-4"
      />
    );
  } else if (stage === "archived") {
    trailing = (
      <DocketPaper stage="纸页" className="my-4">
        <p className="font-serif text-title text-ink-core mb-3">已保存。</p>
        <p className="text-body text-ink-body">这次你听见了自己。</p>
      </DocketPaper>
    );
  }

  return (
    <div className="min-h-screen bg-paper-base flex flex-col">
      <header className="px-5 sm:px-10 pt-6 pb-3 max-w-3xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <Link
            href="/"
            className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors mt-1"
          >
            ← 我的声音
          </Link>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
              五声会谈
            </span>
            <StageRail stages={BIG_STAGES} current={bigStage} done={done} />
          </div>
        </div>
      </header>

      {activatedVoices.length > 0 && (
        <div className="sticky top-0 z-20 bg-paper-base/95 backdrop-blur border-b border-paper-edge">
          <div className="max-w-3xl mx-auto px-5 sm:px-10 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-x-visible py-2 -mx-1 px-1">
              {activatedVoices.map((v) => (
                <span
                  key={v.voiceId}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-lift border border-paper-edge text-xs whitespace-nowrap"
                  style={{
                    borderLeft: `2px solid ${voiceColor(v.voiceId)}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: voiceColor(v.voiceId) }}
                  />
                  <span className="text-ink-core font-medium">{v.name}</span>
                  {v.voiceId === loudestVoiceId && (
                    <span className="text-[9px] tracking-wider text-attention-copper uppercase">
                      最响
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {crisis && (
        <div className="max-w-3xl mx-auto w-full px-5 sm:px-10 my-4">
          <div className="p-4 rounded-md border border-seal-action/40 bg-paper-lift text-seal-action text-body-sm leading-relaxed">
            {crisis}
          </div>
        </div>
      )}

      {error && !crisis && (
        <div className="max-w-3xl mx-auto w-full px-5 sm:px-10 my-4">
          <div className="p-4 rounded-md border border-seal-action/40 bg-paper-lift text-seal-action text-body-sm">
            {error}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-10 py-6 pb-32 sm:pb-40 font-sans text-ink-body">
        <MeetingTimeline entries={entries} trailing={trailing} />
      </main>

      <HostConsole
        stageLabel={stageLabel}
        actions={actions}
        onSpeak={onSpeak}
        inputDisabled={inputDisabled || !!crisis}
        inputPlaceholder="有一句话想先放在这里…"
      />
    </div>
  );
}

function VoiceCard({ voice }: { voice: ActivatedVoice }) {
  return (
    <article
      className="bg-paper-base border border-paper-edge rounded-md p-3"
      style={{ borderLeft: `3px solid ${voiceColor(voice.voiceId)}` }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-medium text-ink-core">{voice.name}</span>
        <span className="text-[10px] tracking-wider text-ink-faint uppercase">五声</span>
      </div>
      <p className="text-body-sm text-ink-mute leading-snug mb-2">
        {voice.activatedReason}
      </p>
      <p className="text-body-sm text-ink-body leading-snug font-serif">
        保护：{voice.protect}
      </p>
      <p className="text-body-sm text-ink-mute leading-snug font-serif">
        怕：{voice.fear}
      </p>
    </article>
  );
}

function toBigStage(stage: Stage): string {
  if (stage === "forming" || stage === "focus") return "forming";
  if (stage === "voices") return "voices";
  if (stage === "dialogue" || stage === "clarifying") return "dialogue";
  return "clarity";
}

function doneBigStages(current: string): string[] {
  const ids = BIG_STAGES.map((s) => s.id);
  const idx = ids.indexOf(current);
  return idx <= 0 ? [] : ids.slice(0, idx);
}

function isStanding(id: VoiceId): id is SelfId {
  return STANDING_IDS.includes(id as SelfId);
}

function voiceColor(id: VoiceId): string {
  if (isStanding(id)) return `var(--${SEAT_COLOR_VAR[id]})`;
  return "var(--color-ink-mute)";
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
