import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export type RankedItem = {
  key: string;
  label: string;
  /** Label colour override (e.g. red for spoiler tags once revealed). */
  labelColor?: string;
  value: number;
  detail?: string;
  onPress?: () => void;
};

export type RankedListProps = {
  items: RankedItem[];
  formatValue: (value: number) => string;
  /** Rows shown before "Show All" (default 8). */
  initialCount?: number;
};

/** Genres / tags ranking: rank, name, metric value, a thin proportional bar and a detail line. */
export function RankedList({ items, formatValue, initialCount = 8 }: RankedListProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(1, ...items.map((i) => i.value));
  const visible = expanded ? items : items.slice(0, initialCount);
  return (
    <View style={styles.container}>
      {visible.map((item, index) => {
        const body = (
          <View style={styles.row}>
            <View style={styles.line}>
              <AppText variant="footnote" tone="tertiary" style={styles.rank}>
                {index + 1}
              </AppText>
              <AppText variant="subheadline" weight="700" numberOfLines={1} color={item.labelColor} style={styles.flex}>
                {item.label}
              </AppText>
              <AppText variant="subheadline" weight="700">
                {formatValue(item.value)}
              </AppText>
            </View>
            <View style={[styles.track, { backgroundColor: c.fillSecondary }]}>
              <View style={[styles.fill, { width: `${(item.value / max) * 100}%`, backgroundColor: c.accent }]} />
            </View>
            {item.detail ? (
              <AppText variant="caption1" tone="tertiary" style={styles.indent} numberOfLines={1}>
                {item.detail}
              </AppText>
            ) : null}
          </View>
        );
        return item.onPress ? (
          <Pressable key={item.key} onPress={item.onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            {body}
          </Pressable>
        ) : (
          <View key={item.key}>{body}</View>
        );
      })}
      {items.length > initialCount ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            setExpanded((v) => !v);
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.more}>
          <AppText variant="subheadline" weight="700" tone="accent">
            {expanded ? 'Show Less' : `Show All (${items.length})`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { gap: 5 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: { width: 20 },
  flex: { flex: 1 },
  track: { height: 4, borderRadius: 2, marginLeft: 28, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  indent: { marginLeft: 28 },
  more: { alignSelf: 'center', paddingTop: 2 },
});
