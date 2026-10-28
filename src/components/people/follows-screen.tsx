import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flattenPages, useFollowers, useFollowing } from '@/api/queries/hooks';
import { useToggleFollowInLists } from '@/api/queries/people';
import type { FollowUser } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { ListSkeleton } from '@/components/skeleton';
import { hrefs, type FollowKind } from '@/navigation/hrefs';
import { useTheme } from '@/theme';

import { useAndroidHeaderInset } from './use-content-inset';

export const FOLLOW_TITLES: Record<FollowKind, string> = { followers: 'Followers', following: 'Following' };

type FollowRowProps = {
  user: FollowUser;
  isViewer: boolean;
  onToggleFollow: (user: FollowUser) => void;
};

function FollowRow({ user, isViewer, onToggleFollow }: FollowRowProps) {
  const theme = useTheme();
  const following = !!user.isFollowing;
  return (
    <Pressable
      onPress={() => router.push(hrefs.user(user.id))}
      accessibilityRole="button"
      accessibilityLabel={user.name}
      android_ripple={{ color: theme.colors.fillSecondary }}
      style={({ pressed }) => [styles.row, { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 }]}>
      <Avatar uri={user.avatar?.large ?? user.avatar?.medium} name={user.name} size={48} />
      <View style={styles.names}>
        <AppText variant="listTitle" numberOfLines={1}>
          {user.name}
        </AppText>
        <View style={styles.tags}>
          {user.isFollower && !isViewer ? <Chip label="Follows you" variant="tag" style={styles.tag} /> : null}
          {user.donatorBadge && (user.donatorTier ?? 0) > 0 ? <Chip label={user.donatorBadge} variant="tag" style={styles.tag} /> : null}
        </View>
      </View>
      {isViewer ? null : (
        <Chip
          label={following ? 'Following' : 'Follow'}
          icon={following ? icons.check : icons.plus}
          selected={!following}
          variant={following ? 'outlined' : 'filled'}
          size="sm"
          onPress={() => onToggleFollow(user)}
          accessibilityLabel={following ? `Unfollow ${user.name}` : `Follow ${user.name}`}
        />
      )}
    </Pressable>
  );
}

/** Followers / Following list with optimistic follow toggles. */
export function FollowsScreen({ userId, kind }: { userId: number; kind: FollowKind }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headerInset = useAndroidHeaderInset();
  const viewerId = useViewerId();
  const signedIn = useIsSignedIn();
  const [refreshing, setRefreshing] = useState(false);
  const enabled = Number.isFinite(userId);
  const followers = useFollowers({ userId }, { enabled: enabled && kind === 'followers' });
  const following = useFollowing({ userId }, { enabled: enabled && kind === 'following' });
  const toggleFollow = useToggleFollowInLists();

  const users =
    kind === 'followers'
      ? flattenPages(followers.data, (p) => p.Page.followers)
      : flattenPages(following.data, (p) => p.Page.following);
  const loading = kind === 'followers' ? followers.isPending : following.isPending;
  const error = kind === 'followers' ? followers.error : following.error;
  const hasNextPage = kind === 'followers' ? followers.hasNextPage : following.hasNextPage;
  const fetchingMore = kind === 'followers' ? followers.isFetchingNextPage : following.isFetchingNextPage;
  const fetchNext = () => (kind === 'followers' ? followers.fetchNextPage() : following.fetchNextPage());
  const refetch = () => (kind === 'followers' ? followers.refetch() : following.refetch());

  const onToggleFollow = (user: FollowUser) => {
    if (!signedIn) {
      router.push(hrefs.signIn());
      return;
    }
    toggleFollow.mutate({ userId: user.id, next: !user.isFollowing });
  };

  const title = <Stack.Screen options={{ title: FOLLOW_TITLES[kind] }} />;
  if (error && users.length === 0) {
    return (
      <>
        {title}
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      {title}
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        renderItem={({ item }) => <FollowRow user={item} isViewer={item.id === viewerId} onToggleFollow={onToggleFollow} />}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton rows={8} />
          ) : (
            <EmptyState
              icon={icons.person}
              title={kind === 'followers' ? 'No followers yet' : 'Not following anyone'}
              fill={false}
              style={styles.empty}
            />
          )
        }
        ListFooterComponent={fetchingMore ? <ActivityIndicator style={styles.footer} color={theme.colors.textSecondary} /> : undefined}
        onEndReached={() => {
          if (hasNextPage && !fetchingMore) fetchNext();
        }}
        onEndReachedThreshold={0.6}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: headerInset + 4, paddingBottom: insets.bottom + 24 }}
        style={{ backgroundColor: theme.colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.colors.textSecondary}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await refetch();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  names: { flex: 1, gap: 4 },
  // Chips stay inside the name column (left of the Follow button): wrap, and truncate a long badge.
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexShrink: 1, maxWidth: '100%' },
  empty: { paddingTop: 80 },
  footer: { paddingVertical: 20 },
});
