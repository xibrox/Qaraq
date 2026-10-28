import { Platform } from 'react-native';

import { CAN_LIQUID_GLASS, useReduceTransparency } from '@/lib/glass';
import { useSetting } from '@/settings/store';
import { useTheme } from '@/theme';

import { resolveToolbarAppearance, type ToolbarAppearance } from './resolve-toolbar-appearance';

export { resolveToolbarAppearance, type ToolbarAppearance };

/** Reactive toolbar appearance from settings + platform capabilities. */
export function useToolbarAppearance(): ToolbarAppearance {
  const style = useSetting('toolbarStyle');
  const reduceTransparency = useReduceTransparency();
  return resolveToolbarAppearance(style, {
    canLiquidGlass: CAN_LIQUID_GLASS,
    reduceTransparency,
    platform: Platform.OS,
  });
}

/**
 * iOS header options for screens whose body scrolls under the bar. In light themes the glass
 * bar's hard scroll edge still lets text show faintly behind the title (notably on a dark OS),
 * so draw an opaque bar like the "Solid" toolbar style instead.
 */
export function useScrollUnderHeaderOptions() {
  const appearance = useToolbarAppearance();
  const theme = useTheme();
  if (Platform.OS !== 'ios') return null;
  if (appearance !== 'solid' && !theme.dark) return { headerTransparent: false, headerStyle: { backgroundColor: theme.colors.header } };
  if (appearance === 'liquidGlass') return { scrollEdgeEffects: { top: 'hard' as const } };
  return null;
}
