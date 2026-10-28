// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import type { MediaCore, MediaListCollectionQuery, MediaListEntry } from '@/api/types';

import { stepScore, withProgress, withStatus, draftFromEntry, draftToVariables, averageAdvanced } from '../editor/editor-model';
import { airingCountdown, airingLine, customListNames, filterEntries, groupSections, humanizeIn, sortEntries, type ListEntry } from '../list-model';

function media(id: number, patch: Partial<MediaCore> = {}): MediaCore {
  return {
    id,
    idMal: null,
    type: 'ANIME',
    format: 'TV',
    status: 'FINISHED',
    title: { romaji: `Romaji ${id}`, english: `English ${id}`, native: null, userPreferred: `Title ${id}` },
    coverImage: null,
    bannerImage: null,
    episodes: 12,
    chapters: null,
    volumes: null,
    duration: 24,
    season: null,
    seasonYear: null,
    startDate: null,
    endDate: null,
    averageScore: null,
    meanScore: null,
    popularity: null,
    favourites: null,
    genres: null,
    countryOfOrigin: null,
    isAdult: false,
    siteUrl: null,
    nextAiringEpisode: null,
    ...patch,
  };
}

function entry(id: number, patch: Partial<ListEntry> = {}): ListEntry {
  return {
    id,
    userId: 1,
    mediaId: id,
    status: 'CURRENT',
    score: 0,
    progress: 0,
    progressVolumes: 0,
    repeat: 0,
    priority: 0,
    private: false,
    notes: null,
    hiddenFromStatusLists: false,
    customLists: null,
    advancedScores: null,
    startedAt: null,
    completedAt: null,
    updatedAt: id,
    createdAt: id,
    media: media(id),
    ...patch,
  };
}

const collection: MediaListCollectionQuery = {
  MediaListCollection: {
    hasNextChunk: false,
    user: {
      id: 1,
      name: 'x',
      mediaListOptions: {
        scoreFormat: 'POINT_10_DECIMAL',
        rowOrder: null,
        animeList: { sectionOrder: null, splitCompletedSectionByFormat: true, customLists: ['Peak', 'Empty'], advancedScoring: null, advancedScoringEnabled: false },
        mangaList: null,
      },
    },
    lists: [
      { name: 'Watching', isCustomList: false, isSplitCompletedList: false, status: 'CURRENT', entries: [entry(1), entry(2)] },
      { name: 'Completed TV', isCustomList: false, isSplitCompletedList: true, status: 'COMPLETED', entries: [entry(3, { status: 'COMPLETED' })] },
      { name: 'Completed Movie', isCustomList: false, isSplitCompletedList: true, status: 'COMPLETED', entries: [entry(4, { status: 'COMPLETED' })] },
      { name: 'Peak', isCustomList: true, isSplitCompletedList: false, status: null, entries: [entry(3, { status: 'COMPLETED' })] },
      { name: 'Extra', isCustomList: true, isSplitCompletedList: false, status: null, entries: [] },
    ],
  },
};

describe('groupSections', () => {
  test('merges split completed lists and keys custom lists', () => {
    const g = groupSections(collection);
    expect(g.get('CURRENT')?.map((e) => e.id)).toEqual([1, 2]);
    expect(g.get('COMPLETED')?.map((e) => e.id)).toEqual([3, 4]);
    expect(g.get('custom:Peak')?.map((e) => e.id)).toEqual([3]);
  });

  test('custom list names come from options plus data', () => {
    expect(customListNames(collection, 'ANIME')).toEqual(['Peak', 'Empty', 'Extra']);
  });
});

describe('sortEntries / filterEntries', () => {
  const list = [entry(1, { updatedAt: 10, score: 7 }), entry(2, { updatedAt: 30, score: 9 }), entry(3, { updatedAt: 20, score: 0 })];
  test('last updated desc', () => {
    expect(sortEntries(list, { field: 'lastUpdated', direction: 'desc' }, 'userPreferred').map((e) => e.id)).toEqual([2, 3, 1]);
  });
  test('score asc', () => {
    expect(sortEntries(list, { field: 'score', direction: 'asc' }, 'userPreferred').map((e) => e.id)).toEqual([3, 1, 2]);
  });
  test('search matches any title variant, accent-insensitive', () => {
    const l = [entry(1, { media: media(1, { title: { romaji: 'Sōsō no Frieren', english: null, native: null, userPreferred: null } }) }), entry(2)];
    expect(filterEntries(l, 'soso').map((e) => e.id)).toEqual([1]);
    expect(filterEntries(l, 'english 2').map((e) => e.id)).toEqual([2]);
  });
});

describe('airing line', () => {
  test('humanized like AniClient', () => {
    expect(humanizeIn(60 * 86400)).toBe('in 2 months');
    expect(humanizeIn(86400)).toBe('in a day');
    expect(humanizeIn(5 * 3600)).toBe('in 5 hours');
    expect(airingLine({ nextAiringEpisode: { id: 1, airingAt: 1000 + 60 * 86400, timeUntilAiring: 0, episode: 1181, mediaId: 1 } }, 1000)).toBe(
      'Episode 1181 airs in 2 months',
    );
    expect(airingLine({ nextAiringEpisode: null }, 0)).toBeNull();
  });

  test('airingCountdown: exact within a week, humanized beyond', () => {
    const now = 1_000_000;
    expect(airingCountdown(now + 2 * 86400 + 4 * 3600, now)).toBe('2d 4h');
    expect(airingCountdown(now + 67 * 86400 + 3 * 3600, now)).toBe('2 months');
    expect(airingCountdown(now + 8 * 86400, now)).toBe('8 days');
    expect(airingCountdown(now - 10, now)).toBe('');
  });
});

describe('editor model', () => {
  const m = { type: 'ANIME' as const, episodes: 12, chapters: null, volumes: null };
  test('score steps follow the scoring system', () => {
    expect(stepScore(9.5, 'POINT_10_DECIMAL', 1)).toBe(10);
    expect(stepScore(9.3, 'POINT_10_DECIMAL', 1)).toBe(9.5);
    expect(stepScore(9.3, 'POINT_10_DECIMAL', -1)).toBe(9);
    expect(stepScore(0, 'POINT_10_DECIMAL', -1)).toBe(0);
    expect(stepScore(3, 'POINT_3', 1)).toBe(3);
    expect(stepScore(55, 'POINT_100', 1)).toBe(56);
  });
  test('progress from planning starts watching; reaching total completes', () => {
    const d = draftFromEntry({ status: 'PLANNING', progress: 0 } as MediaListEntry);
    const started = withProgress(d, 1, m);
    expect(started.status).toBe('CURRENT');
    expect(started.startedAt).not.toBeNull();
    const done = withProgress({ ...started, progress: 11 }, 12, m);
    expect(done.status).toBe('COMPLETED');
    expect(done.completedAt).not.toBeNull();
  });
  test('completed fills progress', () => {
    expect(withStatus(draftFromEntry(null), 'COMPLETED', m).progress).toBe(12);
  });
  test('variables: update by id, create by media id, clears dates', () => {
    const d = draftFromEntry(null);
    expect(draftToVariables(d, { mediaId: 5 }, null)).toMatchObject({ mediaId: 5, status: 'PLANNING', startedAt: { year: null } });
    expect(draftToVariables(d, { entryId: 9, mediaId: 5 }, ['Story']).id).toBe(9);
    expect(draftToVariables(d, { entryId: 9, mediaId: 5 }, ['Story']).advancedScores).toEqual([0]);
  });
  test('advanced average ignores unset categories', () => {
    expect(averageAdvanced({ Story: 8, Art: 9, Sound: 0 }, ['Story', 'Art', 'Sound'], 'POINT_10_DECIMAL')).toBe(8.5);
  });
});
