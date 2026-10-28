import { Stack } from 'expo-router';

import { sharedStackScreens } from '@/navigation/shared-screens';
import { useSheetScreenOptions, useStackScreenOptions } from '@/navigation/stack-options';

export const unstable_settings = { anchor: 'index' };

/** "Explore" tab Stack. The root draws its own header ("Explore Anime" + search + switch). */
export default function ExploreLayout() {
  const screenOptions = useStackScreenOptions();
  const sheet = useSheetScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Explore Anime' }} />
      {sharedStackScreens(sheet)}
    </Stack>
  );
}
