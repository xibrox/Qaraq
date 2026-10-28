import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { useUserActivityHistory } from '@/api/queries/hooks';
import { AppText } from '@/components/app-text';
import { Skeleton } from '@/components/skeleton';
import { haptics } from '@/lib/haptics';
import { mix, useTheme } from '@/theme';

import { buildHeatmap, formatHeatDay, type HeatCell } from './stats-data';

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LABEL_WIDTH = 30;
const MONTH_HEIGHT = 16;
const WEEKDAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

/**
 * "Activity History": GitHub-style heatmap of daily AniList activity with month and weekday
 * labels and a "Less ▢▢▢▢▢ More" legend. Tap a day to see its count. Cells are shades of the
 * accent colour (gray-scale with the default white accent, as in AniClient).
 */
export function ActivityHeatmap({ userId }: { userId: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const history = useUserActivityHistory(userId);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<HeatCell | null>(null);

  const weeks = Math.max(8, Math.floor((width - LABEL_WIDTH + GAP) / STEP));
  const grid = buildHeatmap(history.data ?? [], weeks);
  const empty = mix(c.surface, c.text, 0.07);
  const shades = [empty, mix(empty, c.accentBase, 0.3), mix(empty, c.accentBase, 0.5), mix(empty, c.accentBase, 0.72), c.accentBase];
  const svgWidth = LABEL_WIDTH + weeks * STEP - GAP;
  const svgHeight = MONTH_HEIGHT + 7 * STEP - GAP;
  const total = (history.data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const onPressGrid = (x: number, y: number) => {
    const col = Math.floor((x - LABEL_WIDTH) / STEP);
    const row = Math.floor((y - MONTH_HEIGHT) / STEP);
    const cell = grid.columns[col]?.[row];
    if (!cell || cell.future) return;
    haptics.selection();
    setSelected((prev) => (prev?.time === cell.time ? null : cell));
  };

  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}
      onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width) - 32)}
      accessible
      accessibilityLabel={`Activity history, ${total} activities in the last ${weeks} weeks`}>
      {width === 0 || history.isPending ? (
        <Skeleton height={svgHeight} radius={6} />
      ) : (
        <Pressable onPress={(e) => onPressGrid(e.nativeEvent.locationX, e.nativeEvent.locationY)} style={styles.center}>
          <Svg width={svgWidth} height={svgHeight}>
            {grid.months.map((m) => (
              <SvgText
                key={`${m.column}-${m.label}`}
                x={LABEL_WIDTH + m.column * STEP}
                y={11}
                fontSize={10}
                fontFamily={theme.fontFamily}
                fill={c.textSecondary}>
                {m.label}
              </SvgText>
            ))}
            {Object.entries(WEEKDAY_LABELS).map(([row, label]) => (
              <SvgText
                key={label}
                x={0}
                y={MONTH_HEIGHT + Number(row) * STEP + CELL - 2}
                fontSize={10}
                fontFamily={theme.fontFamily}
                fill={c.textSecondary}>
                {label}
              </SvgText>
            ))}
            {grid.columns.map((column, w) =>
              column.map((cell, d) =>
                cell.future ? null : (
                  <Rect
                    key={cell.time}
                    x={LABEL_WIDTH + w * STEP}
                    y={MONTH_HEIGHT + d * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={shades[cell.level]}
                    stroke={selected?.time === cell.time ? c.text : undefined}
                    strokeWidth={selected?.time === cell.time ? 1.5 : 0}
                  />
                ),
              ),
            )}
          </Svg>
        </Pressable>
      )}
      <View style={styles.footer}>
        <AppText variant="caption1" tone="secondary" numberOfLines={1} style={styles.flex}>
          {selected
            ? `${selected.amount} ${selected.amount === 1 ? 'activity' : 'activities'} on ${formatHeatDay(selected.time)}`
            : ''}
        </AppText>
        <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AppText variant="caption1" tone="secondary">
            Less
          </AppText>
          {shades.map((shade) => (
            <View key={shade} style={[styles.legendCell, { backgroundColor: shade }]} />
          ))}
          <AppText variant="caption1" tone="secondary">
            More
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  center: { alignSelf: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendCell: { width: CELL, height: CELL, borderRadius: 2 },
});
