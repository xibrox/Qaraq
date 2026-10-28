import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import type { MediaTag } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { SectionHeader } from '@/components/section-header';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { mediaIcons } from './media-icons';

/** Tags with their relevance %; spoiler tags stay hidden until "Show Spoilers" is tapped. */
export function TagsSection({ tags }: { tags: (MediaTag | null)[] | null | undefined }) {
  const theme = useTheme();
  const c = theme.colors;
  const showAdult = useSetting('showAdultContent');
  const [showSpoilers, setShowSpoilers] = useState(false);
  const all = (tags ?? []).filter((t): t is MediaTag => t != null && (showAdult || !t.isAdult));
  if (!all.length) return null;
  const isSpoiler = (t: MediaTag) => !!(t.isMediaSpoiler || t.isGeneralSpoiler);
  const spoilerCount = all.filter(isSpoiler).length;
  const visible = showSpoilers ? all : all.filter((t) => !isSpoiler(t));

  return (
    <View>
      <SectionHeader
        title="Tags"
        tone="muted"
        inset={12}
        style={styles.header}
        trailing={
          spoilerCount ? (
            <Pressable
              onPress={() => setShowSpoilers((v) => !v)}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.spoilerToggle}>
              <Icon name={showSpoilers ? mediaIcons.eyeSlash : mediaIcons.eye} size={13} color={c.textSecondary} />
              <AppText variant="caption1" tone="secondary" weight="700">
                {showSpoilers ? 'Hide Spoilers' : `Show Spoilers (${spoilerCount})`}
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      <View style={styles.wrap}>
        {visible.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => Alert.alert(t.name, t.description ?? '')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.tag,
              { backgroundColor: c.chipFill, borderColor: isSpoiler(t) ? c.danger : c.chipBorder, opacity: pressed ? 0.6 : 1 },
            ]}>
            <AppText variant="caption1" weight="700" color={isSpoiler(t) ? c.danger : c.text}>
              {t.name}
            </AppText>
            {t.rank != null ? (
              <AppText variant="caption1" tone="secondary">
                {`${t.rank}%`}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  spoilerToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12 },
  tag: { flexDirection: 'row', gap: 6, alignItems: 'center', height: 26, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1 },
});
