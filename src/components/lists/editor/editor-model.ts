/**
 * Entry editor draft state and conversions (pure, unit-tested).
 */
import type { FuzzyDate, MediaCore, MediaListEntry, MediaListStatus, SaveMediaListEntryVariables } from '@/api/types';
import { SCORE_MAX, SCORE_STEP, type ScoreFormat } from '@/lib/format';

export type DraftDate = { year: number; month: number | null; day: number | null } | null;

export type EntryDraft = {
  status: MediaListStatus;
  progress: number;
  progressVolumes: number;
  /** In the viewer's score format; 0 = unscored. */
  score: number;
  /** Category -> score, in the viewer's score format. */
  advancedScores: Record<string, number>;
  repeat: number;
  startedAt: DraftDate;
  completedAt: DraftDate;
  notes: string;
  private: boolean;
  hiddenFromStatusLists: boolean;
  customLists: string[];
};

type EditorMedia = Pick<MediaCore, 'type' | 'episodes' | 'chapters' | 'volumes'>;

export function toDraftDate(d: FuzzyDate | null | undefined): DraftDate {
  if (!d?.year) return null;
  return { year: d.year, month: d.month ?? null, day: d.day ?? null };
}

export function dateToDraft(date: Date): NonNullable<DraftDate> {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function draftToDate(d: DraftDate): Date | null {
  if (!d) return null;
  return new Date(d.year, (d.month ?? 1) - 1, d.day ?? 1);
}

export function todayDraft(): NonNullable<DraftDate> {
  return dateToDraft(new Date());
}

/** Draft for an existing entry, or the defaults for a new one ("Planning", nothing set). */
export function draftFromEntry(entry: MediaListEntry | null | undefined): EntryDraft {
  const member = Object.entries(entry?.customLists ?? {})
    .filter(([, on]) => on)
    .map(([name]) => name);
  return {
    status: entry?.status ?? 'PLANNING',
    progress: entry?.progress ?? 0,
    progressVolumes: entry?.progressVolumes ?? 0,
    score: entry?.score ?? 0,
    advancedScores: { ...(entry?.advancedScores ?? {}) },
    repeat: entry?.repeat ?? 0,
    startedAt: toDraftDate(entry?.startedAt),
    completedAt: toDraftDate(entry?.completedAt),
    notes: entry?.notes ?? '',
    private: entry?.private ?? false,
    hiddenFromStatusLists: entry?.hiddenFromStatusLists ?? false,
    customLists: member,
  };
}

export function totalUnits(media: EditorMedia | null | undefined): number | null {
  if (!media) return null;
  const total = media.type === 'MANGA' ? media.chapters : media.episodes;
  return total && total > 0 ? total : null;
}

export function totalVolumes(media: EditorMedia | null | undefined): number | null {
  return media?.volumes && media.volumes > 0 ? media.volumes : null;
}

/**
 * Status change with AniList-style side effects: Watching sets the start date, Completed sets
 * the finish date and fills progress to the total.
 */
export function withStatus(draft: EntryDraft, status: MediaListStatus, media: EditorMedia | null | undefined): EntryDraft {
  const next: EntryDraft = { ...draft, status };
  if ((status === 'CURRENT' || status === 'REPEATING') && !next.startedAt) next.startedAt = todayDraft();
  if (status === 'COMPLETED') {
    if (!next.completedAt) next.completedAt = todayDraft();
    if (!next.startedAt && draft.status !== 'PLANNING') next.startedAt = next.completedAt;
    const total = totalUnits(media);
    if (total != null) next.progress = total;
    const vols = totalVolumes(media);
    if (media?.type === 'MANGA' && vols != null) next.progressVolumes = vols;
  }
  return next;
}

/** Progress change: starting a Planning entry moves it to Watching, reaching the total completes it. */
export function withProgress(draft: EntryDraft, progress: number, media: EditorMedia | null | undefined): EntryDraft {
  const total = totalUnits(media);
  const value = Math.max(0, total != null ? Math.min(progress, total) : progress);
  let next: EntryDraft = { ...draft, progress: value };
  if (value > draft.progress && (draft.status === 'PLANNING' || draft.status === 'PAUSED' || draft.status === 'DROPPED')) {
    next = withStatus(next, 'CURRENT', media);
  }
  if (total != null && value >= total && value > draft.progress && (next.status === 'CURRENT' || next.status === 'REPEATING')) {
    const repeat = next.status === 'REPEATING' ? next.repeat + 1 : next.repeat;
    next = { ...withStatus(next, 'COMPLETED', media), repeat };
  }
  return next;
}

export function withVolumes(draft: EntryDraft, volumes: number, media: EditorMedia | null | undefined): EntryDraft {
  const total = totalVolumes(media);
  return { ...draft, progressVolumes: Math.max(0, total != null ? Math.min(volumes, total) : volumes) };
}

export function clampScore(score: number, format: ScoreFormat): number {
  if (!Number.isFinite(score)) return 0;
  const max = SCORE_MAX[format];
  const clamped = Math.min(max, Math.max(0, score));
  return format === 'POINT_10_DECIMAL' ? Math.round(clamped * 10) / 10 : Math.round(clamped);
}

/** -/+ on the score stepper; the step follows the scoring system (0.5 for 10 Point Decimal). */
export function stepScore(score: number, format: ScoreFormat, direction: 1 | -1): number {
  const step = SCORE_STEP[format];
  const snapped = direction > 0 ? Math.floor(score / step + 1e-9) * step + step : Math.ceil(score / step - 1e-9) * step - step;
  return clampScore(snapped, format);
}

/** AniList only supports advanced scoring on the 100 Point and 10 Point Decimal systems. */
export function supportsAdvancedScoring(format: ScoreFormat): boolean {
  return format === 'POINT_100' || format === 'POINT_10_DECIMAL';
}

/** Mean of the non-zero advanced scores (AniList web behaviour), or null when none are set. */
export function averageAdvanced(scores: Record<string, number>, categories: readonly string[], format: ScoreFormat): number | null {
  const values = categories.map((c) => scores[c] ?? 0).filter((v) => v > 0);
  if (values.length === 0) return null;
  return clampScore(values.reduce((a, b) => a + b, 0) / values.length, format);
}

function dateInput(d: DraftDate) {
  return d ? { year: d.year, month: d.month, day: d.day } : { year: null, month: null, day: null };
}

/** SaveMediaListEntry variables for the whole draft (update by entry id, or create by media id). */
export function draftToVariables(
  draft: EntryDraft,
  target: { entryId?: number; mediaId: number },
  advancedCategories: readonly string[] | null,
): SaveMediaListEntryVariables {
  const vars: SaveMediaListEntryVariables = {
    status: draft.status,
    progress: draft.progress,
    progressVolumes: draft.progressVolumes,
    score: draft.score,
    repeat: draft.repeat,
    notes: draft.notes,
    private: draft.private,
    hiddenFromStatusLists: draft.hiddenFromStatusLists,
    customLists: draft.customLists,
    startedAt: dateInput(draft.startedAt),
    completedAt: dateInput(draft.completedAt),
  };
  if (target.entryId != null) vars.id = target.entryId;
  else vars.mediaId = target.mediaId;
  if (advancedCategories && advancedCategories.length > 0) {
    vars.advancedScores = advancedCategories.map((c) => draft.advancedScores[c] ?? 0);
  }
  return vars;
}
