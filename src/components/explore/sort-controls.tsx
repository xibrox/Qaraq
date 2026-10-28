import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useTheme } from '@/theme';

const BARS: IconName = { ios: 'line.3.horizontal.decrease', android: 'sort' };
const ARROW_DOWN: IconName = { ios: 'arrow.down', android: 'arrow_downward' };
const ARROW_UP: IconName = { ios: 'arrow.up', android: 'arrow_upward' };
/** iOS has no funnel-with-slash symbol: an outlined filter circle gets a drawn slash. Android has `filter_alt_off`. */
const FILTER: IconName = { ios: 'line.3.horizontal.decrease.circle', android: 'filter_alt_off' };

/** Sort direction toggle (spec §3): decreasing bars with ↓ (descending) or ↑ (ascending). */
export function SortDirectionButton({ direction, onPress }: { direction: 'asc' | 'desc'; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={direction === 'desc' ? 'Descending, switch to ascending' : 'Ascending, switch to descending'}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={styles.direction}>
        <Icon name={BARS} size={15} color={c.text} />
        <Icon name={direction === 'desc' ? ARROW_DOWN : ARROW_UP} size={13} color={c.text} weight="bold" />
      </View>
    </Pressable>
  );
}

/** Clear filters (spec §3): an outlined funnel with a slash. */
export function ClearFiltersButton({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel="Clear filters"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      <Icon name={FILTER} size={19} color={c.text} />
      {Platform.OS === 'ios' ? (
        <View pointerEvents="none" style={[styles.slash, { backgroundColor: c.text, borderColor: c.background }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  direction: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  slash: {
    position: 'absolute',
    width: 2.5,
    height: 25,
    borderRadius: 1.5,
    borderWidth: 0.75,
    transform: [{ rotate: '-45deg' }],
  },
});
