import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

import { shareLabel } from './stats-data';

export type DonutSlice = { key: string; label: string; value: number; color: string };

const SIZE = 120;
const STROKE = 16;
const GAP_PX = 3;

/** Donut + legend ("Drama 35%"), as on AniClient's Top Genres card. */
export function DonutChart({ slices }: { slices: DonutSlice[] }) {
  const theme = useTheme();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const lengths = slices.map((slice) => (total > 0 ? (slice.value / total) * circumference : 0));
  const arcs = slices.map((slice, i) => ({
    ...slice,
    dash: Math.max(0, lengths[i] - (slices.length > 1 ? GAP_PX : 0)),
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <View style={styles.row}>
      <Svg width={SIZE} height={SIZE} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={theme.colors.fillSecondary} strokeWidth={STROKE} fill="none" />
          {arcs.map((a) => (
            <Circle
              key={a.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              stroke={a.color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${a.dash} ${circumference}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.legend}>
        {slices.map((s) => (
          <View
            key={s.key}
            style={styles.legendRow}
            accessible
            accessibilityLabel={`${s.label}, ${shareLabel(total ? s.value / total : 0)}`}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <AppText variant="subheadline" tone="secondary" numberOfLines={1} style={styles.flex}>
              {s.label}
            </AppText>
            <AppText variant="subheadline" tone="secondary">
              {shareLabel(total ? s.value / total : 0)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { flex: 1, gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  flex: { flex: 1 },
});
