import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { SwipeActionPanel } from '@/components/swipeable-row';
import type { MediaType, SwipeAction, SwipeDirection } from '@/settings/types';
import { useTheme } from '@/theme';

export type GesturePreviewProps = {
  mediaType: MediaType;
  /** `right`: panel on the left edge with "›››"; `left`: "‹‹‹" with the panel on the right edge. */
  direction: SwipeDirection;
  action: SwipeAction;
};

const PANEL_WIDTH = 90;

/**
 * Gesture Settings preview: a mock list row with the revealed action block, e.g. green
 * "+1 / Episode" with "›››" for Swipe Right, "‹‹‹" with blue "Custom / List" for Swipe Left.
 * Cross-fades when the media type or action changes.
 */
export function GesturePreview({ mediaType, direction, action }: GesturePreviewProps) {
  const theme = useTheme();
  const c = theme.colors;
  const right = direction === 'right';
  const arrows = (
    <AppText variant="title1" weight="800" style={styles.arrows} accessibilityElementsHidden>
      {right ? '›››' : '‹‹‹'}
    </AppText>
  );
  return (
    <View style={styles.card}>
      <Animated.View
        key={`${mediaType}-${action}`}
        entering={FadeIn.duration(220)}
        style={[styles.track, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.md }]}
        accessible
        accessibilityLabel={`Swipe ${direction} preview`}>
        {right ? (
          <>
            <SwipeActionPanel action={action} mediaType={mediaType} edge="left" width={PANEL_WIDTH} style={styles.panel} />
            <View style={[styles.arrowArea, styles.arrowAreaEnd]}>{arrows}</View>
          </>
        ) : (
          <>
            <View style={[styles.arrowArea, styles.arrowAreaStart]}>{arrows}</View>
            <SwipeActionPanel action={action} mediaType={mediaType} edge="right" width={PANEL_WIDTH} style={styles.panel} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent: the preview sits on the section card's own surface, sharing it with the picker row.
  card: { paddingVertical: 10 },
  track: { height: 114, flexDirection: 'row', overflow: 'hidden' },
  panel: { height: '100%' },
  arrowArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  arrowAreaEnd: { alignItems: 'flex-end' },
  arrowAreaStart: { alignItems: 'flex-start' },
  // Tight chevrons on iOS; Android's text shaping overlaps Nunito 800 glyphs at negative spacing.
  arrows: { letterSpacing: Platform.OS === 'android' ? 1 : -4 },
});
