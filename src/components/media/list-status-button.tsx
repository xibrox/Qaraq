import { StyleSheet } from 'react-native';

import { useViewer } from '@/api/queries/hooks';
import type { MediaDetail } from '@/api/types';
import { useIsSignedIn } from '@/auth';
import { icons } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { formatScore } from '@/lib/format';
import { listStatusLabel } from '@/settings';

import { unitLabel } from './media-format';

type Props = { media: MediaDetail; onPress: () => void };

/** "Add to List" / "Watching · 7/12 Episodes · ★ 9.5" button that opens the entry editor. */
export function ListStatusButton({ media, onPress }: Props) {
  const signedIn = useIsSignedIn();
  const viewer = useViewer({ enabled: signedIn });
  const entry = media.mediaListEntry;
  const type = media.type ?? 'ANIME';
  if (!entry?.status) {
    return <PrimaryButton label="Add to List" icon={icons.plus} size="sm" uppercase={false} onPress={onPress} style={styles.button} />;
  }
  const total = type === 'MANGA' ? media.chapters : media.episodes;
  const progress = `${entry.progress ?? 0}/${total ?? '-'} ${unitLabel(type)}`;
  // `score` is in the viewer's own score format.
  const scoreFormat = viewer.data?.mediaListOptions?.scoreFormat ?? 'POINT_10_DECIMAL';
  const score = entry.score ? `★ ${formatScore(entry.score, scoreFormat)}` : null;
  const label = [listStatusLabel(entry.status, type), progress, score].filter(Boolean).join('  ·  ');
  return <PrimaryButton label={label} icon={icons.pencil} size="sm" variant="secondary" uppercase={false} onPress={onPress} style={styles.button} />;
}

const styles = StyleSheet.create({
  button: { marginHorizontal: 12 },
});
