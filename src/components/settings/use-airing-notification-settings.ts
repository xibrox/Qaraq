import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { useIsSignedIn } from '@/auth';
import { toast } from '@/components/toast';
import {
  cancelAiringNotifications,
  getNotificationPermission,
  refreshAiringNotifications,
  requestNotificationPermission,
  syncBackgroundTask,
  type PermissionState,
} from '@/lib/notifications';
import { haptics } from '@/lib/haptics';
import {
  setAiringStatus,
  updateAiringNotifications,
  useSettings,
  type AiringNotificationStatus,
} from '@/settings';

import { confirm } from './confirm';

/** Reschedule reminders and (un)register the background refresh after a settings change. */
async function applyAiringSettings(signedIn: boolean): Promise<void> {
  await syncBackgroundTask().catch(() => false);
  if (signedIn) await refreshAiringNotifications().catch(() => 0);
}

async function promptOpenSettings() {
  const ok = await confirm({
    title: 'Notifications Are Off',
    message: 'Allow notifications for Qaraq in Settings to get airing reminders.',
    confirmLabel: 'Open Settings',
    cancelLabel: 'Not Now',
  });
  if (ok) await Linking.openSettings();
}

/**
 * Notification Settings state + actions. Turning "Enable" on asks for notification permission,
 * registers the background refresh task and schedules reminders for the checked statuses.
 */
export function useAiringNotificationSettings() {
  const airing = useSettings((s) => s.notifications.airing);
  const signedIn = useIsSignedIn();
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    let alive = true;
    const read = () =>
      void getNotificationPermission().then((p) => {
        if (alive) setPermission(p);
      });
    read();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const setEnabled = useCallback(
    async (next: boolean) => {
      haptics.selection();
      if (!next) {
        updateAiringNotifications({ enabled: false });
        await cancelAiringNotifications().catch(() => {});
        await syncBackgroundTask().catch(() => false);
        return;
      }
      const granted = await requestNotificationPermission();
      setPermission(granted);
      if (granted !== 'granted') {
        updateAiringNotifications({ enabled: false });
        void promptOpenSettings();
        return;
      }
      updateAiringNotifications({ enabled: true });
      await applyAiringSettings(signedIn);
    },
    [signedIn],
  );

  const setStatus = useCallback(
    async (status: AiringNotificationStatus, on: boolean) => {
      haptics.selection();
      setAiringStatus(status, on);
      if (airing.enabled) await applyAiringSettings(signedIn);
    },
    [airing.enabled, signedIn],
  );

  const setMinutesBefore = useCallback(
    async (minutes: number) => {
      updateAiringNotifications({ minutesBefore: minutes });
      if (airing.enabled) {
        await applyAiringSettings(signedIn);
        if (signedIn) toast.success('Reminders updated');
      }
    },
    [airing.enabled, signedIn],
  );

  // The switch shows whether reminders can actually be delivered: "on" in settings but without
  // OS permission reads as off (turning it on asks for permission). Until the permission is
  // known, show the stored value to avoid a flicker.
  const effectiveEnabled = permission == null ? airing.enabled : airing.enabled && permission === 'granted';

  return {
    airing,
    signedIn,
    permission,
    effectiveEnabled,
    /** Enabled in settings but the OS permission has not been asked yet. */
    needsPermission: airing.enabled && permission === 'undetermined',
    /** Enabled in settings but blocked by the OS. */
    blocked: airing.enabled && permission === 'denied',
    setEnabled,
    setStatus,
    setMinutesBefore,
    openSystemSettings: () => void Linking.openSettings(),
  };
}
