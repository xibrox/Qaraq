import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';
import { Icon, type IconName } from './icon';

export type IconButtonVariant = 'circle' | 'glass' | 'outlined' | 'plain';

export type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Required: icon-only buttons need a spoken label. */
  accessibilityLabel: string;
  /**
   * - `circle`: ~44pt dark gray circle (sort direction, ⇄, clear filters)
   * - `glass`: floating translucent circle over images (media detail ←, ♡, ⋮); Liquid Glass when available
   * - `outlined`: rounded-square outline, the row "•••" button (~30pt, radius 6)
   * - `plain`: bare icon (toolbar leading icon, nav bar buttons)
   */
  variant?: IconButtonVariant;
  /** Outer size in points (defaults: circle/glass 44, outlined 30, plain 36). */
  size?: number;
  iconSize?: number;
  /** Icon colour (default primary text). */
  color?: string;
  /** Red badge (unread count). Hidden when 0/undefined. */
  badge?: number | string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const DEFAULT_SIZE: Record<IconButtonVariant, number> = { circle: 44, glass: 44, outlined: 30, plain: 36 };

export function IconButton({
  icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  variant = 'plain',
  size,
  iconSize,
  color,
  badge,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const dim = size ?? DEFAULT_SIZE[variant];
  const glyph = iconSize ?? (variant === 'outlined' ? 15 : Math.round(dim * 0.42));
  const radius = variant === 'outlined' ? theme.radii.sm : dim / 2;

  const content = <Icon name={icon} size={glyph} color={color ?? c.text} />;
  const showBadge = badge !== undefined && badge !== 0 && badge !== '';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={variant === 'outlined' ? 8 : 4}
      testID={testID}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }, style]}>
      {variant === 'glass' ? (
        <GlassSurface
          mode="always"
          interactive
          radius={radius}
          fallbackColor="rgba(40, 40, 40, 0.6)"
          style={[styles.center, { width: dim, height: dim }]}>
          {content}
        </GlassSurface>
      ) : (
        <View
          style={[
            styles.center,
            { width: dim, height: dim, borderRadius: radius },
            variant === 'circle' && { backgroundColor: c.field },
            variant === 'outlined' && { borderWidth: 1, borderColor: c.chipBorder },
          ]}>
          {content}
        </View>
      )}
      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: c.danger }]} pointerEvents="none">
          <AppText variant="caption2" color="#FFFFFF" weight="800">
            {typeof badge === 'number' && badge > 99 ? '99+' : String(badge)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
