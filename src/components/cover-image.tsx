import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ADULT_BLUR_RADIUS, shouldBlur } from '@/lib/adult';
import { useSettings } from '@/settings/store';
import { COVER_ASPECT_RATIO, useTheme } from '@/theme';

export type CoverImageProps = {
  uri: string | null | undefined;
  /** Width in points; height follows the 2:3 cover ratio unless `height`/`aspectRatio` is set. */
  width?: number;
  height?: number;
  /** Override the ratio (width / height), e.g. 16 / 9 for banners. */
  aspectRatio?: number;
  /** Corner radius (default theme cover radius, 6). */
  radius?: number;
  /** AniList `isAdult`: blurred when "Blur 18+ Content" is on. */
  isAdult?: boolean | null;
  contentFit?: ImageContentFit;
  /** Stable key for list recycling (media id). */
  recyclingKey?: string;
  priority?: 'low' | 'normal' | 'high';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cover/poster/banner image (expo-image): placeholder fill, fade-in (AniClient renders text
 * first and fades covers in), disk cache, and 18+ blur honouring the setting.
 */
export function CoverImage({
  uri,
  width,
  height,
  aspectRatio = COVER_ASPECT_RATIO,
  radius,
  isAdult,
  contentFit = 'cover',
  recyclingKey,
  priority,
  accessibilityLabel,
  style,
}: CoverImageProps) {
  const theme = useTheme();
  const adult = useSettings((s) => ({ showAdultContent: s.showAdultContent, blurAdultContent: s.blurAdultContent }));
  const blur = shouldBlur({ isAdult }, adult);
  const r = radius ?? theme.radii.cover;
  const size: ViewStyle =
    width != null && height != null
      ? { width, height }
      : width != null
        ? { width, height: width / aspectRatio }
        : { width: '100%', aspectRatio };

  return (
    <View style={[size, { borderRadius: r, backgroundColor: theme.colors.skeleton, overflow: 'hidden' }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={180}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          priority={priority}
          blurRadius={blur ? ADULT_BLUR_RADIUS : 0}
          accessibilityLabel={accessibilityLabel}
          accessible={!!accessibilityLabel}
        />
      ) : null}
    </View>
  );
}
