import type { ColorScheme } from '@/theme/tokens';

/** Android: Compose sheets already follow the app theme. See the iOS variant. */
export function sheetColorScheme(_scheme: ColorScheme): undefined {
  return undefined;
}
