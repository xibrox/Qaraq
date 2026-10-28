import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { MEDIA_CORE, PAGE_INFO, USER_LITE } from './fragments';
import type {
  ActivitiesQuery,
  ActivitiesVariables,
  ActivityQuery,
  ActivityRepliesQuery,
  ActivityRepliesVariables,
  ActivityType,
  DeleteActivityMutation,
  DeleteActivityReplyMutation,
  LikesQuery,
  LikesVariables,
  SaveActivityReplyMutation,
  SaveActivityReplyVariables,
  SaveMessageActivityMutation,
  SaveMessageActivityVariables,
  SaveTextActivityMutation,
  SaveTextActivityVariables,
  ToggleActivityPinMutation,
  ToggleActivityPinVariables,
  ToggleActivitySubscriptionMutation,
  ToggleActivitySubscriptionVariables,
  ToggleLikeMutation,
  ToggleLikeVariables,
} from './types';

// Note: these fragments reference `$asHtml`; every operation using them declares it.

export const TEXT_ACTIVITY = fragment(
  `
fragment TextActivityFields on TextActivity {
  __typename
  id
  userId
  type
  text(asHtml: $asHtml)
  replyCount
  likeCount
  isLiked
  isSubscribed
  isLocked
  isPinned
  siteUrl
  createdAt
  user { ...UserLiteFields }
}`,
  [USER_LITE],
);

export const LIST_ACTIVITY = fragment(
  `
fragment ListActivityFields on ListActivity {
  __typename
  id
  userId
  type
  status
  progress
  replyCount
  likeCount
  isLiked
  isSubscribed
  isLocked
  isPinned
  siteUrl
  createdAt
  user { ...UserLiteFields }
  media { ...MediaCoreFields }
}`,
  [USER_LITE, MEDIA_CORE],
);

export const MESSAGE_ACTIVITY = fragment(
  `
fragment MessageActivityFields on MessageActivity {
  __typename
  id
  recipientId
  messengerId
  type
  message(asHtml: $asHtml)
  replyCount
  likeCount
  isLiked
  isSubscribed
  isLocked
  isPinned
  isPrivate
  siteUrl
  createdAt
  recipient { ...UserLiteFields }
  messenger { ...UserLiteFields }
}`,
  [USER_LITE],
);

export const ACTIVITY_UNION = fragment(
  `
fragment ActivityUnionFields on ActivityUnion {
  ... on TextActivity { ...TextActivityFields }
  ... on ListActivity { ...ListActivityFields }
  ... on MessageActivity { ...MessageActivityFields }
}`,
  [TEXT_ACTIVITY, LIST_ACTIVITY, MESSAGE_ACTIVITY],
);

export const ACTIVITY_REPLY = fragment(
  `
fragment ActivityReplyFields on ActivityReply {
  id
  userId
  activityId
  text(asHtml: $asHtml)
  likeCount
  isLiked
  createdAt
  user { ...UserLiteFields }
}`,
  [USER_LITE],
);

/**
 * Activity feed. Use `isFollowing: true` for the Following feed (requires
 * login), omit for Global; `userId` for a profile; `type`/`type_in` for the
 * All/Text/List/Messages filter; `hasRepliesOrTypeText: true` mirrors AniList's
 * global feed (hides reply-less list activity noise).
 */
export const ACTIVITIES_QUERY = operation(
  `
query Activities(
  $page: Int = 1
  $perPage: Int = 25
  $userId: Int
  $messengerId: Int
  $mediaId: Int
  $type: ActivityType
  $type_in: [ActivityType]
  $isFollowing: Boolean
  $hasReplies: Boolean
  $hasRepliesOrTypeText: Boolean
  $createdAt_lesser: Int
  $createdAt_greater: Int
  $sort: [ActivitySort] = [ID_DESC]
  $asHtml: Boolean = true
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    activities(
      userId: $userId
      messengerId: $messengerId
      mediaId: $mediaId
      type: $type
      type_in: $type_in
      isFollowing: $isFollowing
      hasReplies: $hasReplies
      hasRepliesOrTypeText: $hasRepliesOrTypeText
      createdAt_lesser: $createdAt_lesser
      createdAt_greater: $createdAt_greater
      sort: $sort
    ) {
      ...ActivityUnionFields
    }
  }
}`,
  [PAGE_INFO, ACTIVITY_UNION],
);

export const ACTIVITY_QUERY = operation(
  `
query Activity($id: Int!, $asHtml: Boolean = true) {
  Activity(id: $id) { ...ActivityUnionFields }
}`,
  [ACTIVITY_UNION],
);

export const ACTIVITY_REPLIES_QUERY = operation(
  `
query ActivityReplies($activityId: Int!, $page: Int = 1, $perPage: Int = 50, $asHtml: Boolean = true) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    activityReplies(activityId: $activityId) { ...ActivityReplyFields }
  }
}`,
  [PAGE_INFO, ACTIVITY_REPLY],
);

/** Users who liked an activity / reply / thread / comment. */
export const LIKES_QUERY = operation(
  `
query Likes($likeableId: Int!, $type: LikeableType!, $page: Int = 1, $perPage: Int = 50) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    likes(likeableId: $likeableId, type: $type) { ...UserLiteFields }
  }
}`,
  [PAGE_INFO, USER_LITE],
);

export const SAVE_TEXT_ACTIVITY_MUTATION = operation(
  `
mutation SaveTextActivity($id: Int, $text: String!, $locked: Boolean, $asHtml: Boolean = true) {
  SaveTextActivity(id: $id, text: $text, locked: $locked) { ...TextActivityFields }
}`,
  [TEXT_ACTIVITY],
);

export const SAVE_MESSAGE_ACTIVITY_MUTATION = operation(
  `
mutation SaveMessageActivity(
  $id: Int
  $message: String!
  $recipientId: Int!
  $private: Boolean
  $locked: Boolean
  $asHtml: Boolean = true
) {
  SaveMessageActivity(id: $id, message: $message, recipientId: $recipientId, private: $private, locked: $locked) {
    ...MessageActivityFields
  }
}`,
  [MESSAGE_ACTIVITY],
);

export const SAVE_ACTIVITY_REPLY_MUTATION = operation(
  `
mutation SaveActivityReply($id: Int, $activityId: Int, $text: String!, $asHtml: Boolean = true) {
  SaveActivityReply(id: $id, activityId: $activityId, text: $text) { ...ActivityReplyFields }
}`,
  [ACTIVITY_REPLY],
);

export const DELETE_ACTIVITY_MUTATION = operation(`
mutation DeleteActivity($id: Int!) {
  DeleteActivity(id: $id) { deleted }
}`);

export const DELETE_ACTIVITY_REPLY_MUTATION = operation(`
mutation DeleteActivityReply($id: Int!) {
  DeleteActivityReply(id: $id) { deleted }
}`);

export const TOGGLE_LIKE_MUTATION = operation(`
mutation ToggleLike($id: Int!, $type: LikeableType!) {
  ToggleLikeV2(id: $id, type: $type) {
    __typename
    ... on ListActivity { id likeCount isLiked }
    ... on TextActivity { id likeCount isLiked }
    ... on MessageActivity { id likeCount isLiked }
    ... on ActivityReply { id likeCount isLiked }
    ... on Thread { id likeCount isLiked }
    ... on ThreadComment { id likeCount isLiked }
  }
}`);

export const TOGGLE_ACTIVITY_SUBSCRIPTION_MUTATION = operation(`
mutation ToggleActivitySubscription($activityId: Int!, $subscribe: Boolean!) {
  ToggleActivitySubscription(activityId: $activityId, subscribe: $subscribe) {
    __typename
    ... on TextActivity { id isSubscribed }
    ... on ListActivity { id isSubscribed }
    ... on MessageActivity { id isSubscribed }
  }
}`);

export const TOGGLE_ACTIVITY_PIN_MUTATION = operation(`
mutation ToggleActivityPin($id: Int!, $pinned: Boolean!) {
  ToggleActivityPin(id: $id, pinned: $pinned) {
    __typename
    ... on TextActivity { id isPinned }
    ... on ListActivity { id isPinned }
    ... on MessageActivity { id isPinned }
  }
}`);

// ---------------------------------------------------------------------------
// Feed filter presets (Settings: default activity feed / filter)
// ---------------------------------------------------------------------------

/** `mine` = the viewer's own activity: pass `userId` in `extra`. */
export type ActivityFeed = 'mine' | 'following' | 'global';
export type ActivityFilter = 'all' | 'list' | 'text' | 'messages';

export function activityFeedVariables(
  feed: ActivityFeed,
  filter: ActivityFilter = 'all',
  extra: ActivitiesVariables = {},
): ActivitiesVariables {
  const vars: ActivitiesVariables = { ...extra };
  if (feed === 'following') vars.isFollowing = true;
  const types: Record<ActivityFilter, ActivityType[] | undefined> = {
    all: undefined,
    text: ['TEXT'],
    list: ['ANIME_LIST', 'MANGA_LIST'],
    messages: ['MESSAGE'],
  };
  const t = types[filter];
  if (t?.length === 1) vars.type = t[0];
  else if (t) vars.type_in = t;
  if (feed === 'global' && filter === 'all') vars.hasRepliesOrTypeText = true;
  return vars;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export const fetchActivities = (vars: ActivitiesVariables, opts?: GqlOptions) =>
  gql<ActivitiesQuery>(ACTIVITIES_QUERY, vars, opts);
export const fetchActivity = (id: number, opts?: GqlOptions) => gql<ActivityQuery>(ACTIVITY_QUERY, { id }, opts);
export const fetchActivityReplies = (vars: ActivityRepliesVariables, opts?: GqlOptions) =>
  gql<ActivityRepliesQuery>(ACTIVITY_REPLIES_QUERY, vars, opts);
export const fetchLikes = (vars: LikesVariables, opts?: GqlOptions) => gql<LikesQuery>(LIKES_QUERY, vars, opts);
export const saveTextActivity = (vars: SaveTextActivityVariables, opts?: GqlOptions) =>
  gql<SaveTextActivityMutation>(SAVE_TEXT_ACTIVITY_MUTATION, vars, opts);
export const saveMessageActivity = (vars: SaveMessageActivityVariables, opts?: GqlOptions) =>
  gql<SaveMessageActivityMutation>(SAVE_MESSAGE_ACTIVITY_MUTATION, vars, opts);
export const saveActivityReply = (vars: SaveActivityReplyVariables, opts?: GqlOptions) =>
  gql<SaveActivityReplyMutation>(SAVE_ACTIVITY_REPLY_MUTATION, vars, opts);
export const deleteActivity = (id: number, opts?: GqlOptions) =>
  gql<DeleteActivityMutation>(DELETE_ACTIVITY_MUTATION, { id }, opts);
export const deleteActivityReply = (id: number, opts?: GqlOptions) =>
  gql<DeleteActivityReplyMutation>(DELETE_ACTIVITY_REPLY_MUTATION, { id }, opts);
export const toggleLike = (vars: ToggleLikeVariables, opts?: GqlOptions) =>
  gql<ToggleLikeMutation>(TOGGLE_LIKE_MUTATION, vars, opts);
export const toggleActivitySubscription = (vars: ToggleActivitySubscriptionVariables, opts?: GqlOptions) =>
  gql<ToggleActivitySubscriptionMutation>(TOGGLE_ACTIVITY_SUBSCRIPTION_MUTATION, vars, opts);
export const toggleActivityPin = (vars: ToggleActivityPinVariables, opts?: GqlOptions) =>
  gql<ToggleActivityPinMutation>(TOGGLE_ACTIVITY_PIN_MUTATION, vars, opts);
