import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View, useWindowDimensions, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exploreHomeVariables } from '@/api/explore';
import { flattenPages, useExploreHome, useMediaSearch } from '@/api/queries/hooks';
import type { MediaCard, MediaType } from '@/api/types';
import { useAuthStatus } from '@/auth';
import { ErrorState } from '@/components/error-state';
import { HeaderToolbar } from '@/components/header-toolbar';
import { LoadingState } from '@/components/loading-state';
import { MediaCarousel } from '@/components/media-carousel';
import { MediaGridCard } from '@/components/media-grid-card';
import { ScreenHeader, useFloatingHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { MediaCardSkeleton } from '@/components/skeleton';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { exploreSections, type ExplorePresetKey, type ExploreSectionDef } from './explore-sections';
import { TrendingCard } from './trending-card';

const GRID_COLUMNS = 4;
const GRID_GUTTER = 6;
const GRID_INSET = 8;
const TOP_LIMIT = 100;

type Row =
  | { kind: 'header'; key: string; def: ExploreSectionDef }
  | { kind: 'trending'; key: string; items: MediaCard[] }
  | { kind: 'posters'; key: string; items: MediaCard[]; loading: boolean }
  | { kind: 'grid'; key: string; items: MediaCard[] };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const compact = (list: (MediaCard | null)[] | null | undefined): MediaCard[] =>
  (list ?? []).filter((m): m is MediaCard => m != null);

/** Explore tab: "Explore Anime/Manga" header, carousels and the Top 100 grid (spec §3). */
export function ExploreHome() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const header = useFloatingHeader();
  const insets = useSafeAreaInsets();
  // iOS automatic content insets already add the status bar; pad only the rest of a floating header.
  const topPad = header.floating ? Math.max(0, header.inset - (Platform.OS === 'ios' ? insets.top : 0)) : 0;
  const preferred = useSetting('preferredTitle');
  const defaultType = useSetting('defaultMediaType');
  const [type, setType] = useState<MediaType>(defaultType);

  // Wait for the stored session: an anonymous request resolves title.userPreferred to romaji and
  // the cached result would never be refetched once the token is attached.
  const authReady = useAuthStatus() !== 'loading';
  const home = useExploreHome(exploreHomeVariables(type), { enabled: authReady });
  const manhwa = useMediaSearch(
    { type: 'MANGA', countryOfOrigin: 'KR', sort: ['POPULARITY_DESC'], isAdult: false, perPage: 10 },
    { enabled: authReady && type === 'MANGA' },
  );
  const top = useMediaSearch({ type, sort: ['SCORE_DESC'], isAdult: false, perPage: 50 }, { enabled: authReady });
  const homeLoading = home.isLoading || !authReady;

  const posterWidth = Math.floor((width - 16 - 3 * 10) / 3.5);
  const trendingWidth = Math.floor((width - 16 - 2 * 12) / 2.15);
  const gridWidth = Math.floor((width - GRID_INSET * 2 - GRID_GUTTER * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

  const sectionItems = (key: ExplorePresetKey): MediaCard[] => {
    const d = home.data;
    switch (key) {
      case 'trending':
        return compact(d?.trending?.media);
      case 'season':
        return compact(d?.season?.media);
      case 'nextSeason':
        return compact(d?.nextSeason?.media);
      case 'popular':
        return compact(d?.popular?.media);
      case 'manhwa':
        return flattenPages(manhwa.data, (p) => p.Page.media);
      case 'top':
        return flattenPages(top.data, (p) => p.Page.media).slice(0, TOP_LIMIT);
    }
  };

  const rows: Row[] = exploreSections(type).flatMap((def): Row[] => {
    const head: Row = { kind: 'header', key: `h-${def.key}`, def };
    const items = sectionItems(def.key);
    if (def.kind === 'trending') return [head, { kind: 'trending', key: `t-${def.key}`, items }];
    if (def.kind === 'posters') {
      const loading = def.key === 'manhwa' ? manhwa.isLoading || !authReady : homeLoading;
      return [head, { kind: 'posters', key: `p-${def.key}`, items, loading }];
    }
    return [head, ...chunk(items, GRID_COLUMNS).map((r, i): Row => ({ kind: 'grid', key: `g-${i}`, items: r }))];
  });

  const openMedia = (id: number) => router.push(hrefs.media(id));
  const openSection = (key: ExplorePresetKey) => router.push(hrefs.search({ type, preset: key }));

  const renderPoster = (m: MediaCard) => (
    <MediaGridCard
      title={pickTitle(m.title, preferred)}
      coverUrl={m.coverImage?.large}
      isAdult={m.isAdult}
      width={posterWidth}
      recyclingKey={String(m.id)}
      onPress={() => openMedia(m.id)}
    />
  );

  const renderRow: ListRenderItem<Row> = ({ item }) => {
    switch (item.kind) {
      case 'header':
        return (
          <SectionHeader
            title={item.def.title}
            subtitle={item.def.subtitle}
            onPress={() => openSection(item.def.key)}
            chevron="trailing"
            style={styles.sectionHeader}
          />
        );
      case 'trending':
        return (
          <MediaCarousel
            data={item.items}
            keyExtractor={(m) => String(m.id)}
            itemWidth={trendingWidth}
            gap={12}
            loading={homeLoading}
            skeletonCount={2}
            renderSkeleton={() => <MediaCardSkeleton width={trendingWidth} />}
            renderItem={({ item: m }) => <TrendingCard media={m} width={trendingWidth} onPress={() => openMedia(m.id)} />}
          />
        );
      case 'posters':
        return (
          <MediaCarousel
            data={item.items}
            keyExtractor={(m) => String(m.id)}
            itemWidth={posterWidth}
            loading={item.loading}
            renderItem={({ item: m }) => renderPoster(m)}
          />
        );
      case 'grid':
        return (
          <View style={[styles.gridRow, { paddingHorizontal: GRID_INSET, gap: GRID_GUTTER }]}>
            {item.items.map((m) => (
              <MediaGridCard
                key={m.id}
                title={pickTitle(m.title, preferred)}
                coverUrl={m.coverImage?.large}
                isAdult={m.isAdult}
                width={gridWidth}
                recyclingKey={String(m.id)}
                onPress={() => openMedia(m.id)}
              />
            ))}
          </View>
        );
    }
  };

  const loadingLabel = type === 'MANGA' ? 'Loading Mangas...' : 'Loading Animes...';
  const refreshing = home.isRefetching && !homeLoading;

  let body;
  if (homeLoading) {
    body = <LoadingState label={loadingLabel} style={{ paddingTop: header.inset }} />;
  } else if (home.error && !home.data) {
    body = <ErrorState error={home.error} onRetry={() => home.refetch()} style={{ paddingTop: header.inset }} />;
  } else {
    body = (
      <FlatList
        data={rows}
        keyExtractor={(r) => `${type}-${r.key}`}
        renderItem={renderRow}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: 32 }}
        scrollIndicatorInsets={{ top: topPad }}
        onEndReached={() => {
          const loaded = flattenPages(top.data, (p) => p.Page.media).length;
          if (top.hasNextPage && !top.isFetchingNextPage && loaded < TOP_LIMIT) top.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        initialNumToRender={8}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.colors.textSecondary}
            progressViewOffset={topPad}
            onRefresh={() => {
              home.refetch();
              top.refetch();
              if (type === 'MANGA') manhwa.refetch();
            }}
          />
        }
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title={type === 'MANGA' ? 'Explore Manga' : 'Explore Anime'}
        floating={header.floating}
        onHeightChange={header.onHeightChange}>
        <HeaderToolbar
          search={{ onPress: () => router.push(hrefs.search({ type })) }}
          mediaType={type}
          onMediaTypeChange={setType}
          mediaTypeDisabled={homeLoading}
        />
      </ScreenHeader>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sectionHeader: { marginTop: 22, marginBottom: 12 },
  gridRow: { flexDirection: 'row', marginBottom: 10 },
});
