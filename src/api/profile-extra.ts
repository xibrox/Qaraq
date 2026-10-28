import { gql, type GqlOptions } from './client';
import { operation } from './document';

/**
 * Followers / Following totals for the Profile header ("Followers 35", "Following 19").
 * `UserProfile` has no follow counts, so two aliased one-item pages read `pageInfo.total`.
 */
export const USER_FOLLOW_COUNTS_QUERY = operation(`
query UserFollowCounts($userId: Int!) {
  followers: Page(perPage: 1) {
    pageInfo { total }
    followers(userId: $userId) { id }
  }
  following: Page(perPage: 1) {
    pageInfo { total }
    following(userId: $userId) { id }
  }
}`);

export interface UserFollowCountsQuery {
  followers: { pageInfo: { total: number | null } | null } | null;
  following: { pageInfo: { total: number | null } | null } | null;
}

export const fetchUserFollowCounts = (userId: number, opts?: GqlOptions) =>
  gql<UserFollowCountsQuery>(USER_FOLLOW_COUNTS_QUERY, { userId }, opts);
