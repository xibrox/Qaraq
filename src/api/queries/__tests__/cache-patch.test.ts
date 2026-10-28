// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { replaceCardEntry } from '../cache-patch';

const page = {
  pages: [
    {
      Page: {
        media: [
          { id: 1, title: 'A', mediaListEntry: null },
          { id: 2, title: 'B', mediaListEntry: { id: 20, status: 'PLANNING', progress: 0 } },
        ],
      },
    },
  ],
};

describe('replaceCardEntry', () => {
  test('writes a new entry onto the matching media card', () => {
    const next = replaceCardEntry(page, 1, { id: 10, status: 'CURRENT' }) as typeof page;
    expect(next.pages[0].Page.media[0].mediaListEntry).toEqual({ id: 10, status: 'CURRENT' });
    // Untouched branches keep their identity (structural sharing).
    expect(next.pages[0].Page.media[1]).toBe(page.pages[0].Page.media[1]);
  });

  test('merges into an existing entry and clears it on delete', () => {
    const merged = replaceCardEntry(page, 2, { status: 'CURRENT', progress: 3 }) as typeof page;
    expect(merged.pages[0].Page.media[1].mediaListEntry).toEqual({ id: 20, status: 'CURRENT', progress: 3 });
    const cleared = replaceCardEntry(page, 2, null) as typeof page;
    expect(cleared.pages[0].Page.media[1].mediaListEntry).toBeNull();
  });

  test('returns the same reference when nothing matches', () => {
    expect(replaceCardEntry(page, 99, { id: 1 })).toBe(page);
    expect(replaceCardEntry(undefined, 1, null)).toBeUndefined();
  });
});
