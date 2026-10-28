import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { MEDIA_CARD, PAGE_INFO, STAFF_LITE } from './fragments';
import type { CharacterMediaQuery, CharacterQuery, CharacterVariables } from './types';

export const CHARACTER_MEDIA_EDGE = fragment(
  `
fragment CharacterMediaEdgeFields on MediaEdge {
  id
  characterRole
  characterName
  voiceActorRoles(language: $language, sort: [RELEVANCE, ID]) {
    roleNotes
    dubGroup
    voiceActor { ...StaffLiteFields }
  }
  node { ...MediaCardFields }
}`,
  [STAFF_LITE, MEDIA_CARD],
);

export const CHARACTER_QUERY = operation(
  `
query Character(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $sort: [MediaSort] = [POPULARITY_DESC]
  $type: MediaType
  $onList: Boolean
  $language: StaffLanguage
) {
  Character(id: $id) {
    id
    name { first middle last full native alternative alternativeSpoiler userPreferred }
    image { large medium }
    description(asHtml: true)
    gender
    dateOfBirth { year month day }
    age
    bloodType
    isFavourite
    isFavouriteBlocked
    favourites
    siteUrl
    media(page: $page, perPage: $perPage, sort: $sort, type: $type, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...CharacterMediaEdgeFields }
    }
  }
}`,
  [PAGE_INFO, CHARACTER_MEDIA_EDGE],
);

/** Paged appearances only (infinite scroll on the character screen). */
export const CHARACTER_MEDIA_QUERY = operation(
  `
query CharacterMedia(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 25
  $sort: [MediaSort] = [POPULARITY_DESC]
  $type: MediaType
  $onList: Boolean
  $language: StaffLanguage
) {
  Character(id: $id) {
    id
    media(page: $page, perPage: $perPage, sort: $sort, type: $type, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges { ...CharacterMediaEdgeFields }
    }
  }
}`,
  [PAGE_INFO, CHARACTER_MEDIA_EDGE],
);

export const fetchCharacter = (vars: CharacterVariables, opts?: GqlOptions) =>
  gql<CharacterQuery>(CHARACTER_QUERY, vars, opts);
export const fetchCharacterMedia = (vars: CharacterVariables, opts?: GqlOptions) =>
  gql<CharacterMediaQuery>(CHARACTER_MEDIA_QUERY, vars, opts);
