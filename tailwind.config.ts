// Tailwind config — token-driven via CSS variables defined in app/globals.css.
// Source of truth lives in lib/design/tokens/*.ts; this file maps token names
// onto Tailwind utility classes through var(--...) references so a single
// :root override (mobile media-query, dark mode if added later) propagates
// without rebuilding.
//
// We are pinned to Tailwind v3.4 with Next.js 14. See
// docs/design/TECH-ARCHITECTURE.md for the current stack boundary.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        "paper-base":  "var(--color-paper-base)",
        "paper-lift":  "var(--color-paper-lift)",
        "paper-sunk":  "var(--color-paper-sunk)",
        "paper-edge":  "var(--color-paper-edge)",

        "surface-deep": "var(--color-surface-deep)",

        "ink-core":  "var(--color-ink-core)",
        "ink-body":  "var(--color-ink-body)",
        "ink-mute":  "var(--color-ink-mute)",
        "ink-faint": "var(--color-ink-faint)",

        "seat-rest":      "var(--color-seat-rest)",
        "seat-money":     "var(--color-seat-money)",
        "seat-roam":      "var(--color-seat-roam)",
        "seat-filial":    "var(--color-seat-filial)",
        "seat-future":    "var(--color-seat-future)",
        "seat-silent":    "var(--color-seat-silent)",
        "seat-exiled":    "var(--color-seat-exiled)",

        "seal-action":      "var(--color-seal-action)",
        "attention-copper": "var(--color-attention-copper)",
        "safe-green":       "var(--color-safe-green)",
        "trace-blue":       "var(--color-trace-blue)",

        // Compatibility aliases for still-live personal pages.
        paper:   "var(--color-paper)",
        ink:     "var(--color-ink)",
        ink2:    "var(--color-ink2)",
        ink3:    "var(--color-ink3)",
        rule:    "var(--color-rule)",
        accent:  "var(--color-accent)",
        gold:    "var(--color-gold)",
        lay:     "var(--color-lay)",
        money:   "var(--color-money)",
        roam:    "var(--color-roam)",
        filial:  "var(--color-filial)",
        future:  "var(--color-future)",
        now:     "var(--color-now)",
      },
      fontFamily: {
        sans:  ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono:  ["var(--font-mono)"],
      },
      fontSize: {
        display:    ["var(--text-display)",    { lineHeight: "var(--text-display--line-height)" }],
        headline:   ["var(--text-headline)",   { lineHeight: "var(--text-headline--line-height)" }],
        title:      ["var(--text-title)",      { lineHeight: "var(--text-title--line-height)" }],
        "title-sm": ["var(--text-title-sm)",   { lineHeight: "var(--text-title-sm--line-height)" }],
        body:       ["var(--text-body)",       { lineHeight: "var(--text-body--line-height)" }],
        "body-long":["var(--text-body-long)",  { lineHeight: "var(--text-body-long--line-height)" }],
        "body-sm":  ["var(--text-body-sm)",    { lineHeight: "var(--text-body-sm--line-height)" }],
        label:      ["var(--text-label)",      { lineHeight: "var(--text-label--line-height)" }],
        verdict:    ["var(--text-verdict)",    { lineHeight: "var(--text-verdict--line-height)" }],
        signature:  ["var(--text-signature)",  { lineHeight: "var(--text-signature--line-height)" }],
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "8px",
        xl: "12px",
      },
      transitionTimingFunction: {
        paper: "var(--ease-paper)",
        ink:   "var(--ease-ink)",
      },
      animation: {
        "ink-in":     "inkIn 900ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "fade-up":    "fadeUp 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "type":       "typeIn 1400ms steps(40, end) both",
        "soft-pulse": "softPulse 2400ms ease-in-out infinite",
      },
      keyframes: {
        inkIn:    { "0%": { opacity: "0", filter: "blur(6px)", transform: "translateY(10px)" }, "100%": { opacity: "1", filter: "blur(0)", transform: "translateY(0)" } },
        fadeUp:   { "0%": { opacity: "0", transform: "translateY(16px)" },                       "100%": { opacity: "1", transform: "translateY(0)" } },
        typeIn:   { "0%": { width: "0" },                                                        "100%": { width: "100%" } },
        softPulse:{ "0%,100%": { opacity: "0.4" },                                               "50%":  { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
