import { ACTIVITY_MERGE_TIMES } from '@/api/settings';
import type { ScoreFormat, UserStaffNameLanguage, UserTitleLanguage } from '@/api/types';

import type { SettingsOption } from './types';

/** "Scoring System" options with AniClient's gray example subtitles. */
export const SCORE_FORMAT_OPTIONS: readonly SettingsOption<ScoreFormat>[] = [
  { value: 'POINT_100', label: '100 Point', subtitle: '(55/100)' },
  { value: 'POINT_10_DECIMAL', label: '10 Point Decimal', subtitle: '(5.5/10)' },
  { value: 'POINT_10', label: '10 Point', subtitle: '(5/10)' },
  { value: 'POINT_5', label: '5 Star', subtitle: '(3/5)' },
  { value: 'POINT_3', label: '3 Point Smiley', subtitle: ':)' },
];

/** Base title languages (the "_STYLISED" variants are folded into these). */
export type BaseTitleLanguage = 'ROMAJI' | 'ENGLISH' | 'NATIVE';

export const TITLE_LANGUAGE_OPTIONS: readonly SettingsOption<BaseTitleLanguage>[] = [
  { value: 'ROMAJI', label: 'Romaji', subtitle: '(Shingeki no Kyojin)' },
  { value: 'ENGLISH', label: 'English', subtitle: '(Attack on Titan)' },
  { value: 'NATIVE', label: 'Native', subtitle: '(進撃の巨人)' },
];

export function baseTitleLanguage(lang: UserTitleLanguage | null | undefined): BaseTitleLanguage {
  if (lang?.startsWith('ENGLISH')) return 'ENGLISH';
  if (lang?.startsWith('NATIVE')) return 'NATIVE';
  return 'ROMAJI';
}

export const STAFF_NAME_LANGUAGE_OPTIONS: readonly SettingsOption<UserStaffNameLanguage>[] = [
  { value: 'ROMAJI_WESTERN', label: 'Romaji (Western)', subtitle: '(Killua Zoldyck)' },
  { value: 'ROMAJI', label: 'Romaji', subtitle: '(Zoldyck Killua)' },
  { value: 'NATIVE', label: 'Native', subtitle: '(ゾルディック キルア)' },
];

export type ActivityMergeTime = (typeof ACTIVITY_MERGE_TIMES)[number];

function mergeTimeLabel(minutes: number): string {
  if (minutes === 0) return 'Never';
  if (minutes === 29160) return 'Always';
  if (minutes < 60) return `${minutes} Minutes`;
  if (minutes < 1440) return minutes === 60 ? '1 Hour' : `${minutes / 60} Hours`;
  if (minutes < 10080) return minutes === 1440 ? '1 Day' : `${minutes / 1440} Days`;
  return minutes === 10080 ? '1 Week' : `${minutes / 10080} Weeks`;
}

/** "Activity Merge Time" options; values are minutes as strings (menu values must be strings). */
export const ACTIVITY_MERGE_TIME_OPTIONS: readonly SettingsOption<`${ActivityMergeTime}`>[] = ACTIVITY_MERGE_TIMES.map(
  (m) => ({ value: `${m}` as `${ActivityMergeTime}`, label: mergeTimeLabel(m) }),
);

/** Snap a server value to the closest allowed merge time. */
export function nearestMergeTime(minutes: number | null | undefined): `${ActivityMergeTime}` {
  const target = minutes ?? 0;
  let best: ActivityMergeTime = ACTIVITY_MERGE_TIMES[0];
  for (const m of ACTIVITY_MERGE_TIMES) if (Math.abs(m - target) < Math.abs(best - target)) best = m;
  return `${best}`;
}

/** AniList's own account page, where accounts can be deleted (the API can't). */
export const ANILIST_ACCOUNT_SETTINGS_URL = 'https://anilist.co/settings/account';
