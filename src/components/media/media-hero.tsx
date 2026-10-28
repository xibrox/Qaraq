import { Image } from 'expo-image';
import { Fragment } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FollowingListEntry, MediaDetail } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { CoverImage } from '@/components/cover-image';
import { Icon, icons } from '@/components/icon';
import { humanizeIn } from '@/components/lists/list-model';
import { ADULT_BLUR_RADIUS, shouldBlur } from '@/lib/adult';
import { nowSeconds } from '@/lib/format';
import { allTitles, pickTitle } from '@/lib/title';
import { useSetting, useSettings } from '@/settings';
import { useTheme } from '@/theme';

import { mediaFormatLabel, mediaStatusLabel, seasonLabel, unitLabel } from './media-format';
import { mediaIcons } from './media-icons';
import { ScorePill } from './media-score';
import { StatusDot } from './status-dot';

export const HERO_BANNER_HEIGHT = 230;
const COVER_WIDTH = 112;

type Props = {
  media: MediaDetail;
  following: FollowingListEntry[];
  onCoverPress: () => void;
  onFriendsPress: () => void;
  onGenrePress: (genre: string) => void;
};

/** Blurred banner fading to black, glowing cover, title, meta line, score pill, friends, genres. */
export function MediaHero({ media, following, onCoverPress, onFriendsPress, onGenrePress }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const preferred = useSetting('preferredTitle');
  const adult = useSettings((s) => ({ showAdultContent: s.showAdultContent, blurAdultContent: s.blurAdultContent }));
  const title = pickTitle(media.title, preferred);
  const banner = media.bannerImage ?? media.coverImage?.extraLarge;
  const glow = media.coverImage?.color ?? '#7FD3E6';
  const bannerHeight = HERO_BANNER_HEIGHT + insets.top;

  const when = media.season ? `${seasonLabel(media.season)} ${media.seasonYear ?? ''}`.trim() : media.startDate?.year ? String(media.startDate.year) : '';
  const next = media.nextAiringEpisode;

  const showTitles = () => {
    const titles = allTitles(media.title, media.synonyms);
    Alert.alert('Titles', titles.join('\n') || title);
  };

  return (
    <View>
      <View style={[styles.banner, { height: bannerHeight }]}>
        {banner ? (
          <Image
            source={{ uri: banner }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            blurRadius={shouldBlur(media, adult) ? ADULT_BLUR_RADIUS : 6}
          />
        ) : null}
        <View
          style={[StyleSheet.absoluteFill, { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, ${c.background}CC 70%, ${c.background} 100%)` }]}
        />
      </View>
      <View style={[styles.top, { paddingTop: insets.top + 110 }]}>
        <Pressable onPress={onCoverPress} accessibilityRole="imagebutton" accessibilityLabel="View cover">
          <CoverImage
            uri={media.coverImage?.extraLarge ?? media.coverImage?.large}
            width={COVER_WIDTH}
            radius={theme.radii.md}
            isAdult={media.isAdult}
            priority="high"
            style={{ boxShadow: `0 0 16px ${glow}AA` }}
          />
        </Pressable>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <AppText variant="detailTitle" numberOfLines={4} style={styles.title} selectable>
              {title}
            </AppText>
            <Pressable onPress={showTitles} hitSlop={8} accessibilityRole="button" accessibilityLabel="Alternative titles">
              <Icon name={mediaIcons.info} size={13} color={c.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.meta}>
            {[when, mediaFormatLabel(media.format), mediaStatusLabel(media.status, media.type)].filter(Boolean).map((part, i) => (
              <Fragment key={part}>
                {i > 0 ? <AppText variant="caption1" tone="secondary">·</AppText> : null}
                {i === 1 ? <Icon name={media.type === 'MANGA' ? icons.book : icons.tv} size={11} color={c.textSecondary} /> : null}
                <AppText variant="caption1" tone="secondary" weight="600">
                  {part}
                </AppText>
              </Fragment>
            ))}
            <StatusDot status={media.status} size={6} />
          </View>
          {next ? (
            <AppText variant="caption1" tone="airing" weight="700">
              {next.airingAt > nowSeconds()
                ? `${unitLabel(media.type, false)} ${next.episode} airs ${humanizeIn(next.airingAt - nowSeconds())}`
                : `${unitLabel(media.type, false)} ${next.episode} aired`}
            </AppText>
          ) : null}
          <View style={styles.scoreRow}>
            <ScorePill score={media.averageScore ?? media.meanScore} />
            {following.length ? (
              <Pressable
                onPress={onFriendsPress}
                accessibilityRole="button"
                accessibilityLabel={`${following.length} friends have this on their list`}
                style={styles.friends}>
                {following.slice(0, 4).map((f, i) => (
                  <Avatar
                    key={f.id}
                    uri={f.user?.avatar?.medium}
                    name={f.user?.name}
                    size={22}
                    ringColor={c.background}
                    ringWidth={2}
                    style={i > 0 ? styles.overlap : undefined}
                  />
                ))}
                <Icon name={icons.chevronRight} size={11} color={c.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          {media.genres?.length ? (
            <View style={styles.genres}>
              {media.genres.map((g, i) => (
                <Fragment key={g}>
                  {i > 0 ? <AppText variant="caption1" tone="secondary">·</AppText> : null}
                  <AppText variant="caption1" tone="secondary" weight="600" onPress={() => onGenrePress(g)} suppressHighlighting>
                    {g}
                  </AppText>
                </Fragment>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  top: { flexDirection: 'row', paddingHorizontal: 12, gap: 12, alignItems: 'flex-start' },
  texts: { flex: 1, gap: 6, paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  title: { flexShrink: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  friends: { flexDirection: 'row', alignItems: 'center' },
  overlap: { marginLeft: -7 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
});
