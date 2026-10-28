import { useState, type Ref } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { Icon } from '@/components/icon';
import { useTheme } from '@/theme';

import { activityIcons } from '../activity-icons';
import { FormattingBar } from './formatting-bar';
import type { MarkdownEditor } from './use-markdown-editor';

export type ReplyComposerProps = {
  editor: MarkdownEditor;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: Ref<TextInputInstance>;
  /** Extra bottom padding (safe area) when the keyboard is hidden. */
  bottomInset?: number;
  /** Tapping the field while `disabled` (e.g. a guest: open sign-in). */
  onDisabledPress?: () => void;
};

/**
 * Pinned reply bar: "Write a reply..." field and a circular ↑ send button. The formatting bar
 * appears under it while the field is focused, right above the keyboard (as in AniClient).
 */
export function ReplyComposer({
  editor,
  onSend,
  sending,
  disabled,
  placeholder = 'Write a reply...',
  inputRef,
  bottomInset = 0,
  onDisabledPress,
}: ReplyComposerProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const canSend = !editor.isEmpty && !sending && !disabled;

  return (
    <View style={[styles.wrap, { backgroundColor: c.background, borderTopColor: c.separator }]}>
      <View style={[styles.row, { paddingBottom: focused ? 8 : 8 + bottomInset }]}>
        <TextInput
          ref={inputRef}
          value={editor.text}
          onChangeText={editor.onChangeText}
          selection={editor.selection}
          onSelectionChange={editor.onSelectionChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={c.textTertiary}
          editable={!disabled}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: c.field,
              color: c.text,
              fontFamily: theme.fontFamily,
              borderRadius: theme.radii.lg,
            },
          ]}
        />
        {disabled && onDisabledPress ? (
          <Pressable
            onPress={onDisabledPress}
            accessibilityRole="button"
            accessibilityLabel={placeholder}
            style={styles.disabledOverlay}
          />
        ) : null}
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send reply"
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: canSend ? c.accent : c.fill, opacity: pressed ? 0.7 : 1 },
          ]}>
          {sending ? (
            <ActivityIndicator size="small" color={c.onAccent} />
          ) : (
            <Icon name={activityIcons.send} size={18} weight="bold" color={canSend ? c.onAccent : c.background} />
          )}
        </Pressable>
      </View>
      {focused ? <FormattingBar onAction={editor.apply} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 140, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, fontSize: 16 },
  // Covers the non-editable field (row padding: 8 top, 16 sides; 36 send button + 10 gap).
  disabledOverlay: { position: 'absolute', top: 8, bottom: 8, left: 16, right: 62 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
