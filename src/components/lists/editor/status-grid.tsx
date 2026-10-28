import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import type { MediaListStatus, MediaType } from '@/api/types';
import { haptics } from '@/lib/haptics';
import { listStatusLabel } from '@/settings/labels';
import { useTheme } from '@/theme';

import { EDITOR_STATUS_ORDER } from '../list-model';

export type StatusGridProps = {
  value: MediaListStatus | null;
  type: MediaType;
  onChange: (status: MediaListStatus) => void;
};

/**
 * AniClient's 3×2 status grid: "Watching" "Planning" "Completed" / "Rewatching" "Paused"
 * "Dropped" ("Reading"/"Rereading" for manga). The selected cell is an accent pill.
 */
export function StatusGrid({ value, type, onChange }: StatusGridProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.card, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.xl }]} accessibilityRole="radiogroup">
      {EDITOR_STATUS_ORDER.map((status) => {
        const selected = status === value;
        return (
          <Pressable
            key={status}
            onPress={() => {
              if (!selected) haptics.selection();
              onChange(status);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.cell,
              { borderRadius: theme.radii.md, backgroundColor: selected ? c.accent : 'transparent', opacity: pressed ? 0.7 : 1 },
            ]}>
            <AppText variant="callout" weight="600" color={selected ? c.onAccent : c.text} numberOfLines={1} adjustsFontSizeToFit>
              {listStatusLabel(status, type)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', flexWrap: 'wrap', padding: 6, rowGap: 4 },
  cell: { width: '33.333%', height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
