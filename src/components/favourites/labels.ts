import type { FavouriteKind } from '@/api/types';

/** Profile "Favorite" tab section headers (AniClient: "Animes", "Characters", "Staff"). */
export const FAVOURITE_SECTION_TITLES: Record<FavouriteKind, string> = {
  anime: 'Animes',
  manga: 'Mangas',
  characters: 'Characters',
  staff: 'Staff',
  studios: 'Studios',
};

/** Full-list nav titles ("Favorite Animes"). */
export const FAVOURITE_LIST_TITLES: Record<FavouriteKind, string> = {
  anime: 'Favorite Animes',
  manga: 'Favorite Mangas',
  characters: 'Favorite Characters',
  staff: 'Favorite Staff',
  studios: 'Favorite Studios',
};

export const FAVOURITE_KINDS: readonly FavouriteKind[] = ['anime', 'manga', 'characters', 'staff', 'studios'];

export function isFavouriteKind(v: unknown): v is FavouriteKind {
  return typeof v === 'string' && (FAVOURITE_KINDS as readonly string[]).includes(v);
}
