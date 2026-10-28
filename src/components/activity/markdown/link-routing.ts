import type { Href } from 'expo-router';

import { hrefs } from '@/navigation/hrefs';

/**
 * Maps an AniList web URL to an in-app route: anime/manga, character, staff, studio, activity,
 * and user profiles (by name). Returns null for anything else (open it in the browser).
 */
export function anilistUrlToHref(url: string): Href | null {
  const m = /^(?:https?:)?\/\/(?:www\.)?anilist\.co\/([a-z]+)\/([^/?#]+)/i.exec(url.trim());
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const id = Number(m[2]);
  const numeric = Number.isInteger(id) && id > 0;
  switch (kind) {
    case 'anime':
    case 'manga':
      return numeric ? hrefs.media(id) : null;
    case 'character':
      return numeric ? hrefs.character(id) : null;
    case 'staff':
      return numeric ? hrefs.staff(id) : null;
    case 'studio':
      return numeric ? hrefs.studio(id) : null;
    case 'activity':
      return numeric ? hrefs.activity(id) : null;
    case 'user':
      return userHref(decodeURIComponent(m[2]));
    default:
      return null;
  }
}

/**
 * Profile route for a user id or name. `user/[id]` accepts a numeric id or a username
 * (mentions and anilist.co/user/<name> links only carry the name).
 */
export function userHref(idOrName: number | string): Href {
  if (typeof idOrName === 'number') return hrefs.user(idOrName);
  return `/user/${encodeURIComponent(idOrName)}` as Href;
}
