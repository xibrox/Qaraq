import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { COVER_ASPECT_RATIO, useTheme } from '@/theme';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block. */
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.45, { duration: 800 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton }, animated, style]}
    />
  );
}

/** Placeholder for a `MediaListRow`. */
export function MediaRowSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.row, { height: theme.sizes.listRow }]}>
      <Skeleton width={theme.sizes.listCoverWidth} height={theme.sizes.listCoverHeight} radius={theme.radii.xs} />
      <View style={styles.rowBody}>
        <Skeleton width="80%" height={15} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

/** Placeholder for a `MediaGridCard`. */
export function MediaCardSkeleton({ width = 120 }: { width?: number }) {
  return (
    <View style={{ width, gap: 6 }}>
      <Skeleton width={width} height={width / COVER_ASPECT_RATIO} radius={8} />
      <Skeleton width={width * 0.85} height={11} />
      <Skeleton width={width * 0.55} height={11} />
    </View>
  );
}

/** A column of row skeletons for list screens. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <MediaRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  rowBody: { flex: 1, gap: 8 },
});
