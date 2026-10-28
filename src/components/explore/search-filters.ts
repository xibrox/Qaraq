/**
 * Search/browse filter model: URL params <-> filter state <-> AniList `Page.media` variables.
 * Pure (no React) so it can be unit-tested.
 */
import { nextSeasonFor, seasonFor } from '@/api/explore';
import {
  ANIME_FORMATS,
  MANGA_FORMATS,
  MEDIA_SEASONS,
  MEDIA_SOURCES,
  MEDIA_STATUSES,
  type CountryCode,
  type MediaFormat,
  type MediaSeason,
  type MediaSearchVariables,
  type MediaSort,
  type MediaSource,
  type MediaStatus,
  type MediaType,
} from '@/api/types';
import { formatEnum } from '@/lib/format';
import type { SearchParams } from '@/navigation/hrefs';
import type { PreferredTitle } from '@/settings/types';

import { mediaFormatLabel, mediaStatusLabel, seasonLabel } from '../media/media-format';

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export type SortField =
  | 'popularity'
  | 'trending'
  | 'score'
  | 'favourites'
  | 'dateAdded'
  | 'releaseDate'
  | 'title'
  | 'count'
  | 'duration'
  | 'volumes'
  | 'endDate'
  | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

type SortBase = Exclude<MediaSort, `${string}_DESC`>;

const SORT_BASE: Record<Exclude<SortField, 'title' | 'count'>, SortBase> = {
  popularity: 'POPULARITY',
  trending: 'TRENDING',
  score: 'SCORE',
  favourites: 'FAVOURITES',
  dateAdded: 'ID',
  releaseDate: 'START_DATE',
  duration: 'DURATION',
  volumes: 'VOLUMES',
  endDate: 'END_DATE',
  updatedAt: 'UPDATED_AT',
};

const TITLE_SORT: Record<PreferredTitle, SortBase> = {
  userPreferred: 'TITLE_ROMAJI',
  romaji: 'TITLE_ROMAJI',
  english: 'TITLE_ENGLISH',
  native: 'TITLE_NATIVE',
};

function sortBase(field: SortField, type: MediaType, preferred: PreferredTitle): SortBase {
  if (field === 'title') return TITLE_SORT[preferred];
  if (field === 'count') return type === 'MANGA' ? 'CHAPTERS' : 'EPISODES';
  return SORT_BASE[field];
}

/** Sort sheet options: AniClient's seven first, then the rest of AniList's media sorts. */
export function sortOptions(type: MediaType): { value: SortField; label: string }[] {
  const manga = type === 'MANGA';
  return [
    { value: 'popularity', label: 'Popularity' },
    { value: 'trending', label: 'Trending' },
    { value: 'score', label: 'Average Score' },
    { value: 'favourites', label: 'Favorites' },
    { value: 'dateAdded', label: 'Date Added' },
    { value: 'releaseDate', label: 'Release Date' },
    { value: 'title', label: 'Title' },
    { value: 'count', label: manga ? 'Chapters' : 'Episodes' },
    manga ? { value: 'volumes', label: 'Volumes' } : { value: 'duration', label: 'Duration' },
    { value: 'endDate', label: 'End Date' },
    { value: 'updatedAt', label: 'Last Updated' },
  ];
}

export function sortLabel(field: SortField, type: MediaType): string {
  return sortOptions(type).find((o) => o.value === field)?.label ?? 'Sort';
}

/** Direction a sort starts with: A-Z for titles, highest first otherwise. */
export function defaultDirection(field: SortField): SortDirection {
  return field === 'title' ? 'asc' : 'desc';
}

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

export type CountRange = { key: string; label: string; min?: number; max?: number };

/** Episodes (anime) / Chapters (manga) buckets, inclusive. */
export function countRanges(type: MediaType): CountRange[] {
  return type === 'MANGA'
    ? [
        { key: '1-10', label: '1 - 10', min: 1, max: 10 },
        { key: '11-50', label: '11 - 50', min: 11, max: 50 },
        { key: '51-100', label: '51 - 100', min: 51, max: 100 },
        { key: '101-200', label: '101 - 200', min: 101, max: 200 },
        { key: '201+', label: '201+', min: 201 },
      ]
    : [
        { key: '1', label: '1', min: 1, max: 1 },
        { key: '2-6', label: '2 - 6', min: 2, max: 6 },
        { key: '7-16', label: '7 - 16', min: 7, max: 16 },
        { key: '17-28', label: '17 - 28', min: 17, max: 28 },
        { key: '29-55', label: '29 - 55', min: 29, max: 55 },
        { key: '56+', label: '56+', min: 56 },
      ];
}

export type YearRange = { key: string; label: string; from: number; to: number };

/** Decade buckets for "Year Range". */
export function yearRanges(now = new Date()): YearRange[] {
  const current = now.getFullYear() + 1;
  const out: YearRange[] = [];
  for (let d = Math.floor(current / 10) * 10; d >= 1970; d -= 10) {
    out.push({ key: `${d}s`, label: `${d}s`, from: d, to: Math.min(d + 9, current) });
  }
  out.push({ key: 'pre1970', label: 'Before 1970', from: 1900, to: 1969 });
  return out;
}

export function yearOptions(now = new Date()): number[] {
  const years: number[] = [];
  for (let y = now.getFullYear() + 1; y >= 1940; y--) years.push(y);
  return years;
}

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

export const COUNTRY_LABELS: Record<string, string> = { JP: 'Japan', KR: 'South Korea', CN: 'China', TW: 'Taiwan' };

export function formatOptions(type: MediaType) {
  return (type === 'MANGA' ? MANGA_FORMATS : ANIME_FORMATS).map((f) => ({ value: f, label: mediaFormatLabel(f) }));
}

export function statusOptions(type: MediaType) {
  return MEDIA_STATUSES.map((s) => ({ value: s, label: mediaStatusLabel(s, type) }));
}

export const seasonOptions = MEDIA_SEASONS.map((s) => ({ value: s, label: seasonLabel(s) }));

export const sourceOptions = MEDIA_SOURCES.map((s) => ({ value: s, label: formatEnum(s) }));

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type SearchFilters = {
  type: MediaType;
  query: string;
  sort: SortField | null;
  direction: SortDirection;
  genres: string[];
  tags: string[];
  year: number | null;
  yearRange: string | null;
  season: MediaSeason | null;
  format: MediaFormat | null;
  status: MediaStatus | null;
  country: CountryCode | null;
  source: MediaSource | null;
  countRange: string | null;
  /** true = on my list, false = not on my list. */
  onList: boolean | null;
  /** true = 18+ only, false = hide 18+ (only offered when 18+ Content is on). */
  adult: boolean | null;
};

export function emptyFilters(type: MediaType, query = ''): SearchFilters {
  return {
    type,
    query,
    sort: null,
    direction: 'desc',
    genres: [],
    tags: [],
    year: null,
    yearRange: null,
    season: null,
    format: null,
    status: null,
    country: null,
    source: null,
    countRange: null,
    onList: null,
    adult: null,
  };
}

/** Clears everything except the type and query (funnel-slash button). */
export function clearFilters(f: SearchFilters): SearchFilters {
  return emptyFilters(f.type, f.query);
}

/** Number of active filters (sort and query excluded). */
export function activeFilterCount(f: SearchFilters): number {
  return (
    f.genres.length +
    f.tags.length +
    [f.year, f.yearRange, f.season, f.format, f.status, f.country, f.source, f.countRange, f.onList, f.adult].filter((v) => v != null).length
  );
}

/** Switching Anime/Manga drops filters that only make sense for one type. */
export function withType(f: SearchFilters, type: MediaType): SearchFilters {
  if (f.type === type) return f;
  return {
    ...f,
    type,
    format: null,
    season: null,
    countRange: null,
    sort: f.sort === 'duration' || f.sort === 'volumes' ? null : f.sort,
  };
}

function parseSort(value: string | undefined): { sort: SortField; direction: SortDirection } | null {
  if (!value) return null;
  const desc = value.endsWith('_DESC');
  const base = desc ? value.slice(0, -5) : value;
  const direction: SortDirection = desc ? 'desc' : 'asc';
  if (base.startsWith('TITLE_')) return { sort: 'title', direction };
  if (base === 'EPISODES' || base === 'CHAPTERS') return { sort: 'count', direction };
  const field = (Object.keys(SORT_BASE) as (keyof typeof SORT_BASE)[]).find((k) => SORT_BASE[k] === base);
  return field ? { sort: field, direction } : null;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Initial filters from `hrefs.search(...)` params (Explore "›" presets included). */
export function filtersFromParams(params: SearchParams, fallbackType: MediaType, now = new Date()): SearchFilters {
  const type: MediaType = params.type === 'MANGA' || params.type === 'ANIME' ? params.type : fallbackType;
  const f = emptyFilters(params.preset === 'manhwa' ? 'MANGA' : type, params.q ?? '');
  const sort = parseSort(params.sort);
  if (sort) Object.assign(f, sort);
  if (params.genre) f.genres = [params.genre];
  const year = params.year ? Number(params.year) : NaN;
  if (Number.isFinite(year) && year > 1900) f.year = year;
  f.season = pick(params.season, MEDIA_SEASONS);
  f.format = pick(params.format, [...ANIME_FORMATS, ...MANGA_FORMATS]);
  f.status = pick(params.status, MEDIA_STATUSES);
  if (params.country) f.country = params.country;

  const by = (s: SortField) => {
    if (!sort) {
      f.sort = s;
      f.direction = 'desc';
    }
  };
  switch (params.preset) {
    case 'trending':
      by('trending');
      break;
    case 'popular':
      by('popularity');
      break;
    case 'top':
      by('score');
      break;
    case 'season':
    case 'nextSeason': {
      const s = params.preset === 'season' ? seasonFor(now) : nextSeasonFor(now);
      f.season = s.season;
      f.year = s.year;
      by('popularity');
      break;
    }
    case 'manhwa':
      f.country = 'KR';
      by('popularity');
      break;
  }
  return f;
}

/** Should the search field focus on open? Only for a bare "Search" tap. */
export function isBareSearch(params: SearchParams): boolean {
  return !params.preset && !params.sort && !params.genre && !params.year && !params.season && !params.format && !params.status && !params.country && !params.q;
}

export type VariableContext = { preferredTitle: PreferredTitle; showAdultContent: boolean };

/** Filter state -> `Page.media` variables. */
export function filtersToVariables(f: SearchFilters, ctx: VariableContext): MediaSearchVariables {
  const v: MediaSearchVariables = { type: f.type };
  const q = f.query.trim();
  if (q) v.search = q;

  if (f.sort) {
    const base = sortBase(f.sort, f.type, ctx.preferredTitle);
    v.sort = [(f.direction === 'desc' ? `${base}_DESC` : base) as MediaSort, 'ID'];
  } else {
    v.sort = q ? ['SEARCH_MATCH'] : ['POPULARITY_DESC'];
  }

  if (f.genres.length) v.genre_in = f.genres;
  if (f.tags.length) v.tag_in = f.tags;

  if (f.year != null) {
    if (f.type === 'ANIME') v.seasonYear = f.year;
    else {
      v.startDate_greater = f.year * 10000;
      v.startDate_lesser = (f.year + 1) * 10000;
    }
  } else if (f.yearRange) {
    const r = yearRanges().find((y) => y.key === f.yearRange);
    if (r) {
      v.startDate_greater = r.from * 10000;
      v.startDate_lesser = (r.to + 1) * 10000;
    }
  }
  if (f.season) v.season = f.season;
  if (f.format) v.format = f.format;
  if (f.status) v.status = f.status;
  if (f.country) v.countryOfOrigin = f.country;
  if (f.source) v.source = f.source;

  if (f.countRange) {
    const r = countRanges(f.type).find((c) => c.key === f.countRange);
    if (r && f.type === 'MANGA') {
      if (r.min != null) v.chapters_greater = r.min - 1;
      if (r.max != null) v.chapters_lesser = r.max + 1;
    } else if (r) {
      if (r.min != null) v.episodes_greater = r.min - 1;
      if (r.max != null) v.episodes_lesser = r.max + 1;
    }
  }
  if (f.onList != null) v.onList = f.onList;

  if (!ctx.showAdultContent) v.isAdult = false;
  else if (f.adult != null) v.isAdult = f.adult;
  return v;
}
