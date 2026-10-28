import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Keyboard, Platform, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MediaType } from '@/api/types';
import { useAuthStatus } from '@/auth';
import { ErrorState } from '@/components/error-state';
import { HeaderToolbar } from '@/components/header-toolbar';
import { LoadingState } from '@/components/loading-state';
import { ProgressLine } from '@/components/progress-line';
import { ScreenHeader, useFloatingHeader } from '@/components/screen-header';
import { ListSkeleton } from '@/components/skeleton';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSetting, useSettings } from '@/settings/store';
import { useTheme } from '@/theme';

import { CustomListSheet } from './custom-list-sheet/custom-list-sheet';
import { DisplayMenu } from './display-menu';
import { EntryGridCard } from './entry-grid-card';
import { entryEditorHref } from './entry-href';
import { EntryRow } from './entry-row';
import { EmptySection, SignedOutState } from './list-empty';
import { entryCustomListNames } from '@/api/lists';
import type { ListEntry } from './list-model';
import { SectionChips } from './section-chips';
import { ListInfoRow } from './sort-controls';
import { useEntryActions } from './use-entry-actions';
import { useMyList } from './use-my-list';
import { useNow } from './use-now';

const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const GRID_INSET = 12;

/**
 * "My List" tab root: "Anime List"/"Manga List" header (toolbar + search + Anime|Manga), the
 * status/custom-list chips with count, sort pill and direction, then the rows (or a 3-column
 * grid). Rows swipe per Gesture Settings; "•••" opens the quick edit sheet.
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
  const { mode, preferredTitle, hideChapters } = useSettings((s) => ({
    mode: s.listDisplayMode[type],
    preferredTitle: s.preferredTitle,
    hideChapters: s.hideMangaChapters,
  }));
  const list = useMyList(type, search);
  const actions = useEntryActions(type, list.customNames.length);
  const header = useFloatingHeader();
  const now = useNow();

  const { query } = list;
  // Resign the search field before pushing, or UIKit re-focuses it when the screen pops back.
  const openMedia = (entry: ListEntry) => {
    Keyboard.dismiss();
    router.push(hrefs.media(entry.mediaId));
  };
  const quickEdit = (entry: ListEntry) => {
    Keyboard.dismiss();
    haptics.selection();
    router.push(entryEditorHref(entry.mediaId, 'quick'));
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
  const headerNode = (
    <ScreenHeader
      title={type === 'MANGA' ? 'Manga List' : 'Anime List'}
      floating={header.floating}
      onHeightChange={header.onHeightChange}>
      <HeaderToolbar
        leading={hasList ? <DisplayMenu type={type} /> : undefined}
        search={
          hasList
            ? { value: search, onChangeText: setSearch, placeholder: 'Search' }
            : { placeholder: 'Search', onPress: () => router.push(hrefs.signIn()) }
        }
        mediaType={type}
        onMediaTypeChange={(t) => {
          haptics.selection();
          setType(t);
        }}
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
      <View style={styles.listHeader}>
        <SectionChips sections={list.sections} selected={list.selected} onSelect={list.select} />
        <ListInfoRow type={type} count={list.entries.length} />
      </View>
    );
    const empty = query.isPending ? (
      <ListSkeleton rows={6} />
    ) : query.isError && !query.data ? (
      <ErrorState error={query.error} onRetry={() => query.refetch()} fill={false} />
    ) : (
      <EmptySection label={selectedLabel} searching={search.trim().length > 0 && list.sectionTotal > 0} type={type} />
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
    body =
      mode === 'grid' ? (
        <FlatList
          key="grid"
          {...common}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridContent, { paddingTop: topPad }]}
          renderItem={({ item }) => (
            <EntryGridCard
              entry={item}
              type={type}
              width={cellWidth}
              scoreFormat={list.scoreFormat}
              preferredTitle={preferredTitle}
              hideChapters={hideChapters}
              now={now}
              onOpen={openMedia}
              onQuickEdit={quickEdit}
            />
          )}
        />
      ) : (
        <FlatList
          key="list"
          {...common}
          contentContainerStyle={[styles.listContent, { paddingTop: topPad }]}
          renderItem={({ item }) => (
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
          )}
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

function sheetTitle(entry: ListEntry, preferred: Parameters<typeof pickTitle>[1]) {
  return pickTitle(entry.media.title, preferred);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  listHeader: { gap: 10, paddingTop: 8, paddingBottom: 10 },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  gridContent: { paddingBottom: 24, flexGrow: 1 },
  gridRow: { gap: GRID_GAP, paddingHorizontal: GRID_INSET, marginBottom: 14 },
});
