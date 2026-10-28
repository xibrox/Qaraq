import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { CoverImage } from './cover-image';

export type MediaGridCardProps = {
  title: string;
  coverUrl?: string | null;
  isAdult?: boolean | null;
  /** Card width; the cover is 2:3. Omit inside a flex grid cell to fill the width. */
  width?: number;
  /** Lines of title under the cover (default 2). */
  titleLines?: number;
  /** Small gray line under the title (role, "Episode 4", score). */
  subtitle?: string;
  /** Overlay in the cover's top-left (e.g. media-type badge on Related). */
  topLeft?: ReactNode;
  /** Overlay in the cover's top-right (e.g. relation pill "Alternative"). */
  topRight?: ReactNode;
  /** Overlay pinned to the cover bottom (e.g. progress). */
  bottom?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  recyclingKey?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Poster card: cover with optional overlays and a 2-line truncated title underneath. */
export function MediaGridCard({
  title,
  coverUrl,
  isAdult,
  width,
  titleLines = 2,
  subtitle,
  topLeft,
  topRight,
  bottom,
  onPress,
  onLongPress,
  recyclingKey,
  style,
  testID,
}: MediaGridCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.75 : 1 }, style]}>
      <View>
        <CoverImage uri={coverUrl} width={width} isAdult={isAdult} radius={theme.radii.md} recyclingKey={recyclingKey} />
        {topLeft ? <View style={[styles.overlay, styles.topLeft]}>{topLeft}</View> : null}
        {topRight ? <View style={[styles.overlay, styles.topRight]}>{topRight}</View> : null}
        {bottom ? <View style={[styles.overlay, styles.bottom]}>{bottom}</View> : null}
      </View>
      <AppText variant="footnote" weight="700" numberOfLines={titleLines} style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption1" tone="secondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute' },
  topLeft: { top: 6, left: 6 },
  topRight: { top: 6, right: 6 },
  bottom: { left: 0, right: 0, bottom: 0 },
  title: { marginTop: 6 },
});
