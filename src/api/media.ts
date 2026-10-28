import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import {
  AIRING_EPISODE,
  CHARACTER_LITE,
  MEDIA_CARD,
  MEDIA_CORE,
  MEDIA_LIST_ENTRY,
  PAGE_INFO,
  REVIEW_LITE,
  STAFF_LITE,
  STUDIO_LITE,
  USER_LITE,
} from './fragments';
import type {
  MediaAiringScheduleQuery,
  MediaAiringScheduleVariables,
  MediaCharactersQuery,
  MediaCharactersVariables,
  MediaDetailQuery,
  MediaDetailVariables,
  MediaFollowingQuery,
  MediaFollowingVariables,
  MediaRecommendationsQuery,
  MediaRecommendationsVariables,
  MediaReviewsQuery,
  MediaReviewsVariables,
  MediaStaffQuery,
  MediaStaffVariables,
  MediaStatsQuery,
  SaveRecommendationMutation,
  SaveRecommendationVariables,
} from './types';

export const MEDIA_CHARACTER_EDGE = fragment(
  `
fragment MediaCharacterEdgeFields on CharacterEdge {
  id
  role
  name
  voiceActorRoles(language: $language, sort: [RELEVANCE, ID]) {
    roleNotes
    dubGroup
    voiceActor { ...StaffLiteFields }
  }
  node { ...CharacterLiteFields }
}`,
  [STAFF_LITE, CHARACTER_LITE],
);

export const MEDIA_STAFF_EDGE = fragment(
  `
fragment MediaStaffEdgeFields on StaffEdge {
  id
  role
  node { ...StaffLiteFields }
}`,
  [STAFF_LITE],
);

export const MEDIA_RECOMMENDATION = fragment(
  `
fragment MediaRecommendationFields on Recommendation {
  id
  rating
  userRating
  mediaRecommendation { ...MediaCardFields }
}`,
  [MEDIA_CARD],
);

export const MEDIA_TAG = fragment(`
fragment MediaTagFields on MediaTag {
  id
  name
  description
  category
  rank
  isGeneralSpoiler
  isMediaSpoiler
  isAdult
}`);

export const MEDIA_RANK = fragment(`
fragment MediaRankFields on MediaRank {
  id
  rank
  type
  format
  year
  season
  allTime
  context
}`);

export const MEDIA_STATS = fragment(`
fragment MediaStatsFields on MediaStats {
  scoreDistribution { score amount }
  statusDistribution { status amount }
}`);

export const FOLLOWING_LIST_ENTRY = fragment(
  `
fragment FollowingListEntryFields on MediaList {
  id
  status
  score
  progress
  progressVolumes
  repeat
  user {
    ...UserLiteFields
    mediaListOptions { scoreFormat }
  }
}`,
  [USER_LITE],
);

/**
 * Everything the media detail screen shows, in one request. Variables with
 * defaults keep the first page of each paged section small; dedicated paged
 * queries below load more.
 */
export const MEDIA_DETAIL_QUERY = operation(
  `
query MediaDetail(
  $id: Int!
  $withFollowing: Boolean = false
  $language: StaffLanguage
  $charactersPerPage: Int = 12
  $staffPerPage: Int = 12
  $recommendationsPerPage: Int = 12
  $reviewsPerPage: Int = 6
  $followingPerPage: Int = 10
) {
  Media(id: $id) {
    ...MediaCoreFields
    synonyms
    description(asHtml: true)
    source(version: 3)
    hashtag
    isLicensed
    updatedAt
    trending
    tags { ...MediaTagFields }
    studios {
      edges {
        isMain
        node { ...StudioLiteFields }
      }
    }
    rankings { ...MediaRankFields }
    trailer { id site thumbnail }
    externalLinks { id url site siteId type language color icon notes isDisabled }
    streamingEpisodes { title thumbnail url site }
    airingSchedule(notYetAired: true, perPage: 25) {
      pageInfo { ...PageInfoFields }
      nodes { ...AiringEpisodeFields }
    }
    characters(sort: [ROLE, RELEVANCE, ID], perPage: $charactersPerPage) {
      pageInfo { ...PageInfoFields }
      edges { ...MediaCharacterEdgeFields }
    }
    staff(sort: [RELEVANCE, ID], perPage: $staffPerPage) {
      pageInfo { ...PageInfoFields }
      edges { ...MediaStaffEdgeFields }
    }
    relations {
      edges {
        id
        relationType(version: 2)
        node { ...MediaCardFields }
      }
    }
    recommendations(sort: [RATING_DESC, ID], perPage: $recommendationsPerPage) {
      pageInfo { ...PageInfoFields }
      nodes { ...MediaRecommendationFields }
    }
    reviews(sort: [RATING_DESC, ID], perPage: $reviewsPerPage) {
      pageInfo { ...PageInfoFields }
      nodes { ...ReviewLiteFields }
    }
    stats { ...MediaStatsFields }
    isFavourite
    isFavouriteBlocked
    isRecommendationBlocked
    isReviewBlocked
    mediaListEntry { ...MediaListEntryFields }
  }
  following: Page(perPage: $followingPerPage) @include(if: $withFollowing) {
    pageInfo { ...PageInfoFields }
    mediaList(mediaId: $id, isFollowing: true, sort: [UPDATED_TIME_DESC]) {
      ...FollowingListEntryFields
    }
  }
}`,
  [
    MEDIA_CORE,
    MEDIA_TAG,
    STUDIO_LITE,
    MEDIA_RANK,
    PAGE_INFO,
    AIRING_EPISODE,
    MEDIA_CHARACTER_EDGE,
    MEDIA_STAFF_EDGE,
    MEDIA_CARD,
    MEDIA_RECOMMENDATION,
    REVIEW_LITE,
    MEDIA_STATS,
    MEDIA_LIST_ENTRY,
    FOLLOWING_LIST_ENTRY,
  ],
);

export const MEDIA_CHARACTERS_QUERY = operation(
  `
query MediaCharacters(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $language: StaffLanguage
  $sort: [CharacterSort] = [ROLE, RELEVANCE, ID]
  $role: CharacterRole
) {
  Media(id: $id) {
    id
    characters(page: $page, perPage: $perPage, sort: $sort, role: $role) {
      pageInfo { ...PageInfoFields }
      edges { ...MediaCharacterEdgeFields }
    }
  }
}`,
  [PAGE_INFO, MEDIA_CHARACTER_EDGE],
);

export const MEDIA_STAFF_QUERY = operation(
  `
query MediaStaff($id: Int!, $page: Int = 1, $perPage: Int = 25, $sort: [StaffSort] = [RELEVANCE, ID]) {
  Media(id: $id) {
    id
    staff(page: $page, perPage: $perPage, sort: $sort) {
      pageInfo { ...PageInfoFields }
      edges { ...MediaStaffEdgeFields }
    }
  }
}`,
  [PAGE_INFO, MEDIA_STAFF_EDGE],
);

export const MEDIA_RECOMMENDATIONS_QUERY = operation(
  `
query MediaRecommendations(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $sort: [RecommendationSort] = [RATING_DESC, ID]
) {
  Media(id: $id) {
    id
    recommendations(page: $page, perPage: $perPage, sort: $sort) {
      pageInfo { ...PageInfoFields }
      nodes { ...MediaRecommendationFields }
    }
  }
}`,
  [PAGE_INFO, MEDIA_RECOMMENDATION],
);

export const MEDIA_REVIEWS_QUERY = operation(
  `
query MediaReviews($id: Int!, $page: Int = 1, $perPage: Int = 15, $sort: [ReviewSort] = [RATING_DESC, ID]) {
  Media(id: $id) {
    id
    reviews(page: $page, perPage: $perPage, sort: $sort) {
      pageInfo { ...PageInfoFields }
      nodes { ...ReviewLiteFields }
    }
  }
}`,
  [PAGE_INFO, REVIEW_LITE],
);

const MEDIA_TREND = fragment(`
fragment MediaTrendFields on MediaTrend {
  date
  trending
  averageScore
  popularity
  inProgress
  episode
  releasing
}`);

/** Stats tab: rankings, score/status distributions and recent trends. */
export const MEDIA_STATS_QUERY = operation(
  `
query MediaStats($id: Int!) {
  Media(id: $id) {
    id
    rankings { ...MediaRankFields }
    stats { ...MediaStatsFields }
    trends(sort: [DATE_DESC], perPage: 30) {
      pageInfo { ...PageInfoFields }
      nodes { ...MediaTrendFields }
    }
    airingTrends: trends(releasing: true, sort: [EPISODE_DESC], perPage: 25) {
      pageInfo { ...PageInfoFields }
      nodes { ...MediaTrendFields }
    }
  }
}`,
  [MEDIA_RANK, MEDIA_STATS, PAGE_INFO, MEDIA_TREND],
);

export const MEDIA_AIRING_SCHEDULE_QUERY = operation(
  `
query MediaAiringSchedule($id: Int!, $page: Int = 1, $perPage: Int = 25, $notYetAired: Boolean) {
  Media(id: $id) {
    id
    airingSchedule(page: $page, perPage: $perPage, notYetAired: $notYetAired) {
      pageInfo { ...PageInfoFields }
      nodes { ...AiringEpisodeFields }
    }
  }
}`,
  [PAGE_INFO, AIRING_EPISODE],
);

/** Following users' entries for a media (logged in only). */
export const MEDIA_FOLLOWING_QUERY = operation(
  `
query MediaFollowing($mediaId: Int!, $page: Int = 1, $perPage: Int = 25) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    mediaList(mediaId: $mediaId, isFollowing: true, sort: [UPDATED_TIME_DESC]) {
      ...FollowingListEntryFields
    }
  }
}`,
  [PAGE_INFO, FOLLOWING_LIST_ENTRY],
);

export const SAVE_RECOMMENDATION_MUTATION = operation(
  `
mutation SaveRecommendation($mediaId: Int!, $mediaRecommendationId: Int!, $rating: RecommendationRating!) {
  SaveRecommendation(mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, rating: $rating) {
    ...MediaRecommendationFields
  }
}`,
  [MEDIA_RECOMMENDATION],
);

export const fetchMediaDetail = (vars: MediaDetailVariables, opts?: GqlOptions) =>
  gql<MediaDetailQuery>(MEDIA_DETAIL_QUERY, vars, opts);
export const fetchMediaCharacters = (vars: MediaCharactersVariables, opts?: GqlOptions) =>
  gql<MediaCharactersQuery>(MEDIA_CHARACTERS_QUERY, vars, opts);
export const fetchMediaStaff = (vars: MediaStaffVariables, opts?: GqlOptions) =>
  gql<MediaStaffQuery>(MEDIA_STAFF_QUERY, vars, opts);
export const fetchMediaRecommendations = (vars: MediaRecommendationsVariables, opts?: GqlOptions) =>
  gql<MediaRecommendationsQuery>(MEDIA_RECOMMENDATIONS_QUERY, vars, opts);
export const fetchMediaReviews = (vars: MediaReviewsVariables, opts?: GqlOptions) =>
  gql<MediaReviewsQuery>(MEDIA_REVIEWS_QUERY, vars, opts);
export const fetchMediaStats = (id: number, opts?: GqlOptions) =>
  gql<MediaStatsQuery>(MEDIA_STATS_QUERY, { id }, opts);
export const fetchMediaAiringSchedule = (vars: MediaAiringScheduleVariables, opts?: GqlOptions) =>
  gql<MediaAiringScheduleQuery>(MEDIA_AIRING_SCHEDULE_QUERY, vars, opts);
export const fetchMediaFollowing = (vars: MediaFollowingVariables, opts?: GqlOptions) =>
  gql<MediaFollowingQuery>(MEDIA_FOLLOWING_QUERY, vars, opts);
export const saveRecommendation = (vars: SaveRecommendationVariables, opts?: GqlOptions) =>
  gql<SaveRecommendationMutation>(SAVE_RECOMMENDATION_MUTATION, vars, opts);
