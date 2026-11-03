import { Stack } from 'expo-router';
import type { ReactElement } from 'react';
import { Platform, StyleSheet } from 'react-native';

import type { MediaType } from '@/settings/types';

import { AppText } from './app-text';

import type { MenuEntry } from './menu/native-menu';
import { NativeSegmentedPicker } from './segmented-picker/native-segmented-picker';
import { MEDIA_TYPE_SEGMENTS } from './segmented-switch';

/**
 * iOS tab roots (My List, Explore) and Search use the native navigation bar: the title, the
 * system search bar (`Stack.SearchBar`, UISearchController) under it, and toolbar items for the
 * leading menu and the "Anime | Manga" switch. Android keeps the custom `ScreenHeader` row.
 */
export const NATIVE_SEARCH_HEADER = Platform.OS === 'ios';

/** "Anime | Manga" as a system segmented control on the right of the navigation bar. */
export function MediaTypeToolbar({ value, onChange, disabled }: { value: MediaType; onChange: (type: MediaType) => void; disabled?: boolean }) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.View hidesSharedBackground>
        <NativeSegmentedPicker segments={MEDIA_TYPE_SEGMENTS} value={value} onChange={onChange} disabled={disabled} style={styles.picker} />
      </Stack.Toolbar.View>
    </Stack.Toolbar>
  );
}

/**
 * The screen title as a leading toolbar item, so it sits on the left (UIKit only centres the
 * native title, which left the switch too little room). Pass it inside a left `Stack.Toolbar`,
 * after any button. Returned as an element: the toolbar only reads its direct children.
 */
export function toolbarTitle(title: string): ReactElement {
  return (
    <Stack.Toolbar.View key="title" hidesSharedBackground>
      <AppText variant="title3" weight="800" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
    </Stack.Toolbar.View>
  );
}

/** A left toolbar holding only the title. */
export function TitleToolbar({ title }: { title: string }) {
  return <Stack.Toolbar placement="left">{toolbarTitle(title)}</Stack.Toolbar>;
}

/**
 * Converts `NativeMenu` entries into `Stack.Toolbar.Menu` children. Returned as elements, not a
 * component, because the toolbar only reads its direct children's element types.
 */
export function toolbarMenuItems(entries: readonly MenuEntry[]): ReactElement[] {
  return entries.map((entry) => {
    if (entry.kind === 'section' || entry.kind === 'submenu') {
      return (
        <Stack.Toolbar.Menu key={entry.key} inline={entry.kind === 'section'} title={entry.title} icon={entry.kind === 'submenu' ? entry.icon?.ios : undefined}>
          {toolbarMenuItems(entry.items)}
        </Stack.Toolbar.Menu>
      );
    }
    return (
      <Stack.Toolbar.MenuAction
        key={entry.key}
        icon={entry.icon?.ios}
        subtitle={entry.subtitle}
        isOn={entry.checked}
        disabled={entry.disabled}
        destructive={entry.destructive}
        onPress={entry.onPress}>
        {entry.title}
      </Stack.Toolbar.MenuAction>
    );
  });
}

const styles = StyleSheet.create({
  picker: { width: 160 },
  title: { paddingHorizontal: 4 },
});
