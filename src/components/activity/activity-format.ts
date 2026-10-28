import type { Activity, UserLite } from '@/api/types';

/** Shared with notifications and reviews; lives in `@/lib/format`. */
export { formatTimeAgo } from '@/lib/format';

/**
 * Leading text of a list activity ("Read chapter 1134 - 1187 of", "Completed", "Plans to watch").
 * AniList sends lowercase statuses ("watched episode", "read chapter", "completed",
 * "plans to watch", "paused watching", "dropped", "rewatched episode") and a progress string.
 */
export function listActivityPrefix(status: string | null | undefined, progress: string | null | undefined): string {
  const raw = (status ?? '').trim();
  const verb = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Updated';
  return progress ? `${verb} ${progress} of` : verb;
}

/** The user who created the activity (list/text owner, message sender). */
export function activityAuthor(a: Activity): UserLite | null {
  return a.__typename === 'MessageActivity' ? a.messenger : a.user;
}

export function activityAuthorId(a: Activity): number | null {
  return a.__typename === 'MessageActivity' ? a.messengerId : a.userId;
}

/** The viewer can delete an activity they wrote, or a message posted on their profile. */
export function canDeleteActivity(a: Activity, viewerId: number | null | undefined): boolean {
  if (viewerId == null) return false;
  if (a.__typename === 'MessageActivity') return a.messengerId === viewerId || a.recipientId === viewerId;
  return a.userId === viewerId;
}

/** Text statuses and sent messages can be edited by their author. */
export function canEditActivity(a: Activity, viewerId: number | null | undefined): boolean {
  if (viewerId == null) return false;
  if (a.__typename === 'TextActivity') return a.userId === viewerId;
  if (a.__typename === 'MessageActivity') return a.messengerId === viewerId;
  return false;
}

export function activityUrl(a: { id: number; siteUrl?: string | null }): string {
  return a.siteUrl ?? `https://anilist.co/activity/${a.id}`;
}

/** Donator badge text, shown only for donators ("Donator" by default). */
export function donatorBadge(user: UserLite | null | undefined): string | null {
  if (!user?.donatorTier || user.donatorTier <= 0) return null;
  return user.donatorBadge?.trim() || 'Donator';
}
