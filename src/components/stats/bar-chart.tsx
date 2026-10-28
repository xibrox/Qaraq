import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { AppText } from '@/components/app-text';
import { haptics } from '@/lib/haptics';
import { useTheme, withAlpha } from '@/theme';

export type Bar = {
  key: string;
  label: string;
  value: number;
  /** Shown under the chart when the bar is tapped ("2019 · 12 titles · 74.2 mean"). */
  detail?: string;
};

export type BarChartProps = {
  bars: Bar[];
  formatValue: (value: number) => string;
  /** Bar fill (default: accent). */
  color?: string;
  height?: number;
};

/** Narrowest column before the chart scrolls (score charts fit 10-15 buckets). */
const MIN_COLUMN = 14;
/** Widest drawn bar; wider columns centre a bar this wide. */
const MAX_BAR = 44;
/** Rough caption2 glyph width, used to keep x-axis labels readable. */
const LABEL_CHAR = 6.5;
/** Smallest scale x-axis labels shrink to (adjustsFontSizeToFit). */
const LABEL_MIN_SCALE = 0.75;
/** Width given to the tapped bar's value so it can spill over its neighbours. */
const ACTIVE_VALUE_WIDTH = 96;

/** Column layout for a chart `width` wide. Exported for tests. */
export function barLayout(labels: readonly string[], width: number) {
  const n = labels.length;
  const gap = n > 10 ? 4 : 6;
  const fitted = n > 0 ? (width - gap * (n - 1)) / n : 0;
  // Labels may spill into the gap and shrink a little to fit; once the chart has to scroll
  // anyway, columns get their full readable width (a 4-digit year needs ~26pt).
  const longest = Math.max(0, ...labels.map((l) => l.length));
  const readable = Math.max(MIN_COLUMN, Math.min(40, longest * LABEL_CHAR + 2 - gap));
  const squeezed = Math.max(MIN_COLUMN, longest * LABEL_CHAR * LABEL_MIN_SCALE + 2 - gap);
  const scrolls = fitted < squeezed;
  const column = scrolls ? readable : fitted;
  return { gap, column, barWidth: Math.min(MAX_BAR, column), scrolls, labelWidth: column + gap };
}

/**
 * Vertical bar chart drawn with views: rounded data ends on a shared baseline, value labels on
 * top, horizontal scrolling for long series (release years) that starts at the most recent end.
 * Tap a bar for its detail line.
 */
export function BarChart({ bars, formatValue, color, height = 130 }: BarChartProps) {
  const theme = useTheme();
  const fill = color ?? theme.colors.accent;
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrolledToEnd = useRef(false);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const { gap, column, barWidth, scrolls, labelWidth } = barLayout(
    bars.map((b) => b.label),
    width,
  );
  const active = bars.find((b) => b.key === selected);

  const plot = (
    <View style={[styles.plot, { height: height + 36, gap }]}>
      {bars.map((bar) => {
        const isActive = bar.key === selected;
        const h = bar.value > 0 ? Math.max(4, (bar.value / max) * height) : 0;
        // While a bar is selected only its value shows, wide enough not to be cut off.
        const showValue = selected ? isActive : true;
        return (
          <Pressable
            key={bar.key}
            onPress={() => {
              haptics.selection();
              setSelected(isActive ? null : bar.key);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${bar.label}: ${formatValue(bar.value)}`}
            style={[styles.column, { width: column }]}>
            {showValue ? (
              <AppText
                variant="caption2"
                tone={isActive ? 'primary' : 'secondary'}
                weight={isActive ? '700' : undefined}
                numberOfLines={1}
                adjustsFontSizeToFit={!isActive}
                minimumFontScale={0.7}
                align="center"
                style={[styles.value, { width: isActive ? ACTIVE_VALUE_WIDTH : labelWidth }]}>
                {formatValue(bar.value)}
              </AppText>
            ) : null}
            <View
              style={{
                height: h,
                width: barWidth,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: selected && !isActive ? withAlpha(fill, 0.45) : fill,
              }}
            />
            <AppText
              variant="caption2"
              tone={isActive ? 'primary' : 'tertiary'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={LABEL_MIN_SCALE}
              align="center"
              style={[styles.label, { width: labelWidth }]}>
              {bar.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.container}>
      {width === 0 ? null : scrolls ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator
          onContentSizeChange={() => {
            // Recent years are the interesting end: start scrolled to it.
            if (scrolledToEnd.current) return;
            scrolledToEnd.current = true;
            scrollRef.current?.scrollToEnd({ animated: false });
          }}
          contentContainerStyle={styles.scroll}>
          {plot}
        </ScrollView>
      ) : (
        plot
      )}
      {active?.detail ? (
        <AppText variant="caption1" tone="secondary" align="center">
          {active.detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  scroll: { paddingHorizontal: 6, paddingBottom: 6 },
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  value: { marginBottom: 3 },
  label: { marginTop: 5, height: 14 },
});
