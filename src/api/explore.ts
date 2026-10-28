import { gql, type GqlOptions } from './client';
import { argList, operation } from './document';
import { AIRING_EPISODE, CHARACTER_LITE, MEDIA_CARD, PAGE_INFO, STAFF_LITE, STUDIO_LITE, USER_LITE } from './fragments';
import { MEDIA_TAG } from './media';
import type {
  AiringSchedulesQuery,
  AiringSchedulesVariables,
  CharacterSearchQuery,
  CharacterSearchVariables,
  ExploreHomeQuery,
  ExploreHomeVariables,
  GenreCollectionQuery,
  MediaSearchQuery,
  MediaSearchVariables,
  MediaSeason,
  MediaTagCollectionQuery,
  MediaType,
  StaffSearchQuery,
  StaffSearchVariables,
  StudioSearchQuery,
  StudioSearchVariables,
  UserSearchQuery,
  UserSearchVariables,
} from './types';

/** Every argument of `Page.media(...)` in the schema, with its GraphQL type. */
export const MEDIA_FILTER_ARGS = [
  ['id', 'Int'],
  ['idMal', 'Int'],
  ['startDate', 'FuzzyDateInt'],
  ['endDate', 'FuzzyDateInt'],
  ['season', 'MediaSeason'],
  ['seasonYear', 'Int'],
  ['type', 'MediaType'],
  ['format', 'MediaFormat'],
  ['status', 'MediaStatus'],
  ['episodes', 'Int'],
  ['duration', 'Int'],
  ['chapters', 'Int'],
  ['volumes', 'Int'],
  ['isAdult', 'Boolean'],
  ['genre', 'String'],
  ['tag', 'String'],
  ['minimumTagRank', 'Int'],
  ['tagCategory', 'String'],
  ['onList', 'Boolean'],
  ['licensedBy', 'String'],
  ['licensedById', 'Int'],
  ['averageScore', 'Int'],
  ['popularity', 'Int'],
  ['source', 'MediaSource'],
  ['countryOfOrigin', 'CountryCode'],
  ['isLicensed', 'Boolean'],
  ['search', 'String'],
  ['id_not', 'Int'],
  ['id_in', '[Int]'],
  ['id_not_in', '[Int]'],
  ['idMal_not', 'Int'],
  ['idMal_in', '[Int]'],
  ['idMal_not_in', '[Int]'],
  ['startDate_greater', 'FuzzyDateInt'],
  ['startDate_lesser', 'FuzzyDateInt'],
  ['startDate_like', 'String'],
  ['endDate_greater', 'FuzzyDateInt'],
  ['endDate_lesser', 'FuzzyDateInt'],
  ['endDate_like', 'String'],
  ['format_in', '[MediaFormat]'],
  ['format_not', 'MediaFormat'],
  ['format_not_in', '[MediaFormat]'],
  ['status_in', '[MediaStatus]'],
  ['status_not', 'MediaStatus'],
  ['status_not_in', '[MediaStatus]'],
  ['episodes_greater', 'Int'],
  ['episodes_lesser', 'Int'],
  ['duration_greater', 'Int'],
  ['duration_lesser', 'Int'],
  ['chapters_greater', 'Int'],
  ['chapters_lesser', 'Int'],
  ['volumes_greater', 'Int'],
  ['volumes_lesser', 'Int'],
  ['genre_in', '[String]'],
  ['genre_not_in', '[String]'],
  ['tag_in', '[String]'],
  ['tag_not_in', '[String]'],
  ['tagCategory_in', '[String]'],
  ['tagCategory_not_in', '[String]'],
  ['licensedBy_in', '[String]'],
  ['licensedById_in', '[Int]'],
  ['averageScore_not', 'Int'],
  ['averageScore_greater', 'Int'],
  ['averageScore_lesser', 'Int'],
  ['popularity_not', 'Int'],
  ['popularity_greater', 'Int'],
  ['popularity_lesser', 'Int'],
  ['source_in', '[MediaSource]'],
  ['countryOfOrigin_in', '[CountryCode]'],
  ['countryOfOrigin_not_in', '[CountryCode]'],
  ['sort', '[MediaSort]'],
] as const satisfies readonly (readonly [keyof MediaSearchVariables, string])[];

const mediaArgs = argList(MEDIA_FILTER_ARGS);

/** Advanced search: accepts every AniList media filter plus page/perPage. */
export const MEDIA_SEARCH_QUERY = operation(
  `
query MediaSearch($page: Int = 1, $perPage: Int = 30, ${mediaArgs.declarations}) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(${mediaArgs.arguments}) { ...MediaCardFields }
  }
}`,
  [PAGE_INFO, MEDIA_CARD],
);

/** Explore landing sections in a single request (like anilist.co/search/anime). */
export const EXPLORE_HOME_QUERY = operation(
  `
query ExploreHome(
  $type: MediaType!
  $season: MediaSeason
  $seasonYear: Int
  $nextSeason: MediaSeason
  $nextYear: Int
  $perPage: Int = 10
  $isAdult: Boolean = false
) {
  trending: Page(perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(type: $type, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) { ...MediaCardFields }
  }
  season: Page(perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(type: $type, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: $isAdult) {
      ...MediaCardFields
    }
  }
  nextSeason: Page(perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(type: $type, season: $nextSeason, seasonYear: $nextYear, sort: [POPULARITY_DESC], isAdult: $isAdult) {
      ...MediaCardFields
    }
  }
  popular: Page(perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(type: $type, sort: [POPULARITY_DESC], isAdult: $isAdult) { ...MediaCardFields }
  }
  top: Page(perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(type: $type, sort: [SCORE_DESC], isAdult: $isAdult) { ...MediaCardFields }
  }
}`,
  [PAGE_INFO, MEDIA_CARD],
);

export const GENRE_COLLECTION_QUERY = operation(`
query GenreCollection {
  GenreCollection
}`);

export const MEDIA_TAG_COLLECTION_QUERY = operation(
  `
query MediaTagCollection {
  MediaTagCollection { ...MediaTagFields }
}`,
  [MEDIA_TAG],
);

export const AIRING_SCHEDULES_QUERY = operation(
  `
query AiringSchedules(
  $page: Int = 1
  $perPage: Int = 50
  $airingAt_greater: Int
  $airingAt_lesser: Int
  $notYetAired: Boolean
  $mediaId: Int
  $mediaId_in: [Int]
  $sort: [AiringSort] = [TIME]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    airingSchedules(
      airingAt_greater: $airingAt_greater
      airingAt_lesser: $airingAt_lesser
      notYetAired: $notYetAired
      mediaId: $mediaId
      mediaId_in: $mediaId_in
      sort: $sort
    ) {
      ...AiringEpisodeFields
      media { ...MediaCardFields }
    }
  }
}`,
  [PAGE_INFO, AIRING_EPISODE, MEDIA_CARD],
);

export const CHARACTER_SEARCH_QUERY = operation(
  `
query CharacterSearch(
  $page: Int = 1
  $perPage: Int = 30
  $search: String
  $isBirthday: Boolean
  $sort: [CharacterSort] = [SEARCH_MATCH, FAVOURITES_DESC]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    characters(search: $search, isBirthday: $isBirthday, sort: $sort) { ...CharacterLiteFields }
  }
}`,
  [PAGE_INFO, CHARACTER_LITE],
);

export const STAFF_SEARCH_QUERY = operation(
  `
query StaffSearch(
  $page: Int = 1
  $perPage: Int = 30
  $search: String
  $isBirthday: Boolean
  $sort: [StaffSort] = [SEARCH_MATCH, FAVOURITES_DESC]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    staff(search: $search, isBirthday: $isBirthday, sort: $sort) { ...StaffLiteFields }
  }
}`,
  [PAGE_INFO, STAFF_LITE],
);

export const STUDIO_SEARCH_QUERY = operation(
  `
query StudioSearch($page: Int = 1, $perPage: Int = 30, $search: String, $sort: [StudioSort] = [SEARCH_MATCH, FAVOURITES_DESC]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    studios(search: $search, sort: $sort) { ...StudioLiteFields }
  }
}`,
  [PAGE_INFO, STUDIO_LITE],
);

export const USER_SEARCH_QUERY = operation(
  `
query UserSearch($page: Int = 1, $perPage: Int = 30, $search: String, $sort: [UserSort] = [SEARCH_MATCH]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    users(search: $search, sort: $sort) { ...UserLiteFields }
  }
}`,
  [PAGE_INFO, USER_LITE],
);

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const SEASON_ORDER: MediaSeason[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

/** AniList season for a date (Dec counts as next year's WINTER, like AniList). */
export function seasonFor(date = new Date()): { season: MediaSeason; year: number } {
  const m = date.getMonth();
  const year = date.getFullYear();
  if (m === 11) return { season: 'WINTER', year: year + 1 };
  return { season: SEASON_ORDER[Math.floor((m + 1) / 3)], year };
}

export function nextSeasonFor(date = new Date()): { season: MediaSeason; year: number } {
  const { season, year } = seasonFor(date);
  const i = SEASON_ORDER.indexOf(season);
  return i === 3 ? { season: 'WINTER', year: year + 1 } : { season: SEASON_ORDER[i + 1], year };
}

export function previousSeasonFor(date = new Date()): { season: MediaSeason; year: number } {
  const { season, year } = seasonFor(date);
  const i = SEASON_ORDER.indexOf(season);
  return i === 0 ? { season: 'FALL', year: year - 1 } : { season: SEASON_ORDER[i - 1], year };
}

export type ExplorePreset = 'trending' | 'popular' | 'season' | 'nextSeason' | 'upcoming' | 'top' | 'airing';

/** Variables for "See all" lists on the Explore tab. */
export function explorePresetVariables(
  preset: ExplorePreset,
  type: MediaType,
  extra: MediaSearchVariables = {},
  now = new Date(),
): MediaSearchVariables {
  const base: MediaSearchVariables = { type, ...extra };
  switch (preset) {
    case 'trending':
      return { ...base, sort: ['TRENDING_DESC', 'POPULARITY_DESC'] };
    case 'popular':
      return { ...base, sort: ['POPULARITY_DESC'] };
    case 'top':
      return { ...base, sort: ['SCORE_DESC'] };
    case 'season': {
      const s = seasonFor(now);
      return { ...base, season: s.season, seasonYear: s.year, sort: ['POPULARITY_DESC'] };
    }
    case 'nextSeason': {
      const s = nextSeasonFor(now);
      return { ...base, season: s.season, seasonYear: s.year, sort: ['POPULARITY_DESC'] };
    }
    case 'upcoming':
      return { ...base, status: 'NOT_YET_RELEASED', sort: ['POPULARITY_DESC'] };
    case 'airing':
      return { ...base, status: 'RELEASING', sort: ['POPULARITY_DESC'] };
  }
}

export function exploreHomeVariables(type: MediaType, isAdult = false, now = new Date()): ExploreHomeVariables {
  const s = seasonFor(now);
  const n = nextSeasonFor(now);
  return { type, season: s.season, seasonYear: s.year, nextSeason: n.season, nextYear: n.year, isAdult };
}

/** Converts a JS date to AniList FuzzyDateInt (YYYYMMDD). */
export function toFuzzyDateInt(year: number, month = 0, day = 0) {
  return year * 10000 + month * 100 + day;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export const searchMedia = (vars: MediaSearchVariables, opts?: GqlOptions) =>
  gql<MediaSearchQuery>(MEDIA_SEARCH_QUERY, vars, opts);
export const fetchExploreHome = (vars: ExploreHomeVariables, opts?: GqlOptions) =>
  gql<ExploreHomeQuery>(EXPLORE_HOME_QUERY, vars, opts);
export const fetchGenreCollection = (opts?: GqlOptions) =>
  gql<GenreCollectionQuery>(GENRE_COLLECTION_QUERY, {}, opts);
export const fetchMediaTagCollection = (opts?: GqlOptions) =>
  gql<MediaTagCollectionQuery>(MEDIA_TAG_COLLECTION_QUERY, {}, opts);
export const fetchAiringSchedules = (vars: AiringSchedulesVariables, opts?: GqlOptions) =>
  gql<AiringSchedulesQuery>(AIRING_SCHEDULES_QUERY, vars, opts);
export const searchCharacters = (vars: CharacterSearchVariables, opts?: GqlOptions) =>
  gql<CharacterSearchQuery>(CHARACTER_SEARCH_QUERY, vars, opts);
export const searchStaff = (vars: StaffSearchVariables, opts?: GqlOptions) =>
  gql<StaffSearchQuery>(STAFF_SEARCH_QUERY, vars, opts);
export const searchStudios = (vars: StudioSearchVariables, opts?: GqlOptions) =>
  gql<StudioSearchQuery>(STUDIO_SEARCH_QUERY, vars, opts);
export const searchUsers = (vars: UserSearchVariables, opts?: GqlOptions) =>
  gql<UserSearchQuery>(USER_SEARCH_QUERY, vars, opts);
