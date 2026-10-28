import type { Href } from 'expo-router';

import type { AniListNotification } from '@/api/types';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import type { PreferredTitle } from '@/settings/types';

/** A run of notification text; entity names (users, titles, threads) are bold. */
export type NotificationSegment = { text: string; bold?: boolean };

/** Where tapping a notification goes: an in-app route, a web page, or nowhere. */
export type NotificationTarget = { kind: 'route'; href: Href } | { kind: 'web'; url: string } | { kind: 'none' };

export type NotificationThumb = { uri: string | null | undefined; isAdult?: boolean | null; kind: 'media' | 'user' | 'person' };

export type NotificationContent = {
  segments: NotificationSegment[];
  /** Secondary line (moderator reason / submission notes). */
  detail?: string;
  thumb: NotificationThumb | null;
  target: NotificationTarget;
  /** Tapping the thumbnail of a user notification opens their profile. */
  userId?: number;
};

const bold = (text: string): NotificationSegment => ({ text, bold: true });
const plain = (text: string): NotificationSegment => ({ text });

/**
 * Interleaves AniList's `contexts` sentence fragments with values, e.g.
 * `["Episode ", " of ", " aired."]` + `[1, "Cyberpunk"]` -> "Episode 1 of **Cyberpunk** aired.".
 * `boldValues` marks which value positions are entity names.
 */
export function interleave(
  contexts: (string | null)[] | null | undefined,
  values: string[],
  boldValues: boolean[],
): NotificationSegment[] {
  const parts = contexts ?? [];
  const out: NotificationSegment[] = [];
  const count = Math.max(parts.length, values.length);
  for (let i = 0; i < count; i++) {
    const p = parts[i];
    if (p) out.push(plain(p));
    const v = values[i];
    if (v) out.push(boldValues[i] ? bold(v) : plain(v));
  }
  return out;
}

/** Joins adjacent runs with the same weight so the renderer emits fewer Text nodes. */
function merge(segments: NotificationSegment[]): NotificationSegment[] {
  const out: NotificationSegment[] = [];
  for (const s of segments) {
    if (!s.text) continue;
    const last = out[out.length - 1];
    if (last && !!last.bold === !!s.bold) last.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

function webOr(url: string | null | undefined, fallback: string): NotificationTarget {
  return { kind: 'web', url: url || fallback };
}

/**
 * Builds AniClient's notification row: message with bold entity names, thumbnail and tap
 * target. Wording follows AniList's own `context` strings, which give the verbatim messages
 * ("Someone266 liked your activity.", "Episode 1 of X aired.", "X was recently added to the site.").
 */
export function notificationContent(n: AniListNotification, preferredTitle: PreferredTitle = 'userPreferred'): NotificationContent {
  const title = (m: { title: Parameters<typeof pickTitle>[0] } | null | undefined) => pickTitle(m?.title, preferredTitle, 'Unknown title');

  switch (n.__typename) {
    case 'AiringNotification': {
      const t = title(n.media);
      const segments = n.contexts?.length
        ? interleave(n.contexts, [String(n.episode), t], [false, true])
        : [plain(`Episode ${n.episode} of `), bold(t), plain(' aired.')];
      return {
        segments: merge(segments),
        thumb: { uri: n.media?.coverImage?.large ?? n.media?.coverImage?.medium, isAdult: n.media?.isAdult, kind: 'media' },
        target: { kind: 'route', href: hrefs.media(n.animeId) },
      };
    }
    case 'FollowingNotification':
      return {
        segments: merge([bold(n.user?.name ?? 'Someone'), plain(n.context ?? ' started following you.')]),
        thumb: userThumb(n.user),
        target: { kind: 'route', href: hrefs.user(n.userId) },
        userId: n.userId,
      };
    case 'ActivityMessageNotification':
      return {
        segments: merge([bold(n.user?.name ?? 'Someone'), plain(n.context ?? ' sent you a message.')]),
        thumb: userThumb(n.user),
        target: { kind: 'route', href: hrefs.activity(n.activityId) },
        userId: n.userId,
      };
    case 'ActivityMentionNotification':
    case 'ActivityReplyNotification':
    case 'ActivityReplySubscribedNotification':
    case 'ActivityLikeNotification':
    case 'ActivityReplyLikeNotification':
      return {
        segments: merge([bold(n.user?.name ?? 'Someone'), plain(n.context ?? fallbackActivityContext(n.__typename))]),
        thumb: userThumb(n.user),
        target: { kind: 'route', href: hrefs.activity(n.activity?.id ?? n.activityId) },
        userId: n.userId,
      };
    case 'ThreadCommentMentionNotification':
    case 'ThreadCommentReplyNotification':
    case 'ThreadCommentSubscribedNotification':
    case 'ThreadCommentLikeNotification':
      return {
        segments: merge([bold(n.user?.name ?? 'Someone'), plain(n.context ?? ''), bold(n.thread?.title ?? '')]),
        thumb: userThumb(n.user),
        target: webOr(n.comment?.siteUrl ?? n.thread?.siteUrl, `https://anilist.co/forum/comment/${n.commentId}`),
        userId: n.userId,
      };
    case 'ThreadLikeNotification':
      return {
        segments: merge([bold(n.user?.name ?? 'Someone'), plain(n.context ?? ' liked your forum thread '), bold(n.thread?.title ?? '')]),
        thumb: userThumb(n.user),
        target: webOr(n.thread?.siteUrl, `https://anilist.co/forum/thread/${n.threadId}`),
        userId: n.userId,
      };
    case 'RelatedMediaAdditionNotification':
      return {
        segments: merge([bold(title(n.media)), plain(n.context ?? ' was recently added to the site.')]),
        thumb: mediaThumb(n.media),
        target: { kind: 'route', href: hrefs.media(n.mediaId) },
      };
    case 'MediaDataChangeNotification':
      return {
        segments: merge([bold(title(n.media)), plain(n.context ?? ' received site data changes.')]),
        detail: n.reason?.trim() || undefined,
        thumb: mediaThumb(n.media),
        target: { kind: 'route', href: hrefs.media(n.mediaId) },
      };
    case 'MediaMergeNotification': {
      const deleted = (n.deletedMediaTitles ?? []).filter((t): t is string => !!t).join(', ');
      return {
        segments: merge([bold(deleted || 'A title'), plain(n.context ?? ' was merged into '), bold(title(n.media))]),
        detail: n.reason?.trim() || undefined,
        thumb: mediaThumb(n.media),
        target: { kind: 'route', href: hrefs.media(n.mediaId) },
      };
    }
    case 'MediaDeletionNotification':
      return {
        segments: merge([bold(n.deletedMediaTitle ?? 'A title'), plain(n.context ?? ' was deleted from the site.')]),
        detail: n.reason?.trim() || undefined,
        thumb: null,
        target: { kind: 'none' },
      };
    case 'MediaSubmissionUpdateNotification': {
      const t = n.submittedTitle || title(n.media);
      return {
        segments: merge(
          n.contexts?.length
            ? interleave(n.contexts, [t, n.status ?? ''], [true, true])
            : [plain('Your submission for '), bold(t), plain(` was ${n.status ?? 'updated'}.`)],
        ),
        detail: n.notes?.trim() || undefined,
        thumb: n.media ? mediaThumb(n.media) : null,
        target: n.media ? { kind: 'route', href: hrefs.media(n.media.id) } : { kind: 'none' },
      };
    }
    case 'StaffSubmissionUpdateNotification': {
      const name = n.staff?.name?.userPreferred ?? n.staff?.name?.full ?? 'staff';
      return {
        segments: merge(
          n.contexts?.length
            ? interleave(n.contexts, [name, n.status ?? ''], [true, true])
            : [plain('Your submission for '), bold(name), plain(` was ${n.status ?? 'updated'}.`)],
        ),
        detail: n.notes?.trim() || undefined,
        thumb: n.staff ? { uri: n.staff.image?.large ?? n.staff.image?.medium, kind: 'person' } : null,
        target: n.staff ? { kind: 'route', href: hrefs.staff(n.staff.id) } : { kind: 'none' },
      };
    }
    case 'CharacterSubmissionUpdateNotification': {
      const name = n.character?.name?.userPreferred ?? n.character?.name?.full ?? 'character';
      return {
        segments: merge(
          n.contexts?.length
            ? interleave(n.contexts, [name, n.status ?? ''], [true, true])
            : [plain('Your submission for '), bold(name), plain(` was ${n.status ?? 'updated'}.`)],
        ),
        detail: n.notes?.trim() || undefined,
        thumb: n.character ? { uri: n.character.image?.large ?? n.character.image?.medium, kind: 'person' } : null,
        target: n.character ? { kind: 'route', href: hrefs.character(n.character.id) } : { kind: 'none' },
      };
    }
    default:
      return { segments: [plain('New notification')], thumb: null, target: { kind: 'none' } };
  }
}

function userThumb(user: { avatar: { large?: string | null; medium?: string | null } | null } | null): NotificationThumb {
  return { uri: user?.avatar?.large ?? user?.avatar?.medium, kind: 'user' };
}

function mediaThumb(
  media: { isAdult: boolean | null; coverImage: { large?: string | null; medium?: string | null } | null } | null,
): NotificationThumb {
  return { uri: media?.coverImage?.large ?? media?.coverImage?.medium, isAdult: media?.isAdult, kind: 'media' };
}

function fallbackActivityContext(typename: string): string {
  switch (typename) {
    case 'ActivityMentionNotification':
      return ' mentioned you in their activity.';
    case 'ActivityReplyNotification':
      return ' replied to your activity.';
    case 'ActivityReplySubscribedNotification':
      return " replied to activity you're subscribed to.";
    case 'ActivityLikeNotification':
      return ' liked your activity.';
    case 'ActivityReplyLikeNotification':
      return ' liked your activity reply.';
    default:
      return '';
  }
}

/** Notification filter menu ("All", "Airing", ...), backed by `NOTIFICATION_GROUPS`. */
export const NOTIFICATION_FILTERS = ['all', 'airing', 'activity', 'forum', 'follows', 'media'] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];
export const NOTIFICATION_FILTER_LABELS: Record<NotificationFilter, string> = {
  all: 'All',
  airing: 'Airing',
  activity: 'Activity',
  forum: 'Forum',
  follows: 'Follows',
  media: 'Media',
};
