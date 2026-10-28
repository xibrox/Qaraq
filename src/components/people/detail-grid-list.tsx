import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { revealViewTop, ScrollRevealProvider, type RevealTop } from '@/components/scroll-reveal';
import { MediaCardSkeleton } from '@/components/skeleton';
import { useToastVisible } from '@/components/toast';
import { useScrollUnderHeaderOptions } from '@/navigation/toolbar-appearance';
import { useTheme } from '@/theme';

import { useAndroidHeaderInset } from './use-content-inset';

export const GRID_COLUMNS = 3;
export const GRID_GAP = 10;
export const GRID_INSET = 16;

/** Width of one card in the 3-column detail grid. */
export function useGridCardWidth(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - GRID_INSET * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
}

export type DetailGridListProps<T> = {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, width: number) => ReactElement;
  /** Everything above the grid (hero, info, description, section toolbar). */
  header: ReactElement;
  /** Nav bar title shown once the hero has scrolled away. */
  title: string;
  /** First page of the grid is loading (shows skeleton cards). */
  loading?: boolean;
  loadingMore?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => Promise<unknown> | void;
  emptyText?: string;
};

/**
 * Scroll container for Character / Staff / Studio: hero header + a 3-column poster grid with
 * infinite scroll. The nav title fades in after the hero (AniClient's media-detail behaviour).
 */
export function DetailGridList<T>({
  data,
  keyExtractor,
  renderItem,
  header,
  title,
  loading,
  loadingMore,
  onEndReached,
  onRefresh,
  emptyText = 'Nothing here yet',
}: DetailGridListProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headerInset = useAndroidHeaderInset();
  const cardWidth = useGridCardWidth();
  const [showTitle, setShowTitle] = useState(false);
  const toastVisible = useToastVisible();
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<T>>(null);
  const offset = useRef(0);
  const headerHeight = useHeaderHeight();
  const headerOptions = useScrollUnderHeaderOptions();
  const revealTop: RevealTop = (view) =>
    revealViewTop(
      view,
      headerHeight,
      () => offset.current,
      (y) => listRef.current?.scrollToOffset({ offset: y, animated: true }),
    );

  const refresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  return (
    <ScrollRevealProvider value={revealTop}>
      <Stack.Screen options={{ title: showTitle && !toastVisible ? title : '', ...headerOptions }} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        numColumns={GRID_COLUMNS}
        renderItem={({ item }) => renderItem(item, cardWidth)}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              {Array.from({ length: 6 }, (_, i) => (
                <MediaCardSkeleton key={i} width={cardWidth} />
              ))}
            </View>
          ) : (
            <AppText variant="subheadline" tone="secondary" align="center" style={styles.empty}>
              {emptyText}
            </AppText>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footer} color={theme.colors.textSecondary} /> : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          // The offset starts negative under a transparent bar, so this is ~hero height either way.
          const next = e.nativeEvent.contentOffset.y > 120;
          if (next !== showTitle) setShowTitle(next);
        }}
        scrollEventThrottle={64}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerInset + 8, paddingBottom: insets.bottom + 32, backgroundColor: theme.colors.background },
        ]}
        style={{ backgroundColor: theme.colors.background }}
        refreshControl={
          refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.textSecondary} /> : undefined
        }
        initialNumToRender={12}
        windowSize={7}
      />
    </ScrollRevealProvider>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GRID_INSET, gap: 16 },
  column: { gap: GRID_GAP },
  skeletons: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  empty: { paddingVertical: 32 },
  footer: { paddingVertical: 20 },
});
