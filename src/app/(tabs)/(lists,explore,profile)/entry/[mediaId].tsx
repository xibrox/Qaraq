import { useLocalSearchParams } from 'expo-router';

import { EntryEditor } from '@/components/lists/editor/entry-editor';

/**
 * Entry editor sheet (formSheet). `mode=quick` is the My List "•••" quick edit sheet; the
 * default is the full editor (media detail FAB, `hrefs.entry(mediaId)`).
 */
export default function EntryEditorScreen() {
  const { mediaId, mode } = useLocalSearchParams<{ mediaId: string; mode?: string }>();
  return <EntryEditor key={mediaId} mediaId={Number(mediaId)} mode={mode === 'quick' ? 'quick' : 'full'} />;
}
