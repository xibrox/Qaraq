import { useEffect, useState } from 'react';

import { useMediaListCollection } from '@/api/queries/hooks';
import type { MediaType, ScoreFormat } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { syncCustomListSections, useSettings } from '@/settings/store';
import type { ListSectionKey } from '@/settings/types';

import {
  customListNames,
  customSectionKey,
  filterEntries,
  groupByStatus,
  groupSections,
  isCustomSection,
  uniqueEntries,
  sectionLabel,
  sortEntries,
  type ListEntry,
} from './list-model';

export type ListSection = { key: ListSectionKey; label: string; count: number };

export type SearchGroup = { key: ListSectionKey; label: string; entries: ListEntry[] };

/** One entry of the "Choose Anime List" menu: the main list (`name` null) or a custom list. */
export type ListChoice = { name: string | null; count: number };

/**
 * My List data for one media type. Like AniClient, the main list and each custom list are
 * separate lists ("Choose Anime List"); the chips are the statuses (in the user's chip order)
 * within the chosen list. Returns the selected status's entries sorted by the sort pill and
 * filtered by the search text.
 */
export function useMyList(type: MediaType, search: string) {
  const signedIn = useIsSignedIn();
  const viewerId = useViewerId();
  const query = useMediaListCollection(
    { userId: viewerId ?? undefined, type, forceSingleCompletedList: true },
    { enabled: signedIn },
  );
  const { sort, preferredTitle, order, hidden } = useSettings((s) => ({
    sort: s.listSort[type],
    preferredTitle: s.preferredTitle,
    order: s.listSectionOrder[type],
    hidden: s.hiddenListSections[type],
  }));
  const sectionKeys = order.filter((k) => !isCustomSection(k) && !hidden.includes(k));

  const customNames = customListNames(query.data, type);
  const customKey = customNames.join('\u0000');
  useEffect(() => {
    if (query.data) syncCustomListSections(type, customKey ? customKey.split('\u0000') : []);
  }, [type, customKey, query.data]);

  const grouped = groupSections(query.data);
  const [activeByType, setActiveByType] = useState<Partial<Record<MediaType, string>>>({});
  const wantedList = activeByType[type];
  // Falls back to the main list if the chosen custom list was deleted or renamed.
  const activeList = wantedList && customNames.includes(wantedList) ? wantedList : null;
  const selectList = (name: string | null) => setActiveByType((prev) => ({ ...prev, [type]: name ?? undefined }));
  const source = activeList ? groupByStatus(grouped.get(customSectionKey(activeList)) ?? []) : grouped;

  const sections: ListSection[] = sectionKeys.map((key) => ({
    key,
    label: sectionLabel(key, type),
    count: source.get(key)?.length ?? 0,
  }));
  const mainCount = [...grouped].reduce((n, [key, entries]) => (isCustomSection(key) ? n : n + entries.length), 0);
  const lists: ListChoice[] = [
    { name: null, count: mainCount },
    ...customNames.map((name) => ({ name, count: grouped.get(customSectionKey(name))?.length ?? 0 })),
  ];

  const [selectedByType, setSelectedByType] = useState<Partial<Record<MediaType, ListSectionKey>>>({});
  const wanted = selectedByType[type];
  const selected: ListSectionKey | null =
    wanted && sectionKeys.includes(wanted) ? wanted : (sectionKeys[0] ?? null);
  const select = (key: ListSectionKey) => setSelectedByType((prev) => ({ ...prev, [type]: key }));

  const sectionEntries = selected ? (source.get(selected) ?? []) : [];
  // Searching covers every status of the chosen list, not just the selected chip.
  const searching = search.trim().length > 0;
  const searchPool = searching ? uniqueEntries(sectionKeys.flatMap((k) => source.get(k) ?? [])) : sectionEntries;
  const entries: ListEntry[] = filterEntries(sortEntries(searchPool, sort, preferredTitle), search);
  // While searching, the matches grouped under their status ("Watching", "Completed"…) in chip order.
  const searchGroups: SearchGroup[] = searching
    ? sectionKeys
        .map((key) => ({
          key,
          label: sectionLabel(key, type),
          entries: filterEntries(sortEntries(source.get(key) ?? [], sort, preferredTitle), search),
        }))
        .filter((g) => g.entries.length > 0)
    : [];

  const options = query.data?.MediaListCollection?.user?.mediaListOptions;
  const scoreFormat: ScoreFormat = options?.scoreFormat ?? 'POINT_10_DECIMAL';

  return {
    query,
    signedIn,
    sections,
    /** "Choose Anime List" entries: the main list, then each custom list. */
    lists,
    /** The chosen custom list's name, or null for the main list. */
    activeList,
    selectList,
    selected,
    select,
    entries,
    /** Entries searched before filtering: the selected section, or the whole list while searching. */
    sectionTotal: searchPool.length,
    /** True while the search text filters the whole list instead of the selected chip. */
    searching,
    searchGroups,
    customNames,
    scoreFormat,
    /** Finds an entry anywhere in the collection (for the custom-list sheet). */
    findEntry: (entryId: number): ListEntry | undefined => {
      for (const list of grouped.values()) {
        const hit = list.find((e) => e.id === entryId);
        if (hit) return hit;
      }
      return undefined;
    },
  };
}
