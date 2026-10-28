import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { getSettings } from '@/settings/store';

import { getJSON, setJSON } from './storage';

/**
 * Local notifications:
 * - permission handling
 * - scheduling local airing reminders from a list of upcoming episodes
 * - a background task (expo-background-task) that refreshes the airing schedule for the
 *   user's Watching list and reschedules reminders, plus optional AniList-notification alerts.
 *
 * The data source is injected so this module stays independent from the API layer:
 *
 *   // at module scope of the API/notifications integration file (NOT inside a component),
 *   // so it is also set when the OS wakes the app for a background run:
 *   setAiringFetcher(fetchAiringForWatching);
 *   setUnreadNotificationsFetcher(fetchUnreadNotifications); // optional
 *
 * Import this module from the root layout so `TaskManager.defineTask` runs at startup.
 */

export type AiringItem = {
  mediaId: number;
  title: string;
  episode: number;
  /** UNIX seconds. */
  airingAt: number;
  /** Optional cover url (not shown by all platforms). */
  coverImage?: string | null;
};

export type AiringFetcher = () => Promise<AiringItem[]>;

export type UnreadNotification = { id: number; title: string; body?: string; url?: string };
export type UnreadNotificationsFetcher = () => Promise<UnreadNotification[]>;

export const AIRING_CHANNEL_ID = 'airing';
export const ANILIST_CHANNEL_ID = 'anilist';
export const BACKGROUND_TASK_NAME = 'qaraq-background-refresh';
const AIRING_ID_PREFIX = 'airing-';
/** iOS keeps at most 64 pending local notifications per app; leave headroom. */
const MAX_SCHEDULED = 60;
const SEEN_NOTIFICATIONS_KEY = 'qaraq.notifications.lastSeenId';

let airingFetcher: AiringFetcher | null = null;
let unreadFetcher: UnreadNotificationsFetcher | null = null;

export function setAiringFetcher(fn: AiringFetcher | null) {
  airingFetcher = fn;
}

export function setUnreadNotificationsFetcher(fn: UnreadNotificationsFetcher | null) {
  unreadFetcher = fn;
}

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// ---------------------------------------------------------------------------
// Setup & permissions
// ---------------------------------------------------------------------------

let configured = false;

/** Foreground presentation + Android channels. Safe to call multiple times. */
export async function configureNotifications(): Promise<void> {
  if (!isNative || configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(AIRING_CHANNEL_ID, {
      name: 'Airing episodes',
      description: 'Reminders when episodes from your list air',
      importance: AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync(ANILIST_CHANNEL_ID, {
      name: 'AniList notifications',
      description: 'Likes, replies, follows, messages and media updates from AniList',
      importance: AndroidImportance.DEFAULT,
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function toState(p: Notifications.NotificationPermissionsStatus): PermissionState {
  if (p.granted) return 'granted';
  const ios = p.ios?.status;
  if (ios === IosAuthorizationStatus.PROVISIONAL || ios === IosAuthorizationStatus.EPHEMERAL)
    return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export async function getNotificationPermission(): Promise<PermissionState> {
  if (!isNative) return 'denied';
  return toState(await Notifications.getPermissionsAsync());
}

/** Ask for permission if not determined yet. Returns the final state. */
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!isNative) return 'denied';
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (toState(current) === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return toState(next);
}

// ---------------------------------------------------------------------------
// Airing reminders
// ---------------------------------------------------------------------------

export function airingNotificationId(mediaId: number, episode: number) {
  return `${AIRING_ID_PREFIX}${mediaId}-${episode}`;
}

export type PlanOptions = {
  minutesBefore: number;
  mutedMediaIds: readonly number[];
  /** UNIX seconds. */
  now?: number;
  max?: number;
};

export type PlannedNotification = AiringItem & { id: string; fireAt: number };

/**
 * Pure planning step: which reminders to schedule, sorted by fire time, deduplicated,
 * skipping muted shows and anything in the past, capped to `max`.
 */
export function planAiringNotifications(items: readonly AiringItem[], opts: PlanOptions): PlannedNotification[] {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const muted = new Set(opts.mutedMediaIds);
  const seen = new Set<string>();
  const planned: PlannedNotification[] = [];
  for (const item of items) {
    if (muted.has(item.mediaId)) continue;
    const fireAt = item.airingAt - Math.max(0, opts.minutesBefore) * 60;
    if (fireAt <= now + 5) continue;
    const id = airingNotificationId(item.mediaId, item.episode);
    if (seen.has(id)) continue;
    seen.add(id);
    planned.push({ ...item, id, fireAt });
  }
  planned.sort((a, b) => a.fireAt - b.fireAt);
  return planned.slice(0, opts.max ?? MAX_SCHEDULED);
}

function airingBody(item: AiringItem, minutesBefore: number) {
  if (minutesBefore <= 0) return `Episode ${item.episode} just aired.`;
  const label =
    minutesBefore >= 60 && minutesBefore % 60 === 0
      ? `${minutesBefore / 60} hour${minutesBefore === 60 ? '' : 's'}`
      : `${minutesBefore} minutes`;
  return `Episode ${item.episode} airs in ${label}.`;
}

/** Cancel every scheduled airing reminder. */
export async function cancelAiringNotifications(): Promise<void> {
  if (!isNative) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(AIRING_ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Cancel reminders for one show (e.g. when muted or removed from Watching). */
export async function cancelAiringNotificationsFor(mediaId: number): Promise<void> {
  if (!isNative) return;
  const prefix = `${AIRING_ID_PREFIX}${mediaId}-`;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Replace all scheduled airing reminders with the given items (respecting settings).
 * Returns the number of reminders scheduled.
 */
export async function scheduleAiringNotifications(items: readonly AiringItem[]): Promise<number> {
  if (!isNative) return 0;
  const { airing } = getSettings().notifications;
  await cancelAiringNotifications();
  if (!airing.enabled) return 0;
  if ((await getNotificationPermission()) !== 'granted') return 0;
  await configureNotifications();

  const plan = planAiringNotifications(items, {
    minutesBefore: airing.minutesBefore,
    mutedMediaIds: airing.mutedMediaIds,
  });

  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: {
        title: n.title,
        body: airingBody(n, airing.minutesBefore),
        data: { kind: 'airing', mediaId: n.mediaId, episode: n.episode, url: `qaraq://media/${n.mediaId}` },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.fireAt * 1000,
        channelId: AIRING_CHANNEL_ID,
      },
    });
  }
  return plan.length;
}

/** Fetch via the injected fetcher and reschedule. Returns scheduled count (0 if no fetcher). */
export async function refreshAiringNotifications(): Promise<number> {
  if (!airingFetcher) return 0;
  const items = await airingFetcher();
  return scheduleAiringNotifications(items);
}

// ---------------------------------------------------------------------------
// AniList notifications -> local alerts (background)
// ---------------------------------------------------------------------------

async function alertNewAniListNotifications(): Promise<void> {
  const s = getSettings().notifications;
  if (!unreadFetcher || !s.anilistAlerts) return;
  if ((await getNotificationPermission()) !== 'granted') return;
  const unread = await unreadFetcher();
  const stored = getJSON<number>(SEEN_NOTIFICATIONS_KEY);
  if (stored == null) {
    // First run (fresh install / first sign-in): record a baseline instead of re-alerting the
    // whole existing notification history.
    setJSON(SEEN_NOTIFICATIONS_KEY, unread.reduce((m, n) => Math.max(m, n.id), 0));
    return;
  }
  const lastSeen = stored;
  const fresh = unread.filter((n) => n.id > lastSeen).slice(0, 10);
  for (const n of fresh) {
    await Notifications.scheduleNotificationAsync({
      identifier: `anilist-${n.id}`,
      content: { title: n.title, body: n.body, data: { kind: 'anilist', id: n.id, url: n.url } },
      trigger: Platform.OS === 'android' ? { channelId: ANILIST_CHANNEL_ID } : null,
    });
  }
  const maxId = unread.reduce((m, n) => Math.max(m, n.id), lastSeen);
  setJSON(SEEN_NOTIFICATIONS_KEY, maxId);
}

/** Mark AniList notifications up to `id` as already alerted (call after viewing the list). */
export function markAniListNotificationsSeen(id: number) {
  const lastSeen = getJSON<number>(SEEN_NOTIFICATIONS_KEY) ?? 0;
  if (id > lastSeen) setJSON(SEEN_NOTIFICATIONS_KEY, id);
}

// ---------------------------------------------------------------------------
// Background task
// ---------------------------------------------------------------------------

if (isNative && !TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      await refreshAiringNotifications();
      await alertNewAniListNotifications();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/**
 * Register (or unregister) the periodic background refresh based on settings.
 * `minimumInterval` is in minutes; the OS decides the real cadence.
 */
export async function syncBackgroundTask(minimumIntervalMinutes = 60): Promise<boolean> {
  if (!isNative) return false;
  const s = getSettings().notifications;
  const wanted = s.airing.enabled || s.anilistAlerts;
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  if (!wanted) {
    if (registered) await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    return false;
  }
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  if (!registered) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, { minimumInterval: minimumIntervalMinutes });
  }
  return true;
}
