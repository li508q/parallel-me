// V3 Design Tokens — single TS source of truth.
// CSS variables in app/globals.css @theme mirror these values.
// See docs/design/V3-IVY-FINAL-DIRECTION.md § 1 for locked decisions
// and docs/design/V3-TECH-DIRECTION.md § 8 for architecture.

export { colors, seatColorById } from "./colors";
export type { ColorTokens } from "./colors";

export { fontFamily, typeScale, fontWeight } from "./typography";

export { spacing } from "./spacing";
export type { SpacingToken } from "./spacing";

export { radius } from "./radius";
export type { RadiusToken } from "./radius";

export { spring, duration, easing } from "./motion";

export { elevation } from "./elevation";
