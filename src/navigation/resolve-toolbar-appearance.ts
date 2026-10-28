import type { ToolbarStyle } from '@/settings/types';

/**
 * How bars are actually drawn after resolving the "Toolbar Style" setting against the platform:
 * - `liquidGlass`: system Liquid Glass (iOS 26+), content scrolls under the bars
 * - `translucent`: blurred/tinted translucent bars (glass requested where Liquid Glass is missing)
 * - `solid`: opaque bars filled with `colors.header`
 */
export type ToolbarAppearance = 'liquidGlass' | 'translucent' | 'solid';

/** Pure resolution, exported for tests and non-React code. */
export function resolveToolbarAppearance(
  style: ToolbarStyle,
  opts: { canLiquidGlass: boolean; reduceTransparency: boolean; platform: string },
): ToolbarAppearance {
  if (style === 'solid' || opts.reduceTransparency) return 'solid';
  if (opts.canLiquidGlass) return 'liquidGlass';
  // "Follow" means the platform default: solid where there is no Liquid Glass.
  if (style === 'follow') return 'solid';
  // "Glass" without Liquid Glass: iOS can blur; Android gets a translucent tint.
  return opts.platform === 'ios' || opts.platform === 'android' ? 'translucent' : 'solid';
}

