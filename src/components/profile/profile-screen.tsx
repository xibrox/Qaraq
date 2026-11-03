import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState, type ReactElement } from 'react';
import { Alert, Platform, RefreshControl, Share, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { queryKeys, useToggleFollow, useUnreadNotificationCount, useUserProfile } from '@/api/queries/hooks';
import { useUserFollowCounts } from '@/api/queries/profile';
import type { Activity, UserProfile } from '@/api/types';
import { useAuthStatus, useViewerId } from '@/auth';
import { ActivityCard } from '@/components/activity/activity-card';
import { copyLink } from '@/components/activity/activity-menu';
import { ActivitySheetsProvider, useActivitySheets } from '@/components/activity/activity-sheets';
import { EmptyState } from '@/components/empty-state';
import { describeError, ErrorState } from '@/components/error-state';
import { Fab } from '@/components/fab';
import { FavoritesTab } from '@/components/favourites/favorites-tab';
import { LoadingState } from '@/components/loading-state';
import { CoverViewer } from '@/components/media/cover-viewer';
import { useAndroidHeaderInset } from '@/components/people/use-content-inset';
import { ListSkeleton } from '@/components/skeleton';
import { StatsTab } from '@/components/stats/stats-tab';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { useToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useSetting, type ActivityFeed, type ActivityFilter } from '@/settings';
import { useTheme } from '@/theme';

import { AboutSheet } from './about-sheet';
import { ActivityFeedToolbar } from './activity-feed-toolbar';
import { ProfileHeader } from './profile-header';
import { profileIcons } from './profile-icons';
import { PROFILE_TAB_BAR_HEIGHT, ProfileTabBar, type ProfileTab } from './profile-tab-bar';
import { InboxToolbar, UserToolbar } from './profile-toolbar';
import { useProfileFeed } from './use-profile-feed';

export type ProfileScreenProps = {
  /** Profile to show; omitted for the viewer's own Profile tab. */
  userId?: number;
  /** The Profile tab root: shows the envelope (Notifications) instead of the user menu. */
  isTabRoot?: boolean;
};

/**
 * Profile (own and other users): username title, banner with "i", ringed avatar, Followers /
 * Following, a sticky "Activity | Favorite | Stats" row, the activity feed with its feed-type and
 * filter menus, and the pencil FAB to post a status. Signed-out viewers get a sign-in prompt.
 */
export function ProfileScreen({ userId: routeUserId, isTabRoot = false }: ProfileScreenProps) {
  const status = useAuthStatus();
  const viewerId = useViewerId();
  const router = useRouter();

  if (routeUserId == null) {
    if (status === 'loading') return <LoadingState />;
    if (status !== 'signedIn') {
      return (
        <EmptyState
          icon={profileIcons.signIn}
          title="Sign in to AniList"
          message="See your activity, favorites and stats, follow people and get notifications."
          actionLabel="Sign In"
          onAction={() => router.push(hrefs.signIn())}
        />
      );
    }
    if (viewerId == null) return <LoadingState />;
  }
  const userId = routeUserId ?? viewerId!;
  return (
    <ActivitySheetsProvider>
      <ProfileContent key={userId} userId={userId} isOwn={userId === viewerId} isTabRoot={isTabRoot} />
    </ActivitySheetsProvider>
  );
}

const IOS_NAV_BAR_HEIGHT = 44;

/** List rows: the hero, the sticky tab row, the feed toolbar, then the selected tab's content. */
type Row =
  | { kind: 'hero' }
  | { kind: 'tabs' }
  | { kind: 'toolbar' }
  | { kind: 'empty' }
  | { kind: 'activity'; activity: Activity }
  | { kind: 'favorite' }
  | { kind: 'stats' };



function ProfileContent({ userId, isOwn, isTabRoot }: { userId: number; isOwn: boolean; isTabRoot: boolean }) {
  const profile = useUserProfile({ id: userId, asHtml: true });
  const user = profile.data?.User;

  if (profile.isPending) return <LoadingState />;
  if (profile.isError && !user) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  if (!user) return <EmptyState title="User not found" message="This profile may be private or deleted." />;
  return <ProfileBody user={user} isOwn={isOwn} isTabRoot={isTabRoot} onRefetchProfile={() => profile.refetch()} />;
}

function ProfileBody({
  user,
  isOwn,
  isTabRoot,
  onRefetchProfile,
}: {
  user: UserProfile;
  isOwn: boolean;
  isTabRoot: boolean;
  onRefetchProfile: () => Promise<unknown>;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const qc = useQueryClient();
  const viewerId = useViewerId();
  const sheets = useActivitySheets();
  const appearance = useToolbarAppearance();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const androidInset = useAndroidHeaderInset();

  const defaultFeed = useSetting('defaultActivityFeed');
  const defaultFilter = useSetting('defaultActivityFilter');
  const showOwnInFollowing = useSetting('displayMyActivityInFollowing');

  const [tab, setTab] = useState<ProfileTab>('activity');
  const [feed, setFeed] = useState<ActivityFeed>(isOwn ? defaultFeed : 'mine');
  const [filter, setFilter] = useState<ActivityFilter>(defaultFilter);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Banner or avatar shown full screen (pinch to zoom), like a poster on the media page.
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const counts = useUserFollowCounts(user.id);
  const unread = useUnreadNotificationCount({ enabled: isTabRoot && isOwn });
  const follow = useToggleFollow();
  const activityFeed = useProfileFeed({
    userId: user.id,
    viewerId,
    feed,
    filter,
    showOwnInFollowing,
    enabled: tab === 'activity',
  });

  // Scroll geometry.
  const transparentHeader = appearance !== 'solid';
  // iOS: the bar is the status bar plus 44pt. `useHeaderHeight` reports more here (it measured
  // ~150pt too tall), which pinned the tab row far below the bar.
  const barHeight = Platform.OS === 'ios' ? insets.top + IOS_NAV_BAR_HEIGHT : headerHeight;
  // Where the tab row stops: just under a transparent bar, or the top of the screen below a solid one.
  const overlayTop = transparentHeader ? barHeight : 0;
  const listRef = useAnimatedRef<Animated.FlatList<Row>>();
  const scrollY = useSharedValue(Platform.OS === 'ios' && transparentHeader ? -barHeight : 0);
  const tabYRef = useRef(Number.MAX_SAFE_INTEGER);
  const heroHeight = useSharedValue(Number.NaN);

  // The one tab row is drawn above the list, so the bar's soft scroll edge doesn't blur it, and
  // moves on the UI thread: a content point p is at p - contentOffset in the list, which fills
  // the screen. It rides on the hero's bottom edge and stops under the bar. (A native sticky row
  // pins to the list's top edge, behind a transparent bar.)
  const tabRowStyle = useAnimatedStyle(() => {
    const top = heroHeight.get();
    if (Number.isNaN(top)) return { opacity: 0 };
    return { opacity: 1, transform: [{ translateY: Math.max(overlayTop, top - scrollY.get()) }] };
  });

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  // The tab row starts where the hero ends.
  const onHeroLayout = (e: LayoutChangeEvent) => {
    tabYRef.current = e.nativeEvent.layout.height + androidInset;
    heroHeight.set(e.nativeEvent.layout.height + androidInset);
  };

  const changeTab = (next: ProfileTab) => {
    // Keep the tab row pinned when switching from a scrolled position.
    const pinnedOffset = tabYRef.current - overlayTop;
    if (scrollY.get() > pinnedOffset) listRef.current?.scrollToOffset({ offset: pinnedOffset, animated: false });
    setTab(next);
  };

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        onRefetchProfile(),
        counts.refetch(),
        tab === 'activity' ? activityFeed.refetch() : qc.invalidateQueries({ queryKey: queryKeys.user.byId(user.id) }),
        isTabRoot && isOwn ? unread.refetch() : undefined,
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFollow = () => {
    if (!viewerId) {
      router.push(hrefs.signIn());
      return;
    }
    const wasFollowing = !!user.isFollowing;
    const run = () => {
      haptics.impact();
      follow.mutate(
        { userId: user.id },
        {
          onSuccess: () => toast(wasFollowing ? `Unfollowed ${user.name}` : `Following ${user.name}`),
          onError: (e) => toast.error(describeError(e).message),
        },
      );
    };
    if (wasFollowing) {
      Alert.alert(`Unfollow ${user.name}?`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unfollow', style: 'destructive', onPress: run },
      ]);
    } else run();
  };

  const message = () => {
    if (!viewerId) {
      router.push(hrefs.signIn());
      return;
    }
    sheets.compose({ kind: 'message', recipient: { id: user.id, name: user.name } });
  };

  const siteUrl = user.siteUrl ?? `https://anilist.co/user/${encodeURIComponent(user.name)}`;
  const joined = user.createdAt
    ? `Joined ${new Date(user.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : undefined;

  const content: Row[] =
    tab === 'activity'
      ? activityFeed.activities.length > 0
        ? activityFeed.activities.map((a) => ({ kind: 'activity', activity: a }))
        : [{ kind: 'empty' }]
      : [{ kind: tab }];
  const rows: Row[] = [{ kind: 'hero' }, { kind: 'tabs' }, ...(tab === 'activity' ? [{ kind: 'toolbar' } as const] : []), ...content];

  const tabBar = <ProfileTabBar value={tab} onChange={changeTab} />;

  const hero = (
      <ProfileHeader
        user={user}
        followers={counts.data?.followers}
        following={counts.data?.following}
        onFollowersPress={() => router.push(hrefs.follows(user.id, 'followers'))}
        onFollowingPress={() => router.push(hrefs.follows(user.id, 'following'))}
        onInfoPress={() => setAboutOpen(true)}
        onBannerPress={user.bannerImage ? () => setViewerUri(user.bannerImage) : undefined}
        onAvatarPress={() => setViewerUri(user.avatar?.large ?? user.avatar?.medium ?? null)}
        social={
          isOwn || !viewerId
            ? undefined
            : {
                isFollowing: !!user.isFollowing,
                isFollower: !!user.isFollower,
                pending: follow.isPending,
                onToggleFollow: toggleFollow,
                onMessage: message,
              }
        }
      />
  );
  const feedToolbar = (
    <ActivityFeedToolbar feed={feed} onFeedChange={setFeed} filter={filter} onFilterChange={setFilter} showFeedMenu={isOwn} />
  );

  let emptyActivity: ReactElement | undefined;
  if (tab === 'activity') {
    if (activityFeed.isPending) emptyActivity = <ListSkeleton rows={4} />;
    else if (activityFeed.isError) {
      emptyActivity = <ErrorState error={activityFeed.error} onRetry={() => void activityFeed.refetch()} fill={false} style={styles.state} />;
    } else {
      emptyActivity = (
        <EmptyState
          title="No activity yet"
          message={feed === 'following' ? 'Follow people to see their activity here.' : undefined}
          fill={false}
          style={styles.state}
        />
      );
    }
  }

  return (
    <View style={styles.flex}>
      <Stack.Title>{user.name}</Stack.Title>
      {isTabRoot && isOwn ? (
        <InboxToolbar unread={unread.data ?? 0} onPress={() => router.push(hrefs.notifications())} />
      ) : !isOwn ? (
        <UserToolbar
          isFollowing={!!user.isFollowing}
          canSocial={!!viewerId}
          onToggleFollow={toggleFollow}
          onMessage={message}
          onOpenWeb={() => void WebBrowser.openBrowserAsync(siteUrl)}
          onShare={() => void Share.share(Platform.OS === 'ios' ? { url: siteUrl, title: user.name } : { message: `${user.name}\n${siteUrl}` })}
          onCopyLink={() => void copyLink(siteUrl)}
        />
      ) : null}

      <Animated.FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(r) => (r.kind === 'activity' ? `a-${r.activity.id}` : r.kind)}
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'hero':
              return <View onLayout={onHeroLayout}>{hero}</View>;
            case 'tabs':
              // Keeps the tab row's space; the row itself is drawn above the list (`tabRowStyle`).
              return <View style={styles.tabSpace} />;
            case 'toolbar':
              return feedToolbar;
            case 'empty':
              return emptyActivity ?? null;
            case 'favorite':
              return <FavoritesTab userId={user.id} />;
            case 'stats':
              return <StatsTab userId={user.id} />;
            default:
              return <ActivityCard activity={item.activity} showAuthor={feed !== 'mine'} />;
          }
        }}
        ListFooterComponent={
          tab === 'activity' && activityFeed.isFetchingNextPage ? <LoadingState fill={false} label="" style={styles.footer} /> : undefined
        }
        onEndReached={() => {
          if (tab === 'activity' && activityFeed.hasNextPage && !activityFeed.isFetchingNextPage) void activityFeed.fetchNextPage();
        }}
        onEndReachedThreshold={0.8}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={c.textSecondary}
            progressViewOffset={androidInset}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: androidInset }]}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[styles.tabRow, tabRowStyle]} pointerEvents="box-none">
        {tabBar}
      </Animated.View>

      {isOwn ? <Fab onPress={() => sheets.compose({ kind: 'status' })} accessibilityLabel="Post a status" aboveTabBar /> : null}

      <CoverViewer visible={viewerUri != null} uri={viewerUri} onClose={() => setViewerUri(null)} />

      <AboutSheet isPresented={aboutOpen} onDismiss={() => setAboutOpen(false)} name={user.name} aboutHtml={user.about} joined={joined} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 96 },
  tabRow: { position: 'absolute', top: 0, left: 0, right: 0 },
  tabSpace: { height: PROFILE_TAB_BAR_HEIGHT },
  state: { paddingVertical: 48 },
  footer: { paddingVertical: 16 },
});
