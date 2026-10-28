import { fragment } from './document';

/** Shared GraphQL fragments. Result shapes live in ./types.ts next to the matching names. */

export const PAGE_INFO = fragment(`
fragment PageInfoFields on PageInfo {
  total
  perPage
  currentPage
  lastPage
  hasNextPage
}`);

export const MEDIA_TITLE = fragment(`
fragment MediaTitleFields on MediaTitle {
  romaji
  english
  native
  userPreferred
}`);

export const MEDIA_COVER = fragment(`
fragment MediaCoverFields on MediaCoverImage {
  extraLarge
  large
  medium
  color
}`);

export const AIRING_EPISODE = fragment(`
fragment AiringEpisodeFields on AiringSchedule {
  id
  airingAt
  timeUntilAiring
  episode
  mediaId
}`);

/** Media fields shared by every list/grid/card. No viewer-specific data. */
export const MEDIA_CORE = fragment(
  `
fragment MediaCoreFields on Media {
  id
  idMal
  type
  format
  status(version: 2)
  title { ...MediaTitleFields }
  coverImage { ...MediaCoverFields }
  bannerImage
  episodes
  chapters
  volumes
  duration
  season
  seasonYear
  startDate { year month day }
  endDate { year month day }
  averageScore
  meanScore
  popularity
  favourites
  genres
  countryOfOrigin
  isAdult
  siteUrl
  nextAiringEpisode { ...AiringEpisodeFields }
}`,
  [MEDIA_TITLE, MEDIA_COVER, AIRING_EPISODE],
);

/** Compact viewer list entry used on cards (on-list badges, quick +1). */
export const MEDIA_LIST_ENTRY_LITE = fragment(`
fragment MediaListEntryLiteFields on MediaList {
  id
  mediaId
  status
  score
  progress
  progressVolumes
  repeat
}`);

/** MediaCore + the viewer's list entry (null when logged out / not on list). */
export const MEDIA_CARD = fragment(
  `
fragment MediaCardFields on Media {
  ...MediaCoreFields
  mediaListEntry { ...MediaListEntryLiteFields }
}`,
  [MEDIA_CORE, MEDIA_LIST_ENTRY_LITE],
);

/**
 * Every field of a list entry that the edit sheet needs.
 *
 * `score` is in the owner's score format. Do not also select an aliased
 * `score(format: POINT_100)` here: AniList then returns the POINT_100 value in the plain
 * `score` field for most MediaListCollection entries, so every score shows 10x too large.
 */
export const MEDIA_LIST_ENTRY = fragment(`
fragment MediaListEntryFields on MediaList {
  id
  userId
  mediaId
  status
  score
  progress
  progressVolumes
  repeat
  priority
  private
  notes
  hiddenFromStatusLists
  customLists(asArray: false)
  advancedScores
  startedAt { year month day }
  completedAt { year month day }
  updatedAt
  createdAt
}`);

export const USER_LITE = fragment(`
fragment UserLiteFields on User {
  id
  name
  avatar { large medium }
  donatorTier
  donatorBadge
  moderatorRoles
}`);

export const CHARACTER_LITE = fragment(`
fragment CharacterLiteFields on Character {
  id
  name { full native userPreferred }
  image { large medium }
  favourites
  isFavourite
}`);

export const STAFF_LITE = fragment(`
fragment StaffLiteFields on Staff {
  id
  name { full native userPreferred }
  image { large medium }
  languageV2
  primaryOccupations
  favourites
  isFavourite
}`);

export const STUDIO_LITE = fragment(`
fragment StudioLiteFields on Studio {
  id
  name
  isAnimationStudio
  favourites
  isFavourite
  siteUrl
}`);

export const MEDIA_LIST_OPTIONS = fragment(`
fragment MediaListOptionsFields on MediaListOptions {
  scoreFormat
  rowOrder
  animeList {
    sectionOrder
    splitCompletedSectionByFormat
    customLists
    advancedScoring
    advancedScoringEnabled
  }
  mangaList {
    sectionOrder
    splitCompletedSectionByFormat
    customLists
    advancedScoring
    advancedScoringEnabled
  }
}`);

export const USER_OPTIONS = fragment(`
fragment UserOptionsFields on UserOptions {
  titleLanguage
  staffNameLanguage
  displayAdultContent
  airingNotifications
  profileColor
  timezone
  activityMergeTime
  restrictMessagesToFollowing
  notificationOptions { type enabled }
  disabledListActivity { type disabled }
}`);

export const REVIEW_LITE = fragment(
  `
fragment ReviewLiteFields on Review {
  id
  userId
  mediaId
  mediaType
  summary
  rating
  ratingAmount
  userRating
  score
  private
  siteUrl
  createdAt
  updatedAt
  user { ...UserLiteFields }
}`,
  [USER_LITE],
);
