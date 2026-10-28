// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { activeFilterCount, emptyFilters, filtersFromParams, filtersToVariables, withType } from '../search-filters';

const ctx = { preferredTitle: 'userPreferred' as const, showAdultContent: false };
const OCT_2026 = new Date(2026, 9, 25);

describe('filtersFromParams', () => {
  test('top preset sorts by score descending', () => {
    const f = filtersFromParams({ type: 'MANGA', preset: 'top' }, 'ANIME', OCT_2026);
    expect(f.type).toBe('MANGA');
    expect(f.sort).toBe('score');
    expect(filtersToVariables(f, ctx).sort).toEqual(['SCORE_DESC', 'ID']);
  });

  test('season presets fill season and year', () => {
    const now = filtersFromParams({ preset: 'season' }, 'ANIME', OCT_2026);
    expect([now.season, now.year]).toEqual(['FALL', 2026]);
    const next = filtersFromParams({ preset: 'nextSeason' }, 'ANIME', OCT_2026);
    expect([next.season, next.year]).toEqual(['WINTER', 2027]);
  });

  test('manhwa preset forces manga from Korea', () => {
    const f = filtersFromParams({ type: 'ANIME', preset: 'manhwa' }, 'ANIME', OCT_2026);
    expect(f.type).toBe('MANGA');
    expect(filtersToVariables(f, ctx).countryOfOrigin).toBe('KR');
  });

  test('explicit sort param wins over the preset', () => {
    const f = filtersFromParams({ preset: 'top', sort: 'TITLE_ROMAJI' }, 'ANIME', OCT_2026);
    expect(f.sort).toBe('title');
    expect(f.direction).toBe('asc');
  });
});

describe('filtersToVariables', () => {
  test('bare query uses search match and hides adult', () => {
    const v = filtersToVariables({ ...emptyFilters('ANIME'), query: ' frieren ' }, ctx);
    expect(v.search).toBe('frieren');
    expect(v.sort).toEqual(['SEARCH_MATCH']);
    expect(v.isAdult).toBe(false);
  });

  test('manga year becomes a start date window', () => {
    const v = filtersToVariables({ ...emptyFilters('MANGA'), year: 2020 }, ctx);
    expect(v.startDate_greater).toBe(20200000);
    expect(v.startDate_lesser).toBe(20210000);
    expect(v.seasonYear).toBeUndefined();
  });

  test('episode range is exclusive on both ends', () => {
    const v = filtersToVariables({ ...emptyFilters('ANIME'), countRange: '7-16' }, ctx);
    expect([v.episodes_greater, v.episodes_lesser]).toEqual([6, 17]);
  });
});

test('withType drops type-specific filters', () => {
  const f = withType({ ...emptyFilters('ANIME'), format: 'TV', season: 'FALL', sort: 'duration', genres: ['Drama'] }, 'MANGA');
  expect(f.format).toBeNull();
  expect(f.season).toBeNull();
  expect(f.sort).toBeNull();
  expect(activeFilterCount(f)).toBe(1);
});
