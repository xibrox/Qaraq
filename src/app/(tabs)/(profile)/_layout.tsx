import { Stack } from 'expo-router';

import { sharedStackScreens } from '@/navigation/shared-screens';
import { useSheetScreenOptions, useStackScreenOptions } from '@/navigation/stack-options';

export const unstable_settings = { anchor: 'index' };

/** "Profile" tab Stack. The root sets its title to the username and adds the envelope button. */
export default function ProfileLayout() {
  const screenOptions = useStackScreenOptions();
  const sheet = useSheetScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      {sharedStackScreens(sheet)}
    </Stack>
  );
}
