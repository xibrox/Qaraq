import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { NOTIFICATION_GROUPS } from '@/api/notifications';
import { flattenPages, queryKeys, useNotifications, useUnreadNotificationCount } from '@/api/queries/hooks';
import type { AniListNotification, NotificationsQuery } from '@/api/types';
import { useAuthStatus } from '@/auth';
import { menuIcons } from '@/components/activity/menu-icons';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useAndroidHeaderInset } from '@/components/people/use-content-inset';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { profileIcons } from '../profile-icons';
import {
  NOTIFICATION_FILTER_LABELS,
  NOTIFICATION_FILTERS,
  notificationContent,
  type NotificationFilter,
  type NotificationTarget,
} from './notification-content';
import { NotificationRow } from './notification-row';

const isIOS = process.env.EXPO_OS === 'ios';

/**
 * "Notifications": every AniList notification type with its verbatim wording, newest first,
 * infinite scroll and pull to refresh. Loading the first page resets the unread count
 * (`resetNotificationCount: true`); the rows that were unread keep an accent dot until reload.
 */
export function NotificationsScreen() {
  const status = useAuthStatus();
  const router = useRouter();
  if (status === 'loading') return <LoadingState />;
  if (status !== 'signedIn') {
    return (
      <EmptyState
        icon={profileIcons.bell}
        title="Sign in to see notifications"
        message="Airing episodes, likes, replies and new followers from AniList show up here."
        actionLabel="Sign In"
        onAction={() => router.push(hrefs.signIn())}
      />
    );
  }
  return <NotificationsList />;
}

function NotificationsList() {
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const preferredTitle = useSetting('preferredTitle');
  const topInset = useAndroidHeaderInset();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const unreadCount = useUnreadNotificationCount();
  // Snapshot the unread count before the first page marks everything read.
  const [unreadAtOpen, setUnreadAtOpen] = useState<number | null>(() => unreadCount.data ?? null);
  if (unreadAtOpen == null && unreadCount.data != null) setUnreadAtOpen(unreadCount.data);

  const query = useNotifications({ type_in: NOTIFICATION_GROUPS[filter], resetNotificationCount: true, perPage: 30 });
  const items = flattenPages<NotificationsQuery, AniListNotification>(query.data, (p) => p.Page.notifications);

  const open = (target: NotificationTarget) => {
    if (target.kind === 'route') router.push(target.href);
    else if (target.kind === 'web') void WebBrowser.openBrowserAsync(target.url);
  };

  const refresh = () => {
    setUnreadAtOpen(0);
    void query.refetch();
    void qc.invalidateQueries({ queryKey: queryKeys.viewer.unreadCount() });
  };

  const filterMenu = (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu
        icon={isIOS ? 'line.3.horizontal.decrease' : menuIcons.filter.android}
        title="Notification Type"
        tintColor={filter === 'all' ? theme.colors.text : theme.colors.accent}
        accessibilityLabel="Filter notifications">
        {NOTIFICATION_FILTERS.map((f) => (
          <Stack.Toolbar.MenuAction
            key={f}
            isOn={filter === f}
            onPress={() => {
              haptics.selection();
              setFilter(f);
            }}>
            {NOTIFICATION_FILTER_LABELS[f]}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );

  let body;
  if (query.isPending) {
    body = <LoadingState />;
  } else if (query.isError && items.length === 0) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else {
    // Unread rows only make sense on the unfiltered list (the count covers every type).
    const unread = filter === 'all' ? (unreadAtOpen ?? 0) : 0;
    body = (
      <FlatList
        data={items}
        keyExtractor={(n) => `${n.__typename}-${n.id}`}
        renderItem={({ item, index }) => {
          const content = notificationContent(item, preferredTitle);
          const userId = content.userId;
          return (
            <NotificationRow
              content={content}
              createdAt={item.createdAt}
              unread={index < unread}
              recyclingKey={`notification-${item.id}`}
              onPress={content.target.kind === 'none' ? undefined : () => open(content.target)}
              onThumbPress={userId != null ? () => router.push(hrefs.user(userId)) : undefined}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={profileIcons.bell}
            title="No notifications"
            message={filter === 'all' ? "You're all caught up." : `No ${NOTIFICATION_FILTER_LABELS[filter].toLowerCase()} notifications.`}
          />
        }
        ListFooterComponent={query.isFetchingNextPage ? <LoadingState fill={false} label="" style={styles.footer} /> : undefined}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={refresh}
            tintColor={theme.colors.textSecondary}
            progressViewOffset={topInset}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: topInset + 6 }, items.length === 0 && styles.grow]}
      />
    );
  }

  return (
    <>
      {filterMenu}
      {body}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  grow: { flexGrow: 1 },
  footer: { paddingVertical: 16 },
});
