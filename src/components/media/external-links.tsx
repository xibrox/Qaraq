import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaExternalLink } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { SectionHeader } from '@/components/section-header';
import { useTheme } from '@/theme';

import { mediaIcons } from './media-icons';

const TYPE_ORDER: Record<string, number> = { STREAMING: 0, INFO: 1, SOCIAL: 2 };

/** "External Links": pills with service icons ("Crunchyroll", "Netflix", "Official Site"). */
export function ExternalLinksSection({ links }: { links: (MediaExternalLink | null)[] | null | undefined }) {
  const theme = useTheme();
  const c = theme.colors;
  const items = (links ?? [])
    .filter((l): l is MediaExternalLink & { url: string } => !!l?.url && !l.isDisabled)
    .sort((a, b) => (TYPE_ORDER[a.type ?? 'INFO'] ?? 1) - (TYPE_ORDER[b.type ?? 'INFO'] ?? 1));
  if (!items.length) return null;
  return (
    <View>
      <SectionHeader title="External Links" tone="muted" inset={12} style={styles.header} />
      <View style={styles.wrap}>
        {items.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => WebBrowser.openBrowserAsync(l.url).catch(() => undefined)}
            accessibilityRole="link"
            accessibilityLabel={l.site}
            style={({ pressed }) => [styles.pill, { backgroundColor: c.chipFill, borderColor: c.chipBorder, opacity: pressed ? 0.6 : 1 }]}>
            {l.icon ? (
              <View style={[styles.iconBox, { backgroundColor: l.color ?? 'transparent' }]}>
                <Image source={{ uri: l.icon }} style={styles.icon} contentFit="contain" tintColor="#FFFFFF" />
              </View>
            ) : (
              <Icon name={mediaIcons.link} size={12} color={c.textSecondary} />
            )}
            <AppText variant="caption1" weight="700">
              {l.site}
            </AppText>
            {l.language ? (
              <AppText variant="caption2" tone="secondary">
                {l.language}
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
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  iconBox: { width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 11, height: 11 },
});
