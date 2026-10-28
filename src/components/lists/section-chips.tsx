import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NativeMenu } from '@/components/menu/native-menu';
import { StatusChipRow } from '@/components/status-chip-row';
import type { ListSectionKey } from '@/settings/types';
import { useTheme } from '@/theme';

import { listIcons } from './list-icons';
import type { ListSection } from './use-my-list';

export type SectionChipsProps = {
  sections: readonly ListSection[];
  selected: ListSectionKey | null;
  onSelect: (key: ListSectionKey) => void;
};

/**
 * Status chips ("Watching" … "Dropped", then custom lists) with the circular "⇄" button at the
 * end, which opens a quick switcher listing every list with its count.
 */
export function SectionChips({ sections, selected, onSelect }: SectionChipsProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <StatusChipRow
      items={sections}
      selectedKey={selected}
      onSelect={onSelect}
      trailing={
        <NativeMenu
          title="Switch List"
          items={sections.map((s) => ({
            key: s.key,
            title: s.label,
            subtitle: String(s.count),
            checked: s.key === selected,
            onPress: () => onSelect(s.key),
          }))}>
          <View style={[styles.swap, { backgroundColor: c.chipFill, borderColor: c.chipBorder }]} accessibilityRole="button" accessibilityLabel="Switch list">
            <Icon name={listIcons.swap} size={16} color={c.text} />
          </View>
        </NativeMenu>
      }
    />
  );
}

const styles = StyleSheet.create({
  swap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
