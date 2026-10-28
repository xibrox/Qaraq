import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useUserFavouritesOverview } from '@/api/queries/hooks';
import type { FavouriteKind } from '@/api/types';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Icon, icons } from '@/components/icon';
import { MediaCarousel } from '@/components/media-carousel';
import { MediaGridCard } from '@/components/media-grid-card';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { toFavouriteItems, type FavouriteItem } from './favourite-items';
import { FAVOURITE_KINDS, FAVOURITE_SECTION_TITLES } from './labels';

const POSTER_WIDTH = 102;
const STUDIO_WIDTH = 150;

function StudioCard({ item }: { item: FavouriteItem }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      android_ripple={{ color: theme.colors.fillSecondary }}
      style={({ pressed }) => [
        styles.studio,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          overflow: 'hidden',
          opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
        },
      ]}>
      <AppText variant="subheadline" weight="800" numberOfLines={2} align="center">
        {item.title}
      </AppText>
      {item.subtitle ? (
        <AppText variant="caption2" tone="tertiary" numberOfLines={1}>
          {item.subtitle}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function FavouriteSection({
  title,
  items,
  isStudios,
  onSeeAll,
  loading,
}: {
  title: string;
  items: FavouriteItem[];
  isStudios: boolean;
  onSeeAll?: () => void;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        onPress={onSeeAll}
        trailing={onSeeAll ? <Icon name={icons.chevronRight} size={16} color={theme.colors.text} weight="bold" /> : undefined}
      />
      <MediaCarousel
        data={items}
        loading={loading}
        keyExtractor={(item) => String(item.id)}
        itemWidth={isStudios ? STUDIO_WIDTH : POSTER_WIDTH}
        renderSkeleton={isStudios ? () => <Skeleton width={STUDIO_WIDTH} height={64} radius={10} /> : undefined}
        renderItem={({ item }) =>
          isStudios ? (
            <StudioCard item={item} />
          ) : (
            <MediaGridCard
              title={item.title}
              coverUrl={item.imageUrl}
              isAdult={item.isAdult}
              width={POSTER_WIDTH}
              recyclingKey={String(item.id)}
              onPress={() => router.push(item.href)}
            />
          )
        }
      />
    </View>
  );
}

/**
 * Profile "Favorite" tab: horizontal rows for Animes, Mangas, Characters, Staff and Studios,
 * each with "›" to the full "Favorite …" list. Renders plain views (no vertical scroll), so the
 * profile screen can place it inside its own scroll view under the sticky tab row.
 */
export function FavoritesTab({ userId }: { userId: number }) {
  const preferredTitle = useSetting('preferredTitle');
  const query = useUserFavouritesOverview(userId, 15);
  const favourites = query.data?.User?.favourites;

  if (query.isPending) {
    return (
      <View style={styles.container}>
        {(['anime', 'characters', 'staff'] as const).map((kind) => (
          <FavouriteSection key={kind} title={FAVOURITE_SECTION_TITLES[kind]} items={[]} isStudios={false} loading />
        ))}
      </View>
    );
  }
  if (query.error && !favourites) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} fill={false} style={styles.state} />;
  }

  const sections = FAVOURITE_KINDS.map((kind: FavouriteKind) => {
    const conn = favourites?.[kind];
    return {
      kind,
      items: toFavouriteItems(kind, conn?.nodes, preferredTitle),
      hasMore: (conn?.pageInfo?.total ?? 0) > 0,
    };
  }).filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={icons.heart}
        title="No favorites yet"
        message="Tap the heart on an anime, manga, character, staff member or studio to add it here."
        fill={false}
        style={styles.state}
      />
    );
  }

  return (
    <View style={styles.container}>
      {sections.map((s) => (
        <FavouriteSection
          key={s.kind}
          title={FAVOURITE_SECTION_TITLES[s.kind]}
          items={s.items}
          isStudios={s.kind === 'studios'}
          onSeeAll={s.hasMore ? () => router.push(hrefs.favourites(userId, s.kind)) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16, paddingBottom: 24, gap: 24 },
  section: { gap: 12 },
  studio: { width: STUDIO_WIDTH, height: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, gap: 2 },
  state: { paddingVertical: 48 },
});
