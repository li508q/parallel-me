// Motion — spring physics + restrained durations.
// 默认 damping 高于 Material 推荐，保留"纸墨"质感而非"果冻"。

// Spring presets — for Framer Motion / motion / spring()-based libraries.
// Used sparingly. Default to CSS transitions when possible.
export const spring = {
  // 默认纸墨 spring：稳定、克制
  paper: { stiffness: 200, damping: 28, mass: 1 },

  // 五声第一轮：纸卡轻轻"落桌"，不弹跳
  seatLanding: { stiffness: 180, damping: 32, mass: 1 },

  // 阶段切换：横向 8px slide + 透明度交叉
  stageTransition: { stiffness: 240, damping: 30, mass: 0.8 },

  // 承诺：墨痕从中心扩散
  signature: { stiffness: 100, damping: 18, mass: 1.2 },
} as const;

// Duration tokens — CSS transition-duration values.
export const duration = {
  fast:   "150ms",
  base:   "200ms",
  slow:   "300ms",
  ritual: "500ms", // 仅承诺 / 本心落定进入
} as const;

// Easing — single curve covers 99% of transitions.
export const easing = {
  // Apple-ish soft ease for paper-like motion.
  paper: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  // Ink spread for ritual moments.
  ink:   "cubic-bezier(0.16, 0.84, 0.44, 1)",
} as const;
