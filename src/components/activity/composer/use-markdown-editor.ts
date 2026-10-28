import { useState } from 'react';
import type { TextInputSelectionChangeEvent } from 'react-native';

import { applyFormat, insertAt, type FormatAction, type TextSelection } from './format';

export type MarkdownEditor = ReturnType<typeof useMarkdownEditor>;

/**
 * Controlled state for a markdown TextInput: text, the live selection, and a one-shot
 * `selection` prop that moves the cursor after a formatting action (cleared on the next
 * native selection change so typing isn't locked).
 */
export function useMarkdownEditor(initial = '') {
  const [text, setText] = useState(initial);
  const [current, setCurrent] = useState<TextSelection>({ start: initial.length, end: initial.length });
  const [forced, setForced] = useState<TextSelection | undefined>(undefined);

  const commit = (next: { text: string; selection: TextSelection }) => {
    setText(next.text);
    setCurrent(next.selection);
    setForced(next.selection);
  };

  return {
    text,
    /** Pass to `TextInput selection`. */
    selection: forced,
    onChangeText: (t: string) => setText(t),
    onSelectionChange: (e: TextInputSelectionChangeEvent) => {
      setCurrent(e.nativeEvent.selection);
      setForced(undefined);
    },
    apply: (action: FormatAction) => commit(applyFormat(text, current, action)),
    insert: (snippet: string) => commit(insertAt(text, current, snippet)),
    reset: (next = '') => {
      setText(next);
      setCurrent({ start: next.length, end: next.length });
      setForced(undefined);
    },
    isEmpty: text.trim().length === 0,
  };
}
