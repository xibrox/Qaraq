import { gql, type GqlOptions } from './client';
import { operation } from './document';
import type {
  ToggleFavouriteMutation,
  ToggleFavouriteVariables,
  UpdateFavouriteOrderMutation,
  UpdateFavouriteOrderVariables,
} from './types';

export const TOGGLE_FAVOURITE_MUTATION = operation(`
mutation ToggleFavourite($animeId: Int, $mangaId: Int, $characterId: Int, $staffId: Int, $studioId: Int) {
  ToggleFavourite(
    animeId: $animeId
    mangaId: $mangaId
    characterId: $characterId
    staffId: $staffId
    studioId: $studioId
  ) {
    anime(perPage: 1) { pageInfo { total } }
    manga(perPage: 1) { pageInfo { total } }
    characters(perPage: 1) { pageInfo { total } }
    staff(perPage: 1) { pageInfo { total } }
    studios(perPage: 1) { pageInfo { total } }
  }
}`);

export const UPDATE_FAVOURITE_ORDER_MUTATION = operation(`
mutation UpdateFavouriteOrder(
  $animeIds: [Int]
  $animeOrder: [Int]
  $mangaIds: [Int]
  $mangaOrder: [Int]
  $characterIds: [Int]
  $characterOrder: [Int]
  $staffIds: [Int]
  $staffOrder: [Int]
  $studioIds: [Int]
  $studioOrder: [Int]
) {
  UpdateFavouriteOrder(
    animeIds: $animeIds
    animeOrder: $animeOrder
    mangaIds: $mangaIds
    mangaOrder: $mangaOrder
    characterIds: $characterIds
    characterOrder: $characterOrder
    staffIds: $staffIds
    staffOrder: $staffOrder
    studioIds: $studioIds
    studioOrder: $studioOrder
  ) {
    anime(perPage: 1) { pageInfo { total } }
  }
}`);

export type FavouriteTarget =
  | { kind: 'anime'; id: number }
  | { kind: 'manga'; id: number }
  | { kind: 'character'; id: number }
  | { kind: 'staff'; id: number }
  | { kind: 'studio'; id: number };

export function toggleFavouriteVariables(target: FavouriteTarget): ToggleFavouriteVariables {
  switch (target.kind) {
    case 'anime':
      return { animeId: target.id };
    case 'manga':
      return { mangaId: target.id };
    case 'character':
      return { characterId: target.id };
    case 'staff':
      return { staffId: target.id };
    case 'studio':
      return { studioId: target.id };
  }
}

export const toggleFavourite = (target: FavouriteTarget, opts?: GqlOptions) =>
  gql<ToggleFavouriteMutation>(TOGGLE_FAVOURITE_MUTATION, toggleFavouriteVariables(target), opts);

export const updateFavouriteOrder = (vars: UpdateFavouriteOrderVariables, opts?: GqlOptions) =>
  gql<UpdateFavouriteOrderMutation>(UPDATE_FAVOURITE_ORDER_MUTATION, vars, opts);
