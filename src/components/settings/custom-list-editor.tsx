import { usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Fab } from '@/components/fab';
import { Icon, icons, type IconName } from '@/components/icon';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { confirm } from './confirm';

export type CustomListEditorProps = {
  /** Custom list names currently saved on AniList. */
  lists: readonly string[];
  saving?: boolean;
  /** Persist the final list of names (current, renamed, then new). */
  onSave: (names: string[]) => void;
};

type Draft = { id: number; original?: string; name: string };

const SAVE_ICON: IconName = { ios: 'square.and.arrow.down', android: 'save' };
const INPUT_HEIGHT = 44;

/** Trimmed, non-empty, de-duplicated names in order. */
function finalNames(drafts: readonly Draft[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of drafts) {
    const name = d.name.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function SectionBar({ title, count }: { title: string; count: number }) {
  const c = useTheme().colors;
  return (
    <View style={[styles.bar, { backgroundColor: c.surface }]} accessibilityRole="header">
      <AppText variant="callout" tone="secondary">
        {title}
      </AppText>
      <AppText variant="callout" tone="secondary">
        {count}
      </AppText>
    </View>
  );
}

function ListField({ value, onChangeText, onDelete }: { value: string; onChangeText: (v: string) => void; onDelete: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.fieldRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="List name"
        placeholderTextColor={c.textTertiary}
        autoCorrect={false}
        returnKeyType="done"
        accessibilityLabel="Custom list name"
        style={[
          styles.field,
          { backgroundColor: c.field, color: c.text, fontFamily: theme.fontFamily, fontSize: theme.typography.callout.fontSize },
        ]}
      />
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${value || 'list'}`}
        hitSlop={4}
        style={({ pressed }) => [styles.delete, { backgroundColor: c.danger, opacity: pressed ? 0.8 : 1 }]}>
        <Icon name={icons.close} size={18} color="#FFFFFF" weight="bold" />
      </Pressable>
    </View>
  );
}

/**
 * AniClient's "Anime Custom List" editor: "Current" lists with editable names and a red ✕,
 * "New" lists added from the bottom "Add New Custom List!" pill, and a save FAB.
 * Nothing is sent until Save; removing a saved list asks for confirmation then.
 */
export function CustomListEditor({ lists, saving, onSave }: CustomListEditorProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<Draft[]>(() => lists.map((name, i) => ({ id: i, original: name, name })));
  const [added, setAdded] = useState<Draft[]>([]);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(lists.length);

  // Ask before leaving with unsaved edits (AniClient drops nothing silently either).
  const draftNames = finalNames([...current, ...added]);
  const dirty = draftNames.length !== lists.length || draftNames.some((n, i) => n !== lists[i]);
  const [leaving, setLeaving] = useState(false);
  usePreventRemove(dirty && !saving && !leaving, ({ repeat }) => {
    void confirm({
      title: 'Discard Changes?',
      message: 'Your custom list changes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep Editing',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      setLeaving(true);
      repeat();
    });
  });

  const addList = () => {
    const name = input.trim();
    if (!name) return;
    haptics.selection();
    setAdded((a) => [...a, { id: nextId, name }]);
    setNextId((n) => n + 1);
    setInput('');
  };

  const save = async () => {
    const names = finalNames([...current, ...added]);
    const removed = lists.filter((l) => !names.includes(l));
    const unchanged = removed.length === 0 && names.length === lists.length && names.every((n, i) => n === lists[i]);
    if (unchanged) {
      onSave(names);
      return;
    }
    if (removed.length > 0) {
      const ok = await confirm({
        title: removed.length === 1 ? `Remove "${removed[0]}"?` : `Remove ${removed.length} lists?`,
        message: 'Entries in removed or renamed lists are taken out of them on AniList.',
        confirmLabel: 'Save',
        destructive: true,
      });
      if (!ok) return;
    }
    onSave(names);
  };

  const pillBottom = Math.max(insets.bottom, 12);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: INPUT_HEIGHT + pillBottom + 96 }}>
        <SectionBar title="Current" count={current.length} />
        {current.map((d) => (
          <ListField
            key={d.id}
            value={d.name}
            onChangeText={(name) => setCurrent((cur) => cur.map((x) => (x.id === d.id ? { ...x, name } : x)))}
            onDelete={() => {
              haptics.selection();
              setCurrent((cur) => cur.filter((x) => x.id !== d.id));
            }}
          />
        ))}
        <SectionBar title="New" count={added.length} />
        {added.map((d) => (
          <ListField
            key={d.id}
            value={d.name}
            onChangeText={(name) => setAdded((cur) => cur.map((x) => (x.id === d.id ? { ...x, name } : x)))}
            onDelete={() => {
              haptics.selection();
              setAdded((cur) => cur.filter((x) => x.id !== d.id));
            }}
          />
        ))}
      </ScrollView>

      <Fab
        icon={SAVE_ICON}
        accessibilityLabel="Save custom lists"
        bottom={INPUT_HEIGHT + pillBottom + 24}
        onPress={() => {
          if (!saving) void save();
        }}
        style={saving ? styles.saving : undefined}
      />

      <View style={[styles.inputWrap, { paddingBottom: pillBottom }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addList}
          submitBehavior="submit"
          placeholder="Add New Custom List!"
          placeholderTextColor={c.textTertiary}
          returnKeyType="done"
          autoCorrect={false}
          accessibilityLabel="Add New Custom List"
          style={[
            styles.input,
            {
              borderColor: c.chipBorder,
              backgroundColor: c.background,
              color: c.text,
              fontFamily: theme.fontFamily,
              fontSize: theme.typography.callout.fontSize,
            },
          ]}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 32, paddingRight: 28, paddingVertical: 14 },
  field: {
    flex: 1,
    height: INPUT_HEIGHT,
    paddingHorizontal: 20,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  delete: {
    width: INPUT_HEIGHT,
    height: INPUT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  saving: { opacity: 0.5 },
  inputWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 44 },
  input: { height: INPUT_HEIGHT, borderRadius: INPUT_HEIGHT / 2, borderWidth: 1, paddingHorizontal: 20 },
});
