import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

export type StatCardProps = {
  title?: string;
  /** Center the title (Top Genres) instead of left-aligning it with a trailing control. */
  centeredTitle?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
};

/** Rounded stats card (#1a1a1a on black) with an optional title row. */
export function StatCard({ title, centeredTitle, trailing, children }: StatCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
      {title ? (
        <View style={[styles.titleRow, centeredTitle && styles.centered]}>
          <AppText variant="title3" weight="600" accessibilityRole="header" numberOfLines={1} style={styles.title} align={centeredTitle ? 'center' : undefined}>
            {title}
          </AppText>
          {trailing}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Gray section label outside the cards ("Activity History", "Summary"). */
export function StatSectionTitle({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <AppText variant="headline" weight="500" tone="muted" accessibilityRole="header">
        {title}
      </AppText>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  centered: { justifyContent: 'center' },
  title: { flexShrink: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 },
});
