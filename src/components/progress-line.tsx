import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { useTheme } from '@/theme';

export type ProgressLineProps = {
  /** Visible while true (list reloading). */
  active: boolean;
  color?: string;
};

/** Thin indeterminate line under the header while a list reloads (spec 00:53.9). */
export function ProgressLine({ active, color }: ProgressLineProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!active || width === 0) return;
    x.set(0);
    x.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, false));
    return () => cancelAnimation(x);
  }, [active, width, x]);

  const bar = useAnimatedStyle(() => ({
    transform: [{ translateX: -width * 0.35 + x.get() * width * 1.35 }],
  }));

  return (
    <View
      style={[styles.track, { opacity: active ? 1 : 0 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden={!active}
      accessibilityLabel={active ? 'Loading' : undefined}>
      <Animated.View style={[styles.bar, { width: width * 0.35, backgroundColor: color ?? theme.colors.accent }, bar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 2, overflow: 'hidden' },
  bar: { height: 2, borderRadius: 1 },
});
