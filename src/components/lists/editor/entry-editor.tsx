import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteMediaListEntry, useMediaListEntry, useSaveMediaListEntry, useViewer } from '@/api/queries/hooks';
import { useFavouriteToggle } from '@/api/queries/people';
import type { MediaType } from '@/api/types';
import { useIsSignedIn } from '@/auth';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { describeError, ErrorState } from '@/components/error-state';
import { IconButton } from '@/components/icon-button';
import { LoadingState } from '@/components/loading-state';
import { PrimaryButton } from '@/components/primary-button';
import { toast } from '@/components/toast';
import { CAN_LIQUID_GLASS } from '@/lib/glass';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSettings } from '@/settings/store';
import { useTheme } from '@/theme';

import type { EntryEditorMode } from '../entry-href';
import { listIcons } from '../list-icons';
import { CustomListChips } from './custom-list-chips';
import { DateField } from './date-field';
import {
  averageAdvanced,
  draftFromEntry,
  draftToVariables,
  supportsAdvancedScoring,
  totalUnits,
  totalVolumes,
  withProgress,
  withStatus,
  withVolumes,
  type EntryDraft,
} from './editor-model';
import { EditorField } from './editor-field';
import { estimatedSaveBarHeight, SaveBar } from './save-bar';
import { ScoreInput, ScoreSummary } from './score-input';
import { StatusGrid } from './status-grid';
import { ToggleRow } from './toggle-row';
import { ValueStepper } from './value-stepper';

export type EntryEditorProps = {
  mediaId: number;
  /** `quick`: AniClient's quick edit sheet (the "≡" button expands it); `full`: every field. */
  mode: EntryEditorMode;
};

const fraction = (n: number | null) => (n == null ? '-' : String(n));

/**
 * Entry editor sheet. Quick mode matches AniClient's sheet: title, Status grid, Episodes and
 * Score steppers, Start/Finish dates, Notes and custom lists, with a pinned "SAVE". Full mode
 * adds volumes, advanced scores, rewatches, Private, Hide from status lists, Favorite and Delete.
 * Swipe down dismisses without saving.
 */
export function EntryEditor({ mediaId, mode }: EntryEditorProps) {
  const theme = useTheme();
  const c = theme.colors;
  const signedIn = useIsSignedIn();
  const entryQuery = useMediaListEntry(signedIn ? mediaId : null);
  const viewer = useViewer({ enabled: signedIn });
  const save = useSaveMediaListEntry();
  const remove = useDeleteMediaListEntry();
  const favourite = useFavouriteToggle();
  const { preferredTitle, hideChapters, hideVolumes } = useSettings((s) => ({
    preferredTitle: s.preferredTitle,
    hideChapters: s.hideMangaChapters,
    hideVolumes: s.hideMangaVolumes,
  }));
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(mode === 'full');
  // Measured height of the pinned SAVE bar (bar + safe area); content is padded by it so the
  // last field can always scroll clear of the bar.
  const [saveBarHeight, setSaveBarHeight] = useState<number | null>(null);
  const [edited, setEdited] = useState<EntryDraft | null>(null);

  const media = entryQuery.data?.Media ?? null;
  const entry = media?.mediaListEntry ?? null;
  const draft = edited ?? (media ? draftFromEntry(entry) : null);
  const type: MediaType = media?.type ?? 'ANIME';
  const manga = type === 'MANGA';

  const listOptions = viewer.data?.mediaListOptions;
  const scoreFormat = listOptions?.scoreFormat ?? 'POINT_10_DECIMAL';
  const typeOptions = manga ? listOptions?.mangaList : listOptions?.animeList;
  const advancedCategories =
    typeOptions?.advancedScoringEnabled && supportsAdvancedScoring(scoreFormat) ? (typeOptions.advancedScoring ?? []) : [];
  const customNames = [...new Set([...(typeOptions?.customLists ?? []), ...(draft?.customLists ?? [])])];

  const update = (fn: (d: EntryDraft) => EntryDraft) => {
    if (draft) setEdited(fn(draft));
  };

  const onSave = () => {
    if (!draft || !media) return;
    const vars = draftToVariables(draft, { entryId: entry?.id, mediaId: media.id }, advancedCategories.length ? advancedCategories : null);
    haptics.success();
    save
      .mutateAsync({ ...vars, meta: { mediaId: media.id } })
      .then(() => {
        if (!entry) toast.success('Added to your list');
      })
      .catch((e: unknown) => toast.error(describeError(e).message));
    router.back();
  };

  const onDelete = () => {
    if (!entry || !media) return;
    Alert.alert('Delete Entry', `Remove ${pickTitle(media.title, preferredTitle)} from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.destructive();
          remove
            .mutateAsync({ id: entry.id, mediaId: media.id })
            .then(() => toast('Removed from your list'))
            .catch((e: unknown) => toast.error(describeError(e).message));
          router.back();
        },
      },
    ]);
  };

  // Android sheets don't resize with their detent, so SAVE goes in the native sheet footer there.
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  });
  const [androidFooter] = useState(
    () =>
      function EditorSheetFooter() {
        return <SaveBar onSave={() => saveRef.current()} />;
      },
  );
  const footerInOptions = Platform.OS === 'android';

  // The Liquid Glass sheet material renders dark over the dimmed page even with a light app
  // theme, which left the theme's dark labels unreadable; light themes draw an opaque surface.
  const background = CAN_LIQUID_GLASS && theme.dark ? 'transparent' : c.surface;
  // iOS paints that surface through the screen's `contentStyle`, not the root View: an opaque root
  // View isn't flattened, so react-native-screens no longer finds the ScrollView to resize with the
  // detent, and the whole form vanished at the large detent in light themes.
  const rootBackground = footerInOptions ? background : undefined;
  const screenOptions = (
    <Stack.Screen
      options={footerInOptions ? { unstable_sheetFooter: androidFooter } : { contentStyle: { backgroundColor: background } }}
    />
  );

  if (!signedIn) {
    return (
      <View style={[styles.fill, { backgroundColor: rootBackground }]}>
        {screenOptions}
        <EmptyState
          icon={listIcons.signIn}
          title="Sign in to edit your list"
          actionLabel="Sign In"
          onAction={() => {
            router.back();
            router.push(hrefs.signIn());
          }}
        />
      </View>
    );
  }
  if (entryQuery.isPending) {
    return (
      <View style={[styles.fill, { backgroundColor: rootBackground }]}>
        {screenOptions}
        <LoadingState />
      </View>
    );
  }
  if (!media || !draft) {
    return (
      <View style={[styles.fill, { backgroundColor: rootBackground }]}>
        {screenOptions}
        <ErrorState error={entryQuery.error ?? new Error('Media not found')} onRetry={() => entryQuery.refetch()} />
      </View>
    );
  }

  const total = totalUnits(media);
  const volumesTotal = totalVolumes(media);
  const showProgress = !(manga && hideChapters);
  const showVolumes = manga && !hideVolumes && (expanded || hideChapters);
  const title = pickTitle(media.title, preferredTitle);
  const bottomClearance = (saveBarHeight ?? estimatedSaveBarHeight(insets.bottom)) + 16;

  return (
    <View style={[styles.fill, { backgroundColor: rootBackground }]}>
      {screenOptions}
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        scrollIndicatorInsets={{ bottom: bottomClearance - 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.titleRow}>
          <View style={styles.side} />
          <AppText variant="headline" align="center" numberOfLines={2} style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <View style={[styles.side, styles.sideRight]}>
            {!expanded ? (
              <IconButton
                icon={listIcons.expand}
                variant="circle"
                size={36}
                iconSize={16}
                accessibilityLabel="Open full editor"
                onPress={() => {
                  haptics.selection();
                  setExpanded(true);
                }}
              />
            ) : null}
          </View>
        </View>

        <EditorField label="Status:">
          <StatusGrid value={draft.status} type={type} onChange={(s) => update((d) => withStatus(d, s, media))} />
        </EditorField>

        {showProgress ? (
          <EditorField label={manga ? 'Chapters:' : 'Episodes:'} value={`${draft.progress} / ${fraction(total)}`}>
            <ValueStepper
              value={draft.progress}
              onDecrement={() => update((d) => withProgress(d, d.progress - 1, media))}
              onIncrement={() => update((d) => withProgress(d, d.progress + 1, media))}
              onSubmitValue={(v) => update((d) => withProgress(d, Math.round(v), media))}
              canDecrement={draft.progress > 0}
              canIncrement={total == null || draft.progress < total}
              accessibilityLabel={manga ? 'Chapters' : 'Episodes'}
            />
          </EditorField>
        ) : null}

        {showVolumes ? (
          <EditorField label="Volumes:" value={`${draft.progressVolumes} / ${fraction(volumesTotal)}`}>
            <ValueStepper
              value={draft.progressVolumes}
              onDecrement={() => update((d) => withVolumes(d, d.progressVolumes - 1, media))}
              onIncrement={() => update((d) => withVolumes(d, d.progressVolumes + 1, media))}
              onSubmitValue={(v) => update((d) => withVolumes(d, Math.round(v), media))}
              canDecrement={draft.progressVolumes > 0}
              canIncrement={volumesTotal == null || draft.progressVolumes < volumesTotal}
              accessibilityLabel="Volumes"
            />
          </EditorField>
        ) : null}

        <EditorField label="Score:" value={<ScoreSummary value={draft.score} format={scoreFormat} />}>
          <ScoreInput value={draft.score} format={scoreFormat} onChange={(score) => update((d) => ({ ...d, score }))} />
        </EditorField>

        {expanded && advancedCategories.length > 0 ? (
          <EditorField label="Advanced Scores:">
            {advancedCategories.map((category) => {
              const value = draft.advancedScores[category] ?? 0;
              return (
                <View key={category} style={styles.advancedRow}>
                  <AppText variant="label" tone="secondary" style={styles.advancedLabel} numberOfLines={1}>
                    {category}
                  </AppText>
                  <ScoreInput
                    value={value}
                    format={scoreFormat}
                    accessibilityLabel={`${category} score`}
                    onChange={(v) =>
                      update((d) => {
                        const advancedScores = { ...d.advancedScores, [category]: v };
                        return { ...d, advancedScores, score: averageAdvanced(advancedScores, advancedCategories, scoreFormat) ?? d.score };
                      })
                    }
                  />
                </View>
              );
            })}
          </EditorField>
        ) : null}

        <View style={styles.dates}>
          <EditorField label="Start Date:" style={styles.fill}>
            <DateField label="Start Date" value={draft.startedAt} onChange={(startedAt) => update((d) => ({ ...d, startedAt }))} />
          </EditorField>
          <EditorField label="Finish Date:" style={styles.fill}>
            <DateField label="Finish Date" value={draft.completedAt} onChange={(completedAt) => update((d) => ({ ...d, completedAt }))} />
          </EditorField>
        </View>

        <EditorField label="Notes:">
          <TextInput
            value={draft.notes}
            onChangeText={(notes) => update((d) => ({ ...d, notes }))}
            multiline
            placeholder="Add a note"
            placeholderTextColor={c.textTertiary}
            selectionColor={c.accent}
            keyboardAppearance={theme.dark ? 'dark' : 'light'}
            accessibilityLabel="Notes"
            style={[
              styles.notes,
              { backgroundColor: c.surfaceElevated, color: c.text, borderRadius: theme.radii.md, fontFamily: theme.fontFamily },
            ]}
          />
        </EditorField>

        {customNames.length > 0 ? (
          <EditorField label="Custom Lists:">
            <CustomListChips names={customNames} selected={draft.customLists} onChange={(customLists) => update((d) => ({ ...d, customLists }))} />
          </EditorField>
        ) : null}

        {expanded ? (
          <>
            <EditorField label={manga ? 'Rereads:' : 'Rewatches:'} value={String(draft.repeat)}>
              <ValueStepper
                value={draft.repeat}
                onDecrement={() => update((d) => ({ ...d, repeat: Math.max(0, d.repeat - 1) }))}
                onIncrement={() => update((d) => ({ ...d, repeat: d.repeat + 1 }))}
                onSubmitValue={(v) => update((d) => ({ ...d, repeat: Math.max(0, Math.round(v)) }))}
                canDecrement={draft.repeat > 0}
                accessibilityLabel={manga ? 'Rereads' : 'Rewatches'}
              />
            </EditorField>
            <View style={styles.toggles}>
              <ToggleRow
                title="Private"
                subtitle="Only you can see this entry"
                value={draft.private}
                onValueChange={(v) => update((d) => ({ ...d, private: v }))}
              />
              <ToggleRow
                title="Hide from status lists"
                subtitle="Only show it in custom lists"
                value={draft.hiddenFromStatusLists}
                onValueChange={(v) => update((d) => ({ ...d, hiddenFromStatusLists: v }))}
              />
              <ToggleRow
                title="Favorite"
                subtitle="Saved right away, separately from SAVE"
                value={media.isFavourite}
                onValueChange={() => favourite.toggle({ kind: manga ? 'manga' : 'anime', id: media.id }, media.isFavourite)}
              />
            </View>
            {entry ? (
              <PrimaryButton label="Delete Entry" variant="destructive" size="sm" onPress={onDelete} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
      {footerInOptions ? null : (
        // Overlaid so the content scrolls behind it (spec §9); the padding above keeps it reachable.
        <View style={styles.saveOverlay} onLayout={(e) => setSaveBarHeight(e.nativeEvent.layout.height)}>
          <SaveBar onSave={onSave} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 18 },
  saveOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36 },
  side: { width: 40 },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1 },
  dates: { flexDirection: 'row', gap: 12 },
  notes: { minHeight: 88, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, fontSize: 16, textAlignVertical: 'top' },
  advancedRow: { gap: 6 },
  advancedLabel: { textAlign: 'center' },
  toggles: { gap: 10 },
});
