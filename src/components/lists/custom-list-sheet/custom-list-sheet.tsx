import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { useTheme } from '@/theme';

import type { CustomListSheetProps } from './types';

/** Fallback (web, and the module TypeScript resolves): RN modal sheet with checkmark rows. */
export function CustomListSheet({ visible, title, lists, onToggle, onManage, onClose }: CustomListSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.surface, borderTopLeftRadius: theme.radii.sheet, borderTopRightRadius: theme.radii.sheet }]}>
          <View style={[styles.grabber, { backgroundColor: c.textTertiary }]} />
          <AppText variant="headline" align="center" numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="label" tone="secondary" style={styles.caption}>
            Custom Lists
          </AppText>
          <ScrollView style={styles.list}>
            {lists.map((l) => (
              <Pressable
                key={l.name}
                onPress={() => onToggle(l.name, !l.checked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: l.checked }}
                style={({ pressed }) => [styles.row, { borderBottomColor: c.separator }, pressed && { backgroundColor: c.fill }]}>
                <AppText variant="callout" style={styles.rowLabel}>
                  {l.name}
                </AppText>
                {l.checked ? <Icon name={icons.check} size={17} color={c.accent} /> : null}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onManage} style={styles.manage} accessibilityRole="button">
            <AppText variant="callout" tone="accent" weight="700">
              Manage Custom Lists
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, maxHeight: '70%' },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 12 },
  caption: { marginTop: 16, marginBottom: 4 },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1 },
  manage: { alignItems: 'center', paddingTop: 16 },
});
