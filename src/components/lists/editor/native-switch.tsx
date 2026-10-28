import { Switch } from 'react-native';

import { useTheme } from '@/theme';

import type { NativeSwitchProps } from './native-switch-types';

export function NativeSwitch({ value, onValueChange, accessibilityLabel, disabled }: NativeSwitchProps) {
  const c = useTheme().colors;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: c.success, false: c.fill }}
    />
  );
}
