/**
 * Small colour utilities (pure, no RN imports): parsing, mixing, WCAG contrast,
 * and accessible on-accent text colour.
 */

export type RGB = { r: number; g: number; b: number };

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim());
}

/** Normalise to "#RRGGBB" (alpha dropped). Returns null for invalid input. */
export function normalizeHex(hex: string): string | null {
  const m = HEX_RE.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return `#${h.slice(0, 6).toUpperCase()}`;
}

export function hexToRgb(hex: string): RGB {
  const n = normalizeHex(hex) ?? '#000000';
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** "#RRGGBB" + alpha 0..1 -> "rgba(r, g, b, a)". */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Linear mix: amount 0 -> a, 1 -> b. */
export function mix(a: string, b: string, amount: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

export const lighten = (hex: string, amount: number) => mix(hex, '#FFFFFF', amount);
export const darken = (hex: string, amount: number) => mix(hex, '#000000', amount);

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance 0..1. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text colour to place on top of `background` (e.g. a button filled with the accent).
 * Prefers white (iOS convention for tinted buttons) whenever it reaches `minContrast`
 * (3:1 = WCAG AA for large/bold text, use 4.5 for body text); otherwise picks whichever of
 * white / near-black contrasts more.
 */
export function onColor(background: string, minContrast = 3, light = '#FFFFFF', dark = '#0B1622'): string {
  const cl = contrastRatio(background, light);
  const cd = contrastRatio(background, dark);
  if (cl >= minContrast) return light;
  return cd > cl ? dark : light;
}

/**
 * Adjust an accent so it stays legible as text/tint on the given background
 * (darken on light backgrounds, lighten on dark ones) until `minContrast` is met.
 */
export function ensureContrast(fg: string, bg: string, minContrast = 3): string {
  let c = normalizeHex(fg) ?? '#000000';
  const towardsWhite = luminance(bg) < 0.5;
  for (let i = 0; i < 20 && contrastRatio(c, bg) < minContrast; i++) {
    c = towardsWhite ? lighten(c, 0.08) : darken(c, 0.08);
  }
  return c;
}
