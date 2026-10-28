import { Host, Switch } from '@expo/ui/jetpack-compose';

import { useTheme } from '@/theme';

import type { NativeSwitchProps } from './native-switch-types';

export function NativeSwitch({ value, onValueChange, disabled }: NativeSwitchProps) {
  const theme = useTheme();
  return (
    <Host matchContents colorScheme={theme.scheme}>
      <Switch
        value={value}
        enabled={!disabled}
        onCheckedChange={onValueChange}
        colors={{ checkedTrackColor: theme.colors.success, checkedThumbColor: '#FFFFFF' }}
      />
    </Host>
  );
}
