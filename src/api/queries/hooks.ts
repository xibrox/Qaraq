/**
 * TanStack Query v5 bindings for the AniList API layer.
 *
 * - `queryKeys` is the single source of truth for cache keys. Keys are
 *   hierarchical, so invalidating a prefix (e.g. `queryKeys.media.byId(1)`)
 *   refreshes every sub-query for that entity.
 * - Page-based queries use `useInfiniteQuery` driven by `pageInfo.hasNextPage`.
 * - Mutations for list entries, likes, favourites and follows update caches
 *   optimistically and roll back on error.
 */
import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';

import { shouldRetryQuery } from '../client';
import {
  deleteActivity,
  deleteActivityReply,
  fetchActivities,
  fetchActivity,
  fetchActivityReplies,
  fetchLikes,
  saveActivityReply,
  saveMessageActivity,
  saveTextActivity,
  toggleActivityPin,
  toggleActivitySubscription,
  toggleLike,
} from '../activity';
import { fetchCharacter, fetchCharacterMedia } from '../character';
import {
  fetchAiringSchedules,
  fetchExploreHome,
  fetchGenreCollection,
  fetchMediaTagCollection,
  searchCharacters,
  searchMedia,
  searchStaff,
  searchStudios,
  searchUsers,
} from '../explore';
import { toggleFavourite, updateFavouriteOrder, type FavouriteTarget } from '../favourites';
import {
  applyEntryVariables,
  buildIncrementVariables,
  deleteCustomList,
  deleteMediaListEntry,
  fetchMediaListCollection,
  fetchMediaListEntry,
  saveMediaListEntry,
  updateMediaListEntries,
  type IncrementOptions,
} from '../lists';
import {
  fetchMediaAiringSchedule,
  fetchMediaCharacters,
  fetchMediaDetail,
  fetchMediaFollowing,
  fetchMediaRecommendations,
  fetchMediaReviews,
  fetchMediaStaff,
  fetchMediaStats,
  saveRecommendation,
} from '../media';
import { fetchNotifications, resetNotificationCount } from '../notifications';
import { deleteReview, fetchReview, fetchReviews, rateReview, saveReview } from '../reviews';
import { updateUser } from '../settings';
import { fetchStaff, fetchStaffCharacterMedia, fetchStaffStaffMedia } from '../staff';
import { fetchStudio } from '../studio';
import type {
  ActivitiesQuery,
  ActivitiesVariables,
  Activity,
  ActivityRepliesQuery,
  ActivityReply,
  AiringSchedulesVariables,
  CharacterQuery,
  CharacterSearchVariables,
  CharacterVariables,
  ExploreHomeVariables,
  FavouriteKind,
  FollowListVariables,
  LikeableType,
  MediaCharactersVariables,
  MediaCore,
  MediaDetailQuery,
  MediaDetailVariables,
  MediaListCollectionEntry,
  MediaListCollectionQuery,
  MediaListCollectionVariables,
  MediaListEntry,
  MediaListEntryLite,
  MediaListEntryQuery,
  MediaRecommendationsVariables,
  MediaReviewsVariables,
  MediaSearchVariables,
  MediaStaffVariables,
  MediaType,
  NotificationsVariables,
  PageInfo,
  RateReviewVariables,
  ReviewsVariables,
  SaveActivityReplyVariables,
  SaveMediaListEntryVariables,
  SaveMessageActivityVariables,
  SaveRecommendationVariables,
  SaveReviewVariables,
  SaveTextActivityVariables,
  StaffCharacterMediaVariables,
  StaffQuery,
  StaffSearchVariables,
  StaffStaffMediaVariables,
  StaffVariables,
  StudioQuery,
  StudioSearchVariables,
  StudioVariables,
  ToggleActivityPinVariables,
  ToggleActivitySubscriptionVariables,
  UpdateFavouriteOrderVariables,
  UpdateMediaListEntriesVariables,
  UpdateUserVariables,
  UserProfileQuery,
  UserProfileVariables,
  UserSearchVariables,
  ViewerQuery,
} from '../types';
import { fetchUnreadNotificationCount, fetchViewer } from '../viewer';
import {
  fetchFollowers,
  fetchFollowing,
  fetchUserActivityHistory,
  fetchUserFavourites,
  fetchUserFavouritesOverview,
  fetchUserProfile,
  fetchUserStatistics,
  toggleFollow,
} from '../user';

import { replaceCardEntry } from './cache-patch';

// ---------------------------------------------------------------------------
// Query client
// ---------------------------------------------------------------------------

/**
 * Standalone QueryClient with AniList retry rules (tests / storybook).
 * The app uses the shared singleton `queryClient` from `@/lib/queryClient` (cleared on sign-out);
 * do not create a second client in the app tree.
 */
export function createAniListQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        gcTime: 30 * 60_000,
        retry: shouldRetryQuery,
      },
      mutations: { retry: false },
    },
  });
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const ROOT = 'anilist' as const;

export const queryKeys = {
  all: [ROOT] as const,

  viewer: {
    all: () => [ROOT, 'viewer'] as const,
    detail: () => [ROOT, 'viewer', 'detail'] as const,
    unreadCount: () => [ROOT, 'viewer', 'unreadCount'] as const,
  },

  lists: {
    all: () => [ROOT, 'lists'] as const,
    collections: () => [ROOT, 'lists', 'collection'] as const,
    collection: (vars: MediaListCollectionVariables) =>
      [ROOT, 'lists', 'collection', vars.type, vars.userId ?? vars.userName ?? null, vars] as const,
    entry: (mediaId: number) => [ROOT, 'lists', 'entry', mediaId] as const,
  },

  media: {
    all: () => [ROOT, 'media'] as const,
    byId: (id: number) => [ROOT, 'media', id] as const,
    detail: (vars: MediaDetailVariables) => [ROOT, 'media', vars.id, 'detail', vars] as const,
    characters: (vars: Omit<MediaCharactersVariables, 'page'>) => [ROOT, 'media', vars.id, 'characters', vars] as const,
    staff: (vars: Omit<MediaStaffVariables, 'page'>) => [ROOT, 'media', vars.id, 'staff', vars] as const,
    recommendations: (vars: Omit<MediaRecommendationsVariables, 'page'>) =>
      [ROOT, 'media', vars.id, 'recommendations', vars] as const,
    reviews: (vars: Omit<MediaReviewsVariables, 'page'>) => [ROOT, 'media', vars.id, 'reviews', vars] as const,
    stats: (id: number) => [ROOT, 'media', id, 'stats'] as const,
    airing: (id: number, notYetAired?: boolean) => [ROOT, 'media', id, 'airing', { notYetAired }] as const,
    following: (id: number) => [ROOT, 'media', id, 'following'] as const,
  },

  explore: {
    all: () => [ROOT, 'explore'] as const,
    home: (vars: ExploreHomeVariables) => [ROOT, 'explore', 'home', vars] as const,
    search: (vars: Omit<MediaSearchVariables, 'page'>) => [ROOT, 'explore', 'media', vars] as const,
    genres: () => [ROOT, 'explore', 'genres'] as const,
    tags: () => [ROOT, 'explore', 'tags'] as const,
    airing: (vars: Omit<AiringSchedulesVariables, 'page'>) => [ROOT, 'explore', 'airing', vars] as const,
    characters: (vars: Omit<CharacterSearchVariables, 'page'>) => [ROOT, 'explore', 'characters', vars] as const,
    staff: (vars: Omit<StaffSearchVariables, 'page'>) => [ROOT, 'explore', 'staff', vars] as const,
    studios: (vars: Omit<StudioSearchVariables, 'page'>) => [ROOT, 'explore', 'studios', vars] as const,
    users: (vars: Omit<UserSearchVariables, 'page'>) => [ROOT, 'explore', 'users', vars] as const,
  },

  character: {
    byId: (id: number) => [ROOT, 'character', id] as const,
    detail: (vars: CharacterVariables) => [ROOT, 'character', vars.id, 'detail', vars] as const,
    media: (vars: Omit<CharacterVariables, 'page'>) => [ROOT, 'character', vars.id, 'media', vars] as const,
  },

  staff: {
    byId: (id: number) => [ROOT, 'staff', id] as const,
    detail: (vars: StaffVariables) => [ROOT, 'staff', vars.id, 'detail', vars] as const,
    characterMedia: (vars: Omit<StaffCharacterMediaVariables, 'page'>) =>
      [ROOT, 'staff', vars.id, 'characterMedia', vars] as const,
    staffMedia: (vars: Omit<StaffStaffMediaVariables, 'page'>) => [ROOT, 'staff', vars.id, 'staffMedia', vars] as const,
  },

  studio: {
    byId: (id: number) => [ROOT, 'studio', id] as const,
    detail: (vars: Omit<StudioVariables, 'page'>) => [ROOT, 'studio', vars.id, 'detail', vars] as const,
  },

  user: {
    all: () => [ROOT, 'user'] as const,
    /** Profiles may be loaded by id or name; both live under this prefix. */
    profile: (vars: UserProfileVariables) => [ROOT, 'user', 'profile', vars.id ?? vars.name ?? null, vars] as const,
    profiles: () => [ROOT, 'user', 'profile'] as const,
    byId: (id: number) => [ROOT, 'user', id] as const,
    favourites: (id: number, kind: FavouriteKind, perPage?: number) =>
      [ROOT, 'user', id, 'favourites', kind, { perPage }] as const,
    favouritesOverview: (id: number, perPage?: number) => [ROOT, 'user', id, 'favourites', 'overview', { perPage }] as const,
    statistics: (id: number, type: MediaType, limit?: number) => [ROOT, 'user', id, 'statistics', type, { limit }] as const,
    activityHistory: (id: number) => [ROOT, 'user', id, 'activityHistory'] as const,
    followers: (vars: Omit<FollowListVariables, 'page'>) => [ROOT, 'user', vars.userId, 'followers', vars] as const,
    following: (vars: Omit<FollowListVariables, 'page'>) => [ROOT, 'user', vars.userId, 'following', vars] as const,
  },

  activity: {
    all: () => [ROOT, 'activity'] as const,
    feeds: () => [ROOT, 'activity', 'feed'] as const,
    feed: (vars: Omit<ActivitiesVariables, 'page'>) => [ROOT, 'activity', 'feed', vars] as const,
    detail: (id: number) => [ROOT, 'activity', 'detail', id] as const,
    replies: (activityId: number) => [ROOT, 'activity', 'replies', activityId] as const,
    likes: (id: number, type: LikeableType) => [ROOT, 'activity', 'likes', type, id] as const,
  },

  notifications: {
    all: () => [ROOT, 'notifications'] as const,
    list: (vars: Omit<NotificationsVariables, 'page'>) => [ROOT, 'notifications', vars] as const,
  },

  reviews: {
    all: () => [ROOT, 'reviews'] as const,
    detail: (id: number) => [ROOT, 'reviews', 'detail', id] as const,
    list: (vars: Omit<ReviewsVariables, 'page'>) => [ROOT, 'reviews', 'list', vars] as const,
  },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface QueryOpts {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
}

/** Next page from a pageInfo object; undefined stops pagination. */
export function nextPageFrom(pageInfo: PageInfo | null | undefined): number | undefined {
  if (!pageInfo?.hasNextPage) return undefined;
  return (pageInfo.currentPage ?? 0) + 1;
}

function useAniInfinite<TData>(
  queryKey: QueryKey,
  fetchPage: (page: number, signal: AbortSignal) => Promise<TData>,
  pageInfoOf: (data: TData) => PageInfo | null | undefined,
  opts: QueryOpts = {},
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last: TData) => nextPageFrom(pageInfoOf(last)),
    enabled: opts.enabled,
    staleTime: opts.staleTime,
    refetchInterval: opts.refetchInterval,
  });
}

/** Flattens `InfiniteData` pages into one array, dropping nulls. */
export function flattenPages<TData, TItem>(
  data: InfiniteData<TData> | undefined,
  select: (page: TData) => (TItem | null)[] | null | undefined,
): TItem[] {
  if (!data) return [];
  return data.pages.flatMap((p) => (select(p) ?? []).filter((x): x is TItem => x != null));
}

type Snapshot = [QueryKey, unknown][];

function restore(qc: QueryClient, snapshots: Snapshot | undefined) {
  snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
}

// ---------------------------------------------------------------------------
// Viewer
// ---------------------------------------------------------------------------

export function useViewer(opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.viewer.detail(),
    queryFn: ({ signal }) => fetchViewer({ signal }),
    select: (d) => d.Viewer,
    staleTime: 5 * 60_000,
    ...opts,
  });
}

export function useUnreadNotificationCount(opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.viewer.unreadCount(),
    queryFn: ({ signal }) => fetchUnreadNotificationCount({ signal }),
    select: (d) => d.Viewer?.unreadNotificationCount ?? 0,
    refetchInterval: 2 * 60_000,
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export function useMediaListCollection(vars: MediaListCollectionVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.lists.collection(vars),
    queryFn: ({ signal }) => fetchMediaListCollection(vars, { signal }),
    enabled: (opts.enabled ?? true) && (vars.userId != null || !!vars.userName),
    staleTime: opts.staleTime ?? 2 * 60_000,
  });
}

export function useMediaListEntry(mediaId: number | null | undefined, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.lists.entry(mediaId ?? -1),
    queryFn: ({ signal }) => fetchMediaListEntry(mediaId!, { signal }),
    enabled: (opts.enabled ?? true) && mediaId != null,
    staleTime: opts.staleTime,
  });
}

export type EntryPatch =
  | { kind: 'update'; entryId: number | undefined; mediaId: number | undefined; vars: SaveMediaListEntryVariables }
  | { kind: 'delete'; entryId: number };

/** Applies an optimistic entry change to every cached MediaListCollection. */
export function patchCollection(data: MediaListCollectionQuery | undefined, patch: EntryPatch): MediaListCollectionQuery | undefined {
  const coll = data?.MediaListCollection;
  if (!coll?.lists) return data;
  const matches = (e: MediaListCollectionEntry | null) =>
    !!e &&
    (patch.kind === 'delete'
      ? e.id === patch.entryId
      : (patch.entryId != null && e.id === patch.entryId) || (patch.mediaId != null && e.mediaId === patch.mediaId));

  let existing: MediaListCollectionEntry | undefined;
  for (const l of coll.lists) {
    existing = l?.entries?.find(matches) ?? undefined;
    if (existing) break;
  }
  if (!existing) return data;

  if (patch.kind === 'delete') {
    return {
      MediaListCollection: {
        ...coll,
        lists: coll.lists.map((l) => (l ? { ...l, entries: l.entries?.filter((e) => !matches(e)) ?? null } : l)),
      },
    };
  }

  const updated = applyEntryVariables(existing, patch.vars);
  const statusChanged = updated.status !== existing.status;
  const customNames = Object.entries(updated.customLists ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k);

  const lists = coll.lists.map((l) => {
    if (!l) return l;
    const has = !!l.entries?.some(matches);
    let shouldHave: boolean;
    if (l.isCustomList) {
      shouldHave = customNames.includes(l.name ?? '');
    } else if (statusChanged) {
      shouldHave = !updated.hiddenFromStatusLists && l.status === updated.status && (!l.isSplitCompletedList || has);
    } else {
      shouldHave = has;
    }
    if (has && shouldHave) return { ...l, entries: l.entries!.map((e) => (matches(e) ? updated : e)) };
    if (has && !shouldHave) return { ...l, entries: l.entries!.filter((e) => !matches(e)) };
    if (!has && shouldHave) return { ...l, entries: [updated, ...(l.entries ?? [])] };
    return l;
  });
  return { MediaListCollection: { ...coll, lists } };
}

function patchMediaDetailEntry(
  data: MediaDetailQuery | undefined,
  patch: EntryPatch,
): MediaDetailQuery | undefined {
  if (!data?.Media) return data;
  if (patch.kind === 'delete') {
    if (data.Media.mediaListEntry?.id !== patch.entryId) return data;
    return { ...data, Media: { ...data.Media, mediaListEntry: null } };
  }
  if (!data.Media.mediaListEntry) return data;
  return { ...data, Media: { ...data.Media, mediaListEntry: applyEntryVariables(data.Media.mediaListEntry, patch.vars) } };
}

function patchEntryQuery(data: MediaListEntryQuery | undefined, patch: EntryPatch): MediaListEntryQuery | undefined {
  if (!data?.Media?.mediaListEntry) return data;
  if (patch.kind === 'delete') return { Media: { ...data.Media, mediaListEntry: null } };
  return { Media: { ...data.Media, mediaListEntry: applyEntryVariables(data.Media.mediaListEntry, patch.vars) } };
}

async function optimisticEntry(qc: QueryClient, patch: EntryPatch, mediaId: number | undefined): Promise<Snapshot> {
  const filters: { queryKey: QueryKey }[] = [{ queryKey: queryKeys.lists.collections() }];
  if (mediaId != null) filters.push({ queryKey: queryKeys.media.byId(mediaId) }, { queryKey: queryKeys.lists.entry(mediaId) });
  await Promise.all(filters.map((f) => qc.cancelQueries(f)));

  const snapshot: Snapshot = [];
  for (const [key, data] of qc.getQueriesData<MediaListCollectionQuery>({ queryKey: queryKeys.lists.collections() })) {
    snapshot.push([key, data]);
    qc.setQueryData(key, patchCollection(data, patch));
  }
  if (mediaId != null) {
    for (const [key, data] of qc.getQueriesData<MediaDetailQuery>({ queryKey: [...queryKeys.media.byId(mediaId), 'detail'] })) {
      snapshot.push([key, data]);
      qc.setQueryData(key, patchMediaDetailEntry(data, patch));
    }
    const entryKey = queryKeys.lists.entry(mediaId);
    const entry = qc.getQueryData<MediaListEntryQuery>(entryKey);
    if (entry) {
      snapshot.push([entryKey, entry]);
      qc.setQueryData(entryKey, patchEntryQuery(entry, patch));
    }
  }
  return snapshot;
}

function invalidateEntry(qc: QueryClient, mediaId: number | undefined) {
  qc.invalidateQueries({ queryKey: queryKeys.lists.all() });
  if (mediaId != null) qc.invalidateQueries({ queryKey: queryKeys.media.byId(mediaId) });
  qc.invalidateQueries({ queryKey: queryKeys.user.all() });
  // A list change posts a list activity; mark feeds stale without refetching every mounted feed now.
  qc.invalidateQueries({ queryKey: queryKeys.activity.feeds(), refetchType: 'none' });
}

/**
 * Query prefixes whose data embeds `Media { id mediaListEntry }` cards (MediaCardFields):
 * explore home/search, media relations/recommendations, character/staff/studio works.
 */
const CARD_PREFIXES: QueryKey[] = [
  queryKeys.explore.all(),
  queryKeys.media.all(),
  [ROOT, 'character'],
  [ROOT, 'staff'],
  [ROOT, 'studio'],
];

/**
 * Keeps list-status badges on media cards in other tabs (Explore, search, character/staff/studio
 * works, media relations) in sync after an entry is saved or deleted, without refetching them.
 */
function writeCardEntries(qc: QueryClient, mediaId: number, entry: object | null) {
  for (const queryKey of CARD_PREFIXES) {
    for (const [key, data] of qc.getQueriesData({ queryKey })) {
      const next = replaceCardEntry(data, mediaId, entry);
      if (next !== data) qc.setQueryData(key, next);
    }
  }
}

/** Writes the server's saved entry into collection/detail/card caches. */
function writeSavedEntry(qc: QueryClient, saved: MediaListCollectionEntry | null) {
  if (!saved) return;
  const { media: _media, ...entry } = saved;
  writeCardEntries(qc, entry.mediaId, entry);
  const vars: SaveMediaListEntryVariables = {
    status: entry.status ?? undefined,
    progress: entry.progress ?? undefined,
    progressVolumes: entry.progressVolumes ?? undefined,
    repeat: entry.repeat ?? undefined,
  };
  for (const [key, data] of qc.getQueriesData<MediaListCollectionQuery>({ queryKey: queryKeys.lists.collections() })) {
    qc.setQueryData(key, patchCollection(data, { kind: 'update', entryId: entry.id, mediaId: entry.mediaId, vars }));
  }
  for (const [key, data] of qc.getQueriesData<MediaDetailQuery>({ queryKey: [...queryKeys.media.byId(entry.mediaId), 'detail'] })) {
    if (data?.Media) qc.setQueryData(key, { ...data, Media: { ...data.Media, mediaListEntry: entry as MediaListEntry } });
  }
}

/**
 * Create or update a list entry. Pass `id` to update; `mediaId` alone upserts.
 * `meta.mediaId` lets the optimistic update find media-detail caches when only
 * the entry id is known.
 */
export function useSaveMediaListEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveMediaListEntryVariables & { meta?: { mediaId?: number } }) => {
      const { meta: _meta, ...vars } = input;
      return saveMediaListEntry(vars);
    },
    onMutate: async (input) => {
      const { meta, ...vars } = input;
      const mediaId = meta?.mediaId ?? vars.mediaId;
      return { snapshot: await optimisticEntry(qc, { kind: 'update', entryId: vars.id, mediaId, vars }, mediaId), mediaId };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSuccess: (data) => writeSavedEntry(qc, data.SaveMediaListEntry),
    onSettled: (data, _e, input, ctx) => invalidateEntry(qc, data?.SaveMediaListEntry?.mediaId ?? ctx?.mediaId ?? input.mediaId),
  });
}

/** Swipe-right +1 (or +N) episode/chapter with auto status/dates handling. */
export function useIncrementProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      entry: Pick<MediaListEntryLite, 'id' | 'mediaId' | 'status' | 'progress' | 'progressVolumes' | 'repeat'> &
        Partial<Pick<MediaListEntry, 'startedAt' | 'completedAt'>>;
      media: Pick<MediaCore, 'type' | 'episodes' | 'chapters' | 'volumes'> | null | undefined;
      options?: IncrementOptions;
    }) => saveMediaListEntry(buildIncrementVariables(input.entry, input.media, input.options)),
    onMutate: async ({ entry, media, options }) => {
      const vars = buildIncrementVariables(entry, media, options);
      return {
        snapshot: await optimisticEntry(qc, { kind: 'update', entryId: entry.id, mediaId: entry.mediaId, vars }, entry.mediaId),
        vars,
      };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSuccess: (data) => writeSavedEntry(qc, data.SaveMediaListEntry),
    onSettled: (_d, _e, { entry }) => invalidateEntry(qc, entry.mediaId),
  });
}

export function useDeleteMediaListEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; mediaId?: number }) => deleteMediaListEntry(id),
    onMutate: async ({ id, mediaId }) => ({ snapshot: await optimisticEntry(qc, { kind: 'delete', entryId: id }, mediaId) }),
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSuccess: (_d, { mediaId }) => {
      if (mediaId != null) writeCardEntries(qc, mediaId, null);
    },
    onSettled: (_d, _e, { mediaId }) => invalidateEntry(qc, mediaId),
  });
}

export function useUpdateMediaListEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateMediaListEntriesVariables) => updateMediaListEntries(vars),
    onSettled: () => invalidateEntry(qc, undefined),
  });
}

export function useDeleteCustomList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customList, type }: { customList: string; type: MediaType }) => deleteCustomList(customList, type),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.all() });
      qc.invalidateQueries({ queryKey: queryKeys.viewer.all() });
    },
  });
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

/** Pass `withFollowing: true` only when logged in (anonymous requests ignore isFollowing). */
export function useMediaDetail(vars: MediaDetailVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.media.detail(vars),
    queryFn: ({ signal }) =>
      fetchMediaDetail(vars, { signal }).then((d) =>
        d?.Media ? { ...d, Media: reconcileFavourite('media', d.Media.id, d.Media) } : d,
      ),
    ...opts,
  });
}

export function useMediaCharacters(vars: Omit<MediaCharactersVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.characters(vars),
    (page, signal) => fetchMediaCharacters({ ...vars, page }, { signal }),
    (d) => d.Media?.characters?.pageInfo,
    opts,
  );
}

export function useMediaStaff(vars: Omit<MediaStaffVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.staff(vars),
    (page, signal) => fetchMediaStaff({ ...vars, page }, { signal }),
    (d) => d.Media?.staff?.pageInfo,
    opts,
  );
}

export function useMediaRecommendations(vars: Omit<MediaRecommendationsVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.recommendations(vars),
    (page, signal) => fetchMediaRecommendations({ ...vars, page }, { signal }),
    (d) => d.Media?.recommendations?.pageInfo,
    opts,
  );
}

export function useMediaReviews(vars: Omit<MediaReviewsVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.reviews(vars),
    (page, signal) => fetchMediaReviews({ ...vars, page }, { signal }),
    (d) => d.Media?.reviews?.pageInfo,
    opts,
  );
}

export function useMediaStats(id: number, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.media.stats(id),
    queryFn: ({ signal }) => fetchMediaStats(id, { signal }),
    ...opts,
  });
}

export function useMediaAiringSchedule(id: number, notYetAired?: boolean, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.airing(id, notYetAired),
    (page, signal) => fetchMediaAiringSchedule({ id, page, notYetAired }, { signal }),
    (d) => d.Media?.airingSchedule?.pageInfo,
    opts,
  );
}

/** Following users' statuses for a media. Enable only when logged in. */
export function useMediaFollowing(mediaId: number, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.media.following(mediaId),
    (page, signal) => fetchMediaFollowing({ mediaId, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useSaveRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaveRecommendationVariables) => saveRecommendation(vars),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: [...queryKeys.media.byId(vars.mediaId), 'recommendations'] });
      qc.invalidateQueries({ queryKey: [...queryKeys.media.byId(vars.mediaId), 'detail'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Explore
// ---------------------------------------------------------------------------

export function useExploreHome(vars: ExploreHomeVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.explore.home(vars),
    queryFn: ({ signal }) => fetchExploreHome(vars, { signal }),
    staleTime: 10 * 60_000,
    ...opts,
  });
}

export function useMediaSearch(vars: Omit<MediaSearchVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.search(vars),
    (page, signal) => searchMedia({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useGenreCollection() {
  return useQuery({
    queryKey: queryKeys.explore.genres(),
    queryFn: ({ signal }) => fetchGenreCollection({ signal }),
    select: (d) => (d.GenreCollection ?? []).filter((g): g is string => !!g),
    staleTime: 24 * 60 * 60_000,
  });
}

export function useMediaTagCollection() {
  return useQuery({
    queryKey: queryKeys.explore.tags(),
    queryFn: ({ signal }) => fetchMediaTagCollection({ signal }),
    select: (d) => (d.MediaTagCollection ?? []).filter((t) => t != null),
    staleTime: 24 * 60 * 60_000,
  });
}

export function useAiringSchedules(vars: Omit<AiringSchedulesVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.airing(vars),
    (page, signal) => fetchAiringSchedules({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useCharacterSearch(vars: Omit<CharacterSearchVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.characters(vars),
    (page, signal) => searchCharacters({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useStaffSearch(vars: Omit<StaffSearchVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.staff(vars),
    (page, signal) => searchStaff({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useStudioSearch(vars: Omit<StudioSearchVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.studios(vars),
    (page, signal) => searchStudios({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useUserSearch(vars: Omit<UserSearchVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.explore.users(vars),
    (page, signal) => searchUsers({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

// ---------------------------------------------------------------------------
// Character / Staff / Studio
// ---------------------------------------------------------------------------

export function useCharacter(vars: CharacterVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.character.detail(vars),
    queryFn: ({ signal }) =>
      fetchCharacter(vars, { signal }).then((d) =>
        d?.Character ? { ...d, Character: reconcileFavourite('character', d.Character.id, d.Character) } : d,
      ),
    ...opts,
  });
}

export function useCharacterMedia(vars: Omit<CharacterVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.character.media(vars),
    (page, signal) => fetchCharacterMedia({ ...vars, page }, { signal }),
    (d) => d.Character?.media?.pageInfo,
    opts,
  );
}

export function useStaff(vars: StaffVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.staff.detail(vars),
    queryFn: ({ signal }) =>
      fetchStaff(vars, { signal }).then((d) =>
        d?.Staff ? { ...d, Staff: reconcileFavourite('staff', d.Staff.id, d.Staff) } : d,
      ),
    ...opts,
  });
}

export function useStaffCharacterMedia(vars: Omit<StaffCharacterMediaVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.staff.characterMedia(vars),
    (page, signal) => fetchStaffCharacterMedia({ ...vars, page }, { signal }),
    (d) => d.Staff?.characterMedia?.pageInfo,
    opts,
  );
}

export function useStaffStaffMedia(vars: Omit<StaffStaffMediaVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.staff.staffMedia(vars),
    (page, signal) => fetchStaffStaffMedia({ ...vars, page }, { signal }),
    (d) => d.Staff?.staffMedia?.pageInfo,
    opts,
  );
}

/** Studio info + paged media (studio fields are repeated on every page). */
export function useStudio(vars: Omit<StudioVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.studio.detail(vars),
    (page, signal) =>
      fetchStudio({ ...vars, page }, { signal }).then((d) =>
        d?.Studio ? { ...d, Studio: reconcileFavourite('studio', d.Studio.id, d.Studio) } : d,
      ),
    (d) => d.Studio?.media?.pageInfo,
    opts,
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function useUserProfile(vars: UserProfileVariables, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.user.profile(vars),
    queryFn: ({ signal }) => fetchUserProfile(vars, { signal }),
    ...opts,
    enabled: (opts.enabled ?? true) && (vars.id != null || !!vars.name),
  });
}

export function useUserFavourites<K extends FavouriteKind>(
  id: number | null | undefined,
  kind: K,
  perPage = 25,
  opts: QueryOpts = {},
) {
  return useAniInfinite(
    queryKeys.user.favourites(id ?? -1, kind, perPage),
    (page, signal) => fetchUserFavourites(kind, { id: id!, page, perPage }, { signal }),
    (d) => d.User?.favourites?.[kind]?.pageInfo,
    { ...opts, enabled: (opts.enabled ?? true) && id != null },
  );
}

export function useUserFavouritesOverview(id: number | null | undefined, perPage?: number, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.user.favouritesOverview(id ?? -1, perPage),
    queryFn: ({ signal }) => fetchUserFavouritesOverview(id!, perPage, { signal }),
    ...opts,
    enabled: (opts.enabled ?? true) && id != null,
  });
}

export function useUserStatistics(id: number | null | undefined, type: MediaType, limit?: number, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.user.statistics(id ?? -1, type, limit),
    queryFn: ({ signal }) => fetchUserStatistics(type, { id: id!, limit }, { signal }),
    staleTime: 10 * 60_000,
    ...opts,
    enabled: (opts.enabled ?? true) && id != null,
  });
}

export function useUserActivityHistory(id: number | null | undefined, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.user.activityHistory(id ?? -1),
    queryFn: ({ signal }) => fetchUserActivityHistory(id!, { signal }),
    select: (d) => (d.User?.stats?.activityHistory ?? []).filter((x) => x != null),
    staleTime: 10 * 60_000,
    ...opts,
    enabled: (opts.enabled ?? true) && id != null,
  });
}

export function useFollowers(vars: Omit<FollowListVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.user.followers(vars),
    (page, signal) => fetchFollowers({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useFollowing(vars: Omit<FollowListVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.user.following(vars),
    (page, signal) => fetchFollowing({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: number }) => toggleFollow(userId),
    onMutate: async ({ userId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.user.profiles() });
      const snapshot: Snapshot = [];
      for (const [key, data] of qc.getQueriesData<UserProfileQuery>({ queryKey: queryKeys.user.profiles() })) {
        if (data?.User?.id !== userId) continue;
        snapshot.push([key, data]);
        qc.setQueryData(key, { User: { ...data.User, isFollowing: !data.User.isFollowing } });
      }
      return { snapshot };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSuccess: (data) => {
      const u = data.ToggleFollow;
      if (!u) return;
      for (const [key, d] of qc.getQueriesData<UserProfileQuery>({ queryKey: queryKeys.user.profiles() })) {
        if (d?.User?.id === u.id) qc.setQueryData(key, { User: { ...d.User, isFollowing: u.isFollowing, isFollower: u.isFollower } });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user.all() });
      qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() });
    },
  });
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export function useActivities(vars: Omit<ActivitiesVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.activity.feed(vars),
    (page, signal) => fetchActivities({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useActivity(id: number, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.activity.detail(id),
    queryFn: ({ signal }) => fetchActivity(id, { signal }),
    select: (d) => d.Activity,
    ...opts,
  });
}

export function useActivityReplies(activityId: number, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.activity.replies(activityId),
    (page, signal) => fetchActivityReplies({ activityId, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useLikes(likeableId: number, type: LikeableType, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.activity.likes(likeableId, type),
    (page, signal) => fetchLikes({ likeableId, type, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

type FeedData = InfiniteData<ActivitiesQuery>;
type RepliesData = InfiniteData<ActivityRepliesQuery>;

/** Maps an activity (by id) across feeds and the detail cache. Returns a snapshot for rollback. */
function mapActivityCaches(qc: QueryClient, id: number, fn: (a: Activity) => Activity | null): Snapshot {
  const snapshot: Snapshot = [];
  for (const [key, data] of qc.getQueriesData<FeedData>({ queryKey: queryKeys.activity.feeds() })) {
    if (!data?.pages) continue;
    snapshot.push([key, data]);
    qc.setQueryData<FeedData>(key, {
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        Page: {
          ...p.Page,
          activities:
            p.Page.activities?.flatMap((a) => {
              if (!a || a.id !== id) return [a];
              const next = fn(a);
              return next ? [next] : [];
            }) ?? null,
        },
      })),
    });
  }
  const detailKey = queryKeys.activity.detail(id);
  const detail = qc.getQueryData<{ Activity: Activity | null }>(detailKey);
  if (detail?.Activity) {
    snapshot.push([detailKey, detail]);
    qc.setQueryData(detailKey, { Activity: fn(detail.Activity) });
  }
  return snapshot;
}

function mapReplyCaches(qc: QueryClient, replyId: number, fn: (r: ActivityReply) => ActivityReply | null): Snapshot {
  const snapshot: Snapshot = [];
  for (const [key, data] of qc.getQueriesData<RepliesData>({ queryKey: [ROOT, 'activity', 'replies'] })) {
    if (!data?.pages) continue;
    snapshot.push([key, data]);
    qc.setQueryData<RepliesData>(key, {
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        Page: {
          ...p.Page,
          activityReplies:
            p.Page.activityReplies?.flatMap((r) => {
              if (!r || r.id !== replyId) return [r];
              const next = fn(r);
              return next ? [next] : [];
            }) ?? null,
        },
      })),
    });
  }
  return snapshot;
}

const flipLike = <T extends { isLiked: boolean | null; likeCount: number }>(x: T): T => ({
  ...x,
  isLiked: !x.isLiked,
  likeCount: Math.max(0, x.likeCount + (x.isLiked ? -1 : 1)),
});

/** Like/unlike an activity or reply (optimistic). Threads/comments are sent but not cached here. */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; type: LikeableType }) => toggleLike(vars),
    onMutate: async ({ id, type }) => {
      await qc.cancelQueries({ queryKey: queryKeys.activity.all() });
      const snapshot =
        type === 'ACTIVITY'
          ? mapActivityCaches(qc, id, flipLike)
          : type === 'ACTIVITY_REPLY'
            ? mapReplyCaches(qc, id, flipLike)
            : [];
      return { snapshot };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSuccess: (data, { id, type }) => {
      const r = data.ToggleLikeV2;
      if (!r) return;
      const set = <T extends { isLiked: boolean | null; likeCount: number }>(x: T): T => ({
        ...x,
        isLiked: r.isLiked,
        likeCount: r.likeCount,
      });
      if (type === 'ACTIVITY') mapActivityCaches(qc, id, set);
      if (type === 'ACTIVITY_REPLY') mapReplyCaches(qc, id, set);
    },
    onSettled: (_d, _e, { id, type }) => qc.invalidateQueries({ queryKey: queryKeys.activity.likes(id, type) }),
  });
}

export function useSaveTextActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaveTextActivityVariables) => saveTextActivity(vars),
    onSettled: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() });
      if (data?.SaveTextActivity) qc.invalidateQueries({ queryKey: queryKeys.activity.detail(data.SaveTextActivity.id) });
    },
  });
}

export function useSaveMessageActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaveMessageActivityVariables) => saveMessageActivity(vars),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() }),
  });
}

export function useSaveActivityReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaveActivityReplyVariables) => saveActivityReply(vars),
    onSuccess: (_d, vars) => {
      if (vars.id == null && vars.activityId != null) {
        mapActivityCaches(qc, vars.activityId, (a) => ({ ...a, replyCount: a.replyCount + 1 }));
      }
    },
    onSettled: (data, _e, vars) => {
      const activityId = vars.activityId ?? data?.SaveActivityReply?.activityId ?? undefined;
      if (activityId != null) {
        qc.invalidateQueries({ queryKey: queryKeys.activity.replies(activityId) });
        qc.invalidateQueries({ queryKey: queryKeys.activity.detail(activityId) });
      }
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteActivity(id),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: queryKeys.activity.feeds() });
      return { snapshot: mapActivityCaches(qc, id, () => null) };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() }),
  });
}

export function useDeleteActivityReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; activityId?: number }) => deleteActivityReply(id),
    onMutate: async ({ id, activityId }) => {
      const snapshot = mapReplyCaches(qc, id, () => null);
      if (activityId != null) {
        snapshot.push(...mapActivityCaches(qc, activityId, (a) => ({ ...a, replyCount: Math.max(0, a.replyCount - 1) })));
      }
      return { snapshot };
    },
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSettled: (_d, _e, { activityId }) => {
      if (activityId != null) qc.invalidateQueries({ queryKey: queryKeys.activity.replies(activityId) });
    },
  });
}

export function useToggleActivitySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToggleActivitySubscriptionVariables) => toggleActivitySubscription(vars),
    onMutate: async ({ activityId, subscribe }) => ({
      snapshot: mapActivityCaches(qc, activityId, (a) => ({ ...a, isSubscribed: subscribe })),
    }),
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
  });
}

export function useToggleActivityPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToggleActivityPinVariables) => toggleActivityPin(vars),
    onMutate: async ({ id, pinned }) => ({ snapshot: mapActivityCaches(qc, id, (a) => ({ ...a, isPinned: pinned })) }),
    onError: (_e, _v, ctx) => restore(qc, ctx?.snapshot),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() }),
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function useNotifications(vars: Omit<NotificationsVariables, 'page'>, opts?: QueryOpts) {
  const qc = useQueryClient();
  return useAniInfinite(
    queryKeys.notifications.list(vars),
    async (page, signal) => {
      const data = await fetchNotifications({ ...vars, page }, { signal });
      if (vars.resetNotificationCount && page === 1) {
        qc.setQueryData(queryKeys.viewer.unreadCount(), (old: { Viewer: { id: number; unreadNotificationCount: number | null } | null } | undefined) =>
          old?.Viewer ? { Viewer: { ...old.Viewer, unreadNotificationCount: 0 } } : old,
        );
      }
      return data;
    },
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useResetNotificationCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetNotificationCount(),
    onSuccess: () => {
      qc.setQueryData(queryKeys.viewer.unreadCount(), (old: { Viewer: { id: number; unreadNotificationCount: number | null } | null } | undefined) =>
        old?.Viewer ? { Viewer: { ...old.Viewer, unreadNotificationCount: 0 } } : old,
      );
      qc.setQueryData<ViewerQuery>(queryKeys.viewer.detail(), (old) =>
        old?.Viewer ? { Viewer: { ...old.Viewer, unreadNotificationCount: 0 } } : old,
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

function favouriteDetailPrefix(target: FavouriteTarget): QueryKey {
  switch (target.kind) {
    case 'anime':
    case 'manga':
      return [...queryKeys.media.byId(target.id), 'detail'];
    case 'character':
      return [...queryKeys.character.byId(target.id), 'detail'];
    case 'staff':
      return [...queryKeys.staff.byId(target.id), 'detail'];
    case 'studio':
      return [...queryKeys.studio.byId(target.id), 'detail'];
  }
}

/** Caches holding `isFavourite` for a target: its detail page, plus the entry editor for media. */
function favouritePrefixes(target: FavouriteTarget): QueryKey[] {
  const prefixes = [favouriteDetailPrefix(target)];
  if (target.kind === 'anime' || target.kind === 'manga') prefixes.push(queryKeys.lists.entry(target.id));
  return prefixes;
}

/**
 * AniList keeps serving the old `isFavourite` / `favourites` for a while after ToggleFavourite
 * (its responses are cached), so an immediate refetch would undo the optimistic flip. Remember
 * what each successful toggle set and correct detail responses that disagree until it expires.
 */
const FAVOURITE_OVERRIDE_MS = 10 * 60_000;
const favouriteOverrides = new Map<string, { isFavourite: boolean; until: number }>();

function favouriteOverrideKey(kind: FavouriteTarget['kind'] | 'media', id: number): string {
  return `${kind === 'anime' || kind === 'manga' ? 'media' : kind}:${id}`;
}

/** Applies a recent toggle to a fetched detail node whose favourite state is still stale. */
export function reconcileFavourite<T extends { isFavourite: boolean; favourites?: number | null }>(
  kind: FavouriteTarget['kind'] | 'media',
  id: number,
  node: T,
  now: number = Date.now(),
): T {
  const key = favouriteOverrideKey(kind, id);
  const override = favouriteOverrides.get(key);
  if (!override) return node;
  if (override.until < now) {
    favouriteOverrides.delete(key);
    return node;
  }
  if (node.isFavourite === override.isFavourite) return node;
  const delta = override.isFavourite ? 1 : -1;
  return {
    ...node,
    isFavourite: override.isFavourite,
    favourites: node.favourites == null ? node.favourites : Math.max(0, node.favourites + delta),
  };
}

export function rememberFavouriteToggle(target: FavouriteTarget, isFavourite: boolean, now: number = Date.now()) {
  favouriteOverrides.set(favouriteOverrideKey(target.kind, target.id), { isFavourite, until: now + FAVOURITE_OVERRIDE_MS });
}

function forgetFavouriteToggle(target: FavouriteTarget) {
  favouriteOverrides.delete(favouriteOverrideKey(target.kind, target.id));
}

/** The cached `isFavourite` of a target's detail data, if any. */
function cachedIsFavourite(target: FavouriteTarget, data: unknown): boolean | undefined {
  switch (target.kind) {
    case 'anime':
    case 'manga':
      return (data as MediaDetailQuery | undefined)?.Media?.isFavourite;
    case 'character':
      return (data as CharacterQuery | undefined)?.Character?.isFavourite;
    case 'staff':
      return (data as StaffQuery | undefined)?.Staff?.isFavourite;
    case 'studio':
      return (data as InfiniteData<StudioQuery> | undefined)?.pages?.[0]?.Studio?.isFavourite;
  }
}

function flipFavourite(target: FavouriteTarget, data: unknown): unknown {
  const flip = <T extends { isFavourite: boolean; favourites?: number | null }>(x: T): T => ({
    ...x,
    isFavourite: !x.isFavourite,
    favourites: x.favourites == null ? x.favourites : Math.max(0, x.favourites + (x.isFavourite ? -1 : 1)),
  });
  switch (target.kind) {
    case 'anime':
    case 'manga': {
      const d = data as MediaDetailQuery | undefined;
      return d?.Media ? { ...d, Media: flip(d.Media) } : d;
    }
    case 'character': {
      const d = data as CharacterQuery | undefined;
      return d?.Character ? { Character: flip(d.Character) } : d;
    }
    case 'staff': {
      const d = data as StaffQuery | undefined;
      return d?.Staff ? { Staff: flip(d.Staff) } : d;
    }
    case 'studio': {
      const d = data as InfiniteData<StudioQuery> | undefined;
      if (!d?.pages) return d;
      return { ...d, pages: d.pages.map((p) => (p.Studio ? { Studio: flip(p.Studio) } : p)) };
    }
  }
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: FavouriteTarget) => toggleFavourite(target),
    onMutate: async (target) => {
      const prefixes = favouritePrefixes(target);
      await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
      const snapshot: Snapshot = [];
      let next: boolean | undefined;
      for (const queryKey of prefixes) {
        for (const [key, data] of qc.getQueriesData({ queryKey })) {
          snapshot.push([key, data]);
          const current = cachedIsFavourite(target, data);
          if (next === undefined && current !== undefined) next = !current;
          qc.setQueryData(key, flipFavourite(target, data));
        }
      }
      return { snapshot, next };
    },
    onSuccess: (_d, target, ctx) => {
      if (ctx?.next !== undefined) rememberFavouriteToggle(target, ctx.next);
    },
    onError: (_e, target, ctx) => {
      forgetFavouriteToggle(target);
      restore(qc, ctx?.snapshot);
    },
    onSettled: (_d, _e, target) => {
      for (const queryKey of favouritePrefixes(target)) qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: queryKeys.user.all() });
    },
  });
}

export function useUpdateFavouriteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateFavouriteOrderVariables) => updateFavouriteOrder(vars),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.user.all() }),
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** UpdateUser. Optimistically merges simple options into the cached Viewer. */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateUserVariables) => updateUser(vars),
    onMutate: async (vars) => {
      const key = queryKeys.viewer.detail();
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ViewerQuery>(key);
      if (prev?.Viewer) {
        const v = prev.Viewer;
        const options = v.options ? { ...v.options } : null;
        if (options) {
          if (vars.titleLanguage) options.titleLanguage = vars.titleLanguage;
          if (vars.staffNameLanguage) options.staffNameLanguage = vars.staffNameLanguage;
          if (vars.displayAdultContent != null) options.displayAdultContent = vars.displayAdultContent;
          if (vars.airingNotifications != null) options.airingNotifications = vars.airingNotifications;
          if (vars.profileColor) options.profileColor = vars.profileColor;
          if (vars.timezone) options.timezone = vars.timezone;
          if (vars.activityMergeTime != null) options.activityMergeTime = vars.activityMergeTime;
          if (vars.restrictMessagesToFollowing != null) options.restrictMessagesToFollowing = vars.restrictMessagesToFollowing;
          if (vars.notificationOptions) options.notificationOptions = vars.notificationOptions;
          if (vars.disabledListActivity) options.disabledListActivity = vars.disabledListActivity;
        }
        const mlo = v.mediaListOptions ? { ...v.mediaListOptions } : null;
        if (mlo) {
          if (vars.scoreFormat) mlo.scoreFormat = vars.scoreFormat;
          if (vars.rowOrder) mlo.rowOrder = vars.rowOrder;
          if (vars.animeListOptions && mlo.animeList) {
            const { theme: _t, ...rest } = vars.animeListOptions;
            mlo.animeList = { ...mlo.animeList, ...rest };
          }
          if (vars.mangaListOptions && mlo.mangaList) {
            const { theme: _t, ...rest } = vars.mangaListOptions;
            mlo.mangaList = { ...mlo.mangaList, ...rest };
          }
        }
        qc.setQueryData<ViewerQuery>(key, {
          Viewer: { ...v, about: vars.about ?? v.about, options, mediaListOptions: mlo },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.viewer.detail(), ctx.prev);
    },
    onSuccess: (data) => {
      if (data.UpdateUser) qc.setQueryData<ViewerQuery>(queryKeys.viewer.detail(), { Viewer: data.UpdateUser });
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.viewer.all() });
      // Score format, custom lists, section order and title language change list rendering.
      if (vars.scoreFormat || vars.animeListOptions || vars.mangaListOptions || vars.rowOrder || vars.titleLanguage) {
        qc.invalidateQueries({ queryKey: queryKeys.lists.all() });
      }
      if (vars.titleLanguage || vars.staffNameLanguage || vars.displayAdultContent != null) {
        qc.invalidateQueries({ queryKey: queryKeys.all });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function useReview(id: number, opts: QueryOpts = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(id),
    queryFn: ({ signal }) => fetchReview({ id }, { signal }),
    select: (d) => d.Review,
    ...opts,
  });
}

export function useReviews(vars: Omit<ReviewsVariables, 'page'>, opts?: QueryOpts) {
  return useAniInfinite(
    queryKeys.reviews.list(vars),
    (page, signal) => fetchReviews({ ...vars, page }, { signal }),
    (d) => d.Page.pageInfo,
    opts,
  );
}

export function useRateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: RateReviewVariables) => rateReview(vars),
    onSuccess: (data, { reviewId }) => {
      const r = data.RateReview;
      if (!r) return;
      qc.setQueryData(queryKeys.reviews.detail(reviewId), (old: { Review: object | null } | undefined) =>
        old?.Review ? { Review: { ...old.Review, rating: r.rating, ratingAmount: r.ratingAmount, userRating: r.userRating } } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all() }),
  });
}

export function useSaveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaveReviewVariables) => saveReview(vars),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      qc.invalidateQueries({ queryKey: queryKeys.media.byId(vars.mediaId) });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; mediaId?: number }) => deleteReview(id),
    onSettled: (_d, _e, { mediaId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      if (mediaId != null) qc.invalidateQueries({ queryKey: queryKeys.media.byId(mediaId) });
    },
  });
}
