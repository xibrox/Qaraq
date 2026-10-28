import type { ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { icons } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { useTheme } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function SheetBody({ title, onClose, children }: Omit<Props, 'visible'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background, paddingTop: ios ? 0 : insets.top }]}>
      {ios ? <View style={[styles.grabber, { backgroundColor: theme.colors.textTertiary }]} /> : null}
      <View style={styles.header}>
        <View style={styles.side} />
        <AppText variant="navTitle" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
        <View style={[styles.side, styles.right]}>
          <IconButton icon={icons.close} accessibilityLabel="Close" variant="circle" size={32} iconSize={14} onPress={onClose} />
        </View>
      </View>
      <View style={styles.fill}>{children}</View>
    </View>
  );
}

/**
 * Native page sheet (iOS pageSheet with swipe-to-dismiss; full-screen modal on Android) for the
 * "see all" lists on media detail: Characters, Staff, Reviews and friends' statuses.
 */
export function SheetModal({ visible, title, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <SafeAreaProvider>
        <SheetBody title={title} onClose={onClose}>
          {children}
        </SheetBody>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: 6, opacity: 0.6 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
});
