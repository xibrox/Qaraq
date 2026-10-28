import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CAN_LIQUID_GLASS } from '@/lib/glass';
import { useToolbarAppearance, type ToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useTheme } from '@/theme';

export type GlassSurfaceProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius (default 10). Use `radius="pill"` for capsules. */
  radius?: number | 'pill';
  /** Liquid Glass variant (default `regular`). */
  variant?: 'regular' | 'clear';
  /** Interactive glass reacts to touches (buttons). */
  interactive?: boolean;
  /** Optional glass tint colour. */
  tint?: string;
  /**
   * How to draw:
   * - `toolbar` (default): follow the "Toolbar Style" setting (bars, search fields, header buttons)
   * - `always`: glass whenever Liquid Glass exists, regardless of the setting (floating media-detail buttons)
   * - `never`: always the flat fallback fill
   */
  mode?: 'toolbar' | 'always' | 'never';
  /** Flat fill used when glass isn't drawn (default `colors.field`). */
  fallbackColor?: string;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  testID?: string;
};

function shouldDrawGlass(mode: GlassSurfaceProps['mode'], appearance: ToolbarAppearance) {
  if (!CAN_LIQUID_GLASS || mode === 'never') return false;
  if (mode === 'always') return true;
  return appearance === 'liquidGlass';
}

/**
 * Liquid Glass surface (expo-glass-effect) with a graceful fallback: on Android, iOS < 26, or
 * when "Toolbar Style" is Solid, it renders a flat themed fill (translucent when the style is
 * Glass but Liquid Glass is unavailable). Never animate its opacity (glass stops rendering).
 */
export function GlassSurface({
  children,
  style,
  radius = 10,
  variant = 'regular',
  interactive,
  tint,
  mode = 'toolbar',
  fallbackColor,
  pointerEvents,
  testID,
}: GlassSurfaceProps) {
  const theme = useTheme();
  const appearance = useToolbarAppearance();
  const borderRadius = radius === 'pill' ? 999 : radius;

  if (shouldDrawGlass(mode, appearance)) {
    return (
      <GlassView
        glassEffectStyle={variant}
        isInteractive={interactive}
        tintColor={tint}
        colorScheme={theme.dark ? 'dark' : 'light'}
        pointerEvents={pointerEvents}
        testID={testID}
        style={[{ borderRadius, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }

  const translucent = appearance === 'translucent' && mode !== 'never';
  return (
    <View
      pointerEvents={pointerEvents}
      testID={testID}
      style={[
        {
          borderRadius,
          backgroundColor: translucent ? theme.colors.barBackground : (fallbackColor ?? theme.colors.field),
          borderWidth: translucent && Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.separator,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
