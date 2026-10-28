import type { Href } from 'expo-router';

import type { CharacterLite, FavouriteKind, FavouriteNodeMap, MediaCard, StaffLite, StudioLite } from '@/api/types';
import { formatEnum } from '@/lib/format';
import { pickName, pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import type { PreferredTitle } from '@/settings/types';

/** One favourite, flattened for rows and cards regardless of kind. */
export type FavouriteItem = {
  id: number;
  title: string;
  subtitle?: string;
  /** undefined for studios (no image on AniList). */
  imageUrl?: string | null;
  isAdult?: boolean | null;
  href: Href;
};

function mediaItem(m: MediaCard, preferred: PreferredTitle): FavouriteItem {
  const year = m.startDate?.year ?? m.seasonYear;
  return {
    id: m.id,
    title: pickTitle(m.title, preferred),
    subtitle: [formatEnum(m.format), year ? String(year) : null].filter(Boolean).join(' · ') || undefined,
    imageUrl: m.coverImage?.large ?? m.coverImage?.medium ?? null,
    isAdult: m.isAdult,
    href: hrefs.media(m.id),
  };
}

function characterItem(c: CharacterLite): FavouriteItem {
  return {
    id: c.id,
    title: pickName(c.name),
    subtitle: c.name?.native ?? undefined,
    imageUrl: c.image?.large ?? c.image?.medium ?? null,
    href: hrefs.character(c.id),
  };
}

function staffItem(s: StaffLite): FavouriteItem {
  return {
    id: s.id,
    title: pickName(s.name),
    subtitle: (s.primaryOccupations ?? []).filter(Boolean).join(', ') || s.name?.native || undefined,
    imageUrl: s.image?.large ?? s.image?.medium ?? null,
    href: hrefs.staff(s.id),
  };
}

function studioItem(s: StudioLite): FavouriteItem {
  return {
    id: s.id,
    title: s.name,
    subtitle: s.isAnimationStudio ? 'Animation Studio' : 'Studio',
    href: hrefs.studio(s.id),
  };
}

export type FavouriteNode = FavouriteNodeMap[FavouriteKind];

/** Nodes must belong to `kind` (they come from the matching favourites connection). */
export function toFavouriteItems(
  kind: FavouriteKind,
  nodes: readonly (FavouriteNode | null)[] | null | undefined,
  preferred: PreferredTitle,
): FavouriteItem[] {
  const list = (nodes ?? []).filter((n): n is FavouriteNode => n != null);
  switch (kind) {
    case 'anime':
    case 'manga':
      return (list as MediaCard[]).map((m) => mediaItem(m, preferred));
    case 'characters':
      return (list as CharacterLite[]).map(characterItem);
    case 'staff':
      return (list as StaffLite[]).map(staffItem);
    default:
      return (list as StudioLite[]).map(studioItem);
  }
}
