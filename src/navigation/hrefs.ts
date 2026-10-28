import type { Href } from 'expo-router';

import type { FavouriteKind } from '@/api/types';
import type { AppTab, MediaType } from '@/settings/types';

/**
 * Typed href builders for every route. Shared routes live in the array group
 * `src/app/(tabs)/(lists,explore,profile)/...`, so pushing one of these from any of those tabs
 * keeps the tab bar visible and pushes onto the current tab's Stack.
 *
 * Paths that exist in more than one tab group (`notifications`) are group-qualified so they
 * always resolve to the intended screen. Always navigate through these builders.
 */
export type FollowKind = 'followers' | 'following';

/** Entry editor sheet mode (`entry/[mediaId]?mode=`). */
export type EntryEditorMode = 'quick' | 'full';

/** Explore search/browse params (all optional, strings in the URL). */
export type SearchParams = {
  type?: MediaType;
  /** Free-text query. */
  q?: string;
  /** AniList MediaSort value, e.g. "SCORE_DESC". */
  sort?: string;
  genre?: string;
  year?: string;
  season?: string;
  format?: string;
  status?: string;
  country?: string;
  /** Preset used by Explore "›" sections: trending, season, nextSeason, popular, top, manhwa. */
  preset?: string;
};

/** `custom-lists/[type]` param values. */
export type CustomListSlug = 'anime' | 'manga';

export function customListSlug(type: MediaType): CustomListSlug {
  return type === 'MANGA' ? 'manga' : 'anime';
}

export function mediaTypeFromSlug(slug: string | string[] | undefined): MediaType {
  return slug === 'manga' ? 'MANGA' : 'ANIME';
}

const NOTIFICATIONS_PATH = '/(tabs)/(profile)/notifications' satisfies Href;

const TAB_ROOTS: Record<AppTab, Href> = {
  lists: '/(tabs)/(lists)',
  explore: '/(tabs)/(explore)',
  profile: '/(tabs)/(profile)',
  settings: '/(tabs)/(settings)',
};

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `${path}?${q}` : path;
}

export const hrefs = {
  media: (id: number): Href => `/media/${id}`,
  character: (id: number): Href => `/character/${id}`,
  staff: (id: number): Href => `/staff/${id}`,
  studio: (id: number): Href => `/studio/${id}`,
  /** Another user's profile. */
  user: (id: number): Href => `/user/${id}`,
  activity: (id: number): Href => `/activity/${id}`,
  review: (id: number): Href => `/review/${id}`,
  favourites: (userId: number, kind: FavouriteKind): Href => `/favourites/${userId}/${kind}`,
  follows: (userId: number, kind: FollowKind): Href => `/follows/${userId}/${kind}`,
  /** Entry editor sheet: `full` (default) shows every field, `quick` is the row "•••" quick edit sheet. */
  entry: (mediaId: number, mode: EntryEditorMode = 'full'): Href =>
    mode === 'full' ? `/entry/${mediaId}` : `/entry/${mediaId}?mode=${mode}`,
  search: (params: SearchParams = {}) => withQuery('/search', params) as Href,
  /** Root modal (above the tabs). */
  signIn: (): Href => '/sign-in',
  /** AniList notifications (Profile tab, envelope button). */
  notifications: (): Href => NOTIFICATIONS_PATH,
  /** Tab roots. */
  tab: (tab: AppTab): Href => TAB_ROOTS[tab],
  settings: {
    general: (): Href => '/(tabs)/(settings)/general',
    gestures: (): Href => '/(tabs)/(settings)/gestures',
    more: (): Href => '/(tabs)/(settings)/more',
    notifications: (): Href => '/(tabs)/(settings)/notifications',
    anilist: (): Href => '/(tabs)/(settings)/anilist',
    whatsNew: (): Href => '/(tabs)/(settings)/whats-new',
    customLists: (type: MediaType): Href => `/(tabs)/(settings)/custom-lists/${customListSlug(type)}`,
  },
} as const;

/**
 * Convert an app URL (`qaraq://media/5`, `qaraq://notifications`, or a bare `/media/5` path)
 * into a router path (`/media/5`, `/(tabs)/(profile)/notifications`). Returns null for URLs we don't
 * route (other schemes, the OAuth callback `qaraq://auth#...`, unknown paths).
 */
export function appUrlToPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const m = /^qaraq:\/\/(.*)$/i.exec(trimmed);
  const rest = m ? m[1] : trimmed.startsWith('/') ? trimmed.slice(1) : null;
  if (rest == null) return null;
  // Drop query/fragment, collapse leading slashes and a trailing slash.
  const path = `/${rest.split(/[?#]/)[0].replace(/^\/+/, '').replace(/\/+$/, '')}`;
  if (/^\/(media|user|activity|character|staff|studio|review)\/\d+$/.test(path)) return path;
  if (path === '/notifications') return NOTIFICATIONS_PATH;
  return null;
}
