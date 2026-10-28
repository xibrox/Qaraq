import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { shouldRetryQuery } from '@/api/client';

/**
 * TanStack Query client tuned for AniList:
 * - AniList rate limit is 90 req/min (degraded to 30 at times), so data is considered fresh for
 *   a couple of minutes and failed requests are retried sparingly (`shouldRetryQuery`).
 * - This is THE app-wide client: the root layout provides it and `signOut()` clears it.
 * - Queries refetch when the app returns to the foreground (focusManager <- AppState).
 */

const MINUTE = 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * MINUTE,
      gcTime: 30 * MINUTE,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // gql() already retries 429/5xx/network internally; see shouldRetryQuery.
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
    mutations: {
      retry: false,
    },
  },
});

let wired = false;

/**
 * Wire focus (AppState) and online state for React Native. Call once at app start
 * (idempotent). Returns a cleanup function.
 *
 * Online detection without NetInfo: we assume online and let failed fetches surface; when the
 * app becomes active we flip online to true so paused queries/mutations resume.
 */
export function setupQueryClientListeners(): () => void {
  if (wired || Platform.OS === 'web') return () => {};
  wired = true;

  onlineManager.setOnline(true);

  focusManager.setEventListener((setFocused) => {
    const onChange = (status: AppStateStatus) => {
      setFocused(status === 'active');
      if (status === 'active') onlineManager.setOnline(true);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  });

  return () => {
    wired = false;
    focusManager.setEventListener((handleFocus) => {
      handleFocus(true);
      return () => {};
    });
  };
}

/** Clear all cached data (on logout / account switch). */
export function clearQueryCache() {
  void queryClient.cancelQueries();
  queryClient.clear();
}
