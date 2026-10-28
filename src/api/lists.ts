import { gql, type GqlOptions } from './client';
import { operation } from './document';
import { MEDIA_CORE, MEDIA_LIST_ENTRY, MEDIA_LIST_OPTIONS } from './fragments';
import type {
  DeleteCustomListMutation,
  DeleteMediaListEntryMutation,
  FuzzyDate,
  FuzzyDateInput,
  MediaCore,
  MediaListCollectionQuery,
  MediaListCollectionVariables,
  MediaListEntry,
  MediaListEntryLite,
  MediaListEntryQuery,
  MediaListStatus,
  MediaType,
  SaveMediaListEntryMutation,
  SaveMediaListEntryVariables,
  UpdateMediaListEntriesMutation,
  UpdateMediaListEntriesVariables,
} from './types';

export const MEDIA_LIST_COLLECTION_QUERY = operation(
  `
query MediaListCollection(
  $userId: Int
  $userName: String
  $type: MediaType!
  $status_in: [MediaListStatus]
  $sort: [MediaListSort]
  $forceSingleCompletedList: Boolean
  $chunk: Int
  $perChunk: Int
) {
  MediaListCollection(
    userId: $userId
    userName: $userName
    type: $type
    status_in: $status_in
    sort: $sort
    forceSingleCompletedList: $forceSingleCompletedList
    chunk: $chunk
    perChunk: $perChunk
  ) {
    hasNextChunk
    user {
      id
      name
      mediaListOptions { ...MediaListOptionsFields }
    }
    lists {
      name
      isCustomList
      isSplitCompletedList
      status
      entries {
        ...MediaListEntryFields
        media { ...MediaCoreFields }
      }
    }
  }
}`,
  [MEDIA_LIST_ENTRY, MEDIA_CORE, MEDIA_LIST_OPTIONS],
);

/** The viewer's entry for one media (edit sheet). */
export const MEDIA_LIST_ENTRY_QUERY = operation(
  `
query MediaListEntry($mediaId: Int!) {
  Media(id: $mediaId) {
    ...MediaCoreFields
    isFavourite
    mediaListEntry { ...MediaListEntryFields }
  }
}`,
  [MEDIA_CORE, MEDIA_LIST_ENTRY],
);

export const SAVE_MEDIA_LIST_ENTRY_MUTATION = operation(
  `
mutation SaveMediaListEntry(
  $id: Int
  $mediaId: Int
  $status: MediaListStatus
  $score: Float
  $scoreRaw: Int
  $progress: Int
  $progressVolumes: Int
  $repeat: Int
  $priority: Int
  $private: Boolean
  $notes: String
  $hiddenFromStatusLists: Boolean
  $customLists: [String]
  $advancedScores: [Float]
  $startedAt: FuzzyDateInput
  $completedAt: FuzzyDateInput
) {
  SaveMediaListEntry(
    id: $id
    mediaId: $mediaId
    status: $status
    score: $score
    scoreRaw: $scoreRaw
    progress: $progress
    progressVolumes: $progressVolumes
    repeat: $repeat
    priority: $priority
    private: $private
    notes: $notes
    hiddenFromStatusLists: $hiddenFromStatusLists
    customLists: $customLists
    advancedScores: $advancedScores
    startedAt: $startedAt
    completedAt: $completedAt
  ) {
    ...MediaListEntryFields
    media { ...MediaCoreFields }
  }
}`,
  [MEDIA_LIST_ENTRY, MEDIA_CORE],
);

export const UPDATE_MEDIA_LIST_ENTRIES_MUTATION = operation(
  `
mutation UpdateMediaListEntries(
  $ids: [Int]
  $status: MediaListStatus
  $score: Float
  $scoreRaw: Int
  $progress: Int
  $progressVolumes: Int
  $repeat: Int
  $priority: Int
  $private: Boolean
  $notes: String
  $hiddenFromStatusLists: Boolean
  $advancedScores: [Float]
  $startedAt: FuzzyDateInput
  $completedAt: FuzzyDateInput
) {
  UpdateMediaListEntries(
    ids: $ids
    status: $status
    score: $score
    scoreRaw: $scoreRaw
    progress: $progress
    progressVolumes: $progressVolumes
    repeat: $repeat
    priority: $priority
    private: $private
    notes: $notes
    hiddenFromStatusLists: $hiddenFromStatusLists
    advancedScores: $advancedScores
    startedAt: $startedAt
    completedAt: $completedAt
  ) {
    ...MediaListEntryFields
  }
}`,
  [MEDIA_LIST_ENTRY],
);

export const DELETE_MEDIA_LIST_ENTRY_MUTATION = operation(`
mutation DeleteMediaListEntry($id: Int!) {
  DeleteMediaListEntry(id: $id) { deleted }
}`);

export const DELETE_CUSTOM_LIST_MUTATION = operation(`
mutation DeleteCustomList($customList: String!, $type: MediaType!) {
  DeleteCustomList(customList: $customList, type: $type) { deleted }
}`);

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export const fetchMediaListCollection = (vars: MediaListCollectionVariables, opts?: GqlOptions) =>
  gql<MediaListCollectionQuery>(MEDIA_LIST_COLLECTION_QUERY, vars, opts);

export const fetchMediaListEntry = (mediaId: number, opts?: GqlOptions) =>
  gql<MediaListEntryQuery>(MEDIA_LIST_ENTRY_QUERY, { mediaId }, opts);

export const saveMediaListEntry = (vars: SaveMediaListEntryVariables, opts?: GqlOptions) =>
  gql<SaveMediaListEntryMutation>(SAVE_MEDIA_LIST_ENTRY_MUTATION, vars, opts);

export const updateMediaListEntries = (vars: UpdateMediaListEntriesVariables, opts?: GqlOptions) =>
  gql<UpdateMediaListEntriesMutation>(UPDATE_MEDIA_LIST_ENTRIES_MUTATION, vars, opts);

export const deleteMediaListEntry = (id: number, opts?: GqlOptions) =>
  gql<DeleteMediaListEntryMutation>(DELETE_MEDIA_LIST_ENTRY_MUTATION, { id }, opts);

export const deleteCustomList = (customList: string, type: MediaType, opts?: GqlOptions) =>
  gql<DeleteCustomListMutation>(DELETE_CUSTOM_LIST_MUTATION, { customList, type }, opts);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function todayFuzzyDate(now = new Date()): FuzzyDateInput {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function isFuzzyDateSet(d: FuzzyDate | FuzzyDateInput | null | undefined): boolean {
  return !!d && d.year != null;
}

/** Total units (episodes for anime, chapters for manga), or null if unknown. */
export function mediaTotal(media: Pick<MediaCore, 'type' | 'episodes' | 'chapters'> | null | undefined) {
  if (!media) return null;
  return media.type === 'MANGA' ? media.chapters : media.episodes;
}

type EntryForIncrement = Pick<MediaListEntryLite, 'id' | 'mediaId' | 'status' | 'progress' | 'progressVolumes' | 'repeat'> &
  Partial<Pick<MediaListEntry, 'startedAt' | 'completedAt'>>;

export interface IncrementOptions {
  /** Units to add (default 1, may be negative). */
  by?: number;
  /** Increment progressVolumes instead of progress (manga). */
  volumes?: boolean;
  /** Auto-complete when progress reaches the total (default true). */
  autoComplete?: boolean;
  /** Move PLANNING/PAUSED/DROPPED to CURRENT on increment (default true). */
  autoStart?: boolean;
  /** Set startedAt/completedAt to today when status changes (default true). */
  autoDates?: boolean;
}

/**
 * Computes SaveMediaListEntry variables for a +N progress action (swipe gesture).
 * Mirrors AniList web behaviour: planning -> watching, finishing -> completed
 * (rewatching increments `repeat`), clamps to [0, total].
 */
export function buildIncrementVariables(
  entry: EntryForIncrement,
  media: Pick<MediaCore, 'type' | 'episodes' | 'chapters' | 'volumes'> | null | undefined,
  { by = 1, volumes = false, autoComplete = true, autoStart = true, autoDates = true }: IncrementOptions = {},
): SaveMediaListEntryVariables {
  const total = volumes ? (media?.volumes ?? null) : mediaTotal(media);
  const current = (volumes ? entry.progressVolumes : entry.progress) ?? 0;
  let next = Math.max(0, current + by);
  if (total != null && total > 0) next = Math.min(next, total);

  const vars: SaveMediaListEntryVariables = { id: entry.id };
  if (volumes) vars.progressVolumes = next;
  else vars.progress = next;

  let status: MediaListStatus | null = entry.status;
  if (by > 0 && autoStart && (status === 'PLANNING' || status === 'PAUSED' || status === 'DROPPED')) {
    status = 'CURRENT';
    if (autoDates && !isFuzzyDateSet(entry.startedAt)) vars.startedAt = todayFuzzyDate();
  }
  if (by > 0 && autoComplete && total != null && total > 0 && next >= total && !volumes) {
    if (status === 'REPEATING') vars.repeat = (entry.repeat ?? 0) + 1;
    status = 'COMPLETED';
    if (autoDates && (entry.status !== 'REPEATING' || !isFuzzyDateSet(entry.completedAt))) {
      vars.completedAt = todayFuzzyDate();
    }
  }
  if (status && status !== entry.status) vars.status = status;
  return vars;
}

/** Applies SaveMediaListEntry variables to a cached entry (for optimistic updates). */
export function applyEntryVariables<T extends Partial<MediaListEntry>>(entry: T, vars: SaveMediaListEntryVariables): T {
  const next: T = { ...entry };
  const assign = <K extends keyof MediaListEntry>(k: K, v: MediaListEntry[K] | undefined) => {
    if (v !== undefined) (next as Partial<MediaListEntry>)[k] = v;
  };
  assign('status', vars.status);
  assign('progress', vars.progress);
  assign('progressVolumes', vars.progressVolumes);
  assign('repeat', vars.repeat);
  assign('priority', vars.priority);
  assign('private', vars.private);
  assign('notes', vars.notes);
  assign('hiddenFromStatusLists', vars.hiddenFromStatusLists);
  if (vars.score !== undefined) assign('score', vars.score);
  if (vars.startedAt) assign('startedAt', { year: vars.startedAt.year ?? null, month: vars.startedAt.month ?? null, day: vars.startedAt.day ?? null });
  if (vars.completedAt) assign('completedAt', { year: vars.completedAt.year ?? null, month: vars.completedAt.month ?? null, day: vars.completedAt.day ?? null });
  if (vars.customLists) {
    const map: Record<string, boolean> = { ...(entry.customLists ?? {}) };
    for (const k of Object.keys(map)) map[k] = vars.customLists.includes(k);
    for (const k of vars.customLists) map[k] = true;
    assign('customLists', map);
  }
  return next;
}

/** +1 episode/chapter (or N) on an existing entry. */
export function incrementMediaListProgress(
  entry: EntryForIncrement,
  media: Pick<MediaCore, 'type' | 'episodes' | 'chapters' | 'volumes'> | null | undefined,
  options?: IncrementOptions,
  opts?: GqlOptions,
) {
  return saveMediaListEntry(buildIncrementVariables(entry, media, options), opts);
}

/** Names of the custom lists an entry currently belongs to. */
export function entryCustomListNames(entry: Pick<MediaListEntry, 'customLists'> | null | undefined): string[] {
  return Object.entries(entry?.customLists ?? {})
    .filter(([, on]) => on)
    .map(([name]) => name);
}

/** Variables to add/remove an entry to/from a custom list, preserving other memberships. */
export function buildToggleCustomListVariables(
  entry: Pick<MediaListEntry, 'id' | 'customLists'>,
  listName: string,
  add?: boolean,
): SaveMediaListEntryVariables {
  const current = new Set(entryCustomListNames(entry));
  const shouldAdd = add ?? !current.has(listName);
  if (shouldAdd) current.add(listName);
  else current.delete(listName);
  return { id: entry.id, customLists: [...current] };
}
