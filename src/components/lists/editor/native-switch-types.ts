/** Native on/off control (SwiftUI Toggle on iOS, Material 3 Switch on Android, RN Switch on web). */
export type NativeSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Spoken label (the visible label is drawn by the row). */
  accessibilityLabel: string;
  disabled?: boolean;
};
