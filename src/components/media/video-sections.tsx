import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { MediaStreamingEpisode, MediaTrailer } from '@/api/types';
import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { Icon } from '@/components/icon';
import { MediaCarousel } from '@/components/media-carousel';
import { SectionHeader } from '@/components/section-header';
import { useTheme } from '@/theme';

import { trailerThumbnail, trailerUrl } from './media-format';
import { mediaIcons } from './media-icons';

const open = (url: string | null | undefined) => {
  if (url) WebBrowser.openBrowserAsync(url).catch(() => undefined);
};

function PlayBadge({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.play, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={mediaIcons.play} size={size * 0.42} color="#FFFFFF" />
    </View>
  );
}

/** "Trailer": YouTube thumbnail with a play button; opens in the in-app browser. */
export function TrailerSection({ trailer }: { trailer: MediaTrailer | null | undefined }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const url = trailerUrl(trailer);
  if (!url) return null;
  return (
    <View>
      <SectionHeader title="Trailer" tone="muted" inset={12} style={styles.header} />
      <Pressable onPress={() => open(url)} accessibilityRole="button" accessibilityLabel="Play trailer" style={styles.trailer}>
        <CoverImage uri={trailerThumbnail(trailer)} width={width - 24} aspectRatio={16 / 9} radius={theme.radii.lg} />
        <View style={styles.center} pointerEvents="none">
          <PlayBadge size={52} />
        </View>
      </Pressable>
    </View>
  );
}

/** "Episodes": 16:9 streaming thumbnails (Crunchyroll etc.) with titles. */
export function EpisodesSection({ episodes }: { episodes: (MediaStreamingEpisode | null)[] | null | undefined }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const items = (episodes ?? []).filter((e): e is MediaStreamingEpisode => !!e?.url);
  if (!items.length) return null;
  const cardWidth = Math.round((width - 24) * 0.68);
  return (
    <View>
      <SectionHeader title="Episodes" tone="muted" inset={12} style={styles.header} />
      <MediaCarousel
        data={items}
        keyExtractor={(e, i) => `${i}-${e.url}`}
        itemWidth={cardWidth}
        gap={8}
        inset={12}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item.url)}
            accessibilityRole="button"
            accessibilityLabel={item.title ?? 'Episode'}
            style={({ pressed }) => ({ width: cardWidth, opacity: pressed ? 0.75 : 1 })}>
            <View>
              <CoverImage uri={item.thumbnail} width={cardWidth} aspectRatio={16 / 9} radius={theme.radii.md} />
              <View style={styles.center} pointerEvents="none">
                <PlayBadge />
              </View>
              {item.site ? (
                <View style={styles.site}>
                  <AppText variant="caption2" color="#FFFFFF">
                    {item.site}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="footnote" weight="600" numberOfLines={2} style={styles.episodeTitle}>
              {item.title ?? ''}
            </AppText>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  trailer: { marginHorizontal: 12 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  play: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  site: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.7)' },
  episodeTitle: { marginTop: 6 },
});
