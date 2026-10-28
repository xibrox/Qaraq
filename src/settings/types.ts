/**
 * Local (device) settings for Qaraq, persisted in MMKV.
 *
 * The shape mirrors AniClient's Settings screens (docs/aniclient-ui-spec.md §8):
 * General (App Launch Defaults, Appearance, Preferences), Gestures, More Settings and
 * Notification Settings. AniList account settings (scoring system, 18+ content, custom lists)
 * live on the server and are edited through the API layer; `showAdultContent` is the local
 * mirror used for filtering.
 */

export type MediaType = 'ANIME' | 'MANGA';

export type PerMediaType<T> = Record<MediaType, T>;

/** The four root tabs, in tab-bar order. */
export type AppTab = 'lists' | 'explore' | 'profile' | 'settings';

/** Profile activity feed ("Activity Feed Type" menu): "My Activity", "Following", "Global". */
export type ActivityFeed = 'mine' | 'following' | 'global';

/** Profile activity filter: "All", "List Progress", "Text Status", "Messages". */
export type ActivityFilter = 'all' | 'list' | 'text' | 'messages';

/** "Color" setting: the 12 AniClient accents (all free in Qaraq). */
export type AccentColor =
  | 'white'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'peach'
  | 'orange'
  | 'red'
  | 'crimson'
  | 'pink'
  | 'purple';

/**
 * "Theme" setting: AniClient's dark backgrounds plus two Qaraq extras.
 * `system` follows the OS (black when dark, light when light).
 */
export type ThemeBackground = 'black' | 'darkGray' | 'navy' | 'maroon' | 'purple' | 'light' | 'system';

/**
 * "Toolbar Style":
 * - `follow`: follow the platform (Liquid Glass on iOS 26+, solid elsewhere). Default.
 * - `glass`: glass everywhere it can be drawn (Liquid Glass, else a translucent blur/tint).
 * - `solid`: opaque bars filled with the theme header colour.
 */
export type ToolbarStyle = 'follow' | 'glass' | 'solid';

/** "Preferred Title": "Default" (AniList title setting), "English", "Romaji", "Native". */
export type PreferredTitle = 'userPreferred' | 'english' | 'romaji' | 'native';

/** Character/staff name preference used by `pickName` (derived from the title preference). */
export type PreferredStaffName = 'userPreferred' | 'romaji' | 'romajiWestern' | 'native';

export type HapticIntensity = 'light' | 'medium' | 'strong';

export type HapticsSetting = {
  /** "Vibration". */
  enabled: boolean;
  intensity: HapticIntensity;
};

/** Row swipe actions ("Increase Episode" / "Increase Chapter", "Custom List", "Delete"). */
export type SwipeAction = 'increment' | 'customList' | 'delete';

/** `right` = finger moves left to right (leading actions); `left` = trailing actions. */
export type SwipeDirection = 'right' | 'left';

export type SwipeGestures = Record<SwipeDirection, SwipeAction>;

/** "Score Type" (More Settings > Search). */
export type ScoreType = 'smiley' | 'star';

export type ListDisplayMode = 'list' | 'grid';

export type ListSortField =
  | 'lastUpdated'
  | 'lastAdded'
  | 'title'
  | 'score'
  | 'progress'
  | 'startDate'
  | 'completedDate'
  | 'releaseDate'
  | 'averageScore'
  | 'popularity';

export type SortDirection = 'asc' | 'desc';

export type ListSort = { field: ListSortField; direction: SortDirection };

/** Built-in list statuses, AniList MediaListStatus values. */
export type ListStatusSection = 'CURRENT' | 'REPEATING' | 'COMPLETED' | 'PAUSED' | 'PLANNING' | 'DROPPED';

/** A chip key on My List: a status, or a custom list as `custom:<list name>`. */
export type ListSectionKey = ListStatusSection | `custom:${string}`;

/** Statuses offered by "Airing Notifications" (Watching covers CURRENT + REPEATING). */
export type AiringNotificationStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED';

export type AiringNotificationSettings = {
  /** "Enable" switch. */
  enabled: boolean;
  /** Checkmark rows "Watching", "Planning", "Completed", "Dropped", "Paused". */
  statuses: Record<AiringNotificationStatus, boolean>;
  /** Minutes before airing to notify (0 = at airing time). */
  minutesBefore: number;
  /** Media ids that never trigger airing notifications. */
  mutedMediaIds: number[];
};

/** AniList NotificationType values. */
export type AniListNotificationType =
  | 'AIRING'
  | 'ACTIVITY_MESSAGE'
  | 'ACTIVITY_REPLY'
  | 'FOLLOWING'
  | 'ACTIVITY_MENTION'
  | 'THREAD_COMMENT_MENTION'
  | 'THREAD_SUBSCRIBED'
  | 'THREAD_COMMENT_REPLY'
  | 'RELATED_MEDIA_ADDITION'
  | 'ACTIVITY_LIKE'
  | 'ACTIVITY_REPLY_LIKE'
  | 'THREAD_LIKE'
  | 'THREAD_COMMENT_LIKE'
  | 'ACTIVITY_REPLY_SUBSCRIBED'
  | 'MEDIA_DATA_CHANGE'
  | 'MEDIA_MERGE'
  | 'MEDIA_DELETION'
  | 'MEDIA_SUBMISSION_UPDATE'
  | 'STAFF_SUBMISSION_UPDATE'
  | 'CHARACTER_SUBMISSION_UPDATE';

export type NotificationSettings = {
  airing: AiringNotificationSettings;
  /** Post a local notification when new AniList notifications arrive (background refresh). */
  anilistAlerts: boolean;
  /** Per-type toggles for AniList notification alerts. */
  types: Record<AniListNotificationType, boolean>;
  /** Show the unread count badge on the Profile tab. */
  badge: boolean;
};

// Formatting option types used by src/lib/format.ts (not user settings in AniClient).
export type DateFormat = 'system' | 'MDY' | 'DMY' | 'YMD';
export type TimeFormat = 'system' | '12h' | '24h';
export type MeanScoreStyle = 'percent' | 'decimal';

export type Settings = {
  // General > App Launch Defaults
  /** "Default Media". */
  defaultMediaType: MediaType;
  /** "Default Tab". */
  defaultTab: AppTab;
  /** "Default Activity Feed". */
  defaultActivityFeed: ActivityFeed;
  /** "Default Activity Filter". */
  defaultActivityFilter: ActivityFilter;

  // General > Appearance
  /** "Color". */
  accentColor: AccentColor;
  /** "Theme". */
  theme: ThemeBackground;

  // General > Preferences
  /** "Blur 18+ Content". */
  blurAdultContent: boolean;
  /** "Vibration" (+ intensity, not shown in AniClient). */
  haptics: HapticsSetting;
  /** "Preferred Title". */
  preferredTitle: PreferredTitle;
  /** "Toolbar Style". */
  toolbarStyle: ToolbarStyle;

  /** Local mirror of AniList Settings > "18+ Content" (show adult media in results). */
  showAdultContent: boolean;

  // Gesture Settings (per media type)
  swipe: PerMediaType<SwipeGestures>;

  // More Settings
  /** Activity Feed > "Display My Activity in Following". */
  displayMyActivityInFollowing: boolean;
  /** Media Details > "Expand Summary By Default". */
  expandSummaryByDefault: boolean;
  /** My List (Manga) > "Hide Chapters". */
  hideMangaChapters: boolean;
  /** My List (Manga) > "Hide Volumes". */
  hideMangaVolumes: boolean;
  /** Search > "Score Type". */
  scoreType: ScoreType;

  // My List
  /** List or grid ("Grid Mode"). */
  listDisplayMode: PerMediaType<ListDisplayMode>;
  /** Sort pill ("Last Updated") + direction button. */
  listSort: PerMediaType<ListSort>;
  /** Chip order: statuses then custom lists. */
  listSectionOrder: PerMediaType<ListSectionKey[]>;
  /** Chips hidden from the chip row. */
  hiddenListSections: PerMediaType<ListSectionKey[]>;

  // Notification Settings
  notifications: NotificationSettings;
};

export type SettingKey = keyof Settings;
