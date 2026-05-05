// Typography Tokens — Productive sans / Expressive serif / Mono evidence.
// Hard rule: CJK letter-spacing = 0; no fluid clamp() in product UI.

// Font family stacks. Geist is loaded via next/font in app/layout.tsx and exposed
// as the CSS variable --font-geist / --font-geist-mono.
export const fontFamily = {
  sans: [
    "var(--font-geist, Geist)",
    "PingFang SC",
    "Noto Sans SC",
    "HarmonyOS Sans",
    "system-ui",
    "-apple-system",
    "sans-serif",
  ].join(", "),

  serif: [
    "Source Han Serif SC",
    "Noto Serif SC",
    "Songti SC",
    "ui-serif",
    "Georgia",
    "serif",
  ].join(", "),

  mono: [
    "var(--font-geist-mono, Geist Mono)",
    "IBM Plex Mono",
    "SF Mono",
    "ui-monospace",
    "monospace",
  ].join(", "),
} as const;

// Type scale — discrete breakpoints (no clamp()).
// Each token is { desktop: { size, line }, mobile: { size, line }, font }.
type TypeStep = {
  desktop: { size: string; line: string };
  mobile: { size: string; line: string };
  font: "sans" | "serif" | "mono";
  italic?: boolean;
};

export const typeScale: Record<string, TypeStep> = {
  display: {
    desktop: { size: "44px", line: "52px" },
    mobile:  { size: "36px", line: "44px" },
    font: "sans",
  },
  headline: {
    desktop: { size: "30px", line: "38px" },
    mobile:  { size: "26px", line: "32px" },
    font: "sans",
  },
  title: {
    desktop: { size: "22px", line: "30px" },
    mobile:  { size: "20px", line: "28px" },
    font: "sans",
  },
  "title-sm": {
    desktop: { size: "18px", line: "26px" },
    mobile:  { size: "17px", line: "24px" },
    font: "sans",
  },
  body: {
    desktop: { size: "16px", line: "26px" },
    mobile:  { size: "15px", line: "24px" },
    font: "sans",
  },
  "body-long": {
    desktop: { size: "16px", line: "28px" },
    mobile:  { size: "15px", line: "26px" },
    font: "sans",
  },
  "body-sm": {
    desktop: { size: "14px", line: "22px" },
    mobile:  { size: "13px", line: "20px" },
    font: "sans",
  },
  label: {
    desktop: { size: "12px", line: "16px" },
    mobile:  { size: "12px", line: "16px" },
    font: "sans",
  },

  // Ritual-only — Serif. Never use for buttons / forms / nav.
  verdict: {
    desktop: { size: "24px", line: "36px" },
    mobile:  { size: "22px", line: "32px" },
    font: "serif",
  },
  signature: {
    desktop: { size: "20px", line: "32px" },
    mobile:  { size: "18px", line: "28px" },
    font: "serif",
    italic: true,
  },
};

// Body weight tuning — 450 (not 400) is more legible on high-DPR Chinese.
export const fontWeight = {
  body: 450,
  emphasis: 600,
  display: 700,
} as const;
