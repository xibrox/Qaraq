import type { StyleProp, ViewStyle } from 'react-native';

import type { Segment } from '@/components/segmented-switch';

/**
 * Form-style native segmented control: SwiftUI `Picker` with `.segmented` style on iOS,
 * Material 3 `SingleChoiceSegmentedButtonRow` on Android, `SegmentedSwitch` on web.
 * Use it inside content (Gesture Settings "Anime | Manga", Stats "Anime | Manga", quick
 * editor status grid rows). The compact header switch is `MediaTypeSwitch` / `SegmentedSwitch`.
 */
export type NativeSegmentedPickerProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Give it a width (or `alignSelf: 'stretch'`); height follows the native control. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
