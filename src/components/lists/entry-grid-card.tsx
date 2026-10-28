import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { MediaGridCard } from '@/components/media-grid-card';
import { scoreParts } from '@/components/media-list-row';
import type { MediaType, ScoreFormat } from '@/api/types';
import { pickTitle } from '@/lib/title';
import type { PreferredTitle } from '@/settings/types';
import { useTheme } from '@/theme';

import { airingLine, entryTotal, type ListEntry } from './list-model';

export type EntryGridCardProps = {
  entry: ListEntry;
  type: MediaType;
  width: number;
  scoreFormat: ScoreFormat;
  preferredTitle: PreferredTitle;
  hideChapters: boolean;
  now: number;
  onOpen: (entry: ListEntry) => void;
  onQuickEdit: (entry: ListEntry) => void;
};

/**
 * Grid mode cell: poster with the score badge top-right and a progress strip at the bottom;
 * tap opens the media, long press opens the quick editor.
 */
export function EntryGridCard({ entry, type, width, scoreFormat, preferredTitle, hideChapters, now, onOpen, onQuickEdit }: EntryGridCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const media = entry.media;
  const total = entryTotal(media);
  const progress = entry.progress ?? 0;
  const parts = scoreParts(entry.score, scoreFormat);
  const showProgress = !(type === 'MANGA' && hideChapters);
  const airing = airingLine(media, now);
  const unit = type === 'MANGA' ? 'Ch' : 'Ep';

  return (
    <MediaGridCard
      title={pickTitle(media.title, preferredTitle)}
      coverUrl={media.coverImage?.large ?? media.coverImage?.medium}
      isAdult={media.isAdult}
      width={width}
      recyclingKey={String(media.id)}
      subtitle={showProgress ? `${progress}/${total ?? '-'} ${type === 'MANGA' ? 'Chapters' : 'Episodes'}` : undefined}
      onPress={() => onOpen(entry)}
      onLongPress={() => onQuickEdit(entry)}
      topRight={
        parts ? (
          <View style={[styles.badge, { backgroundColor: c.overlay }]}>
            <Icon name={icons.star} size={9} color={c.star} />
            <AppText variant="caption2" color="#FFFFFF">
              {parts.value}
            </AppText>
          </View>
        ) : null
      }
      bottom={
        <View>
          {airing ? (
            <View style={[styles.airing, { backgroundColor: c.overlay }]}>
              <AppText variant="caption2" tone="airing" numberOfLines={1}>
                {airing.replace('Episode ', `${unit} `)}
              </AppText>
            </View>
          ) : null}
          {showProgress && total != null ? (
            <View style={[styles.track, { backgroundColor: c.overlay }]}>
              <View style={[styles.fill, { width: `${Math.min(100, (progress / total) * 100)}%`, backgroundColor: c.accent }]} />
            </View>
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  airing: { paddingHorizontal: 5, paddingVertical: 2 },
  track: { height: 3 },
  fill: { height: 3 },
});
