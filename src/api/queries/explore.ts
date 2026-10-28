/**
 * Extra TanStack hooks for Explore / Search / Media detail.
 * Keys live under `queryKeys.explore.all()` / `queryKeys.media` so the shared invalidation rules
 * (sign-out, title language, list edits) also refresh these caches.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchMediaBrowse, type MediaBrowseVariables } from '../explore-extra';
import { nextPageFrom, queryKeys } from './hooks';

export const exploreExtraKeys = {
  browse: (vars: Omit<MediaBrowseVariables, 'page'>) => [...queryKeys.explore.all(), 'browse', vars] as const,
};

/** Paged search/browse results with descriptions (Explore search screen). */
export function useMediaBrowse(vars: Omit<MediaBrowseVariables, 'page'>, opts: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: exploreExtraKeys.browse(vars),
    queryFn: ({ pageParam, signal }) => fetchMediaBrowse({ ...vars, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPageFrom(last.Page.pageInfo),
    enabled: opts.enabled,
    staleTime: 5 * 60_000,
  });
}
