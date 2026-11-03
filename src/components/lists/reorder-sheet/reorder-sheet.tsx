import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { IconButton } from '@/components/icon-button';
import { icons } from '@/components/icon';
import { useTheme } from '@/theme';

import { listIcons } from '../list-icons';
import { moveItems } from '../list-model';
import type { ReorderSheetProps } from './types';

/** Fallback (web, and the module TypeScript resolves): RN bottom sheet with up/down arrows per row. */
export function ReorderSheet({ visible, title, items, onReorder, onReset, onClose }: ReorderSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const move = (from: number, to: number) => onReorder(moveItems(items, [from], to).map((i) => i.key));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: c.overlay }]} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.surface, borderTopLeftRadius: theme.radii.sheet, borderTopRightRadius: theme.radii.sheet, paddingBottom: insets.bottom + 12 },
        ]}>
        <View style={[styles.grabber, { backgroundColor: c.textTertiary }]} />
        <View style={styles.header}>
          <AppText variant="subheadline" tone="secondary" weight="700" style={styles.title}>
            {title}
          </AppText>
          <IconButton icon={icons.refresh} accessibilityLabel="Reset order" onPress={onReset} />
        </View>
        <ScrollView style={[styles.card, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.xl }]}>
          {items.map((item, i) => (
            <View key={item.key} style={styles.row}>
              <AppText variant="callout" weight="600" style={styles.label}>
                {item.label}
              </AppText>
              <IconButton icon={listIcons.arrowUp} accessibilityLabel={`Move ${item.label} up`} disabled={i === 0} onPress={() => move(i, i - 1)} />
              <IconButton
                icon={listIcons.arrowDown}
                accessibilityLabel={`Move ${item.label} down`}
                disabled={i === items.length - 1}
                onPress={() => move(i, i + 2)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: { maxHeight: '70%', paddingHorizontal: 16 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: 8, opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  title: { flex: 1 },
  card: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, height: 48 },
  label: { flex: 1 },
});

export type { ReorderItem, ReorderSheetProps } from './types';
