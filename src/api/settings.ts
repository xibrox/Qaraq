import { gql, type GqlOptions } from './client';
import { operation } from './document';
import type { UpdateUserMutation, UpdateUserVariables } from './types';
import { VIEWER_FIELDS } from './viewer';

/** AniList account settings (synced). Returns the full updated Viewer. */
export const UPDATE_USER_MUTATION = operation(
  `
mutation UpdateUser(
  $about: String
  $titleLanguage: UserTitleLanguage
  $staffNameLanguage: UserStaffNameLanguage
  $displayAdultContent: Boolean
  $airingNotifications: Boolean
  $scoreFormat: ScoreFormat
  $rowOrder: String
  $profileColor: String
  $donatorBadge: String
  $notificationOptions: [NotificationOptionInput]
  $timezone: String
  $activityMergeTime: Int
  $animeListOptions: MediaListOptionsInput
  $mangaListOptions: MediaListOptionsInput
  $restrictMessagesToFollowing: Boolean
  $disabledListActivity: [ListActivityOptionInput]
) {
  UpdateUser(
    about: $about
    titleLanguage: $titleLanguage
    staffNameLanguage: $staffNameLanguage
    displayAdultContent: $displayAdultContent
    airingNotifications: $airingNotifications
    scoreFormat: $scoreFormat
    rowOrder: $rowOrder
    profileColor: $profileColor
    donatorBadge: $donatorBadge
    notificationOptions: $notificationOptions
    timezone: $timezone
    activityMergeTime: $activityMergeTime
    animeListOptions: $animeListOptions
    mangaListOptions: $mangaListOptions
    restrictMessagesToFollowing: $restrictMessagesToFollowing
    disabledListActivity: $disabledListActivity
  ) {
    ...ViewerFields
  }
}`,
  [VIEWER_FIELDS],
);

/** AniList's accepted `rowOrder` values for list sorting. */
export const ROW_ORDERS = ['score', 'title', 'updatedAt', 'id'] as const;
/** Preset profile colours (donators may also use a hex value). */
export const PROFILE_COLORS = ['blue', 'purple', 'pink', 'orange', 'red', 'green', 'gray'] as const;
/** Allowed activityMergeTime values in minutes (0 = never merge, 29160 = always). */
export const ACTIVITY_MERGE_TIMES = [0, 30, 60, 120, 180, 360, 720, 1440, 2880, 4320, 10080, 20160, 29160] as const;

export const updateUser = (vars: UpdateUserVariables, opts?: GqlOptions) =>
  gql<UpdateUserMutation>(UPDATE_USER_MUTATION, vars, opts);
