import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatScore, type ScoreFormat } from '@/lib/format';
import { useSettings } from '@/settings/store';
import type { MediaType } from '@/settings/types';
import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { CoverImage } from './cover-image';
import { Icon, icons } from './icon';
import { IconButton } from './icon-button';

export type MediaListRowProps = {
  title: string;
  coverUrl?: string | null;
  isAdult?: boolean | null;
  /** Used as the image recycling key. */
  mediaId?: number;
  mediaType?: MediaType;
  /** Entry progress (episodes / chapters). */
  progress?: number | null;
  /** Total episodes / chapters; unknown renders as "-" ("351/- Episodes"). */
  total?: number | null;
  /** Manga volumes ("3/10 Volumes"); hidden by "Hide Volumes". */
  progressVolumes?: number | null;
  totalVolumes?: number | null;
  /** Entry score in `scoreFormat` (as AniList returns it); 0/null hides the score line. */
  score?: number | null;
  scoreFormat?: ScoreFormat;
  /** Amber airing line ("Episode 1181 airs in 2 months"). */
  airingText?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Opens the quick edit sheet; hides the "•••" button when omitted. */
  onMorePress?: () => void;
  /** Replaces the "•••" button. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SCORE_MAX: Record<ScoreFormat, string> = {
  POINT_100: '/100',
  POINT_10_DECIMAL: '/10',
  POINT_10: '/10',
  POINT_5: '/5',
  POINT_3: '',
};

/** Splits a score into AniClient's bold value + dim "/max". */
export function scoreParts(score: number | null | undefined, format: ScoreFormat): { value: string; max: string } | null {
  const value = formatScore(score, format, { starStyle: 'number' });
  if (!value) return null;
  return { value, max: SCORE_MAX[format] };
}

function ProgressLine({ progress, total, unit }: { progress: number; total: number | null | undefined; unit: string }) {
  return (
    <AppText variant="meta" tone="muted" numberOfLines={1}>
      {`${progress}/${total && total > 0 ? total : '-'} `}
      <AppText variant="meta" tone="tertiary">
        {unit}
      </AppText>
    </AppText>
  );
}

/**
 * My List row (~95pt, no separators): 60x85 cover, bold title, progress "7/12 Episodes",
 * optional score "★ 10.0/10", amber airing line, and the outlined "•••" button.
 */
export function MediaListRow({
  title,
  coverUrl,
  isAdult,
  mediaId,
  mediaType = 'ANIME',
  progress,
  total,
  progressVolumes,
  totalVolumes,
  score,
  scoreFormat = 'POINT_10_DECIMAL',
  airingText,
  onPress,
  onLongPress,
  onMorePress,
  trailing,
  style,
  testID,
}: MediaListRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const { hideChapters, hideVolumes } = useSettings((s) => ({
    hideChapters: s.hideMangaChapters,
    hideVolumes: s.hideMangaVolumes,
  }));
  const manga = mediaType === 'MANGA';
  const parts = scoreParts(score, scoreFormat);
  const showMain = !(manga && hideChapters);
  const showVolumes = manga && !hideVolumes && progressVolumes != null && (progressVolumes > 0 || (totalVolumes ?? 0) > 0);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      style={({ pressed }) => [styles.row, { minHeight: theme.sizes.listRow, backgroundColor: pressed ? c.fillSecondary : c.background }, style]}>
      <CoverImage
        uri={coverUrl}
        width={theme.sizes.listCoverWidth}
        height={theme.sizes.listCoverHeight}
        radius={theme.radii.xs}
        isAdult={isAdult}
        recyclingKey={mediaId != null ? String(mediaId) : undefined}
      />
      <View style={styles.body}>
        <AppText variant="listTitle" numberOfLines={3}>
          {title}
        </AppText>
        {showMain ? <ProgressLine progress={progress ?? 0} total={total} unit={manga ? 'Chapters' : 'Episodes'} /> : null}
        {showVolumes ? <ProgressLine progress={progressVolumes ?? 0} total={totalVolumes} unit="Volumes" /> : null}
        {parts ? (
          <View style={styles.score}>
            <Icon name={icons.star} size={11} color={c.star} />
            <AppText variant="meta" weight="800">
              {parts.value}
              <AppText variant="caption1" tone="tertiary">
                {parts.max}
              </AppText>
            </AppText>
          </View>
        ) : null}
        {airingText ? (
          <AppText variant="meta" tone="airing" numberOfLines={1}>
            {airingText}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (onMorePress ? (
          <IconButton icon={icons.more} variant="outlined" onPress={onMorePress} accessibilityLabel={`Edit ${title}`} />
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, gap: 12 },
  body: { flex: 1, gap: 3, justifyContent: 'center' },
  score: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
