/**
 * Design tokens. Pure module (no React / RN imports) so it can be unit tested.
 *
 * Colours derive from two settings (docs/aniclient-ui-spec.md §1 "Colors", §8 Appearance):
 * - the theme background ("Theme": black, dark gray, navy, maroon, purple, plus Light/System)
 * - the accent ("Color": white, blue, cyan, ... purple)
 * Every surface colour is a tint of the background, so tinted themes (navy, maroon...) stay
 * coherent, and the default black theme reproduces AniClient's measured values exactly.
 */
import type { AccentColor, ThemeBackground } from '@/settings/types';

import { contrastRatio, ensureContrast, mix, normalizeHex, onColor, withAlpha } from './color';

/** A theme background after resolving `system`. */
export type ResolvedBackground = Exclude<ThemeBackground, 'system'>;

export type ColorScheme = 'light' | 'dark';

/** Accent swatches, sampled from AniClient's Color menu. */
export const ACCENT_HEX: Record<AccentColor, string> = {
  white: '#FFFFFF',
  blue: '#7AA7F0',
  cyan: '#5BC8E2',
  green: '#6EDB7E',
  lime: '#A8E23C',
  yellow: '#F2DC5D',
  peach: '#F7B48E',
  orange: '#F59E4C',
  red: '#EF5B5B',
  crimson: '#DC2B4E',
  pink: '#F27BB5',
  purple: '#B48CF2',
};

/** Base colour of each theme background (also used for the Theme menu swatches). */
export const BACKGROUND_HEX: Record<ResolvedBackground, string> = {
  black: '#000000',
  darkGray: '#161618',
  navy: '#0B1622',
  maroon: '#1A0B0E',
  purple: '#140F1F',
  light: '#FFFFFF',
};

export const DEFAULT_ACCENT: AccentColor = 'white';
export const DEFAULT_BACKGROUND: ResolvedBackground = 'black';

/** Combine the Theme setting with the OS colour scheme. */
export function resolveBackground(
  setting: ThemeBackground,
  system: ColorScheme | null | undefined,
): ResolvedBackground {
  if (setting === 'system') return system === 'light' ? 'light' : 'black';
  return setting;
}

export function schemeOf(background: ResolvedBackground): ColorScheme {
  return background === 'light' ? 'light' : 'dark';
}

/**
 * Accent hex as drawn on the given scheme. "White" is AniClient's default and means
 * "maximum contrast", so it becomes black on the light theme.
 */
export function resolveAccentHex(accent: AccentColor | null | undefined, scheme: ColorScheme = 'dark'): string {
  const key = accent && accent in ACCENT_HEX ? accent : DEFAULT_ACCENT;
  if (key === 'white' && scheme === 'light') return '#000000';
  return ACCENT_HEX[key];
}

/** AniList-like colours for list statuses (stats charts, badges). */
export const STATUS_COLORS = {
  CURRENT: '#68D639',
  REPEATING: '#02A9FF',
  COMPLETED: '#9256F3',
  PAUSED: '#F779A4',
  PLANNING: '#F7BF63',
  DROPPED: '#E85D75',
} as const;

/** Media airing/publishing status dot colours: releasing is green, others red (spec §1). */
export const MEDIA_STATUS_COLORS = {
  RELEASING: '#3FB950',
  FINISHED: '#E5383B',
  NOT_YET_RELEASED: '#E5383B',
  CANCELLED: '#E5383B',
  HIATUS: '#E5383B',
} as const;

export type ThemeColors = {
  /** Screen background. */
  background: string;
  /** Grouped (settings) background. */
  groupedBackground: string;
  /** Navigation bar / header / tab bar fill when solid (#111 on black). */
  header: string;
  /** Cards, grouped cells, sheets (#1a1a1a on black). */
  surface: string;
  /**
   * Inset grouped (settings) card fill on `groupedBackground`. Same as `surface` on dark themes;
   * white on the light theme so cards stay visible on #F2F2F7, like native iOS grouped forms.
   */
  groupedSurface: string;
  /** Raised surface on top of `surface` (menus, nested cells, steppers). */
  surfaceElevated: string;
  /** Search field / text input fill (#1c1c1e on black). */
  field: string;
  /** Feed and search result cards (#0f0f0f on black). */
  feedCard: string;
  /** 1px border of feed/result cards (#222 on black). */
  feedCardBorder: string;
  /** Unselected chip fill / border (#151515 / #333 on black). */
  chipFill: string;
  chipBorder: string;
  /** Generic translucent fill (icon buttons, segmented track). */
  fill: string;
  fillSecondary: string;
  text: string;
  /** Gray labels and meta (#9a9a9a-ish). */
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  /** Section headers on media detail (#b0b0b0). */
  textMuted: string;
  /** 1pt inset dividers (#2a2a2a on black). */
  separator: string;
  border: string;
  /** Accent as stored in settings. */
  accentBase: string;
  /** Accent adjusted for contrast on `background` (selected chips, SAVE, FAB, tints). */
  accent: string;
  /** Content colour on a filled `accent` background (black on white accent). */
  onAccent: string;
  /** Translucent accent (pressed states, badges). */
  accentMuted: string;
  /** Score star (#FFD60A). */
  star: string;
  /** "Episode 1181 airs in 2 months" line (amber). */
  airing: string;
  /** Filled favourite heart. */
  favourite: string;
  /** Rank heart pill. */
  rankHeart: string;
  /** Swipe action panels. */
  swipeIncrement: string;
  swipeCustomList: string;
  swipeDelete: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Scrim behind sheets and over banners. */
  overlay: string;
  /** Skeleton / cover placeholder fill. */
  skeleton: string;
  /** Translucent bar fill used when glass can't be drawn but the style asks for glass. */
  barBackground: string;
  /** Text shadow for toasts. */
  shadow: string;
  scoreLow: string;
  scoreMid: string;
  scoreHigh: string;
};

type BackgroundPalette = Omit<ThemeColors, 'accentBase' | 'accent' | 'onAccent' | 'accentMuted'>;

const SHARED = {
  star: '#FFD60A',
  favourite: '#FF3B47',
  rankHeart: '#FF6FAE',
  swipeIncrement: '#3FB950',
  swipeCustomList: '#3B6FF5',
  swipeDelete: '#E5383B',
  scoreLow: '#E85D75',
  scoreMid: '#F79A63',
  scoreHigh: '#68D639',
} as const;

/** Dark palettes are tints of the base: the amounts reproduce the spec values on pure black. */
function darkPalette(base: string): BackgroundPalette {
  const tint = (amount: number) => mix(base, '#FFFFFF', amount);
  return {
    ...SHARED,
    background: base,
    groupedBackground: base,
    header: tint(0.067), // #111111
    surface: tint(0.102), // #1A1A1A
    groupedSurface: tint(0.102),
    surfaceElevated: tint(0.17),
    field: tint(0.11), // #1C1C1C
    feedCard: tint(0.059), // #0F0F0F
    feedCardBorder: tint(0.133), // #222222
    chipFill: tint(0.082), // #151515
    chipBorder: tint(0.2), // #333333
    fill: 'rgba(118, 118, 128, 0.24)',
    fillSecondary: 'rgba(118, 118, 128, 0.16)',
    text: '#FFFFFF',
    textSecondary: '#9A9A9A',
    textTertiary: '#6E6E73',
    textQuaternary: '#48484A',
    textMuted: '#B0B0B0',
    separator: tint(0.165), // #2A2A2A
    border: tint(0.2),
    airing: '#F5B83D',
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#E5383B',
    info: '#0A84FF',
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: tint(0.12),
    barBackground: withAlpha(tint(0.067), 0.86),
    shadow: 'rgba(0, 0, 0, 0.75)',
  };
}

const LIGHT_PALETTE: BackgroundPalette = {
  ...SHARED,
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  header: '#F9F9F9',
  surface: '#F2F2F7',
  groupedSurface: '#FFFFFF',
  surfaceElevated: '#E9E9EE',
  field: '#EEEEF0',
  feedCard: '#FFFFFF',
  feedCardBorder: '#E5E5EA',
  chipFill: '#F2F2F7',
  chipBorder: '#D1D1D6',
  fill: 'rgba(120, 120, 128, 0.12)',
  fillSecondary: 'rgba(120, 120, 128, 0.08)',
  text: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',
  textQuaternary: '#C7C7CC',
  textMuted: '#6C6C70',
  separator: '#E0E0E5',
  border: '#D1D1D6',
  airing: '#C27C0E',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#D70015',
  info: '#007AFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  skeleton: '#E5E5EA',
  barBackground: 'rgba(249, 249, 249, 0.9)',
  shadow: 'rgba(0, 0, 0, 0.25)',
  star: '#E0A800',
};

/** Build the full colour set for a background + accent. */
export function buildColors(background: ResolvedBackground, accent: AccentColor): ThemeColors {
  const scheme = schemeOf(background);
  const base = scheme === 'light' ? LIGHT_PALETTE : darkPalette(BACKGROUND_HEX[background]);
  const accentBase = normalizeHex(resolveAccentHex(accent, scheme)) ?? '#FFFFFF';
  const accentColor = ensureContrast(accentBase, base.background, 3);
  return {
    ...base,
    accentBase,
    accent: accentColor,
    onAccent: onColor(accentColor, 4.5, '#FFFFFF', '#000000'),
    accentMuted: withAlpha(accentBase, scheme === 'light' ? 0.14 : 0.22),
  };
}

// ---------------------------------------------------------------------------
// Spacing, radii, typography
// ---------------------------------------------------------------------------

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  /** Standard horizontal screen gutter. */
  gutter: 16,
} as const;

export const radii = {
  none: 0,
  /** List-row covers. */
  xs: 4,
  /** "•••" button. */
  sm: 6,
  /** Buttons, result cards. */
  md: 8,
  /** Search field, chips. */
  lg: 10,
  /** Cards, menus. */
  xl: 12,
  /** Bottom sheet top. */
  sheet: 18,
  xxl: 28,
  cover: 6,
  pill: 999,
} as const;

/** Rounded geometric sans like AniClient (Nunito, embedded by the expo-font config plugin). */
export const FONT_FAMILY = 'Nunito';

export type FontWeight = '400' | '500' | '600' | '700' | '800';

export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  letterSpacing?: number;
};

/**
 * Text styles. The first group follows the iOS Dynamic Type scale; the second names the
 * AniClient roles from spec §1 "Typography".
 */
export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '700' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '600' },

  /** Centered nav bar title ("Anime List"). */
  navTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  /** Media row title. */
  listTitle: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  /** Media detail title. */
  detailTitle: { fontSize: 27, lineHeight: 32, fontWeight: '800' },
  /** Section header ("Trending Now", "Characters"). */
  sectionHeader: { fontSize: 21, lineHeight: 26, fontWeight: '800' },
  /** Meta lines ("7/12 Episodes"). */
  meta: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  /** Gray info labels. */
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  /** Bold info values. */
  value: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  /** Chip text. */
  chip: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  /** Activity feed text. */
  feed: { fontSize: 17, lineHeight: 23, fontWeight: '500' },
  /** Primary button ("SAVE"). */
  button: { fontSize: 16, lineHeight: 20, fontWeight: '800', letterSpacing: 0.5 },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyVariant = keyof typeof typography;

export const durations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Cover aspect ratio used by AniList (230x345). */
export const COVER_ASPECT_RATIO = 2 / 3;

/** Layout sizes from the spec. */
export const sizes = {
  /** Media list row height. */
  listRow: 95,
  listCoverWidth: 60,
  listCoverHeight: 85,
  /** Circular icon buttons. */
  iconButton: 44,
  /** Outlined "•••" button. */
  moreButton: 30,
  chipHeight: 36,
  searchFieldHeight: 36,
  fab: 56,
  primaryButton: 56,
  /** Explore poster rows. */
  posterWidth: 120,
  /** Settings rows. */
  settingsRow: 44,
} as const;

export type Theme = {
  /** Resolved Theme background. */
  background: ResolvedBackground;
  scheme: ColorScheme;
  /** true for every background except Light. */
  dark: boolean;
  accent: AccentColor;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  sizes: typeof sizes;
  durations: typeof durations;
  fontFamily: string;
};

export function buildTheme(
  background: ResolvedBackground = DEFAULT_BACKGROUND,
  accent: AccentColor = DEFAULT_ACCENT,
): Theme {
  const scheme = schemeOf(background);
  return {
    background,
    scheme,
    dark: scheme === 'dark',
    accent,
    colors: buildColors(background, accent),
    spacing,
    radii,
    typography,
    sizes,
    durations,
    fontFamily: FONT_FAMILY,
  };
}

/** Exposed for tests: contrast of accent fill vs its content. */
export function accentContrast(theme: Theme): number {
  return contrastRatio(theme.colors.accent, theme.colors.onAccent);
}
