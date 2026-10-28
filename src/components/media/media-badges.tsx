import { StyleSheet, View } from 'react-native';

import type { MediaType } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';

/** Small dark square with a tv/book glyph (top-left of Related / recommendation covers). */
export function MediaTypeBadge({ type }: { type: MediaType | null | undefined }) {
  return (
    <View style={styles.square}>
      <Icon name={type === 'MANGA' ? icons.book : icons.tv} size={10} color="#FFFFFF" />
    </View>
  );
}

/** Relation pill ("Alternative", "Sequel") on the cover's top-right. */
export function CoverPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <AppText variant="caption2" color="#FFFFFF" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 6,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    maxWidth: 90,
  },
});
