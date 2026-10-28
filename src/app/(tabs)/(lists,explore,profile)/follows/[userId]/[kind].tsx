import { useLocalSearchParams } from 'expo-router';

import { FollowsScreen } from '@/components/people/follows-screen';
import { RouteUserGate } from '@/components/people/route-user-gate';
import type { FollowKind } from '@/navigation/hrefs';

export default function FollowsRoute() {
  const { userId, kind } = useLocalSearchParams<{ userId: string; kind: string }>();
  const followKind: FollowKind = kind === 'following' ? 'following' : 'followers';
  return <RouteUserGate param={userId}>{(id) => <FollowsScreen userId={id} kind={followKind} />}</RouteUserGate>;
}
