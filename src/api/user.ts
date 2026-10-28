import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { CHARACTER_LITE, MEDIA_CARD, PAGE_INFO, STAFF_LITE, STUDIO_LITE, USER_LITE } from './fragments';
import type {
  FavouriteKind,
  FollowersQuery,
  FollowingQuery,
  FollowListVariables,
  ToggleFollowMutation,
  UserActivityHistoryQuery,
  UserFavouritesOverviewQuery,
  UserFavouritesQuery,
  UserFavouritesVariables,
  UserProfileQuery,
  UserProfileVariables,
  UserStatisticsQuery,
  UserStatisticsVariables,
} from './types';

export const USER_STATISTICS_SUMMARY = fragment(`
fragment UserStatisticsSummaryFields on UserStatistics {
  count
  meanScore
  standardDeviation
  minutesWatched
  episodesWatched
  chaptersRead
  volumesRead
}`);

export const USER_PROFILE_QUERY = operation(
  `
query UserProfile($id: Int, $name: String, $asHtml: Boolean = true) {
  User(id: $id, name: $name) {
    ...UserLiteFields
    about(asHtml: $asHtml)
    bannerImage
    isFollowing
    isFollower
    isBlocked
    siteUrl
    createdAt
    updatedAt
    previousNames { name createdAt }
    options { profileColor titleLanguage }
    mediaListOptions { scoreFormat }
    statistics {
      anime { ...UserStatisticsSummaryFields }
      manga { ...UserStatisticsSummaryFields }
    }
  }
}`,
  [USER_LITE, USER_STATISTICS_SUMMARY],
);

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

const FAVOURITE_SELECTION: Record<FavouriteKind, string> = {
  anime: '...MediaCardFields',
  manga: '...MediaCardFields',
  characters: '...CharacterLiteFields',
  staff: '...StaffLiteFields',
  studios: '...StudioLiteFields',
};

const FAVOURITE_FRAGMENTS = {
  anime: MEDIA_CARD,
  manga: MEDIA_CARD,
  characters: CHARACTER_LITE,
  staff: STAFF_LITE,
  studios: STUDIO_LITE,
} as const;

const OP_NAMES: Record<FavouriteKind, string> = {
  anime: 'UserFavouriteAnime',
  manga: 'UserFavouriteManga',
  characters: 'UserFavouriteCharacters',
  staff: 'UserFavouriteStaff',
  studios: 'UserFavouriteStudios',
};

function favouritesQuery(kind: FavouriteKind) {
  return operation(
    `
query ${OP_NAMES[kind]}($id: Int!, $page: Int = 1, $perPage: Int = 25) {
  User(id: $id) {
    id
    favourites {
      ${kind}(page: $page, perPage: $perPage) {
        pageInfo { ...PageInfoFields }
        nodes { ${FAVOURITE_SELECTION[kind]} }
      }
    }
  }
}`,
    [PAGE_INFO, FAVOURITE_FRAGMENTS[kind]],
  );
}

export const USER_FAVOURITE_ANIME_QUERY = favouritesQuery('anime');
export const USER_FAVOURITE_MANGA_QUERY = favouritesQuery('manga');
export const USER_FAVOURITE_CHARACTERS_QUERY = favouritesQuery('characters');
export const USER_FAVOURITE_STAFF_QUERY = favouritesQuery('staff');
export const USER_FAVOURITE_STUDIOS_QUERY = favouritesQuery('studios');

export const USER_FAVOURITES_QUERIES: Record<FavouriteKind, string> = {
  anime: USER_FAVOURITE_ANIME_QUERY,
  manga: USER_FAVOURITE_MANGA_QUERY,
  characters: USER_FAVOURITE_CHARACTERS_QUERY,
  staff: USER_FAVOURITE_STAFF_QUERY,
  studios: USER_FAVOURITE_STUDIOS_QUERY,
};

/** First page of every favourites category (profile overview). */
export const USER_FAVOURITES_OVERVIEW_QUERY = operation(
  `
query UserFavouritesOverview($id: Int!, $perPage: Int = 15) {
  User(id: $id) {
    id
    favourites {
      anime(perPage: $perPage) { pageInfo { ...PageInfoFields } nodes { ...MediaCardFields } }
      manga(perPage: $perPage) { pageInfo { ...PageInfoFields } nodes { ...MediaCardFields } }
      characters(perPage: $perPage) { pageInfo { ...PageInfoFields } nodes { ...CharacterLiteFields } }
      staff(perPage: $perPage) { pageInfo { ...PageInfoFields } nodes { ...StaffLiteFields } }
      studios(perPage: $perPage) { pageInfo { ...PageInfoFields } nodes { ...StudioLiteFields } }
    }
  }
}`,
  [PAGE_INFO, MEDIA_CARD, CHARACTER_LITE, STAFF_LITE, STUDIO_LITE],
);

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/** Every UserStatistics breakdown. `$limit` caps the long lists. */
export const USER_STATISTICS_DETAIL = fragment(
  `
fragment UserStatisticsDetailFields on UserStatistics {
  ...UserStatisticsSummaryFields
  formats(sort: [COUNT_DESC]) { count meanScore minutesWatched chaptersRead mediaIds format }
  statuses(sort: [COUNT_DESC]) { count meanScore minutesWatched chaptersRead mediaIds status }
  scores(sort: [MEAN_SCORE]) { count meanScore minutesWatched chaptersRead mediaIds score }
  lengths(sort: [MEAN_SCORE]) { count meanScore minutesWatched chaptersRead mediaIds length }
  releaseYears(sort: [ID_DESC]) { count meanScore minutesWatched chaptersRead mediaIds releaseYear }
  startYears(sort: [ID_DESC]) { count meanScore minutesWatched chaptersRead mediaIds startYear }
  genres(sort: [COUNT_DESC]) { count meanScore minutesWatched chaptersRead mediaIds genre }
  tags(sort: [COUNT_DESC], limit: $limit) {
    count meanScore minutesWatched chaptersRead mediaIds
    tag { id name category isAdult isGeneralSpoiler }
  }
  countries(sort: [COUNT_DESC]) { count meanScore minutesWatched chaptersRead mediaIds country }
  voiceActors(sort: [COUNT_DESC], limit: $limit) {
    count meanScore minutesWatched chaptersRead mediaIds characterIds
    voiceActor { ...StaffLiteFields }
  }
  staff(sort: [COUNT_DESC], limit: $limit) {
    count meanScore minutesWatched chaptersRead mediaIds
    staff { ...StaffLiteFields }
  }
  studios(sort: [COUNT_DESC], limit: $limit) {
    count meanScore minutesWatched chaptersRead mediaIds
    studio { ...StudioLiteFields }
  }
}`,
  [USER_STATISTICS_SUMMARY, STAFF_LITE, STUDIO_LITE],
);

export const USER_ANIME_STATISTICS_QUERY = operation(
  `
query UserAnimeStatistics($id: Int!, $limit: Int = 50) {
  User(id: $id) {
    id
    name
    mediaListOptions { scoreFormat }
    statistics { anime { ...UserStatisticsDetailFields } }
  }
}`,
  [USER_STATISTICS_DETAIL],
);

export const USER_MANGA_STATISTICS_QUERY = operation(
  `
query UserMangaStatistics($id: Int!, $limit: Int = 50) {
  User(id: $id) {
    id
    name
    mediaListOptions { scoreFormat }
    statistics { manga { ...UserStatisticsDetailFields } }
  }
}`,
  [USER_STATISTICS_DETAIL],
);

/**
 * Activity history heatmap. Only available on the deprecated `User.stats`
 * object (UserStats.activityHistory), which still returns data.
 */
export const USER_ACTIVITY_HISTORY_QUERY = operation(`
query UserActivityHistory($id: Int!) {
  User(id: $id) {
    id
    stats {
      watchedTime
      chaptersRead
      activityHistory { date amount level }
    }
  }
}`);

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

const FOLLOW_USER = fragment(
  `
fragment FollowUserFields on User {
  ...UserLiteFields
  isFollowing
  isFollower
}`,
  [USER_LITE],
);

export const FOLLOWERS_QUERY = operation(
  `
query Followers($userId: Int!, $page: Int = 1, $perPage: Int = 50, $sort: [UserSort] = [USERNAME]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    followers(userId: $userId, sort: $sort) { ...FollowUserFields }
  }
}`,
  [PAGE_INFO, FOLLOW_USER],
);

export const FOLLOWING_QUERY = operation(
  `
query Following($userId: Int!, $page: Int = 1, $perPage: Int = 50, $sort: [UserSort] = [USERNAME]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    following(userId: $userId, sort: $sort) { ...FollowUserFields }
  }
}`,
  [PAGE_INFO, FOLLOW_USER],
);

export const TOGGLE_FOLLOW_MUTATION = operation(`
mutation ToggleFollow($userId: Int!) {
  ToggleFollow(userId: $userId) { id name isFollowing isFollower }
}`);

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export const fetchUserProfile = (vars: UserProfileVariables, opts?: GqlOptions) =>
  gql<UserProfileQuery>(USER_PROFILE_QUERY, vars, opts);

export const fetchUserFavourites = <K extends FavouriteKind>(
  kind: K,
  vars: UserFavouritesVariables,
  opts?: GqlOptions,
) => gql<UserFavouritesQuery<K>>(USER_FAVOURITES_QUERIES[kind], vars, opts);

export const fetchUserFavouritesOverview = (id: number, perPage?: number, opts?: GqlOptions) =>
  gql<UserFavouritesOverviewQuery>(USER_FAVOURITES_OVERVIEW_QUERY, { id, perPage }, opts);

export const fetchUserStatistics = (type: 'ANIME' | 'MANGA', vars: UserStatisticsVariables, opts?: GqlOptions) =>
  gql<UserStatisticsQuery>(type === 'ANIME' ? USER_ANIME_STATISTICS_QUERY : USER_MANGA_STATISTICS_QUERY, vars, opts);

export const fetchUserActivityHistory = (id: number, opts?: GqlOptions) =>
  gql<UserActivityHistoryQuery>(USER_ACTIVITY_HISTORY_QUERY, { id }, opts);

export const fetchFollowers = (vars: FollowListVariables, opts?: GqlOptions) =>
  gql<FollowersQuery>(FOLLOWERS_QUERY, vars, opts);
export const fetchFollowing = (vars: FollowListVariables, opts?: GqlOptions) =>
  gql<FollowingQuery>(FOLLOWING_QUERY, vars, opts);
export const toggleFollow = (userId: number, opts?: GqlOptions) =>
  gql<ToggleFollowMutation>(TOGGLE_FOLLOW_MUTATION, { userId }, opts);
