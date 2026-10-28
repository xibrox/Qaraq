import { StyleSheet, View } from 'react-native';

import type { AiringEpisode, Connection, MediaType } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { airingCountdown } from '@/components/lists/list-model';
import { SectionHeader } from '@/components/section-header';
import { formatClock, formatUnixDate, nowSeconds } from '@/lib/format';
import { useTheme } from '@/theme';

import { unitLabel } from './media-format';
import { mediaIcons } from './media-icons';

const MAX_ROWS = 5;

/** Upcoming episodes with their air date and countdown (releasing anime only). */
export function AiringScheduleSection({ schedule, type }: { schedule: Connection<AiringEpisode> | null | undefined; type: MediaType | null }) {
  const theme = useTheme();
  const c = theme.colors;
  const nodes = (schedule?.nodes ?? []).filter((n): n is AiringEpisode => n != null).slice(0, MAX_ROWS);
  if (!nodes.length) return null;
  const now = nowSeconds();
  return (
    <View>
      <SectionHeader title="Airing Schedule" tone="muted" inset={12} style={styles.header} />
      <View style={[styles.card, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
        {nodes.map((n, i) => (
          <View key={n.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator }]}>
            <Icon name={mediaIcons.clock} size={14} color={i === 0 ? c.airing : c.textSecondary} />
            <AppText variant="footnote" weight="700" style={styles.episode}>
              {`${unitLabel(type, false)} ${n.episode}`}
            </AppText>
            <AppText variant="caption1" tone="secondary">
              {`${formatUnixDate(n.airingAt)} · ${formatClock(n.airingAt)}`}
            </AppText>
            <AppText variant="caption1" weight="700" tone={i === 0 ? 'airing' : 'secondary'} style={styles.countdown}>
              {airingCountdown(n.airingAt, now) || 'Aired'}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  card: { marginHorizontal: 12, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42 },
  episode: { minWidth: 82 },
  countdown: { marginLeft: 'auto' },
});
