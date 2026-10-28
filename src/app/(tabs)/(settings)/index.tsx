import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { Linking } from 'react-native';

import { useViewer } from '@/api/queries/hooks';
import { signOut, useIsSignedIn } from '@/auth';
import {
  SettingsButtonRow,
  SettingsCustomRow,
  SettingsDestructiveRow,
  SettingsForm,
  SettingsNavigationRow,
  SettingsSection,
} from '@/components/settings';
import { confirm } from '@/components/settings/confirm';
import { QaraqHeaderCard } from '@/components/settings/qaraq-header-card';
import { settingsIcons } from '@/components/settings/settings-icons';
import { toast } from '@/components/toast';
import { hrefs } from '@/navigation/hrefs';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

async function rateApp() {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
    const url = StoreReview.storeUrl();
    if (url) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through
  }
  toast('Rating is not available on this device');
}

async function confirmSignOut() {
  const ok = await confirm({
    title: 'Sign Out',
    message: 'You can keep browsing AniList as a guest.',
    confirmLabel: 'Sign Out',
    destructive: true,
  });
  if (!ok) return;
  await signOut();
  toast('Signed out');
}

/** "Settings" root. AniClient's PRO banner becomes the Qaraq card: everything is free. */
export default function SettingsScreen() {
  const signedIn = useIsSignedIn();
  const { data: viewer } = useViewer({ enabled: signedIn });
  const user = signedIn && viewer ? { name: viewer.name, avatarUrl: viewer.avatar?.medium ?? viewer.avatar?.large } : null;

  return (
    <SettingsForm footer={`v${VERSION}`}>
      <SettingsSection>
        <SettingsCustomRow bare>
          <QaraqHeaderCard
            user={user}
            onPress={() => router.push(signedIn ? hrefs.tab('profile') : hrefs.signIn())}
          />
        </SettingsCustomRow>
      </SettingsSection>

      <SettingsSection>
        <SettingsNavigationRow title="General" icon={settingsIcons.general} onPress={() => router.push(hrefs.settings.general())} />
        <SettingsNavigationRow
          title="Notifications"
          icon={settingsIcons.notifications}
          onPress={() => router.push(hrefs.settings.notifications())}
        />
        <SettingsNavigationRow title="AniList" icon={settingsIcons.anilist} onPress={() => router.push(hrefs.settings.anilist())} />
      </SettingsSection>

      <SettingsSection>
        <SettingsButtonRow title="What's New" icon={settingsIcons.whatsNew} onPress={() => router.push(hrefs.settings.whatsNew())} />
        <SettingsButtonRow title="Rate App" icon={settingsIcons.rateApp} onPress={() => void rateApp()} />
      </SettingsSection>

      <SettingsSection>
        {signedIn ? (
          <SettingsDestructiveRow title="Sign Out" icon={settingsIcons.signOut} onPress={() => void confirmSignOut()} />
        ) : (
          <SettingsButtonRow title="Sign In" icon={settingsIcons.signIn} onPress={() => router.push(hrefs.signIn())} />
        )}
      </SettingsSection>
    </SettingsForm>
  );
}
