import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { CHARACTER_LITE, MEDIA_COVER, MEDIA_TITLE, PAGE_INFO, STAFF_LITE, USER_LITE } from './fragments';
import { pickTitle } from '@/lib/title';
import type { PreferredTitle } from '@/settings/types';

import type { AniListNotification, NotificationsQuery, NotificationsVariables, NotificationType } from './types';

export const NOTIFICATION_MEDIA = fragment(
  `
fragment NotificationMediaFields on Media {
  id
  type
  format
  isAdult
  title { ...MediaTitleFields }
  coverImage { ...MediaCoverFields }
}`,
  [MEDIA_TITLE, MEDIA_COVER],
);

/** Selection for every member of NotificationUnion (20 types). */
export const NOTIFICATION_UNION = fragment(
  `
fragment NotificationUnionFields on NotificationUnion {
  __typename
  ... on AiringNotification {
    id type createdAt animeId episode contexts
    media { ...NotificationMediaFields }
  }
  ... on FollowingNotification {
    id type createdAt userId context
    user { ...UserLiteFields }
  }
  ... on ActivityMessageNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    message { id message(asHtml: false) isPrivate }
  }
  ... on ActivityMentionNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    activity { ...NotificationActivityFields }
  }
  ... on ActivityReplyNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    activity { ...NotificationActivityFields }
  }
  ... on ActivityReplySubscribedNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    activity { ...NotificationActivityFields }
  }
  ... on ActivityLikeNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    activity { ...NotificationActivityFields }
  }
  ... on ActivityReplyLikeNotification {
    id type createdAt userId activityId context
    user { ...UserLiteFields }
    activity { ...NotificationActivityFields }
  }
  ... on ThreadCommentMentionNotification {
    id type createdAt userId commentId context
    user { ...UserLiteFields }
    thread { id title siteUrl }
    comment { id siteUrl }
  }
  ... on ThreadCommentReplyNotification {
    id type createdAt userId commentId context
    user { ...UserLiteFields }
    thread { id title siteUrl }
    comment { id siteUrl }
  }
  ... on ThreadCommentSubscribedNotification {
    id type createdAt userId commentId context
    user { ...UserLiteFields }
    thread { id title siteUrl }
    comment { id siteUrl }
  }
  ... on ThreadCommentLikeNotification {
    id type createdAt userId commentId context
    user { ...UserLiteFields }
    thread { id title siteUrl }
    comment { id siteUrl }
  }
  ... on ThreadLikeNotification {
    id type createdAt userId threadId context
    user { ...UserLiteFields }
    thread { id title siteUrl }
  }
  ... on RelatedMediaAdditionNotification {
    id type createdAt mediaId context
    media { ...NotificationMediaFields }
  }
  ... on MediaDataChangeNotification {
    id type createdAt mediaId context reason
    media { ...NotificationMediaFields }
  }
  ... on MediaMergeNotification {
    id type createdAt mediaId deletedMediaTitles context reason
    media { ...NotificationMediaFields }
  }
  ... on MediaDeletionNotification {
    id type createdAt deletedMediaTitle context reason
  }
  ... on MediaSubmissionUpdateNotification {
    id type createdAt contexts status notes submittedTitle
    media { ...NotificationMediaFields }
  }
  ... on StaffSubmissionUpdateNotification {
    id type createdAt contexts status notes
    staff { ...StaffLiteFields }
  }
  ... on CharacterSubmissionUpdateNotification {
    id type createdAt contexts status notes
    character { ...CharacterLiteFields }
  }
}`,
  [
    NOTIFICATION_MEDIA,
    USER_LITE,
    STAFF_LITE,
    CHARACTER_LITE,
    fragment(`
fragment NotificationActivityFields on ActivityUnion {
  __typename
  ... on TextActivity { id }
  ... on ListActivity { id }
  ... on MessageActivity { id }
}`),
  ],
);


/**
 * Notifications page. `resetNotificationCount: true` marks everything read
 * (AniList has no separate mutation for this).
 */
export const NOTIFICATIONS_QUERY = operation(
  `
query Notifications(
  $page: Int = 1
  $perPage: Int = 30
  $type_in: [NotificationType]
  $resetNotificationCount: Boolean = false
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    notifications(type_in: $type_in, resetNotificationCount: $resetNotificationCount) {
      ...NotificationUnionFields
    }
  }
}`,
  [PAGE_INFO, NOTIFICATION_UNION],
);

/** Resets the unread notification counter without loading the whole page. */
export const RESET_NOTIFICATION_COUNT_QUERY = operation(`
query ResetNotificationCount {
  Page(perPage: 1) {
    notifications(resetNotificationCount: true) { __typename }
  }
}`);

/** Filter groups used by the notifications screen, like AniList's web tabs. */
export const NOTIFICATION_GROUPS: Record<'all' | 'airing' | 'activity' | 'forum' | 'follows' | 'media', NotificationType[] | undefined> = {
  all: undefined,
  airing: ['AIRING'],
  activity: [
    'ACTIVITY_MESSAGE',
    'ACTIVITY_REPLY',
    'ACTIVITY_MENTION',
    'ACTIVITY_LIKE',
    'ACTIVITY_REPLY_LIKE',
    'ACTIVITY_REPLY_SUBSCRIBED',
  ],
  forum: ['THREAD_COMMENT_MENTION', 'THREAD_SUBSCRIBED', 'THREAD_COMMENT_REPLY', 'THREAD_LIKE', 'THREAD_COMMENT_LIKE'],
  follows: ['FOLLOWING'],
  media: [
    'RELATED_MEDIA_ADDITION',
    'MEDIA_DATA_CHANGE',
    'MEDIA_MERGE',
    'MEDIA_DELETION',
    'MEDIA_SUBMISSION_UPDATE',
    'STAFF_SUBMISSION_UPDATE',
    'CHARACTER_SUBMISSION_UPDATE',
  ],
};

export const fetchNotifications = (vars: NotificationsVariables, opts?: GqlOptions) =>
  gql<NotificationsQuery>(NOTIFICATIONS_QUERY, vars, opts);

export const resetNotificationCount = (opts?: GqlOptions) =>
  gql<unknown>(RESET_NOTIFICATION_COUNT_QUERY, {}, opts);

/**
 * Plain-text title/body for a notification (local alerts, accessibility labels, list rows).
 * AniList sends sentence fragments: `context` (" liked your activity.") goes after the user's
 * name; `contexts` interleave with values (["Episode ", " of ", " aired."]).
 */
export function describeNotification(
  n: AniListNotification,
  preferredTitle: PreferredTitle = 'userPreferred',
): { title: string; body: string; url: string } {
  const join = (parts: (string | null)[] | null | undefined, values: (string | number)[]) =>
    (parts ?? []).map((p, i) => `${p ?? ''}${i < values.length ? values[i] : ''}`).join('').trim();
  const mediaTitle = (m: { title: Parameters<typeof pickTitle>[0] } | null | undefined) =>
    pickTitle(m?.title, preferredTitle, 'Unknown title');

  switch (n.__typename) {
    case 'AiringNotification': {
      const title = mediaTitle(n.media);
      return {
        title,
        body: join(n.contexts, [n.episode, title]) || `Episode ${n.episode} of ${title} aired.`,
        url: `qaraq://media/${n.animeId}`,
      };
    }
    case 'FollowingNotification':
      return { title: n.user?.name ?? 'AniList', body: `${n.user?.name ?? 'Someone'}${n.context ?? ' followed you.'}`, url: `qaraq://user/${n.userId}` };
    case 'ActivityMessageNotification':
      return { title: n.user?.name ?? 'AniList', body: `${n.user?.name ?? 'Someone'}${n.context ?? ' sent you a message.'}`, url: `qaraq://activity/${n.activityId}` };
    case 'ActivityMentionNotification':
    case 'ActivityReplyNotification':
    case 'ActivityReplySubscribedNotification':
    case 'ActivityLikeNotification':
    case 'ActivityReplyLikeNotification':
      return { title: n.user?.name ?? 'AniList', body: `${n.user?.name ?? 'Someone'}${n.context ?? ''}`.trim(), url: `qaraq://activity/${n.activityId}` };
    case 'ThreadCommentMentionNotification':
    case 'ThreadCommentReplyNotification':
    case 'ThreadCommentSubscribedNotification':
    case 'ThreadCommentLikeNotification':
    case 'ThreadLikeNotification':
      return {
        title: n.user?.name ?? 'AniList',
        body: `${n.user?.name ?? 'Someone'}${n.context ?? ''}${n.thread?.title ?? ''}`.trim(),
        url: n.thread?.siteUrl ?? 'https://anilist.co/forum',
      };
    case 'RelatedMediaAdditionNotification':
    case 'MediaDataChangeNotification':
    case 'MediaMergeNotification': {
      const title = mediaTitle(n.media);
      return { title, body: `${title}${n.context ?? ''}`.trim(), url: `qaraq://media/${n.mediaId}` };
    }
    case 'MediaDeletionNotification':
      return { title: n.deletedMediaTitle ?? 'Media deleted', body: `${n.deletedMediaTitle ?? ''}${n.context ?? ''}`.trim(), url: 'qaraq://notifications' };
    case 'MediaSubmissionUpdateNotification':
      return { title: n.submittedTitle ?? mediaTitle(n.media), body: join(n.contexts, [n.submittedTitle ?? mediaTitle(n.media), n.status ?? '']), url: 'qaraq://notifications' };
    case 'StaffSubmissionUpdateNotification':
      return { title: n.staff?.name?.userPreferred ?? 'Staff submission', body: join(n.contexts, [n.staff?.name?.userPreferred ?? '', n.status ?? '']), url: 'qaraq://notifications' };
    case 'CharacterSubmissionUpdateNotification':
      return { title: n.character?.name?.userPreferred ?? 'Character submission', body: join(n.contexts, [n.character?.name?.userPreferred ?? '', n.status ?? '']), url: 'qaraq://notifications' };
  }
}
