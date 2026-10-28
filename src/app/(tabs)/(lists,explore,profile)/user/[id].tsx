import { useLocalSearchParams } from 'expo-router';

import { useUserProfile } from '@/api/queries/hooks';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ProfileScreen } from '@/components/profile/profile-screen';

/**
 * Another user's profile: same layout as the Profile tab, with Follow / Message instead of the envelope.
 * `id` is a numeric user id, or a username (from @mentions and anilist.co/user/<name> links).
 */
export default function UserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  if (Number.isInteger(userId) && userId > 0) return <ProfileScreen userId={userId} />;
  if (!id) return <EmptyState title="User not found" />;
  return <UserByName name={decodeURIComponent(id)} />;
}

function UserByName({ name }: { name: string }) {
  const profile = useUserProfile({ name, asHtml: true });
  const resolved = profile.data?.User?.id;
  if (resolved != null) return <ProfileScreen userId={resolved} />;
  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  return <EmptyState title="User not found" />;
}
