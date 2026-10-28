import { nextSeasonFor, seasonFor } from '@/api/explore';
import type { MediaType } from '@/api/types';
import { seasonSubtitle } from '@/components/media/media-format';

/** Explore "›" presets understood by the search screen (`hrefs.search({ preset })`). */
export type ExplorePresetKey = 'trending' | 'season' | 'nextSeason' | 'popular' | 'top' | 'manhwa';

export type ExploreSectionKind = 'trending' | 'posters' | 'grid';

export type ExploreSectionDef = {
  key: ExplorePresetKey;
  title: string;
  subtitle?: string;
  kind: ExploreSectionKind;
};

/** Sections in AniClient order (spec §3). */
export function exploreSections(type: MediaType, now = new Date()): ExploreSectionDef[] {
  if (type === 'MANGA') {
    return [
      { key: 'trending', title: 'Trending Now', kind: 'trending' },
      { key: 'popular', title: 'All Time Popular', kind: 'posters' },
      { key: 'manhwa', title: 'Popular Manhwa', kind: 'posters' },
      { key: 'top', title: 'Top Manga', subtitle: 'Top 100', kind: 'grid' },
    ];
  }
  const s = seasonFor(now);
  const n = nextSeasonFor(now);
  return [
    { key: 'trending', title: 'Trending Now', kind: 'trending' },
    { key: 'season', title: 'Popular This Season', subtitle: seasonSubtitle(s.season, s.year), kind: 'posters' },
    { key: 'nextSeason', title: 'Upcoming Next Season', subtitle: seasonSubtitle(n.season, n.year), kind: 'posters' },
    { key: 'popular', title: 'All Time Popular', kind: 'posters' },
    { key: 'top', title: 'Top Anime', subtitle: 'Top 100', kind: 'grid' },
  ];
}
