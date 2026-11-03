import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { background, controlSize, disabled as disabledModifier, glassEffect, padding, pickerStyle, shapes, tag } from '@expo/ui/swift-ui/modifiers';

import { CAN_LIQUID_GLASS } from '@/lib/glass';
import { haptics } from '@/lib/haptics';
import { useToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useTheme } from '@/theme';

import type { NativeSegmentedPickerProps } from './types';

/** SwiftUI segmented `Picker` (Liquid Glass on iOS 26). */
export function NativeSegmentedPicker<T extends string>({ segments, value, onChange, disabled, size, capsule, style, testID }: NativeSegmentedPickerProps<T>) {
  const theme = useTheme();
  const appearance = useToolbarAppearance();
  const capsuleModifiers = capsule
    ? [
        // The control's visible track sits ~1.3pt below its layout frame, so pad more underneath
        // for an even 3pt band all round (measured against the nav bar's Anime/Manga switch).
        padding({ top: 3.33, bottom: 4.67, leading: 3, trailing: 3 }),
        CAN_LIQUID_GLASS && appearance === 'liquidGlass'
          ? glassEffect({ glass: { variant: 'regular' }, shape: 'capsule' })
          : background(appearance === 'translucent' ? theme.colors.barBackground : theme.colors.field, shapes.capsule()),
      ]
    : [];
  return (
    <Host matchContents={{ vertical: true }} style={style} colorScheme={theme.scheme} testID={testID}>
      <Picker
        selection={value}
        onSelectionChange={(v: T) => {
          if (v === value) return;
          haptics.selection();
          onChange(v);
        }}
        modifiers={[pickerStyle('segmented'), ...(size ? [controlSize(size)] : []), ...(disabled ? [disabledModifier(true)] : []), ...capsuleModifiers]}>
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
