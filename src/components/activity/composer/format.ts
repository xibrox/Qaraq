/** AniList markdown formatting for the composer's keyboard bar. */
export type FormatAction = 'spoiler' | 'heading' | 'bold' | 'italic' | 'center' | 'list' | 'image';

export type TextSelection = { start: number; end: number };

const WRAPS: Partial<Record<FormatAction, [string, string]>> = {
  spoiler: ['~!', '!~'],
  bold: ['__', '__'],
  italic: ['_', '_'],
  center: ['~~~', '~~~'],
  image: ['img(', ')'],
};

const LINE_PREFIX: Partial<Record<FormatAction, string>> = {
  heading: '# ',
  list: '- ',
};

/**
 * Applies a formatting action to `text` at `selection` and returns the new text and cursor.
 * Wrapping actions surround the selection (or insert an empty pair with the cursor inside);
 * line actions toggle a prefix at the start of the current line.
 */
export function applyFormat(text: string, selection: TextSelection, action: FormatAction): { text: string; selection: TextSelection } {
  const start = Math.max(0, Math.min(selection.start, selection.end, text.length));
  const end = Math.min(text.length, Math.max(selection.start, selection.end));

  const wrap = WRAPS[action];
  if (wrap) {
    const [open, close] = wrap;
    const inner = text.slice(start, end);
    const next = text.slice(0, start) + open + inner + close + text.slice(end);
    const cursor = start + open.length;
    return { text: next, selection: inner ? { start: cursor, end: cursor + inner.length } : { start: cursor, end: cursor } };
  }

  const prefix = LINE_PREFIX[action] ?? '';
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  if (text.startsWith(prefix, lineStart)) {
    const next = text.slice(0, lineStart) + text.slice(lineStart + prefix.length);
    const shift = (n: number) => Math.max(lineStart, n - prefix.length);
    return { text: next, selection: { start: shift(start), end: shift(end) } };
  }
  const next = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { text: next, selection: { start: start + prefix.length, end: end + prefix.length } };
}

/** Inserts `snippet` at the selection, replacing any selected text. */
export function insertAt(text: string, selection: TextSelection, snippet: string): { text: string; selection: TextSelection } {
  const start = Math.min(selection.start, selection.end, text.length);
  const end = Math.min(text.length, Math.max(selection.start, selection.end));
  const cursor = start + snippet.length;
  return { text: text.slice(0, start) + snippet + text.slice(end), selection: { start: cursor, end: cursor } };
}
