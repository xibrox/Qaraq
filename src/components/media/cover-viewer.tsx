import { Image } from 'expo-image';
import { useState } from 'react';
import { Animated, Modal, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
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

/** Image movement (pt; the bounce moves it ~half the finger distance) or release speed (pt/ms) that dismisses the viewer. */
const DISMISS_DISTANCE = 60;
const DISMISS_VELOCITY = 1.2;

/**
 * Full-screen image viewer (posters, banners, avatars): pinch to zoom, "X" to close, or swipe the
 * image up or down to dismiss it. The swipe is the zoom scroll view's own bounce at 1x, so it
 * stays native; the backdrop fades as the image is dragged away.
 */
export function CoverViewer({ visible, uri, isAdult, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const adult = useSettings((s) => ({ showAdultContent: s.showAdultContent, blurAdultContent: s.blurAdultContent }));
  // Created once (state, not a ref: render may read it).
  const [anim] = useState(() => {
    const dragY = new Animated.Value(0);
    return {
      onScroll: Animated.event([{ nativeEvent: { contentOffset: { y: dragY } } }], { useNativeDriver: true }),
      backdropOpacity: (half: number) =>
        dragY.interpolate({ inputRange: [-half, 0, half], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }),
    };
  });

  const onEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Zoomed in, a drag pans the image instead.
    if ((e.nativeEvent.zoomScale ?? 1) > 1.01) return;
    const y = e.nativeEvent.contentOffset.y;
    const v = e.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(y) > DISMISS_DISTANCE || Math.abs(v) > DISMISS_VELOCITY) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim.backdropOpacity(height / 2) }]} />
        <Animated.ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          alwaysBounceVertical
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={anim.onScroll}
          onScrollEndDrag={onEndDrag}
          contentContainerStyle={styles.center}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width, height: height * 0.85 }}
              contentFit="contain"
              transition={150}
              blurRadius={shouldBlur({ isAdult }, adult) ? ADULT_BLUR_RADIUS : 0}
              accessibilityLabel="Image"
              accessibilityHint="Swipe up or down to close"
            />
          ) : null}
        </Animated.ScrollView>
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
  root: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.94)' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: 16 },
});
