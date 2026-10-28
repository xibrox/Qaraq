import { useEffect, useState } from 'react';

import { useMediaListCollection } from '@/api/queries/hooks';
import type { MediaType, ScoreFormat } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { syncCustomListSections, useSettings } from '@/settings/store';
import type { ListSectionKey } from '@/settings/types';

import { customListNames, filterEntries, groupSections, sectionLabel, sortEntries, type ListEntry } from './list-model';

export type ListSection = { key: ListSectionKey; label: string; count: number };

/**
 * My List data for one media type: the viewer's collection grouped into chip sections
 * (statuses in the user's chip order, then custom lists), the selected section's entries
 * sorted by the sort pill and filtered by the search text.
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
  const sectionKeys = order.filter((k) => !hidden.includes(k));

  const customNames = customListNames(query.data, type);
  const customKey = customNames.join('\u0000');
  useEffect(() => {
    if (query.data) syncCustomListSections(type, customKey ? customKey.split('\u0000') : []);
  }, [type, customKey, query.data]);

  const grouped = groupSections(query.data);
  const sections: ListSection[] = sectionKeys.map((key) => ({
    key,
    label: sectionLabel(key, type),
    count: grouped.get(key)?.length ?? 0,
  }));

  const [selectedByType, setSelectedByType] = useState<Partial<Record<MediaType, ListSectionKey>>>({});
  const wanted = selectedByType[type];
  const selected: ListSectionKey | null =
    wanted && sectionKeys.includes(wanted) ? wanted : (sectionKeys[0] ?? null);
  const select = (key: ListSectionKey) => setSelectedByType((prev) => ({ ...prev, [type]: key }));

  const sectionEntries = selected ? (grouped.get(selected) ?? []) : [];
  const entries: ListEntry[] = filterEntries(sortEntries(sectionEntries, sort, preferredTitle), search);

  const options = query.data?.MediaListCollection?.user?.mediaListOptions;
  const scoreFormat: ScoreFormat = options?.scoreFormat ?? 'POINT_10_DECIMAL';

  return {
    query,
    signedIn,
    sections,
    selected,
    select,
    entries,
    /** Entries in the selected section before search filtering. */
    sectionTotal: sectionEntries.length,
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
