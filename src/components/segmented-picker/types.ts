import type { StyleProp, ViewStyle } from 'react-native';

import type { Segment } from '@/components/segmented-switch';

/**
 * Form-style native segmented control: SwiftUI `Picker` with `.segmented` style on iOS,
 * Material 3 `SingleChoiceSegmentedButtonRow` on Android, `SegmentedSwitch` on web.
 * Use it inside content (Gesture Settings "Anime | Manga", Stats "Anime | Manga", quick
 * editor status grid rows, the header "Anime | Manga" switch). `SegmentedSwitch` is the web fallback.
 */
export type NativeSegmentedPickerProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** iOS control size; `large` matches the nav bar's Anime/Manga switch (default: system). */
  size?: 'regular' | 'large';
  /**
   * iOS: draw a capsule behind the control in SwiftUI (Liquid Glass per Toolbar Style, else the
   * flat fill), sized from the control's own bounds so it stays centred. Other platforms ignore it.
   */
  capsule?: boolean;
  /** Give it a width (or `alignSelf: 'stretch'`); height follows the native control. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
