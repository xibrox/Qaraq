// @ts-ignore -- bun:test types are not installed in the app (see core notes)
import { describe, expect, test } from 'bun:test';

import { toUpcomingEpisodes, type WatchingAiringQuery } from '@/api/airing';
import { AniListError, shouldRetryQuery } from '@/api/client';
import { describeNotification } from '@/api/notifications';
import type { AniListNotification } from '@/api/types';

describe('shouldRetryQuery', () => {
  test('never retries errors gql() already handled or that cannot succeed', () => {
    for (const kind of ['unauthorized', 'not_found', 'validation', 'graphql', 'aborted', 'rate_limited'] as const) {
      expect(shouldRetryQuery(0, new AniListError({ message: kind, kind }))).toBe(false);
    }
  });
  test('retries network/http once', () => {
    const e = new AniListError({ message: 'x', kind: 'network' });
    expect(shouldRetryQuery(0, e)).toBe(true);
    expect(shouldRetryQuery(1, e)).toBe(false);
  });
});

describe('toUpcomingEpisodes', () => {
  test('flattens, dedupes across lists and sorts by airing time', () => {
    const media = (id: number, eps: [number, number][]) => ({
      id,
      status: 'RELEASING' as const,
      isAdult: false,
      title: { romaji: `R${id}`, english: id === 1 ? 'E1' : null, native: null, userPreferred: `U${id}` },
      coverImage: { large: null, medium: 'm' },
      airingSchedule: { nodes: eps.map(([episode, airingAt]) => ({ id: episode, episode, airingAt })) },
    });
    const data: WatchingAiringQuery = {
      MediaListCollection: {
        lists: [
          { status: 'CURRENT', entries: [{ id: 1, mediaId: 1, status: 'CURRENT', progress: 1, media: media(1, [[2, 200], [3, 300]]) }] },
          // same media again in a custom list
          { status: null, entries: [{ id: 1, mediaId: 1, status: 'CURRENT', progress: 1, media: media(1, [[2, 200]]) }] },
          { status: 'REPEATING', entries: [{ id: 2, mediaId: 2, status: 'REPEATING', progress: 0, media: media(2, [[1, 100]]) }] },
        ],
      },
    };
    const out = toUpcomingEpisodes(data, 'english');
    expect(out.map((e) => `${e.mediaId}:${e.episode}`)).toEqual(['2:1', '1:2', '1:3']);
    expect(out[1].title).toBe('E1');
    expect(out[0].title).toBe('U2');
  });
});

describe('describeNotification', () => {
  test('airing contexts are interleaved with episode and title', () => {
    const n = {
      __typename: 'AiringNotification',
      id: 1,
      type: 'AIRING',
      createdAt: 0,
      animeId: 5,
      episode: 3,
      contexts: ['Episode ', ' of ', ' aired.'],
      media: { id: 5, type: 'ANIME', format: 'TV', isAdult: false, title: { romaji: 'Foo', english: null, native: null, userPreferred: 'Foo' }, coverImage: null },
    } as AniListNotification;
    expect(describeNotification(n)).toEqual({ title: 'Foo', body: 'Episode 3 of Foo aired.', url: 'qaraq://media/5' });
  });
  test('user notifications prefix the user name', () => {
    const n = {
      __typename: 'ActivityLikeNotification',
      id: 2,
      type: 'ACTIVITY_LIKE',
      createdAt: 0,
      userId: 9,
      activityId: 77,
      context: ' liked your activity.',
      user: { id: 9, name: 'Bob', avatar: null, donatorTier: 0, donatorBadge: null, moderatorRoles: null },
      activity: null,
    } as unknown as AniListNotification;
    expect(describeNotification(n).body).toBe('Bob liked your activity.');
  });
});
