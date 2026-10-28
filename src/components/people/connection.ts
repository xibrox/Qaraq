import type { InfiniteData } from '@tanstack/react-query';

import type { PageInfo } from '@/api/types';

/**
 * AniList's `pageInfo` for nested connections (character media, studio media, staff media) is
 * unreliable past the first page: `total` caps at a bogus 500 and `hasNextPage` stays true long
 * after pages come back empty. A connection is complete once a page says there is nothing more
 * or a later page is empty.
 */
export function connectionComplete<TData>(
  data: InfiniteData<TData> | undefined,
  pageInfoOf: (page: TData) => PageInfo | null | undefined,
  edgeCountOf: (page: TData) => number,
): boolean {
  const pages = data?.pages;
  if (!pages || pages.length === 0) return false;
  const last = pages[pages.length - 1];
  if (pageInfoOf(last)?.hasNextPage === false) return true;
  return pages.length > 1 && edgeCountOf(last) === 0;
}

/** The count to show next to a section title: only once every item is loaded, otherwise none. */
export function trustedCount(complete: boolean, loaded: number): number | null {
  return complete && loaded > 0 ? loaded : null;
}
