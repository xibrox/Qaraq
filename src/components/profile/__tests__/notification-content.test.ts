// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import type { AniListNotification } from '@/api/types';

import { interleave, notificationContent } from '../notifications/notification-content';

const user = { id: 7, name: 'Someone266', avatar: { large: 'a.png', medium: null }, donatorTier: 0, donatorBadge: null, moderatorRoles: null };
const media = {
  id: 5,
  type: 'ANIME',
  format: 'TV',
  isAdult: false,
  title: { romaji: 'Cyberpunk: Edgerunners 2', english: null, native: null, userPreferred: 'Cyberpunk: Edgerunners 2' },
  coverImage: { large: 'c.png', medium: null },
} as const;

const text = (n: AniListNotification) => notificationContent(n).segments.map((s) => s.text).join('');

describe('notificationContent', () => {
  test('airing: verbatim wording with a bold title and media route', () => {
    const n = {
      __typename: 'AiringNotification',
      id: 1,
      type: 'AIRING',
      createdAt: 0,
      animeId: 5,
      episode: 1,
      contexts: ['Episode ', ' of ', ' aired.'],
      media,
    } as unknown as AniListNotification;
    const c = notificationContent(n);
    expect(text(n)).toBe('Episode 1 of Cyberpunk: Edgerunners 2 aired.');
    expect(c.segments.filter((s) => s.bold).map((s) => s.text)).toEqual(['Cyberpunk: Edgerunners 2']);
    expect(c.target).toEqual({ kind: 'route', href: '/media/5' });
  });

  test('activity like: bold user name + context, routes to the activity', () => {
    const n = {
      __typename: 'ActivityLikeNotification',
      id: 2,
      type: 'ACTIVITY_LIKE',
      createdAt: 0,
      userId: 7,
      activityId: 99,
      context: ' liked your activity.',
      user,
      activity: { __typename: 'TextActivity', id: 99 },
    } as unknown as AniListNotification;
    expect(text(n)).toBe('Someone266 liked your activity.');
    expect(notificationContent(n).target).toEqual({ kind: 'route', href: '/activity/99' });
    expect(notificationContent(n).userId).toBe(7);
  });

  test('subscribed reply falls back to the verbatim AniClient wording', () => {
    const n = {
      __typename: 'ActivityReplySubscribedNotification',
      id: 3,
      type: 'ACTIVITY_REPLY_SUBSCRIBED',
      createdAt: 0,
      userId: 7,
      activityId: 4,
      context: null,
      user,
      activity: null,
    } as unknown as AniListNotification;
    expect(text(n)).toBe("Someone266 replied to activity you're subscribed to.");
  });

  test('thread notifications open the browser', () => {
    const n = {
      __typename: 'ThreadCommentReplyNotification',
      id: 4,
      type: 'THREAD_COMMENT_REPLY',
      createdAt: 0,
      userId: 7,
      commentId: 12,
      context: ' replied to your comment, in the forum thread ',
      user,
      thread: { id: 3, title: 'Fall 2026', siteUrl: 'https://anilist.co/forum/thread/3' },
      comment: { id: 12, siteUrl: 'https://anilist.co/forum/thread/3/comment/12' },
    } as unknown as AniListNotification;
    expect(notificationContent(n).target).toEqual({ kind: 'web', url: 'https://anilist.co/forum/thread/3/comment/12' });
  });

  test('related media addition', () => {
    const n = {
      __typename: 'RelatedMediaAdditionNotification',
      id: 5,
      type: 'RELATED_MEDIA_ADDITION',
      createdAt: 0,
      mediaId: 5,
      context: ' was recently added to the site.',
      media,
    } as unknown as AniListNotification;
    expect(text(n)).toBe('Cyberpunk: Edgerunners 2 was recently added to the site.');
  });
});

describe('interleave', () => {
  test('pairs contexts with values', () => {
    expect(interleave(['a ', ' b'], ['X'], [true])).toEqual([{ text: 'a ' }, { text: 'X', bold: true }, { text: ' b' }]);
  });
});
