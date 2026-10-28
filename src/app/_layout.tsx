// Side effects first: defines the background task and injects the notification data sources at
// module scope, so they also exist when the OS starts the bundle headlessly for a background run.
import '@/lib/background';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { bootstrapAuth, ensureViewerId, useAuthStatus, useAuthStore } from '@/auth';
import { useFirstLaunchSignIn } from '@/components/settings/onboarding';
import { ToastHost } from '@/components/toast';
import {
  configureNotifications,
  refreshAiringNotifications,
  syncBackgroundTask,
} from '@/lib/notifications';
import { queryClient, setupQueryClientListeners } from '@/lib/queryClient';
import { useLaunchRouting } from '@/navigation/launch-routing';
import { useSettings } from '@/settings/store';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

// iOS 26: react-native-screens counts the screen's own header-config node beside the entry
// editor's ScrollView + save bar. The ScrollView is still first, so the sheet lays out correctly.
LogBox.ignoreLogs(['[RNScreens] FormSheet with ScrollView expects at most 2 subviews']);

/** Keep the tab navigator under modals (sign-in) even when the app opens on a deep link. */
export const unstable_settings = { anchor: '(tabs)' };

/** Longest we keep the splash up if auth bootstrap stalls (offline secure-store edge cases). */
const SPLASH_TIMEOUT_MS = 2500;

/** App-wide, non-visual startup work. Renders nothing. */
function AppBootstrap() {
  const viewerId = useAuthStore((s) => s.viewerId);
  const authStatus = useAuthStatus();
  const { airingEnabled, anilistAlerts } = useSettings((s) => ({
    airingEnabled: s.notifications.airing.enabled,
    anilistAlerts: s.notifications.anilistAlerts,
  }));

  useEffect(() => {
    void bootstrapAuth();
    void configureNotifications();
    const cleanupQuery = setupQueryClientListeners();
    // If the viewer id could not be resolved at launch (offline), retry on foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void ensureViewerId();
    });
    const splashTimer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_TIMEOUT_MS);
    return () => {
      sub.remove();
      cleanupQuery();
      clearTimeout(splashTimer);
    };
  }, []);

  useEffect(() => {
    if (authStatus !== 'loading') void SplashScreen.hideAsync();
  }, [authStatus]);

  useEffect(() => {
    void syncBackgroundTask().catch(() => {});
  }, [airingEnabled, anilistAlerts]);

  useEffect(() => {
    if (viewerId == null || !airingEnabled) return;
    void refreshAiringNotifications().catch(() => {});
  }, [viewerId, airingEnabled]);

  return null;
}

/**
 * Root Stack: the tab navigator plus modals that cover the tab bar (sign-in).
 * Also mounts launch routing (Default Tab, notification taps) and first-launch sign-in.
 */
function RootNavigator() {
  const theme = useTheme();
  const pathname = usePathname();
  // The path the app opened on: '/' for a normal launch, the target for a deep link.
  const [initialPathname] = useState(pathname);
  useLaunchRouting(initialPathname);
  useFirstLaunchSignIn();

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal', gestureEnabled: true }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppBootstrap />
          <RootNavigator />
          <ToastHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
