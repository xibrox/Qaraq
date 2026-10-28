/**
 * Minimal parser for AniList `description(asHtml: true)` on characters and staff.
 *
 * AniList emits a small, regular subset: <p>, <br>, <b>/<strong>, <i>/<em>, <a href>,
 * <h1-5>, <hr>, <blockquote>, lists, and spoilers as
 * `<span class='markdown_spoiler'><span>text</span></span>`. The parser flattens that into
 * styled text runs that a single nested <Text> can render.
 */

export type HtmlRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  heading?: boolean;
  href?: string;
  /** Index of the spoiler this run belongs to (runs of one spoiler share the index). */
  spoiler?: number;
};

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[body.toLowerCase()] ?? m;
  });
}

const BLOCK = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li', 'ul', 'ol', 'center', 'pre']);
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

type Frame = { tag: string; bold: boolean; italic: boolean; heading: boolean; href?: string; spoiler?: number };

/** Parse AniList HTML into text runs. Newlines separate blocks (at most one blank line). */
export function parseHtml(html: string | null | undefined): HtmlRun[] {
  if (!html) return [];
  const runs: HtmlRun[] = [];
  const stack: Frame[] = [{ tag: '#root', bold: false, italic: false, heading: false }];
  let spoilerCount = 0;
  const top = () => stack[stack.length - 1];
  const push = (text: string) => {
    if (!text) return;
    const f = top();
    runs.push({
      text,
      ...(f.bold ? { bold: true } : null),
      ...(f.italic ? { italic: true } : null),
      ...(f.heading ? { heading: true } : null),
      ...(f.href ? { href: f.href } : null),
      ...(f.spoiler != null ? { spoiler: f.spoiler } : null),
    });
  };

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)|(<)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[4] != null || m[5] != null) {
      // Collapse source whitespace like a browser does (AniList puts real breaks in <br>).
      push(decodeEntities((m[4] ?? m[5]).replace(/\s+/g, ' ')));
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] ?? '';
    if (tag === 'br') {
      push('\n');
      continue;
    }
    if (tag === 'hr') {
      push('\n\n');
      continue;
    }
    if (tag === 'img' || tag === 'source' || tag === 'iframe') continue;

    if (closing) {
      const idx = stack.map((f) => f.tag).lastIndexOf(tag);
      if (idx > 0) stack.length = idx;
      if (BLOCK.has(tag)) push('\n\n');
      continue;
    }

    if (BLOCK.has(tag)) push(tag === 'li' ? '\n• ' : '\n\n');
    const parent = top();
    const frame: Frame = { ...parent, tag };
    if (tag === 'b' || tag === 'strong') frame.bold = true;
    if (tag === 'i' || tag === 'em') frame.italic = true;
    if (HEADINGS.has(tag)) {
      frame.heading = true;
      frame.bold = true;
    }
    if (tag === 'a') {
      const href = /href\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
      if (href) frame.href = decodeEntities(href);
    }
    if (tag === 'span' && /markdown_spoiler/.test(attrs) && parent.spoiler == null) {
      frame.spoiler = spoilerCount++;
    }
    stack.push(frame);
  }
  return normalizeRuns(runs);
}

/** Merge whitespace around block breaks: no leading/trailing breaks, at most one blank line. */
function normalizeRuns(runs: HtmlRun[]): HtmlRun[] {
  const out: HtmlRun[] = [];
  // -1 = nothing emitted yet; otherwise the number of newlines at the end of the output.
  let newlines = -1;
  let lastSpace = false;
  for (const run of runs) {
    let text = '';
    for (const ch of run.text) {
      if (ch === '\n') {
        if (newlines === -1 || newlines >= 2) continue;
        if (lastSpace) text = text.replace(/ $/, '');
        text += ch;
        newlines += 1;
        lastSpace = false;
      } else if (ch === ' ') {
        if (newlines !== 0 || lastSpace) continue;
        text += ch;
        lastSpace = true;
      } else {
        text += ch;
        newlines = 0;
        lastSpace = false;
      }
    }
    if (text) out.push({ ...run, text });
  }
  while (out.length) {
    const last = out[out.length - 1];
    const trimmed = last.text.replace(/\s+$/, '');
    if (trimmed) {
      out[out.length - 1] = { ...last, text: trimmed };
      break;
    }
    out.pop();
  }
  return out;
}

/** Plain text (spoilers included) for accessibility / sharing. */
export function htmlToPlainText(html: string | null | undefined): string {
  return parseHtml(html)
    .map((r) => r.text)
    .join('');
}

export type AniListLink =
  | { kind: 'media'; id: number }
  | { kind: 'character'; id: number }
  | { kind: 'staff'; id: number }
  | { kind: 'studio'; id: number };

/** Recognise anilist.co links that have an in-app screen. */
export function parseAniListLink(href: string): AniListLink | null {
  const m = /^(?:https?:\/\/)?(?:www\.)?anilist\.co\/(anime|manga|character|staff|studio)\/(\d+)/i.exec(href.trim());
  if (!m) return null;
  const id = Number(m[2]);
  const kind = m[1].toLowerCase();
  if (kind === 'anime' || kind === 'manga') return { kind: 'media', id };
  return { kind: kind as 'character' | 'staff' | 'studio', id };
}
