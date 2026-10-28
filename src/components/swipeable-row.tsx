import { useRef, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { haptics } from '@/lib/haptics';
import { useSwipeGestures } from '@/settings/store';
import type { MediaType, SwipeAction } from '@/settings/types';
import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, icons } from './icon';

export type SwipeActionPanelProps = {
  action: SwipeAction;
  mediaType: MediaType;
  /** Which edge the panel sits on (`left` = revealed by swiping right). */
  edge: 'left' | 'right';
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The coloured block revealed behind a row: green "+1 / Episode" (or Chapter), blue
 * "Custom / List", red "Delete". Also used for the Gesture Settings previews.
 */
export function SwipeActionPanel({ action, mediaType, edge, width = 88, style }: SwipeActionPanelProps) {
  const c = useTheme().colors;
  const bg = action === 'increment' ? c.swipeIncrement : action === 'customList' ? c.swipeCustomList : c.swipeDelete;
  return (
    <View
      style={[styles.panel, { width, backgroundColor: bg, alignSelf: edge === 'left' ? 'flex-start' : 'flex-end' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {action === 'increment' ? (
        <>
          <AppText variant="title3" color="#FFFFFF" weight="800">
            +1
          </AppText>
          <AppText variant="caption1" color="#FFFFFF" weight="700">
            {mediaType === 'MANGA' ? 'Chapter' : 'Episode'}
          </AppText>
        </>
      ) : action === 'customList' ? (
        <>
          <Icon name={icons.list} size={20} color="#FFFFFF" />
          <AppText variant="caption1" color="#FFFFFF" weight="700" align="center">
            {'Custom\nList'}
          </AppText>
        </>
      ) : (
        <>
          <Icon name={icons.trash} size={20} color="#FFFFFF" />
          <AppText variant="caption1" color="#FFFFFF" weight="700">
            Delete
          </AppText>
        </>
      )}
    </View>
  );
}

export type SwipeableMediaRowProps = {
  mediaType: MediaType;
  /** Called with the configured action once a swipe passes the threshold. "Delete" must be confirmed by the caller. */
  onAction: (action: SwipeAction) => void;
  children: ReactNode;
  /** Disable gestures (e.g. guest mode, entry being saved). */
  enabled?: boolean;
  /** Distance to trigger (default 80). */
  threshold?: number;
  testID?: string;
};

/**
 * Wraps a list row with ReanimatedSwipeable, driven by Settings > Gestures for this media
 * type: swipe right = `swipe[type].right`, swipe left = `swipe[type].left`. The action fires
 * once on release past the threshold (with haptics) and the row snaps back.
 */
export function SwipeableMediaRow({ mediaType, onAction, children, enabled = true, threshold = 80, testID }: SwipeableMediaRowProps) {
  const gestures = useSwipeGestures(mediaType);
  const ref = useRef<SwipeableMethods>(null);
  const c = useTheme().colors;

  return (
    <ReanimatedSwipeable
      ref={ref}
      enabled={enabled}
      friction={1.6}
      leftThreshold={threshold}
      rightThreshold={threshold}
      overshootLeft={false}
      overshootRight={false}
      testID={testID}
      containerStyle={{ backgroundColor: c.background }}
      // The action panels sit under the row; keep an opaque layer between them and the row's
      // translucent pressed highlight, or touching a row to scroll flashes the swipe colours.
      childrenContainerStyle={{ backgroundColor: c.background }}
      renderLeftActions={() => <SwipeActionPanel action={gestures.right} mediaType={mediaType} edge="left" />}
      renderRightActions={() => <SwipeActionPanel action={gestures.left} mediaType={mediaType} edge="right" />}
      onSwipeableWillOpen={(direction) => {
        // RNGH reports RIGHT when the row translates right (left actions revealed, finger moved right).
        const action = direction === SwipeDirection.RIGHT ? gestures.right : gestures.left;
        if (action === 'delete') haptics.warning();
        else haptics.increment();
        onAction(action);
        ref.current?.close();
      }}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  panel: { height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
});
