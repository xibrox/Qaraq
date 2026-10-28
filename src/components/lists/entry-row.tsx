import type { SharedValue } from 'react-native-reanimated';

import { MediaListRow } from '@/components/media-list-row';
import { SwipeableMediaRow } from '@/components/swipeable-row';
import type { MediaType, ScoreFormat } from '@/api/types';
import type { PreferredTitle, SwipeAction } from '@/settings/types';
import { pickTitle } from '@/lib/title';

import { airingLine, entryTotal, type ListEntry } from './list-model';

export type EntryRowProps = {
  entry: ListEntry;
  type: MediaType;
  scoreFormat: ScoreFormat;
  preferredTitle: PreferredTitle;
  /** Unix seconds, refreshed by the screen so airing countdowns stay current. */
  now: number;
  onOpen: (entry: ListEntry) => void;
  onQuickEdit: (entry: ListEntry) => void;
  onSwipe: (action: SwipeAction, entry: ListEntry) => void;
  /** False while the list scrolls, so a vertical drag never reveals the swipe actions. */
  swipeEnabled?: SharedValue<boolean>;
};

/** A My List row wrapped in the settings-driven swipe gestures. */
export function EntryRow({ entry, type, scoreFormat, preferredTitle, now, onOpen, onQuickEdit, onSwipe, swipeEnabled }: EntryRowProps) {
  const media = entry.media;
  const title = pickTitle(media.title, preferredTitle);
  return (
    <SwipeableMediaRow
      mediaType={type}
      enabled={swipeEnabled}
      onAction={(action) => onSwipe(action, entry)}
      testID={`entry-${entry.id}`}>
      <MediaListRow
        title={title}
        coverUrl={media.coverImage?.large ?? media.coverImage?.medium}
        isAdult={media.isAdult}
        mediaId={media.id}
        mediaType={type}
        progress={entry.progress}
        total={entryTotal(media)}
        progressVolumes={entry.progressVolumes}
        totalVolumes={media.volumes}
        score={entry.score}
        scoreFormat={scoreFormat}
        airingText={airingLine(media, now)}
        onPress={() => onOpen(entry)}
        onMorePress={() => onQuickEdit(entry)}
      />
    </SwipeableMediaRow>
  );
}
