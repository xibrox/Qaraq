import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { CHARACTER_LITE, MEDIA_CARD, PAGE_INFO } from './fragments';
import type {
  StaffCharacterMediaQuery,
  StaffCharacterMediaVariables,
  StaffQuery,
  StaffStaffMediaQuery,
  StaffStaffMediaVariables,
  StaffVariables,
} from './types';

export const STAFF_CHARACTER_MEDIA_EDGE = fragment(
  `
fragment StaffCharacterMediaEdgeFields on MediaEdge {
  id
  characterRole
  characterName
  characters { ...CharacterLiteFields }
  node { ...MediaCardFields }
}`,
  [CHARACTER_LITE, MEDIA_CARD],
);

export const STAFF_MEDIA_EDGE = fragment(
  `
fragment StaffMediaEdgeFields on MediaEdge {
  id
  staffRole
  node { ...MediaCardFields }
}`,
  [MEDIA_CARD],
);

export const STAFF_QUERY = operation(
  `
query Staff($id: Int!, $perPage: Int = 25, $sort: [MediaSort] = [START_DATE_DESC], $onList: Boolean) {
  Staff(id: $id) {
    id
    name { first middle last full native alternative userPreferred }
    image { large medium }
    description(asHtml: true)
    languageV2
    primaryOccupations
    gender
    dateOfBirth { year month day }
    dateOfDeath { year month day }
    age
    yearsActive
    homeTown
    bloodType
    isFavourite
    isFavouriteBlocked
    favourites
    siteUrl
    characterMedia(page: 1, perPage: $perPage, sort: $sort, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...StaffCharacterMediaEdgeFields }
    }
    staffMedia(page: 1, perPage: $perPage, sort: $sort, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...StaffMediaEdgeFields }
    }
  }
}`,
  [PAGE_INFO, STAFF_CHARACTER_MEDIA_EDGE, STAFF_MEDIA_EDGE],
);

/** Voice-acting roles (characters played) – paged. */
export const STAFF_CHARACTER_MEDIA_QUERY = operation(
  `
query StaffCharacterMedia(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $sort: [MediaSort] = [START_DATE_DESC]
  $onList: Boolean
) {
  Staff(id: $id) {
    id
    characterMedia(page: $page, perPage: $perPage, sort: $sort, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...StaffCharacterMediaEdgeFields }
    }
  }
}`,
  [PAGE_INFO, STAFF_CHARACTER_MEDIA_EDGE],
);

/** Production staff roles – paged, optionally filtered by media type. */
export const STAFF_STAFF_MEDIA_QUERY = operation(
  `
query StaffStaffMedia(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $sort: [MediaSort] = [START_DATE_DESC]
  $type: MediaType
  $onList: Boolean
) {
  Staff(id: $id) {
    id
    staffMedia(page: $page, perPage: $perPage, sort: $sort, type: $type, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...StaffMediaEdgeFields }
    }
  }
}`,
  [PAGE_INFO, STAFF_MEDIA_EDGE],
);

export const fetchStaff = (vars: StaffVariables, opts?: GqlOptions) => gql<StaffQuery>(STAFF_QUERY, vars, opts);
export const fetchStaffCharacterMedia = (vars: StaffCharacterMediaVariables, opts?: GqlOptions) =>
  gql<StaffCharacterMediaQuery>(STAFF_CHARACTER_MEDIA_QUERY, vars, opts);
export const fetchStaffStaffMedia = (vars: StaffStaffMediaVariables, opts?: GqlOptions) =>
  gql<StaffStaffMediaQuery>(STAFF_STAFF_MEDIA_QUERY, vars, opts);
