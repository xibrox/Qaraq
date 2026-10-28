import { Stack } from 'expo-router';

import { sharedStackScreens } from '@/navigation/shared-screens';
import { useSheetScreenOptions, useStackScreenOptions } from '@/navigation/stack-options';

/** Deep links into a shared route keep the tab root underneath, so back works. */
export const unstable_settings = { anchor: 'index' };

/** "My List" tab Stack. The root draws its own header (title + toolbar + chips), so the native bar is hidden. */
export default function ListsLayout() {
  const screenOptions = useStackScreenOptions();
  const sheet = useSheetScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Anime List' }} />
      {sharedStackScreens(sheet)}
    </Stack>
  );
}
