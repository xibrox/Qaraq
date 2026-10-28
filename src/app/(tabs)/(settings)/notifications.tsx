import {
  SettingsButtonRow,
  SettingsCheckRow,
  SettingsForm,
  SettingsSection,
  SettingsSwitchRow,
  SettingsValueRow,
  type SettingsOption,
} from '@/components/settings';
import { useAiringNotificationSettings } from '@/components/settings/use-airing-notification-settings';
import {
  AIRING_MINUTES_BEFORE_OPTIONS,
  AIRING_NOTIFICATION_STATUS_LABELS,
  AIRING_NOTIFICATION_STATUSES,
} from '@/settings';

type MinutesBefore = `${(typeof AIRING_MINUTES_BEFORE_OPTIONS)[number]}`;

function minutesLabel(m: number): string {
  if (m === 0) return 'When It Airs';
  if (m < 60) return `${m} Minutes Before`;
  return m === 60 ? '1 Hour Before' : `${m / 60} Hours Before`;
}

const MINUTES_OPTIONS = AIRING_MINUTES_BEFORE_OPTIONS.map(
  (m): SettingsOption<MinutesBefore> => ({ value: `${m}`, label: minutesLabel(m) }),
);

function nearestMinutes(m: number): MinutesBefore {
  const exact = AIRING_MINUTES_BEFORE_OPTIONS.find((o) => o === m);
  return `${exact ?? 0}`;
}

/**
 * "Notification Settings": Airing Notifications "Enable" (the only switch in AniClient) and
 * checkmark rows choosing which list statuses get airing reminders. Changes reschedule the
 * local reminders and (un)register the background refresh task immediately.
 */
export default function NotificationSettingsScreen() {
  const n = useAiringNotificationSettings();
  const { airing } = n;

  const footer = n.blocked
    ? 'Notifications are turned off for Qaraq in system settings.'
    : n.needsPermission
      ? 'Turn on to allow Qaraq to send airing reminders.'
      : !n.signedIn && n.effectiveEnabled
        ? 'Sign in with AniList to get reminders for shows on your list.'
        : undefined;

  return (
    <SettingsForm>
      <SettingsSection title="Airing Notifications" footer={footer}>
        <SettingsSwitchRow title="Enable" value={n.effectiveEnabled} onValueChange={(v) => void n.setEnabled(v)} />
        {n.blocked ? <SettingsButtonRow title="Open System Settings" onPress={n.openSystemSettings} /> : null}
      </SettingsSection>

      <SettingsSection>
        {AIRING_NOTIFICATION_STATUSES.map((status) => (
          <SettingsCheckRow
            key={status}
            title={AIRING_NOTIFICATION_STATUS_LABELS[status]}
            checked={airing.statuses[status]}
            onToggle={(v) => void n.setStatus(status, v)}
          />
        ))}
      </SettingsSection>

      <SettingsSection>
        <SettingsValueRow
          title="Remind Me"
          subtitle="When to send the reminder"
          value={nearestMinutes(airing.minutesBefore)}
          options={MINUTES_OPTIONS}
          onChange={(v) => void n.setMinutesBefore(Number(v))}
        />
      </SettingsSection>
    </SettingsForm>
  );
}
