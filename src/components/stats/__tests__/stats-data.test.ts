// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import {
  buildHeatmap,
  describeEntry,
  formatMean,
  formatSpaced,
  heatLevel,
  lengthOrder,
  scoreBucketLabel,
  scoresAreHundredScale,
  shareLabel,
} from '../stats-data';

describe('stats-data', () => {
  test('formatSpaced groups thousands with spaces', () => {
    expect(formatSpaced(3974)).toBe('3 974');
    expect(formatSpaced(189301)).toBe('189 301');
    expect(formatSpaced(66.84, 1)).toBe('66.8');
  });

  test('heatLevel buckets relative to max', () => {
    expect(heatLevel(0, 10)).toBe(0);
    expect(heatLevel(1, 10)).toBe(1);
    expect(heatLevel(10, 10)).toBe(4);
  });

  test('buildHeatmap places today in the last column and marks future days', () => {
    const today = new Date(2026, 9, 21); // Wednesday
    const sec = Math.floor(new Date(2026, 9, 20).getTime() / 1000);
    const grid = buildHeatmap([{ date: sec, amount: 3, level: 2 }], 4, today);
    expect(grid.columns).toHaveLength(4);
    const last = grid.columns[3];
    expect(last[2].amount).toBe(3); // Tuesday
    expect(last[2].level).toBe(4);
    expect(last[4].future).toBe(true);
    expect(grid.max).toBe(3);
  });

  test('length and score labels', () => {
    expect(lengthOrder('2-6')).toBe(2);
    expect(lengthOrder(null)).toBeGreaterThan(1000);
    expect(scoreBucketLabel(85, 'POINT_10_DECIMAL')).toBe('8.5');
    expect(scoreBucketLabel(7, 'POINT_10')).toBe('7');
  });

  test('POINT_10_DECIMAL buckets on the 100-point scale get unique, scaled labels', () => {
    const raw = [10, 20, 30, 45, 85, 100];
    const hundred = scoresAreHundredScale(raw, 'POINT_10_DECIMAL');
    expect(hundred).toBe(true);
    const labels = raw.map((s) => scoreBucketLabel(s, 'POINT_10_DECIMAL', hundred));
    expect(labels).toEqual(['1', '2', '3', '4.5', '8.5', '10']);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('POINT_10 buckets already on the 10-point scale are left alone', () => {
    const raw = [1, 5, 10];
    const hundred = scoresAreHundredScale(raw, 'POINT_10');
    expect(hundred).toBe(false);
    expect(raw.map((s) => scoreBucketLabel(s, 'POINT_10', hundred))).toEqual(['1', '5', '10']);
    expect(scoresAreHundredScale([40, 100], 'POINT_100')).toBe(false);
  });

  test('means follow the user score format', () => {
    expect(formatMean(86.5, 'POINT_10_DECIMAL')).toBe('8.7');
    expect(formatMean(86.5, 'POINT_100')).toBe('86.5');
    expect(formatMean(80, 'POINT_5')).toBe('4.0');
    expect(formatMean(0, 'POINT_10')).toBe('-');
    expect(describeEntry({ count: 2, meanScore: 10, minutesWatched: 0, chaptersRead: 0 }, 'ANIME', 'POINT_10_DECIMAL')).toBe(
      '2 titles · 1.0 mean',
    );
  });

  test('shareLabel never shows 0% for a non-zero share', () => {
    expect(shareLabel(0)).toBe('0%');
    expect(shareLabel(0.002)).toBe('<1%');
    expect(shareLabel(0.24)).toBe('24%');
  });
});
