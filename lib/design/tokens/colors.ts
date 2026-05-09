// Color Tokens — single source of truth.
// Values mirror app/globals.css @theme. Update both when changing.

export const colors = {
  // 纸面 — 78% 占比
  paper: {
    base: "#F4F1EC", // 页面底色，去黄、向 Quiet Luxury 收敛
    lift: "#FBF9F4", // 声音纸面 / 主内容
    sunk: "#EDE2D0", // 次级区域 / 档案层
    edge: "#D8CBB8", // 细线 / 纸边
  },

  // 深色仪式空间 — 仅本心落定 / 承诺 / 情绪峰值
  surface: {
    deep: "#1A1816",
  },

  // 墨 — 文字与主 CTA
  ink: {
    core: "#191713", // 主文字 / 主 CTA
    body: "#3C3932", // 正文
    mute: "#7C7568", // 侧记 / meta
    faint: "#B7AC9B", // disabled / 低存在
  },

  // 声音 — 5% 占比，仅作身份点 / 边框 / 关系线 / 短标签
  // 永远不写正文，永远不做卡片大背景
  seat: {
    rest:      "#556F7A", // 休整席 / 躺平的我
    money:     "#8A6F3D", // 资源席 / 搞钱的我
    roam:      "#3F6B5A", // 自由席 / 出走的我
    filial:    "#8C5042", // 依恋席 / 怕妈担心的我
    future:    "#5E5369", // 远望席 / 5 年后的我
    silent:    "#899199", // 沉默席（低透明）
    exiled:    "#6F3F35", // 被流放席（小面积警示）
  },

  // 状态色 — 3% 占比
  seal:      { action: "#8E3F32" }, // 火漆红 · 承诺 / 重要确认
  attention: { copper: "#A8844D" }, // 老铜金 · 重点提示（禁写小字）
  safe:      { green:  "#536E5A" }, // 已完成 / 低风险
  trace:     { blue:   "#455F70" }, // 证据链 / 可追溯引用
} as const;

export type ColorTokens = typeof colors;

// 给 SVG 内联 / share route / Canvas 等不能走 CSS variable 的场景使用
export const seatColorById: Record<string, string> = {
  lay:    colors.seat.rest,
  money:  colors.seat.money,
  roam:   colors.seat.roam,
  filial: colors.seat.filial,
  future: colors.seat.future,
};
