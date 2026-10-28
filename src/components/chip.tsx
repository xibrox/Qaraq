import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Leading icon ("⬍" sort pill, "≡ Type"). */
  icon?: IconName;
  /** Trailing icon (e.g. chevron for pickers). */
  trailingIcon?: IconName;
  /**
   * - `filled` (default): status chip, dark fill + 1px border; selected = accent fill
   * - `outlined`: transparent with border (filter chips, "≡ Type", sort pill)
   * - `tag`: small outlined tag (list status on result cards, "Donator")
   */
  variant?: 'filled' | 'outlined' | 'tag';
  /** `md` = 36pt (default), `sm` = 30pt. */
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/** AniClient chip / pill. */
export function Chip({
  label,
  selected = false,
  onPress,
  onLongPress,
  icon,
  trailingIcon,
  variant = 'filled',
  size = 'md',
  disabled,
  style,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const theme = useTheme();
  const c = theme.colors;
  const isTag = variant === 'tag';
  const height = isTag ? 22 : size === 'md' ? theme.sizes.chipHeight : 30;
  const fg = selected ? c.onAccent : isTag ? c.textSecondary : c.text;
  const bg = selected ? c.accent : variant === 'filled' ? c.chipFill : 'transparent';
  const border = selected ? c.accent : c.chipBorder;

  const content = (
    <View
      style={[
        styles.chip,
        {
          height,
          borderRadius: isTag ? 6 : theme.radii.lg,
          paddingHorizontal: isTag ? 7 : 14,
          backgroundColor: bg,
          borderColor: border,
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={isTag ? 11 : 14} color={fg} /> : null}
      <AppText variant={isTag ? 'caption1' : size === 'md' ? 'chip' : 'subheadline'} color={fg} numberOfLines={1}>
        {label}
      </AppText>
      {trailingIcon ? <Icon name={trailingIcon} size={11} color={fg} /> : null}
    </View>
  );

  if (!onPress && !onLongPress) return content;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1 },
});
