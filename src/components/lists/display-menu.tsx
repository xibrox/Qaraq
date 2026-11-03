import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NativeMenu, type MenuEntry } from '@/components/menu/native-menu';
import { toolbarMenuItems, toolbarTitle } from '@/components/native-header';
import type { MediaType } from '@/api/types';
import { setListDisplayMode, toggleSectionHidden, useSettings } from '@/settings/store';
import { LIST_DISPLAY_MODE_LABELS } from '@/settings/labels';
import { LIST_DISPLAY_MODES } from '@/settings/defaults';
import { useTheme } from '@/theme';

import { listIcons } from './list-icons';
import { isCustomSection, sectionLabel } from './list-model';
import type { ListChoice } from './use-my-list';

export type DisplayMenuProps = {
  type: MediaType;
  lists: readonly ListChoice[];
  /** The chosen custom list's name, or null for the main list. */
  activeList: string | null;
  onSelectList: (name: string | null) => void;
};

/**
 * The leading toolbar glyph (lines with a vertical bar). As in AniClient it opens "Choose Anime
 * List": the main list ("Default") and each custom list with its entry count. Below that are the
 * display options: List / Grid, and which status chips are shown.
 */
export function DisplayMenu(props: DisplayMenuProps) {
  const theme = useTheme();
  return (
    <NativeMenu items={useDisplayMenuItems(props)}>
      <View style={styles.trigger} accessibilityRole="button" accessibilityLabel={TRIGGER_LABEL}>
        <Icon name={listIcons.sidebar} size={20} color={theme.colors.text} />
      </View>
    </NativeMenu>
  );
}

/** The same menu as a native navigation bar button (iOS native header), followed by the screen title. */
export function DisplayToolbarMenu({ title, ...props }: DisplayMenuProps & { title: string }) {
  const theme = useTheme();
  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Menu icon={listIcons.sidebar.ios} tintColor={theme.colors.text} accessibilityLabel={TRIGGER_LABEL}>
        {toolbarMenuItems(useDisplayMenuItems(props))}
      </Stack.Toolbar.Menu>
      {toolbarTitle(title)}
    </Stack.Toolbar>
  );
}

const TRIGGER_LABEL = 'Choose list and display options';

function useDisplayMenuItems({ type, lists, activeList, onSelectList }: DisplayMenuProps): MenuEntry[] {
  const { mode, order, hidden } = useSettings((s) => ({
    mode: s.listDisplayMode[type],
    order: s.listSectionOrder[type],
    hidden: s.hiddenListSections[type],
  }));
  const statusKeys = order.filter((k) => !isCustomSection(k));
  const visibleCount = statusKeys.filter((k) => !hidden.includes(k)).length;
  const mainLabel = type === 'MANGA' ? 'Manga List' : 'Anime List';

  const items: MenuEntry[] = [
    {
      kind: 'section',
      key: 'choose',
      title: type === 'MANGA' ? 'Choose Manga List' : 'Choose Anime List',
      items: lists.map((l) => ({
        key: l.name ?? '',
        title: l.name ?? mainLabel,
        subtitle: l.name ? String(l.count) : `Default · ${l.count}`,
        checked: l.name === activeList,
        onPress: () => onSelectList(l.name),
      })),
    },
    {
      kind: 'section',
      key: 'view',
      title: 'View',
      items: LIST_DISPLAY_MODES.map((m) => ({
        key: m,
        title: LIST_DISPLAY_MODE_LABELS[m],
        icon: { ios: m === 'grid' ? 'square.grid.3x2' : 'list.bullet' },
        checked: mode === m,
        onPress: () => setListDisplayMode(type, m),
      })),
    },
    {
      kind: 'section',
      key: 'lists',
      title: 'Show Lists',
      items: statusKeys.map((key) => {
        const shown = !hidden.includes(key);
        return {
          key,
          title: sectionLabel(key, type),
          checked: shown,
          // Keep at least one chip visible.
          disabled: shown && visibleCount <= 1,
          onPress: () => toggleSectionHidden(type, key, shown),
        };
      }),
    },
  ];

  return items;
}

const styles = StyleSheet.create({
  trigger: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
});
