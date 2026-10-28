import { Host, Switch } from '@expo/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { queryKeys, useSaveMessageActivity, useSaveTextActivity } from '@/api/queries/hooks';
import { AppText } from '@/components/app-text';
import { describeError } from '@/components/error-state';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { FormattingBar } from './composer/formatting-bar';
import { useMarkdownEditor } from './composer/use-markdown-editor';
import { RNBottomSheet } from './rn-bottom-sheet';

/** What the compose sheet writes: a new/edited text status, or a message on a user's profile. */
export type ComposeTarget =
  | { kind: 'status'; activityId?: number; initialText?: string }
  | { kind: 'message'; recipient: { id: number; name: string }; activityId?: number; initialText?: string; isPrivate?: boolean };

export type ComposeSheetProps = {
  target: ComposeTarget | null;
  onDismiss: () => void;
};

/** Native bottom sheet for writing a text status or a profile message (AniList markdown). */
export function ComposeSheet({ target, onDismiss }: ComposeSheetProps) {
  const theme = useTheme();
  return (
    <RNBottomSheet isPresented={target != null} onDismiss={onDismiss} snapPoints={['full']} containerColor={theme.colors.surface}>
      {target ? <ComposeForm key={composeKey(target)} target={target} onDone={onDismiss} /> : null}
    </RNBottomSheet>
  );
}

function composeKey(t: ComposeTarget) {
  return `${t.kind}-${t.activityId ?? 'new'}-${t.kind === 'message' ? t.recipient.id : ''}`;
}

function titleFor(t: ComposeTarget): string {
  if (t.kind === 'status') return t.activityId ? 'Edit Status' : 'New Status';
  return t.activityId ? 'Edit Message' : `Message ${t.recipient.name}`;
}

function ComposeForm({ target, onDone }: { target: ComposeTarget; onDone: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const editor = useMarkdownEditor(target.initialText ?? '');
  const [isPrivate, setPrivate] = useState(target.kind === 'message' ? !!target.isPrivate : false);
  const saveText = useSaveTextActivity();
  const saveMessage = useSaveMessageActivity();
  const qc = useQueryClient();
  const saving = saveText.isPending || saveMessage.isPending;

  const submit = async () => {
    const text = editor.text.trim();
    if (!text || saving) return;
    try {
      if (target.kind === 'status') {
        await saveText.mutateAsync({ id: target.activityId, text });
      } else {
        await saveMessage.mutateAsync({ id: target.activityId, message: text, recipientId: target.recipient.id, private: isPrivate });
      }
      if (target.activityId) void qc.invalidateQueries({ queryKey: queryKeys.activity.detail(target.activityId) });
      haptics.success();
      toast.success(target.activityId ? 'Saved' : target.kind === 'status' ? 'Status posted' : 'Message sent');
      editor.reset();
      onDone();
    } catch (e) {
      haptics.error();
      toast.error(describeError(e).message);
    }
  };

  const canPost = !editor.isEmpty && !saving;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onDone} hitSlop={8} accessibilityRole="button" style={styles.headerSide}>
          <AppText variant="callout" tone="secondary">
            Cancel
          </AppText>
        </Pressable>
        <AppText variant="headline" numberOfLines={1} style={styles.headerTitle} align="center">
          {titleFor(target)}
        </AppText>
        <Pressable
          onPress={submit}
          disabled={!canPost}
          hitSlop={8}
          accessibilityRole="button"
          style={[styles.headerSide, styles.headerRight]}>
          <View style={[styles.post, { backgroundColor: canPost ? c.accent : c.fill }]}>
            <AppText variant="footnote" weight="800" color={canPost ? c.onAccent : c.textTertiary} uppercase>
              {saving ? 'Posting' : target.activityId ? 'Save' : 'Post'}
            </AppText>
          </View>
        </Pressable>
      </View>
      <TextInput
        value={editor.text}
        onChangeText={editor.onChangeText}
        selection={editor.selection}
        onSelectionChange={editor.onSelectionChange}
        placeholder={target.kind === 'status' ? "What's on your mind?" : 'Write a message...'}
        placeholderTextColor={c.textTertiary}
        multiline
        autoFocus
        textAlignVertical="top"
        style={[styles.input, { color: c.text, fontFamily: theme.fontFamily, backgroundColor: c.field, borderRadius: theme.radii.xl }]}
      />
      {target.kind === 'message' ? (
        <View style={styles.privateRow}>
          <AppText variant="callout" style={styles.flex}>
            Private
          </AppText>
          <Host matchContents>
            <Switch value={isPrivate} onValueChange={setPrivate} />
          </Host>
        </View>
      ) : null}
      <FormattingBar onAction={editor.apply} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  headerSide: { width: 80 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { flex: 1 },
  post: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  input: { flex: 1, minHeight: 96, marginHorizontal: 16, marginBottom: 12, padding: 12, fontSize: 16 },
  privateRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  flex: { flex: 1 },
});
