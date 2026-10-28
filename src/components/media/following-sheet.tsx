import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages, useMediaFollowing } from '@/api/queries/hooks';
import type { FollowingListEntry, MediaType } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Icon, icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { formatScore } from '@/lib/format';
import { listStatusLabel } from '@/settings';
import { STATUS_COLORS, useTheme } from '@/theme';

import { unitLabel } from './media-format';
import { SheetModal } from './sheet-modal';

type Props = {
  mediaId: number;
  mediaType: MediaType;
  total: number | null | undefined;
  visible: boolean;
  onClose: () => void;
  onUser: (id: number) => void;
};

function FriendRow({ entry, mediaType, total, onPress }: { entry: FollowingListEntry; mediaType: MediaType; total: number | null | undefined; onPress: () => void }) {
  const theme = useTheme();
  const format = entry.user?.mediaListOptions?.scoreFormat ?? 'POINT_10_DECIMAL';
  const score = formatScore(entry.score, format, { showMax: format !== 'POINT_3' && format !== 'POINT_5' });
  const status = entry.status;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, opacity: pressed ? 0.7 : 1 }]}>
      <Avatar uri={entry.user?.avatar?.medium} name={entry.user?.name} size={40} />
      <View style={styles.texts}>
        <AppText variant="callout" weight="700" numberOfLines={1}>
          {entry.user?.name ?? ''}
        </AppText>
        <View style={styles.statusLine}>
          {status ? <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} /> : null}
          <AppText variant="caption1" tone="secondary" weight="600">
            {[status ? listStatusLabel(status, mediaType) : null, entry.progress ? `${entry.progress}/${total ?? '-'} ${unitLabel(mediaType)}` : null]
              .filter(Boolean)
              .join('  ·  ')}
          </AppText>
        </View>
      </View>
      {score ? (
        <View style={styles.score}>
          <Icon name={icons.star} size={12} color={theme.colors.star} />
          <AppText variant="footnote" weight="800">
            {score}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Friends' statuses for this media (opened from the avatar stack in the hero). */
export function FollowingSheet({ mediaId, mediaType, total, visible, onClose, onUser }: Props) {
  const q = useMediaFollowing(mediaId, { enabled: visible });
  const items = flattenPages(q.data, (p) => p.Page.mediaList);
  return (
    <SheetModal visible={visible} title="Following" onClose={onClose}>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error && !items.length ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.list}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={<EmptyState title="Nobody yet" message="No one you follow has this on their list." />}
          renderItem={({ item }) => (
            <FriendRow entry={item} mediaType={mediaType} total={total} onPress={() => item.user && onUser(item.user.id)} />
          )}
        />
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, gap: 8, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  texts: { flex: 1, gap: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
