import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { mediaIcons } from '@/components/media/media-icons';
import { useTheme } from '@/theme';

import type { SortSheetProps } from './types';

/** Fallback (web, and the module TypeScript resolves): RN bottom sheet with the same layout. */
export function SortSheet<T extends string>({ visible, title, options, selected, onSelect, onClear, onClose }: SortSheetProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
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
          <IconButton icon={mediaIcons.eraser} accessibilityLabel="Clear sort" onPress={onClear} />
        </View>
        <ScrollView style={[styles.card, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.xl }]}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: o.value === selected }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.fill }]}>
              <Icon name={o.value === selected ? mediaIcons.radioOn : mediaIcons.radioOff} size={20} color={c.text} />
              <AppText variant="callout" weight="600">
                {o.label}
              </AppText>
            </Pressable>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 46 },
});

export type { SortSheetOption, SortSheetProps } from './types';
