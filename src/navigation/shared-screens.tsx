import { Stack, type NativeStackNavigationOptions } from 'expo-router';
import type { ReactElement } from 'react';

/**
 * Stack.Screen entries for the shared detail routes in `src/app/(tabs)/(lists,explore,profile)/`.
 * Every tab Stack that hosts them calls this, so titles and presentation stay identical in each
 * tab. Screens refine their own header from the page (`<Stack.Screen options={...} />`,
 * `Stack.Title`, `Stack.Toolbar`), e.g. media detail sets a transparent header with floating
 * glass buttons, favourites sets "Favorite Animes".
 *
 * Returned as an array (not a component) because Stack only inspects its direct children.
 */
export function sharedStackScreens(sheet: NativeStackNavigationOptions): ReactElement[] {
  return [
    <Stack.Screen key="media" name="media/[id]" options={{ title: '' }} />,
    <Stack.Screen key="character" name="character/[id]" options={{ title: '' }} />,
    <Stack.Screen key="staff" name="staff/[id]" options={{ title: '' }} />,
    <Stack.Screen key="studio" name="studio/[id]" options={{ title: '' }} />,
    <Stack.Screen key="user" name="user/[id]" options={{ title: '' }} />,
    <Stack.Screen key="activity" name="activity/[id]" options={{ title: 'Activity' }} />,
    <Stack.Screen key="review" name="review/[id]" options={{ title: 'Review' }} />,
    <Stack.Screen key="favourites" name="favourites/[userId]/[kind]" options={{ title: '' }} />,
    <Stack.Screen key="follows" name="follows/[userId]/[kind]" options={{ title: '' }} />,
    <Stack.Screen key="search" name="search" options={{ headerShown: false }} />,
    <Stack.Screen key="entry" name="entry/[mediaId]" options={sheet} />,
  ];
}
