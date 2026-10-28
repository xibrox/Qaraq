import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaListStatus, MediaStats, MediaType } from '@/api/types';
import { AppText } from '@/components/app-text';
import { SectionHeader } from '@/components/section-header';
import { formatPercent } from '@/lib/format';
import { listStatusLabel } from '@/settings';
import { STATUS_COLORS, useTheme } from '@/theme';

import { formatSpaced } from './media-format';
import { tierColor } from './media-score';

const STATUS_ORDER: MediaListStatus[] = ['CURRENT', 'PLANNING', 'COMPLETED', 'REPEATING', 'PAUSED', 'DROPPED'];
const BAR_AREA = 96;

function StatusDistribution({ stats, type }: { stats: MediaStats; type: MediaType }) {
  const theme = useTheme();
  const rows = STATUS_ORDER.map((status) => ({
    status,
    amount: stats.statusDistribution?.find((d) => d?.status === status)?.amount ?? 0,
  })).filter((r) => r.amount > 0);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  if (!total) return null;
  return (
    <View style={styles.block}>
      <AppText variant="footnote" tone="secondary" weight="700">
        Status Distribution
      </AppText>
      <View style={styles.stack} accessibilityRole="image" accessibilityLabel="Status distribution">
        {rows.map((r) => (
          <View key={r.status} style={{ flex: r.amount, backgroundColor: STATUS_COLORS[r.status], borderRadius: 4 }} />
        ))}
      </View>
      <View style={styles.legend}>
        {rows.map((r) => (
          <View key={r.status} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: STATUS_COLORS[r.status] }]} />
            <AppText variant="caption1" weight="700">
              {listStatusLabel(r.status, type)}
            </AppText>
            <AppText variant="caption1" tone="secondary">
              {`${formatSpaced(r.amount)} · ${formatPercent(r.amount / total)}`}
            </AppText>
          </View>
        ))}
      </View>
      <View style={[styles.rule, { backgroundColor: theme.colors.separator }]} />
    </View>
  );
}

function ScoreDistribution({ stats }: { stats: MediaStats }) {
  const theme = useTheme();
  const c = theme.colors;
  const [selected, setSelected] = useState<number | null>(null);
  const bars = Array.from({ length: 10 }, (_, i) => {
    const score = (i + 1) * 10;
    return { score, amount: stats.scoreDistribution?.find((d) => d?.score === score)?.amount ?? 0 };
  });
  const max = Math.max(...bars.map((b) => b.amount));
  const total = bars.reduce((s, b) => s + b.amount, 0);
  if (!max) return null;
  const active = bars.find((b) => b.score === selected) ?? null;
  return (
    <View style={styles.block}>
      <View style={styles.scoreHeader}>
        <AppText variant="footnote" tone="secondary" weight="700">
          Score Distribution
        </AppText>
        <AppText variant="caption1" tone="secondary">
          {active ? `${active.score}: ${formatSpaced(active.amount)} users (${formatPercent(active.amount / total)})` : `${formatSpaced(total)} users`}
        </AppText>
      </View>
      <View style={styles.bars}>
        {bars.map((b) => (
          <Pressable
            key={b.score}
            onPress={() => setSelected((s) => (s === b.score ? null : b.score))}
            accessibilityRole="button"
            accessibilityLabel={`Score ${b.score}: ${b.amount} users`}
            style={styles.barCell}>
            <View style={[styles.barTrack, { height: BAR_AREA }]}>
              <View
                style={{
                  height: Math.max(2, (b.amount / max) * BAR_AREA),
                  backgroundColor: tierColor(b.score, c),
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  opacity: selected == null || selected === b.score ? 1 : 0.4,
                }}
              />
            </View>
            <AppText variant="caption2" tone="secondary" align="center">
              {String(b.score)}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** "Stats": status split as a stacked bar with legend, score distribution as bars (tap for counts). */
export function StatsSection({ stats, type }: { stats: MediaStats | null | undefined; type: MediaType }) {
  const theme = useTheme();
  if (!stats) return null;
  const hasStatus = (stats.statusDistribution ?? []).some((d) => (d?.amount ?? 0) > 0);
  const hasScore = (stats.scoreDistribution ?? []).some((d) => (d?.amount ?? 0) > 0);
  if (!hasStatus && !hasScore) return null;
  return (
    <View>
      <SectionHeader title="Stats" tone="muted" inset={12} style={styles.header} />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
        {hasStatus ? <StatusDistribution stats={stats} type={type} /> : null}
        {hasScore ? <ScoreDistribution stats={stats} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  card: { marginHorizontal: 12, padding: 12, gap: 14 },
  block: { gap: 10 },
  stack: { flexDirection: 'row', height: 10, gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  rule: { height: StyleSheet.hairlineWidth, marginTop: 4 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bars: { flexDirection: 'row', gap: 4 },
  barCell: { flex: 1, gap: 4 },
  barTrack: { justifyContent: 'flex-end' },
});
