import { Host, Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/theme';

import type { NativeSwitchProps } from './native-switch-types';

export function NativeSwitch({ value, onValueChange, accessibilityLabel, disabled }: NativeSwitchProps) {
  const theme = useTheme();
  return (
    <Host matchContents colorScheme={theme.scheme}>
      <Toggle
        isOn={value}
        label={accessibilityLabel}
        onIsOnChange={onValueChange}
        modifiers={[labelsHidden(), tint(theme.colors.success), ...(disabled ? [disabledModifier(true)] : [])]}
      />
    </Host>
  );
}
