import { useQuery } from '@tanstack/react-query';

import { ACTIVITY_QUERY } from '../activity';
import { gql } from '../client';
import { fetchUserFollowCounts } from '../profile-extra';
import type { ActivityQuery } from '../types';
import { queryKeys } from './hooks';

/** Query keys for profile-only queries. Nested under `queryKeys.user.byId` so user invalidation refreshes them. */
export const profileQueryKeys = {
  followCounts: (userId: number) => [...queryKeys.user.byId(userId), 'followCounts'] as const,
};

/** Followers / Following totals for the profile header. */
export function useUserFollowCounts(userId: number | null | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.followCounts(userId ?? -1),
    queryFn: ({ signal }) => fetchUserFollowCounts(userId!, { signal }),
    select: (d) => ({
      followers: d.followers?.pageInfo?.total ?? 0,
      following: d.following?.pageInfo?.total ?? 0,
    }),
    staleTime: 5 * 60_000,
    enabled: userId != null,
  });
}

/** Raw AniList markdown of an activity (for editing; feeds load HTML). */
export async function fetchActivityMarkdown(id: number): Promise<string> {
  const data = await gql<ActivityQuery>(ACTIVITY_QUERY, { id, asHtml: false });
  const a = data.Activity;
  if (!a) return '';
  if (a.__typename === 'TextActivity') return a.text ?? '';
  if (a.__typename === 'MessageActivity') return a.message ?? '';
  return '';
}
