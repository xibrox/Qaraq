import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { MediaGridCard } from '@/components/media-grid-card';
import { SwipeableMediaRow } from '@/components/swipeable-row';
import { scoreParts } from '@/components/media-list-row';
import type { MediaType, ScoreFormat } from '@/api/types';
import { pickTitle } from '@/lib/title';
import type { PreferredTitle, SwipeAction } from '@/settings/types';
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
  onSwipe: (action: SwipeAction, entry: ListEntry) => void;
};

/**
 * Grid mode cell: poster with the score badge top-right and a progress strip at the bottom;
 * tap opens the media, long press opens the quick editor. Swipes run the Gesture Settings
 * actions like list rows do, with a panel sized to the cell.
 */
export function EntryGridCard({
  entry,
  type,
  width,
  scoreFormat,
  preferredTitle,
  hideChapters,
  now,
  onOpen,
  onQuickEdit,
  onSwipe,
}: EntryGridCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const media = entry.media;
  const total = entryTotal(media);
  const progress = entry.progress ?? 0;
  const parts = scoreParts(entry.score, scoreFormat);
  const showProgress = !(type === 'MANGA' && hideChapters);
  const airing = airingLine(media, now);
  // A slow swipe would otherwise also fire the long press (quick editor) under the finger.
  const swiping = useRef(false);
  const unit = type === 'MANGA' ? 'Ch' : 'Ep';

  return (
    <SwipeableMediaRow
      mediaType={type}
      onAction={(action) => onSwipe(action, entry)}
      threshold={GRID_SWIPE_THRESHOLD}
      panelWidth={GRID_PANEL_WIDTH}
      onDragStart={() => {
        swiping.current = true;
        // A drag that snaps back without opening sends no close event; clear it after the long-press window.
        setTimeout(() => {
          swiping.current = false;
        }, 1000);
      }}
      onDragEnd={() => {
        swiping.current = false;
      }}
      testID={`entry-grid-${entry.id}`}>
      <MediaGridCard
        title={pickTitle(media.title, preferredTitle)}
        coverUrl={media.coverImage?.large ?? media.coverImage?.medium}
        isAdult={media.isAdult}
        width={width}
        recyclingKey={String(media.id)}
        subtitle={showProgress ? `${progress}/${total ?? '-'} ${type === 'MANGA' ? 'Chapters' : 'Episodes'}` : undefined}
        onPress={() => onOpen(entry)}
        onLongPress={() => {
          if (!swiping.current) onQuickEdit(entry);
        }}
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
    </SwipeableMediaRow>
  );
}

const GRID_PANEL_WIDTH = 64;
const GRID_SWIPE_THRESHOLD = 56;

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  airing: { paddingHorizontal: 5, paddingVertical: 2 },
  track: { height: 3 },
  fill: { height: 3 },
});
