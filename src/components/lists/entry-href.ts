import type { Href } from 'expo-router';

import { hrefs, type EntryEditorMode } from '@/navigation/hrefs';

export type { EntryEditorMode };

/**
 * Entry editor sheet href with a mode. `quick` is the AniClient quick edit sheet opened from a
 * row's "•••" (status, progress, score, dates, notes, custom lists; "≡" expands it), `full`
 * (the default) shows every field. Thin alias of `hrefs.entry`.
 */
export function entryEditorHref(mediaId: number, mode: EntryEditorMode = 'full'): Href {
  return hrefs.entry(mediaId, mode);
}
