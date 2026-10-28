import type { CharacterRole, MediaSort, StaffLanguage } from '@/api/types';

import type { MenuOption } from './option-menu-pill';

/** Sort orders offered on Character / Staff / Studio media grids. */
export type PeopleMediaSort = 'newest' | 'oldest' | 'popularity' | 'score' | 'favourites' | 'title';

export const PEOPLE_MEDIA_SORT_OPTIONS: readonly MenuOption<PeopleMediaSort>[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'score', label: 'Average Score' },
  { value: 'favourites', label: 'Favorites' },
  { value: 'title', label: 'Title' },
];

export const PEOPLE_MEDIA_SORT: Record<PeopleMediaSort, MediaSort[]> = {
  newest: ['START_DATE_DESC'],
  oldest: ['START_DATE'],
  popularity: ['POPULARITY_DESC'],
  score: ['SCORE_DESC'],
  favourites: ['FAVOURITES_DESC'],
  title: ['TITLE_ROMAJI'],
};

export const STAFF_LANGUAGE_OPTIONS: readonly MenuOption<StaffLanguage>[] = [
  { value: 'JAPANESE', label: 'Japanese' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'KOREAN', label: 'Korean' },
  { value: 'ITALIAN', label: 'Italian' },
  { value: 'SPANISH', label: 'Spanish' },
  { value: 'PORTUGUESE', label: 'Portuguese' },
  { value: 'FRENCH', label: 'French' },
  { value: 'GERMAN', label: 'German' },
  { value: 'HEBREW', label: 'Hebrew' },
  { value: 'HUNGARIAN', label: 'Hungarian' },
];

export const CHARACTER_ROLE_LABELS: Record<CharacterRole, string> = {
  MAIN: 'Main',
  SUPPORTING: 'Supporting',
  BACKGROUND: 'Background',
};

/** Media type filter on staff roles / character appearances. */
export type MediaTypeFilter = 'all' | 'ANIME' | 'MANGA';

export const MEDIA_TYPE_FILTER_OPTIONS: readonly MenuOption<MediaTypeFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Manga' },
];
