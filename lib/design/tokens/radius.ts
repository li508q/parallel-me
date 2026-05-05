// Radius — sparse, intentional.
// Mirror in app/globals.css @theme as --radius-*.

export const radius = {
  none: "0px",
  sm:   "2px",  // 标签、细线
  md:   "4px",  // 默认控件、按钮
  lg:   "8px",  // 卡片、纸面
  xl:   "12px", // 大面板、弹层
  full: "9999px",
} as const;

export type RadiusToken = keyof typeof radius;
