import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { NativeMenu, choiceItems } from '@/components/menu/native-menu';
import type { MediaType } from '@/api/types';
import { haptics } from '@/lib/haptics';
import { LIST_SORT_FIELDS } from '@/settings/defaults';
import { LIST_SORT_FIELD_LABELS } from '@/settings/labels';
import { setListSort, useSettings } from '@/settings/store';
import { useTheme } from '@/theme';

import { listIcons } from './list-icons';

export type ListInfoRowProps = {
  type: MediaType;
  /** Entries shown in the selected section ("22", "184"). */
  count: number;
};

/** Info row under the chips: count badge, "⬍ Last Updated" sort pill and the sort-direction button. */
export function ListInfoRow({ type, count }: ListInfoRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const sort = useSettings((s) => s.listSort[type]);
  const options = LIST_SORT_FIELDS.map((f) => ({ value: f, label: LIST_SORT_FIELD_LABELS[f] }));
  const desc = sort.direction === 'desc';

  return (
    <View style={styles.row}>
      <View style={[styles.count, { backgroundColor: c.chipFill, borderRadius: theme.radii.md }]}>
        <AppText variant="subheadline" weight="700" accessibilityLabel={`${count} entries`}>
          {String(count)}
        </AppText>
      </View>
      <View style={styles.spacer} />
      <NativeMenu title="Sort By" items={choiceItems(options, sort.field, (field) => setListSort(type, { ...sort, field }))}>
        <View style={[styles.pill, { backgroundColor: c.chipFill, borderRadius: theme.radii.lg }]} accessibilityRole="button">
          <Icon name={listIcons.sortPill} size={13} color={c.text} />
          <AppText variant="chip">{LIST_SORT_FIELD_LABELS[sort.field]}</AppText>
        </View>
      </NativeMenu>
      <Pressable
        onPress={() => {
          haptics.selection();
          setListSort(type, { ...sort, direction: desc ? 'asc' : 'desc' });
        }}
        accessibilityRole="button"
        accessibilityLabel={desc ? 'Sorted descending' : 'Sorted ascending'}
        hitSlop={4}
        style={({ pressed }) => [styles.direction, { backgroundColor: c.chipFill, opacity: pressed ? 0.6 : 1 }]}>
        <Icon name={listIcons.bars} size={14} color={c.text} />
        <Icon name={desc ? listIcons.arrowDown : listIcons.arrowUp} size={11} color={c.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  count: { minWidth: 36, height: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  pill: { height: 36, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  direction: { width: 36, height: 36, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 },
});
