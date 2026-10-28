// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import {
  formatCompact,
  formatCountdown,
  formatDurationSeconds,
  formatEnum,
  formatEpisodeDuration,
  formatFuzzyDate,
  formatMeanScore,
  formatMinutes,
  formatNumber,
  formatProgress,
  formatRelativeTime,
  formatScore,
  formatSeason,
  fuzzyDateToInt,
  nextSeason,
  resolveDateFormat,
  scoreFromPoint100,
  scoreTier,
  scoreToPoint100,
  seasonForDate,
} from '../format';

describe('formatScore', () => {
  test('empty / unscored', () => {
    expect(formatScore(0, 'POINT_100')).toBe('');
    expect(formatScore(null, 'POINT_10', { empty: '-' })).toBe('-');
  });
  test('POINT_100', () => {
    expect(formatScore(85, 'POINT_100')).toBe('85');
    expect(formatScore(85, 'POINT_100', { showMax: true })).toBe('85/100');
  });
  test('POINT_10_DECIMAL', () => {
    expect(formatScore(7.5, 'POINT_10_DECIMAL')).toBe('7.5');
    expect(formatScore(8, 'POINT_10_DECIMAL')).toBe('8.0');
    expect(formatScore(8, 'POINT_10_DECIMAL', { showMax: true })).toBe('8.0/10');
  });
  test('POINT_10', () => {
    expect(formatScore(8, 'POINT_10')).toBe('8');
  });
  test('POINT_5 stars and numbers', () => {
    expect(formatScore(3, 'POINT_5')).toBe('★★★☆☆');
    expect(formatScore(4, 'POINT_5', { starStyle: 'number', showMax: true })).toBe('4/5');
  });
  test('POINT_3 smileys', () => {
    expect(formatScore(1, 'POINT_3')).toBe(':(');
    expect(formatScore(2, 'POINT_3')).toBe(':|');
    expect(formatScore(3, 'POINT_3')).toBe(':)');
    expect(formatScore(3, 'POINT_3', { smileys: 'emoji' })).toBe('\u{1F642}');
  });
});

describe('score conversion', () => {
  test('from 100', () => {
    expect(scoreFromPoint100(85, 'POINT_10_DECIMAL')).toBe(8.5);
    expect(scoreFromPoint100(85, 'POINT_10')).toBe(9);
    expect(scoreFromPoint100(85, 'POINT_5')).toBe(4);
    expect(scoreFromPoint100(85, 'POINT_3')).toBe(3);
    expect(scoreFromPoint100(50, 'POINT_3')).toBe(2);
    expect(scoreFromPoint100(20, 'POINT_3')).toBe(1);
    expect(scoreFromPoint100(0, 'POINT_10')).toBe(0);
  });
  test('to 100', () => {
    expect(scoreToPoint100(7.5, 'POINT_10_DECIMAL')).toBe(75);
    expect(scoreToPoint100(4, 'POINT_5')).toBe(80);
    expect(scoreToPoint100(2, 'POINT_3')).toBe(60);
  });
  test('mean score and tiers', () => {
    expect(formatMeanScore(78)).toBe('78%');
    expect(formatMeanScore(78, 'decimal')).toBe('7.8');
    expect(formatMeanScore(null)).toBe('');
    expect(scoreTier(40)).toBe('low');
    expect(scoreTier(60)).toBe('mid');
    expect(scoreTier(80)).toBe('high');
    expect(scoreTier(0)).toBe('none');
  });
});

describe('numbers', () => {
  test('formatNumber', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(-1000.5)).toBe('-1,000.5');
    expect(formatNumber(12)).toBe('12');
  });
  test('formatCompact', () => {
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(1234)).toBe('1.2K');
    expect(formatCompact(1500000)).toBe('1.5M');
    expect(formatCompact(250000)).toBe('250K');
  });
  test('durations', () => {
    expect(formatMinutes(1565)).toBe('1d 2h');
    expect(formatMinutes(125)).toBe('2h 5m');
    expect(formatMinutes(0)).toBe('0m');
    expect(formatEpisodeDuration(24)).toBe('24 mins');
    expect(formatEpisodeDuration(90)).toBe('1 hour, 30 mins');
    expect(formatProgress(5, null)).toBe('5 / ?');
    expect(formatProgress(5, 12)).toBe('5 / 12');
  });
});

describe('fuzzy dates', () => {
  test('full date in each order', () => {
    const d = { year: 2024, month: 4, day: 5 };
    expect(formatFuzzyDate(d, 'medium', 'MDY')).toBe('Apr 5, 2024');
    expect(formatFuzzyDate(d, 'medium', 'DMY')).toBe('5 Apr 2024');
    expect(formatFuzzyDate(d, 'medium', 'YMD')).toBe('2024 Apr 5');
    expect(formatFuzzyDate(d, 'long', 'MDY')).toBe('April 5, 2024');
    expect(formatFuzzyDate(d, 'numeric', 'MDY')).toBe('04/05/2024');
    expect(formatFuzzyDate(d, 'numeric', 'DMY')).toBe('05/04/2024');
    expect(formatFuzzyDate(d, 'numeric', 'YMD')).toBe('2024-04-05');
  });
  test('partial dates', () => {
    expect(formatFuzzyDate({ year: 2024, month: 4 })).toBe('Apr 2024');
    expect(formatFuzzyDate({ year: 2024 })).toBe('2024');
    expect(formatFuzzyDate({ month: 4, day: 5 })).toBe('Apr 5');
    expect(formatFuzzyDate({ year: null, month: null, day: null }, 'medium', 'MDY', '?')).toBe('?');
    expect(formatFuzzyDate(null)).toBe('');
  });
  test('resolveDateFormat', () => {
    expect(resolveDateFormat('system', 'en-US')).toBe('MDY');
    expect(resolveDateFormat('system', 'en-GB')).toBe('DMY');
    expect(resolveDateFormat('system', 'ja-JP')).toBe('YMD');
    expect(resolveDateFormat('DMY', 'en-US')).toBe('DMY');
  });
  test('fuzzyDateToInt sorts', () => {
    expect(fuzzyDateToInt({ year: 2024, month: 4, day: 5 })).toBe(20240405);
    expect(fuzzyDateToInt(null)).toBe(0);
  });
  test('seasons', () => {
    expect(formatSeason('WINTER', 2025)).toBe('Winter 2025');
    expect(seasonForDate(new Date(2025, 11, 15))).toEqual({ season: 'WINTER', year: 2026 });
    expect(seasonForDate(new Date(2025, 3, 1))).toEqual({ season: 'SPRING', year: 2025 });
    expect(seasonForDate(new Date(2025, 9, 1))).toEqual({ season: 'FALL', year: 2025 });
    expect(nextSeason({ season: 'FALL', year: 2025 })).toEqual({ season: 'WINTER', year: 2026 });
  });
  test('formatEnum', () => {
    expect(formatEnum('TV_SHORT')).toBe('TV Short');
    expect(formatEnum('NOT_YET_RELEASED')).toBe('Not Yet Released');
    expect(formatEnum('OVA')).toBe('OVA');
    expect(formatEnum('MOVIE')).toBe('Movie');
  });
});

describe('relative time & countdown', () => {
  const now = 1_700_000_000;
  test('relative long', () => {
    expect(formatRelativeTime(now - 10, now)).toBe('just now');
    expect(formatRelativeTime(now - 60, now)).toBe('1 minute ago');
    expect(formatRelativeTime(now - 5 * 3600, now)).toBe('5 hours ago');
    expect(formatRelativeTime(now - 2 * 86400, now)).toBe('2 days ago');
    expect(formatRelativeTime(now - 400 * 86400, now)).toBe('1 year ago');
  });
  test('relative short', () => {
    expect(formatRelativeTime(now - 10, now, 'short')).toBe('now');
    expect(formatRelativeTime(now - 300, now, 'short')).toBe('5m');
    expect(formatRelativeTime(now - 14 * 86400, now, 'short')).toBe('2w');
  });
  test('countdown', () => {
    expect(formatCountdown(now - 1, now)).toBe('Aired');
    expect(formatCountdown(now + 30, now)).toBe('<1m');
    expect(formatCountdown(now + 12 * 60, now)).toBe('12m');
    expect(formatCountdown(now + 4 * 3600 + 12 * 60, now)).toBe('4h 12m');
    expect(formatCountdown(now + 2 * 86400 + 4 * 3600 + 5 * 60, now)).toBe('2d 4h');
    expect(formatDurationSeconds(2 * 86400 + 4 * 3600 + 5 * 60, 3)).toBe('2d 4h 5m');
  });
});
