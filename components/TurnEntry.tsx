// V3 Week 5 · TurnEntry — single line on the meeting timeline.
// Kinds:
//   case          · 立案 paper inside timeline
//   seat          · 席位发言（带左色边 + 时间戳 + 名字 + 正文）
//   followup      · 席位被点名后的回答（同 seat 但有 "被点名" badge）
//   user          · 用户的话（右对齐 italic 引号）
//   scribe        · 书记中性侧记（居中 横线 灰小字）
//   cross-question· 交叉质询的发问（⚔ A → B + 大字引号）
//   cross-response· 被质询席的回应（小卡 dim）
//   user-mark     · 用户判定（居中小字 "主持人判定：问中了"）
//   verdict       · 此刻的我裁决（surface-deep ritual block）

import * as React from "react";
import type { SelfId } from "@/lib/selves";

export type TurnKind =
  | "case"
  | "seat"
  | "followup"
  | "user"
  | "scribe"
  | "cross-question"
  | "cross-response"
  | "user-mark"
  | "verdict";

export interface TurnEntryProps {
  kind: TurnKind;
  /** Speaker for seat / followup / cross-* turns */
  seatId?: SelfId;
  /** Display name. Falls back to seatId via SELVES if omitted. */
  speakerName?: string;
  /** Cross-question secondary speaker (the one being asked). */
  toSpeakerName?: string;
  /** Body text. */
  text?: string;
  /** Top-right meta (timestamp, etc). */
  meta?: string;
  /** Right-side badge ("最响", "被点名"). */
  badge?: string;
  /** Insight or marginalia to render under verdict. */
  marginalia?: string;
  /** Optional click for entries that are interactive. */
  onClick?: () => void;
}

const SEAT_COLOR_VAR: Record<SelfId, string> = {
  lay:    "color-seat-rest",
  money:  "color-seat-money",
  roam:   "color-seat-roam",
  filial: "color-seat-filial",
  future: "color-seat-future",
};

export function TurnEntry(props: TurnEntryProps) {
  const { kind } = props;

  if (kind === "scribe") {
    return (
      <div className="flex items-center gap-3 my-5 text-ink-faint">
        <span className="flex-1 h-px bg-paper-edge" />
        <span className="font-serif italic text-body-sm text-ink-mute leading-snug">
          {props.text}
        </span>
        <span className="flex-1 h-px bg-paper-edge" />
      </div>
    );
  }

  if (kind === "user-mark") {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
          {props.text}
        </span>
      </div>
    );
  }

  if (kind === "user") {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[88%] sm:max-w-[80%] text-right">
          <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-1">
            {props.speakerName ?? "主持人"} {props.meta && `· ${props.meta}`}
          </div>
          <p className="font-serif italic text-body-long text-ink-body leading-relaxed">
            「{props.text}」
          </p>
        </div>
      </div>
    );
  }

  if (kind === "case") {
    return (
      <article className="bg-paper-lift border border-paper-edge rounded-md px-5 py-4 mb-6">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
          本次议题
        </div>
        <p className="font-serif text-title text-ink-core leading-snug">
          {props.text}
        </p>
      </article>
    );
  }

  if (kind === "verdict") {
    return (
      <article className="my-6 rounded-md overflow-hidden bg-surface-deep text-paper-lift shadow-[0_8px_16px_rgba(25,23,19,0.12),0_24px_48px_-16px_rgba(25,23,19,0.18)]">
        <div className="px-5 sm:px-7 pt-5 pb-2 border-b border-paper-lift/10">
          <div className="text-[10px] tracking-[0.18em] text-paper-lift/50 uppercase">
            此刻的我
          </div>
        </div>
        <div className="px-5 sm:px-7 py-5">
          <p className="font-serif text-verdict text-paper-lift leading-relaxed whitespace-pre-line">
            {props.text}
          </p>
        </div>
        {props.marginalia && (
          <div className="px-5 sm:px-7 py-3 border-t border-paper-lift/10 text-body-sm text-paper-lift/60 italic font-serif leading-snug">
            {props.marginalia}
          </div>
        )}
      </article>
    );
  }

  if (kind === "cross-question") {
    return (
      <article className="my-5">
        <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2 flex items-center gap-2">
          <span className="text-attention-copper">⚔</span>
          <span>
            {props.speakerName} 质询 {props.toSpeakerName}
          </span>
          {props.meta && <span className="text-ink-faint">· {props.meta}</span>}
        </div>
        <blockquote className="border-l-3 border-attention-copper pl-5 py-1">
          <p className="font-serif text-title text-ink-core leading-relaxed">
            「{props.text}」
          </p>
        </blockquote>
      </article>
    );
  }

  // seat / followup / cross-response — all share the seat-turn shape, vary by badge & opacity
  const accent = props.seatId ? `var(--${SEAT_COLOR_VAR[props.seatId]})` : "var(--color-paper-edge)";
  const dim = kind === "cross-response";
  const inferredBadge =
    props.badge ??
    (kind === "followup" ? "被点名" : kind === "cross-response" ? "回应" : undefined);

  return (
    <article
      className={`mb-5 ${dim ? "opacity-90" : ""}`}
      style={{ paddingLeft: "16px", borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: accent }}
          />
          <span className="font-medium text-ink-core truncate">
            {props.speakerName}
          </span>
          {inferredBadge && (
            <span className="text-[10px] tracking-wider text-ink-faint uppercase">
              {inferredBadge}
            </span>
          )}
        </div>
        {props.meta && (
          <span className="text-xs text-ink-faint flex-shrink-0">{props.meta}</span>
        )}
      </div>
      <p className="text-body text-ink-body leading-relaxed whitespace-pre-line">
        {props.text}
      </p>
    </article>
  );
}
