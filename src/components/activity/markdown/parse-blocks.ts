import { parseHtml, textContent, type HtmlElement, type HtmlNode } from './html-parser';
import { expandCenteredMarkdown, mediaUrlTitle, renderRawMediaAndLinks } from './raw-markdown';

export type TextAlign = 'left' | 'center' | 'right';

export type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  underline?: boolean;
  code?: boolean;
  small?: boolean;
  href?: string;
};

export type Inline = InlineStyle & { text: string };

export type MarkdownImage = { src: string; width?: string; href?: string };

export type Block =
  | { kind: 'text'; inlines: Inline[]; align: TextAlign; heading?: number }
  | { kind: 'images'; images: MarkdownImage[]; align: TextAlign }
  | { kind: 'rule' }
  | { kind: 'spoiler'; blocks: Block[] }
  | { kind: 'list'; ordered: boolean; items: Block[][] }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'code'; text: string }
  | { kind: 'youtube'; id: string; align: TextAlign }
  | { kind: 'video'; src: string; align: TextAlign };

/** `md`: inside `<center>`, where AniList leaves inline markdown (`__bold__`) unrendered. */
type Ctx = { style: InlineStyle; align: TextAlign; heading?: number; md?: boolean };

const HEADINGS: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
const BLOCK_CONTAINERS = new Set(['p', 'div', 'center', 'section', 'article', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'figure', 'details', 'summary']);
const WS = /[ \t\n\r\f]+/g;
const HTML_TAG = /<\/?(?:p|br|a|img|div|center|span|h[1-6]|hr|ul|ol|li|b|i|em|strong|blockquote|pre|code|del|s|strike|u|small|sub|sup|video|source|iframe)\b[^>]*>/i;

function alignOf(el: HtmlElement, fallback: TextAlign): TextAlign {
  if (el.tag === 'center') return 'center';
  const raw = (el.attrs.align ?? /text-align\s*:\s*(\w+)/i.exec(el.attrs.style ?? '')?.[1] ?? '').toLowerCase();
  return raw === 'center' || raw === 'right' || raw === 'left' ? raw : fallback;
}

/** Video id from a bare id or a youtu.be / youtube.com (watch?v=, embed/, shorts/) URL. */
function youTubeId(raw: string): string | null {
  const v = raw.trim();
  if (/^[\w-]{6,}$/.test(v)) return v;
  return /(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{6,})/.exec(v)?.[1] ?? null;
}

function hasClass(el: HtmlElement, name: string): boolean {
  return (el.attrs.class ?? '').split(/\s+/).includes(name);
}

/** Trims whitespace at the edges of a paragraph and around explicit line breaks. */
function tidy(inlines: Inline[]): Inline[] {
  const out: Inline[] = [];
  let atLineStart = true;
  for (const seg of inlines) {
    let text = seg.text;
    // No leading blank lines in a paragraph (a <br> right after a heading or block).
    if (!out.length) text = text.replace(/^[ \n]+/, '');
    else if (atLineStart) text = text.replace(/^ +/, '');
    if (!text) continue;
    if (text === '\n' && out.length) {
      const prev = out[out.length - 1];
      prev.text = prev.text.replace(/ +$/, '');
    }
    out.push({ ...seg, text });
    atLineStart = text.endsWith('\n');
  }
  // Drop trailing spaces / line breaks.
  while (out.length) {
    const last = out[out.length - 1];
    last.text = last.text.replace(/[ \n]+$/, '');
    if (last.text) break;
    out.pop();
  }
  return out;
}

const INLINE_MD = /(\*\*|__)(?=\S)([\s\S]+?\S)\1|(\*|_)(?=[^\s*_])([^*_]*?[^\s*_])\3|~~(?=\S)([\s\S]+?\S)~~/g;

/**
 * Applies the inline markdown AniList leaves raw inside centred blocks (`~~~__bold__~~~` comes back
 * as `<center>__bold__</center>`): `__bold__` / `**bold**`, `_italic_` / `*italic*`, `~~strike~~`.
 */
export function inlineMarkdown(text: string, style: InlineStyle): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  // A fresh regex per call: the recursion below would otherwise reset a shared `lastIndex` and
  // make the outer loop re-match the same span forever.
  const re = new RegExp(INLINE_MD);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // `_` only counts at word boundaries (snake_case stays as is).
    if (m[3] === '_' && (/\w/.test(text[m.index - 1] ?? '') || /\w/.test(text[m.index + m[0].length] ?? ''))) continue;
    if (m.index > last) out.push({ ...style, text: text.slice(last, m.index) });
    if (m[1]) out.push(...inlineMarkdown(m[2], { ...style, bold: true }));
    else if (m[3]) out.push(...inlineMarkdown(m[4], { ...style, italic: true }));
    else out.push(...inlineMarkdown(m[5], { ...style, strike: true }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ ...style, text: text.slice(last) });
  return out;
}

/** `[text]()`: AniList keeps links with an empty target as literal brackets around rendered HTML. */
const EMPTY_LINK = /\[([^[\]\n]*?)\]\(\s*\)/g;

function build(nodes: HtmlNode[], ctx: Ctx): Block[] {
  const blocks: Block[] = [];
  let inlines: Inline[] = [];

  const flush = () => {
    const tidied = tidy(inlines);
    inlines = [];
    if (!tidied.some((s) => s.text.trim())) return;
    blocks.push({ kind: 'text', inlines: tidied, align: ctx.align, heading: ctx.heading });
  };

  const push = (...next: Block[]) => {
    flush();
    for (const b of next) {
      const last = blocks[blocks.length - 1];
      if (b.kind === 'images' && last?.kind === 'images' && last.align === b.align) {
        last.images.push(...b.images);
      } else {
        blocks.push(b);
      }
    }
  };

  const visit = (node: HtmlNode, c: Ctx) => {
    if (node.type === 'text') {
      const text = node.text.replace(WS, ' ');
      if (text) inlines.push(...(c.md ? inlineMarkdown(text, c.style) : [{ ...c.style, text }]));
      return;
    }
    const el = node;
    const tag = el.tag;

    if (tag === 'br') {
      inlines.push({ ...c.style, text: '\n' });
      return;
    }
    if (tag === 'hr') return push({ kind: 'rule' });
    if (tag === 'img') {
      const src = el.attrs.src;
      if (src) push({ kind: 'images', align: c.align, images: [{ src, width: el.attrs.width, href: c.style.href }] });
      return;
    }
    if (tag === 'video' || tag === 'iframe') {
      const source = el.children.find((ch): ch is HtmlElement => ch.type === 'element' && ch.tag === 'source');
      const src = el.attrs.src ?? source?.attrs.src;
      const yt = src ? /(?:youtube\.com\/embed\/|youtu\.be\/)([\w-]{6,})/.exec(src) : null;
      if (yt) push({ kind: 'youtube', id: yt[1], align: c.align });
      else if (src) push({ kind: 'video', src, align: c.align });
      return;
    }
    // AniList's HTML renders `youtube(...)` as `<div class='youtube' id='https://youtu.be/ID'>`;
    // the id can be a bare video id or a full YouTube URL.
    if ((tag === 'span' || tag === 'div') && hasClass(el, 'youtube') && el.attrs.id) {
      const id = youTubeId(el.attrs.id);
      return id ? push({ kind: 'youtube', id, align: c.align }) : undefined;
    }
    if (tag === 'span' && hasClass(el, 'markdown_spoiler')) {
      return push({ kind: 'spoiler', blocks: build(el.children, { ...c, style: {} }) });
    }
    if (tag in HEADINGS) {
      return push(...build(el.children, { style: { ...c.style, bold: true }, align: alignOf(el, c.align), heading: HEADINGS[tag], md: c.md }));
    }
    if (BLOCK_CONTAINERS.has(tag)) {
      return push(...build(el.children, { ...c, align: alignOf(el, c.align), md: c.md || tag === 'center' }));
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = el.children
        .filter((ch): ch is HtmlElement => ch.type === 'element' && ch.tag === 'li')
        .map((li) => build(li.children, { ...c, align: 'left', heading: undefined }));
      return push({ kind: 'list', ordered: tag === 'ol', items });
    }
    if (tag === 'li') return push(...build(el.children, c));
    if (tag === 'blockquote') {
      return push({ kind: 'quote', blocks: build(el.children, { ...c, align: 'left' }) });
    }
    if (tag === 'pre') {
      const code = el.children.find((ch): ch is HtmlElement => ch.type === 'element' && ch.tag === 'code');
      const lang = /(?:^|\s)language-(\S+)/.exec(code?.attrs.class ?? '')?.[1] ?? '';
      const text = textContent(el.children);
      // Centre fences doubled up (`~~~~~~`) come back as a code block holding escaped
      // `<center>` markup; render that as the centred text it was meant to be.
      if (/<\/?center\b/i.test(lang + text)) {
        const html = `${lang.includes('<') ? lang : ''}${text}`;
        return push(...build(parseHtml(expandCenteredMarkdown(html)), c));
      }
      return push({ kind: 'code', text: text.replace(/\n+$/, '') });
    }

    // Inline elements.
    const style: InlineStyle = { ...c.style };
    switch (tag) {
      case 'b':
      case 'strong':
        style.bold = true;
        break;
      case 'i':
      case 'em':
        style.italic = true;
        break;
      case 'del':
      case 's':
      case 'strike':
        style.strike = true;
        break;
      case 'u':
      case 'ins':
        style.underline = true;
        break;
      case 'code':
        style.code = true;
        break;
      case 'small':
      case 'sub':
      case 'sup':
        style.small = true;
        break;
      case 'a':
        if (el.attrs.href) {
          style.href = el.attrs.href;
          // Auto-linked AniList media URL: show its title, not the raw URL.
          const label = textContent(el.children).trim();
          const title = label === el.attrs.href.trim() ? mediaUrlTitle(label) : null;
          if (title) {
            inlines.push({ ...c.style, ...style, text: title });
            return;
          }
        }
        break;
      default:
        break;
    }
    const next: Ctx = { ...c, style };
    for (const child of el.children) visit(child, next);
  };

  for (const node of nodes) visit(node, ctx);
  flush();
  return blocks;
}

/**
 * Converts AniList HTML (or plain text) into render blocks. Plain text without tags keeps its
 * line breaks.
 */
export function parseAniListHtml(input: string | null | undefined): Block[] {
  if (!input) return [];
  const html = HTML_TAG.test(input)
    ? renderRawMediaAndLinks(expandCenteredMarkdown(input.replace(EMPTY_LINK, '$1')))
    : input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\r?\n/g, '<br>');
  return build(parseHtml(html), { style: {}, align: 'left' });
}
