// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { connectionComplete, trustedCount } from '../connection';

type Page = { info: { total: number; perPage: number; currentPage: number; lastPage: number; hasNextPage: boolean }; edges: number };

const page = (edges: number, hasNextPage: boolean): Page => ({
  info: { total: 500, perPage: 30, currentPage: 1, lastPage: 20, hasNextPage },
  edges,
});
const complete = (pages: Page[]) =>
  connectionComplete({ pages, pageParams: pages.map((_, i) => i + 1) }, (p) => p.info, (p) => p.edges);

describe('connection', () => {
  test('a single page without more is complete', () => {
    expect(complete([page(8, false)])).toBe(true);
    expect(trustedCount(true, 8)).toBe(8);
  });

  test("AniList's bogus hasNextPage is ignored once a later page is empty", () => {
    expect(complete([page(30, true)])).toBe(false);
    expect(complete([page(30, true), page(30, true)])).toBe(false);
    expect(complete([page(30, true), page(30, true), page(0, true)])).toBe(true);
  });

  test('no count until everything is loaded', () => {
    expect(trustedCount(false, 60)).toBeNull();
    expect(complete([])).toBe(false);
  });
});
