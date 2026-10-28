/**
 * Pure formatting helpers for the Explore / Search / Media detail screens (AniClient wording).
 */
import type { MediaFormat, MediaRank, MediaRelation, MediaSeason, MediaStatus, MediaType } from '@/api/types';
import { formatEnum } from '@/lib/format';

/** 189301 -> "189 301" (AniClient groups thousands with a space). */
export function formatSpaced(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 98 -> "1hr 38min", 24 -> "24min" (per episode). */
export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}min`;
  return m ? `${h}hr ${m}min` : `${h}hr`;
}

/** "Finished", "Releasing", "Not Yet Released"... (Airing/Publishing aware). */
export function mediaStatusLabel(status: MediaStatus | null | undefined, type: MediaType | null | undefined): string {
  switch (status) {
    case 'FINISHED':
      return 'Finished';
    case 'RELEASING':
      return type === 'MANGA' ? 'Publishing' : 'Airing';
    case 'NOT_YET_RELEASED':
      return type === 'MANGA' ? 'Not Yet Published' : 'Not Yet Aired';
    case 'CANCELLED':
      return 'Cancelled';
    case 'HIATUS':
      return 'Hiatus';
    default:
      return '';
  }
}

const FORMAT_LABELS: Record<MediaFormat, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
  MANGA: 'Manga',
  NOVEL: 'Light Novel',
  ONE_SHOT: 'One Shot',
};

export function mediaFormatLabel(format: MediaFormat | null | undefined): string {
  return format ? FORMAT_LABELS[format] : '';
}

export function seasonLabel(season: MediaSeason | null | undefined): string {
  return season ? season.charAt(0) + season.slice(1).toLowerCase() : '';
}

/** "Fall - 2026" (Explore section subtitle). */
export function seasonSubtitle(season: MediaSeason, year: number): string {
  return `${seasonLabel(season)} - ${year}`;
}

const RELATION_LABELS: Partial<Record<MediaRelation, string>> = {
  SIDE_STORY: 'Side Story',
  SPIN_OFF: 'Spin Off',
  SAME_UNIVERSE: 'Same Universe',
};

export function relationLabel(relation: MediaRelation | null | undefined): string {
  if (!relation) return '';
  return RELATION_LABELS[relation] ?? formatEnum(relation);
}

/** "#54 · Highest Rated All Time" / "#3 · Most Popular Fall 2020". */
export function rankLabel(rank: MediaRank): { rank: string; context: string } {
  const words = rank.context
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
  const when = rank.allTime ? '' : [rank.season ? seasonLabel(rank.season) : '', rank.year ?? ''].filter(Boolean).join(' ');
  const context = rank.allTime || !when ? words : `${words.replace(/ All Time$/, '')} ${when}`;
  return { rank: `#${rank.rank}`, context };
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

/** Decodes the HTML entities AniList uses. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** AniList description (HTML or plain with <br>) -> readable plain text. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/~!|!~/g, '')
      .replace(/\n{3,}/g, '\n\n'),
  ).trim();
}

/** YouTube / Dailymotion page URL for an AniList trailer. */
export function trailerUrl(trailer: { id: string | null; site: string | null } | null | undefined): string | null {
  // AniList ids sometimes carry whitespace ("LHtdKWJdif4\t"), which breaks the URL.
  const id = trailer?.id?.trim();
  if (!id) return null;
  if (trailer?.site === 'youtube') return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  if (trailer?.site === 'dailymotion') return `https://www.dailymotion.com/video/${encodeURIComponent(id)}`;
  return null;
}

/** Large trailer thumbnail (AniList's `thumbnail` is a small hqdefault). */
export function trailerThumbnail(trailer: { id: string | null; site: string | null; thumbnail: string | null } | null | undefined) {
  const id = trailer?.id?.trim();
  if (!trailer || !id) return null;
  if (trailer.site === 'youtube') return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  return trailer.thumbnail?.trim() || null;
}

/** Units for progress counts. */
export function unitLabel(type: MediaType | null | undefined, plural = true): string {
  if (type === 'MANGA') return plural ? 'Chapters' : 'Chapter';
  return plural ? 'Episodes' : 'Episode';
}
