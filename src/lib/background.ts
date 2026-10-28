/**
 * Glue between the API layer, auth and local notifications.
 *
 * Imported for its side effects from the root layout (src/app/_layout.tsx). Everything here runs
 * at module scope so it is also in place when the OS launches the JS bundle headlessly for a
 * background-task run (no React tree, no layout effects):
 * - `@/lib/notifications` defines the background task (TaskManager.defineTask).
 * - the airing / unread-notification fetchers are injected here.
 * - each fetcher awaits `bootstrapAuth()` first, because in a headless run nobody else has loaded
 *   the token from secure storage yet.
 */
import { describeNotification, fetchNotifications } from '@/api/notifications';
import { fetchWatchingAiring, toUpcomingEpisodes } from '@/api/airing';
import type { ActivityFeed as ApiActivityFeed, ActivityFilter as ApiActivityFilter } from '@/api/activity';
import type { MediaListStatus, MediaType, NotificationType } from '@/api/types';
import { bootstrapAuth, useAuthStore } from '@/auth/store';
import { getSettings } from '@/settings/store';
import type {
  ActivityFeed,
  ActivityFilter,
  AniListNotificationType,
  ListStatusSection,
  MediaType as SettingsMediaType,
} from '@/settings/types';

import { airingStatusesFromSettings } from './airing-statuses';
import {
  cancelAiringNotifications,
  setAiringFetcher,
  setUnreadNotificationsFetcher,
  type AiringItem,
  type UnreadNotification,
} from './notifications';

// ---------------------------------------------------------------------------
// Compile-time contract checks between src/settings and src/api.
// If one side changes an enum, `tsc` fails here instead of at runtime.
// ---------------------------------------------------------------------------
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type _ContractChecks = [
  Assert<Equal<ActivityFeed, ApiActivityFeed>>,
  Assert<Equal<ActivityFilter, ApiActivityFilter>>,
  Assert<Equal<AniListNotificationType, NotificationType>>,
  Assert<Equal<ListStatusSection, MediaListStatus>>,
  Assert<Equal<SettingsMediaType, MediaType>>,
];

async function signedInViewerId(): Promise<number | null> {
  await bootstrapAuth();
  const { status, viewerId } = useAuthStore.getState();
  return status === 'signedIn' ? viewerId : null;
}

/** Upcoming episodes for the signed-in user's entries in the statuses enabled in Notification Settings. */
export async function fetchAiringForWatching(): Promise<AiringItem[]> {
  const userId = await signedInViewerId();
  if (userId == null) return [];
  const s = getSettings();
  const status_in = airingStatusesFromSettings(s.notifications.airing.statuses);
  if (status_in.length === 0) return [];
  const data = await fetchWatchingAiring({ userId, status_in });
  return toUpcomingEpisodes(data, s.preferredTitle);
}

/** Unread AniList notifications (does NOT reset the unread counter), filtered by type toggles. */
export async function fetchUnreadAniListNotifications(): Promise<UnreadNotification[]> {
  const userId = await signedInViewerId();
  if (userId == null) return [];
  const s = getSettings();
  const enabled = (Object.keys(s.notifications.types) as AniListNotificationType[]).filter(
    (t) => s.notifications.types[t],
  );
  if (enabled.length === 0) return [];
  const data = await fetchNotifications({ page: 1, perPage: 25, type_in: enabled, resetNotificationCount: false });
  const out: UnreadNotification[] = [];
  for (const n of data.Page.notifications ?? []) {
    if (!n) continue;
    const d = describeNotification(n, s.preferredTitle);
    out.push({ id: n.id, title: d.title, body: d.body, url: d.url });
  }
  return out;
}

setAiringFetcher(fetchAiringForWatching);
setUnreadNotificationsFetcher(fetchUnreadAniListNotifications);

// Reminders belong to the account: drop them when the user signs out.
useAuthStore.subscribe((state, prev) => {
  if (prev.status === 'signedIn' && state.status === 'signedOut') void cancelAiringNotifications();
});
