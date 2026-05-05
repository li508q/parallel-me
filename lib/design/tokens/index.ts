// Design Tokens — single TS source of truth.
// CSS variables in app/globals.css @theme mirror these values.
// Product direction lives in docs/design/V0.7-UPGRADE-PLAN.md.

export { colors, seatColorById } from "./colors";
export type { ColorTokens } from "./colors";

export { fontFamily, typeScale, fontWeight } from "./typography";

export { spacing } from "./spacing";
export type { SpacingToken } from "./spacing";

export { radius } from "./radius";
export type { RadiusToken } from "./radius";

export { spring, duration, easing } from "./motion";

export { elevation } from "./elevation";
