import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NativeMenu, type MenuEntry } from '@/components/menu/native-menu';
import type { MediaType } from '@/api/types';
import { setListDisplayMode, toggleSectionHidden, useSettings } from '@/settings/store';
import { LIST_DISPLAY_MODE_LABELS } from '@/settings/labels';
import { LIST_DISPLAY_MODES } from '@/settings/defaults';
import { useTheme } from '@/theme';

import { listIcons } from './list-icons';
import { sectionLabel } from './list-model';

export type DisplayMenuProps = { type: MediaType };

/**
 * The leading toolbar glyph (lines with a vertical bar). Its AniClient function is unseen, so it
 * holds the list display options: List / Grid, and which chips are shown.
 */
export function DisplayMenu({ type }: DisplayMenuProps) {
  const theme = useTheme();
  const { mode, order, hidden } = useSettings((s) => ({
    mode: s.listDisplayMode[type],
    order: s.listSectionOrder[type],
    hidden: s.hiddenListSections[type],
  }));
  const visibleCount = order.length - order.filter((k) => hidden.includes(k)).length;

  const items: MenuEntry[] = [
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
      items: order.map((key) => {
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

  return (
    <NativeMenu items={items} title="Display">
      <View style={styles.trigger} accessibilityRole="button" accessibilityLabel="Display options">
        <Icon name={listIcons.sidebar} size={20} color={theme.colors.text} />
      </View>
    </NativeMenu>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
});
