import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

export type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  /** `filled` = accent fill (SAVE), `secondary` = surface fill, `destructive` = red text on surface. */
  variant?: 'filled' | 'secondary' | 'destructive';
  /** `lg` = 56pt full-width (SAVE), `sm` = 44pt. */
  size?: 'lg' | 'sm';
  /** Uppercase label (default true for `lg`, like "SAVE"). */
  uppercase?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** AniClient's big white "SAVE" button and its smaller variants. */
export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'filled',
  size = 'lg',
  uppercase,
  loading,
  disabled,
  style,
  testID,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const bg = variant === 'filled' ? c.accent : c.surfaceElevated;
  const fg = variant === 'filled' ? c.onAccent : variant === 'destructive' ? c.danger : c.text;
  const height = size === 'lg' ? theme.sizes.primaryButton : 44;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: bg, borderRadius: theme.radii.xl, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={17} color={fg} /> : null}
          <AppText variant="button" color={fg} uppercase={uppercase ?? size === 'lg'}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
});
