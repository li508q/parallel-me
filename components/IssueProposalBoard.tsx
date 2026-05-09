"use client";

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";
import type { IssueProposal } from "@/lib/v7";

export interface IssueProposalBoardProps {
  proposal: IssueProposal;
  onConfirm: () => void;
  onRefine: (feedback: string) => void;
  onUpdate?: (proposal: IssueProposal) => void;
  isLoading?: boolean;
}

type ProposalField =
  | "surface_dilemma"
  | "current_constraints"
  | "core_fears"
  | "expected_resolution";
type EditableField = "issue_sentence" | ProposalField;

const KEY_META: Array<{
  field: ProposalField;
  label: string;
  fallbackTitle: string;
}> = [
  {
    field: "surface_dilemma",
    label: "Key 1 · 具象化的困惑",
    fallbackTitle: "具象化的困惑",
  },
  {
    field: "current_constraints",
    label: "Key 2 · 真实的处境",
    fallbackTitle: "真实的处境",
  },
  {
    field: "core_fears",
    label: "Key 3 · 隐秘的关切",
    fallbackTitle: "隐秘的关切",
  },
  {
    field: "expected_resolution",
    label: "Key 4 · 渴望的终局",
    fallbackTitle: "渴望的终局",
  },
];

export function IssueProposalBoard({
  proposal,
  onConfirm,
  onRefine,
  onUpdate,
  isLoading,
}: IssueProposalBoardProps) {
  const [editing, setEditing] = React.useState<EditableField | null>(null);
  const [draftText, setDraftText] = React.useState("");
  const [refineKind, setRefineKind] = React.useState<"boundary" | null>(null);
  const [feedbackText, setFeedbackText] = React.useState("");

  const issueSentence = proposal.issue_sentence || proposal.surface_dilemma.content;

  function beginEdit(field: EditableField, current: string) {
    if (isLoading) return;
    setEditing(field);
    setDraftText(current);
    setRefineKind(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraftText("");
  }

  function saveEdit() {
    const text = draftText.trim();
    if (!editing || !text) return;
    if (!onUpdate) {
      onRefine(`请把${editing === "issue_sentence" ? "本次议题主句" : keyLabel(editing)}改成：${text}`);
      cancelEdit();
      return;
    }

    if (editing === "issue_sentence") {
      onUpdate({ ...proposal, issue_sentence: text });
    } else {
      onUpdate({
        ...proposal,
        [editing]: {
          ...proposal[editing],
          content: text,
        },
      });
    }
    cancelEdit();
  }

  function submitBoundary() {
    const text = feedbackText.trim();
    if (!text) return;
    onRefine(text);
    setFeedbackText("");
    setRefineKind(null);
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-paper-edge bg-paper-lift">
        <ProposalSection
          title="本次议题"
          content={issueSentence}
          details={[]}
          ariaLabel="本次议题：校对这一句"
          editLabel="校对这一句"
          isEditing={editing === "issue_sentence"}
          draftText={draftText}
          isLoading={isLoading}
          onBeginEdit={() => beginEdit("issue_sentence", issueSentence)}
          onDraftChange={setDraftText}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
        {KEY_META.map((item) => (
          <ProposalSection
            key={item.field}
            title={proposal[item.field].title || item.fallbackTitle}
            content={proposal[item.field].content}
            details={proposal[item.field].details}
            ariaLabel={`${item.label}：校对这段`}
            editLabel="校对这段"
            isEditing={editing === item.field}
            draftText={draftText}
            isLoading={isLoading}
            onBeginEdit={() => beginEdit(item.field, proposal[item.field].content)}
            onDraftChange={setDraftText}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        ))}
      </div>

      {refineKind === "boundary" ? (
        <div className="space-y-3">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="告诉书记员你觉得哪里不准确、想补充什么..."
            rows={3}
            className="w-full resize-none rounded-xl border border-ink-core bg-paper-base px-4 py-3 text-sm leading-relaxed text-ink-core outline-none shadow-sm focus:ring-1 focus:ring-ink-core/20"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={submitBoundary}
              disabled={!feedbackText.trim() || isLoading}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-ink-core px-4 py-2.5 text-sm font-medium text-paper-base transition-opacity disabled:bg-ink-faint disabled:opacity-70"
            >
              提交修改意见
            </button>
            <button
              type="button"
              onClick={() => { setRefineKind(null); setFeedbackText(""); }}
              className="inline-flex items-center justify-center rounded-lg border border-paper-edge bg-paper-base px-5 py-2.5 text-sm text-ink-mute transition-colors hover:border-ink-mute"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <footer className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !!editing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink-core px-4 py-2.5 text-sm font-medium text-paper-base transition-opacity disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            确认，进入五声圆桌 →
          </button>
          <button
            type="button"
            onClick={() => { setRefineKind("boundary"); setEditing(null); setDraftText(""); }}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg border border-paper-edge px-4 py-2.5 text-sm text-ink-body transition-colors hover:border-ink-mute disabled:opacity-50"
          >
            我想补充...
          </button>
        </footer>
      )}
    </section>
  );
}

function ProposalSection({
  title,
  content,
  details,
  ariaLabel,
  editLabel,
  isEditing,
  draftText,
  isLoading,
  onBeginEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  title: string;
  content: string;
  details: string[];
  ariaLabel: string;
  editLabel: string;
  isEditing: boolean;
  draftText: string;
  isLoading?: boolean;
  onBeginEdit: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <article className="relative border-b border-paper-edge last:border-b-0">
      <span
        aria-hidden="true"
        className="absolute right-4 top-5 h-2 w-2 rounded-full bg-safe-green sm:right-5"
      />
      {isEditing ? (
        <div className="px-4 py-4 pr-9 sm:px-5 sm:py-4">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold leading-5 text-ink-mute">
            <span className="text-ink-faint">◇</span>
            <span>{title}</span>
          </div>
          <InlineEditor
            value={draftText}
            rows={4}
            onChange={onDraftChange}
            onSave={onSave}
            onCancel={onCancel}
            disabled={isLoading}
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onBeginEdit}
          disabled={isLoading}
          aria-label={ariaLabel}
          className="group block w-full px-4 py-4 pr-9 text-left transition-colors hover:bg-paper-base/40 focus:outline-none focus-visible:bg-paper-base/60 disabled:cursor-not-allowed sm:px-5 sm:py-4"
        >
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold leading-5 text-ink-mute">
            <span className="text-ink-faint">◇</span>
            <span>{title}</span>
          </div>
          <p className="font-serif text-[15px] leading-7 text-ink-core sm:text-body">
            {content}
          </p>
          {details.length > 0 && (
            <ul className="mt-3 space-y-1 text-[13px] leading-6 text-ink-mute sm:text-body-sm">
              {details.map((detail) => (
                <li key={detail}>· {detail}</li>
              ))}
            </ul>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Pencil className="h-3 w-3" />
            {editLabel}
          </span>
        </button>
      )}
    </article>
  );
}

function InlineEditor({
  value,
  rows,
  autoFocus,
  disabled,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  rows: number;
  autoFocus?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        autoFocus={autoFocus}
        disabled={disabled}
        className="w-full resize-none rounded-lg border border-paper-edge bg-paper-base px-3 py-2 font-serif text-body text-ink-core outline-none focus:border-ink-mute disabled:opacity-50"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim() || disabled}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-core px-3 py-2 text-sm font-medium text-paper-base transition-opacity disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-paper-edge px-3 py-2 text-sm text-ink-mute disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          取消
        </button>
      </div>
    </div>
  );
}

function keyLabel(field: ProposalField) {
  return KEY_META.find((item) => item.field === field)?.label || "这一段";
}
