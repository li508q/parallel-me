"use client";

/**
 * IssueProposalBoard — 4-Key 议题提案看板
 * 书记员完成追问后，向用户展示如同诊断书般清晰的结构化看板。
 * 四个维度通过金字塔原理的 MECE 原则呈现。
 */

import * as React from "react";
import type { IssueProposal, ProposalKey } from "@/lib/v7";

export interface IssueProposalBoardProps {
  proposal: IssueProposal;
  /** 用户确认提案 */
  onConfirm: () => void;
  /** 用户想补充 */
  onRefine: (feedback: string) => void;
  /** 是否正在处理中 */
  isLoading?: boolean;
}

const KEY_META: Array<{
  field: keyof IssueProposal;
  icon: string;
  fallbackTitle: string;
}> = [
  { field: "surface_dilemma", icon: "◇", fallbackTitle: "你面临的选择岔路口" },
  { field: "current_constraints", icon: "◇", fallbackTitle: "限制你的客观条件" },
  { field: "core_fears", icon: "◇", fallbackTitle: "你真正害怕的" },
  { field: "expected_resolution", icon: "◇", fallbackTitle: "你想让圆桌帮你验证的" },
];

export function IssueProposalBoard({
  proposal,
  onConfirm,
  onRefine,
  isLoading,
}: IssueProposalBoardProps) {
  const [refineMode, setRefineMode] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState("");

  function handleRefineSubmit() {
    const text = feedbackText.trim();
    if (text) {
      onRefine(text);
      setFeedbackText("");
      setRefineMode(false);
    }
  }

  return (
    <div className="space-y-0">
      {/* 4-Key Cards */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#e8e4df" }}>
        {KEY_META.map(({ field, icon, fallbackTitle }, idx) => {
          const key: ProposalKey = proposal[field];
          return (
            <div
              key={field}
              className={idx < KEY_META.length - 1 ? "border-b" : ""}
              style={{ borderColor: "#e8e4df" }}
            >
              <ProposalKeyCard
                icon={icon}
                proposalKey={key}
                fallbackTitle={fallbackTitle}
              />
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="pt-4 space-y-2">
        {!refineMode ? (
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#4a3f35", color: "#faf8f5" }}
            >
              确认，进入五声圆桌 →
            </button>
            <button
              onClick={() => setRefineMode(true)}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg text-sm border transition-colors disabled:opacity-50"
              style={{ borderColor: "#d4cfc8", color: "#4a3f35" }}
            >
              我想补充…
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="告诉书记员你觉得哪里不准确、想补充什么..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm border resize-none focus:outline-none focus:ring-1"
              style={{ borderColor: "#d4cfc8", color: "#4a3f35" }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleRefineSubmit}
                disabled={!feedbackText.trim() || isLoading}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#4a3f35", color: "#faf8f5" }}
              >
                提交修改意见
              </button>
              <button
                onClick={() => { setRefineMode(false); setFeedbackText(""); }}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "#d4cfc8", color: "#8c7e6f" }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component ───

function ProposalKeyCard({
  icon,
  proposalKey,
  fallbackTitle,
}: {
  icon: string;
  proposalKey: ProposalKey;
  fallbackTitle: string;
}) {
  const confidenceColor = {
    high: "#4a7c59",
    medium: "#b8860b",
    low: "#c45a3f",
  }[proposalKey.confidence];

  return (
    <div className="px-4 py-3.5" style={{ backgroundColor: "#fdfcfb" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs opacity-60">{icon}</span>
            <span className="text-xs font-medium" style={{ color: "#8c7e6f" }}>
              {proposalKey.title || fallbackTitle}
            </span>
          </div>
          {/* Content */}
          <p className="text-sm leading-relaxed" style={{ color: "#4a3f35" }}>
            {proposalKey.content}
          </p>
          {/* Details */}
          {proposalKey.details.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {proposalKey.details.map((d, i) => (
                <li key={i} className="text-xs leading-relaxed" style={{ color: "#6b5e50" }}>
                  · {d}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Confidence dot */}
        <span
          className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: confidenceColor }}
          title={`把握度: ${proposalKey.confidence}`}
        />
      </div>
    </div>
  );
}
