import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

export type InfoRow = { label: string; value: string | null | undefined };

/** Media-detail style info card: gray labels on the left, bold white values on the right. */
export function InfoCard({ rows }: { rows: InfoRow[] }) {
  const theme = useTheme();
  const visible = rows.filter((r): r is { label: string; value: string } => !!r.value);
  if (visible.length === 0) return null;
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
      {visible.map((row, i) => (
        <Fragment key={row.label}>
          {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} /> : null}
          <View style={styles.row}>
            <AppText variant="label" tone="secondary">
              {row.label}
            </AppText>
            <AppText variant="value" align="right" style={styles.value} selectable>
              {row.value}
            </AppText>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  value: { flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth },
});
