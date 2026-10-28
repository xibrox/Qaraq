/**
 * Pure formatting helpers (no React Native imports, unit-tested with bun test).
 */
import type { DateFormat, MeanScoreStyle, TimeFormat } from '@/settings/types';

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export type ScoreFormat = 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3';

export const SCORE_FORMATS: readonly ScoreFormat[] = [
  'POINT_100',
  'POINT_10_DECIMAL',
  'POINT_10',
  'POINT_5',
  'POINT_3',
];

export const SCORE_FORMAT_LABELS: Record<ScoreFormat, string> = {
  POINT_100: '100 Point (55/100)',
  POINT_10_DECIMAL: '10 Point Decimal (5.5/10)',
  POINT_10: '10 Point (5/10)',
  POINT_5: '5 Star (3/5)',
  POINT_3: '3 Point Smiley :)',
};

export const SCORE_MAX: Record<ScoreFormat, number> = {
  POINT_100: 100,
  POINT_10_DECIMAL: 10,
  POINT_10: 10,
  POINT_5: 5,
  POINT_3: 3,
};

/** Step used by score steppers/sliders. */
export const SCORE_STEP: Record<ScoreFormat, number> = {
  POINT_100: 1,
  POINT_10_DECIMAL: 0.5,
  POINT_10: 1,
  POINT_5: 1,
  POINT_3: 1,
};

export type SmileyStyle = 'text' | 'emoji';

const SMILEYS: Record<SmileyStyle, [string, string, string]> = {
  text: [':(', ':|', ':)'],
  emoji: ['\u{1F641}', '\u{1F610}', '\u{1F642}'],
};

export type FormatScoreOptions = {
  /** Text for an unscored (0/null) entry. Default ''. */
  empty?: string;
  /** Append "/max" (ignored for POINT_3 and POINT_5 stars). */
  showMax?: boolean;
  /** POINT_5 output: `number` = "4", `stars` = "★★★★☆". Default 'stars'. */
  starStyle?: 'number' | 'stars';
  smileys?: SmileyStyle;
};

/**
 * Format a score that is already expressed in `format` (as AniList returns it when you
 * request `score(format: X)` or with the user's own scoreFormat).
 */
export function formatScore(
  score: number | null | undefined,
  format: ScoreFormat,
  opts: FormatScoreOptions = {},
): string {
  const { empty = '', showMax = false, starStyle = 'stars', smileys = 'text' } = opts;
  if (score == null || !Number.isFinite(score) || score <= 0) return empty;
  switch (format) {
    case 'POINT_3': {
      const i = Math.min(3, Math.max(1, Math.round(score))) - 1;
      return SMILEYS[smileys][i];
    }
    case 'POINT_5': {
      const n = Math.min(5, Math.max(0, Math.round(score)));
      if (starStyle === 'stars') return '★'.repeat(n) + '☆'.repeat(5 - n);
      return showMax ? `${n}/5` : String(n);
    }
    case 'POINT_10_DECIMAL': {
      const v = (Math.round(score * 10) / 10).toFixed(1);
      return showMax ? `${v}/10` : v;
    }
    case 'POINT_10': {
      const v = String(Math.round(score));
      return showMax ? `${v}/10` : v;
    }
    case 'POINT_100':
    default: {
      const v = String(Math.round(score));
      return showMax ? `${v}/100` : v;
    }
  }
}

/** Convert a 0-100 score to another format, using AniList's rounding rules. */
export function scoreFromPoint100(score100: number | null | undefined, format: ScoreFormat): number {
  if (score100 == null || score100 <= 0) return 0;
  const s = Math.min(100, score100);
  switch (format) {
    case 'POINT_100':
      return Math.round(s);
    case 'POINT_10_DECIMAL':
      return Math.round(s) / 10;
    case 'POINT_10':
      return Math.round(s / 10);
    case 'POINT_5':
      return Math.round(s / 20);
    case 'POINT_3':
      return s >= 61 ? 3 : s >= 36 ? 2 : 1;
  }
}

/** Convert a score in `format` to the 0-100 scale. */
export function scoreToPoint100(score: number | null | undefined, format: ScoreFormat): number {
  if (score == null || score <= 0) return 0;
  switch (format) {
    case 'POINT_100':
      return Math.round(score);
    case 'POINT_10_DECIMAL':
    case 'POINT_10':
      return Math.round(score * 10);
    case 'POINT_5':
      return Math.round(score * 20);
    case 'POINT_3':
      return score >= 3 ? 85 : score >= 2 ? 60 : 35;
  }
}

/** AniList media averageScore/meanScore (0-100) as "78%" or "7.8". */
export function formatMeanScore(score: number | null | undefined, style: MeanScoreStyle = 'percent'): string {
  if (score == null || score <= 0) return '';
  return style === 'percent' ? `${Math.round(score)}%` : (Math.round(score) / 10).toFixed(1);
}

/** Bucket for colouring a 0-100 score: AniList uses red <= 50... green >= 75. */
export function scoreTier(score100: number | null | undefined): 'none' | 'low' | 'mid' | 'high' {
  if (score100 == null || score100 <= 0) return 'none';
  if (score100 < 50) return 'low';
  if (score100 < 75) return 'mid';
  return 'high';
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** 1234567 -> "1,234,567". */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  const [int, frac] = Math.abs(n).toString().split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + grouped + (frac ? `.${frac}` : '');
}

/** 1234 -> "1.2K", 1500000 -> "1.5M", 999 -> "999". */
export function formatCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const units: [number, string][] = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [v, u] of units) {
    if (abs >= v) {
      const x = abs / v;
      const str = x >= 100 ? Math.floor(x).toString() : (Math.floor(x * 10) / 10).toString();
      return `${sign}${str}${u}`;
    }
  }
  return `${sign}${Math.round(abs)}`;
}

export function formatPercent(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return '0%';
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Minutes -> "1d 2h 5m" (largest 2 units by default). */
export function formatMinutes(totalMinutes: number | null | undefined, maxUnits = 2): string {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  let m = Math.round(totalMinutes);
  const d = Math.floor(m / 1440);
  m -= d * 1440;
  const h = Math.floor(m / 60);
  m -= h * 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.slice(0, maxUnits).join(' ');
}

/** Minutes -> days with one decimal, as on AniList stats ("12.3"). */
export function minutesToDays(minutes: number | null | undefined): string {
  return ((minutes ?? 0) / 1440).toFixed(1);
}

/** Episode duration: 24 -> "24 mins", 90 -> "1 hour, 30 mins". */
export function formatEpisodeDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hs = h ? `${h} hour${h === 1 ? '' : 's'}` : '';
  const ms = m ? `${m} min${m === 1 ? '' : 's'}` : '';
  return [hs, ms].filter(Boolean).join(', ');
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export type FuzzyDate = {
  year?: number | null;
  month?: number | null;
  day?: number | null;
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function isFuzzyDateEmpty(d: FuzzyDate | null | undefined): boolean {
  return !d || (!d.year && !d.month && !d.day);
}

export type FuzzyDateStyle = 'short' | 'medium' | 'long' | 'numeric';

/** Resolve the `system` date format from a locale (default: device locale via Intl). */
export function resolveDateFormat(format: DateFormat, locale?: string): Exclude<DateFormat, 'system'> {
  if (format !== 'system') return format;
  let loc = locale;
  if (!loc) {
    try {
      loc = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
      loc = 'en-US';
    }
  }
  const l = loc.toLowerCase();
  const lang = l.split(/[-_]/)[0];
  if (['zh', 'ja', 'ko', 'hu', 'lt', 'mn', 'sv'].includes(lang) || l === 'fr-ca') return 'YMD';
  if (l === 'en' || l.startsWith('en-us') || l === 'en-ph' || l === 'en-ca') return 'MDY';
  return 'DMY';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * FuzzyDate -> string. Missing parts are dropped gracefully:
 * {2024, 4, 5} medium MDY -> "Apr 5, 2024"; {2024, 4} -> "Apr 2024"; {2024} -> "2024";
 * {month: 4, day: 5} -> "Apr 5". numeric -> "04/05/2024" (order from `order`).
 */
export function formatFuzzyDate(
  d: FuzzyDate | null | undefined,
  style: FuzzyDateStyle = 'medium',
  order: DateFormat = 'MDY',
  empty = '',
): string {
  if (isFuzzyDateEmpty(d)) return empty;
  const { year, month, day } = d!;
  const o = resolveDateFormat(order);

  if (style === 'numeric') {
    const parts: Record<'Y' | 'M' | 'D', string | undefined> = {
      Y: year ? String(year) : undefined,
      M: month ? pad2(month) : undefined,
      D: day && month ? pad2(day) : undefined,
    };
    const seq = o === 'YMD' ? ['Y', 'M', 'D'] : o === 'DMY' ? ['D', 'M', 'Y'] : ['M', 'D', 'Y'];
    const sep = o === 'YMD' ? '-' : '/';
    return seq
      .map((k) => parts[k as 'Y' | 'M' | 'D'])
      .filter(Boolean)
      .join(sep);
  }

  const monthName =
    month && month >= 1 && month <= 12
      ? (style === 'long' ? MONTHS_LONG : MONTHS_SHORT)[month - 1]
      : undefined;

  if (style === 'short' && !monthName) return year ? String(year) : empty;

  if (!monthName) return year ? String(year) : empty;
  if (!day) return year ? `${monthName} ${year}` : monthName;

  if (o === 'DMY') return year ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
  if (o === 'YMD') return year ? `${year} ${monthName} ${day}` : `${monthName} ${day}`;
  return year ? `${monthName} ${day}, ${year}` : `${monthName} ${day}`;
}

/** FuzzyDate -> JS Date (missing month/day default to 1), or null without a year. */
export function fuzzyDateToDate(d: FuzzyDate | null | undefined): Date | null {
  if (!d?.year) return null;
  return new Date(d.year, (d.month ?? 1) - 1, d.day ?? 1);
}

/** JS Date -> FuzzyDate (for UpdateMediaListEntry startedAt/completedAt). */
export function dateToFuzzyDate(date: Date): Required<{ [K in keyof FuzzyDate]: number }> {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/** Comparable integer (YYYYMMDD) for sorting; empty dates sort as 0. */
export function fuzzyDateToInt(d: FuzzyDate | null | undefined): number {
  if (!d?.year) return 0;
  return d.year * 10000 + (d.month ?? 0) * 100 + (d.day ?? 0);
}

/** "WINTER" 2025 -> "Winter 2025". */
export function formatSeason(season: string | null | undefined, year?: number | null): string {
  if (!season) return year ? String(year) : '';
  const s = season.charAt(0) + season.slice(1).toLowerCase();
  return year ? `${s} ${year}` : s;
}

/** Current AniList season for a date (Dec counts toward next year's Winter). */
export function seasonForDate(date: Date = new Date()): { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number } {
  const m = date.getMonth(); // 0-11
  const y = date.getFullYear();
  if (m === 11) return { season: 'WINTER', year: y + 1 };
  if (m <= 1) return { season: 'WINTER', year: y };
  if (m <= 4) return { season: 'SPRING', year: y };
  if (m <= 7) return { season: 'SUMMER', year: y };
  return { season: 'FALL', year: y };
}

/** Next season after the given one. */
export function nextSeason(s: { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number }) {
  const order = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;
  const i = order.indexOf(s.season);
  return i === 3 ? { season: order[0], year: s.year + 1 } : { season: order[i + 1], year: s.year };
}

/** Enum-ish strings: "TV_SHORT" -> "TV Short", "ONE_SHOT" -> "One Shot", "OVA" stays. */
export function formatEnum(value: string | null | undefined): string {
  if (!value) return '';
  const KEEP = new Set(['TV', 'OVA', 'ONA', 'TV_SHORT']);
  if (value === 'TV_SHORT') return 'TV Short';
  if (KEEP.has(value)) return value;
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

// ---------------------------------------------------------------------------
// Relative time & countdowns. All timestamps are UNIX seconds (AniList style).
// ---------------------------------------------------------------------------

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export type RelativeStyle = 'short' | 'long';

/**
 * Time since `unixSeconds`: short -> "now", "5m", "3h", "2d", "3w", "4mo", "1y";
 * long -> "just now", "5 minutes ago", "1 hour ago"... Future times are clamped to now.
 */
export function formatRelativeTime(
  unixSeconds: number,
  now: number = nowSeconds(),
  style: RelativeStyle = 'long',
): string {
  const diff = Math.max(0, now - unixSeconds);
  const table: [number, string, string][] = [
    [31536000, 'y', 'year'],
    [2592000, 'mo', 'month'],
    [604800, 'w', 'week'],
    [86400, 'd', 'day'],
    [3600, 'h', 'hour'],
    [60, 'm', 'minute'],
  ];
  for (const [secs, short, long] of table) {
    if (diff >= secs) {
      const n = Math.floor(diff / secs);
      return style === 'short' ? `${n}${short}` : `${n} ${long}${n === 1 ? '' : 's'} ago`;
    }
  }
  return style === 'short' ? 'now' : 'just now';
}

/**
 * Relative time in AniClient's wording (moment.js "fromNow" thresholds):
 * "a few seconds ago", "a minute ago", "5 minutes ago", "an hour ago", "2 hours ago",
 * "a day ago", "3 days ago", "a month ago", "2 months ago", "a year ago", "4 years ago".
 */
export function formatTimeAgo(unixSeconds: number, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.round(nowMs / 1000 - unixSeconds));
  const m = Math.round(s / 60);
  const h = Math.round(s / 3600);
  const d = Math.round(s / 86400);
  const months = Math.round(s / (86400 * 30.4375));
  const y = Math.round(s / (86400 * 365.25));
  if (s < 45) return 'a few seconds ago';
  if (s < 90) return 'a minute ago';
  if (m < 45) return `${m} minutes ago`;
  if (m < 90) return 'an hour ago';
  if (h < 22) return `${h} hours ago`;
  if (h < 36) return 'a day ago';
  if (d < 26) return `${d} days ago`;
  if (d < 45) return 'a month ago';
  if (d < 320) return `${Math.max(2, months)} months ago`;
  if (d < 548) return 'a year ago';
  return `${Math.max(2, y)} years ago`;
}

/**
 * Countdown to `airingAt`: "2d 4h", "4h 12m", "12m", "<1m"; returns `aired` once past.
 * `maxUnits` limits the number of units shown.
 */
export function formatCountdown(
  airingAt: number,
  now: number = nowSeconds(),
  maxUnits = 2,
  aired = 'Aired',
): string {
  const diff = airingAt - now;
  if (diff <= 0) return aired;
  return formatDurationSeconds(diff, maxUnits);
}

/** Seconds -> "1d 2h", "3h 5m", "5m", "<1m". */
export function formatDurationSeconds(seconds: number, maxUnits = 2): string {
  if (seconds < 60) return '<1m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.slice(0, maxUnits).join(' ');
}

/** "Ep 5 airing in 2d 4h" / "Ep 5 aired". */
export function formatAiringLine(episode: number, airingAt: number, now: number = nowSeconds()): string {
  const diff = airingAt - now;
  if (diff <= 0) return `Ep ${episode} aired`;
  return `Ep ${episode} in ${formatDurationSeconds(diff)}`;
}

/** Clock time for a unix timestamp in the device time zone: "18:30" / "6:30 PM". */
export function formatClock(unixSeconds: number, format: TimeFormat = 'system', locale?: string): string {
  const date = new Date(unixSeconds * 1000);
  const h = date.getHours();
  const m = pad2(date.getMinutes());
  let use12 = format === '12h';
  if (format === 'system') {
    try {
      const opts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
      use12 = opts.hour12 === true || opts.hourCycle === 'h12' || opts.hourCycle === 'h11';
    } catch {
      use12 = false;
    }
  }
  if (!use12) return `${pad2(h)}:${m}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Unix seconds -> "Apr 5, 2024" using the same rules as FuzzyDate. */
export function formatUnixDate(
  unixSeconds: number,
  style: FuzzyDateStyle = 'medium',
  order: DateFormat = 'MDY',
): string {
  const d = new Date(unixSeconds * 1000);
  return formatFuzzyDate({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }, style, order);
}

/** Progress label: "5 / 12", "5 / ?" when total unknown. */
export function formatProgress(progress: number | null | undefined, total: number | null | undefined): string {
  return `${progress ?? 0} / ${total && total > 0 ? total : '?'}`;
}
