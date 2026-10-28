import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MediaBrowseItem } from '@/api/explore-extra';
import { flattenPages } from '@/api/queries/hooks';
import { useMediaBrowse } from '@/api/queries/explore';
import { useAuthStatus, useIsSignedIn } from '@/auth';
import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { HeaderToolbar } from '@/components/header-toolbar';
import { Icon, icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { mediaIcons } from '@/components/media/media-icons';
import { NativeMenu, choiceItems } from '@/components/menu/native-menu';
import { ProgressLine } from '@/components/progress-line';
import { ScreenHeader, useFloatingHeader } from '@/components/screen-header';
import { haptics } from '@/lib/haptics';
import { hrefs, type SearchParams } from '@/navigation/hrefs';
import { useSetting, useSettings } from '@/settings';
import { useTheme } from '@/theme';

import { FilterChipRow } from './filter-chip-row';
import {
  activeFilterCount,
  clearFilters,
  defaultDirection,
  filtersFromParams,
  filtersToVariables,
  isBareSearch,
  sortLabel,
  sortOptions,
  withType,
  type SearchFilters,
  type SortField,
} from './search-filters';
import { SearchResultCard, SearchResultGridCard } from './search-result-card';
import { ClearFiltersButton, SortDirectionButton } from './sort-controls';
import { SortSheet } from './sort-sheet/sort-sheet';

type DisplayType = 'list' | 'grid';

const GRID_COLUMNS = 3;
const QUERY_DEBOUNCE_MS = 350;

/** Explore search / browse (spec §3): toolbar, filter chips, sort sheet, infinite results. */
export function SearchScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const header = useFloatingHeader();
  const insets = useSafeAreaInsets();
  // iOS automatic content insets already add the status bar; pad only the rest of a floating header.
  const topPad = header.floating ? Math.max(0, header.inset - (Platform.OS === 'ios' ? insets.top : 0)) : 0;
  const params = useLocalSearchParams<SearchParams>();
  const signedIn = useIsSignedIn();
  const defaultType = useSetting('defaultMediaType');
  const ctx = useSettings((s) => ({ preferredTitle: s.preferredTitle, showAdultContent: s.showAdultContent }));

  const [filters, setFilters] = useState<SearchFilters>(() => filtersFromParams(params, defaultType));
  const [text, setText] = useState(filters.query);
  const [display, setDisplay] = useState<DisplayType>('list');
  const [sortOpen, setSortOpen] = useState(false);
  const [autoFocus] = useState(() => isBareSearch(params));
  // The chip row (a dozen native menus, some with hundreds of items) and the result list are heavy
  // to mount; rendering them in the first frame delayed the push by seconds on Android. Mount them
  // once the push transition has finished (with a timeout in case the event never fires).
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    const unsubscribe = navigation.addListener('transitionEnd' as never, done);
    const fallback = setTimeout(done, 450);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation]);

  // Debounce typing into the query filter.
  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => (f.query === text ? f : { ...f, query: text })), QUERY_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  const variables = filtersToVariables(filters, ctx);
  // Anonymous requests resolve title.userPreferred to romaji; wait for the stored session.
  const authReady = useAuthStatus() !== 'loading';
  const results = useMediaBrowse(variables, { enabled: authReady });
  const items = flattenPages(results.data, (p) => p.Page.media);
  const filterCount = activeFilterCount(filters);
  const manga = filters.type === 'MANGA';

  const setSort = (sort: SortField | null) => {
    setFilters((f) => ({ ...f, sort, direction: sort ? (f.sort === sort ? f.direction : defaultDirection(sort)) : f.direction }));
    setSortOpen(false);
  };

  const openMedia = (id: number) => router.push(hrefs.media(id));
  const gridWidth = Math.floor((width - 24 - 10 * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

  const optionsRow = (
    <View style={styles.optionsRow}>
      <NativeMenu
        accessibilityLabel={`Display type, ${display === 'grid' ? 'Grid' : 'List'}`}
        title="Display Type"
        items={choiceItems(
          [
            { value: 'list', label: 'List', icon: { ios: 'list.bullet' } },
            { value: 'grid', label: 'Grid', icon: { ios: 'square.grid.3x2' } },
          ],
          display,
          (v) => {
            haptics.selection();
            setDisplay(v);
          },
        )}>
        <Chip label="Type" icon={mediaIcons.typeList} variant="outlined" size="sm" accessibilityLabel="Display type" />
      </NativeMenu>
      <View style={styles.spacer} />
      <Pressable
        onPress={() => {
          // Blur the search field so its cursor doesn't keep blinking behind the sheet.
          Keyboard.dismiss();
          setSortOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={filters.sort ? `Sort by ${sortLabel(filters.sort, filters.type)}` : 'Sort'}
        style={({ pressed }) => [styles.sortPill, { opacity: pressed ? 0.6 : 1 }]}>
        <Icon name={icons.upDown} size={13} color={c.text} />
        <AppText variant="subheadline" weight="600">
          {filters.sort ? sortLabel(filters.sort, filters.type) : 'Sort'}
        </AppText>
      </Pressable>
      {filters.sort ? (
        <SortDirectionButton
          direction={filters.direction}
          onPress={() => {
            haptics.selection();
            setFilters((f) => ({ ...f, direction: f.direction === 'desc' ? 'asc' : 'desc' }));
          }}
        />
      ) : null}
      <ClearFiltersButton
        disabled={filterCount === 0 && !filters.sort}
        onPress={() => {
          haptics.selection();
          setFilters((f) => ({ ...clearFilters(f), sort: null }));
        }}
      />
    </View>
  );

  const renderItem = ({ item }: { item: MediaBrowseItem }) =>
    display === 'grid' ? (
      <SearchResultGridCard media={item} width={gridWidth} onPress={() => openMedia(item.id)} />
    ) : (
      <SearchResultCard media={item} onPress={() => openMedia(item.id)} />
    );

  let body;
  if (results.isLoading || !authReady || !ready) {
    body = <LoadingState style={{ paddingTop: header.inset }} />;
  } else if (results.error && items.length === 0) {
    body = <ErrorState error={results.error} onRetry={() => results.refetch()} style={{ paddingTop: header.inset }} />;
  } else {
    body = (
      <FlatList
        key={display}
        data={items}
        keyExtractor={(m) => String(m.id)}
        renderItem={renderItem}
        numColumns={display === 'grid' ? GRID_COLUMNS : 1}
        columnWrapperStyle={display === 'grid' ? styles.gridRow : undefined}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: topPad + 10 }]}
        scrollIndicatorInsets={{ top: topPad }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (results.hasNextPage && !results.isFetchingNextPage) results.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          <EmptyState
            title="No Results"
            message={filterCount ? 'Try removing some filters.' : `No ${manga ? 'manga' : 'anime'} matched your search.`}
            icon={icons.search}
            actionLabel={filterCount ? 'Clear Filters' : undefined}
            onAction={filterCount ? () => setFilters((f) => clearFilters(f)) : undefined}
          />
        }
        ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={c.textSecondary} /> : undefined}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScreenHeader floating={header.floating} onHeightChange={header.onHeightChange}>
        <HeaderToolbar
          leading={{ icon: icons.back, onPress: () => router.back(), accessibilityLabel: 'Back' }}
          search={{
            value: text,
            onChangeText: setText,
            onSubmit: (q) => setFilters((f) => ({ ...f, query: q })),
            autoFocus,
          }}
          mediaType={filters.type}
          onMediaTypeChange={(t) => setFilters((f) => withType(f, t))}
        />
        {ready ? (
          <FilterChipRow filters={filters} onChange={setFilters} signedIn={signedIn} showAdult={ctx.showAdultContent} />
        ) : (
          <View style={{ height: theme.sizes.chipHeight }} />
        )}
        {optionsRow}
        <ProgressLine active={results.isFetching && !results.isFetchingNextPage && !results.isLoading} />
      </ScreenHeader>
      {body}
      <SortSheet
        visible={sortOpen}
        title={`${manga ? 'Manga' : 'Anime'}: Sort By`}
        options={sortOptions(filters.type)}
        selected={filters.sort}
        onSelect={(v) => setSort(v)}
        onClear={() => setSort(null)}
        onClose={() => setSortOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4 },
  spacer: { flex: 1 },
  sortPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, height: 36 },
  content: { paddingHorizontal: 12, paddingBottom: 32, gap: 10, flexGrow: 1 },
  gridRow: { gap: 10 },
  footer: { marginVertical: 16 },
});
