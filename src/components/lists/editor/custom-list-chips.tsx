import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { icons } from '@/components/icon';
import { haptics } from '@/lib/haptics';

export type CustomListChipsProps = {
  names: readonly string[];
  selected: readonly string[];
  onChange: (selected: string[]) => void;
};

/** Custom list membership as toggle chips (selected = accent fill with a check). */
export function CustomListChips({ names, selected, onChange }: CustomListChipsProps) {
  return (
    <View style={styles.wrap}>
      {names.map((name) => {
        const on = selected.includes(name);
        return (
          <Chip
            key={name}
            label={name}
            selected={on}
            icon={on ? icons.check : icons.plus}
            size="sm"
            accessibilityLabel={`${on ? 'Remove from' : 'Add to'} ${name}`}
            onPress={() => {
              haptics.selection();
              onChange(on ? selected.filter((n) => n !== name) : [...selected, name]);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
