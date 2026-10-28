import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flattenPages, useUserFavourites } from '@/api/queries/hooks';
import { useRemoveFavourite } from '@/api/queries/people';
import type { FavouriteKind, UserFavouritesQuery } from '@/api/types';
import { useViewerId } from '@/auth';
import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { ListSkeleton } from '@/components/skeleton';
import { useAndroidHeaderInset } from '@/components/people/use-content-inset';
import { haptics } from '@/lib/haptics';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { toFavouriteItems, type FavouriteItem, type FavouriteNode } from './favourite-items';
import { FAVOURITE_LIST_TITLES } from './labels';

// Spec §6 "Favorite tab": small near-square covers, dense rows.
const COVER_WIDTH = 64;
const COVER_HEIGHT = 75;

function FavouriteRow({ item, onLongPress }: { item: FavouriteItem; onLongPress?: () => void }) {
  const theme = useTheme();
  const hasImage = item.imageUrl !== undefined;
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={onLongPress ? 'Long press to remove from favorites' : undefined}
      android_ripple={{ color: theme.colors.fillSecondary }}
      style={({ pressed }) => [
        styles.row,
        !hasImage && styles.textRow,
        { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
      ]}>
      {hasImage ? (
        <CoverImage
          uri={item.imageUrl}
          width={COVER_WIDTH}
          height={COVER_HEIGHT}
          radius={theme.radii.xs}
          isAdult={item.isAdult}
          recyclingKey={String(item.id)}
        />
      ) : null}
      <View style={styles.texts}>
        <AppText variant="callout" weight="600" numberOfLines={2}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** "Favorite Animes" / "Favorite Characters" …: a plain vertical list, no separators. */
export function FavouritesListScreen({ userId, kind }: { userId: number; kind: FavouriteKind }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headerInset = useAndroidHeaderInset();
  const preferredTitle = useSetting('preferredTitle');
  const viewerId = useViewerId();
  const [refreshing, setRefreshing] = useState(false);
  const query = useUserFavourites(Number.isFinite(userId) ? userId : null, kind, 25);
  const remove = useRemoveFavourite(userId, kind);
  const isOwn = viewerId != null && viewerId === userId;

  const items = toFavouriteItems(
    kind,
    flattenPages<UserFavouritesQuery, FavouriteNode>(query.data, (p) => p.User?.favourites?.[kind]?.nodes),
    preferredTitle,
  );

  const confirmRemove = (item: FavouriteItem) => {
    haptics.heavy();
    Alert.alert(item.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove from Favorites', style: 'destructive', onPress: () => remove.mutate(item.id) },
    ]);
  };

  const title = <Stack.Screen options={{ title: FAVOURITE_LIST_TITLES[kind] }} />;
  if (query.error && items.length === 0) {
    return (
      <>
        {title}
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </>
    );
  }

  return (
    <>
      {title}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <FavouriteRow item={item} onLongPress={isOwn ? () => confirmRemove(item) : undefined} />}
        ListEmptyComponent={
          query.isPending ? (
            <ListSkeleton rows={6} />
          ) : (
            <EmptyState icon={icons.heart} title="No favorites yet" fill={false} style={styles.empty} />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={theme.colors.textSecondary} /> : undefined
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
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
                await query.refetch();
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 4 },
  textRow: { paddingHorizontal: 16, paddingVertical: 12 },
  texts: { flex: 1, gap: 2 },
  empty: { paddingTop: 80 },
  footer: { paddingVertical: 20 },
});
