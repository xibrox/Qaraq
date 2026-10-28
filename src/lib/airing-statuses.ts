import type { MediaListStatus } from '@/api/types';
import { AIRING_NOTIFICATION_STATUSES } from '@/settings/defaults';
import type { AiringNotificationStatus } from '@/settings/types';

/**
 * List statuses to fetch airing schedules for, from Notification Settings.
 * "Watching" covers both CURRENT and REPEATING. Pure, unit tested.
 */
export function airingStatusesFromSettings(statuses: Record<AiringNotificationStatus, boolean>): MediaListStatus[] {
  const out: MediaListStatus[] = [];
  for (const status of AIRING_NOTIFICATION_STATUSES) {
    if (!statuses[status]) continue;
    out.push(status);
    if (status === 'CURRENT') out.push('REPEATING');
  }
  return out;
}
