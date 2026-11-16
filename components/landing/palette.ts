import type { CSSProperties } from "react";

/**
 * The ONE palette for the Reality Food site. Every color on the landing page
 * (text, buttons, glows, animations) comes from here, so switching palettes is
 * a change to this object only. Matches docs/brand/BRAND.md.
 */
export const PALETTE = {
  ink: "#191A1F", // charcoal: dark sections, main text
  panel: "#26272E", // cards on dark sections
  paper: "#E7E7E7", // ivory: light sections
  card: "#F4F4F5", // cards on light sections
  line: "#D2D2D6", // borders on light sections
  muted: "#55565C", // secondary text on light (5.9:1 on ivory)
  accent: "#FBB71A", // golden yellow: buttons, highlights on dark
  accentSoft: "#FFE3A3", // lighter gold for shimmer and glows
  accentText: "#8A5A00", // dark gold for text/icons on light (4.8:1 on ivory)
} as const;

/** CSS variables for the landing root; components use bg-(--rf-ink) etc. */
export const paletteVars = {
  "--rf-ink": PALETTE.ink,
  "--rf-panel": PALETTE.panel,
  "--rf-paper": PALETTE.paper,
  "--rf-card": PALETTE.card,
  "--rf-line": PALETTE.line,
  "--rf-muted": PALETTE.muted,
  "--rf-accent": PALETTE.accent,
  "--rf-accent-soft": PALETTE.accentSoft,
  "--rf-accent-text": PALETTE.accentText,
} as CSSProperties;
