import { ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { createContext, use, useEffect, useMemo, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { useSettings } from '@/settings/store';

import { toNavigationTheme } from './navigation';
import { buildTheme, resolveBackground, schemeOf, type Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

/**
 * Provides the app theme from settings (Theme background + Color accent) and the OS colour
 * scheme, and feeds Expo Router's navigation theme.
 *
 * `Appearance.setColorScheme` keeps native UI (Liquid Glass, @expo/ui SwiftUI/Compose views,
 * menus, alerts, keyboards) in the theme's light/dark mode. With Theme = System the override
 * is cleared and the OS scheme is followed.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { background, accent } = useSettings((s) => ({ background: s.theme, accent: s.accentColor }));
  const systemScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(background === 'system' ? 'unspecified' : schemeOf(background));
  }, [background]);

  const resolved = resolveBackground(
    background,
    systemScheme === 'light' ? 'light' : systemScheme === 'dark' ? 'dark' : null,
  );

  const theme = useMemo(() => buildTheme(resolved, accent), [resolved, accent]);
  const navTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  return (
    <ThemeContext value={theme}>
      <NavigationThemeProvider value={navTheme}>{children}</NavigationThemeProvider>
    </ThemeContext>
  );
}

/** Current app theme. Falls back to the default black/white theme outside the provider. */
export function useTheme(): Theme {
  return use(ThemeContext) ?? FALLBACK_THEME;
}

/** Shortcut for `useTheme().colors`. */
export function useColors() {
  return useTheme().colors;
}

const FALLBACK_THEME = buildTheme();
