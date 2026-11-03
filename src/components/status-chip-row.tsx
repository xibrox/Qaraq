import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';

import { Chip } from './chip';
import { type IconName } from './icon';
import { IconButton } from './icon-button';

export type ChipItem<K extends string = string> = {
  key: K;
  label: string;
};

export type StatusChipRowProps<K extends string> = {
  items: readonly ChipItem<K>[];
  selectedKey: K | null;
  onSelect: (key: K) => void;
  /** Long-press on a chip (e.g. custom list options). */
  onLongPress?: (key: K) => void;
  /** Circular icon button after the last chip (AniClient's ⇄, which opens the reorder sheet). */
  trailingAction?: { icon: IconName; accessibilityLabel: string; onPress: () => void };
  contentInset?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Horizontally scrolling status chips ("Watching", "Rewatching", "Completed", "Paused",
 * "Planning", "Dropped", then custom lists). The selected chip is kept in view.
 */
export function StatusChipRow<K extends string>({
  items,
  selectedKey,
  onSelect,
  onLongPress,
  trailingAction,
  contentInset = 12,
  style,
}: StatusChipRowProps<K>) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const layouts = useRef(new Map<string, { x: number; width: number }>());
  const viewportWidth = useRef(0);

  const scrollToSelected = (animated: boolean) => {
    if (selectedKey == null) return;
    const l = layouts.current.get(selectedKey);
    if (!l || viewportWidth.current === 0) return;
    const x = Math.max(0, l.x + l.width / 2 - viewportWidth.current / 2);
    scrollRef.current?.scrollTo({ x, animated });
  };

  useEffect(() => {
    scrollToSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-center only when the selection changes
  }, [selectedKey]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => {
        viewportWidth.current = e.nativeEvent.layout.width;
      }}
      contentContainerStyle={[styles.content, { paddingHorizontal: contentInset }]}
      style={style}>
      {items.map((item) => (
        <View
          key={item.key}
          onLayout={(e: LayoutChangeEvent) => {
            const { x, width } = e.nativeEvent.layout;
            layouts.current.set(item.key, { x, width });
            if (item.key === selectedKey) scrollToSelected(false);
          }}>
          <Chip
            label={item.label}
            selected={item.key === selectedKey}
            onPress={() => {
              if (item.key !== selectedKey) haptics.selection();
              onSelect(item.key);
            }}
            onLongPress={onLongPress ? () => onLongPress(item.key) : undefined}
          />
        </View>
      ))}
      {trailingAction ? (
        <IconButton
          icon={trailingAction.icon}
          variant="glass"
          size={36}
          iconSize={16}
          accessibilityLabel={trailingAction.accessibilityLabel}
          onPress={trailingAction.onPress}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, alignItems: 'center' },
});
