import { StyleSheet, View } from 'react-native';

import type { MediaDetail } from '@/api/types';
import { AppText } from '@/components/app-text';
import { icons } from '@/components/icon';
import { airingCountdown } from '@/components/lists/list-model';
import { StatPill } from '@/components/stat-pill';
import { formatEnum, formatFuzzyDate } from '@/lib/format';
import { useTheme } from '@/theme';

import { formatRuntime, formatSpaced, mediaStatusLabel, rankLabel, unitLabel } from './media-format';

type Item = { key: string; label: string; value: string; wide?: boolean; onPress?: () => void };

type Props = { media: MediaDetail; onStudioPress: (id: number) => void };

function dateRange(media: MediaDetail): string {
  const start = formatFuzzyDate(media.startDate, 'medium', 'MDY');
  const end = formatFuzzyDate(media.endDate, 'medium', 'MDY');
  if (!start) return '-';
  if (media.status === 'RELEASING' || media.status === 'HIATUS') return `${start} - ?`;
  return `${start} - ${end || '?'}`;
}

/** Info card (gray labels, bold white values) with the rank pills underneath (spec §4.3-4). */
export function InfoCard({ media, onStudioPress }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const manga = media.type === 'MANGA';
  const studio = media.studios?.edges?.find((e) => e?.isMain)?.node ?? media.studios?.edges?.[0]?.node ?? null;
  const next = media.nextAiringEpisode;
  const nextIn = next ? airingCountdown(next.airingAt) : '';

  const items: Item[] = [
    { key: 'dates', label: mediaStatusLabel(media.status, media.type) || 'Status', value: dateRange(media), wide: true },
    manga
      ? { key: 'chapters', label: 'Chapters', value: media.chapters ? String(media.chapters) : '-' }
      : { key: 'episodes', label: 'Episodes', value: media.episodes ? String(media.episodes) : '-' },
    manga
      ? { key: 'volumes', label: 'Volumes', value: media.volumes ? String(media.volumes) : '-' }
      : { key: 'duration', label: 'Duration', value: formatRuntime(media.duration) },
    { key: 'popularity', label: 'Popularity', value: formatSpaced(media.popularity) },
    { key: 'favourites', label: 'Favorites', value: formatSpaced(media.favourites) },
  ];
  if (!manga) {
    items.push({ key: 'studio', label: 'Studio', value: studio?.name ?? '-', onPress: studio ? () => onStudioPress(studio.id) : undefined });
  }
  if (media.source) items.push({ key: 'source', label: 'Source', value: formatEnum(media.source) });
  if (next) {
    items.push({ key: 'next', label: `Next ${unitLabel(media.type, false)}`, value: nextIn ? `${next.episode} in ${nextIn}` : `${next.episode} aired`, wide: true });
  }

  const ranks = (media.rankings ?? [])
    .filter((r): r is NonNullable<typeof r> => r != null)
    .sort((a, b) => Number(b.allTime) - Number(a.allTime) || a.rank - b.rank)
    .slice(0, 4);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.key} style={[styles.cell, item.wide && styles.wide]}>
            <AppText variant="caption1" tone="secondary" numberOfLines={1}>
              {item.label}
            </AppText>
            <AppText
              variant="footnote"
              weight="700"
              // Studio names ("Studio Pierrot") don't fit a quarter-width cell on one line.
              numberOfLines={item.key === 'studio' ? 2 : 1}
              onPress={item.onPress}
              suppressHighlighting
              style={item.onPress ? styles.link : undefined}
              accessibilityRole={item.onPress ? 'link' : undefined}>
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
      {ranks.length ? (
        <View style={styles.ranks}>
          {ranks.map((r) => {
            const { rank, context } = rankLabel(r);
            const rated = r.type === 'RATED';
            return (
              <StatPill
                key={r.id}
                label={rank}
                value={context}
                icon={rated ? icons.star : icons.heartFill}
                iconColor={rated ? c.star : c.rankHeart}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, padding: 12, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  cell: { width: '25%', paddingRight: 6, gap: 1 },
  wide: { width: '50%' },
  link: { textDecorationLine: 'underline' },
  ranks: { gap: 6 },
});
