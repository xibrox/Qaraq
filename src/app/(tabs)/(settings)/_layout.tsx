import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/navigation/stack-options';

export const unstable_settings = { anchor: 'index' };

/** "Settings" tab Stack. Titles are AniClient's verbatim nav titles. */
export default function SettingsLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="general" options={{ title: 'General Settings' }} />
      <Stack.Screen name="gestures" options={{ title: 'Gesture Settings' }} />
      <Stack.Screen name="more" options={{ title: 'More Settings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="anilist" options={{ title: 'AniList Settings' }} />
      <Stack.Screen name="whats-new" options={{ title: "What's New" }} />
      {/* The page sets "Anime Custom List" / "Manga Custom List" from the [type] param. */}
      <Stack.Screen name="custom-lists/[type]" options={{ title: '' }} />
    </Stack>
  );
}
