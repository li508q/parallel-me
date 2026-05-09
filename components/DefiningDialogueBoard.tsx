"use client";

/**
 * DefiningDialogueBoard — 对话式追问 UI
 * 书记员通过有来有回的对话，挖掘用户真实想讨论的内容和处境。
 * 选项是书记员基于金字塔原理的「有根据猜测」，降低用户思考成本。
 */

import * as React from "react";
import type { DefiningDialogueEntry, ScribeQuestion, ScribeAnswer } from "@/lib/v7";
import type { ScribeStreamEvent } from "@/lib/agents/events";
import { ScribeStreamDisclosure } from "@/components/ScribeStreamDisclosure";

export interface DefiningDialogueBoardProps {
  /** 完整对话记录 */
  dialogue: DefiningDialogueEntry[];
  /** 当前待回答的问题列表（书记员最新提出的） */
  currentQuestions: ScribeQuestion[];
  /** 是否正在等待书记员响应 */
  isLoading: boolean;
  /** 当前思考状态文案（内联显示，类似 Claude 的 thinking indicator） */
  thinkingText?: string;
  /** 流式事件（用户可展开查看书记员过程输出） */
  streamEvents?: ScribeStreamEvent[];
  /** 用户提交回答 */
  onAnswer: (answers: ScribeAnswer[]) => void;
}

export function DefiningDialogueBoard({
  dialogue,
  currentQuestions,
  isLoading,
  thinkingText,
  streamEvents,
  onAnswer,
}: DefiningDialogueBoardProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [pendingAnswers, setPendingAnswers] = React.useState<Record<string, { optionId?: string; text?: string }>>({});
  const [expandedFreeInput, setExpandedFreeInput] = React.useState<string | null>(null);
  const [showStreamDetail, setShowStreamDetail] = React.useState(true);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dialogue, currentQuestions, isLoading]);

  function handleOptionSelect(questionId: string, optionId: string) {
    setPendingAnswers((prev) => ({ ...prev, [questionId]: { optionId } }));
    setExpandedFreeInput(null);
  }

  function handleFreeTextChange(questionId: string, text: string) {
    setPendingAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], text } }));
  }

  function handleSubmit() {
    const answers: ScribeAnswer[] = currentQuestions
      .filter((q) => pendingAnswers[q.id])
      .map((q) => {
        const optionId = pendingAnswers[q.id]?.optionId;
        const selectedOption = q.options.find((option) => option.id === optionId);
        return {
          question_id: q.id,
          question_text: q.text,
          selected_option_id: optionId,
          selected_option_label: selectedOption?.label,
          free_text: pendingAnswers[q.id]?.text?.trim() || undefined,
          at: Date.now(),
        };
      });
    if (answers.length > 0) {
      onAnswer(answers);
      setPendingAnswers({});
      setExpandedFreeInput(null);
    }
  }

  // Check if all current questions have been answered
  const allAnswered = currentQuestions.length > 0 &&
    currentQuestions.every((q) => {
      const a = pendingAnswers[q.id];
      return a?.optionId || a?.text?.trim();
    });

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable dialogue history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
        <DefiningDialogueHistory dialogue={dialogue} />

        {!isLoading && currentQuestions.length > 0 && streamEvents?.length ? (
          <HistoricalThinking events={streamEvents} />
        ) : null}

        {/* Current questions (awaiting user answer) */}
        {currentQuestions.map((q) => (
          <QuestionBubble
            key={q.id}
            question={q}
            selectedOptionId={pendingAnswers[q.id]?.optionId}
            freeText={pendingAnswers[q.id]?.text || ""}
            isFreeInputExpanded={expandedFreeInput === q.id}
            onOptionSelect={(optionId) => handleOptionSelect(q.id, optionId)}
            onFreeTextChange={(text) => handleFreeTextChange(q.id, text)}
            onExpandFreeInput={() => setExpandedFreeInput(q.id)}
          />
        ))}

        {isLoading && (
          <ScribeStreamDisclosure
            compact
            narration={thinkingText}
            events={streamEvents}
            open={showStreamDetail}
            onOpenChange={setShowStreamDetail}
          />
        )}
      </div>

      {/* Submit button */}
      {currentQuestions.length > 0 && !isLoading && (
        <div className="pt-3 border-t border-stone-100">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: allAnswered ? "#4a3f35" : "#e8e4df",
              color: allAnswered ? "#faf8f5" : "#8c7e6f",
            }}
          >
            {allAnswered ? "继续" : "请回答上面的问题"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

export function DefiningDialogueHistory({
  dialogue,
  thinkingEvents,
  className,
}: {
  dialogue: DefiningDialogueEntry[];
  thinkingEvents?: ScribeStreamEvent[];
  className?: string;
}) {
  if (dialogue.length === 0 && !thinkingEvents?.length) return null;

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      {dialogue.map((entry, i) => (
        <DialogueEntry key={i} entry={entry} dialogue={dialogue} />
      ))}
      {thinkingEvents?.length ? (
        <HistoricalThinking events={thinkingEvents} />
      ) : null}
    </div>
  );
}

function DialogueEntry({ entry, dialogue }: { entry: DefiningDialogueEntry; dialogue: DefiningDialogueEntry[] }) {
  // Only render scribe entries; user answers are inlined after their question
  if (entry.role === "user") return null;

  if (entry.role === "scribe" && entry.question) {
    const q = entry.question;
    // Find the matching user answer in dialogue
    const answerEntry = dialogue.find(
      (e) => e.role === "user" && e.answer?.question_id === q.id
    );
    const answer = answerEntry?.answer;

    // Resolve display text: free_text > option label > option id
    let answerDisplay: string | undefined;
    if (answer) {
      if (answer.free_text) {
        answerDisplay = answer.free_text;
      } else if (answer.selected_option_id) {
        const opt = q.options.find((o) => o.id === answer.selected_option_id);
        answerDisplay = opt?.label || answer.selected_option_id;
      }
    }

    return (
      <div className="flex items-start gap-2">
        <div className="max-w-[85%] space-y-1.5">
          {entry.thinking_events?.length ? (
            <HistoricalThinking events={entry.thinking_events} />
          ) : null}
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3"
            style={{ backgroundColor: "#faf8f5" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#4a3f35" }}>
              {q.text}
            </p>
          </div>
          {/* Inline answer display */}
          {answerDisplay && (
            <div className="pl-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs"
                style={{ backgroundColor: "#4a3f35", color: "#faf8f5" }}
              >
                {answerDisplay}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function HistoricalThinking({ events }: { events: ScribeStreamEvent[] }) {
  const [open, setOpen] = React.useState(false);
  const text = React.useMemo(() => extractThinkingText(events), [events]);
  if (!text) return null;

  return (
    <div className="pl-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-[11px] leading-none text-ink-faint underline-offset-2 transition-colors hover:text-ink-mute hover:underline"
      >
        {open ? "收起思考" : "展示思考"}
      </button>
      {open ? (
        <div className="mt-2 max-h-[180px] max-w-[560px] overflow-y-auto rounded-lg border border-paper-edge bg-paper-lift px-3 py-2 text-xs leading-relaxed text-ink-mute">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      ) : null}
    </div>
  );
}

function extractThinkingText(events: ScribeStreamEvent[]) {
  const deltas: string[] = [];
  for (const event of events) {
    if (event.type === "reasoning_delta") {
      deltas.push(event.text);
    } else if (event.type === "token") {
      deltas.push(event.text);
    }
  }
  return deltas.join("").trim();
}

function QuestionBubble({
  question,
  selectedOptionId,
  freeText,
  isFreeInputExpanded,
  onOptionSelect,
  onFreeTextChange,
  onExpandFreeInput,
}: {
  question: ScribeQuestion;
  selectedOptionId?: string;
  freeText: string;
  isFreeInputExpanded: boolean;
  onOptionSelect: (id: string) => void;
  onFreeTextChange: (text: string) => void;
  onExpandFreeInput: () => void;
}) {
  const customOption = question.options.find(isCustomFreeTextOption);
  return (
    <div className="flex items-start gap-2">
      <div className="max-w-[90%] space-y-2.5">
        {/* Question text */}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{ backgroundColor: "#faf8f5" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#4a3f35" }}>
            {question.text}
          </p>
        </div>

        {/* Option pills */}
        <div className="flex flex-wrap gap-2 pl-1">
          {question.options.map((opt) => {
            const isCustom = opt.id === customOption?.id;
            return (
              <button
                key={opt.id}
                onClick={() => (isCustom ? onExpandFreeInput() : onOptionSelect(opt.id))}
                className="px-3.5 py-1.5 rounded-full text-sm transition-all border"
                style={{
                  backgroundColor: selectedOptionId === opt.id ? "#4a3f35" : "#ffffff",
                  color: selectedOptionId === opt.id ? "#faf8f5" : "#4a3f35",
                  borderColor: selectedOptionId === opt.id ? "#4a3f35" : isCustom ? "#c4bdb4" : "#d4cfc8",
                  borderStyle: isCustom ? "dashed" : "solid",
                }}
              >
                {opt.label}
              </button>
            );
          })}

          {/* "我想自己说" button */}
          {!customOption && !isFreeInputExpanded && (
            <button
              onClick={onExpandFreeInput}
              className="px-3.5 py-1.5 rounded-full text-sm border border-dashed transition-colors"
              style={{ borderColor: "#c4bdb4", color: "#8c7e6f" }}
            >
              我想自己说
            </button>
          )}
        </div>

        {/* Free input (expanded) */}
        {isFreeInputExpanded && (
          <div className="pl-1">
            <textarea
              value={freeText}
              onChange={(e) => onFreeTextChange(e.target.value)}
              placeholder="用你自己的话说..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border resize-none focus:outline-none focus:ring-1"
              style={{
                borderColor: "#d4cfc8",
                backgroundColor: "#ffffff",
                color: "#4a3f35",
              }}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}

function isCustomFreeTextOption(option: { id: string; label: string }): boolean {
  const id = option.id.trim().toLowerCase();
  const label = option.label.trim();
  if (id === "custom" || id === "other" || id === "free_text") return true;
  return /^(都不准|都不对|不准确|我想自己说|我自己说|自己补一句|我自己补一句)/.test(label);
}
