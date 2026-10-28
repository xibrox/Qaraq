import { router, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { MediaCarousel } from '@/components/media-carousel';
import { useTheme } from '@/theme';

export type PersonStat = {
  key: string;
  name: string;
  /** undefined for studios (no image). */
  imageUrl?: string | null;
  value: string;
  detail?: string;
  href: Href;
};

const WIDTH = 96;

/** Voice actors / staff / studios ranked by the selected metric, as a horizontal row. */
export function PeopleCarousel({ items }: { items: PersonStat[] }) {
  const theme = useTheme();
  return (
    <MediaCarousel
      data={items}
      keyExtractor={(i) => i.key}
      itemWidth={WIDTH}
      inset={0}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => router.push(item.href)}
          accessibilityRole="button"
          accessibilityLabel={`${index + 1}. ${item.name}, ${item.value}`}
          android_ripple={{ color: theme.colors.fillSecondary, foreground: true }}
          style={({ pressed }) => [styles.card, { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 }]}>
          {item.imageUrl !== undefined ? (
            <Avatar uri={item.imageUrl} name={item.name} size={WIDTH} shape="rounded" />
          ) : (
            <View style={[styles.studio, { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.lg }]}>
              <AppText variant="footnote" weight="800" numberOfLines={3} align="center">
                {item.name}
              </AppText>
            </View>
          )}
          {item.imageUrl !== undefined ? (
            <AppText variant="footnote" weight="700" numberOfLines={2} style={styles.name}>
              {item.name}
            </AppText>
          ) : null}
          <AppText variant="caption1" weight="700" tone="accent" numberOfLines={1}>
            {item.value}
          </AppText>
          {item.detail ? (
            <AppText variant="caption2" tone="tertiary" numberOfLines={1}>
              {item.detail}
            </AppText>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { width: WIDTH, gap: 2 },
  studio: { width: WIDTH, height: WIDTH * 0.75, alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 4 },
  name: { marginTop: 6 },
});
