/**
 * Pure My List helpers (no React Native imports, unit-tested with bun test): grouping a
 * MediaListCollection into chip sections, sorting, search filtering and the airing line.
 */
import type {
  MediaCore,
  MediaListCollectionQuery,
  MediaListCollectionEntry,
  MediaListStatus,
  MediaType,
} from '@/api/types';
import { formatCountdown, fuzzyDateToInt, nowSeconds } from '@/lib/format';
import { pickTitle } from '@/lib/title';
import { listStatusLabel } from '@/settings/labels';
import type { ListSectionKey, ListSort, ListStatusSection, PreferredTitle } from '@/settings/types';

/** A collection entry whose media is known (entries with a null media are dropped). */
export type ListEntry = MediaListCollectionEntry & { media: MediaCore };

export const CUSTOM_PREFIX = 'custom:';

export function customSectionKey(name: string): ListSectionKey {
  return `${CUSTOM_PREFIX}${name}`;
}

export function isCustomSection(key: ListSectionKey): key is `custom:${string}` {
  return key.startsWith(CUSTOM_PREFIX);
}

export function customSectionName(key: ListSectionKey): string | null {
  return isCustomSection(key) ? key.slice(CUSTOM_PREFIX.length) : null;
}

/** Chip label: "Watching"/"Reading"…, or the custom list name. */
export function sectionLabel(key: ListSectionKey, type: MediaType): string {
  return customSectionName(key) ?? listStatusLabel(key as ListStatusSection, type);
}

/** Groups the collection's lists into chip sections (split completed lists are merged). */
export function groupSections(data: MediaListCollectionQuery | undefined): Map<ListSectionKey, ListEntry[]> {
  const out = new Map<ListSectionKey, ListEntry[]>();
  const seen = new Map<ListSectionKey, Set<number>>();
  for (const list of data?.MediaListCollection?.lists ?? []) {
    if (!list) continue;
    let key: ListSectionKey | null = null;
    if (list.isCustomList) key = list.name ? customSectionKey(list.name) : null;
    else if (list.status) key = list.status as ListStatusSection;
    if (!key) continue;
    const bucket = out.get(key) ?? [];
    const ids = seen.get(key) ?? new Set<number>();
    for (const e of list.entries ?? []) {
      if (!e?.media || ids.has(e.id)) continue;
      ids.add(e.id);
      bucket.push(e as ListEntry);
    }
    out.set(key, bucket);
    seen.set(key, ids);
  }
  return out;
}

/** Custom list names for one media type: the user's options first, then any extra list names found in the data. */
export function customListNames(data: MediaListCollectionQuery | undefined, type: MediaType): string[] {
  const options = data?.MediaListCollection?.user?.mediaListOptions;
  const fromOptions = (type === 'MANGA' ? options?.mangaList : options?.animeList)?.customLists ?? [];
  const names = [...fromOptions];
  for (const list of data?.MediaListCollection?.lists ?? []) {
    if (list?.isCustomList && list.name && !names.includes(list.name)) names.push(list.name);
  }
  return names;
}

function compareNumbers(a: number | null | undefined, b: number | null | undefined) {
  return (a ?? 0) - (b ?? 0);
}

/** Sorts a copy of `entries` by the "Last Updated"-style sort pill and direction. */
export function sortEntries(entries: readonly ListEntry[], sort: ListSort, preferred: PreferredTitle): ListEntry[] {
  const titleOf = (e: ListEntry) => pickTitle(e.media.title, preferred).toLocaleLowerCase();
  const cmp = (a: ListEntry, b: ListEntry): number => {
    switch (sort.field) {
      case 'lastUpdated':
        return compareNumbers(a.updatedAt, b.updatedAt);
      case 'lastAdded':
        return compareNumbers(a.createdAt, b.createdAt);
      case 'title':
        return titleOf(a).localeCompare(titleOf(b));
      case 'score':
        return compareNumbers(a.score, b.score);
      case 'progress':
        return compareNumbers(a.progress, b.progress);
      case 'startDate':
        return fuzzyDateToInt(a.startedAt) - fuzzyDateToInt(b.startedAt);
      case 'completedDate':
        return fuzzyDateToInt(a.completedAt) - fuzzyDateToInt(b.completedAt);
      case 'releaseDate':
        return fuzzyDateToInt(a.media.startDate) - fuzzyDateToInt(b.media.startDate);
      case 'averageScore':
        return compareNumbers(a.media.averageScore, b.media.averageScore);
      case 'popularity':
        return compareNumbers(a.media.popularity, b.media.popularity);
    }
  };
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => cmp(a, b) * dir || titleOf(a).localeCompare(titleOf(b)) || a.id - b.id);
}

/** Case- and accent-insensitive match against every title variant. */
export function filterEntries(entries: readonly ListEntry[], query: string): ListEntry[] {
  const q = normalize(query.trim());
  if (!q) return [...entries];
  return entries.filter((e) => {
    const t = e.media.title;
    return [t?.userPreferred, t?.english, t?.romaji, t?.native].some((v) => !!v && normalize(v).includes(q));
  });
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase();
}

/** Total units (episodes for anime, chapters for manga), or null when unknown. */
export function entryTotal(media: Pick<MediaCore, 'type' | 'episodes' | 'chapters'>): number | null {
  const total = media.type === 'MANGA' ? media.chapters : media.episodes;
  return total && total > 0 ? total : null;
}

const UNITS: [seconds: number, one: string, many: string][] = [
  [31536000, 'a year', 'years'],
  [2592000, 'a month', 'months'],
  [86400, 'a day', 'days'],
  [3600, 'an hour', 'hours'],
  [60, 'a minute', 'minutes'],
];

/** "2 months", "a day", "5 hours" (rounded like a humanized duration). */
export function humanizeDuration(seconds: number): string {
  for (const [size, one, many] of UNITS) {
    if (seconds >= size * 0.95 || size === 60) {
      const n = Math.max(1, Math.round(seconds / size));
      return n === 1 ? one : `${n} ${many}`;
    }
  }
  return 'a minute';
}

/** "in 2 months", "in a day", "in 5 hours". */
export function humanizeIn(seconds: number): string {
  return `in ${humanizeDuration(seconds)}`;
}

const WEEK = 7 * 86400;

/**
 * Time until an episode airs: exact "2d 4h" / "3h 5m" within a week, otherwise the humanized
 * wording the hero uses ("2 months", "8 days"). Empty once aired.
 */
export function airingCountdown(airingAt: number, now: number = nowSeconds()): string {
  const diff = airingAt - now;
  if (diff <= 0) return '';
  return diff >= WEEK ? humanizeDuration(diff) : formatCountdown(airingAt, now, 2, '');
}

/** AniClient airing line: "Episode 1181 airs in 2 months" (null when nothing is scheduled). */
export function airingLine(media: Pick<MediaCore, 'nextAiringEpisode'>, nowSeconds: number): string | null {
  const next = media.nextAiringEpisode;
  if (!next) return null;
  const diff = next.airingAt - nowSeconds;
  if (diff <= 0) return `Episode ${next.episode} aired`;
  return `Episode ${next.episode} airs ${humanizeIn(diff)}`;
}

/** Status options in the quick editor grid order ("Watching" "Planning" "Completed" / "Rewatching" "Paused" "Dropped"). */
export const EDITOR_STATUS_ORDER: readonly MediaListStatus[] = ['CURRENT', 'PLANNING', 'COMPLETED', 'REPEATING', 'PAUSED', 'DROPPED'];
