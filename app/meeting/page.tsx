"use client";

// /meeting — v1 五声圆桌
// A scribe-guided path: raw input -> task frame -> fixed five-voice
// roundtable -> invisible scribe observation -> inquiry -> 本心落定.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DocketPaper } from "@/components/DocketPaper";
import { DefiningDialogueBoard, DefiningDialogueHistory } from "@/components/DefiningDialogueBoard";
import { ErrorRecoveryBar } from "@/components/ErrorRecoveryBar";
import { HostConsole, type ConsoleAction } from "@/components/HostConsole";
import { IssueProposalBoard } from "@/components/IssueProposalBoard";
import { StageRail } from "@/components/StageRail";
import type { ScribeStreamEvent } from "@/lib/agents/events";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  loadActiveProvider,
  toRuntimePayload,
  type ProviderConfig,
} from "@/lib/provider";
import { useMeetingStore, type DefiningSubStage, type MeetingStage } from "@/lib/store/meeting-store";
import type { LlmErrorCode } from "@/lib/llm";
import {
  newMeetingId,
  saveMeeting,
  type AlignmentReport,
  type Meeting,
  type RoundtableMove,
  type RoundtableRecord,
  type RoundtableTurn,
  type ScribeInquiryAnswer,
  type ScribeInquiryQuestion,
  type TaskFrame,
  type VisibleTaskFrame,
  type VoiceId,
  type VoiceOpeningTurn,
  type VoiceTurnTrigger,
} from "@/lib/db";
import {
  VOICE_IDS,
  emptyRoundtable,
  proposalToTaskFrame,
  settlementCommitment,
  settlementHeadline,
  voiceName,
  type AlignmentProfile,
  type DefiningDialogueEntry,
  type IssueProposal,
  type SettlementModule,
  type ScribeObservationLedger,
  type ScribeAnswer,
  type ScribeQuestion,
} from "@/lib/v7";
import {
  loadProfile,
  loadTaste,
  profileToMarkdown,
  tasteToProfileHint,
} from "@/lib/profile";

type Stage = MeetingStage;

const BIG_STAGES = [
  { id: "defining", label: "本次议题" },
  { id: "roundtable", label: "五声圆桌" },
  { id: "inquiry", label: "书记员问询" },
  { id: "settlement", label: "本心落定" },
];

const MAX_ALIGNMENT_INQUIRY_QUESTIONS = 12;

const VOICE_COLOR_VAR: Record<VoiceId, string> = {
  lay: "color-seat-rest",
  money: "color-seat-money",
  roam: "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

function MeetingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawParam = (params.get("petition") ?? "").trim();

  const meetingIdRef = useRef<string>(newMeetingId());
  const startedAtRef = useRef<number>(Date.now());
  const initializedRef = useRef<string | null>(null);
  const [errorCode, setErrorCode] = useState<LlmErrorCode | undefined>();
  const [errorRetryable, setErrorRetryable] = useState(true);

  const {
    provider,
    setProvider,
    stage,
    setStage,
    rawInput,
    setRawInput,
    definingDialogue,
    setDefiningDialogue,
    currentQuestions,
    setCurrentQuestions,
    issueProposal,
    setIssueProposal,
    definingSubStage,
    setDefiningSubStage,
    taskFrame,
    setTaskFrame,
    roundtable,
    setRoundtable,
    roundtableMode,
    setRoundtableMode,
    selectedVoiceId,
    setSelectedVoiceId,
    duelFromId,
    setDuelFromId,
    duelToId,
    setDuelToId,
    inquiryQuestions,
    setInquiryQuestions,
    inquiryAnswers,
    setInquiryAnswers,
    inquiryDialogue,
    setInquiryDialogue,
    inquiryIndex,
    setInquiryIndex,
    customInquiryText,
    setCustomInquiryText,
    alignmentProfile,
    setAlignmentProfile,
    scribeObservationLedger,
    setScribeObservationLedger,
    alignmentReport,
    setAlignmentReport,
    clarityDraft,
    setClarityDraft,
    contractDraft,
    setContractDraft,
    commitmentDraft,
    setCommitmentDraft,
    busy,
    setBusy,
    error,
    setError,
    crisis,
    streamNarration,
    streamEvents,
    isStreaming,
    streamRequest,
  } = useMeetingStore();

  function clearError() {
    setError("");
    setErrorCode(undefined);
    setErrorRetryable(true);
  }

  function captureRequestError(errorLike: any, fallback: string) {
    if (errorLike?.message === "safety-offramp") return;
    setError(errorLike?.message || fallback);
    setErrorCode((errorLike?.code as LlmErrorCode | undefined) || "unknown");
    setErrorRetryable(errorLike?.retryable ?? true);
  }

  const context = useCallback(() => {
    const profile = loadProfile();
    const taste = loadTaste();
    const meCard = profileToMarkdown(profile, taste);
    const tasteProfile = tasteToProfileHint(taste);
    return meCard || tasteProfile
      ? { meCard: meCard || undefined, tasteProfile: tasteProfile || undefined }
      : undefined;
  }, []);

  useEffect(() => {
    if (!rawParam) {
      router.replace("/");
      return;
    }
    if (initializedRef.current === rawParam) return;
    const activeProvider = loadActiveProvider();
    if (!toRuntimePayload(activeProvider)) {
      router.replace("/setup");
      return;
    }
    initializedRef.current = rawParam;
    setProvider(activeProvider);
    setRawInput(rawParam);
    void loadTaskFrame(rawParam, activeProvider);
  }, [rawParam, router]);

  /**
   * SSE streaming request. Drives in-flow narration and raw model output events,
   * then returns the final `result.payload`.
   */
  async function streamJson(
    path: string,
    body: any,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    return streamRequest({
      path,
      body,
      provider: runtimeProvider,
      context,
    });
  }

  async function updateScribeObservationLedger(
    nextRoundtable: RoundtableRecord,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    const runtimePayload = toRuntimePayload(runtimeProvider);
    if (!runtimePayload || !taskFrame) return;
    try {
      const response = await fetch("/api/scribe-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskFrame,
          issueProposal,
          roundtable: nextRoundtable,
          scribeObservationLedger,
          context: context(),
          provider: runtimePayload,
        }),
      });
      if (!response.ok) return;
      const json = await response.json().catch(() => null);
      if (json?.scribeObservationLedger) {
        setScribeObservationLedger(json.scribeObservationLedger as ScribeObservationLedger);
      }
    } catch {
      // This is intentionally invisible: observation failure must not disturb the meeting.
    }
  }

  // ─── Retry Last Action (useChat reload() pattern) ───
  const lastActionRef = useRef<{ fn: () => Promise<void> } | null>(null);

  function retryLastAction() {
    if (lastActionRef.current) {
      lastActionRef.current.fn();
    }
  }

  async function loadTaskFrame(
    input: string,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    await startDefiningProbe(input, [], runtimeProvider);
  }

  /** New: Start or continue the dialogue-based defining flow */
  async function startDefiningProbe(
    input: string,
    dialogue: DefiningDialogueEntry[],
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    // Save for retry
    lastActionRef.current = { fn: () => startDefiningProbe(input, dialogue, runtimeProvider) };
    setBusy(true);
    clearError();
    try {
      const json = await streamJson(
        "/api/task-frame",
        { action: "probe", rawInput: input, dialogue },
        runtimeProvider,
      );
      if (json._interrupted) return;

      if (json.action === "propose" && json.proposal) {
        // 信息足够，直接生成提案
        setIssueProposal(json.proposal);
        setTaskFrame(json.taskFrame ?? null);
        setDefiningSubStage("showing_proposal");
      } else if (json.questions?.length) {
        // 需要追问
        setCurrentQuestions(json.questions);
        setDefiningSubStage("probing");
      }
    } catch (e: any) {
      captureRequestError(e, "书记员整理失败");
    } finally {
      setBusy(false);
    }
  }

  /** Handle user answering probe questions */
  async function handleProbeAnswer(answers: ScribeAnswer[]) {
    // Add answers to dialogue
    const newEntries: DefiningDialogueEntry[] = answers.map((a) => {
      const question = currentQuestions.find((q) => q.id === a.question_id);
      const option = question?.options.find((o) => o.id === a.selected_option_id);
      return {
        role: "user" as const,
        answer: {
          ...a,
          question_text: a.question_text || question?.text,
          selected_option_label: a.selected_option_label || option?.label,
        },
      };
    });
    // Also add the questions that were asked (for history)
    const historicalThinkingEvents = streamEvents.length ? [...streamEvents] : undefined;
    const questionEntries: DefiningDialogueEntry[] = currentQuestions.map((q, index) => ({
      role: "scribe" as const,
      question: q,
      thinking_events: index === 0 ? historicalThinkingEvents : undefined,
    }));
    const updatedDialogue = [...definingDialogue, ...questionEntries, ...newEntries];
    setDefiningDialogue(updatedDialogue);
    setCurrentQuestions([]);

    // Continue probing
    await startDefiningProbe(rawInput, updatedDialogue);
  }

  /** Handle user confirming the proposal */
  async function confirmProposal() {
    if (!issueProposal || !taskFrame) return;
    lastActionRef.current = { fn: () => confirmProposal() };
    setBusy(true);
    clearError();
    try {
      setStage("roundtable");
      // Trigger opening turns
      const json = await streamJson("/api/roundtable", {
        action: "opening",
        taskFrame,
        issueProposal,
      });
      if (json._interrupted) return;
      const nextRoundtable = { opening_turns: json.openingTurns ?? [], turns: [], moves: [] };
      setRoundtable(nextRoundtable);
      void updateScribeObservationLedger(nextRoundtable);
    } catch (e: any) {
      captureRequestError(e, "生成五声开场失败");
    } finally {
      setBusy(false);
    }
  }

  /** Handle user refining proposal */
  async function handleRefineProposal(feedback: string) {
    if (!issueProposal) return;
    setBusy(true);
    clearError();
    try {
      const json = await streamJson("/api/task-frame", {
        action: "refine",
        rawInput,
        dialogue: definingDialogue,
        currentProposal: issueProposal,
        userFeedback: feedback,
      });
      if (json._interrupted) return;

      if (json.action === "probe" && json.questions?.length) {
        // 需要追问更多信息
        setCurrentQuestions(json.questions);
        setDefiningSubStage("probing");
      } else if (json.proposal) {
        setIssueProposal(json.proposal);
        if (json.taskFrame) {
          setTaskFrame(json.taskFrame);
        }
        setDefiningSubStage("showing_proposal");
      }
    } catch (e: any) {
      captureRequestError(e, "修正失败");
    } finally {
      setBusy(false);
    }
  }

  function handleUpdateProposal(nextProposal: IssueProposal) {
    const visible = proposalToTaskFrame(nextProposal);
    setIssueProposal(nextProposal);
    setTaskFrame((prev) => prev ? {
      ...prev,
      visible,
      edited_fields: {
        ...prev.edited_fields,
        problem_definition: true,
        current_state: true,
        key_facts: true,
        main_choices: true,
        core_conflict: true,
        central_question: true,
        main_concerns: true,
        discussion_focus: true,
      },
    } : prev);
  }

  async function loadOpeningTurns(frame: TaskFrame) {
    setBusy(true);
    clearError();
    try {
      const json = await streamJson("/api/roundtable", {
        action: "opening",
        taskFrame: frame,
        issueProposal,
      });
      const openingTurns = (json.openingTurns ?? []) as VoiceOpeningTurn[];
      const nextRoundtable = {
        opening_turns: openingTurns,
        turns: [],
        moves: [],
      };
      setRoundtable(nextRoundtable);
      void updateScribeObservationLedger(nextRoundtable);
    } catch (e: any) {
      captureRequestError(e, "五声第一轮失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitRoundtableMove(
    moveType: RoundtableMove["type"],
    payload: Partial<{
      targetVoiceId: VoiceId;
      fromVoiceId: VoiceId;
      toVoiceId: VoiceId;
      userText: string;
    }> = {},
  ) {
    if (!taskFrame || busy) return;

    // Roundtable guard: max 12 moves
    const MAX_ROUNDTABLE_MOVES = 12;
    if (roundtable.moves.length >= MAX_ROUNDTABLE_MOVES) {
      setError("圆桌讨论已达上限，请进入下一阶段。");
      setErrorCode("unknown");
      setErrorRetryable(false);
      return;
    }
    lastActionRef.current = { fn: () => submitRoundtableMove(moveType, payload) };
    setBusy(true);
    clearError();
    const userTurn = createUserRoundtableTurn(moveType, payload.userText);
    const snapshot = userTurn
      ? { ...roundtable, turns: [...roundtable.turns, userTurn] }
      : roundtable;
    if (userTurn) {
      setRoundtable((prev) => ({
        ...prev,
        turns: [...prev.turns, userTurn],
      }));
    }
    try {
      const json = await streamJson("/api/roundtable", {
        action: "move",
        moveType,
        taskFrame,
        issueProposal,
        roundtable: snapshot,
        ...payload,
      });
      const move = json.move as RoundtableMove;
      const turns = ((json.turns ?? []) as RoundtableTurn[]).map((turn) => ({
        ...turn,
        move_id: turn.move_id || move.id,
      }));
      const taggedUserTurn = userTurn ? { ...userTurn, move_id: move.id } : null;
      const nextRoundtable: RoundtableRecord = {
        opening_turns: snapshot.opening_turns,
        moves: [...snapshot.moves, move],
        turns: [
          ...snapshot.turns.map((turn) => (taggedUserTurn && turn.id === taggedUserTurn.id ? taggedUserTurn : turn)),
          ...turns,
        ],
      };
      setRoundtable(nextRoundtable);
      void updateScribeObservationLedger(nextRoundtable);
      setRoundtableMode("none");
    } catch (e: any) {
      captureRequestError(e, "圆桌推进失败");
    } finally {
      setBusy(false);
    }
  }

  async function startInquiry() {
    if (!taskFrame || busy) return;
    setStage("inquiry");
    setInquiryQuestions([]);
    setInquiryAnswers([]);
    setInquiryDialogue([]);
    setInquiryIndex(0);
    setCustomInquiryText("");
    await continueAlignmentInquiry([], []);
  }

  async function continueAlignmentInquiry(
    questions: ScribeInquiryQuestion[],
    answers: ScribeInquiryAnswer[],
  ) {
    if (!taskFrame) return;
    lastActionRef.current = { fn: () => continueAlignmentInquiry(questions, answers) };
    setBusy(true);
    clearError();
    try {
      const json = await streamJson("/api/alignment-inquiry", {
        taskFrame,
        issueProposal,
        roundtable,
        scribeObservationLedger,
        inquiryQuestions: questions,
        inquiryAnswers: answers,
      });
      if (json.scribeObservationLedger) {
        setScribeObservationLedger(json.scribeObservationLedger as ScribeObservationLedger);
      }
      const nextProfile = (json.alignmentProfile ?? null) as AlignmentProfile | null;
      setAlignmentProfile(nextProfile);
      setInquiryIndex(0);

      if (json.readyForReport && nextProfile) {
        await requestAlignmentReport(
          nextProfile,
          (json.scribeObservationLedger || scribeObservationLedger) as ScribeObservationLedger,
          answers,
        );
        return;
      }

      const remaining = Math.max(0, MAX_ALIGNMENT_INQUIRY_QUESTIONS - answers.length);
      const known = new Set(questions.map((q) => q.id));
      const nextQuestions = ((json.questions ?? []) as ScribeInquiryQuestion[])
        .filter((q) => !known.has(q.id))
        .slice(0, remaining);
      if (!nextQuestions.length && nextProfile) {
        await requestAlignmentReport(
          nextProfile,
          (json.scribeObservationLedger || scribeObservationLedger) as ScribeObservationLedger,
          answers,
        );
        return;
      }
      setInquiryQuestions([...questions, ...nextQuestions]);
    } catch (e: any) {
      captureRequestError(e, "书记员问询失败");
    } finally {
      setBusy(false);
    }
  }

  async function answerInquiry(answers: ScribeAnswer[]) {
    if (!answers.length) return;
    const thinkingEvents = streamEvents.length ? [...streamEvents] : undefined;
    const questionEntries: DefiningDialogueEntry[] = activeInquiryQuestions.map((question, index) => ({
      role: "scribe" as const,
      question: inquiryQuestionToScribeQuestion(question),
      thinking_events: index === 0 ? thinkingEvents : undefined,
    }));
    const nextInquiryAnswers: ScribeInquiryAnswer[] = answers.map((answer) => {
      const question = activeInquiryQuestions.find((q) => q.id === answer.question_id);
      const option = question?.options.find((o) => o.id === answer.selected_option_id);
      return {
        question_id: answer.question_id,
        question: question?.question || answer.question_text || "",
        selected_option_id: answer.selected_option_id || "custom",
        selected_label: answer.free_text?.trim() || answer.selected_option_label || option?.label || "都不准，我自己说",
        custom_text: answer.free_text?.trim() || undefined,
        at: answer.at,
      };
    });
    const userEntries: DefiningDialogueEntry[] = answers.map((answer) => {
      const question = activeInquiryQuestions.find((q) => q.id === answer.question_id);
      const option = question?.options.find((o) => o.id === answer.selected_option_id);
      return {
        role: "user" as const,
        answer: {
          ...answer,
          question_text: answer.question_text || question?.question,
          selected_option_label: answer.selected_option_label || option?.label,
        },
      };
    });
    const updatedDialogue = [...inquiryDialogue, ...questionEntries, ...userEntries];
    const updatedQuestions = [...inquiryQuestions];
    const updatedAnswers = [
      ...inquiryAnswers.filter((existing) => !nextInquiryAnswers.some((a) => a.question_id === existing.question_id)),
      ...nextInquiryAnswers,
    ];
    setInquiryDialogue(updatedDialogue);
    setInquiryAnswers(updatedAnswers);
    setInquiryQuestions(updatedQuestions);
    setCustomInquiryText("");
    await continueAlignmentInquiry(updatedQuestions, updatedAnswers);
  }

  function submitTurnReaction(targetTurn: RoundtableTurn, text: string) {
    const reaction = createUserReactionTurn(targetTurn, text);
    if (!reaction) return;
    const nextRoundtable: RoundtableRecord = {
      ...roundtable,
      turns: [...roundtable.turns, reaction],
    };
    setRoundtable(nextRoundtable);
    void updateScribeObservationLedger(nextRoundtable);
  }

  async function requestAlignmentReport(
    profile: AlignmentProfile,
    ledger: ScribeObservationLedger,
    answers: ScribeInquiryAnswer[] = inquiryAnswers,
  ) {
    const settlement = await streamJson("/api/alignment-report", {
      taskFrame,
      issueProposal,
      scribeObservationLedger: ledger,
      inquiryAnswers: answers,
      alignmentProfile: profile,
    });
    const nextReport = settlement.alignmentReport as AlignmentReport;
    setAlignmentReport(nextReport);
    setClarityDraft(settlementHeadline(nextReport));
    setContractDraft(nextReport.cost_acceptance_contract.report);
    setCommitmentDraft(settlementCommitment(nextReport));
    setStage("settlement");
  }

  async function archiveMeeting() {
    if (!taskFrame || !alignmentReport || busy) return;
    const finalReport: AlignmentReport = alignmentReport;
    const meeting: Meeting = {
      id: meetingIdRef.current,
      createdAt: startedAtRef.current,
      closedAt: Date.now(),
      status: "settled",
      raw_input: rawInput,
      issue_proposal: issueProposal ?? undefined,
      choice_cards: [],
      choice_answers: [],
      task_frame: taskFrame,
      roundtable,
      scribe_observation_ledger: scribeObservationLedger ?? undefined,
      inquiry_questions: inquiryQuestions,
      inquiry_answers: inquiryAnswers,
      alignment_profile: alignmentProfile ?? undefined,
      alignment_report: finalReport,
    };
    setBusy(true);
    try {
      await saveMeeting(meeting);
      setStage("archived");
      router.push(`/archive/${meeting.id}`);
    } catch (e: any) {
      captureRequestError(e, "纸页保存失败");
    } finally {
      setBusy(false);
    }
  }

  const activeInquiryQuestions = inquiryQuestions.filter(
    (q) => !inquiryAnswers.some((a) => a.question_id === q.id),
  );
  const bigStage = toBigStage(stage);
  const actions = buildActions();
  const consolePanel = buildConsolePanel();
  const consoleSpeak = buildConsoleSpeak();
  const consolePlaceholder =
    roundtableMode === "ask_voice"
      ? `问${voiceName(selectedVoiceId)}一句。`
      : roundtableMode === "ask_table"
        ? "把你要抛给全桌的问题写在这里。"
        : undefined;

  function buildActions(): ConsoleAction[] {
    if (stage === "defining") {
      // IssueProposalBoard has its own confirm button, no need for HostConsole action
      return [];
    }
    if (stage === "roundtable") {
      if (roundtableMode === "ask_voice" || roundtableMode === "ask_table") {
        return [
          {
            id: "cancel-mode",
            label: "取消",
            onClick: () => setRoundtableMode("none"),
            variant: "muted",
            disabled: busy,
          },
        ];
      }
      if (roundtableMode === "duel") {
        return [
          {
            id: "start-duel",
            label: "开始对话",
            onClick: () => submitRoundtableMove("duel", { fromVoiceId: duelFromId, toVoiceId: duelToId }),
            variant: "primary",
            disabled: busy || duelFromId === duelToId,
          },
          {
            id: "cancel-mode",
            label: "取消",
            onClick: () => setRoundtableMode("none"),
            variant: "muted",
            disabled: busy,
          },
        ];
      }
      return [
        {
          id: "continue-all",
          label: "继续聊一轮",
          onClick: () => submitRoundtableMove("continue_all"),
          variant: "secondary",
          disabled: busy || roundtable.opening_turns.length === 0,
        },
        {
          id: "ask-voice",
          label: "问一声",
          onClick: () => setRoundtableMode("ask_voice"),
          disabled: busy,
        },
        {
          id: "ask-table",
          label: "问全桌",
          onClick: () => setRoundtableMode("ask_table"),
          disabled: busy,
        },
        {
          id: "duel",
          label: "让两声对话",
          onClick: () => setRoundtableMode("duel"),
          disabled: busy || roundtable.opening_turns.length === 0,
        },
        {
          id: "inquiry",
          label: "进入书记员问询 →",
          onClick: startInquiry,
          variant: "primary",
          disabled: busy || roundtable.opening_turns.length === 0,
        },
      ];
    }
    if (stage === "inquiry") {
      return [];
    }
    if (stage === "settlement") {
      return [
        {
          id: "archive",
          label: busy ? "保存中…" : "保存纸页",
          onClick: archiveMeeting,
          variant: "primary",
          disabled: busy || !alignmentReport || !settlementCommitment(alignmentReport),
        },
      ];
    }
    return [];
  }

  function buildConsolePanel() {
    if (stage !== "roundtable") return null;
    if (roundtableMode === "ask_voice") {
      return (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <VoiceSelect label="问哪一声" value={selectedVoiceId} onChange={setSelectedVoiceId} />
          <p className="text-xs text-ink-mute leading-relaxed sm:max-w-[260px]">
            这一轮只请这一声说话；它仍看见完整圆桌历史。
          </p>
        </div>
      );
    }
    if (roundtableMode === "ask_table") {
      return (
        <p className="text-body-sm text-ink-mute leading-relaxed">
          全桌发问会把你的问题写入历史，再让五声基于同一份快照各自接住它。
        </p>
      );
    }
    if (roundtableMode === "duel") {
      return (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <VoiceSelect label="谁发问" value={duelFromId} onChange={setDuelFromId} />
          <span className="hidden pb-2 text-ink-mute sm:block">→</span>
          <VoiceSelect label="问谁" value={duelToId} onChange={setDuelToId} />
        </div>
      );
    }
    return null;
  }

  function buildConsoleSpeak() {
    if (stage !== "roundtable") return undefined;
    if (roundtableMode === "ask_voice") {
      return async (text: string) => {
        await submitRoundtableMove("user_to_voice", {
          targetVoiceId: selectedVoiceId,
          userText: text,
        });
      };
    }
    if (roundtableMode === "ask_table") {
      return async (text: string) => {
        await submitRoundtableMove("user_to_table", { userText: text });
      };
    }
    return undefined;
  }

  return (
    <div className="min-h-screen bg-paper-base flex flex-col">
      <header className="px-5 sm:px-10 pt-6 pb-3 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <Link
            href="/"
            className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors mt-1"
          >
            ← 我的声音
          </Link>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
              五声圆桌
            </span>
            <StageRail stages={BIG_STAGES} current={bigStage} done={doneStages(bigStage)} />
          </div>
        </div>
      </header>

      {error && !crisis && (
        <div className="max-w-6xl mx-auto w-full px-5 sm:px-10">
          <ErrorRecoveryBar
            code={errorCode}
            message={error}
            retryable={errorRetryable}
            onRetry={() => { clearError(); retryLastAction(); }}
            onSkip={clearError}
            onDismiss={clearError}
          />
        </div>
      )}
      {crisis && <Notice tone="error">{crisis}</Notice>}

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 sm:px-10 py-6 pb-32 sm:pb-40 font-sans text-ink-body">
        <DocketPaper stage="原始输入" dense className="mb-5">
          <p className="font-serif text-title text-ink-core leading-snug">{rawInput}</p>
        </DocketPaper>

        {stage === "defining" && definingSubStage === "probing" && (
          <DefiningDialogueBoard
            dialogue={definingDialogue}
            currentQuestions={currentQuestions}
            isLoading={busy}
            thinkingText={isStreaming ? streamNarration : undefined}
            streamEvents={streamEvents}
            onAnswer={handleProbeAnswer}
          />
        )}

        {stage === "defining" && definingSubStage === "showing_proposal" && issueProposal && (
          <>
            <DefiningDialogueHistory
              dialogue={definingDialogue}
              thinkingEvents={streamEvents}
              className="mb-5 px-1"
            />
            <IssueProposalBoard
              proposal={issueProposal}
              onConfirm={confirmProposal}
              onRefine={handleRefineProposal}
              onUpdate={handleUpdateProposal}
              isLoading={busy}
            />
          </>
        )}

        {(stage === "roundtable" || stage === "inquiry" || stage === "settlement" || stage === "archived") && taskFrame && (
          <>
            <TaskFrameSummary frame={taskFrame.visible} proposal={issueProposal} className="mb-5" />
            <RoundtableBoard
              roundtable={roundtable}
              busy={busy && stage === "roundtable"}
              onReact={stage === "roundtable" && !busy ? submitTurnReaction : undefined}
            />
          </>
        )}

        {stage === "inquiry" && (
          <AlignmentInquiryBoard
            dialogue={inquiryDialogue}
            questions={activeInquiryQuestions}
            answeredCount={inquiryAnswers.length}
            isLoading={busy}
            thinkingText={isStreaming ? streamNarration : undefined}
            streamEvents={streamEvents}
            onAnswer={answerInquiry}
          />
        )}

        {stage === "settlement" && alignmentReport && (
          <SettlementPanel
            alignmentReport={alignmentReport}
            onChange={setAlignmentReport}
          />
        )}
      </main>

      <HostConsole
        stageLabel={isStreaming ? streamNarration : stageLabel(stage, busy)}
        controlPanel={consolePanel}
        actions={actions}
        onSpeak={consoleSpeak}
        inputDisabled={busy}
        inputPlaceholder={consolePlaceholder}
      />
    </div>
  );
}

function TaskFrameSummary({
  frame,
  proposal,
  className = "",
}: {
  frame: VisibleTaskFrame;
  proposal?: IssueProposal | null;
  className?: string;
}) {
  const proposalFields = proposal
    ? [
        {
          label: "Key 1 · 具象化的困惑",
          prompt: "用户面临的选择岔路口是什么？",
          value: proposal.surface_dilemma,
        },
        {
          label: "Key 2 · 真实的处境",
          prompt: "限制用户做出选择的客观条件是什么？",
          value: proposal.current_constraints,
        },
        {
          label: "Key 3 · 隐秘的关切",
          prompt: "用户潜意识里真正害怕失去的是什么？",
          value: proposal.core_fears,
        },
        {
          label: "Key 4 · 渴望的终局",
          prompt: "用户希望这次圆桌讨论帮自己验证什么？",
          value: proposal.expected_resolution,
        },
      ]
    : null;

  return (
    <DocketPaper stage="本次议题 · 4 Key" dense className={className}>
      <p className="mb-4 font-serif text-title text-ink-core leading-snug">
        {proposal?.issue_sentence || frame.problem_definition}
      </p>
      {proposalFields ? (
        <div className="grid gap-3 md:grid-cols-2">
          {proposalFields.map((item) => (
            <article key={item.label} className="rounded-md border border-paper-edge bg-paper-lift p-3">
              <div className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                {item.label}
              </div>
              <p className="mt-1 text-xs text-ink-mute leading-relaxed">{item.prompt}</p>
              <p className="mt-2 font-serif text-body text-ink-core leading-snug">
                {item.value.content}
              </p>
              {item.value.details.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-ink-mute">
                  {item.value.details.slice(0, 3).map((detail) => (
                    <li key={detail}>· {detail}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 text-body-sm">
          <MiniField label="具象化的困惑" body={frame.problem_definition} />
          <MiniField label="真实的处境" body={[frame.current_state, ...frame.key_facts].filter(Boolean).join(" / ")} />
          <MiniField label="隐秘的关切" body={[frame.core_conflict, ...frame.main_concerns].filter(Boolean).join(" / ")} />
          <MiniField label="渴望的终局" body={[frame.central_question, frame.discussion_focus].filter(Boolean).join(" / ")} />
        </div>
      )}
    </DocketPaper>
  );
}

function RoundtableBoard({
  roundtable,
  busy,
  onReact,
}: {
  roundtable: RoundtableRecord;
  busy: boolean;
  onReact?: (turn: RoundtableTurn, text: string) => void;
}) {
  return (
    <section className="space-y-5">
      <header className="flex items-end justify-between gap-3 border-b border-paper-edge pb-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
            Opening
          </div>
          <h2 className="font-serif text-title-sm text-ink-core leading-snug">
            五声立论
          </h2>
          <p className="mt-1 text-xs text-ink-mute leading-relaxed">
            每一声先回答四个同样的问题，形成一张可比较的开场立论。
          </p>
        </div>
        <div className="text-xs text-ink-mute tabular-nums">
          {roundtable.opening_turns.length} / {VOICE_IDS.length}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {VOICE_IDS.map((vid) => {
          const opening = roundtable.opening_turns.find((t) => t.voice_id === vid);
          const seat = SELVES[vid];
          return (
            <article
              key={vid}
              className="bg-paper-lift border border-paper-edge rounded-md p-4 min-h-[236px]"
              style={{ borderTop: `3px solid var(--${VOICE_COLOR_VAR[vid]})` }}
            >
              <header className="mb-3">
                <div className="font-serif text-title-sm text-ink-core leading-snug">
                  {seat.name}
                </div>
                <p className="mt-1 text-xs text-ink-mute leading-snug">
                  {seat.soul?.line}
                </p>
              </header>
              {!opening ? (
                <p className="text-body-sm text-ink-faint italic font-serif">
                  {busy ? "正在组织第一轮立论。" : "等待第一轮。"}
                </p>
              ) : (
                <div className="space-y-2">
                  <OpeningLine label="当下的痛苦本质是什么？" body={opening.thesis} />
                  <OpeningLine label="第一步必须做什么？" body={opening.pull} />
                  <OpeningLine label="需要承受什么无可挽回的代价？" body={opening.concern} />
                  <OpeningLine label="我在为你守护什么底线？" body={opening.protected_value} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <RoundtableTimeline roundtable={roundtable} busy={busy} onReact={onReact} />
    </section>
  );
}

type RoundtableTimelineGroup = {
  key: string;
  trigger: VoiceTurnTrigger;
  at: number;
  roundIndex?: number;
  isParallelBatch?: boolean;
  turns: RoundtableTurn[];
};

function RoundtableTimeline({
  roundtable,
  busy,
  onReact,
}: {
  roundtable: RoundtableRecord;
  busy: boolean;
  onReact?: (turn: RoundtableTurn, text: string) => void;
}) {
  const groups = groupRoundtableTurns(roundtable.turns);
  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-3 border-b border-paper-edge pb-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
            Roundtable
          </div>
          <h2 className="font-serif text-title-sm text-ink-core leading-snug">
            圆桌记录
          </h2>
        </div>
        <div className="text-xs text-ink-mute tabular-nums">
          {groups.length ? `${groups.length} 轮 / ${roundtable.turns.length} 条` : "等待开始"}
        </div>
      </header>

      {!groups.length ? (
        <div className="rounded-md border border-dashed border-paper-edge bg-paper-lift px-4 py-6">
          <p className="font-serif text-body text-ink-mute leading-relaxed">
            {busy ? "正在组织这一轮。" : "点击底部操作，继续这场圆桌。"}
          </p>
        </div>
      ) : (
        <div className="relative space-y-5 before:absolute before:left-4 sm:before:left-1/2 before:top-2 before:bottom-2 before:w-px before:bg-paper-edge">
          {groups.map((group, index) => (
            <section key={group.key} className="relative space-y-3">
              <RoundMarker index={index + 2} group={group} />
              <div className="space-y-3">
                {group.turns.map((turn) => (
                  <RoundtableTimelineTurn key={turn.id} turn={turn} onReact={onReact} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupRoundtableTurns(turns: RoundtableTurn[]): RoundtableTimelineGroup[] {
  const sorted = [...turns].sort((a, b) => a.at - b.at);
  const groups: RoundtableTimelineGroup[] = [];
  for (const turn of sorted) {
    const key = turn.move_id || `${turn.trigger}-${turn.user_text || ""}-${turn.at}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.turns.push(turn);
      if (last.trigger === "user_text" && turn.trigger !== "user_text") {
        last.trigger = turn.trigger;
      }
      last.roundIndex = last.roundIndex || turn.round_index;
      last.isParallelBatch = last.isParallelBatch || !!turn.is_parallel_batch;
      last.at = Math.min(last.at, turn.at);
      continue;
    }
    groups.push({
      key,
      trigger: turn.trigger,
      at: turn.at,
      roundIndex: turn.round_index,
      isParallelBatch: !!turn.is_parallel_batch,
      turns: [turn],
    });
  }
  return groups;
}

function RoundMarker({
  index,
  group,
}: {
  index: number;
  group: RoundtableTimelineGroup;
}) {
  return (
    <div className="relative flex items-center justify-center py-1">
      <span className="relative z-10 rounded-full border border-paper-edge bg-paper-base px-3 py-1 text-[10px] tracking-[0.14em] uppercase text-ink-mute">
        第 {group.roundIndex || index} 轮 · {roundtableTriggerLabel(group.trigger)}
        {group.isParallelBatch ? " · 并发" : ""} · {formatTurnTime(group.at)}
      </span>
    </div>
  );
}

function RoundtableTimelineTurn({
  turn,
  onReact,
}: {
  turn: RoundtableTurn;
  onReact?: (turn: RoundtableTurn, text: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  if (turn.trigger === "user_text") {
    const target = turn.reply_to_name || (turn.reply_to_voice_id ? voiceName(turn.reply_to_voice_id) : "");
    return (
      <article className="relative ml-auto max-w-2xl rounded-md border border-paper-edge bg-paper-base px-4 py-3 text-right shadow-[0_6px_18px_rgba(25,23,19,0.04)]">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
          我{target ? ` · 答复/反驳 ${target}` : ""} · {formatTurnTime(turn.at)}
        </div>
        {turn.reply_to_text && (
          <p className="mb-2 border-r-2 border-paper-edge pr-3 text-body-sm text-ink-mute leading-relaxed">
            {turn.reply_to_text}
          </p>
        )}
        <p className="font-serif italic text-body text-ink-core leading-relaxed whitespace-pre-line">
          「{turn.user_text || turn.text}」
        </p>
      </article>
    );
  }
  if (turn.trigger === "user_reaction") {
    const target = turn.reply_to_name || (turn.reply_to_voice_id ? voiceName(turn.reply_to_voice_id) : "");
    return (
      <article className="relative ml-auto max-w-2xl rounded-md border border-paper-edge bg-paper-base px-4 py-3 text-right shadow-[0_6px_18px_rgba(25,23,19,0.04)]">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
          我 · 答复/反驳{target ? ` ${target}` : ""} · {formatTurnTime(turn.at)}
        </div>
        {turn.reply_to_text && (
          <p className="mb-2 border-r-2 border-paper-edge pr-3 text-body-sm text-ink-mute leading-relaxed">
            {turn.reply_to_text}
          </p>
        )}
        <p className="font-serif italic text-body text-ink-core leading-relaxed whitespace-pre-line">
          「{turn.user_text || turn.text}」
        </p>
      </article>
    );
  }
  if (turn.duel) {
    return <DuelTimelineCard turn={turn} />;
  }
  const vid = turn.voice_id;
  const canReact = !!onReact && !!turn.voice_id && !!turn.text;
  function submitReaction() {
    const text = replyText.trim();
    if (!text || !onReact) return;
    onReact(turn, text);
    setReplyText("");
    setReplyOpen(false);
  }
  return (
    <article
      className="relative max-w-3xl rounded-md border border-paper-edge bg-paper-lift px-4 py-3 shadow-[0_6px_18px_rgba(25,23,19,0.04)]"
      style={vid ? { borderLeft: `4px solid var(--${VOICE_COLOR_VAR[vid]})` } : undefined}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
          {vid ? voiceName(vid) : "声音"} · {roundtableTriggerLabel(turn.trigger)} · {formatTurnTime(turn.at)}
        </div>
        <ReferencePills refs={turn.refers_to} />
      </div>
      <p className="font-serif text-body text-ink-body leading-relaxed whitespace-pre-line">
        {turn.text}
      </p>
      {canReact && (
        <div className="mt-3 border-t border-paper-edge pt-3">
          {replyOpen ? (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value.slice(0, 360))}
                rows={3}
                autoFocus
                placeholder="写下你对这一条的答复或反驳。它会进入后续圆桌历史，但不会让这一声立刻回复。"
                className="w-full resize-none rounded-md border border-paper-edge bg-paper-base px-3 py-2 text-body-sm text-ink-body outline-none focus:border-ink-mute"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submitReaction}
                  disabled={!replyText.trim()}
                  className="rounded-md bg-ink-core px-3 py-1.5 text-body-sm text-paper-base disabled:opacity-30"
                >
                  记入圆桌历史
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpen(false);
                    setReplyText("");
                  }}
                  className="text-body-sm text-ink-mute hover:text-ink-core"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReplyOpen(true)}
              className="text-body-sm text-ink-mute underline-offset-4 hover:text-ink-core hover:underline"
            >
              答复/反驳
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function DuelTimelineCard({ turn }: { turn: RoundtableTurn }) {
  const duel = turn.duel;
  if (!duel) return null;
  return (
    <article className="relative mx-auto max-w-4xl rounded-md border border-paper-edge bg-paper-base px-4 py-4 shadow-[0_8px_22px_rgba(25,23,19,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
          两声对话 · {formatTurnTime(turn.at)}
        </div>
        <div className="text-xs text-ink-mute">
          {duel.from_name} ↔ {duel.to_name}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div
          className="rounded-md border border-paper-edge bg-paper-lift p-3"
          style={{ borderTop: `4px solid var(--${VOICE_COLOR_VAR[duel.from_voice_id]})` }}
        >
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
            {duel.from_name} 发问
          </div>
          <p className="font-serif text-body text-ink-core leading-relaxed">
            「{duel.question}」
          </p>
        </div>
        <div className="hidden md:flex items-center text-2xl text-ink-faint">↔</div>
        <div
          className="rounded-md border border-paper-edge bg-paper-lift p-3"
          style={{ borderTop: `4px solid var(--${VOICE_COLOR_VAR[duel.to_voice_id]})` }}
        >
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
            {duel.to_name} 回应
          </div>
          <p className="font-serif text-body text-ink-body leading-relaxed">
            {duel.response}
          </p>
        </div>
      </div>
    </article>
  );
}

function ReferencePills({ refs }: { refs?: VoiceId[] }) {
  if (!refs?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {refs.map((id) => (
        <span
          key={id}
          className="rounded-full border border-paper-edge bg-paper-base px-2 py-0.5 text-[10px] text-ink-mute"
          style={{ borderLeft: `2px solid var(--${VOICE_COLOR_VAR[id]})` }}
        >
          回应了 {voiceName(id)}
        </span>
      ))}
    </div>
  );
}

function roundtableTriggerLabel(trigger: VoiceTurnTrigger): string {
  const labels: Partial<Record<VoiceTurnTrigger, string>> = {
    continue_all: "全员自由轮次",
    user_to_voice: "你的追问",
    user_to_table: "全桌发问",
    user_text: "你的发言",
    user_reaction: "你的答复/反驳",
    duel: "两声对话",
  };
  return labels[trigger] || "圆桌动作";
}

function formatTurnTime(at: number): string {
  return new Date(at).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createUserRoundtableTurn(
  moveType: RoundtableMove["type"],
  userText?: string,
): RoundtableTurn | null {
  const text = userText?.trim();
  if (!text || (moveType !== "user_to_voice" && moveType !== "user_to_table")) return null;
  return {
    id: `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    trigger: "user_text",
    text,
    user_text: text,
    at: Date.now(),
  };
}

function createUserReactionTurn(targetTurn: RoundtableTurn, userText: string): RoundtableTurn | null {
  const text = userText.trim();
  if (!text || !targetTurn.id) return null;
  const targetText = targetTurn.text || targetTurn.duel?.question || "";
  return {
    id: `react_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    trigger: "user_reaction",
    text,
    user_text: text,
    reply_to: targetTurn.id,
    reply_to_voice_id: targetTurn.voice_id,
    reply_to_name: targetTurn.name || (targetTurn.voice_id ? voiceName(targetTurn.voice_id) : undefined),
    reply_to_text: targetText.slice(0, 220),
    at: Date.now(),
  };
}

function AlignmentInquiryBoard({
  dialogue,
  questions,
  answeredCount,
  isLoading,
  thinkingText,
  streamEvents,
  onAnswer,
}: {
  dialogue: DefiningDialogueEntry[];
  questions: ScribeInquiryQuestion[];
  answeredCount: number;
  isLoading: boolean;
  thinkingText?: string;
  streamEvents: ScribeStreamEvent[];
  onAnswer: (answers: ScribeAnswer[]) => void;
}) {
  return (
    <DocketPaper
      stage={`书记员问询 ${Math.min(answeredCount + questions.length, MAX_ALIGNMENT_INQUIRY_QUESTIONS)} / ${MAX_ALIGNMENT_INQUIRY_QUESTIONS}`}
      className="mt-5"
      marginalia="这里不是补背景，而是在确认本心落定前最后几处关键处。"
    >
      <DefiningDialogueBoard
        dialogue={dialogue}
        currentQuestions={questions.map(inquiryQuestionToScribeQuestion)}
        isLoading={isLoading}
        thinkingText={thinkingText}
        streamEvents={streamEvents}
        onAnswer={onAnswer}
      />
    </DocketPaper>
  );
}

function inquiryQuestionToScribeQuestion(question: ScribeInquiryQuestion): ScribeQuestion {
  return {
    id: question.id,
    text: question.question,
    options: question.options.map((option) => ({ id: option.id, label: option.label })),
    purpose: question.options.map((option) => option.meaning).filter(Boolean).join(" / "),
  };
}

function SettlementPanel({
  alignmentReport,
  onChange,
}: {
  alignmentReport: AlignmentReport;
  onChange: (next: AlignmentReport) => void;
}) {
  const synthesisText = alignmentReport.dialectic_synthesis.user_revision || alignmentReport.dialectic_synthesis.synthesis;

  function updateModule(key: SettlementModuleKey, nextModule: SettlementModule) {
    onChange({ ...alignmentReport, [key]: nextModule });
  }

  function updateSynthesis(value: string) {
    onChange({
      ...alignmentReport,
      dialectic_synthesis: {
        ...alignmentReport.dialectic_synthesis,
        user_revision: value.slice(0, 420),
      },
    });
  }

  return (
    <section className="mt-5">
      <article className="rounded-lg overflow-hidden bg-surface-deep text-paper-lift shadow-[0_8px_16px_rgba(25,23,19,0.12),0_24px_48px_-16px_rgba(25,23,19,0.18)]">
        <header className="px-6 sm:px-8 pt-6 pb-5 border-b border-paper-lift/10">
          <div className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase">
            本心落定
          </div>
          <p className="mt-3 font-serif text-body text-paper-lift/70 leading-relaxed">
            —— 我的建议或许有用，但你的确认更加重要
          </p>
        </header>
        <div className="px-6 sm:px-8 py-6">
          <SettlementModuleSection
            module={alignmentReport.creative_hopelessness}
            onChange={(next) => updateModule("creative_hopelessness", next)}
          />
          <SettlementModuleSection
            module={alignmentReport.core_value_axis}
            onChange={(next) => updateModule("core_value_axis", next)}
          />
          <SettlementModuleSection
            module={alignmentReport.cost_acceptance_contract}
            onChange={(next) => updateModule("cost_acceptance_contract", next)}
          />
          <SettlementModuleSection
            module={alignmentReport.minimum_viable_commitment}
            onChange={(next) => updateModule("minimum_viable_commitment", next)}
          />
          <section className="border-t border-paper-lift/20 pt-6">
            <div className="text-[10px] tracking-[0.18em] text-paper-lift/40 uppercase mb-4">
              正反合
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <DarkField label="正" body={alignmentReport.dialectic_synthesis.thesis} />
              <DarkField label="反" body={alignmentReport.dialectic_synthesis.antithesis} />
              <label className="block">
                <span className="text-[10px] tracking-[0.18em] text-paper-lift/40 uppercase block mb-1">
                  合
                </span>
                <textarea
                  value={synthesisText}
                  onChange={(event) => updateSynthesis(event.target.value)}
                  rows={5}
                  className="w-full bg-transparent border-b border-paper-lift/30 focus:border-paper-lift/70 outline-none py-2 font-serif text-body text-paper-lift resize-none"
                />
              </label>
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}

type SettlementModuleKey =
  | "creative_hopelessness"
  | "core_value_axis"
  | "cost_acceptance_contract"
  | "minimum_viable_commitment";

function SettlementModuleSection({
  module,
  onChange,
}: {
  module: SettlementModule;
  onChange: (next: SettlementModule) => void;
}) {
  const status = module.user_feedback?.status;
  const userText = module.user_feedback?.user_text || "";

  function setStatus(nextStatus: "agree" | "disagree") {
    onChange({
      ...module,
      user_feedback: {
        status: nextStatus,
        user_text: nextStatus === "disagree" ? userText : undefined,
      },
    });
  }

  function setUserText(text: string) {
    onChange({
      ...module,
      user_feedback: {
        status: "disagree",
        user_text: text.slice(0, 360),
      },
    });
  }

  return (
    <section className="border-b border-paper-lift/20 py-6 first:pt-0">
      <div className="text-[10px] tracking-[0.18em] text-paper-lift/40 uppercase mb-3">
        {module.title}
      </div>
      <p className="font-serif text-body-long text-paper-lift/85 leading-relaxed whitespace-pre-line">
        {module.report}
      </p>
      {module.evidence?.filter(Boolean).length ? (
        <ul className="mt-3 space-y-1 text-body-sm text-paper-lift/50">
          {module.evidence.filter(Boolean).map((item, index) => (
            <li key={`${module.title}-${index}`}>· {item}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FeedbackButton active={status === "agree"} onClick={() => setStatus("agree")}>
          同意
        </FeedbackButton>
        <FeedbackButton active={status === "disagree"} onClick={() => setStatus("disagree")}>
          不同意
        </FeedbackButton>
      </div>
      {status === "disagree" && (
        <textarea
          value={userText}
          onChange={(event) => setUserText(event.target.value)}
          rows={3}
          placeholder="写下你自己的看法。"
          className="mt-3 w-full bg-transparent border border-paper-lift/20 focus:border-paper-lift/60 rounded-md outline-none px-3 py-2 font-serif text-body text-paper-lift placeholder-paper-lift/30 resize-none"
        />
      )}
    </section>
  );
}

function FeedbackButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-md border text-body-sm transition-colors",
        active
          ? "border-paper-lift/70 bg-paper-lift text-ink-core"
          : "border-paper-lift/20 text-paper-lift/60 hover:border-paper-lift/50 hover:text-paper-lift",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ReportBlock({
  title,
  body,
  details,
}: {
  title: string;
  body: string;
  details: string[];
}) {
  return (
    <section className="border-b border-paper-edge last:border-0 pb-4 last:pb-0">
      <h3 className="font-serif text-title text-ink-core leading-snug mb-2">{title}</h3>
      <p className="font-serif text-body-long text-ink-body leading-relaxed">{body}</p>
      {details.filter(Boolean).length > 0 && (
        <ul className="mt-3 space-y-1.5 text-body-sm text-ink-mute">
          {details.filter(Boolean).map((detail, index) => (
            <li key={`${title}-${index}`}>· {detail}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MiniField({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase mb-1">
        {label}
      </div>
      <p className="font-serif text-ink-body leading-snug">{body}</p>
    </div>
  );
}

function OpeningLine({ label, body, muted }: { label: string; body: string; muted?: boolean }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.16em] text-ink-faint uppercase mb-0.5">
        {label}
      </div>
      <p className={["font-serif text-body-sm leading-snug", muted ? "text-ink-mute" : "text-ink-body"].join(" ")}>
        {body}
      </p>
    </div>
  );
}

function VoiceSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: VoiceId;
  onChange: (v: VoiceId) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.18em] text-ink-mute uppercase block mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VoiceId)}
        className="w-full p-2 rounded-md bg-paper-base border border-paper-edge text-ink-body focus:outline-none focus:border-ink-core"
      >
        {VOICE_IDS.map((vid) => (
          <option key={vid} value={vid}>
            {voiceName(vid)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DarkField({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-paper-lift/40 uppercase mb-1">
        {label}
      </div>
      <p className="font-serif text-paper-lift/80 leading-relaxed">{body}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
        {label}
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={`${label}-${i}`} className="text-body-sm text-ink-body leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-ink-faint italic font-serif">尚未记录。</p>
      )}
    </div>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "error" }) {
  return (
    <div className="max-w-6xl mx-auto w-full px-5 sm:px-10 my-4">
      <div className="p-4 rounded-md border border-seal-action/40 bg-paper-lift text-seal-action text-body-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function toBigStage(stage: Stage): string {
  if (stage === "defining") return "defining";
  if (stage === "roundtable") return "roundtable";
  if (stage === "inquiry") return "inquiry";
  return "settlement";
}

function doneStages(current: string): string[] {
  const ids = BIG_STAGES.map((s) => s.id);
  const idx = ids.indexOf(current);
  return idx <= 0 ? [] : ids.slice(0, idx);
}

function stageLabel(stage: Stage, busy: boolean): string {
  if (stage === "defining") return busy ? "本次议题 · 书记员正在思考" : "本次议题 · 对话中";
  if (stage === "roundtable") return busy ? "五声圆桌 · 正在组织这一轮" : "五声圆桌 · 自由讨论";
  if (stage === "inquiry") return busy ? "书记员问询 · 正在分析" : "书记员问询 · 最终确认";
  if (stage === "settlement") return "本心落定 · 可改写";
  return "已保存";
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
