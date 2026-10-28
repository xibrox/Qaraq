import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';

export type EditorFieldProps = {
  /** "Status:", "Episodes:"… */
  label: string;
  /** Right-aligned summary ("1 / 1", "★9.5/10"). */
  value?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A labelled block of the entry editor: bold label on the left, summary on the right, control below. */
export function EditorField({ label, value, children, style }: EditorFieldProps) {
  return (
    <View style={[styles.field, style]}>
      <View style={styles.head}>
        <AppText variant="value" style={styles.label}>
          {label}
        </AppText>
        {typeof value === 'string' ? (
          <AppText variant="label" tone="secondary">
            {value}
          </AppText>
        ) : (
          value
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  label: { flex: 1 },
});
