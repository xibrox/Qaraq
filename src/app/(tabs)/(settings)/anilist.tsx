import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

import { useUpdateUser, useViewer } from '@/api/queries/hooks';
import type { UpdateUserVariables } from '@/api/types';
import { useIsSignedIn } from '@/auth';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import {
  SettingsCheckRow,
  SettingsDestructiveRow,
  SettingsForm,
  SettingsNavigationRow,
  SettingsSection,
  SettingsValueRow,
} from '@/components/settings';
import {
  ACTIVITY_MERGE_TIME_OPTIONS,
  ANILIST_ACCOUNT_SETTINGS_URL,
  baseTitleLanguage,
  nearestMergeTime,
  SCORE_FORMAT_OPTIONS,
  STAFF_NAME_LANGUAGE_OPTIONS,
  TITLE_LANGUAGE_OPTIONS,
} from '@/components/settings/anilist-options';
import { confirm } from '@/components/settings/confirm';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { getSettings, setSetting } from '@/settings';
import { useTheme } from '@/theme';

async function openDeleteAccount() {
  const ok = await confirm({
    title: 'Delete Account',
    message: 'AniList accounts can only be deleted on the AniList website. Open your AniList account settings?',
    confirmLabel: 'Open AniList',
    destructive: true,
  });
  if (ok) await WebBrowser.openBrowserAsync(ANILIST_ACCOUNT_SETTINGS_URL);
}

/**
 * "AniList Settings": account options stored on AniList and synced with UpdateUser.
 * The cached Viewer is updated optimistically, so every row reflects the change at once.
 */
export default function AniListSettingsScreen() {
  const groupedBackground = useTheme().colors.groupedBackground;
  const signedIn = useIsSignedIn();
  const viewer = useViewer({ enabled: signedIn });
  const update = useUpdateUser();
  const serverAdult = viewer.data?.options?.displayAdultContent;

  // Keep the local 18+ mirror (search/explore filtering) in sync with the account.
  useEffect(() => {
    if (serverAdult != null && getSettings().showAdultContent !== serverAdult) setSetting('showAdultContent', serverAdult);
  }, [serverAdult]);

  if (!signedIn) {
    return (
      <EmptyState
          style={{ backgroundColor: groupedBackground }}
        icon={icons.person}
        title="Not Signed In"
        message="Sign in with AniList to change your account settings."
        actionLabel="Sign In"
        onAction={() => router.push(hrefs.signIn())}
      />
    );
  }
  if (viewer.isPending) return <LoadingState />;
  if (viewer.isError || !viewer.data) return <ErrorState error={viewer.error} onRetry={() => void viewer.refetch()} />;

  const v = viewer.data;
  const options = v.options;
  const scoreFormat = v.mediaListOptions?.scoreFormat ?? 'POINT_10_DECIMAL';

  const save = (vars: UpdateUserVariables) => {
    haptics.selection();
    update.mutate(vars, { onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update AniList settings') });
  };

  return (
    <SettingsForm>
      <SettingsSection>
        <SettingsValueRow
          title="Scoring System"
          value={scoreFormat}
          options={SCORE_FORMAT_OPTIONS}
          onChange={(scoreFormat) => save({ scoreFormat })}
        />
        <SettingsCheckRow
          title="18+ Content"
          checked={options?.displayAdultContent ?? false}
          onToggle={(displayAdultContent) => {
            // Mirror locally so search/explore filtering follows immediately.
            setSetting('showAdultContent', displayAdultContent);
            save({ displayAdultContent });
          }}
        />
      </SettingsSection>

      <SettingsSection title="Language">
        <SettingsValueRow
          title="Title Language"
          subtitle="Used by the Default preferred title"
          value={baseTitleLanguage(options?.titleLanguage)}
          options={TITLE_LANGUAGE_OPTIONS}
          onChange={(titleLanguage) => save({ titleLanguage })}
        />
        <SettingsValueRow
          title="Staff Name Language"
          value={options?.staffNameLanguage ?? 'ROMAJI_WESTERN'}
          options={STAFF_NAME_LANGUAGE_OPTIONS}
          onChange={(staffNameLanguage) => save({ staffNameLanguage })}
        />
      </SettingsSection>

      <SettingsSection title="Activity">
        <SettingsValueRow
          title="Activity Merge Time"
          subtitle="Merge list activity within this time"
          value={nearestMergeTime(options?.activityMergeTime)}
          options={ACTIVITY_MERGE_TIME_OPTIONS}
          onChange={(m) => save({ activityMergeTime: Number(m) })}
        />
        <SettingsCheckRow
          title="Airing Notifications"
          subtitle="AniList notifications when episodes air"
          checked={options?.airingNotifications ?? false}
          onToggle={(airingNotifications) => save({ airingNotifications })}
        />
      </SettingsSection>

      <SettingsSection title="Custom List">
        <SettingsNavigationRow title="Custom Anime Lists" onPress={() => router.push(hrefs.settings.customLists('ANIME'))} />
        <SettingsNavigationRow title="Custom Manga Lists" onPress={() => router.push(hrefs.settings.customLists('MANGA'))} />
      </SettingsSection>

      <SettingsSection>
        <SettingsDestructiveRow title="Delete Account" align="center" onPress={() => void openDeleteAccount()} />
      </SettingsSection>
    </SettingsForm>
  );
}
