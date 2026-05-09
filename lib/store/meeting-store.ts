"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type { ScribeStreamEvent } from "@/lib/agents/events";
import { narrate } from "@/lib/scribe-narration";
import { toRuntimePayload, type ProviderConfig } from "@/lib/provider";
import {
  emptyRoundtable,
  type DefiningDialogueEntry,
  type AlignmentProfile,
  type AlignmentReport,
  type IssueProposal,
  type ScribeObservationLedger,
  type ScribeAnswer,
  type ScribeQuestion,
} from "@/lib/v7";
import type {
  RoundtableRecord,
  ScribeInquiryAnswer,
  ScribeInquiryQuestion,
  TaskFrame,
  VoiceId,
} from "@/lib/db";

export type MeetingStage =
  | "defining"
  | "roundtable"
  | "inquiry"
  | "settlement"
  | "archived";

export type DefiningSubStage = "probing" | "showing_proposal";

export type RoundtableMode =
  | "none"
  | "ask_voice"
  | "ask_table"
  | "duel";

type Updater<T> = T | ((prev: T) => T);

function resolveUpdater<T>(next: Updater<T>, prev: T): T {
  return typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
}

interface StreamRequestOptions {
  path: string;
  body: Record<string, unknown>;
  provider: ProviderConfig | null;
  context: () => unknown;
}

interface MeetingStore {
  provider: ProviderConfig | null;
  stage: MeetingStage;
  rawInput: string;

  definingDialogue: DefiningDialogueEntry[];
  currentQuestions: ScribeQuestion[];
  issueProposal: IssueProposal | null;
  definingSubStage: DefiningSubStage;

  taskFrame: TaskFrame | null;

  roundtable: RoundtableRecord;
  roundtableMode: RoundtableMode;
  selectedVoiceId: VoiceId;
  duelFromId: VoiceId;
  duelToId: VoiceId;
  roundtableText: string;

  inquiryQuestions: ScribeInquiryQuestion[];
  inquiryAnswers: ScribeInquiryAnswer[];
  inquiryDialogue: DefiningDialogueEntry[];
  inquiryIndex: number;
  customInquiryText: string;
  alignmentProfile: AlignmentProfile | null;
  scribeObservationLedger: ScribeObservationLedger | null;

  alignmentReport: AlignmentReport | null;
  clarityDraft: string;
  contractDraft: string;
  commitmentDraft: string;

  busy: boolean;
  error: string;
  crisis: string;

  streamNarration: string;
  streamEvents: ScribeStreamEvent[];
  isStreaming: boolean;
  traceOpen: boolean;
  streamAbort: AbortController | null;

  setProvider: (value: ProviderConfig | null) => void;
  setStage: (value: MeetingStage) => void;
  setRawInput: (value: string) => void;
  setDefiningDialogue: (value: Updater<DefiningDialogueEntry[]>) => void;
  setCurrentQuestions: (value: Updater<ScribeQuestion[]>) => void;
  setIssueProposal: (value: IssueProposal | null) => void;
  setDefiningSubStage: (value: DefiningSubStage) => void;
  setTaskFrame: (value: Updater<TaskFrame | null>) => void;
  setRoundtable: (value: Updater<RoundtableRecord>) => void;
  setRoundtableMode: (value: RoundtableMode) => void;
  setSelectedVoiceId: (value: VoiceId) => void;
  setDuelFromId: (value: VoiceId) => void;
  setDuelToId: (value: VoiceId) => void;
  setRoundtableText: (value: string) => void;
  setInquiryQuestions: (value: Updater<ScribeInquiryQuestion[]>) => void;
  setInquiryAnswers: (value: Updater<ScribeInquiryAnswer[]>) => void;
  setInquiryDialogue: (value: Updater<DefiningDialogueEntry[]>) => void;
  setInquiryIndex: (value: Updater<number>) => void;
  setCustomInquiryText: (value: string) => void;
  setAlignmentProfile: (value: AlignmentProfile | null) => void;
  setScribeObservationLedger: (value: Updater<ScribeObservationLedger | null>) => void;
  setAlignmentReport: (value: AlignmentReport | null) => void;
  setClarityDraft: (value: string) => void;
  setContractDraft: (value: string) => void;
  setCommitmentDraft: (value: string) => void;
  setBusy: (value: boolean) => void;
  setError: (value: string) => void;
  setCrisis: (value: string) => void;
  setTraceOpen: (value: boolean) => void;
  streamRequest: (options: StreamRequestOptions) => Promise<any>;
  interruptStream: () => void;
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  provider: null,
  stage: "defining",
  rawInput: "",

  definingDialogue: [],
  currentQuestions: [],
  issueProposal: null,
  definingSubStage: "probing",

  taskFrame: null,

  roundtable: emptyRoundtable(),
  roundtableMode: "none",
  selectedVoiceId: "future",
  duelFromId: "money",
  duelToId: "lay",
  roundtableText: "",

  inquiryQuestions: [],
  inquiryAnswers: [],
  inquiryDialogue: [],
  inquiryIndex: 0,
  customInquiryText: "",
  alignmentProfile: null,
  scribeObservationLedger: null,

  alignmentReport: null,
  clarityDraft: "",
  contractDraft: "",
  commitmentDraft: "",

  busy: false,
  error: "",
  crisis: "",

  streamNarration: "",
  streamEvents: [],
  isStreaming: false,
  traceOpen: false,
  streamAbort: null,

  setProvider: (provider) => set({ provider }),
  setStage: (stage) => set({ stage }),
  setRawInput: (rawInput) => set({ rawInput }),
  setDefiningDialogue: (value) => set((s) => ({ definingDialogue: resolveUpdater(value, s.definingDialogue) })),
  setCurrentQuestions: (value) => set((s) => ({ currentQuestions: resolveUpdater(value, s.currentQuestions) })),
  setIssueProposal: (issueProposal) => set({ issueProposal }),
  setDefiningSubStage: (definingSubStage) => set({ definingSubStage }),
  setTaskFrame: (value) => set((s) => ({ taskFrame: resolveUpdater(value, s.taskFrame) })),
  setRoundtable: (value) => set((s) => ({ roundtable: resolveUpdater(value, s.roundtable) })),
  setRoundtableMode: (roundtableMode) => set({ roundtableMode }),
  setSelectedVoiceId: (selectedVoiceId) => set({ selectedVoiceId }),
  setDuelFromId: (duelFromId) => set({ duelFromId }),
  setDuelToId: (duelToId) => set({ duelToId }),
  setRoundtableText: (roundtableText) => set({ roundtableText }),
  setInquiryQuestions: (value) => set((s) => ({ inquiryQuestions: resolveUpdater(value, s.inquiryQuestions) })),
  setInquiryAnswers: (value) => set((s) => ({ inquiryAnswers: resolveUpdater(value, s.inquiryAnswers) })),
  setInquiryDialogue: (value) => set((s) => ({ inquiryDialogue: resolveUpdater(value, s.inquiryDialogue) })),
  setInquiryIndex: (value) => set((s) => ({ inquiryIndex: resolveUpdater(value, s.inquiryIndex) })),
  setCustomInquiryText: (customInquiryText) => set({ customInquiryText }),
  setAlignmentProfile: (alignmentProfile) => set({ alignmentProfile }),
  setScribeObservationLedger: (value) => set((s) => ({ scribeObservationLedger: resolveUpdater(value, s.scribeObservationLedger) })),
  setAlignmentReport: (alignmentReport) => set({ alignmentReport }),
  setClarityDraft: (clarityDraft) => set({ clarityDraft }),
  setContractDraft: (contractDraft) => set({ contractDraft }),
  setCommitmentDraft: (commitmentDraft) => set({ commitmentDraft }),
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error }),
  setCrisis: (crisis) => set({ crisis }),
  setTraceOpen: (traceOpen) => set({ traceOpen }),

  async streamRequest({ path, body, provider, context }) {
    const runtimePayload = toRuntimePayload(provider);

    get().streamAbort?.abort();
    const controller = new AbortController();
    set({
      streamAbort: controller,
      streamEvents: [],
      streamNarration: narrate("common", "booting"),
      isStreaming: true,
    });

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          ...body,
          context: context(),
          ...(runtimePayload ? { provider: runtimePayload } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "请求失败");
        throw new Error(text);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultPayload: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: ScribeStreamEvent;
          try {
            event = JSON.parse(jsonStr);
          } catch (parseError: any) {
            const error = new Error(`书记员这次回传的内容没接稳，请重试一次。`) as Error & {
              code?: string;
              retryable?: boolean;
            };
            error.code = "parse_error";
            error.retryable = true;
            throw error;
          }

          set((s) => ({ streamEvents: [...s.streamEvents, event] }));
          if (event.type === "narration") {
            set({ streamNarration: narrate(event.stage as any, event.key, event.payload) });
          } else if (event.type === "result") {
            resultPayload = event.payload;
          } else if (event.type === "validation_failed") {
            set({ streamNarration: "书记员觉得这一版还不够稳，正在复核。" });
          } else if (event.type === "repair_started") {
            set({ streamNarration: "书记员正在把刚才那版改得更贴近你的原话。" });
          } else if (event.type === "retry_scheduled") {
            set({ streamNarration: "这一句没听清，让书记员再试一次。" });
          } else if (event.type === "fallback_used") {
            set({ streamNarration: "书记员先用保守版本接住这一轮。" });
          } else if (event.type === "error") {
            const error = new Error(event.message) as Error & { code?: string; retryable?: boolean };
            error.code = event.code || "unknown";
            error.retryable = event.retryable;
            throw error;
          }
        }
      }

      if (!resultPayload) throw new Error("流式响应没有返回结果");
      if (resultPayload.crisis) {
        set({ crisis: resultPayload.message || "这件事需要真人支持。" });
        throw new Error("safety-offramp");
      }
      return resultPayload;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        set({ streamNarration: narrate("common", "interrupted") });
        return { _interrupted: true };
      }
      if (error?.message !== "safety-offramp") {
        toast.error(error?.message || "请求失败");
      }
      throw error;
    } finally {
      set({ isStreaming: false, streamAbort: null });
    }
  },

  interruptStream() {
    get().streamAbort?.abort();
    set({
      streamAbort: null,
      isStreaming: false,
      streamNarration: narrate("common", "interrupted"),
    });
  },
}));
