import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaCard } from '@/api/types';
import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { InlineScore } from '@/components/media/media-score';
import { StatusDot } from '@/components/media/status-dot';
import { pickTitle } from '@/lib/title';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

type Props = { media: MediaCard; width: number; onPress: () => void };

/** "Trending Now" card: landscape banner, then small poster + title + score, status dot top-right. */
export function TrendingCard({ media, width, onPress }: Props) {
  const theme = useTheme();
  const preferred = useSetting('preferredTitle');
  const title = pickTitle(media.title, preferred);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      android_ripple={{ color: theme.colors.fillSecondary, foreground: true }}
      style={({ pressed }) => [{ width, opacity: pressed && process.env.EXPO_OS !== 'android' ? 0.75 : 1 }]}>
      <CoverImage
        uri={media.bannerImage ?? media.coverImage?.extraLarge}
        width={width}
        aspectRatio={16 / 9}
        radius={theme.radii.lg}
        isAdult={media.isAdult}
        recyclingKey={`b${media.id}`}
      />
      <View style={styles.row}>
        <CoverImage uri={media.coverImage?.large} width={36} radius={theme.radii.xs} isAdult={media.isAdult} recyclingKey={`c${media.id}`} />
        <View style={styles.texts}>
          <AppText variant="footnote" weight="700" numberOfLines={2}>
            {title}
          </AppText>
          <InlineScore score={media.averageScore} />
        </View>
        <StatusDot status={media.status} style={styles.dot} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  texts: { flex: 1, gap: 4, paddingTop: 2 },
  dot: { marginTop: 4 },
});
