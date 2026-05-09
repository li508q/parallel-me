"use client";

// /meeting — v0.7 五声圆桌
// A scribe-guided path: raw input -> task frame -> fixed five-voice
// roundtable -> scribe inquiry -> clarity settlement.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DocketPaper } from "@/components/DocketPaper";
import { HostConsole, type ConsoleAction } from "@/components/HostConsole";
import { StageRail } from "@/components/StageRail";
import { SELVES, type SelfId } from "@/lib/selves";
import {
  loadActiveProvider,
  toRuntimePayload,
  type ProviderConfig,
} from "@/lib/provider";
import {
  newMeetingId,
  saveMeeting,
  type ChoiceAnswer,
  type ChoiceCard,
  type ChoiceOption,
  type ClarityResult,
  type Meeting,
  type PreferenceProfile,
  type RoundtableMove,
  type RoundtableRecord,
  type RoundtableTurn,
  type ScribeInquiryAnswer,
  type ScribeInquiryQuestion,
  type ScribeTrace,
  type SourceLabelMap,
  type TaskFrame,
  type VisibleTaskFrame,
  type VisibleTaskFrameKey,
  type VoiceId,
  type VoiceOpeningTurn,
  type VoiceTurnTrigger,
} from "@/lib/db";
import {
  VOICE_IDS,
  emptyRoundtable,
  emptyScribeTrace,
  voiceName,
} from "@/lib/v7";
import {
  loadProfile,
  loadTaste,
  profileToMarkdown,
  tasteToProfileHint,
} from "@/lib/profile";

type Stage = "defining" | "review" | "roundtable" | "inquiry" | "settlement" | "archived";

type RoundtableMode =
  | "none"
  | "continue_one"
  | "ask_voice"
  | "ask_table"
  | "duel"
  | "challenge"
  | "name_avoidance"
  | "cut_through";

const BIG_STAGES = [
  { id: "defining", label: "本次议题" },
  { id: "roundtable", label: "五声圆桌" },
  { id: "inquiry", label: "书记员问询" },
  { id: "settlement", label: "清明落定" },
];

const FIELD_LABEL: Record<VisibleTaskFrameKey, string> = {
  problem_definition: "问题定义",
  current_state: "当前状态",
  key_facts: "关键事实",
  main_choices: "主要选择",
  core_conflict: "核心冲突",
  central_question: "这件事问你的是",
  main_concerns: "主要牵动点",
  discussion_focus: "圆桌焦点",
};

const POSTURE_LABEL: Record<string, string> = {
  leaning: "已有倾向",
  not_ready: "暂不决定",
  testing: "先做验证",
  boundary: "先立边界",
  grieving: "先承认失去",
};

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

  const [provider, setProvider] = useState<ProviderConfig | null>(null);
  const [stage, setStage] = useState<Stage>("defining");
  const [rawInput, setRawInput] = useState("");
  const [choiceCards, setChoiceCards] = useState<ChoiceCard[]>([]);
  const [choiceAnswers, setChoiceAnswers] = useState<ChoiceAnswer[]>([]);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [customChoiceText, setCustomChoiceText] = useState("");

  const [taskFrame, setTaskFrame] = useState<TaskFrame | null>(null);
  const [frameDraft, setFrameDraft] = useState<VisibleTaskFrame | null>(null);

  const [roundtable, setRoundtable] = useState<RoundtableRecord>(() => emptyRoundtable());
  const [scribeTrace, setScribeTrace] = useState<ScribeTrace>(() => emptyScribeTrace());
  const [roundtableMode, setRoundtableMode] = useState<RoundtableMode>("none");
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>("future");
  const [duelFromId, setDuelFromId] = useState<VoiceId>("money");
  const [duelToId, setDuelToId] = useState<VoiceId>("lay");
  const [roundtableText, setRoundtableText] = useState("");

  const [inquiryQuestions, setInquiryQuestions] = useState<ScribeInquiryQuestion[]>([]);
  const [inquiryAnswers, setInquiryAnswers] = useState<ScribeInquiryAnswer[]>([]);
  const [inquiryIndex, setInquiryIndex] = useState(0);
  const [customInquiryText, setCustomInquiryText] = useState("");
  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(null);

  const [clarity, setClarity] = useState<ClarityResult | null>(null);
  const [clarityDraft, setClarityDraft] = useState("");
  const [commitmentDraft, setCommitmentDraft] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState("");

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
    void loadTaskFrame(rawParam, [], activeProvider);
  }, [rawParam, router]);

  async function postJson(
    path: string,
    body: any,
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    const runtimePayload = toRuntimePayload(runtimeProvider);
    if (!runtimePayload) throw new Error("请先配置可用的 API Key");
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        context: context(),
        provider: runtimePayload,
      }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "请求失败");
    if (json.crisis) {
      setCrisis(json.message || "这件事需要真人支持。");
      throw new Error("safety-offramp");
    }
    return json;
  }

  async function loadTaskFrame(
    input: string,
    answers: ChoiceAnswer[],
    runtimeProvider: ProviderConfig | null = provider,
  ) {
    setBusy(true);
    setError("");
    try {
      const json = await postJson(
        "/api/task-frame",
        { rawInput: input, choiceAnswers: answers },
        runtimeProvider,
      );
      setChoiceCards(json.choiceCards ?? []);
      setTaskFrame(json.taskFrame ?? null);
      setFrameDraft(json.taskFrame?.visible ?? null);
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "书记员整理失败");
    } finally {
      setBusy(false);
    }
  }

  async function finalizeTaskFrame() {
    if (busy || choiceAnswers.length < choiceCards.length) return;
    setBusy(true);
    setError("");
    try {
      const json = await postJson("/api/task-frame", {
        rawInput,
        choiceAnswers,
      });
      setTaskFrame(json.taskFrame);
      setFrameDraft(json.taskFrame.visible);
      setStage("review");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "本次议题整理失败");
    } finally {
      setBusy(false);
    }
  }

  function answerChoice(card: ChoiceCard, option: ChoiceOption, customText?: string) {
    const answer: ChoiceAnswer = {
      card_id: card.id,
      question: card.question,
      selected_option_id: option.id,
      selected_label: option.label,
      custom_text: customText?.trim() || undefined,
      derived_kv: option.derived_kv,
      at: Date.now(),
    };
    setChoiceAnswers((prev) => {
      const rest = prev.filter((a) => a.card_id !== card.id);
      return [...rest, answer];
    });
    setCustomChoiceText("");
    if (choiceIndex < choiceCards.length - 1) setChoiceIndex((i) => i + 1);
  }

  function updateFrameField(key: VisibleTaskFrameKey, value: string) {
    setFrameDraft((prev) => {
      if (!prev) return prev;
      if (key === "key_facts" || key === "main_choices" || key === "main_concerns") {
        return { ...prev, [key]: splitLines(value) };
      }
      return { ...prev, [key]: value.slice(0, 320) };
    });
  }

  async function confirmTaskFrame() {
    if (!taskFrame || !frameDraft || busy) return;
    const editedFields = diffVisibleFields(taskFrame.visible, frameDraft);
    const confirmed: TaskFrame = {
      ...taskFrame,
      visible: frameDraft,
      confirmed_at: Date.now(),
      edited_fields: editedFields,
      internal: {
        ...taskFrame.internal,
        facts: taskFrame.internal.facts.map((f) => ({
          ...f,
          evidence_status: f.evidence_status === "model_inferred" ? f.evidence_status : "user_confirmed",
        })),
      },
    };
    setTaskFrame(confirmed);
    setStage("roundtable");
    await loadOpeningTurns(confirmed);
  }

  async function loadOpeningTurns(frame: TaskFrame) {
    setBusy(true);
    setError("");
    try {
      const json = await postJson("/api/roundtable", {
        action: "opening",
        taskFrame: frame,
      });
      const openingTurns = (json.openingTurns ?? []) as VoiceOpeningTurn[];
      setRoundtable({
        opening_turns: openingTurns,
        turns: [],
        moves: [],
      });
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "五声第一轮失败");
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
    setBusy(true);
    setError("");
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
      const json = await postJson("/api/roundtable", {
        action: "move",
        moveType,
        taskFrame,
        roundtable: snapshot,
        ...payload,
      });
      const move = json.move as RoundtableMove;
      const turns = ((json.turns ?? []) as RoundtableTurn[]).map((turn) => ({
        ...turn,
        move_id: turn.move_id || move.id,
      }));
      const taggedUserTurn = userTurn ? { ...userTurn, move_id: move.id } : null;
      setRoundtable((prev) => ({
        opening_turns: prev.opening_turns,
        moves: [...prev.moves, move],
        turns: [
          ...prev.turns.map((turn) => (taggedUserTurn && turn.id === taggedUserTurn.id ? taggedUserTurn : turn)),
          ...turns,
        ],
      }));
      setScribeTrace((prev) => traceMove(prev, move, taggedUserTurn ? [taggedUserTurn, ...turns] : turns, json.scribeNote));
      setRoundtableMode("none");
      setRoundtableText("");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "圆桌推进失败");
    } finally {
      setBusy(false);
    }
  }

  async function startInquiry() {
    if (!taskFrame || busy) return;
    setStage("inquiry");
    setBusy(true);
    setError("");
    try {
      const json = await postJson("/api/scribe-inquiry", {
        taskFrame,
        roundtable,
        scribeTrace,
        inquiryAnswers: [],
      });
      setInquiryQuestions(json.questions ?? []);
      setPreferenceProfile(json.preferenceProfile ?? null);
      setInquiryIndex(0);
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "书记员问询失败");
    } finally {
      setBusy(false);
    }
  }

  function answerInquiry(question: ScribeInquiryQuestion, optionId: string, customText?: string) {
    const option = question.options.find((o) => o.id === optionId) ?? question.options[0];
    if (!option) return;
    const answer: ScribeInquiryAnswer = {
      question_id: question.id,
      question: question.question,
      selected_option_id: option.id,
      selected_label: option.label,
      custom_text: customText?.trim() || undefined,
      at: Date.now(),
    };
    setInquiryAnswers((prev) => {
      const rest = prev.filter((a) => a.question_id !== question.id);
      return [...rest, answer];
    });
    setCustomInquiryText("");
    if (inquiryIndex < inquiryQuestions.length - 1) setInquiryIndex((i) => i + 1);
  }

  async function generateSettlement() {
    if (!taskFrame || busy || inquiryAnswers.length < inquiryQuestions.length) return;
    setBusy(true);
    setError("");
    try {
      const inquiry = await postJson("/api/scribe-inquiry", {
        taskFrame,
        roundtable,
        scribeTrace,
        inquiryAnswers,
      });
      const profile = inquiry.preferenceProfile as PreferenceProfile;
      setPreferenceProfile(profile);

      const settlement = await postJson("/api/settlement", {
        taskFrame,
        roundtable,
        scribeTrace,
        inquiryAnswers,
        preferenceProfile: profile,
      });
      const nextClarity = settlement.clarity as ClarityResult;
      setClarity(nextClarity);
      setClarityDraft(nextClarity.clarity_sentence);
      setCommitmentDraft(nextClarity.commitment24h);
      setStage("settlement");
    } catch (e: any) {
      if (e?.message !== "safety-offramp") setError(e?.message || "清明落定失败");
    } finally {
      setBusy(false);
    }
  }

  async function archiveMeeting() {
    if (!taskFrame || !clarity || busy) return;
    const finalClarity: ClarityResult = {
      ...clarity,
      clarity_sentence: clarityDraft.trim() || clarity.clarity_sentence,
      commitment24h: commitmentDraft.trim() || clarity.commitment24h,
      user_revision:
        clarityDraft.trim() && clarityDraft.trim() !== clarity.clarity_sentence
          ? clarityDraft.trim()
          : clarity.user_revision,
    };
    const meeting: Meeting = {
      id: meetingIdRef.current,
      createdAt: startedAtRef.current,
      closedAt: Date.now(),
      status: "settled",
      raw_input: rawInput,
      choice_cards: choiceCards,
      choice_answers: choiceAnswers,
      task_frame: taskFrame,
      roundtable,
      scribe_trace: scribeTrace,
      inquiry_questions: inquiryQuestions,
      inquiry_answers: inquiryAnswers,
      preference_profile: preferenceProfile ?? undefined,
      clarity: finalClarity,
    };
    setBusy(true);
    try {
      await saveMeeting(meeting);
      setStage("archived");
      router.push(`/archive/${meeting.id}`);
    } catch (e: any) {
      setError(e?.message || "纸页保存失败");
    } finally {
      setBusy(false);
    }
  }

  const allChoicesAnswered = choiceCards.length > 0 && choiceAnswers.length >= choiceCards.length;
  const allInquiryAnswered =
    inquiryQuestions.length > 0 && inquiryAnswers.length >= inquiryQuestions.length;
  const bigStage = toBigStage(stage);
  const actions = buildActions();

  function buildActions(): ConsoleAction[] {
    if (stage === "defining") {
      return [
        {
          id: "task-frame",
          label: busy ? "整理中…" : "整理本次议题 →",
          onClick: finalizeTaskFrame,
          variant: "primary",
          disabled: busy || !allChoicesAnswered,
        },
      ];
    }
    if (stage === "review") {
      return [
        {
          id: "confirm-frame",
          label: busy ? "生成五声中…" : "确认，进入五声圆桌 →",
          onClick: confirmTaskFrame,
          variant: "primary",
          disabled: busy || !frameDraft,
        },
      ];
    }
    if (stage === "roundtable") {
      return [
        {
          id: "continue-all",
          label: "再来一轮",
          onClick: () => submitRoundtableMove("continue_all"),
          variant: "secondary",
          disabled: busy || roundtable.opening_turns.length === 0,
        },
        {
          id: "one",
          label: "让某声继续",
          onClick: () => setRoundtableMode("continue_one"),
          variant: roundtableMode === "continue_one" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "ask-voice",
          label: "问某一声",
          onClick: () => setRoundtableMode("ask_voice"),
          variant: roundtableMode === "ask_voice" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "ask-table",
          label: "问全桌",
          onClick: () => setRoundtableMode("ask_table"),
          variant: roundtableMode === "ask_table" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "duel",
          label: "两声对峙",
          onClick: () => setRoundtableMode("duel"),
          variant: roundtableMode === "duel" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "challenge",
          label: "定向反对",
          onClick: () => setRoundtableMode("challenge"),
          variant: roundtableMode === "challenge" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "name-avoidance",
          label: "点破回避",
          onClick: () => setRoundtableMode("name_avoidance"),
          variant: roundtableMode === "name_avoidance" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "cut-through",
          label: "一句戳破",
          onClick: () => setRoundtableMode("cut_through"),
          variant: roundtableMode === "cut_through" ? "primary" : "muted",
          disabled: busy,
        },
        {
          id: "mirror-structure",
          label: "书记员照一下",
          onClick: () => submitRoundtableMove("mirror_structure"),
          variant: "secondary",
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
      return [
        {
          id: "settle",
          label: busy ? "落定中…" : "生成清明落定 →",
          onClick: generateSettlement,
          variant: "primary",
          disabled: busy || !allInquiryAnswered,
        },
      ];
    }
    if (stage === "settlement") {
      return [
        {
          id: "archive",
          label: busy ? "保存中…" : "保存纸页",
          onClick: archiveMeeting,
          variant: "primary",
          disabled: busy || !clarityDraft.trim() || !commitmentDraft.trim(),
        },
      ];
    }
    return [];
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
        <Notice tone="error">{error}</Notice>
      )}
      {crisis && <Notice tone="error">{crisis}</Notice>}

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 sm:px-10 py-6 pb-32 sm:pb-40 font-sans text-ink-body">
        <DocketPaper stage="原始输入" dense className="mb-5">
          <p className="font-serif text-title text-ink-core leading-snug">{rawInput}</p>
        </DocketPaper>

        {stage === "defining" && (
          <ChoiceCardBoard
            cards={choiceCards}
            answers={choiceAnswers}
            index={choiceIndex}
            customText={customChoiceText}
            busy={busy}
            onCustomText={setCustomChoiceText}
            onIndex={setChoiceIndex}
            onAnswer={answerChoice}
          />
        )}

        {stage === "review" && frameDraft && (
          <TaskFrameReview
            visible={frameDraft}
            sourceLabels={taskFrame?.internal.source_labels ?? {}}
            onChange={updateFrameField}
          />
        )}

        {(stage === "roundtable" || stage === "inquiry" || stage === "settlement" || stage === "archived") && taskFrame && (
          <>
            <TaskFrameSummary frame={taskFrame.visible} className="mb-5" />
            <RoundtableBoard roundtable={roundtable} busy={busy && stage === "roundtable"} />
          </>
        )}

        {stage === "inquiry" && (
          <InquiryBoard
            questions={inquiryQuestions}
            answers={inquiryAnswers}
            index={inquiryIndex}
            customText={customInquiryText}
            busy={busy}
            onCustomText={setCustomInquiryText}
            onIndex={setInquiryIndex}
            onAnswer={answerInquiry}
          />
        )}

        {stage === "settlement" && clarity && preferenceProfile && (
          <SettlementPanel
            clarity={clarity}
            preferenceProfile={preferenceProfile}
            clarityDraft={clarityDraft}
            commitmentDraft={commitmentDraft}
            onClarityDraft={setClarityDraft}
            onCommitmentDraft={setCommitmentDraft}
          />
        )}
      </main>

      {stage === "roundtable" && roundtableMode !== "none" && (
        <div className="fixed left-0 right-0 bottom-[82px] sm:bottom-[90px] z-20 px-4 sm:px-6 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <RoundtableControl
              mode={roundtableMode}
              selectedVoiceId={selectedVoiceId}
              duelFromId={duelFromId}
              duelToId={duelToId}
              text={roundtableText}
              busy={busy}
              onMode={setRoundtableMode}
              onVoice={setSelectedVoiceId}
              onDuelFrom={setDuelFromId}
              onDuelTo={setDuelToId}
              onText={setRoundtableText}
              onSubmit={(mode) => {
                if (mode === "continue_one") {
                  return submitRoundtableMove("continue_one", { targetVoiceId: selectedVoiceId });
                }
                if (mode === "ask_voice") {
                  return submitRoundtableMove("user_to_voice", {
                    targetVoiceId: selectedVoiceId,
                    userText: roundtableText.trim(),
                  });
                }
                if (mode === "ask_table") {
                  return submitRoundtableMove("user_to_table", { userText: roundtableText.trim() });
                }
                if (mode === "duel") {
                  return submitRoundtableMove("duel", { fromVoiceId: duelFromId, toVoiceId: duelToId });
                }
                if (mode === "challenge") {
                  return submitRoundtableMove("challenge", { fromVoiceId: duelFromId, toVoiceId: duelToId });
                }
                if (mode === "name_avoidance") {
                  return submitRoundtableMove("name_avoidance", { fromVoiceId: duelFromId, toVoiceId: duelToId });
                }
                if (mode === "cut_through") {
                  return submitRoundtableMove("cut_through", { targetVoiceId: selectedVoiceId });
                }
              }}
            />
          </div>
        </div>
      )}

      <HostConsole
        stageLabel={stage === "roundtable" ? undefined : stageLabel(stage, busy)}
        actions={actions}
        inputDisabled
      />
    </div>
  );
}

function ChoiceCardBoard({
  cards,
  answers,
  index,
  customText,
  busy,
  onCustomText,
  onIndex,
  onAnswer,
}: {
  cards: ChoiceCard[];
  answers: ChoiceAnswer[];
  index: number;
  customText: string;
  busy: boolean;
  onCustomText: (v: string) => void;
  onIndex: (v: number) => void;
  onAnswer: (card: ChoiceCard, option: ChoiceOption, customText?: string) => void;
}) {
  const card = cards[index];
  const answer = card ? answers.find((a) => a.card_id === card.id) : undefined;
  const customOption = card?.options.find((o) => isCustomOption(o));
  if (busy && !cards.length) {
    return (
      <DocketPaper stage="书记员" marginalia="先把散乱内容压缩成少量高密度选择。">
        <p className="font-serif text-title text-ink-core">书记员正在整理选择卡。</p>
      </DocketPaper>
    );
  }
  if (!card) return null;
  return (
    <DocketPaper
      stage={`选择卡 ${index + 1} / ${cards.length}`}
      marginalia="一个选择会同时更新多组 KV。点选之后可以返回上一题。"
    >
      <div className="mb-5">
        <h1 className="font-serif text-headline text-ink-core leading-tight">
          {card.question}
        </h1>
      </div>
      <div className="grid gap-2">
        {card.options.map((option) => {
          const selected = answer?.selected_option_id === option.id;
          const custom = isCustomOption(option);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (!custom) onAnswer(card, option);
              }}
              className={[
                "text-left p-3 rounded-md border transition-colors",
                selected ? "border-ink-core bg-paper-base" : "border-paper-edge bg-paper-lift hover:border-ink-mute",
              ].join(" ")}
            >
              <span className="font-serif text-body-long text-ink-core leading-snug">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {customOption && (
        <div className="mt-4 p-3 rounded-md bg-paper-base border border-paper-edge">
          <textarea
            value={customText}
            onChange={(e) => onCustomText(e.target.value.slice(0, 180))}
            rows={2}
            placeholder="如果选项都不准，就在这里补一句。"
            className="w-full bg-transparent outline-none resize-none text-body text-ink-body placeholder-ink-faint font-serif"
          />
          <button
            type="button"
            onClick={() => customText.trim() && onAnswer(card, customOption, customText)}
            disabled={!customText.trim()}
            className="mt-2 px-3 py-1.5 rounded-md bg-ink-core text-paper-base text-body-sm disabled:opacity-30"
          >
            记下这句
          </button>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-ink-mute">
        <button
          type="button"
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="hover:text-ink-core disabled:opacity-30"
        >
          上一题
        </button>
        <span>{answers.length} / {cards.length} 已回答</span>
        <button
          type="button"
          onClick={() => onIndex(Math.min(cards.length - 1, index + 1))}
          disabled={index === cards.length - 1}
          className="hover:text-ink-core disabled:opacity-30"
        >
          下一题
        </button>
      </div>
    </DocketPaper>
  );
}

function TaskFrameReview({
  visible,
  sourceLabels,
  onChange,
}: {
  visible: VisibleTaskFrame;
  sourceLabels: SourceLabelMap;
  onChange: (key: VisibleTaskFrameKey, value: string) => void;
}) {
  const clusters: Array<{
    title: string;
    keys: VisibleTaskFrameKey[];
    render: React.ReactNode;
  }> = [
    {
      title: "你在问的是",
      keys: ["problem_definition", "central_question"],
      render: (
        <div className="space-y-3">
          <BriefTextarea value={visible.problem_definition} onChange={(v) => onChange("problem_definition", v)} rows={2} />
          <BriefTextarea value={visible.central_question} onChange={(v) => onChange("central_question", v)} rows={2} emphasis />
        </div>
      ),
    },
    {
      title: "你现在的处境",
      keys: ["current_state", "key_facts"],
      render: (
        <div className="space-y-3">
          <BriefTextarea value={visible.current_state} onChange={(v) => onChange("current_state", v)} rows={2} />
          <BriefTextarea value={visible.key_facts.join("\n")} onChange={(v) => onChange("key_facts", v)} rows={Math.max(2, visible.key_facts.length)} compact />
        </div>
      ),
    },
    {
      title: "你正在被拉扯",
      keys: ["main_choices", "core_conflict", "main_concerns"],
      render: (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            {visible.main_choices.slice(0, 2).map((choice, index) => (
              <div key={`${choice}-${index}`} className="rounded-md border border-paper-edge bg-paper-base p-3">
                <span className="text-ink-faint mr-2">{index === 0 ? "↗" : "↙"}</span>
                <span className="font-serif text-body text-ink-body leading-relaxed">{choice}</span>
              </div>
            ))}
          </div>
          <BriefTextarea value={visible.main_choices.join("\n")} onChange={(v) => onChange("main_choices", v)} rows={Math.max(2, visible.main_choices.length)} compact />
          <BriefTextarea value={visible.core_conflict} onChange={(v) => onChange("core_conflict", v)} rows={2} emphasis />
          <BriefTextarea value={visible.main_concerns.join("\n")} onChange={(v) => onChange("main_concerns", v)} rows={Math.max(2, visible.main_concerns.length)} compact />
        </div>
      ),
    },
    {
      title: "我们待会儿要聊的",
      keys: ["discussion_focus"],
      render: (
        <div className="space-y-3">
          <BriefTextarea value={visible.discussion_focus} onChange={(v) => onChange("discussion_focus", v)} rows={2} emphasis />
          <div className="flex flex-wrap gap-2 pt-1">
            {VOICE_IDS.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-paper-edge bg-paper-lift px-2 py-1 text-xs text-ink-mute"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--${VOICE_COLOR_VAR[id]})` }} />
                {voiceName(id)}
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <DocketPaper stage="本次议题" marginalia="点任意段落就能改。你的改写优先进入圆桌。">
      <div className="space-y-6">
        {clusters.map((cluster) => (
          <section key={cluster.title} className="border-b border-paper-edge last:border-b-0 pb-5 last:pb-0">
            <h2 className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-3">
              {cluster.title}
            </h2>
            {cluster.render}
            <SourceWhisper labels={cluster.keys.map((key) => sourceLabels[key]).filter(Boolean) as string[]} />
          </section>
        ))}
      </div>
    </DocketPaper>
  );
}

function BriefTextarea({
  value,
  onChange,
  rows,
  emphasis,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  emphasis?: boolean;
  compact?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={[
        "w-full rounded-md bg-transparent border border-transparent hover:border-paper-edge focus:border-ink-core focus:bg-paper-base focus:outline-none resize-none transition-colors",
        "font-serif text-ink-body leading-relaxed",
        emphasis ? "text-title-sm text-ink-core" : compact ? "text-body-sm" : "text-body",
        compact ? "p-2" : "p-1.5",
      ].join(" ")}
    />
  );
}

function SourceWhisper({ labels }: { labels: string[] }) {
  const unique = Array.from(new Set(labels));
  if (!unique.length) return null;
  return (
    <p className="mt-2 text-[10px] text-ink-faint leading-relaxed">
      · {unique.join(" / ")}
    </p>
  );
}

function TaskFrameSummary({ frame, className = "" }: { frame: VisibleTaskFrame; className?: string }) {
  return (
    <DocketPaper stage="本次议题" dense className={className}>
      <p className="font-serif text-title text-ink-core leading-snug mb-3">
        {frame.problem_definition}
      </p>
      <div className="grid sm:grid-cols-2 gap-3 text-body-sm">
        <MiniField label="这件事问你的是" body={frame.central_question} />
        <MiniField label="圆桌焦点" body={frame.discussion_focus} />
        <MiniField label="核心冲突" body={frame.core_conflict} />
        <MiniField label="主要牵动点" body={frame.main_concerns.join(" / ")} />
      </div>
    </DocketPaper>
  );
}

function RoundtableBoard({
  roundtable,
  busy,
}: {
  roundtable: RoundtableRecord;
  busy: boolean;
}) {
  return (
    <section className="space-y-5">
      <header className="flex items-end justify-between gap-3 border-b border-paper-edge pb-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
            Opening Positions
          </div>
          <h2 className="font-serif text-title-sm text-ink-core leading-snug">
            五声第一轮
          </h2>
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
                  <OpeningLine label="我先站在" body={opening.thesis} />
                  <OpeningLine label="我在保护" body={opening.protected_value} />
                  <OpeningLine label="我担心" body={opening.concern} />
                  <OpeningLine label="我抓住的依据" body={opening.task_evidence} />
                  <OpeningLine label="我会拉你去" body={opening.pull} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <RoundtableTimeline roundtable={roundtable} busy={busy} />
    </section>
  );
}

type RoundtableTimelineGroup = {
  key: string;
  trigger: VoiceTurnTrigger;
  at: number;
  turns: RoundtableTurn[];
};

function RoundtableTimeline({
  roundtable,
  busy,
}: {
  roundtable: RoundtableRecord;
  busy: boolean;
}) {
  const groups = groupRoundtableTurns(roundtable.turns);
  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-3 border-b border-paper-edge pb-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase">
            Chronological Stream
          </div>
          <h2 className="font-serif text-title-sm text-ink-core leading-snug">
            自由圆桌 · 时间线
          </h2>
        </div>
        <div className="text-xs text-ink-mute tabular-nums">
          {groups.length ? `${groups.length} 轮 / ${roundtable.turns.length} 条` : "等待开始"}
        </div>
      </header>

      {!groups.length ? (
        <div className="rounded-md border border-dashed border-paper-edge bg-paper-lift px-4 py-6">
          <p className="font-serif text-body text-ink-mute leading-relaxed">
            {busy ? "圆桌正在组织下一句。" : "点击底部操作，让五声按时间进入同一条会议流。"}
          </p>
        </div>
      ) : (
        <div className="relative space-y-5 before:absolute before:left-4 sm:before:left-1/2 before:top-2 before:bottom-2 before:w-px before:bg-paper-edge">
          {groups.map((group, index) => (
            <section key={group.key} className="relative space-y-3">
              <RoundMarker index={index + 2} group={group} />
              <div className="space-y-3">
                {group.turns.map((turn) => (
                  <RoundtableTimelineTurn key={turn.id} turn={turn} />
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
      last.at = Math.min(last.at, turn.at);
      continue;
    }
    groups.push({
      key,
      trigger: turn.trigger,
      at: turn.at,
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
        第 {index} 轮 · {roundtableTriggerLabel(group.trigger)} · {formatTurnTime(group.at)}
      </span>
    </div>
  );
}

function RoundtableTimelineTurn({ turn }: { turn: RoundtableTurn }) {
  if (turn.trigger === "user_text") {
    return (
      <article className="relative ml-auto max-w-2xl rounded-md border border-paper-edge bg-paper-base px-4 py-3 text-right shadow-[0_6px_18px_rgba(25,23,19,0.04)]">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
          我 · {formatTurnTime(turn.at)}
        </div>
        <p className="font-serif italic text-body text-ink-core leading-relaxed whitespace-pre-line">
          「{turn.user_text || turn.text}」
        </p>
      </article>
    );
  }
  if (turn.duel) {
    return <DuelTimelineCard turn={turn} />;
  }
  if (turn.trigger === "scribe_summary" || turn.trigger === "mirror_structure") {
    return (
      <article className={[
        "relative mx-auto max-w-3xl rounded-md border border-paper-edge px-4 py-3",
        turn.trigger === "mirror_structure" ? "bg-paper-base shadow-[0_6px_18px_rgba(25,23,19,0.04)]" : "bg-paper-lift",
      ].join(" ")}>
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
          {turn.trigger === "mirror_structure" ? "书记员观察" : "书记员"} · {formatTurnTime(turn.at)}
        </div>
        <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">{turn.text}</p>
      </article>
    );
  }
  const vid = turn.voice_id;
  if (turn.trigger === "cut_through") {
    return (
      <article
        className="relative mx-auto max-w-3xl rounded-md border border-ink-core bg-paper-base px-5 py-5 text-center shadow-[0_10px_30px_rgba(25,23,19,0.08)]"
        style={vid ? { borderTop: `4px solid var(--${VOICE_COLOR_VAR[vid]})` } : undefined}
      >
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
          {vid ? voiceName(vid) : "某一声"} · 一句戳破 · {formatTurnTime(turn.at)}
        </div>
        <p className="font-serif text-title-sm text-ink-core leading-relaxed whitespace-pre-line">
          {turn.text}
        </p>
        <ReferencePills refs={turn.refers_to} />
      </article>
    );
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
          两声对峙 · {formatTurnTime(turn.at)}
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
      <p className="mt-3 border-t border-paper-edge pt-3 text-xs text-ink-mute leading-relaxed">
        未解开的点：{duel.unresolved_point}
      </p>
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
    continue_all: "自由发言",
    continue_one: "单声续言",
    user_to_voice: "你的追问",
    user_to_table: "全桌追问",
    user_text: "你的发言",
    duel: "对峙",
    challenge: "定向反对",
    name_avoidance: "点破回避",
    cut_through: "一句戳破",
    mirror_structure: "书记员观察",
    scribe_summary: "书记员侧记",
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

function RoundtableControl({
  mode,
  selectedVoiceId,
  duelFromId,
  duelToId,
  text,
  busy,
  onMode,
  onVoice,
  onDuelFrom,
  onDuelTo,
  onText,
  onSubmit,
}: {
  mode: RoundtableMode;
  selectedVoiceId: VoiceId;
  duelFromId: VoiceId;
  duelToId: VoiceId;
  text: string;
  busy: boolean;
  onMode: (m: RoundtableMode) => void;
  onVoice: (v: VoiceId) => void;
  onDuelFrom: (v: VoiceId) => void;
  onDuelTo: (v: VoiceId) => void;
  onText: (v: string) => void;
  onSubmit: (mode: Exclude<RoundtableMode, "none">) => void;
}) {
  if (mode === "none") return null;
  const needsText = mode === "ask_voice" || mode === "ask_table";
  const disabled =
    busy ||
    (needsText && !text.trim()) ||
    ((mode === "duel" || mode === "challenge" || mode === "name_avoidance") && duelFromId === duelToId);
  const usesPair = mode === "duel" || mode === "challenge" || mode === "name_avoidance";
  return (
    <DocketPaper stage="就近操作台" dense>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          {(mode === "continue_one" || mode === "ask_voice" || mode === "cut_through") && (
            <VoiceSelect
              label={mode === "continue_one" ? "让谁继续" : mode === "cut_through" ? "让谁戳破" : "问谁"}
              value={selectedVoiceId}
              onChange={onVoice}
            />
          )}
          {usesPair && (
            <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
              <VoiceSelect
                label={mode === "duel" ? "谁发问" : "谁开口"}
                value={duelFromId}
                onChange={onDuelFrom}
              />
              <span className="hidden sm:block text-ink-mute pb-2">→</span>
              <VoiceSelect
                label={mode === "duel" ? "问谁" : "反对谁"}
                value={duelToId}
                onChange={onDuelTo}
              />
            </div>
          )}
          {needsText && (
            <textarea
              value={text}
              onChange={(e) => onText(e.target.value.slice(0, 320))}
              rows={3}
              placeholder={mode === "ask_table" ? "把你要问全桌的话写在这里。" : "把你要问这一声的话写在这里。"}
              className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
            />
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onMode("none")}
            className="px-4 py-2 rounded-md text-body-sm text-ink-mute hover:text-ink-core"
          >
            收起
          </button>
          <button
            type="button"
            onClick={() => onSubmit(mode)}
            disabled={disabled}
            className="px-5 py-2 rounded-md bg-ink-core text-paper-base text-body-sm disabled:opacity-30"
          >
            发送
          </button>
        </div>
      </div>
    </DocketPaper>
  );
}

function InquiryBoard({
  questions,
  answers,
  index,
  customText,
  busy,
  onCustomText,
  onIndex,
  onAnswer,
}: {
  questions: ScribeInquiryQuestion[];
  answers: ScribeInquiryAnswer[];
  index: number;
  customText: string;
  busy: boolean;
  onCustomText: (v: string) => void;
  onIndex: (v: number) => void;
  onAnswer: (question: ScribeInquiryQuestion, optionId: string, customText?: string) => void;
}) {
  const question = questions[index];
  const answer = question ? answers.find((a) => a.question_id === question.id) : undefined;
  if (busy && !questions.length) {
    return (
      <DocketPaper stage="书记员问询" className="mt-5">
        <p className="font-serif text-title text-ink-core">书记员正在挑几个关键问题。</p>
      </DocketPaper>
    );
  }
  if (!question) return null;
  const custom = question.options.find((o) => /不准|自己|补/.test(o.label));
  return (
    <DocketPaper stage={`书记员问询 ${index + 1} / ${questions.length}`} className="mt-5" marginalia="这里不是补背景，而是在验证你刚才更靠近什么。">
      <h2 className="font-serif text-headline text-ink-core leading-tight mb-5">
        {question.question}
      </h2>
      <div className="grid gap-2">
        {question.options.map((option) => {
          const selected = answer?.selected_option_id === option.id;
          const isCustom = option.id === custom?.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (!isCustom) onAnswer(question, option.id);
              }}
              className={[
                "text-left p-3 rounded-md border transition-colors",
                selected ? "border-ink-core bg-paper-base" : "border-paper-edge bg-paper-lift hover:border-ink-mute",
              ].join(" ")}
            >
              <span className="font-serif text-body-long text-ink-core leading-snug">
                {option.label}
              </span>
              {option.meaning && (
                <span className="block mt-1 text-xs text-ink-faint">
                  {option.meaning}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {custom && (
        <div className="mt-4 p-3 rounded-md bg-paper-base border border-paper-edge">
          <textarea
            value={customText}
            onChange={(e) => onCustomText(e.target.value.slice(0, 180))}
            rows={2}
            placeholder="你也可以直接说出更准确的倾向。"
            className="w-full bg-transparent outline-none resize-none text-body text-ink-body placeholder-ink-faint font-serif"
          />
          <button
            type="button"
            onClick={() => customText.trim() && onAnswer(question, custom.id, customText)}
            disabled={!customText.trim()}
            className="mt-2 px-3 py-1.5 rounded-md bg-ink-core text-paper-base text-body-sm disabled:opacity-30"
          >
            记下这句
          </button>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-ink-mute">
        <button
          type="button"
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="hover:text-ink-core disabled:opacity-30"
        >
          上一题
        </button>
        <span>{answers.length} / {questions.length} 已回答</span>
        <button
          type="button"
          onClick={() => onIndex(Math.min(questions.length - 1, index + 1))}
          disabled={index === questions.length - 1}
          className="hover:text-ink-core disabled:opacity-30"
        >
          下一题
        </button>
      </div>
    </DocketPaper>
  );
}

function SettlementPanel({
  clarity,
  preferenceProfile,
  clarityDraft,
  commitmentDraft,
  onClarityDraft,
  onCommitmentDraft,
}: {
  clarity: ClarityResult;
  preferenceProfile: PreferenceProfile;
  clarityDraft: string;
  commitmentDraft: string;
  onClarityDraft: (v: string) => void;
  onCommitmentDraft: (v: string) => void;
}) {
  return (
    <section className="mt-5 space-y-4">
      <article className="rounded-lg overflow-hidden bg-surface-deep text-paper-lift shadow-[0_8px_16px_rgba(25,23,19,0.12),0_24px_48px_-16px_rgba(25,23,19,0.18)]">
        <header className="px-6 sm:px-8 pt-6 pb-3 border-b border-paper-lift/10">
          <div className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase">
            清明落定
          </div>
        </header>
        <div className="px-6 sm:px-8 py-6 space-y-5">
          <label className="block">
            <span className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase block mb-2">
              清明句
            </span>
            <textarea
              value={clarityDraft}
              onChange={(e) => onClarityDraft(e.target.value.slice(0, 220))}
              rows={3}
              className="w-full bg-transparent border-b border-paper-lift/30 focus:border-paper-lift/70 outline-none py-2 font-serif text-verdict text-paper-lift resize-none"
            />
          </label>
          <div className="grid md:grid-cols-3 gap-4 text-body-sm">
            <DarkField label="偏好读数" body={clarity.preference_readout} />
            <DarkField label="代价承认" body={clarity.tradeoff_acknowledgement} />
            <DarkField label="此刻落点" body={POSTURE_LABEL[clarity.settlement_posture] || clarity.settlement_posture} />
          </div>
          <label className="block pt-4 border-t border-paper-lift/10">
            <span className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase block mb-2">
              接下来 24 小时
            </span>
            <textarea
              value={commitmentDraft}
              onChange={(e) => onCommitmentDraft(e.target.value.slice(0, 160))}
              rows={2}
              className="w-full bg-transparent border-b border-paper-lift/30 focus:border-paper-lift/70 outline-none py-2 text-body text-paper-lift placeholder-paper-lift/30 font-serif resize-none"
            />
          </label>
        </div>
      </article>

      <DocketPaper stage="书记员偏好刻画" dense>
        <div className="grid md:grid-cols-2 gap-4">
          <ListField label="已验证倾向" items={preferenceProfile.validated_leanings} />
          <ListField label="仍在摇摆" items={preferenceProfile.unresolved_tensions} />
          <ListField label="愿意承认的代价" items={preferenceProfile.accepted_tradeoffs} />
          <ListField label="用户亲口说过" items={preferenceProfile.user_self_statements} />
        </div>
      </DocketPaper>
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

function traceMove(
  trace: ScribeTrace,
  move: RoundtableMove,
  turns: RoundtableTurn[],
  scribeNote?: string,
): ScribeTrace {
  const text = scribeNote || move.scribe_note || "书记员记录了一次圆桌动作。";
  const base = {
    source: "user_action" as const,
    target_voice_id: move.target_voice_id,
    text,
    evidence_status: "user_selected" as const,
    at: move.at,
  };
  if (move.type === "continue_all") {
    return { ...trace, requested_rounds: [...trace.requested_rounds, base] };
  }
  if (move.type === "continue_one") {
    return { ...trace, requested_voices: [...trace.requested_voices, base] };
  }
  if (move.type === "user_to_voice") {
    return {
      ...trace,
      direct_questions: [
        ...trace.direct_questions,
        { ...base, text: move.user_text || text },
      ],
    };
  }
  if (move.type === "user_to_table") {
    const item = { ...base, source: "user_text" as const, text: move.user_text || text };
    return {
      ...trace,
      table_interventions: [...trace.table_interventions, item],
      new_information: [...trace.new_information, item],
    };
  }
  if (move.type === "duel" && move.from_voice_id && move.to_voice_id) {
    const duelText = turns.find((t) => t.duel)?.duel?.unresolved_point || text;
    return {
      ...trace,
      selected_conflicts: [
        ...trace.selected_conflicts,
        {
          from_voice_id: move.from_voice_id,
          to_voice_id: move.to_voice_id,
          text: duelText,
          evidence_status: "user_selected",
          at: move.at,
        },
      ],
    };
  }
  if ((move.type === "challenge" || move.type === "name_avoidance") && move.from_voice_id && move.to_voice_id) {
    return {
      ...trace,
      selected_conflicts: [
        ...trace.selected_conflicts,
        {
          from_voice_id: move.from_voice_id,
          to_voice_id: move.to_voice_id,
          text: turns.find((t) => t.text)?.text || text,
          evidence_status: "user_selected",
          at: move.at,
        },
      ],
    };
  }
  if (move.type === "cut_through") {
    return {
      ...trace,
      requested_voices: [...trace.requested_voices, base],
    };
  }
  if (move.type === "scribe_summary" || move.type === "mirror_structure") {
    return {
      ...trace,
      scribe_summaries: [
        ...trace.scribe_summaries,
        { ...base, source: "scribe_inferred", text },
      ],
    };
  }
  return trace;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function diffVisibleFields(a: VisibleTaskFrame, b: VisibleTaskFrame) {
  const out: Partial<Record<VisibleTaskFrameKey, boolean>> = {};
  for (const key of Object.keys(FIELD_LABEL) as VisibleTaskFrameKey[]) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) out[key] = true;
  }
  return out;
}

function isCustomOption(option: ChoiceOption): boolean {
  return option.id === "custom" || /不准|自己|补/.test(option.label);
}

function toBigStage(stage: Stage): string {
  if (stage === "defining" || stage === "review") return "defining";
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
  if (stage === "defining") return busy ? "本次议题 · 书记员整理中" : "本次议题 · 选择卡";
  if (stage === "review") return "本次议题 · 确认";
  if (stage === "roundtable") return busy ? "五声圆桌 · 正在回应" : "五声圆桌 · 自由讨论";
  if (stage === "inquiry") return busy ? "书记员问询 · 正在分析" : "书记员问询 · 验证偏好";
  if (stage === "settlement") return "清明落定 · 可改写";
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
