/**
 * Minimal, forgiving HTML parser for the AniList markdown engine's output (`text(asHtml: true)`).
 *
 * AniList renders its markdown dialect server-side (`__bold__`, `~!spoiler!~`, `~~~center~~~`,
 * `img220(url)`, `youtube(id)`, `webm(url)`, headings, lists, links, @mentions) into a small,
 * sanitised HTML subset. Parsing that HTML is more faithful than re-implementing the dialect, so
 * this module turns it into a tree that `parse-blocks.ts` maps to React Native blocks.
 */

export type HtmlText = { type: 'text'; text: string };
export type HtmlElement = {
  type: 'element';
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
};
export type HtmlNode = HtmlText | HtmlElement;

const VOID_TAGS = new Set(['br', 'hr', 'img', 'source', 'input', 'meta', 'link', 'wbr', 'col', 'area', 'embed', 'track']);

/** Tags that implicitly close an open `<p>` (HTML auto-closing, simplified). */
const CLOSES_P = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'center', 'table']);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  times: '×',
  hearts: '♥',
  star: '☆',
};

/** Decodes named and numeric HTML entities. */
export function decodeEntities(input: string): string {
  if (!input.includes('&')) return input;
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(source))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

/** Parses an HTML fragment into a node tree. Never throws; malformed markup degrades to text. */
export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = { type: 'element', tag: '#root', attrs: {}, children: [] };
  const stack: HtmlElement[] = [root];
  const top = () => stack[stack.length - 1];
  const pushText = (text: string) => {
    if (!text) return;
    const parent = top();
    const last = parent.children[parent.children.length - 1];
    if (last?.type === 'text') last.text += text;
    else parent.children.push({ type: 'text', text });
  };
  const closeTag = (tag: string) => {
    for (let i = stack.length - 1; i > 0; i--) {
      if (stack[i].tag === tag) {
        stack.length = i;
        return;
      }
    }
  };

  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      pushText(decodeEntities(html.slice(i)));
      break;
    }
    if (lt > i) pushText(decodeEntities(html.slice(i, lt)));

    // Comment
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    const gt = html.indexOf('>', lt + 1);
    if (gt === -1) {
      pushText(decodeEntities(html.slice(lt)));
      break;
    }
    const inner = html.slice(lt + 1, gt);
    i = gt + 1;

    if (inner.startsWith('/')) {
      const tag = inner.slice(1).trim().toLowerCase();
      if (tag) closeTag(tag);
      continue;
    }
    if (inner.startsWith('!') || inner.startsWith('?')) continue;

    const nameMatch = /^([a-zA-Z][a-zA-Z0-9-]*)/.exec(inner);
    if (!nameMatch) {
      // Not a tag ("a < b"): keep it literally.
      pushText(decodeEntities(`<${inner}>`));
      continue;
    }
    const tag = nameMatch[1].toLowerCase();
    const selfClosing = inner.endsWith('/');
    const attrs = parseAttrs(inner.slice(nameMatch[1].length, selfClosing ? -1 : undefined));

    if (CLOSES_P.has(tag) && top().tag === 'p') stack.pop();
    if (tag === 'li') {
      // An open <li> closes when a sibling <li> starts.
      for (let s = stack.length - 1; s > 0; s--) {
        const t = stack[s].tag;
        if (t === 'li') {
          stack.length = s;
          break;
        }
        if (t === 'ul' || t === 'ol') break;
      }
    }

    const el: HtmlElement = { type: 'element', tag, attrs, children: [] };
    top().children.push(el);
    if (!selfClosing && !VOID_TAGS.has(tag)) stack.push(el);
  }
  return root.children;
}

/** Concatenated text content of a subtree. */
export function textContent(nodes: HtmlNode[]): string {
  return nodes.map((nd) => (nd.type === 'text' ? nd.text : textContent(nd.children))).join('');
}
