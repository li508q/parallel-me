// Elevation — restrained shadows, no glass-on-glass.
// See docs/design/PRODUCT-DESIGN.md § 2.3 — Liquid Glass refraction 拒绝。

export const elevation = {
  // 无阴影 — 大多数情况
  none: "none",

  // 纸面轻 lift — 默认 hover
  rest: "0 1px 0 rgba(25, 23, 19, 0.04), 0 2px 6px rgba(25, 23, 19, 0.04)",

  // 浮起卡片 — 当前发言席 / 弹层
  raised: "0 2px 4px rgba(25, 23, 19, 0.06), 0 8px 24px -8px rgba(25, 23, 19, 0.10)",

  // 仪式弹层 — 承诺、清明落定
  ritual: "0 8px 16px rgba(25, 23, 19, 0.12), 0 24px 48px -16px rgba(25, 23, 19, 0.18)",
} as const;
