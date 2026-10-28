import type { ReactElement } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem, type StyleProp, type ViewStyle } from 'react-native';

import { MediaCardSkeleton } from './skeleton';

export type MediaCarouselProps<T> = {
  data: readonly T[] | null | undefined;
  keyExtractor: (item: T, index: number) => string;
  /** Render one card; give it `itemWidth`. */
  renderItem: ListRenderItem<T>;
  /** Card width used for skeletons and snapping (default 120). */
  itemWidth?: number;
  /** Gap between cards (default 10). */
  gap?: number;
  /** Leading/trailing inset (default 16). */
  inset?: number;
  /** Shows skeleton cards while true and data is empty. */
  loading?: boolean;
  /** Number of skeleton cards (default 4). */
  skeletonCount?: number;
  /** Custom skeleton card. */
  renderSkeleton?: () => ReactElement;
  /** Called near the end (paged carousels). */
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Horizontal media row (Explore sections, Related, Characters, Favorites...). */
export function MediaCarousel<T>({
  data,
  keyExtractor,
  renderItem,
  itemWidth = 120,
  gap = 10,
  inset = 16,
  loading,
  skeletonCount = 4,
  renderSkeleton,
  onEndReached,
  style,
  testID,
}: MediaCarouselProps<T>) {
  const contentStyle = { paddingHorizontal: inset, gap };
  if (loading && (!data || data.length === 0)) {
    return (
      <View style={[styles.skeletonRow, contentStyle, style]} accessibilityLabel="Loading">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <View key={i}>{renderSkeleton ? renderSkeleton() : <MediaCardSkeleton width={itemWidth} />}</View>
        ))}
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={data ?? []}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={contentStyle}
      snapToInterval={itemWidth + gap}
      decelerationRate="fast"
      snapToAlignment="start"
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      initialNumToRender={6}
      windowSize={5}
      style={style}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  skeletonRow: { flexDirection: 'row', overflow: 'hidden' },
});
