import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, icons } from './icon';

export type SectionHeaderProps = {
  /** Bold header ("Trending Now", "Characters"). */
  title: string;
  /** Gray subtitle under the title ("Fall - 2026", "Top 100"). */
  subtitle?: string;
  /** Makes the header tappable and shows the "›" chevron (opens the full list). */
  onPress?: () => void;
  /** `primary` (white, Explore/Profile) or `muted` (gray #b0b0b0, media detail). */
  tone?: 'primary' | 'muted';
  /** Trailing node instead of the chevron (e.g. a small segmented switch on Stats). */
  trailing?: ReactNode;
  /** Where the "›" sits: right after the title (`inline`, default) or at the row's trailing edge (`trailing`, Explore). */
  chevron?: 'inline' | 'trailing';
  /** Horizontal padding (default 16). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

/** Section header with optional subtitle and "›". */
export function SectionHeader({ title, subtitle, onPress, tone = 'primary', trailing, chevron = 'inline', inset = 16, style }: SectionHeaderProps) {
  const theme = useTheme();
  const color = tone === 'muted' ? theme.colors.textMuted : theme.colors.text;
  const chevronIcon = onPress && !trailing ? <Icon name={icons.chevronRight} size={15} color={color} weight="bold" /> : null;
  const content = (
    <View style={[styles.row, { paddingHorizontal: inset }, style]}>
      <View style={styles.texts}>
        <View style={styles.titleLine}>
          <AppText variant="sectionHeader" color={color} numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
          {chevron === 'inline' ? chevronIcon : null}
        </View>
        {subtitle ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ?? (chevron === 'trailing' ? chevronIcon : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint="Shows the full list"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  texts: { flexShrink: 1, gap: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
