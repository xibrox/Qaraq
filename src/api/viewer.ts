import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { MEDIA_LIST_OPTIONS, USER_OPTIONS } from './fragments';
import type { UnreadNotificationCountQuery, ViewerQuery } from './types';

export const VIEWER_FIELDS = fragment(
  `
fragment ViewerFields on User {
  id
  name
  about(asHtml: false)
  avatar { large medium }
  bannerImage
  siteUrl
  unreadNotificationCount
  donatorTier
  donatorBadge
  moderatorRoles
  createdAt
  updatedAt
  options { ...UserOptionsFields }
  mediaListOptions { ...MediaListOptionsFields }
}`,
  [USER_OPTIONS, MEDIA_LIST_OPTIONS],
);

export const VIEWER_QUERY = operation(
  `
query Viewer {
  Viewer { ...ViewerFields }
}`,
  [VIEWER_FIELDS],
);

export const UNREAD_NOTIFICATION_COUNT_QUERY = operation(`
query UnreadNotificationCount {
  Viewer { id unreadNotificationCount }
}`);

export const fetchViewer = (opts?: GqlOptions) => gql<ViewerQuery>(VIEWER_QUERY, {}, opts);

export const fetchUnreadNotificationCount = (opts?: GqlOptions) =>
  gql<UnreadNotificationCountQuery>(UNREAD_NOTIFICATION_COUNT_QUERY, {}, opts);
