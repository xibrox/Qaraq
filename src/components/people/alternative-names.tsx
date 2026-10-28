import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export type AlternativeNamesProps = {
  names: readonly (string | null)[] | null | undefined;
  /** Names that spoil the story; hidden behind a tap. */
  spoilerNames?: readonly (string | null)[] | null;
};

function clean(list: readonly (string | null)[] | null | undefined): string[] {
  return [...new Set((list ?? []).map((n) => n?.trim()).filter((n): n is string => !!n))];
}

/** "Also known as" tags; spoiler names are blanked until tapped. */
export function AlternativeNames({ names, spoilerNames }: AlternativeNamesProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [revealed, setRevealed] = useState(false);
  const plain = clean(names);
  const spoilers = clean(spoilerNames).filter((n) => !plain.includes(n));
  if (plain.length === 0 && spoilers.length === 0) return null;

  const tag = (label: string, key: string, hidden = false) => (
    <View
      key={key}
      style={[
        styles.tag,
        { borderColor: hidden ? c.danger : c.chipBorder, backgroundColor: hidden ? c.surfaceElevated : c.chipFill },
      ]}>
      <AppText variant="caption1" weight="700" color={hidden ? c.surfaceElevated : c.textSecondary} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppText variant="caption1" tone="tertiary" uppercase>
        Also known as
      </AppText>
      <View style={styles.wrap}>
        {plain.map((n) => tag(n, `p-${n}`))}
        {spoilers.length > 0 ? (
          <Pressable
            onPress={() => {
              haptics.selection();
              setRevealed((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide spoiler names' : `Show ${spoilers.length} spoiler names`}
            style={styles.wrap}>
            {spoilers.map((n) => tag(n, `s-${n}`, !revealed))}
            {!revealed ? (
              <AppText variant="caption1" weight="700" tone="danger" style={styles.spoilerHint}>
                Spoilers
              </AppText>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tag: { height: 24, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, justifyContent: 'center', maxWidth: 220 },
  spoilerHint: { marginLeft: 2 },
});
