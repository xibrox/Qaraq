import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

import { NativeSwitch } from './native-switch';

export type ToggleRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/** Card row with a native switch ("Private", "Hide from status lists"). */
export function ToggleRow({ title, subtitle, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.xl }]}>
      <View style={styles.texts}>
        <AppText variant="callout" weight="600">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <NativeSwitch value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 52 },
  texts: { flex: 1, gap: 2 },
});
