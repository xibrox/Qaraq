/**
 * Hand-written AniList types.
 *
 * Enum unions mirror docs/anilist-schema.json exactly (scripts/validate-graphql.ts
 * checks them). Result shapes mirror the fragments/operations in this folder.
 */

// ---------------------------------------------------------------------------
// Scalars
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 country code, e.g. "JP", "KR", "CN", "TW". */
export type CountryCode = string;
/** 8 digit date int, YYYYMMDD; unknown parts are 0 (e.g. 20230000). */
export type FuzzyDateInt = number;
export type Json = unknown;

// ---------------------------------------------------------------------------
// Enums (exactly matching the schema)
// ---------------------------------------------------------------------------

export type MediaType =
  | 'ANIME'
  | 'MANGA';

export type MediaFormat =
  | 'TV'
  | 'TV_SHORT'
  | 'MOVIE'
  | 'SPECIAL'
  | 'OVA'
  | 'ONA'
  | 'MUSIC'
  | 'MANGA'
  | 'NOVEL'
  | 'ONE_SHOT';

export type MediaStatus =
  | 'FINISHED'
  | 'RELEASING'
  | 'NOT_YET_RELEASED'
  | 'CANCELLED'
  | 'HIATUS';

export type MediaSeason =
  | 'WINTER'
  | 'SPRING'
  | 'SUMMER'
  | 'FALL';

export type MediaSource =
  | 'ORIGINAL'
  | 'MANGA'
  | 'LIGHT_NOVEL'
  | 'VISUAL_NOVEL'
  | 'VIDEO_GAME'
  | 'OTHER'
  | 'NOVEL'
  | 'DOUJINSHI'
  | 'ANIME'
  | 'WEB_NOVEL'
  | 'LIVE_ACTION'
  | 'GAME'
  | 'COMIC'
  | 'MULTIMEDIA_PROJECT'
  | 'PICTURE_BOOK';

export type MediaSort =
  | 'ID'
  | 'ID_DESC'
  | 'TITLE_ROMAJI'
  | 'TITLE_ROMAJI_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'TITLE_NATIVE'
  | 'TITLE_NATIVE_DESC'
  | 'TYPE'
  | 'TYPE_DESC'
  | 'FORMAT'
  | 'FORMAT_DESC'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC'
  | 'EPISODES'
  | 'EPISODES_DESC'
  | 'DURATION'
  | 'DURATION_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'CHAPTERS'
  | 'CHAPTERS_DESC'
  | 'VOLUMES'
  | 'VOLUMES_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC'
  | 'SEARCH_MATCH'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC';

export type MediaListStatus =
  | 'CURRENT'
  | 'PLANNING'
  | 'COMPLETED'
  | 'DROPPED'
  | 'PAUSED'
  | 'REPEATING';

export type MediaListSort =
  | 'MEDIA_ID'
  | 'MEDIA_ID_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'PROGRESS'
  | 'PROGRESS_DESC'
  | 'PROGRESS_VOLUMES'
  | 'PROGRESS_VOLUMES_DESC'
  | 'REPEAT'
  | 'REPEAT_DESC'
  | 'PRIORITY'
  | 'PRIORITY_DESC'
  | 'STARTED_ON'
  | 'STARTED_ON_DESC'
  | 'FINISHED_ON'
  | 'FINISHED_ON_DESC'
  | 'ADDED_TIME'
  | 'ADDED_TIME_DESC'
  | 'UPDATED_TIME'
  | 'UPDATED_TIME_DESC'
  | 'MEDIA_TITLE_ROMAJI'
  | 'MEDIA_TITLE_ROMAJI_DESC'
  | 'MEDIA_TITLE_ENGLISH'
  | 'MEDIA_TITLE_ENGLISH_DESC'
  | 'MEDIA_TITLE_NATIVE'
  | 'MEDIA_TITLE_NATIVE_DESC'
  | 'MEDIA_POPULARITY'
  | 'MEDIA_POPULARITY_DESC';

export type ScoreFormat =
  | 'POINT_100'
  | 'POINT_10_DECIMAL'
  | 'POINT_10'
  | 'POINT_5'
  | 'POINT_3';

export type UserTitleLanguage =
  | 'ROMAJI'
  | 'ENGLISH'
  | 'NATIVE'
  | 'ROMAJI_STYLISED'
  | 'ENGLISH_STYLISED'
  | 'NATIVE_STYLISED';

export type UserStaffNameLanguage =
  | 'ROMAJI_WESTERN'
  | 'ROMAJI'
  | 'NATIVE';

export type NotificationType =
  | 'ACTIVITY_MESSAGE'
  | 'ACTIVITY_REPLY'
  | 'FOLLOWING'
  | 'ACTIVITY_MENTION'
  | 'THREAD_COMMENT_MENTION'
  | 'THREAD_SUBSCRIBED'
  | 'THREAD_COMMENT_REPLY'
  | 'AIRING'
  | 'ACTIVITY_LIKE'
  | 'ACTIVITY_REPLY_LIKE'
  | 'THREAD_LIKE'
  | 'THREAD_COMMENT_LIKE'
  | 'ACTIVITY_REPLY_SUBSCRIBED'
  | 'RELATED_MEDIA_ADDITION'
  | 'MEDIA_DATA_CHANGE'
  | 'MEDIA_MERGE'
  | 'MEDIA_DELETION'
  | 'MEDIA_SUBMISSION_UPDATE'
  | 'STAFF_SUBMISSION_UPDATE'
  | 'CHARACTER_SUBMISSION_UPDATE';

export type ActivityType =
  | 'TEXT'
  | 'ANIME_LIST'
  | 'MANGA_LIST'
  | 'MESSAGE'
  | 'MEDIA_LIST';

export type ActivitySort =
  | 'ID'
  | 'ID_DESC'
  | 'PINNED';

export type LikeableType =
  | 'THREAD'
  | 'THREAD_COMMENT'
  | 'ACTIVITY'
  | 'ACTIVITY_REPLY';

export type CharacterRole =
  | 'MAIN'
  | 'SUPPORTING'
  | 'BACKGROUND';

export type CharacterSort =
  | 'ID'
  | 'ID_DESC'
  | 'ROLE'
  | 'ROLE_DESC'
  | 'SEARCH_MATCH'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC'
  | 'RELEVANCE';

export type StaffSort =
  | 'ID'
  | 'ID_DESC'
  | 'ROLE'
  | 'ROLE_DESC'
  | 'LANGUAGE'
  | 'LANGUAGE_DESC'
  | 'SEARCH_MATCH'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC'
  | 'RELEVANCE';

export type StaffLanguage =
  | 'JAPANESE'
  | 'ENGLISH'
  | 'KOREAN'
  | 'ITALIAN'
  | 'SPANISH'
  | 'PORTUGUESE'
  | 'FRENCH'
  | 'GERMAN'
  | 'HEBREW'
  | 'HUNGARIAN';

export type StudioSort =
  | 'ID'
  | 'ID_DESC'
  | 'NAME'
  | 'NAME_DESC'
  | 'SEARCH_MATCH'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC';

export type UserSort =
  | 'ID'
  | 'ID_DESC'
  | 'USERNAME'
  | 'USERNAME_DESC'
  | 'WATCHED_TIME'
  | 'WATCHED_TIME_DESC'
  | 'CHAPTERS_READ'
  | 'CHAPTERS_READ_DESC'
  | 'SEARCH_MATCH';

export type ReviewSort =
  | 'ID'
  | 'ID_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'RATING'
  | 'RATING_DESC'
  | 'CREATED_AT'
  | 'CREATED_AT_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC';

export type ReviewRating =
  | 'NO_VOTE'
  | 'UP_VOTE'
  | 'DOWN_VOTE';

export type RecommendationSort =
  | 'ID'
  | 'ID_DESC'
  | 'RATING'
  | 'RATING_DESC';

export type RecommendationRating =
  | 'NO_RATING'
  | 'RATE_UP'
  | 'RATE_DOWN';

export type MediaRelation =
  | 'ADAPTATION'
  | 'PREQUEL'
  | 'SEQUEL'
  | 'PARENT'
  | 'SIDE_STORY'
  | 'CHARACTER'
  | 'SUMMARY'
  | 'ALTERNATIVE'
  | 'SPIN_OFF'
  | 'OTHER'
  | 'SOURCE'
  | 'COMPILATION'
  | 'CONTAINS'
  | 'SAME_UNIVERSE';

export type MediaRankType =
  | 'RATED'
  | 'POPULAR';

export type ExternalLinkType =
  | 'INFO'
  | 'STREAMING'
  | 'SOCIAL';

export type ExternalLinkMediaType =
  | 'ANIME'
  | 'MANGA'
  | 'STAFF';

export type AiringSort =
  | 'ID'
  | 'ID_DESC'
  | 'MEDIA_ID'
  | 'MEDIA_ID_DESC'
  | 'TIME'
  | 'TIME_DESC'
  | 'EPISODE'
  | 'EPISODE_DESC';

export type MediaTrendSort =
  | 'ID'
  | 'ID_DESC'
  | 'MEDIA_ID'
  | 'MEDIA_ID_DESC'
  | 'DATE'
  | 'DATE_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC'
  | 'EPISODE'
  | 'EPISODE_DESC';

export type UserStatisticsSort =
  | 'ID'
  | 'ID_DESC'
  | 'COUNT'
  | 'COUNT_DESC'
  | 'PROGRESS'
  | 'PROGRESS_DESC'
  | 'MEAN_SCORE'
  | 'MEAN_SCORE_DESC';

export type ModRole =
  | 'ADMIN'
  | 'LEAD_DEVELOPER'
  | 'DEVELOPER'
  | 'LEAD_COMMUNITY'
  | 'COMMUNITY'
  | 'DISCORD_COMMUNITY'
  | 'LEAD_ANIME_DATA'
  | 'ANIME_DATA'
  | 'LEAD_MANGA_DATA'
  | 'MANGA_DATA'
  | 'LEAD_SOCIAL_MEDIA'
  | 'SOCIAL_MEDIA'
  | 'RETIRED'
  | 'CHARACTER_DATA'
  | 'STAFF_DATA';

export type ThreadSort =
  | 'ID'
  | 'ID_DESC'
  | 'TITLE'
  | 'TITLE_DESC'
  | 'CREATED_AT'
  | 'CREATED_AT_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC'
  | 'REPLIED_AT'
  | 'REPLIED_AT_DESC'
  | 'REPLY_COUNT'
  | 'REPLY_COUNT_DESC'
  | 'VIEW_COUNT'
  | 'VIEW_COUNT_DESC'
  | 'IS_STICKY'
  | 'SEARCH_MATCH';

export type ThreadCommentSort =
  | 'ID'
  | 'ID_DESC';

export type SiteTrendSort =
  | 'DATE'
  | 'DATE_DESC'
  | 'COUNT'
  | 'COUNT_DESC'
  | 'CHANGE'
  | 'CHANGE_DESC';

/** Ordered lists of enum values, handy for pickers and filters. */
export const MEDIA_LIST_STATUSES: readonly MediaListStatus[] = [
  'CURRENT',
  'REPEATING',
  'COMPLETED',
  'PAUSED',
  'PLANNING',
  'DROPPED',
];
export const MEDIA_SEASONS: readonly MediaSeason[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
export const ANIME_FORMATS: readonly MediaFormat[] = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
export const MANGA_FORMATS: readonly MediaFormat[] = ['MANGA', 'NOVEL', 'ONE_SHOT'];
export const MEDIA_STATUSES: readonly MediaStatus[] = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'HIATUS', 'CANCELLED'];
export const MEDIA_SOURCES: readonly MediaSource[] = [
  'ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'VISUAL_NOVEL', 'VIDEO_GAME', 'OTHER', 'NOVEL', 'DOUJINSHI',
  'ANIME', 'WEB_NOVEL', 'LIVE_ACTION', 'GAME', 'COMIC', 'MULTIMEDIA_PROJECT', 'PICTURE_BOOK',
];
export const SCORE_FORMATS: readonly ScoreFormat[] = ['POINT_100', 'POINT_10_DECIMAL', 'POINT_10', 'POINT_5', 'POINT_3'];
export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'ACTIVITY_MESSAGE', 'ACTIVITY_REPLY', 'FOLLOWING', 'ACTIVITY_MENTION', 'THREAD_COMMENT_MENTION',
  'THREAD_SUBSCRIBED', 'THREAD_COMMENT_REPLY', 'AIRING', 'ACTIVITY_LIKE', 'ACTIVITY_REPLY_LIKE',
  'THREAD_LIKE', 'THREAD_COMMENT_LIKE', 'ACTIVITY_REPLY_SUBSCRIBED', 'RELATED_MEDIA_ADDITION',
  'MEDIA_DATA_CHANGE', 'MEDIA_MERGE', 'MEDIA_DELETION', 'MEDIA_SUBMISSION_UPDATE',
  'STAFF_SUBMISSION_UPDATE', 'CHARACTER_SUBMISSION_UPDATE',
];
/** Common origin countries used by AniList's search filter. */
export const MEDIA_COUNTRIES: readonly CountryCode[] = ['JP', 'KR', 'CN', 'TW'];

// ---------------------------------------------------------------------------
// Shared shapes (fragments.ts)
// ---------------------------------------------------------------------------

export interface PageInfo {
  total: number | null;
  perPage: number | null;
  currentPage: number | null;
  lastPage: number | null;
  hasNextPage: boolean | null;
}

export interface FuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface FuzzyDateInput {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

export interface MediaTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
}

export interface MediaCoverImage {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface AiringEpisode {
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  mediaId: number;
}

export interface MediaCore {
  id: number;
  idMal: number | null;
  type: MediaType | null;
  format: MediaFormat | null;
  status: MediaStatus | null;
  title: MediaTitle | null;
  coverImage: MediaCoverImage | null;
  bannerImage: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  season: MediaSeason | null;
  seasonYear: number | null;
  startDate: FuzzyDate | null;
  endDate: FuzzyDate | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  genres: string[] | null;
  countryOfOrigin: CountryCode | null;
  isAdult: boolean | null;
  siteUrl: string | null;
  nextAiringEpisode: AiringEpisode | null;
}

export interface MediaListEntryLite {
  id: number;
  mediaId: number;
  status: MediaListStatus | null;
  score: number | null;
  progress: number | null;
  progressVolumes: number | null;
  repeat: number | null;
}

export interface MediaCard extends MediaCore {
  mediaListEntry: MediaListEntryLite | null;
}

/** customLists(asArray: false): `{ [listName]: isInList }`. */
export type CustomListsMap = Record<string, boolean>;
/** advancedScores: `{ [categoryName]: score }`. */
export type AdvancedScoresMap = Record<string, number>;

export interface MediaListEntry {
  id: number;
  userId: number;
  mediaId: number;
  status: MediaListStatus | null;
  /** In the owner's score format. */
  score: number | null;
  progress: number | null;
  progressVolumes: number | null;
  repeat: number | null;
  priority: number | null;
  private: boolean | null;
  notes: string | null;
  hiddenFromStatusLists: boolean | null;
  customLists: CustomListsMap | null;
  advancedScores: AdvancedScoresMap | null;
  startedAt: FuzzyDate | null;
  completedAt: FuzzyDate | null;
  updatedAt: number | null;
  createdAt: number | null;
}

export interface UserAvatar {
  large: string | null;
  medium: string | null;
}

export interface UserLite {
  id: number;
  name: string;
  avatar: UserAvatar | null;
  donatorTier: number | null;
  donatorBadge: string | null;
  moderatorRoles: ModRole[] | null;
}

export interface PersonName {
  full: string | null;
  native: string | null;
  userPreferred: string | null;
}

export interface ImageSet {
  large: string | null;
  medium: string | null;
}

export interface CharacterLite {
  id: number;
  name: PersonName | null;
  image: ImageSet | null;
  favourites: number | null;
  isFavourite: boolean;
}

export interface StaffLite {
  id: number;
  name: PersonName | null;
  image: ImageSet | null;
  languageV2: string | null;
  primaryOccupations: string[] | null;
  favourites: number | null;
  isFavourite: boolean;
}

export interface StudioLite {
  id: number;
  name: string;
  isAnimationStudio: boolean;
  favourites: number | null;
  isFavourite: boolean;
  siteUrl: string | null;
}

export interface MediaListTypeOptions {
  sectionOrder: string[] | null;
  splitCompletedSectionByFormat: boolean | null;
  customLists: string[] | null;
  advancedScoring: string[] | null;
  advancedScoringEnabled: boolean | null;
}

export interface MediaListOptions {
  scoreFormat: ScoreFormat | null;
  rowOrder: string | null;
  animeList: MediaListTypeOptions | null;
  mangaList: MediaListTypeOptions | null;
}

export interface NotificationOption {
  type: NotificationType | null;
  enabled: boolean | null;
}

export interface ListActivityOption {
  type: MediaListStatus | null;
  disabled: boolean | null;
}

export interface UserOptions {
  titleLanguage: UserTitleLanguage | null;
  staffNameLanguage: UserStaffNameLanguage | null;
  displayAdultContent: boolean | null;
  airingNotifications: boolean | null;
  profileColor: string | null;
  timezone: string | null;
  activityMergeTime: number | null;
  restrictMessagesToFollowing: boolean | null;
  notificationOptions: NotificationOption[] | null;
  disabledListActivity: ListActivityOption[] | null;
}

export interface ReviewLite {
  id: number;
  userId: number;
  mediaId: number;
  mediaType: MediaType | null;
  summary: string | null;
  rating: number | null;
  ratingAmount: number | null;
  userRating: ReviewRating | null;
  score: number | null;
  private: boolean | null;
  siteUrl: string | null;
  createdAt: number;
  updatedAt: number;
  user: UserLite | null;
}

/** Generic `Page { pageInfo, <key>: T[] }` result. */
export type PageOf<K extends string, T> = {
  Page: { pageInfo: PageInfo } & { [P in K]: (T | null)[] | null };
};

export interface Connection<T> {
  pageInfo: PageInfo | null;
  nodes: (T | null)[] | null;
}

export interface EdgeConnection<E> {
  pageInfo: PageInfo | null;
  edges: (E | null)[] | null;
}

export interface PageVariables {
  page?: number;
  perPage?: number;
}

export interface Deleted {
  deleted: boolean | null;
}

// ---------------------------------------------------------------------------
// viewer.ts
// ---------------------------------------------------------------------------

export interface Viewer {
  id: number;
  name: string;
  about: string | null;
  avatar: UserAvatar | null;
  bannerImage: string | null;
  siteUrl: string | null;
  unreadNotificationCount: number | null;
  donatorTier: number | null;
  donatorBadge: string | null;
  moderatorRoles: ModRole[] | null;
  createdAt: number | null;
  updatedAt: number | null;
  options: UserOptions | null;
  mediaListOptions: MediaListOptions | null;
}

export interface ViewerQuery {
  Viewer: Viewer | null;
}

export interface UnreadNotificationCountQuery {
  Viewer: { id: number; unreadNotificationCount: number | null } | null;
}

// ---------------------------------------------------------------------------
// lists.ts
// ---------------------------------------------------------------------------

export interface MediaListCollectionEntry extends MediaListEntry {
  media: MediaCore | null;
}

export interface MediaListGroup {
  name: string | null;
  isCustomList: boolean | null;
  isSplitCompletedList: boolean | null;
  status: MediaListStatus | null;
  entries: (MediaListCollectionEntry | null)[] | null;
}

export interface MediaListCollectionQuery {
  MediaListCollection: {
    hasNextChunk: boolean | null;
    user: { id: number; name: string; mediaListOptions: MediaListOptions | null } | null;
    lists: (MediaListGroup | null)[] | null;
  } | null;
}

export interface MediaListCollectionVariables {
  userId?: number;
  userName?: string;
  type: MediaType;
  status_in?: MediaListStatus[];
  sort?: MediaListSort[];
  forceSingleCompletedList?: boolean;
  chunk?: number;
  perChunk?: number;
}

export interface MediaListEntryQuery {
  Media: (MediaCore & { isFavourite: boolean; mediaListEntry: MediaListEntry | null }) | null;
}

export interface SaveMediaListEntryVariables {
  /** Entry id (update) or mediaId (create/upsert). */
  id?: number;
  mediaId?: number;
  status?: MediaListStatus;
  /** In the viewer's score format. */
  score?: number;
  /** POINT_100 integer; takes precedence over score when both are sent. */
  scoreRaw?: number;
  progress?: number;
  progressVolumes?: number;
  repeat?: number;
  priority?: number;
  private?: boolean;
  notes?: string;
  hiddenFromStatusLists?: boolean;
  /** Names of custom lists this entry belongs to (replaces the full set). */
  customLists?: string[];
  /** Ordered like mediaListOptions.<type>List.advancedScoring. */
  advancedScores?: number[];
  startedAt?: FuzzyDateInput;
  completedAt?: FuzzyDateInput;
}

export interface SaveMediaListEntryMutation {
  SaveMediaListEntry: MediaListCollectionEntry | null;
}

export interface UpdateMediaListEntriesVariables
  extends Omit<SaveMediaListEntryVariables, 'id' | 'mediaId' | 'customLists'> {
  ids: number[];
}

export interface UpdateMediaListEntriesMutation {
  UpdateMediaListEntries: (MediaListEntry | null)[] | null;
}

export interface DeleteMediaListEntryMutation {
  DeleteMediaListEntry: Deleted | null;
}

export interface DeleteCustomListMutation {
  DeleteCustomList: Deleted | null;
}

// ---------------------------------------------------------------------------
// media.ts
// ---------------------------------------------------------------------------

export interface MediaTag {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  rank: number | null;
  isGeneralSpoiler: boolean | null;
  isMediaSpoiler: boolean | null;
  isAdult: boolean | null;
}

export interface MediaRank {
  id: number;
  rank: number;
  type: MediaRankType;
  format: MediaFormat;
  year: number | null;
  season: MediaSeason | null;
  allTime: boolean | null;
  context: string;
}

export interface MediaTrailer {
  id: string | null;
  site: string | null;
  thumbnail: string | null;
}

export interface MediaExternalLink {
  id: number;
  url: string | null;
  site: string;
  siteId: number | null;
  type: ExternalLinkType | null;
  language: string | null;
  color: string | null;
  icon: string | null;
  notes: string | null;
  isDisabled: boolean | null;
}

export interface MediaStreamingEpisode {
  title: string | null;
  thumbnail: string | null;
  url: string | null;
  site: string | null;
}

export interface StaffRoleType {
  voiceActor: StaffLite | null;
  roleNotes: string | null;
  dubGroup: string | null;
}

export interface MediaCharacterEdge {
  id: number | null;
  role: CharacterRole | null;
  name: string | null;
  voiceActorRoles: (StaffRoleType | null)[] | null;
  node: CharacterLite | null;
}

export interface MediaStaffEdge {
  id: number | null;
  role: string | null;
  node: StaffLite | null;
}

export interface MediaRelationEdge {
  id: number | null;
  relationType: MediaRelation | null;
  node: MediaCard | null;
}

export interface MediaRecommendation {
  id: number;
  rating: number | null;
  userRating: RecommendationRating | null;
  mediaRecommendation: MediaCard | null;
}

export interface ScoreDistribution {
  score: number | null;
  amount: number | null;
}

export interface StatusDistribution {
  status: MediaListStatus | null;
  amount: number | null;
}

export interface MediaStats {
  scoreDistribution: (ScoreDistribution | null)[] | null;
  statusDistribution: (StatusDistribution | null)[] | null;
}

export interface FollowingListEntry {
  id: number;
  status: MediaListStatus | null;
  score: number | null;
  progress: number | null;
  progressVolumes: number | null;
  repeat: number | null;
  user: (UserLite & { mediaListOptions: { scoreFormat: ScoreFormat | null } | null }) | null;
}

export interface MediaDetail extends MediaCore {
  synonyms: string[] | null;
  description: string | null;
  source: MediaSource | null;
  hashtag: string | null;
  isLicensed: boolean | null;
  updatedAt: number | null;
  trending: number | null;
  tags: (MediaTag | null)[] | null;
  studios: { edges: ({ isMain: boolean; node: StudioLite | null } | null)[] | null } | null;
  rankings: (MediaRank | null)[] | null;
  trailer: MediaTrailer | null;
  externalLinks: (MediaExternalLink | null)[] | null;
  streamingEpisodes: (MediaStreamingEpisode | null)[] | null;
  airingSchedule: Connection<AiringEpisode> | null;
  characters: EdgeConnection<MediaCharacterEdge> | null;
  staff: EdgeConnection<MediaStaffEdge> | null;
  relations: { edges: (MediaRelationEdge | null)[] | null } | null;
  recommendations: Connection<MediaRecommendation> | null;
  reviews: Connection<ReviewLite> | null;
  stats: MediaStats | null;
  isFavourite: boolean;
  isFavouriteBlocked: boolean;
  isRecommendationBlocked: boolean | null;
  isReviewBlocked: boolean | null;
  mediaListEntry: MediaListEntry | null;
}

export interface MediaDetailQuery {
  Media: MediaDetail | null;
  /** Present only when `withFollowing: true` (requires login). */
  following?: { pageInfo: PageInfo; mediaList: (FollowingListEntry | null)[] | null } | null;
}

export interface MediaDetailVariables {
  id: number;
  /** Include following users' entries (logged in only). */
  withFollowing?: boolean;
  charactersPerPage?: number;
  staffPerPage?: number;
  recommendationsPerPage?: number;
  reviewsPerPage?: number;
  followingPerPage?: number;
  /** Voice actor language (defaults to Japanese on AniList). */
  language?: StaffLanguage;
}

export interface MediaCharactersQuery {
  Media: { id: number; characters: EdgeConnection<MediaCharacterEdge> | null } | null;
}
export interface MediaCharactersVariables extends PageVariables {
  id: number;
  language?: StaffLanguage;
  sort?: CharacterSort[];
  role?: CharacterRole;
}

export interface MediaStaffQuery {
  Media: { id: number; staff: EdgeConnection<MediaStaffEdge> | null } | null;
}
export interface MediaStaffVariables extends PageVariables {
  id: number;
  sort?: StaffSort[];
}

export interface MediaRecommendationsQuery {
  Media: { id: number; recommendations: Connection<MediaRecommendation> | null } | null;
}
export interface MediaRecommendationsVariables extends PageVariables {
  id: number;
  sort?: RecommendationSort[];
}

export interface MediaReviewsQuery {
  Media: { id: number; reviews: Connection<ReviewLite> | null } | null;
}
export interface MediaReviewsVariables extends PageVariables {
  id: number;
  sort?: ReviewSort[];
}

export interface MediaTrend {
  date: number;
  trending: number;
  averageScore: number | null;
  popularity: number | null;
  inProgress: number | null;
  episode: number | null;
  releasing: boolean;
}

export interface MediaStatsQuery {
  Media: {
    id: number;
    rankings: (MediaRank | null)[] | null;
    stats: MediaStats | null;
    trends: Connection<MediaTrend> | null;
    airingTrends: Connection<MediaTrend> | null;
  } | null;
}

export interface MediaAiringScheduleQuery {
  Media: { id: number; airingSchedule: Connection<AiringEpisode> | null } | null;
}
export interface MediaAiringScheduleVariables extends PageVariables {
  id: number;
  notYetAired?: boolean;
}

export type MediaFollowingQuery = PageOf<'mediaList', FollowingListEntry>;
export interface MediaFollowingVariables extends PageVariables {
  mediaId: number;
}

export interface SaveRecommendationMutation {
  SaveRecommendation: MediaRecommendation | null;
}
export interface SaveRecommendationVariables {
  mediaId: number;
  mediaRecommendationId: number;
  rating: RecommendationRating;
}

// ---------------------------------------------------------------------------
// explore.ts
// ---------------------------------------------------------------------------

/** Every argument accepted by `Page.media(...)`. */
export interface MediaSearchVariables extends PageVariables {
  id?: number;
  idMal?: number;
  startDate?: FuzzyDateInt;
  endDate?: FuzzyDateInt;
  season?: MediaSeason;
  seasonYear?: number;
  type?: MediaType;
  format?: MediaFormat;
  status?: MediaStatus;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  isAdult?: boolean;
  genre?: string;
  tag?: string;
  minimumTagRank?: number;
  tagCategory?: string;
  onList?: boolean;
  licensedBy?: string;
  licensedById?: number;
  averageScore?: number;
  popularity?: number;
  source?: MediaSource;
  countryOfOrigin?: CountryCode;
  isLicensed?: boolean;
  search?: string;
  id_not?: number;
  id_in?: number[];
  id_not_in?: number[];
  idMal_not?: number;
  idMal_in?: number[];
  idMal_not_in?: number[];
  startDate_greater?: FuzzyDateInt;
  startDate_lesser?: FuzzyDateInt;
  startDate_like?: string;
  endDate_greater?: FuzzyDateInt;
  endDate_lesser?: FuzzyDateInt;
  endDate_like?: string;
  format_in?: MediaFormat[];
  format_not?: MediaFormat;
  format_not_in?: MediaFormat[];
  status_in?: MediaStatus[];
  status_not?: MediaStatus;
  status_not_in?: MediaStatus[];
  episodes_greater?: number;
  episodes_lesser?: number;
  duration_greater?: number;
  duration_lesser?: number;
  chapters_greater?: number;
  chapters_lesser?: number;
  volumes_greater?: number;
  volumes_lesser?: number;
  genre_in?: string[];
  genre_not_in?: string[];
  tag_in?: string[];
  tag_not_in?: string[];
  tagCategory_in?: string[];
  tagCategory_not_in?: string[];
  licensedBy_in?: string[];
  licensedById_in?: number[];
  averageScore_not?: number;
  averageScore_greater?: number;
  averageScore_lesser?: number;
  popularity_not?: number;
  popularity_greater?: number;
  popularity_lesser?: number;
  source_in?: MediaSource[];
  countryOfOrigin_in?: CountryCode[];
  countryOfOrigin_not_in?: CountryCode[];
  sort?: MediaSort[];
}

export type MediaSearchQuery = PageOf<'media', MediaCard>;

export interface ExploreHomeVariables {
  type: MediaType;
  season?: MediaSeason;
  seasonYear?: number;
  nextSeason?: MediaSeason;
  nextYear?: number;
  perPage?: number;
  isAdult?: boolean;
}

type MediaSection = { media: (MediaCard | null)[] | null; pageInfo: PageInfo };
export interface ExploreHomeQuery {
  trending: MediaSection | null;
  season: MediaSection | null;
  nextSeason: MediaSection | null;
  popular: MediaSection | null;
  top: MediaSection | null;
}

export interface GenreCollectionQuery {
  GenreCollection: (string | null)[] | null;
}

export interface MediaTagCollectionQuery {
  MediaTagCollection: (MediaTag | null)[] | null;
}

export interface AiringScheduleItem extends AiringEpisode {
  media: MediaCard | null;
}
export type AiringSchedulesQuery = PageOf<'airingSchedules', AiringScheduleItem>;
export interface AiringSchedulesVariables extends PageVariables {
  airingAt_greater?: number;
  airingAt_lesser?: number;
  notYetAired?: boolean;
  mediaId?: number;
  mediaId_in?: number[];
  sort?: AiringSort[];
}

export type CharacterSearchQuery = PageOf<'characters', CharacterLite>;
export interface CharacterSearchVariables extends PageVariables {
  search?: string;
  isBirthday?: boolean;
  sort?: CharacterSort[];
}

export type StaffSearchQuery = PageOf<'staff', StaffLite>;
export interface StaffSearchVariables extends PageVariables {
  search?: string;
  isBirthday?: boolean;
  sort?: StaffSort[];
}

export type StudioSearchQuery = PageOf<'studios', StudioLite>;
export interface StudioSearchVariables extends PageVariables {
  search?: string;
  sort?: StudioSort[];
}

export type UserSearchQuery = PageOf<'users', UserLite>;
export interface UserSearchVariables extends PageVariables {
  search?: string;
  sort?: UserSort[];
}

// ---------------------------------------------------------------------------
// character.ts
// ---------------------------------------------------------------------------

export interface CharacterMediaEdge {
  id: number | null;
  characterRole: CharacterRole | null;
  characterName: string | null;
  voiceActorRoles: (StaffRoleType | null)[] | null;
  node: MediaCard | null;
}

export interface CharacterDetail {
  id: number;
  name: {
    first: string | null;
    middle: string | null;
    last: string | null;
    full: string | null;
    native: string | null;
    alternative: (string | null)[] | null;
    alternativeSpoiler: (string | null)[] | null;
    userPreferred: string | null;
  } | null;
  image: ImageSet | null;
  description: string | null;
  gender: string | null;
  dateOfBirth: FuzzyDate | null;
  age: string | null;
  bloodType: string | null;
  isFavourite: boolean;
  isFavouriteBlocked: boolean;
  favourites: number | null;
  siteUrl: string | null;
  media: EdgeConnection<CharacterMediaEdge> | null;
}

export interface CharacterQuery {
  Character: CharacterDetail | null;
}
export interface CharacterVariables extends PageVariables {
  id: number;
  sort?: MediaSort[];
  type?: MediaType;
  onList?: boolean;
  language?: StaffLanguage;
}

export interface CharacterMediaQuery {
  Character: { id: number; media: EdgeConnection<CharacterMediaEdge> | null } | null;
}

// ---------------------------------------------------------------------------
// staff.ts
// ---------------------------------------------------------------------------

export interface StaffCharacterMediaEdge {
  id: number | null;
  characterRole: CharacterRole | null;
  characterName: string | null;
  characters: (CharacterLite | null)[] | null;
  node: MediaCard | null;
}

export interface StaffMediaEdge {
  id: number | null;
  staffRole: string | null;
  node: MediaCard | null;
}

export interface StaffDetail {
  id: number;
  name: {
    first: string | null;
    middle: string | null;
    last: string | null;
    full: string | null;
    native: string | null;
    alternative: (string | null)[] | null;
    userPreferred: string | null;
  } | null;
  image: ImageSet | null;
  description: string | null;
  languageV2: string | null;
  primaryOccupations: (string | null)[] | null;
  gender: string | null;
  dateOfBirth: FuzzyDate | null;
  dateOfDeath: FuzzyDate | null;
  age: number | null;
  yearsActive: (number | null)[] | null;
  homeTown: string | null;
  bloodType: string | null;
  isFavourite: boolean;
  isFavouriteBlocked: boolean;
  favourites: number | null;
  siteUrl: string | null;
  characterMedia: EdgeConnection<StaffCharacterMediaEdge> | null;
  staffMedia: EdgeConnection<StaffMediaEdge> | null;
}

export interface StaffQuery {
  Staff: StaffDetail | null;
}
export interface StaffVariables {
  id: number;
  perPage?: number;
  sort?: MediaSort[];
  onList?: boolean;
}

export interface StaffCharacterMediaQuery {
  Staff: { id: number; characterMedia: EdgeConnection<StaffCharacterMediaEdge> | null } | null;
}
export interface StaffCharacterMediaVariables extends PageVariables {
  id: number;
  sort?: MediaSort[];
  onList?: boolean;
}

export interface StaffStaffMediaQuery {
  Staff: { id: number; staffMedia: EdgeConnection<StaffMediaEdge> | null } | null;
}
export interface StaffStaffMediaVariables extends PageVariables {
  id: number;
  sort?: MediaSort[];
  type?: MediaType;
  onList?: boolean;
}

// ---------------------------------------------------------------------------
// studio.ts
// ---------------------------------------------------------------------------

export interface StudioMediaEdge {
  id: number | null;
  isMainStudio: boolean;
  node: MediaCard | null;
}

export interface StudioQuery {
  Studio: (StudioLite & { media: EdgeConnection<StudioMediaEdge> | null }) | null;
}
export interface StudioVariables extends PageVariables {
  id: number;
  sort?: MediaSort[];
  isMain?: boolean;
  onList?: boolean;
}

// ---------------------------------------------------------------------------
// user.ts
// ---------------------------------------------------------------------------

export interface UserStatisticsSummary {
  count: number;
  meanScore: number;
  standardDeviation: number;
  minutesWatched: number;
  episodesWatched: number;
  chaptersRead: number;
  volumesRead: number;
}

export interface UserProfile extends UserLite {
  about: string | null;
  bannerImage: string | null;
  isFollowing: boolean | null;
  isFollower: boolean | null;
  isBlocked: boolean | null;
  siteUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  previousNames: ({ name: string | null; createdAt: number | null } | null)[] | null;
  options: { profileColor: string | null; titleLanguage: UserTitleLanguage | null } | null;
  mediaListOptions: { scoreFormat: ScoreFormat | null } | null;
  statistics: { anime: UserStatisticsSummary | null; manga: UserStatisticsSummary | null } | null;
}

export interface UserProfileQuery {
  User: UserProfile | null;
}
export interface UserProfileVariables {
  id?: number;
  name?: string;
  asHtml?: boolean;
}

export type FavouriteKind = 'anime' | 'manga' | 'characters' | 'staff' | 'studios';

export interface FavouriteNodeMap {
  anime: MediaCard;
  manga: MediaCard;
  characters: CharacterLite;
  staff: StaffLite;
  studios: StudioLite;
}

export interface UserFavouritesQuery<K extends FavouriteKind = FavouriteKind> {
  User: {
    id: number;
    favourites: { [P in K]?: Connection<FavouriteNodeMap[P]> | null } | null;
  } | null;
}
export interface UserFavouritesVariables extends PageVariables {
  id: number;
}

export interface UserFavouritesOverviewQuery {
  User: {
    id: number;
    favourites: { [P in FavouriteKind]: Connection<FavouriteNodeMap[P]> | null } | null;
  } | null;
}

interface StatBase {
  count: number;
  meanScore: number;
  minutesWatched: number;
  chaptersRead: number;
  mediaIds: (number | null)[];
}

export interface UserStatisticsDetail extends UserStatisticsSummary {
  formats: ((StatBase & { format: MediaFormat | null }) | null)[] | null;
  statuses: ((StatBase & { status: MediaListStatus | null }) | null)[] | null;
  scores: ((StatBase & { score: number | null }) | null)[] | null;
  lengths: ((StatBase & { length: string | null }) | null)[] | null;
  releaseYears: ((StatBase & { releaseYear: number | null }) | null)[] | null;
  startYears: ((StatBase & { startYear: number | null }) | null)[] | null;
  genres: ((StatBase & { genre: string | null }) | null)[] | null;
  tags: ((StatBase & { tag: { id: number; name: string; category: string | null; isAdult: boolean | null; isGeneralSpoiler?: boolean | null } | null }) | null)[] | null;
  countries: ((StatBase & { country: CountryCode | null }) | null)[] | null;
  voiceActors: ((StatBase & { voiceActor: StaffLite | null; characterIds: (number | null)[] }) | null)[] | null;
  staff: ((StatBase & { staff: StaffLite | null }) | null)[] | null;
  studios: ((StatBase & { studio: StudioLite | null }) | null)[] | null;
}

export interface UserStatisticsQuery {
  User: {
    id: number;
    name: string;
    mediaListOptions: { scoreFormat: ScoreFormat | null } | null;
    statistics: { anime?: UserStatisticsDetail | null; manga?: UserStatisticsDetail | null } | null;
  } | null;
}
export interface UserStatisticsVariables {
  id: number;
  /** Limit for long breakdowns (tags, staff, voice actors, studios). */
  limit?: number;
}

export interface UserActivityHistoryEntry {
  /** Unix seconds (start of day). */
  date: number | null;
  amount: number | null;
  /** 0–10 intensity bucket. */
  level: number | null;
}

export interface UserActivityHistoryQuery {
  User: {
    id: number;
    stats: {
      watchedTime: number | null;
      chaptersRead: number | null;
      activityHistory: (UserActivityHistoryEntry | null)[] | null;
    } | null;
  } | null;
}

export interface FollowUser extends UserLite {
  isFollowing: boolean | null;
  isFollower: boolean | null;
}
export type FollowersQuery = PageOf<'followers', FollowUser>;
export type FollowingQuery = PageOf<'following', FollowUser>;
export interface FollowListVariables extends PageVariables {
  userId: number;
  sort?: UserSort[];
}

export interface ToggleFollowMutation {
  ToggleFollow: { id: number; name: string; isFollowing: boolean | null; isFollower: boolean | null } | null;
}

// ---------------------------------------------------------------------------
// activity.ts
// ---------------------------------------------------------------------------

export interface ActivityReply {
  id: number;
  userId: number | null;
  activityId: number | null;
  text: string | null;
  likeCount: number;
  isLiked: boolean | null;
  createdAt: number;
  user: UserLite | null;
}

interface ActivityBase {
  id: number;
  type: ActivityType | null;
  replyCount: number;
  likeCount: number;
  isLiked: boolean | null;
  isSubscribed: boolean | null;
  isLocked: boolean | null;
  isPinned: boolean | null;
  siteUrl: string | null;
  createdAt: number;
}

export interface TextActivity extends ActivityBase {
  __typename: 'TextActivity';
  userId: number | null;
  text: string | null;
  user: UserLite | null;
}

export interface ListActivity extends ActivityBase {
  __typename: 'ListActivity';
  userId: number | null;
  status: string | null;
  progress: string | null;
  user: UserLite | null;
  media: MediaCore | null;
}

export interface MessageActivity extends ActivityBase {
  __typename: 'MessageActivity';
  recipientId: number | null;
  messengerId: number | null;
  message: string | null;
  isPrivate: boolean | null;
  recipient: UserLite | null;
  messenger: UserLite | null;
}

export type Activity = TextActivity | ListActivity | MessageActivity;

export type ActivitiesQuery = PageOf<'activities', Activity>;
export interface ActivitiesVariables extends PageVariables {
  userId?: number;
  messengerId?: number;
  mediaId?: number;
  type?: ActivityType;
  type_in?: ActivityType[];
  isFollowing?: boolean;
  hasReplies?: boolean;
  hasRepliesOrTypeText?: boolean;
  createdAt_lesser?: number;
  createdAt_greater?: number;
  sort?: ActivitySort[];
  asHtml?: boolean;
}

export interface ActivityQuery {
  Activity: Activity | null;
}

export type ActivityRepliesQuery = PageOf<'activityReplies', ActivityReply>;
export interface ActivityRepliesVariables extends PageVariables {
  activityId: number;
  asHtml?: boolean;
}

export type LikesQuery = PageOf<'likes', UserLite>;
export interface LikesVariables extends PageVariables {
  likeableId: number;
  type: LikeableType;
}

export interface SaveTextActivityMutation {
  SaveTextActivity: TextActivity | null;
}
export interface SaveTextActivityVariables {
  id?: number;
  text: string;
  locked?: boolean;
  asHtml?: boolean;
}

export interface SaveMessageActivityMutation {
  SaveMessageActivity: MessageActivity | null;
}
export interface SaveMessageActivityVariables {
  id?: number;
  message: string;
  recipientId: number;
  private?: boolean;
  locked?: boolean;
  asHtml?: boolean;
}

export interface SaveActivityReplyMutation {
  SaveActivityReply: ActivityReply | null;
}
export interface SaveActivityReplyVariables {
  id?: number;
  activityId?: number;
  text: string;
  asHtml?: boolean;
}

export interface DeleteActivityMutation {
  DeleteActivity: Deleted | null;
}
export interface DeleteActivityReplyMutation {
  DeleteActivityReply: Deleted | null;
}

export type LikeableResult =
  | { __typename: 'ListActivity' | 'TextActivity' | 'MessageActivity' | 'ActivityReply' | 'Thread' | 'ThreadComment'; id: number; likeCount: number; isLiked: boolean | null };

export interface ToggleLikeMutation {
  ToggleLikeV2: LikeableResult | null;
}
export interface ToggleLikeVariables {
  id: number;
  type: LikeableType;
}

export interface ToggleActivitySubscriptionMutation {
  ToggleActivitySubscription:
    | { __typename: Activity['__typename']; id: number; isSubscribed: boolean | null }
    | null;
}
export interface ToggleActivitySubscriptionVariables {
  activityId: number;
  subscribe: boolean;
}

export interface ToggleActivityPinMutation {
  ToggleActivityPin: { __typename: Activity['__typename']; id: number; isPinned: boolean | null } | null;
}
export interface ToggleActivityPinVariables {
  id: number;
  pinned: boolean;
}

// ---------------------------------------------------------------------------
// notifications.ts
// ---------------------------------------------------------------------------

interface NotificationBase {
  id: number;
  type: NotificationType | null;
  createdAt: number | null;
}

type ActivityNotificationTypename =
  | 'ActivityMentionNotification'
  | 'ActivityReplyNotification'
  | 'ActivityReplySubscribedNotification'
  | 'ActivityLikeNotification'
  | 'ActivityReplyLikeNotification';

type ThreadNotificationTypename =
  | 'ThreadCommentMentionNotification'
  | 'ThreadCommentReplyNotification'
  | 'ThreadCommentSubscribedNotification'
  | 'ThreadCommentLikeNotification';

export interface NotificationThread {
  id: number;
  title: string | null;
  siteUrl: string | null;
}

export interface NotificationComment {
  id: number;
  siteUrl: string | null;
}

export interface NotificationMedia {
  id: number;
  type: MediaType | null;
  format: MediaFormat | null;
  isAdult: boolean | null;
  title: MediaTitle | null;
  coverImage: MediaCoverImage | null;
}

export type AniListNotification =
  | (NotificationBase & {
      __typename: 'AiringNotification';
      animeId: number;
      episode: number;
      contexts: (string | null)[] | null;
      media: NotificationMedia | null;
    })
  | (NotificationBase & {
      __typename: 'FollowingNotification';
      userId: number;
      context: string | null;
      user: UserLite | null;
    })
  | (NotificationBase & {
      __typename: 'ActivityMessageNotification';
      userId: number;
      activityId: number;
      context: string | null;
      user: UserLite | null;
      message: { id: number; message: string | null; isPrivate: boolean | null } | null;
    })
  | (NotificationBase & {
      __typename: ActivityNotificationTypename;
      userId: number;
      activityId: number;
      context: string | null;
      user: UserLite | null;
      activity: { __typename: Activity['__typename']; id: number } | null;
    })
  | (NotificationBase & {
      __typename: ThreadNotificationTypename;
      userId: number;
      commentId: number;
      context: string | null;
      user: UserLite | null;
      thread: NotificationThread | null;
      comment: NotificationComment | null;
    })
  | (NotificationBase & {
      __typename: 'ThreadLikeNotification';
      userId: number;
      threadId: number;
      context: string | null;
      user: UserLite | null;
      thread: NotificationThread | null;
    })
  | (NotificationBase & {
      __typename: 'RelatedMediaAdditionNotification';
      mediaId: number;
      context: string | null;
      media: NotificationMedia | null;
    })
  | (NotificationBase & {
      __typename: 'MediaDataChangeNotification';
      mediaId: number;
      context: string | null;
      reason: string | null;
      media: NotificationMedia | null;
    })
  | (NotificationBase & {
      __typename: 'MediaMergeNotification';
      mediaId: number;
      deletedMediaTitles: (string | null)[] | null;
      context: string | null;
      reason: string | null;
      media: NotificationMedia | null;
    })
  | (NotificationBase & {
      __typename: 'MediaDeletionNotification';
      deletedMediaTitle: string | null;
      context: string | null;
      reason: string | null;
    })
  | (NotificationBase & {
      __typename: 'MediaSubmissionUpdateNotification';
      contexts: (string | null)[] | null;
      status: string | null;
      notes: string | null;
      submittedTitle: string | null;
      media: NotificationMedia | null;
    })
  | (NotificationBase & {
      __typename: 'StaffSubmissionUpdateNotification';
      contexts: (string | null)[] | null;
      status: string | null;
      notes: string | null;
      staff: StaffLite | null;
    })
  | (NotificationBase & {
      __typename: 'CharacterSubmissionUpdateNotification';
      contexts: (string | null)[] | null;
      status: string | null;
      notes: string | null;
      character: CharacterLite | null;
    });

export type NotificationsQuery = PageOf<'notifications', AniListNotification>;
export interface NotificationsVariables extends PageVariables {
  type_in?: NotificationType[];
  resetNotificationCount?: boolean;
}

// ---------------------------------------------------------------------------
// favourites.ts
// ---------------------------------------------------------------------------

export interface ToggleFavouriteVariables {
  animeId?: number;
  mangaId?: number;
  characterId?: number;
  staffId?: number;
  studioId?: number;
}

export interface ToggleFavouriteMutation {
  ToggleFavourite: {
    anime: { pageInfo: { total: number | null } | null } | null;
    manga: { pageInfo: { total: number | null } | null } | null;
    characters: { pageInfo: { total: number | null } | null } | null;
    staff: { pageInfo: { total: number | null } | null } | null;
    studios: { pageInfo: { total: number | null } | null } | null;
  } | null;
}

export interface UpdateFavouriteOrderVariables {
  animeIds?: number[];
  animeOrder?: number[];
  mangaIds?: number[];
  mangaOrder?: number[];
  characterIds?: number[];
  characterOrder?: number[];
  staffIds?: number[];
  staffOrder?: number[];
  studioIds?: number[];
  studioOrder?: number[];
}

export interface UpdateFavouriteOrderMutation {
  UpdateFavouriteOrder: { anime: { pageInfo: { total: number | null } | null } | null } | null;
}

// ---------------------------------------------------------------------------
// settings.ts
// ---------------------------------------------------------------------------

export interface MediaListOptionsInput {
  sectionOrder?: string[];
  splitCompletedSectionByFormat?: boolean;
  customLists?: string[];
  advancedScoring?: string[];
  advancedScoringEnabled?: boolean;
  theme?: string;
}

export interface UpdateUserVariables {
  about?: string;
  titleLanguage?: UserTitleLanguage;
  staffNameLanguage?: UserStaffNameLanguage;
  displayAdultContent?: boolean;
  airingNotifications?: boolean;
  scoreFormat?: ScoreFormat;
  rowOrder?: string;
  /** blue | purple | pink | orange | red | green | gray, or a hex colour for donators. */
  profileColor?: string;
  donatorBadge?: string;
  notificationOptions?: { type: NotificationType; enabled: boolean }[];
  timezone?: string;
  activityMergeTime?: number;
  animeListOptions?: MediaListOptionsInput;
  mangaListOptions?: MediaListOptionsInput;
  restrictMessagesToFollowing?: boolean;
  disabledListActivity?: { type: MediaListStatus; disabled: boolean }[];
}

export interface UpdateUserMutation {
  UpdateUser: Viewer | null;
}

// ---------------------------------------------------------------------------
// reviews.ts
// ---------------------------------------------------------------------------

export interface ReviewDetail extends ReviewLite {
  body: string | null;
  media: (Pick<MediaCore, 'id' | 'type' | 'format' | 'title' | 'coverImage' | 'bannerImage' | 'isAdult'>) | null;
}

export interface ReviewQuery {
  Review: ReviewDetail | null;
}
export interface ReviewVariables {
  id: number;
  asHtml?: boolean;
}

export type ReviewsQuery = PageOf<'reviews', ReviewLite & { media: ReviewDetail['media'] }>;
export interface ReviewsVariables extends PageVariables {
  mediaId?: number;
  userId?: number;
  mediaType?: MediaType;
  sort?: ReviewSort[];
}

export interface RateReviewMutation {
  RateReview: { id: number; rating: number | null; ratingAmount: number | null; userRating: ReviewRating | null } | null;
}
export interface RateReviewVariables {
  reviewId: number;
  rating: ReviewRating;
}

export interface SaveReviewVariables {
  id?: number;
  mediaId: number;
  body: string;
  summary: string;
  score: number;
  private?: boolean;
}
export interface SaveReviewMutation {
  SaveReview: ReviewDetail | null;
}
export interface DeleteReviewMutation {
  DeleteReview: Deleted | null;
}
