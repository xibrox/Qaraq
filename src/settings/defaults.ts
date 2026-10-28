import type {
  AccentColor,
  ActivityFeed,
  ActivityFilter,
  AiringNotificationStatus,
  AniListNotificationType,
  AppTab,
  ListDisplayMode,
  ListSectionKey,
  ListSortField,
  ListStatusSection,
  MediaType,
  PreferredTitle,
  ScoreType,
  Settings,
  SortDirection,
  SwipeAction,
  SwipeGestures,
  ThemeBackground,
  ToolbarStyle,
} from './types';

export const MEDIA_TYPES: readonly MediaType[] = ['ANIME', 'MANGA'];

export const APP_TABS: readonly AppTab[] = ['lists', 'explore', 'profile', 'settings'];

export const ACTIVITY_FEEDS: readonly ActivityFeed[] = ['mine', 'following', 'global'];

export const ACTIVITY_FILTERS: readonly ActivityFilter[] = ['all', 'list', 'text', 'messages'];

export const ACCENT_COLORS: readonly AccentColor[] = [
  'white',
  'blue',
  'cyan',
  'green',
  'lime',
  'yellow',
  'peach',
  'orange',
  'red',
  'crimson',
  'pink',
  'purple',
];

export const THEME_BACKGROUNDS: readonly ThemeBackground[] = [
  'black',
  'darkGray',
  'navy',
  'maroon',
  'purple',
  'light',
  'system',
];

export const TOOLBAR_STYLES: readonly ToolbarStyle[] = ['follow', 'glass', 'solid'];

export const PREFERRED_TITLES: readonly PreferredTitle[] = ['userPreferred', 'english', 'romaji', 'native'];

export const SWIPE_ACTIONS: readonly SwipeAction[] = ['increment', 'customList', 'delete'];

export const SCORE_TYPES: readonly ScoreType[] = ['smiley', 'star'];

export const LIST_DISPLAY_MODES: readonly ListDisplayMode[] = ['list', 'grid'];

export const LIST_SORT_FIELDS: readonly ListSortField[] = [
  'lastUpdated',
  'lastAdded',
  'title',
  'score',
  'progress',
  'startDate',
  'completedDate',
  'releaseDate',
  'averageScore',
  'popularity',
];

export const SORT_DIRECTIONS: readonly SortDirection[] = ['asc', 'desc'];

/** My List chip order: "Watching", "Rewatching", "Completed", "Paused", "Planning", "Dropped". */
export const LIST_STATUS_SECTIONS: readonly ListStatusSection[] = [
  'CURRENT',
  'REPEATING',
  'COMPLETED',
  'PAUSED',
  'PLANNING',
  'DROPPED',
];

/** Notification Settings rows, in display order. */
export const AIRING_NOTIFICATION_STATUSES: readonly AiringNotificationStatus[] = [
  'CURRENT',
  'PLANNING',
  'COMPLETED',
  'DROPPED',
  'PAUSED',
];

export const ANILIST_NOTIFICATION_TYPES: readonly AniListNotificationType[] = [
  'AIRING',
  'ACTIVITY_MESSAGE',
  'ACTIVITY_REPLY',
  'FOLLOWING',
  'ACTIVITY_MENTION',
  'THREAD_COMMENT_MENTION',
  'THREAD_SUBSCRIBED',
  'THREAD_COMMENT_REPLY',
  'RELATED_MEDIA_ADDITION',
  'ACTIVITY_LIKE',
  'ACTIVITY_REPLY_LIKE',
  'THREAD_LIKE',
  'THREAD_COMMENT_LIKE',
  'ACTIVITY_REPLY_SUBSCRIBED',
  'MEDIA_DATA_CHANGE',
  'MEDIA_MERGE',
  'MEDIA_DELETION',
  'MEDIA_SUBMISSION_UPDATE',
  'STAFF_SUBMISSION_UPDATE',
  'CHARACTER_SUBMISSION_UPDATE',
];

/** Allowed values for an airing reminder lead-time picker (minutes). */
export const AIRING_MINUTES_BEFORE_OPTIONS = [0, 5, 10, 15, 30, 60, 120] as const;

/** AniClient defaults: right = "Increase Episode/Chapter", left = "Custom List". */
export const DEFAULT_SWIPE_GESTURES: Readonly<SwipeGestures> = Object.freeze({
  right: 'increment',
  left: 'customList',
});

function allTypes(value: boolean): Record<AniListNotificationType, boolean> {
  return Object.fromEntries(ANILIST_NOTIFICATION_TYPES.map((t) => [t, value])) as Record<
    AniListNotificationType,
    boolean
  >;
}

const defaultSectionOrder = (): ListSectionKey[] => [...LIST_STATUS_SECTIONS];

/** Build a fresh copy of the default settings (safe to mutate). */
export function createDefaultSettings(): Settings {
  return {
    defaultMediaType: 'ANIME',
    defaultTab: 'lists',
    defaultActivityFeed: 'following',
    defaultActivityFilter: 'all',

    accentColor: 'white',
    theme: 'black',

    blurAdultContent: true,
    haptics: { enabled: true, intensity: 'medium' },
    preferredTitle: 'userPreferred',
    toolbarStyle: 'follow',

    showAdultContent: false,

    swipe: {
      ANIME: { ...DEFAULT_SWIPE_GESTURES },
      MANGA: { ...DEFAULT_SWIPE_GESTURES },
    },

    displayMyActivityInFollowing: true,
    expandSummaryByDefault: false,
    hideMangaChapters: false,
    hideMangaVolumes: false,
    scoreType: 'star',

    listDisplayMode: { ANIME: 'list', MANGA: 'list' },
    listSort: {
      ANIME: { field: 'lastUpdated', direction: 'desc' },
      MANGA: { field: 'lastUpdated', direction: 'desc' },
    },
    listSectionOrder: { ANIME: defaultSectionOrder(), MANGA: defaultSectionOrder() },
    hiddenListSections: { ANIME: [], MANGA: [] },

    notifications: {
      airing: {
        enabled: true,
        statuses: { CURRENT: true, PLANNING: true, COMPLETED: false, DROPPED: false, PAUSED: false },
        minutesBefore: 0,
        mutedMediaIds: [],
      },
      anilistAlerts: true,
      types: allTypes(true),
      badge: true,
    },
  };
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze(createDefaultSettings());

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const oneOf =
  <T>(values: readonly T[]) =>
  (v: unknown): boolean =>
    values.includes(v as T);

/**
 * Enum-valued keys. A persisted value outside the allowed set (renamed option, older app
 * version) falls back to the default instead of leaking an unknown value into the UI.
 * Keys are matched by property name at any depth.
 */
const VALIDATORS: Record<string, (v: unknown) => boolean> = {
  defaultMediaType: oneOf(MEDIA_TYPES),
  defaultTab: oneOf(APP_TABS),
  defaultActivityFeed: oneOf(ACTIVITY_FEEDS),
  defaultActivityFilter: oneOf(ACTIVITY_FILTERS),
  accentColor: oneOf(ACCENT_COLORS),
  theme: oneOf(THEME_BACKGROUNDS),
  toolbarStyle: oneOf(TOOLBAR_STYLES),
  preferredTitle: oneOf(PREFERRED_TITLES),
  intensity: oneOf(['light', 'medium', 'strong'] as const),
  scoreType: oneOf(SCORE_TYPES),
  // swipe.<TYPE>.right / .left
  right: oneOf(SWIPE_ACTIONS),
  left: oneOf(SWIPE_ACTIONS),
  field: oneOf(LIST_SORT_FIELDS),
  direction: oneOf(SORT_DIRECTIONS),
};

/** listDisplayMode.ANIME/MANGA are keyed by media type, so validate them by parent key. */
const PARENT_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  listDisplayMode: oneOf(LIST_DISPLAY_MODES),
};

/**
 * Deep-merge persisted (possibly older/partial) settings onto defaults.
 * - keys missing from `persisted` take the default value (new settings appear automatically)
 * - unknown keys are dropped
 * - enum values are validated; arrays and primitives are replaced when the type matches
 */
export function mergeSettings(defaults: Settings, persisted: unknown): Settings {
  return mergeValue(defaults, persisted) as Settings;
}

function mergeValue(def: unknown, value: unknown, key?: string, parentKey?: string): unknown {
  if (value === undefined) return def;
  const validate = (key && VALIDATORS[key]) || (parentKey && PARENT_VALIDATORS[parentKey]) || undefined;
  if (validate && !isPlainObject(def)) return validate(value) ? value : def;
  if (Array.isArray(def)) return Array.isArray(value) ? value : def;
  if (isPlainObject(def)) {
    if (!isPlainObject(value)) return def;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def)) out[k] = mergeValue(def[k], value[k], k, key);
    return out;
  }
  if (def === null) return value === null || typeof value === 'string' ? value : def;
  return typeof value === typeof def ? value : def;
}
