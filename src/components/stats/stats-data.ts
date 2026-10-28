/**
 * Pure helpers for the profile Stats tab: metric selection, number formatting and the
 * activity-history heatmap grid. Kept free of React so they're easy to test.
 */
import type { MediaType, ScoreFormat, UserActivityHistoryEntry } from '@/api/types';
import { formatMinutes, formatPercent } from '@/lib/format';

/** What a stat card measures. `time` is minutes watched (anime) or chapters read (manga). */
export type StatMetric = 'count' | 'meanScore' | 'time';

export type StatEntry = {
  count: number;
  meanScore: number;
  minutesWatched: number;
  chaptersRead: number;
};

export function metricValue(entry: StatEntry, metric: StatMetric, type: MediaType): number {
  switch (metric) {
    case 'count':
      return entry.count;
    case 'meanScore':
      return entry.meanScore;
    case 'time':
      return type === 'ANIME' ? entry.minutesWatched : entry.chaptersRead;
  }
}

export function metricLabel(metric: StatMetric, type: MediaType): string {
  switch (metric) {
    case 'count':
      return 'Count';
    case 'meanScore':
      return 'Mean Score';
    case 'time':
      return type === 'ANIME' ? 'Time Watched' : 'Chapters Read';
  }
}

/** AniClient groups thousands with spaces: 3974 -> "3 974". */
export function formatSpaced(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '0';
  const fixed = Math.abs(n).toFixed(digits);
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '-' : '') + grouped + (frac ? `.${frac}` : '');
}

/**
 * AniList statistics report `meanScore` / `standardDeviation` on the 100-point scale whatever the
 * user's format; this is the divisor that brings them into it (86.5 -> 8.7 for POINT_10).
 */
export function meanScoreDivisor(format: ScoreFormat | null | undefined): number {
  switch (format) {
    case 'POINT_10':
    case 'POINT_10_DECIMAL':
      return 10;
    case 'POINT_5':
      return 20;
    default:
      return 1;
  }
}

/** A mean score (100-point, as AniList reports it) in the user's format, 1 decimal. */
export function formatMean(score: number | null | undefined, format?: ScoreFormat | null): string {
  if (!score) return '-';
  return (score / meanScoreDivisor(format)).toFixed(1);
}

export function formatMetric(value: number, metric: StatMetric, type: MediaType, format?: ScoreFormat | null): string {
  switch (metric) {
    case 'count':
      return formatSpaced(value);
    case 'meanScore':
      return formatMean(value, format);
    case 'time':
      return type === 'ANIME' ? formatMinutes(value, 2) : `${formatSpaced(value)} ch`;
  }
}

/** Percentage label that never rounds a non-zero share down to "0%". */
export function shareLabel(fraction: number): string {
  if (fraction > 0 && fraction < 0.005) return '<1%';
  return formatPercent(fraction);
}

/** One-line detail for a stat row: "12 titles · 7.4 mean · 3d 4h". */
export function describeEntry(entry: StatEntry, type: MediaType, format?: ScoreFormat | null): string {
  const parts = [`${formatSpaced(entry.count)} ${entry.count === 1 ? 'title' : 'titles'}`];
  if (entry.meanScore) parts.push(`${formatMean(entry.meanScore, format)} mean`);
  const time = type === 'ANIME' ? entry.minutesWatched : entry.chaptersRead;
  if (time) parts.push(type === 'ANIME' ? formatMinutes(time, 2) : `${formatSpaced(time)} chapters`);
  return parts.join(' · ');
}

export function sortByMetric<T extends StatEntry>(items: readonly T[], metric: StatMetric, type: MediaType): T[] {
  return [...items].sort((a, b) => metricValue(b, metric, type) - metricValue(a, metric, type));
}

/** Highest score of each format on its own scale. */
const FORMAT_MAX: Partial<Record<ScoreFormat, number>> = { POINT_10_DECIMAL: 10, POINT_10: 10, POINT_5: 5, POINT_3: 3 };

/**
 * Whether a set of AniList score buckets is on the 100-point scale. AniList reports
 * POINT_10_DECIMAL buckets as 10, 20, 45 ... 100, so a single bucket above the format's own
 * maximum means the whole set is 100-point (and bucket 10 is "1", not "10").
 */
export function scoresAreHundredScale(
  scores: readonly (number | null | undefined)[],
  format: ScoreFormat | null | undefined,
): boolean {
  const max = format ? FORMAT_MAX[format] : undefined;
  if (max == null) return false;
  return scores.some((s) => s != null && s > max);
}

/**
 * Score bucket label in the user's scoring system. Pass `hundredScale` from
 * `scoresAreHundredScale` for the whole chart; when omitted it's guessed from this score alone.
 */
export function scoreBucketLabel(score: number | null, format: ScoreFormat | null | undefined, hundredScale?: boolean): string {
  if (score == null) return '-';
  const max = format ? FORMAT_MAX[format] : undefined;
  const hundred = hundredScale ?? (max != null && score > max);
  switch (format) {
    case 'POINT_10_DECIMAL':
    case 'POINT_10':
      return String(hundred ? Math.round(score) / 10 : score);
    case 'POINT_5':
      return String(hundred ? Math.max(1, Math.round(score / 20)) : score);
    case 'POINT_3':
      if (hundred) return score >= 70 ? ':)' : score >= 40 ? ':|' : ':(';
      return score === 3 ? ':)' : score === 2 ? ':|' : ':(';
    default:
      return String(score);
  }
}

/** "1", "2-6", "7-16", "101+", "Unknown": order by the first number, unknown last. */
export function lengthOrder(length: string | null): number {
  const n = parseInt(length ?? '', 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  TW: 'Taiwan',
  US: 'United States',
  FR: 'France',
  GB: 'United Kingdom',
  TH: 'Thailand',
};

export function countryName(code: string | null): string {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code] ?? code;
}

// ---------------------------------------------------------------------------
// Activity history heatmap
// ---------------------------------------------------------------------------

export type HeatCell = {
  /** Local midnight of the day (ms). */
  time: number;
  amount: number;
  /** 0 (none) to 4 (most). */
  level: number;
  /** After today: drawn empty and not tappable. */
  future: boolean;
};

export type HeatmapGrid = {
  /** columns[week][weekday], weekday 0 = Sunday. */
  columns: HeatCell[][];
  /** Month labels at the first column of each month. */
  months: { column: number; label: string }[];
  max: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Bucket an amount relative to the busiest day, GitHub style. */
export function heatLevel(amount: number, max: number): number {
  if (amount <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((amount / max) * 4)));
}

/**
 * Lay out the last `weeks` weeks ending with the current week (Sunday-first rows, like
 * AniClient's "Mon / Wed / Fri" labels). `history` dates are unix seconds.
 */
export function buildHeatmap(
  history: readonly UserActivityHistoryEntry[],
  weeks: number,
  today: Date = new Date(),
): HeatmapGrid {
  const amounts = new Map<string, number>();
  for (const entry of history) {
    if (entry.date == null) continue;
    const key = dayKey(new Date(entry.date * 1000));
    amounts.set(key, (amounts.get(key) ?? 0) + (entry.amount ?? 0));
  }
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay() - (weeks - 1) * 7);

  const columns: HeatCell[][] = [];
  const months: { column: number; label: string }[] = [];
  let max = 0;
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const amount = amounts.get(dayKey(day)) ?? 0;
      max = Math.max(max, amount);
      column.push({ time: day.getTime(), amount, level: 0, future: day.getTime() > end.getTime() });
    }
    const firstMonth = new Date(column[0].time).getMonth();
    if (firstMonth !== lastMonth) {
      // Skip a label squeezed into the first column when the month starts mid-week.
      if (w > 0 || new Date(column[0].time).getDate() <= 7) months.push({ column: w, label: MONTHS[firstMonth] });
      lastMonth = firstMonth;
    }
    columns.push(column);
  }
  for (const column of columns) for (const cell of column) cell.level = heatLevel(cell.amount, max);
  return { columns, months, max };
}

export function formatHeatDay(time: number): string {
  const d = new Date(time);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${weekday}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
