import type { PreferredStaffName, PreferredTitle } from '@/settings/types';

/** Shape of AniList `MediaTitle` (all fields optional/nullable). */
export type MediaTitleLike = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
};

/** Shape of AniList `CharacterName` / `StaffName`. */
export type PersonNameLike = {
  first?: string | null;
  middle?: string | null;
  last?: string | null;
  full?: string | null;
  native?: string | null;
  userPreferred?: string | null;
  alternative?: (string | null)[] | null;
};

const TITLE_FALLBACK: Record<PreferredTitle, (keyof MediaTitleLike)[]> = {
  userPreferred: ['userPreferred', 'romaji', 'english', 'native'],
  romaji: ['romaji', 'userPreferred', 'english', 'native'],
  english: ['english', 'userPreferred', 'romaji', 'native'],
  native: ['native', 'userPreferred', 'romaji', 'english'],
};

function clean(v: string | null | undefined): string | undefined {
  const t = v?.trim();
  return t ? t : undefined;
}

/** Pick a media title by preference, falling back through the other variants. */
export function pickTitle(
  title: MediaTitleLike | null | undefined,
  preferred: PreferredTitle = 'userPreferred',
  fallback = '',
): string {
  if (!title) return fallback;
  for (const key of TITLE_FALLBACK[preferred]) {
    const v = clean(title[key]);
    if (v) return v;
  }
  return fallback;
}

/**
 * Secondary title to show under the main one (e.g. native under English),
 * or undefined when it would duplicate the primary.
 */
export function pickSubtitle(
  title: MediaTitleLike | null | undefined,
  preferred: PreferredTitle = 'userPreferred',
): string | undefined {
  if (!title) return undefined;
  const primary = pickTitle(title, preferred);
  const order: (keyof MediaTitleLike)[] =
    preferred === 'native' ? ['romaji', 'english'] : ['native', 'romaji', 'english'];
  for (const key of order) {
    const v = clean(title[key]);
    if (v && v !== primary) return v;
  }
  return undefined;
}

/** All distinct, non-empty title variants (useful for search highlighting / synonyms). */
export function allTitles(title: MediaTitleLike | null | undefined, synonyms?: (string | null)[] | null) {
  const set = new Set<string>();
  for (const v of [title?.userPreferred, title?.romaji, title?.english, title?.native, ...(synonyms ?? [])]) {
    const c = clean(v);
    if (c) set.add(c);
  }
  return [...set];
}

/** Pick a character/staff name by preference with fallbacks. */
export function pickName(
  name: PersonNameLike | null | undefined,
  preferred: PreferredStaffName = 'userPreferred',
  fallback = '',
): string {
  if (!name) return fallback;
  const western = clean([clean(name.first), clean(name.middle), clean(name.last)].filter(Boolean).join(' '));
  const candidates: (string | undefined)[] =
    preferred === 'native'
      ? [clean(name.native), clean(name.userPreferred), clean(name.full), western]
      : preferred === 'romaji'
        ? [clean(name.full), western, clean(name.userPreferred), clean(name.native)]
        : preferred === 'romajiWestern'
          ? [western, clean(name.full), clean(name.userPreferred), clean(name.native)]
          : [clean(name.userPreferred), clean(name.full), western, clean(name.native)];
  return candidates.find(Boolean) ?? fallback;
}
