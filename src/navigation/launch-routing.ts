import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { onSettingsHydrated } from '@/settings/store';

import { appUrlToPath } from './hrefs';
import { tabDefinition } from './tabs';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Guards against routing the same tap twice (launch response + listener replay). */
let lastHandledResponse: string | null = null;

function responseKey(response: Notifications.NotificationResponse): string {
  return `${response.notification.request.identifier}:${response.notification.date}`;
}

function routeResponse(response: Notifications.NotificationResponse | null): boolean {
  if (!response) return false;
  const key = responseKey(response);
  if (key === lastHandledResponse) return true;
  const path = pathFromResponse(response);
  if (!path) return false;
  lastHandledResponse = key;
  router.push(path as Href);
  return true;
}

function pathFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data as { url?: unknown } | undefined;
  return typeof data?.url === 'string' ? appUrlToPath(data.url) : null;
}

/**
 * Launch-time routing, mounted once inside the root navigator:
 * 1. A notification tap that cold-started the app wins: route to its `qaraq://` target.
 * 2. Otherwise, if the app opened on the default route (not a deep link), switch once to the
 *    "Default Tab" setting after settings hydrate.
 * 3. While running, every notification tap routes to its target.
 *
 * Deep links (`qaraq://media/<id>`, `qaraq://user/<id>`, `qaraq://activity/<id>`,
 * `qaraq://notifications`) are resolved by Expo Router itself because the scheme is `qaraq`
 * and those paths exist as routes.
 */
export function useLaunchRouting(initialPathname: string) {
  const navKey = useRootNavigationState()?.key;
  const handled = useRef(false);

  useEffect(() => {
    if (!navKey || handled.current) return;
    handled.current = true;

    if (isNative) {
      if (routeResponse(Notifications.getLastNotificationResponse())) {
        Notifications.clearLastNotificationResponse();
        return;
      }
    }
    if (initialPathname !== '/') return;
    return onSettingsHydrated((s) => {
      // Always navigate, My List included: `/` matches both (lists)/index and (explore)/index,
      // and Expo Router resolves it to (explore) regardless of the tab layout's anchor.
      router.navigate(tabDefinition(s.defaultTab).href);
    });
  }, [navKey, initialPathname]);

  useEffect(() => {
    if (!isNative) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeResponse(response);
    });
    return () => sub.remove();
  }, []);
}
