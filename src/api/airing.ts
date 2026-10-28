import { pickTitle } from '@/lib/title';
import type { PreferredTitle } from '@/settings/types';

import { gql, type GqlOptions } from './client';
import { operation } from './document';
import { MEDIA_TITLE } from './fragments';
import type { MediaListStatus, MediaStatus, MediaTitle } from './types';

/**
 * Upcoming episodes for the user's own anime list, for local airing reminders.
 * Uses `Media.airingSchedule(notYetAired: true)` so several future episodes can be scheduled
 * per show (one request covers the whole list; the background task can run hours apart).
 */
export const WATCHING_AIRING_QUERY = operation(
  `
query WatchingAiring($userId: Int!, $status_in: [MediaListStatus] = [CURRENT, REPEATING], $perShow: Int = 4) {
  MediaListCollection(userId: $userId, type: ANIME, status_in: $status_in) {
    lists {
      status
      entries {
        id
        mediaId
        status
        progress
        media {
          id
          status(version: 2)
          isAdult
          title { ...MediaTitleFields }
          coverImage { large medium }
          airingSchedule(notYetAired: true, perPage: $perShow) {
            nodes { id episode airingAt }
          }
        }
      }
    }
  }
}`,
  [MEDIA_TITLE],
);

export interface WatchingAiringVariables {
  userId: number;
  status_in?: MediaListStatus[];
  perShow?: number;
}

export interface WatchingAiringEntry {
  id: number;
  mediaId: number;
  status: MediaListStatus | null;
  progress: number | null;
  media: {
    id: number;
    status: MediaStatus | null;
    isAdult: boolean | null;
    title: MediaTitle | null;
    coverImage: { large: string | null; medium: string | null } | null;
    airingSchedule: {
      nodes: ({ id: number; episode: number; airingAt: number } | null)[] | null;
    } | null;
  } | null;
}

export interface WatchingAiringQuery {
  MediaListCollection: {
    lists: ({ status: MediaListStatus | null; entries: (WatchingAiringEntry | null)[] | null } | null)[] | null;
  } | null;
}

export const fetchWatchingAiring = (vars: WatchingAiringVariables, opts?: GqlOptions) =>
  gql<WatchingAiringQuery>(WATCHING_AIRING_QUERY, vars, opts);

/** Same shape as `AiringItem` in src/lib/notifications.ts (kept structural to avoid a cycle). */
export interface UpcomingEpisode {
  mediaId: number;
  title: string;
  episode: number;
  airingAt: number;
  coverImage?: string | null;
}

/** Flatten a WatchingAiring result into one item per future episode, deduplicated by media. */
export function toUpcomingEpisodes(
  data: WatchingAiringQuery | null | undefined,
  preferredTitle: PreferredTitle = 'userPreferred',
): UpcomingEpisode[] {
  const out: UpcomingEpisode[] = [];
  const seen = new Set<string>();
  for (const list of data?.MediaListCollection?.lists ?? []) {
    for (const entry of list?.entries ?? []) {
      const media = entry?.media;
      if (!media) continue;
      for (const node of media.airingSchedule?.nodes ?? []) {
        if (!node) continue;
        const key = `${media.id}:${node.episode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          mediaId: media.id,
          title: pickTitle(media.title, preferredTitle, `#${media.id}`),
          episode: node.episode,
          airingAt: node.airingAt,
          coverImage: media.coverImage?.large ?? media.coverImage?.medium ?? null,
        });
      }
    }
  }
  return out.sort((a, b) => a.airingAt - b.airingAt);
}
