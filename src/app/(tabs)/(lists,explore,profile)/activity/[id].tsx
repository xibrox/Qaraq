import { useLocalSearchParams } from 'expo-router';

import { ActivityDetailScreen } from '@/components/activity/activity-detail-screen';
import { EmptyState } from '@/components/empty-state';

/** "Activity" detail (title set by `sharedStackScreens`). */
export default function ActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = Number(id);
  if (!Number.isInteger(activityId) || activityId <= 0) return <EmptyState title="Activity not found" />;
  return <ActivityDetailScreen id={activityId} />;
}
