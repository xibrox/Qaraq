import Constants from 'expo-constants';

import { SettingsForm, SettingsSection, SettingsTextRow } from '@/components/settings';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

type Highlight = { title: string; subtitle: string };

const HIGHLIGHTS: readonly { section: string; items: readonly Highlight[] }[] = [
  {
    section: `Version ${VERSION}`,
    items: [
      { title: 'Everything Is Free', subtitle: 'All colors, themes and features, no subscription' },
      { title: 'Native Look', subtitle: 'Liquid Glass on iOS 26, Material 3 controls on Android' },
      { title: 'Toolbar Style', subtitle: 'Follow the system, always glass, or solid bars' },
    ],
  },
  {
    section: 'Your Lists',
    items: [
      { title: 'Swipe Gestures', subtitle: 'Choose what swiping left or right does, per media type' },
      { title: 'Custom Lists', subtitle: 'Create, rename and delete AniList custom lists' },
      { title: 'Airing Notifications', subtitle: 'Reminders for the statuses you pick' },
    ],
  },
  {
    section: 'AniList',
    items: [
      { title: 'Account Settings', subtitle: 'Scoring system, title language and more, synced to AniList' },
      { title: 'Guest Mode', subtitle: 'Browse AniList without an account' },
    ],
  },
];

/** "What's New" (not shown in the recording): release highlights in the settings style. */
export default function WhatsNewScreen() {
  return (
    <SettingsForm>
      {HIGHLIGHTS.map((group) => (
        <SettingsSection key={group.section} title={group.section}>
          {group.items.map((item) => (
            <SettingsTextRow key={item.title} title={item.title} subtitle={item.subtitle} />
          ))}
        </SettingsSection>
      ))}
    </SettingsForm>
  );
}
