import { activityFeedVariables } from '@/api/activity';
import { flattenPages, useActivities } from '@/api/queries/hooks';
import type { ActivitiesQuery, Activity } from '@/api/types';
import { activityAuthorId } from '@/components/activity/activity-format';
import type { ActivityFeed, ActivityFilter } from '@/settings';

export type ProfileFeedOptions = {
  /** Profile owner (used for "My Activity" and other users' profiles). */
  userId: number | null | undefined;
  viewerId: number | null | undefined;
  feed: ActivityFeed;
  filter: ActivityFilter;
  /** "Display My Activity in Following". */
  showOwnInFollowing: boolean;
  enabled?: boolean;
};

/**
 * Activity feed for the profile's Activity tab: "My Activity" (the profile owner's activity),
 * "Following" (needs sign-in; optionally hides the viewer's own entries) or "Global", filtered by
 * All / List Progress / Text Status / Messages.
 */
export function useProfileFeed({ userId, viewerId, feed, filter, showOwnInFollowing, enabled = true }: ProfileFeedOptions) {
  const scoped = feed === 'mine';
  const vars = activityFeedVariables(feed, filter, scoped && userId != null ? { userId } : {});
  // Following can't be filtered server-side to exclude the viewer, so over-fetch slightly.
  const query = useActivities(
    { ...vars, perPage: 25 },
    { enabled: enabled && (!scoped || userId != null) && (feed !== 'following' || viewerId != null) },
  );
  const all = flattenPages<ActivitiesQuery, Activity>(query.data, (p) => p.Page.activities);
  const hideOwn = feed === 'following' && !showOwnInFollowing && viewerId != null;
  const activities = dedupeById(hideOwn ? all.filter((a) => activityAuthorId(a) !== viewerId) : all);
  return { ...query, activities };
}

/**
 * Drops repeats across pages: new global activity shifts the offset pagination, so the next page
 * can start with items already shown (QA: duplicate-key warnings and doubled cards).
 */
export function dedupeById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
