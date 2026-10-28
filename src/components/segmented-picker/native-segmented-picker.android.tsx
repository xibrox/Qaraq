import { Host, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import type { NativeSegmentedPickerProps } from './types';

/** Material 3 single-choice segmented button row, coloured from the accent. */
export function NativeSegmentedPicker<T extends string>({ segments, value, onChange, disabled, style, testID }: NativeSegmentedPickerProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Host matchContents={{ vertical: true }} style={style} colorScheme={theme.scheme}>
      <SingleChoiceSegmentedButtonRow modifiers={testID ? [fillMaxWidth(), testIDModifier(testID)] : [fillMaxWidth()]}>
        {segments.map((s) => (
          <SegmentedButton
            key={s.value}
            selected={s.value === value}
            enabled={!disabled}
            onClick={() => {
              if (s.value === value) return;
              haptics.selection();
              onChange(s.value);
            }}
            colors={{
              activeContainerColor: c.accent,
              activeContentColor: c.onAccent,
              activeBorderColor: c.accent,
              inactiveContainerColor: c.chipFill,
              inactiveContentColor: c.text,
              inactiveBorderColor: c.chipBorder,
            }}>
            <SegmentedButton.Label>
              <Text>{s.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}

export type { NativeSegmentedPickerProps } from './types';
