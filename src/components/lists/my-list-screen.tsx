import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SearchBarCommands } from 'react-native-screens';

import type { MediaType } from '@/api/types';
import { useAuthStatus } from '@/auth';
import { ErrorState } from '@/components/error-state';
import { HeaderToolbar } from '@/components/header-toolbar';
import { MediaTypeToolbar, NATIVE_SEARCH_HEADER, TitleToolbar } from '@/components/native-header';
import { LoadingState } from '@/components/loading-state';
import { AppText } from '@/components/app-text';
import { ProgressLine } from '@/components/progress-line';
import { SectionHeader } from '@/components/section-header';
import { ScreenHeader, useFloatingHeader } from '@/components/screen-header';
import { ListSkeleton } from '@/components/skeleton';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { getSettings, resetSectionOrder, setSectionOrder, useSetting, useSettings } from '@/settings/store';
import type { ListSectionKey } from '@/settings/types';
import { useTheme } from '@/theme';

import { CustomListSheet } from './custom-list-sheet/custom-list-sheet';
import { DisplayMenu, DisplayToolbarMenu } from './display-menu';
import { EntryGridCard } from './entry-grid-card';
import { entryEditorHref } from './entry-href';
import { EntryRow } from './entry-row';
import { EmptySection, SignedOutState } from './list-empty';
import { entryCustomListNames } from '@/api/lists';
import { applyVisibleOrder, type ListEntry } from './list-model';
import { ReorderSheet } from './reorder-sheet/reorder-sheet';
import { SectionChips } from './section-chips';
import { ListInfoRow } from './sort-controls';
import { useEntryActions } from './use-entry-actions';
import { useMyList, type SearchGroup } from './use-my-list';
import { useNow } from './use-now';

const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const GRID_INSET = 12;

/**
 * "My List" tab root: "Anime List"/"Manga List" (or the chosen custom list) header with toolbar,
 * search and Anime|Manga, the status chips with count, sort pill and direction, then the rows
 * (or a 3-column grid). Rows swipe per Gesture Settings; "•••" opens the quick edit sheet.
 */
export function MyListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const authStatus = useAuthStatus();
  const defaultType = useSetting('defaultMediaType');
  const [type, setType] = useState<MediaType>(defaultType);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const { mode, preferredTitle, hideChapters } = useSettings((s) => ({
    mode: s.listDisplayMode[type],
    preferredTitle: s.preferredTitle,
    hideChapters: s.hideMangaChapters,
  }));
  const list = useMyList(type, search);
  const actions = useEntryActions(type, list.customNames.length);
  const floatingHeader = useFloatingHeader();
  // The iOS native bar is laid out by UIKit (automatic content insets), so nothing floats.
  const header = NATIVE_SEARCH_HEADER ? { ...floatingHeader, floating: false, inset: 0 } : floatingHeader;
  const searchBar = useRef<SearchBarCommands>(null);
  const now = useNow();

  const { query } = list;
  // Resign the search field before pushing, or UIKit re-focuses it when the screen pops back.
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    searchBar.current?.blur();
  };
  const openMedia = (entry: ListEntry) => {
    dismissKeyboard();
    router.push(hrefs.media(entry.mediaId));
  };
  const quickEdit = (entry: ListEntry) => {
    dismissKeyboard();
    haptics.selection();
    router.push(entryEditorHref(entry.mediaId, 'quick'));
  };
  const selectList = (name: string | null) => {
    haptics.selection();
    list.selectList(name);
  };
  const openReorder = () => {
    dismissKeyboard();
    haptics.selection();
    setReordering(true);
  };
  const onRefresh = () => {
    setRefreshing(true);
    query.refetch().finally(() => setRefreshing(false));
  };

  // iOS adds the status-bar inset itself with automatic content insets; pad the rest of a floating header.
  const topPad = header.floating ? Math.max(0, header.inset - (Platform.OS === 'ios' ? insets.top : 0)) : 0;
  const cellWidth = Math.floor((width - GRID_INSET * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  const selectedLabel = list.sections.find((s) => s.key === list.selected)?.label ?? '';

  const sheetEntry = actions.customListEntryId != null ? list.findEntry(actions.customListEntryId) : undefined;
  const sheetMembers = sheetEntry ? entryCustomListNames(sheetEntry) : [];
  const sheetLists = [...new Set([...list.customNames, ...sheetMembers])].map((name) => ({ name, checked: sheetMembers.includes(name) }));

  // Signed out there is no list to filter or re-display: hide the display menu and make the
  // search field a shortcut to sign-in instead of a live filter.
  const hasList = authStatus !== 'loading' && list.signedIn;
  const title = list.activeList ?? (type === 'MANGA' ? 'Manga List' : 'Anime List');
  const changeType = (t: MediaType) => {
    haptics.selection();
    setType(t);
  };
  const headerNode = NATIVE_SEARCH_HEADER ? (
    <>
      {/* The title is a left toolbar item (see `toolbarTitle`); the centred native one stays empty. */}
      <Stack.Screen options={{ headerShown: true, title: '' }} />
      {hasList ? (
        <DisplayToolbarMenu title={title} type={type} lists={list.lists} activeList={list.activeList} onSelectList={selectList} />
      ) : (
        <TitleToolbar title={title} />
      )}
      <MediaTypeToolbar value={type} onChange={changeType} />
      {hasList ? (
        <Stack.SearchBar
          ref={searchBar}
          placement="stacked"
          hideWhenScrolling={false}
          placeholder="Search"
          autoCapitalize="none"
          tintColor={theme.colors.accent}
          textColor={theme.colors.text}
          onChangeText={(e) => setSearch(e.nativeEvent.text)}
          onCancelButtonPress={() => setSearch('')}
        />
      ) : null}
    </>
  ) : (
    <ScreenHeader
      title={title}
      floating={header.floating}
      onHeightChange={header.onHeightChange}>
      <HeaderToolbar
        leading={hasList ? <DisplayMenu type={type} lists={list.lists} activeList={list.activeList} onSelectList={selectList} /> : undefined}
        search={
          hasList
            ? { value: search, onChangeText: setSearch, placeholder: 'Search' }
            : { placeholder: 'Search', onPress: () => router.push(hrefs.signIn()) }
        }
        mediaType={type}
        onMediaTypeChange={changeType}
      />
      <ProgressLine active={query.isFetching && !query.isPending && !refreshing} />
    </ScreenHeader>
  );

  let body;
  if (authStatus === 'loading' || !list.signedIn) {
    body = (
      <View style={[styles.fill, { paddingTop: header.inset }]}>
        {authStatus === 'loading' ? <LoadingState /> : <SignedOutState type={type} />}
      </View>
    );
  } else {
    const listHeader = (
      <View style={[styles.listHeader, NATIVE_SEARCH_HEADER && styles.listHeaderNative]}>
        {NATIVE_SEARCH_HEADER ? (
          <View style={styles.progress}>
            <ProgressLine active={query.isFetching && !query.isPending && !refreshing} />
          </View>
        ) : null}
        <SectionChips sections={list.sections} selected={list.searching ? null : list.selected} onSelect={list.select} onReorder={openReorder} />
        <ListInfoRow type={type} count={list.entries.length} />
      </View>
    );
    const empty = query.isPending ? (
      <ListSkeleton rows={6} />
    ) : query.isError && !query.data ? (
      <ErrorState error={query.error} onRetry={() => query.refetch()} fill={false} />
    ) : (
      <EmptySection label={list.searching ? title : selectedLabel} searching={list.searching && list.sectionTotal > 0} type={type} />
    );
    const common = {
      data: list.entries,
      keyExtractor: (e: ListEntry) => String(e.id),
      ListHeaderComponent: listHeader,
      ListEmptyComponent: empty,
      contentInsetAdjustmentBehavior: 'automatic' as const,
      keyboardDismissMode: 'on-drag' as const,
      keyboardShouldPersistTaps: 'handled' as const,
      scrollIndicatorInsets: { top: topPad },
      refreshControl: (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.textSecondary}
          colors={[theme.colors.accent]}
          progressBackgroundColor={theme.colors.surface}
          progressViewOffset={header.inset}
        />
      ),
      style: { backgroundColor: theme.colors.background },
    };
    const renderGridCard = (item: ListEntry) => (
      <EntryGridCard
        key={item.id}
        entry={item}
        type={type}
        width={cellWidth}
        scoreFormat={list.scoreFormat}
        preferredTitle={preferredTitle}
        hideChapters={hideChapters}
        now={now}
        onOpen={openMedia}
        onQuickEdit={quickEdit}
        onSwipe={actions.run}
      />
    );
    const renderRow = (item: ListEntry) => (
      <EntryRow
        entry={item}
        type={type}
        scoreFormat={list.scoreFormat}
        preferredTitle={preferredTitle}
        now={now}
        onOpen={openMedia}
        onQuickEdit={quickEdit}
        onSwipe={actions.run}
      />
    );
    body = list.searching ? (
      // Search covers the whole list, so the matches are grouped under their status.
      <FlatList<SearchRow>
        key={`search-${mode}`}
        {...common}
        data={searchRows(list.searchGroups, mode === 'grid' ? GRID_COLUMNS : 1)}
        keyExtractor={(r) => r.key}
        contentContainerStyle={[mode === 'grid' ? styles.gridContent : styles.listContent, { paddingTop: topPad }]}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <SectionHeader title={item.label} trailing={<AppText tone="secondary">{String(item.count)}</AppText>} style={styles.groupHeader} />
          ) : mode === 'grid' ? (
            <View style={[styles.gridRow, styles.searchGridRow]}>{item.entries.map(renderGridCard)}</View>
          ) : (
            renderRow(item.entries[0]!)
          )
        }
      />
    ) : mode === 'grid' ? (
        <FlatList
          key="grid"
          {...common}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridContent, { paddingTop: topPad }]}
          renderItem={({ item }) => renderGridCard(item)}
        />
      ) : (
        <FlatList
          key="list"
          {...common}
          contentContainerStyle={[styles.listContent, { paddingTop: topPad }]}
          renderItem={({ item }) => renderRow(item)}
        />
      );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {header.floating ? (
        <>
          {body}
          {headerNode}
        </>
      ) : (
        <>
          {headerNode}
          {body}
        </>
      )}
      <ReorderSheet
        visible={reordering}
        title={type === 'MANGA' ? 'Reorder: Manga list' : 'Reorder: Anime list'}
        items={list.sections}
        onReorder={(keys) => {
          // Pin the current chip first: an unpicked selection follows whichever chip is first.
          if (list.selected) list.select(list.selected);
          setSectionOrder(type, applyVisibleOrder(getSettings().listSectionOrder[type], keys as ListSectionKey[]));
        }}
        onReset={() => resetSectionOrder(type, list.customNames)}
        onClose={() => setReordering(false)}
      />
      <CustomListSheet
        visible={!!sheetEntry}
        title={sheetEntry ? sheetTitle(sheetEntry, preferredTitle) : ''}
        lists={sheetLists}
        onToggle={(name, checked) => sheetEntry && actions.toggleCustomList(sheetEntry, name, checked)}
        onManage={() => {
          actions.closeCustomLists();
          router.push(hrefs.settings.customLists(type));
        }}
        onClose={actions.closeCustomLists}
      />
    </View>
  );
}

type SearchRow =
  | { kind: 'header'; key: string; label: string; count: number }
  | { kind: 'entries'; key: string; entries: ListEntry[] };

/** Flattens search groups into header rows and entry rows (`perRow` entries each: 1 for list, 3 for grid). */
function searchRows(groups: readonly SearchGroup[], perRow: number): SearchRow[] {
  const rows: SearchRow[] = [];
  for (const g of groups) {
    rows.push({ kind: 'header', key: `h-${g.key}`, label: g.label, count: g.entries.length });
    for (let i = 0; i < g.entries.length; i += perRow) {
      const chunk = g.entries.slice(i, i + perRow);
      rows.push({ kind: 'entries', key: `${g.key}-${chunk[0]!.id}`, entries: chunk });
    }
  }
  return rows;
}

function sheetTitle(entry: ListEntry, preferred: Parameters<typeof pickTitle>[1]) {
  return pickTitle(entry.media.title, preferred);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  listHeader: { gap: 10, paddingTop: 8, paddingBottom: 10 },
  // The native search bar already leaves room below itself.
  listHeaderNative: { paddingTop: 2 },
  progress: { position: 'absolute', top: 0, left: 0, right: 0 },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  gridContent: { paddingBottom: 24, flexGrow: 1 },
  gridRow: { gap: GRID_GAP, paddingHorizontal: GRID_INSET, marginBottom: 14 },
  searchGridRow: { flexDirection: 'row' },
  groupHeader: { marginTop: 12, marginBottom: 6 },
});
