import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { flattenPages, useMediaReviews } from '@/api/queries/hooks';
import type { ReviewLite } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { ErrorState } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { MediaCarousel } from '@/components/media-carousel';
import { SectionHeader } from '@/components/section-header';
import { formatTimeAgo } from '@/lib/format';
import { useTheme } from '@/theme';

import { mediaIcons } from './media-icons';
import { SheetModal } from './sheet-modal';

type CardProps = { review: ReviewLite; width?: number; onPress: () => void };

/** Review card: avatar, username, "5 years ago", summary and 👍 count. */
export function ReviewCard({ review, width, onPress }: CardProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Review by ${review.user?.name ?? 'user'}`}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: c.surface, borderRadius: theme.radii.lg, opacity: pressed ? 0.75 : 1 },
      ]}>
      <View style={styles.userRow}>
        <Avatar uri={review.user?.avatar?.medium} name={review.user?.name} size={24} />
        <AppText variant="footnote" weight="700" numberOfLines={1} style={styles.flex}>
          {review.user?.name ?? ''}
        </AppText>
      </View>
      <AppText variant="caption1" tone="secondary">
        {formatTimeAgo(review.createdAt)}
      </AppText>
      <AppText variant="caption1" tone="secondary" numberOfLines={3} style={styles.summary}>
        {review.summary ?? ''}
      </AppText>
      <View style={styles.likes}>
        <Icon name={mediaIcons.thumbsUp} size={12} color={c.textSecondary} />
        <AppText variant="caption1" tone="secondary" weight="700">
          {String(review.rating ?? 0)}
        </AppText>
      </View>
    </Pressable>
  );
}

type SectionProps = {
  nodes: (ReviewLite | null)[] | null | undefined;
  hasMore: boolean;
  onSeeAll: () => void;
  onOpen: (id: number) => void;
};

/** "Reviews" carousel on media detail. */
export function ReviewsSection({ nodes, hasMore, onSeeAll, onOpen }: SectionProps) {
  const { width } = useWindowDimensions();
  const items = (nodes ?? []).filter((r): r is ReviewLite => r != null);
  if (!items.length) return null;
  const cardWidth = Math.round((width - 24) * 0.66);
  return (
    <View>
      <SectionHeader title="Reviews" tone="muted" inset={12} onPress={hasMore ? onSeeAll : undefined} style={styles.header} />
      <MediaCarousel
        data={items}
        keyExtractor={(r) => String(r.id)}
        itemWidth={cardWidth}
        gap={8}
        inset={12}
        renderItem={({ item }) => <ReviewCard review={item} width={cardWidth} onPress={() => onOpen(item.id)} />}
      />
    </View>
  );
}

/** All reviews for a media (paged). */
export function ReviewsSheet({ mediaId, visible, onClose, onOpen }: { mediaId: number; visible: boolean; onClose: () => void; onOpen: (id: number) => void }) {
  const theme = useTheme();
  const q = useMediaReviews({ id: mediaId, perPage: 15 }, { enabled: visible });
  const items = flattenPages(q.data, (p) => p.Media?.reviews?.nodes);
  return (
    <SheetModal visible={visible} title="Reviews" onClose={onClose}>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error && !items.length ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListFooterComponent={
            q.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={theme.colors.textSecondary} /> : undefined
          }
          renderItem={({ item }) => <ReviewCard review={item} onPress={() => onOpen(item.id)} />}
        />
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  card: { padding: 12, gap: 2, minHeight: 130 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  summary: { marginTop: 6 },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 'auto', paddingTop: 6 },
  list: { padding: 12, gap: 8 },
  footer: { marginVertical: 16 },
});
