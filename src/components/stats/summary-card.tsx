import { StyleSheet, View } from 'react-native';

import type { MediaType, ScoreFormat, UserStatisticsDetail } from '@/api/types';
import { AppText } from '@/components/app-text';
import { minutesToDays } from '@/lib/format';
import { useTheme } from '@/theme';

import { formatMean, formatSpaced } from './stats-data';

type Cell = { label: string; value: string };

export function summaryCells(stats: UserStatisticsDetail, type: MediaType, format?: ScoreFormat | null): Cell[] {
  const planning = (stats.statuses ?? []).find((s) => s?.status === 'PLANNING');
  if (type === 'ANIME') {
    return [
      { label: 'Total', value: formatSpaced(stats.count) },
      { label: 'Eps. Watched', value: formatSpaced(stats.episodesWatched) },
      { label: 'Days Watched', value: minutesToDays(stats.minutesWatched) },
      { label: 'Mean Score', value: formatMean(stats.meanScore, format) },
      { label: 'Days Planned', value: minutesToDays(planning?.minutesWatched ?? 0) },
      { label: 'Std. Deviation', value: formatMean(stats.standardDeviation, format) },
    ];
  }
  return [
    { label: 'Total', value: formatSpaced(stats.count) },
    { label: 'Chapters Read', value: formatSpaced(stats.chaptersRead) },
    { label: 'Planned', value: formatSpaced(planning?.count ?? 0) },
    { label: 'Volumes Read', value: formatSpaced(stats.volumesRead) },
    { label: 'Mean Score', value: formatMean(stats.meanScore, format) },
    { label: 'Std. Deviation', value: formatMean(stats.standardDeviation, format) },
  ];
}

/** "Summary" card: two columns of big numbers over gray labels ("317 / Total", "3 974 / Eps. Watched"). */
export function SummaryCard({
  stats,
  type,
  scoreFormat,
}: {
  stats: UserStatisticsDetail;
  type: MediaType;
  scoreFormat?: ScoreFormat | null;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
      {summaryCells(stats, type, scoreFormat).map((cell) => (
        <View key={cell.label} style={styles.cell} accessible accessibilityLabel={`${cell.label}: ${cell.value}`}>
          <AppText variant="title2" align="center" numberOfLines={1}>
            {cell.value}
          </AppText>
          <AppText variant="callout" tone="secondary" align="center" numberOfLines={1}>
            {cell.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 14, rowGap: 16 },
  cell: { width: '50%', alignItems: 'center', gap: 2, paddingHorizontal: 8 },
});
