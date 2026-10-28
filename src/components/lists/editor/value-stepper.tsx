import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { listIcons } from '../list-icons';

export type ValueStepperProps = {
  value: number;
  /** Display text for the value box (defaults to the number). */
  display?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Makes the value box a numeric text field; called with the parsed number on submit/blur. */
  onSubmitValue?: (value: number) => void;
  /** Allow decimals in the text field (10 Point Decimal scores). */
  decimal?: boolean;
  canDecrement?: boolean;
  canIncrement?: boolean;
  /** Spoken name ("Episodes"). */
  accessibilityLabel: string;
};

/** The quick editor stepper: [−] [ value ] [+], 44pt square buttons and a ~95pt value box. */
export function ValueStepper({
  value,
  display,
  onDecrement,
  onIncrement,
  onSubmitValue,
  decimal,
  canDecrement = true,
  canIncrement = true,
  accessibilityLabel,
}: ValueStepperProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [editing, setEditing] = useState<string | null>(null);
  const text = display ?? String(value);
  const box = [styles.box, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.md }];

  const commit = () => {
    if (editing == null) return;
    const parsed = Number(editing.replace(',', '.'));
    setEditing(null);
    if (Number.isFinite(parsed) && onSubmitValue) onSubmitValue(parsed);
  };

  const button = (kind: 'minus' | 'plus') => {
    const enabled = kind === 'minus' ? canDecrement : canIncrement;
    return (
      <Pressable
        onPress={() => {
          haptics.selection();
          if (kind === 'minus') onDecrement();
          else onIncrement();
        }}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={`${kind === 'minus' ? 'Decrease' : 'Increase'} ${accessibilityLabel}`}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.md, opacity: !enabled ? 0.35 : pressed ? 0.6 : 1 },
        ]}>
        <Icon name={kind === 'minus' ? listIcons.minus : listIcons.plus} size={18} color={c.text} />
      </Pressable>
    );
  };

  return (
    <View style={styles.row} accessibilityLabel={`${accessibilityLabel} ${text}`}>
      {button('minus')}
      {onSubmitValue ? (
        <TextInput
          value={editing ?? text}
          onFocus={() => setEditing(value > 0 ? String(value) : '')}
          onChangeText={setEditing}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          returnKeyType="done"
          selectTextOnFocus
          selectionColor={c.accent}
          keyboardAppearance={theme.dark ? 'dark' : 'light'}
          accessibilityLabel={accessibilityLabel}
          style={[box, styles.input, { color: c.text, fontFamily: theme.fontFamily }]}
        />
      ) : (
        <View style={box}>
          <AppText variant="headline">{text}</AppText>
        </View>
      )}
      {button('plus')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { width: 95, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { textAlign: 'center', fontSize: 17, fontWeight: '700', padding: 0 },
});
