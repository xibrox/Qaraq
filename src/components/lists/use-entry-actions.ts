import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useDeleteMediaListEntry, useIncrementProgress, useSaveMediaListEntry } from '@/api/queries/hooks';
import { buildToggleCustomListVariables } from '@/api/lists';
import type { MediaType } from '@/api/types';
import { describeError } from '@/components/error-state';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { getSettings } from '@/settings/store';
import type { SwipeAction } from '@/settings/types';

import { entryTotal, type ListEntry } from './list-model';

function reportError(error: unknown) {
  toast.error(describeError(error).message);
}

/**
 * Row actions shared by the swipe gestures and menus: "+1 Episode/Chapter" (optimistic, asks
 * before auto-completing at the last unit), "Custom List" (opens the toggle sheet) and
 * "Delete" (confirmed).
 */
export function useEntryActions(type: MediaType, customListCount: number) {
  const increment = useIncrementProgress();
  const remove = useDeleteMediaListEntry();
  const save = useSaveMediaListEntry();
  const [customListEntryId, setCustomListEntryId] = useState<number | null>(null);

  const titleOf = (entry: ListEntry) => pickTitle(entry.media.title, getSettings().preferredTitle);
  const unit = type === 'MANGA' ? 'chapter' : 'episode';

  const runIncrement = (entry: ListEntry, autoComplete: boolean) => {
    increment
      .mutateAsync({ entry, media: entry.media, options: { autoComplete } })
      .then(() => {
        if (autoComplete) toast.success(`${titleOf(entry)} completed`);
      })
      .catch(reportError);
  };

  const incrementEntry = (entry: ListEntry) => {
    const total = entryTotal(entry.media);
    const progress = entry.progress ?? 0;
    if (total != null && progress >= total) {
      toast(`Already at the last ${unit}`);
      return;
    }
    const next = progress + 1;
    if (total != null && next >= total && entry.status !== 'COMPLETED') {
      Alert.alert(
        titleOf(entry),
        `That was the last ${unit} (${next}/${total}). Mark it as Completed?`,
        [
          { text: `Just +1 ${unit === 'episode' ? 'Episode' : 'Chapter'}`, onPress: () => runIncrement(entry, false) },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', style: 'default', isPreferred: true, onPress: () => runIncrement(entry, true) },
        ],
      );
      return;
    }
    runIncrement(entry, false);
  };

  const deleteEntry = (entry: ListEntry) => {
    Alert.alert('Delete Entry', `Remove ${titleOf(entry)} from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.destructive();
          remove
            .mutateAsync({ id: entry.id, mediaId: entry.mediaId })
            .then(() => toast('Removed from your list'))
            .catch(reportError);
        },
      },
    ]);
  };

  const openCustomLists = (entry: ListEntry) => {
    if (customListCount === 0) {
      Alert.alert('No Custom Lists', `You have no custom ${type === 'MANGA' ? 'manga' : 'anime'} lists yet.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create One', onPress: () => router.push(hrefs.settings.customLists(type)) },
      ]);
      return;
    }
    setCustomListEntryId(entry.id);
  };

  const toggleCustomList = (entry: ListEntry, listName: string, add: boolean) => {
    haptics.selection();
    save
      .mutateAsync({ ...buildToggleCustomListVariables(entry, listName, add), meta: { mediaId: entry.mediaId } })
      .catch(reportError);
  };

  const run = (action: SwipeAction, entry: ListEntry) => {
    if (action === 'increment') incrementEntry(entry);
    else if (action === 'customList') openCustomLists(entry);
    else deleteEntry(entry);
  };

  return {
    run,
    incrementEntry,
    deleteEntry,
    openCustomLists,
    toggleCustomList,
    customListEntryId,
    closeCustomLists: () => setCustomListEntryId(null),
  };
}
