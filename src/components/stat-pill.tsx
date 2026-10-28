import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

export type StatPillProps = {
  /** Text before the separator ("AL", "#54"). */
  label: string;
  /** Text after the separator ("8.2", "Highest Rated All Time"). */
  value?: string;
  /** Icon shown before the label (rank ★ / ♥) or after the value (`iconPosition="end"`, "8.2 ★"). */
  icon?: IconName;
  iconColor?: string;
  iconPosition?: 'start' | 'end';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Small outlined pill: score pill "AL · 8.2 ★", rank pills "★ #54 · Highest Rated All Time",
 * genre pills on search results.
 */
export function StatPill({ label, value, icon, iconColor, iconPosition = 'start', onPress, style }: StatPillProps) {
  const theme = useTheme();
  const c = theme.colors;
  const glyph = icon ? <Icon name={icon} size={11} color={iconColor ?? c.textSecondary} /> : null;
  const body = (
    <View style={[styles.pill, { borderColor: c.chipBorder, backgroundColor: c.chipFill }, style]}>
      {iconPosition === 'start' ? glyph : null}
      <AppText variant="caption1" weight="700" numberOfLines={1}>
        {label}
        {value ? <AppText variant="caption1" tone="secondary">{`  ·  ${value}`}</AppText> : null}
      </AppText>
      {iconPosition === 'end' ? glyph : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  );
}

export type StatBlockProps = {
  value: string;
  label: string;
  onPress?: () => void;
  /** `card` = filled card (Profile Followers/Following), `plain` = no background (Stats summary). */
  variant?: 'card' | 'plain';
  style?: StyleProp<ViewStyle>;
};

/** Big number over a gray label ("35" / "Followers", "3 974" / "Eps. Watched"). */
export function StatBlock({ value, label, onPress, variant = 'plain', style }: StatBlockProps) {
  const theme = useTheme();
  const body = (
    <View
      style={[
        styles.block,
        variant === 'card' && { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl, paddingVertical: 10 },
        style,
      ]}>
      <AppText variant="title2" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="footnote" tone="secondary" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  block: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 12 },
});
