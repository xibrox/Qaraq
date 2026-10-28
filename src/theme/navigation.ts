import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';

import type { Theme } from './tokens';

/** Map app theme tokens onto the React Navigation theme used by Expo Router. */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const c = theme.colors;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.header,
      text: c.text,
      border: c.separator,
      notification: c.danger,
    },
    fonts: {
      regular: { fontFamily: theme.fontFamily, fontWeight: '400' },
      medium: { fontFamily: theme.fontFamily, fontWeight: '600' },
      bold: { fontFamily: theme.fontFamily, fontWeight: '700' },
      heavy: { fontFamily: theme.fontFamily, fontWeight: '800' },
    },
  };
}
