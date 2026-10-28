import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';

import { useTheme } from '@/theme';

import { shareLabel } from './stats-data';

export type DistributionItem = { key: string; label: string; value: number; color: string; detail?: string };

export type DistributionProps = {
  items: DistributionItem[];
  formatValue: (value: number) => string;
  /**
   * Additive metrics (count, time) draw a stacked bar with percentages; non-additive ones
   * (mean score) draw one bar per row scaled to the best value.
   */
  additive: boolean;
};

/** Formats / statuses / countries breakdown: stacked bar + labelled legend rows. */
export function Distribution({ items, formatValue, additive }: DistributionProps) {
  const theme = useTheme();
  const c = theme.colors;
  const total = items.reduce((s, i) => s + i.value, 0);
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={styles.container}>
      {additive && total > 0 ? (
        <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {items
            .filter((i) => i.value > 0)
            // Destructure `value` so the Reanimated Babel plugin doesn't mistake `i.value` in an
            // inline style for a shared value (it injects a dev warning per render).
            .map(({ key, value: flex, color }) => (
              <View key={key} style={{ flex, backgroundColor: color }} />
            ))}
        </View>
      ) : null}
      <View style={styles.rows}>
        {items.map((i) => (
          <View
            key={i.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${i.label}, ${formatValue(i.value)}${additive && total ? `, ${shareLabel(i.value / total)}` : ''}`}>
            <View style={styles.labelLine}>
              <View style={[styles.dot, { backgroundColor: i.color }]} />
              <AppText variant="subheadline" numberOfLines={1} style={styles.flex}>
                {i.label}
              </AppText>
              <AppText variant="subheadline" weight="700">
                {formatValue(i.value)}
              </AppText>
              {additive && total ? (
                <AppText variant="footnote" tone="tertiary" style={styles.percent} align="right">
                  {shareLabel(i.value / total)}
                </AppText>
              ) : null}
            </View>
            {!additive ? (
              <View style={[styles.track, { backgroundColor: c.fillSecondary }]}>
                <View style={[styles.fill, { width: `${(i.value / max) * 100}%`, backgroundColor: i.color }]} />
              </View>
            ) : null}
            {i.detail ? (
              <AppText variant="caption1" tone="tertiary" style={styles.detail}>
                {i.detail}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  stack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
  rows: { gap: 10 },
  row: { gap: 4 },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  flex: { flex: 1 },
  percent: { width: 40 },
  track: { height: 4, borderRadius: 2, marginLeft: 18, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  detail: { marginLeft: 18 },
});
