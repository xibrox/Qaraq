// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { allTitles, pickName, pickSubtitle, pickTitle } from '../title';

const full = {
  romaji: 'Shingeki no Kyojin',
  english: 'Attack on Titan',
  native: '進撃の巨人',
  userPreferred: 'Shingeki no Kyojin',
};

describe('pickTitle', () => {
  test('respects preference', () => {
    expect(pickTitle(full, 'english')).toBe('Attack on Titan');
    expect(pickTitle(full, 'native')).toBe('進撃の巨人');
    expect(pickTitle(full, 'romaji')).toBe('Shingeki no Kyojin');
    expect(pickTitle(full)).toBe('Shingeki no Kyojin');
  });
  test('falls back when preferred is missing or blank', () => {
    expect(pickTitle({ romaji: 'Yuru Camp', english: null, userPreferred: 'Yuru Camp' }, 'english')).toBe(
      'Yuru Camp',
    );
    expect(pickTitle({ romaji: '', native: 'ゆるキャン△' }, 'romaji')).toBe('ゆるキャン△');
    expect(pickTitle({ english: '  ', romaji: 'X' }, 'english')).toBe('X');
  });
  test('null title', () => {
    expect(pickTitle(null)).toBe('');
    expect(pickTitle(undefined, 'english', 'Untitled')).toBe('Untitled');
  });
});

describe('pickSubtitle', () => {
  test('returns a different variant', () => {
    expect(pickSubtitle(full, 'english')).toBe('進撃の巨人');
    expect(pickSubtitle(full, 'native')).toBe('Shingeki no Kyojin');
  });
  test('undefined when nothing distinct', () => {
    expect(pickSubtitle({ romaji: 'A', userPreferred: 'A' })).toBeUndefined();
  });
});

describe('allTitles', () => {
  test('dedupes and includes synonyms', () => {
    expect(allTitles(full, ['AoT', null, 'Attack on Titan'])).toEqual([
      'Shingeki no Kyojin',
      'Attack on Titan',
      '進撃の巨人',
      'AoT',
    ]);
  });
});

describe('pickName', () => {
  const name = {
    first: 'Eren',
    last: 'Yeager',
    full: 'Eren Yeager',
    native: 'エレン・イェーガー',
    userPreferred: 'Eren Yeager',
  };
  test('preferences', () => {
    expect(pickName(name)).toBe('Eren Yeager');
    expect(pickName(name, 'native')).toBe('エレン・イェーガー');
    expect(pickName({ first: 'Mikasa', last: 'Ackerman', full: 'Ackerman Mikasa' }, 'romajiWestern')).toBe(
      'Mikasa Ackerman',
    );
    expect(pickName({ first: 'Mikasa', last: 'Ackerman', full: 'Ackerman Mikasa' }, 'romaji')).toBe(
      'Ackerman Mikasa',
    );
  });
  test('fallbacks', () => {
    expect(pickName({ native: '花澤香菜' }, 'romaji')).toBe('花澤香菜');
    expect(pickName(null, 'native', '?')).toBe('?');
  });
});
