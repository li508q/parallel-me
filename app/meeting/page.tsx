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
  | "duel";

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
    const snapshot = roundtable;
    try {
      const json = await postJson("/api/roundtable", {
        action: "move",
        moveType,
        taskFrame,
        roundtable: snapshot,
        ...payload,
      });
      const move = json.move as RoundtableMove;
      const turns = (json.turns ?? []) as RoundtableTurn[];
      setRoundtable((prev) => ({
        opening_turns: prev.opening_turns,
        moves: [...prev.moves, move],
        turns: [...prev.turns, ...turns],
      }));
      setScribeTrace((prev) => traceMove(prev, move, turns, json.scribeNote));
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
          id: "scribe",
          label: "书记员整理",
          onClick: () => submitRoundtableMove("scribe_summary"),
          variant: "secondary",
          disabled: busy,
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
            {stage === "roundtable" && (
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
                }}
              />
            )}
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

      <HostConsole
        stageLabel={stageLabel(stage, busy)}
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
              {option.derived_kv && (
                <span className="block mt-1 text-xs text-ink-faint">
                  {Object.entries(option.derived_kv).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </span>
              )}
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
  return (
    <DocketPaper stage="本次议题" marginalia="哪一格不准，就直接在原地改。你的改写优先进入圆桌。">
      <div className="grid gap-4">
        {(Object.keys(FIELD_LABEL) as VisibleTaskFrameKey[]).map((key) => {
          const value = visible[key];
          const text = Array.isArray(value) ? value.join("\n") : value;
          const multiline = key === "key_facts" || key === "main_choices" || key === "main_concerns";
          return (
            <label key={key} className="block">
              <span className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-[10px] tracking-[0.18em] text-ink-mute uppercase">
                  {FIELD_LABEL[key]}
                </span>
                {sourceLabels[key] && (
                  <span className="text-[10px] text-ink-faint border border-paper-edge rounded px-1.5 py-0.5">
                    {sourceLabels[key]}
                  </span>
                )}
              </span>
              <textarea
                value={text}
                onChange={(e) => onChange(key, e.target.value)}
                rows={multiline ? Math.max(2, String(text).split("\n").length) : 2}
                className="w-full p-3 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body text-ink-body font-serif resize-none"
              />
            </label>
          );
        })}
      </div>
    </DocketPaper>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {VOICE_IDS.map((vid) => {
          const opening = roundtable.opening_turns.find((t) => t.voice_id === vid);
          const turns = roundtable.turns.filter((t) => t.voice_id === vid);
          const seat = SELVES[vid];
          return (
            <article
              key={vid}
              className="bg-paper-lift border border-paper-edge rounded-md p-4 min-h-[260px]"
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
                  <OpeningLine label="只听我的代价" body={opening.overreach_cost} muted />
                </div>
              )}
              {turns.length > 0 && (
                <div className="mt-4 pt-3 border-t border-paper-edge space-y-3">
                  {turns.map((turn) => (
                    <p key={turn.id} className="text-body-sm text-ink-body leading-relaxed font-serif">
                      {turn.text}
                    </p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <DuelAndScribeTurns turns={roundtable.turns} />
    </section>
  );
}

function DuelAndScribeTurns({ turns }: { turns: RoundtableTurn[] }) {
  const specials = turns.filter((t) => t.duel || t.trigger === "scribe_summary");
  if (!specials.length) return null;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {specials.map((turn) =>
        turn.duel ? (
          <DocketPaper key={turn.id} stage="两声对峙" dense>
            <p className="text-xs text-ink-mute mb-2">
              {turn.duel.from_name} → {turn.duel.to_name}
            </p>
            <p className="font-serif text-title-sm text-ink-core leading-snug mb-3">
              「{turn.duel.question}」
            </p>
            <p className="text-body-sm text-ink-body leading-relaxed mb-3">
              {turn.duel.to_name}：{turn.duel.response}
            </p>
            <p className="text-xs text-ink-mute border-t border-paper-edge pt-3">
              未解开的点：{turn.duel.unresolved_point}
            </p>
          </DocketPaper>
        ) : (
          <DocketPaper key={turn.id} stage="书记员整理" dense>
            <p className="text-body text-ink-body leading-relaxed">{turn.text}</p>
          </DocketPaper>
        ),
      )}
    </div>
  );
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
    (mode === "duel" && duelFromId === duelToId);
  return (
    <DocketPaper stage="操作台" className="mt-5" dense>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          {(mode === "continue_one" || mode === "ask_voice") && (
            <VoiceSelect label={mode === "continue_one" ? "让谁继续" : "问谁"} value={selectedVoiceId} onChange={onVoice} />
          )}
          {mode === "duel" && (
            <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
              <VoiceSelect label="谁发问" value={duelFromId} onChange={onDuelFrom} />
              <span className="hidden sm:block text-ink-mute pb-2">→</span>
              <VoiceSelect label="问谁" value={duelToId} onChange={onDuelTo} />
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
  if (move.type === "scribe_summary") {
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
