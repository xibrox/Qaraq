import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { useToastVisible } from '@/components/toast';
import { CAN_LIQUID_GLASS } from '@/lib/glass';
import { useTheme } from '@/theme';

import { useToolbarAppearance, type ToolbarAppearance } from './toolbar-appearance';

/**
 * Shared native Stack header options for every tab Stack, honouring "Toolbar Style".
 * AniClient bars: centered white semibold ~17pt title, plain back arrow with no text.
 *
 * Content note for screens: with `liquidGlass` / `translucent` the header is transparent and
 * content scrolls under it, so scroll views must use `contentInsetAdjustmentBehavior="automatic"`
 * (iOS). With `solid`, content starts below the bar. Both work with the automatic behaviour.
 */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const theme = useTheme();
  const appearance = useToolbarAppearance();
  const toastVisible = useToastVisible();
  const options = buildStackScreenOptions(theme, appearance);
  // Android: the toast is drawn where the centred nav title sits, so blank the title meanwhile
  // (`headerTitle` wins over the screens' `title`; a transparent colour renders black here).
  if (Platform.OS === 'android' && toastVisible) return { ...options, headerTitle: '' };
  return options;
}

export function buildStackScreenOptions(
  theme: ReturnType<typeof useTheme>,
  appearance: ToolbarAppearance,
): NativeStackNavigationOptions {
  const c = theme.colors;
  const base: NativeStackNavigationOptions = {
    headerTitleAlign: 'center',
    headerTintColor: c.text,
    headerTitleStyle: {
      fontFamily: theme.fontFamily,
      fontWeight: theme.typography.navTitle.fontWeight,
      fontSize: theme.typography.navTitle.fontSize,
      color: c.text,
    },
    headerBackButtonDisplayMode: 'minimal',
    headerBackTitle: '',
    headerShadowVisible: false,
    headerLargeTitleEnabled: false,
    contentStyle: { backgroundColor: c.background },
    fullScreenGestureEnabled: true,
    headerUserInterfaceStyle: theme.dark ? 'dark' : 'light',
  };

  switch (appearance) {
    case 'liquidGlass':
      // iOS 26: leaving the background unset gives the system glass bar.
      return { ...base, headerTransparent: true };
    case 'translucent':
      if (Platform.OS === 'ios') {
        return {
          ...base,
          headerTransparent: true,
          headerBlurEffect: theme.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
        };
      }
      return { ...base, headerTransparent: true, headerStyle: { backgroundColor: c.barBackground } };
    case 'solid':
    default:
      return { ...base, headerTransparent: false, headerStyle: { backgroundColor: c.header } };
  }
}

/** Options for sheet-style routes (entry editor, sign-in). */
export function useSheetScreenOptions(
  detents: NativeStackNavigationOptions['sheetAllowedDetents'] = [0.6, 1],
): NativeStackNavigationOptions {
  const theme = useTheme();
  return {
    presentation: 'formSheet',
    sheetAllowedDetents: detents,
    sheetInitialDetentIndex: 0,
    sheetGrabberVisible: true,
    sheetCornerRadius: theme.radii.sheet,
    headerShown: false,
    // Transparent lets the iOS 26 Liquid Glass sheet material show through; screens draw their own fill otherwise.
    contentStyle: { backgroundColor: CAN_LIQUID_GLASS ? 'transparent' : theme.colors.surface },
  };
}
