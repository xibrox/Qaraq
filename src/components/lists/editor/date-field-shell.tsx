import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme';

import { listIcons } from '../list-icons';

export type DateFieldShellProps = {
  /** Date content (text or native picker); omit for the empty "Add Date" state. */
  children?: ReactNode;
  label: string;
  onPress?: () => void;
  onClear?: () => void;
};

/** Shared dark rounded box: [calendar] content [ⓧ]. */
export function DateFieldShell({ children, label, onPress, onClear }: DateFieldShellProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.box, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.md, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={listIcons.calendar} size={15} color={c.textSecondary} />
      <View style={styles.content}>
        {children ?? (
          <AppText variant="callout" tone="secondary">
            Add Date
          </AppText>
        )}
      </View>
      {onClear ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Clear ${label}`}>
          <Icon name={listIcons.clear} size={18} color={c.textSecondary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  content: { flex: 1, alignItems: 'flex-start' },
});
