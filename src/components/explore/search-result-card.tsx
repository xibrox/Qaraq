import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaBrowseItem } from '@/api/explore-extra';
import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { CoverImage } from '@/components/cover-image';
import { MediaGridCard } from '@/components/media-grid-card';
import { StatPill } from '@/components/stat-pill';
import { htmlToPlainText, mediaFormatLabel } from '@/components/media/media-format';
import { InlineScore, ScorePill } from '@/components/media/media-score';
import { StatusDot } from '@/components/media/status-dot';
import { pickTitle } from '@/lib/title';
import { listStatusLabel, useSetting } from '@/settings';
import { useTheme } from '@/theme';

type Props = { media: MediaBrowseItem; onPress: () => void };

const POSTER_WIDTH = 96;

const isAndroid = process.env.EXPO_OS === 'android';

/** Search/browse result card (spec §3): poster flush left, title, format, tag, description, pills. */
export function SearchResultCard({ media, onPress }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const preferred = useSetting('preferredTitle');
  const title = pickTitle(media.title, preferred);
  const listStatus = media.mediaListEntry?.status;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      android_ripple={{ color: c.fillSecondary, foreground: true }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.feedCard, borderColor: c.feedCardBorder, borderRadius: theme.radii.md, opacity: pressed && !isAndroid ? 0.8 : 1 },
      ]}>
      <CoverImage uri={media.coverImage?.large} width={POSTER_WIDTH} radius={0} isAdult={media.isAdult} recyclingKey={String(media.id)} />
      <View style={styles.body}>
        <AppText variant="title3" weight="800" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>
        <AppText variant="footnote" tone="secondary" weight="700">
          {mediaFormatLabel(media.format)}
        </AppText>
        {listStatus ? (
          <Chip label={listStatusLabel(listStatus, media.type ?? 'ANIME')} variant="tag" style={styles.tag} />
        ) : null}
        <AppText variant="caption1" tone="secondary" numberOfLines={4} style={styles.description}>
          {htmlToPlainText(media.description)}
        </AppText>
        <View style={styles.pills}>
          <ScorePill score={media.averageScore} />
          {(media.genres ?? []).slice(0, 3).map((g) => (
            <StatPill key={g} label={g} />
          ))}
        </View>
      </View>
      <StatusDot status={media.status} style={styles.dot} />
    </Pressable>
  );
}

/** Grid mode ("≡ Type" > Grid): poster with title and inline score. */
export function SearchResultGridCard({ media, width, onPress }: Props & { width: number }) {
  const preferred = useSetting('preferredTitle');
  return (
    <MediaGridCard
      title={pickTitle(media.title, preferred)}
      coverUrl={media.coverImage?.large}
      isAdult={media.isAdult}
      width={width}
      recyclingKey={String(media.id)}
      topRight={<StatusDot status={media.status} />}
      bottom={
        media.averageScore ? (
          <View style={styles.gridScore}>
            <InlineScore score={media.averageScore} />
          </View>
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden', minHeight: POSTER_WIDTH * 1.5 },
  body: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  title: { paddingRight: 12 },
  tag: { alignSelf: 'flex-start', marginTop: 3 },
  description: { marginTop: 4 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 'auto', paddingTop: 8, overflow: 'hidden' },
  dot: { position: 'absolute', top: 10, right: 10 },
  gridScore: {
    alignSelf: 'flex-start',
    margin: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
});
