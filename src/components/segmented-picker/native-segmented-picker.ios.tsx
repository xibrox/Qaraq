import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import type { NativeSegmentedPickerProps } from './types';

/** SwiftUI segmented `Picker` (Liquid Glass on iOS 26). */
export function NativeSegmentedPicker<T extends string>({ segments, value, onChange, disabled, style, testID }: NativeSegmentedPickerProps<T>) {
  const theme = useTheme();
  return (
    <Host matchContents={{ vertical: true }} style={style} colorScheme={theme.scheme} testID={testID}>
      <Picker
        selection={value}
        onSelectionChange={(v: T) => {
          if (v === value) return;
          haptics.selection();
          onChange(v);
        }}
        modifiers={[pickerStyle('segmented'), ...(disabled ? [disabledModifier(true)] : [])]}>
        {segments.map((s) => (
          <Text key={s.value} modifiers={[tag(s.value)]}>
            {s.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}

export type { NativeSegmentedPickerProps } from './types';
