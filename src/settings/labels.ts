/**
 * Verbatim UI labels for setting values (docs/aniclient-ui-spec.md §8). Settings screens,
 * menus and pickers read their option text from here so wording stays consistent.
 */
import type {
  AccentColor,
  ActivityFeed,
  ActivityFilter,
  AiringNotificationStatus,
  AppTab,
  ListDisplayMode,
  ListSortField,
  ListStatusSection,
  MediaType,
  PreferredTitle,
  ScoreType,
  SwipeAction,
  ThemeBackground,
  ToolbarStyle,
} from './types';

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = { ANIME: 'Anime', MANGA: 'Manga' };

export const APP_TAB_LABELS: Record<AppTab, string> = {
  lists: 'My List',
  explore: 'Explore',
  profile: 'Profile',
  settings: 'Settings',
};

export const ACTIVITY_FEED_LABELS: Record<ActivityFeed, string> = {
  mine: 'My Activity',
  following: 'Following',
  global: 'Global',
};

export const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: 'All',
  list: 'List Progress',
  text: 'Text Status',
  messages: 'Messages',
};

export const ACCENT_COLOR_LABELS: Record<AccentColor, string> = {
  white: 'White',
  blue: 'Blue',
  cyan: 'Cyan',
  green: 'Green',
  lime: 'Lime',
  yellow: 'Yellow',
  peach: 'Peach',
  orange: 'Orange',
  red: 'Red',
  crimson: 'Crimson',
  pink: 'Pink',
  purple: 'Purple',
};

export const THEME_BACKGROUND_LABELS: Record<ThemeBackground, string> = {
  black: 'Black',
  darkGray: 'Dark Gray',
  navy: 'Navy',
  maroon: 'Maroon',
  purple: 'Purple',
  light: 'Light',
  system: 'System',
};

export const TOOLBAR_STYLE_LABELS: Record<ToolbarStyle, string> = {
  follow: 'Follow',
  glass: 'Glass',
  solid: 'Solid',
};

/** Subtitles shown under each Toolbar Style option. */
export const TOOLBAR_STYLE_SUBTITLES: Record<ToolbarStyle, string> = {
  follow: process.env.EXPO_OS === 'ios' ? 'Liquid Glass where available, else solid' : 'Follow the system style',
  glass: 'Glass or translucent bars everywhere',
  solid: 'Opaque bars',
};

export const PREFERRED_TITLE_LABELS: Record<PreferredTitle, string> = {
  userPreferred: 'Default',
  english: 'English',
  romaji: 'Romaji',
  native: 'Native',
};

/** Gray subtitles in the Preferred Title menu. */
export const PREFERRED_TITLE_SUBTITLES: Record<PreferredTitle, string> = {
  userPreferred: 'AniList title settings',
  english: '(Attack on Titan)',
  romaji: '(Shingeki no Kyojin)',
  native: '(進撃の巨人)',
};

/** Swipe action label; "Increase Episode" for anime, "Increase Chapter" for manga. */
export function swipeActionLabel(action: SwipeAction, type: MediaType): string {
  switch (action) {
    case 'increment':
      return type === 'MANGA' ? 'Increase Chapter' : 'Increase Episode';
    case 'customList':
      return 'Custom List';
    case 'delete':
      return 'Delete';
  }
}

export const SCORE_TYPE_LABELS: Record<ScoreType, string> = { smiley: 'Smiley', star: 'Star' };

export const LIST_DISPLAY_MODE_LABELS: Record<ListDisplayMode, string> = { list: 'List', grid: 'Grid' };

export const LIST_SORT_FIELD_LABELS: Record<ListSortField, string> = {
  lastUpdated: 'Last Updated',
  lastAdded: 'Last Added',
  title: 'Title',
  score: 'Score',
  progress: 'Progress',
  startDate: 'Start Date',
  completedDate: 'Completed Date',
  releaseDate: 'Release Date',
  averageScore: 'Average Score',
  popularity: 'Popularity',
};

/** Status chip label; anime and manga differ for CURRENT/REPEATING ("Watching" vs "Reading"). */
export function listStatusLabel(status: ListStatusSection, type: MediaType = 'ANIME'): string {
  const manga = type === 'MANGA';
  switch (status) {
    case 'CURRENT':
      return manga ? 'Reading' : 'Watching';
    case 'REPEATING':
      return manga ? 'Rereading' : 'Rewatching';
    case 'COMPLETED':
      return 'Completed';
    case 'PAUSED':
      return 'Paused';
    case 'PLANNING':
      return 'Planning';
    case 'DROPPED':
      return 'Dropped';
  }
}

export const AIRING_NOTIFICATION_STATUS_LABELS: Record<AiringNotificationStatus, string> = {
  CURRENT: 'Watching',
  PLANNING: 'Planning',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  PAUSED: 'Paused',
};
