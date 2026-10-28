import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type AvatarProps = {
  uri?: string | null;
  /** Used for the fallback initial and accessibility. */
  name?: string | null;
  size?: number;
  /** `circle` (default) or `rounded` (small square avatars on feed cards). */
  shape?: 'circle' | 'rounded';
  /** Ring around the avatar (Profile header uses a black ring). */
  ringColor?: string;
  ringWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** User / character / staff avatar with an initial fallback. */
export function Avatar({ uri, name, size = 40, shape = 'circle', ringColor, ringWidth = 3, style }: AvatarProps) {
  const theme = useTheme();
  const radius = shape === 'circle' ? size / 2 : Math.max(4, size * 0.18);
  const ring = ringColor ? ringWidth : 0;
  return (
    <View
      style={[
        {
          width: size + ring * 2,
          height: size + ring * 2,
          borderRadius: radius + ring,
          padding: ring,
          backgroundColor: ringColor ?? 'transparent',
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name ?? undefined}>
      <View style={[styles.inner, { borderRadius: radius, backgroundColor: theme.colors.surfaceElevated }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} cachePolicy="memory-disk" />
        ) : (
          <AppText variant="headline" tone="secondary" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
            {(name ?? '?').trim().charAt(0).toUpperCase()}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
