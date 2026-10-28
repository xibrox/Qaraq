import { Image } from 'expo-image';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { icons } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { ADULT_BLUR_RADIUS, shouldBlur } from '@/lib/adult';
import { useSettings } from '@/settings';

type Props = {
  visible: boolean;
  uri: string | null | undefined;
  isAdult?: boolean | null;
  onClose: () => void;
};

/** Full-screen cover viewer with an "X" close button; pinch to zoom on iOS (spec 00:26.9). */
export function CoverViewer({ visible, uri, isAdult, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const adult = useSettings((s) => ({ showAdultContent: s.showAdultContent, blurAdultContent: s.blurAdultContent }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.center}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width, height: height * 0.85 }}
              contentFit="contain"
              transition={150}
              blurRadius={shouldBlur({ isAdult }, adult) ? ADULT_BLUR_RADIUS : 0}
              accessibilityLabel="Cover image"
            />
          ) : null}
        </ScrollView>
        <IconButton
          icon={icons.close}
          variant="glass"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.close, { top: insets.top + 8 }]}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: 16 },
});
