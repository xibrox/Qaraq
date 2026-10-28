import { preferredColorScheme } from '@expo/ui/swift-ui/modifiers';

import type { ColorScheme } from '@/theme/tokens';

/**
 * iOS: a SwiftUI sheet is its own presentation and follows the OS appearance, not the hosting
 * view's `colorScheme`, so a Light app theme on a dark OS got dark glass behind dark text.
 * `preferredColorScheme` on the sheet content pins the presentation (and its material) to the theme.
 */
export function sheetColorScheme(scheme: ColorScheme) {
  return [preferredColorScheme(scheme)];
}
