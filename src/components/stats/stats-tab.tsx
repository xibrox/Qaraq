import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useUserStatistics } from '@/api/queries/hooks';
import type { MediaType } from '@/api/types';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { MediaTypeSwitch } from '@/components/segmented-switch';
import { Skeleton } from '@/components/skeleton';
import { useSetting } from '@/settings';

import { ActivityHeatmap } from './activity-heatmap';
import { StatsBody } from './stats-body';
import { StatSectionTitle } from './stat-card';

/**
 * Profile "Stats" tab: Activity History heatmap, then an "Anime | Manga" switch over the
 * Summary, Top Genres donut and every AniList statistics breakdown (scores, lengths, formats,
 * statuses, countries, release / watch years, genres, tags, voice actors, staff, studios), each
 * with a Count / Mean Score / Time menu. Plain views: the profile screen owns the scroll view.
 */
export function StatsTab({ userId }: { userId: number }) {
  const defaultType = useSetting('defaultMediaType');
  const [type, setType] = useState<MediaType>(defaultType);
  const query = useUserStatistics(userId, type, 50);
  const user = query.data?.User;
  const stats = type === 'ANIME' ? user?.statistics?.anime : user?.statistics?.manga;

  let body;
  if (query.isPending) {
    body = (
      <View style={styles.skeletons}>
        <Skeleton height={190} radius={12} />
        <Skeleton height={170} radius={12} />
      </View>
    );
  } else if (query.error && !stats) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} fill={false} style={styles.state} />;
  } else if (!stats || stats.count === 0) {
    body = (
      <EmptyState
        icon={icons.list}
        title={type === 'ANIME' ? 'No anime stats yet' : 'No manga stats yet'}
        message="Stats appear once there are entries on the list."
        fill={false}
        style={styles.state}
      />
    );
  } else {
    body = <StatsBody stats={stats} type={type} scoreFormat={user?.mediaListOptions?.scoreFormat} />;
  }

  return (
    <View style={styles.container}>
      <StatSectionTitle title="Activity History" />
      <ActivityHeatmap userId={userId} />
      <StatSectionTitle
        title="Summary"
        trailing={<MediaTypeSwitch value={type} onChange={setType} size="md" />}
      />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12 },
  skeletons: { gap: 12 },
  state: { paddingVertical: 40 },
});
