/**
 * AniList's `text(asHtml: true)` renders markdown everywhere except inside centred blocks
 * (`~~~ … ~~~` / `<center>`): their content comes back as HTML-escaped *markdown*, with literal
 * `[links](url)`, `**bold**`, `__bold__`, `*italic*`, `# headings`, bare URLs and raw line breaks
 * (and sometimes stray `~~~`). This module finishes that job on the HTML string, before it is
 * parsed, so centred blocks render like the rest of the post.
 */

const BLOCK_TAGS = new Set(['p', 'div', 'center', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr', 'br', 'table', 'tr', 'td']);

const MEDIA_URL = /^(?:https?:)?\/\/(?:www\.)?anilist\.co\/(anime|manga)\/(\d+)(?:\/([^/?#\s<]*))?\/?$/i;

function escapeAttr(value: string): string {
  return value.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Display text for a bare AniList media URL: the slug as a title ("Death-Note" → "Death Note"),
 * as AniClient shows linked titles instead of raw URLs. Null for any other URL.
 */
export function mediaUrlTitle(url: string): string | null {
  const m = MEDIA_URL.exec(url.trim());
  if (!m) return null;
  const slug = m[3] ? safeDecode(m[3]).replace(/[-_]+/g, ' ').trim() : '';
  return slug || `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}`;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const BARE_URL = /(^|[\s(>])((?:https?:\/\/)[^\s<>"')]+[^\s<>"').,!?:;])/g;

function linkBareUrls(text: string): string {
  return text.replace(BARE_URL, (_m, lead: string, url: string) => {
    const label = mediaUrlTitle(url) ?? url;
    return `${lead}<a href="${escapeAttr(url)}">${label}</a>`;
  });
}

/** Inline emphasis inside one text run (no tags in `text`). */
function emphasis(text: string): string {
  return text
    .replace(/__(?=\S)([^_\n]*?\S)__/g, '<strong>$1</strong>')
    .replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(?=\S)([^~\n]*?\S)~~/g, '<del>$1</del>')
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<em>$2</em>');
}

/** Converts `# heading` lines and drops lines that are only `#`s, in one text run. */
function headings(text: string, atLineStart: boolean): string {
  const lines = text.split('\n');
  return lines
    .map((line, i) => {
      if (i === 0 && !atLineStart) return line;
      const m = /^[ \t]*(#{1,6})[ \t]*(.*)$/.exec(line);
      if (!m) return line;
      const body = m[2].trim();
      if (!body) return '';
      const level = m[1].length;
      return `<h${level}>${body}</h${level}>`;
    })
    .join('\n');
}

const URL_ARG = String.raw`((?:https?:)?\/\/[^\s()<>"']+(?:\([^\s()<>"']*\)[^\s()<>"']*)*)`;
/** `img(url)`, `img220(url)`, `img80%(url)`. */
const RAW_IMG = new RegExp(String.raw`(^|[^\w])img(\d+%?)?\(\s*` + URL_ARG + String.raw`\s*\)`, 'gi');
/** `youtube(id)` or `youtube(https://youtu.be/id)` / `youtube(https://www.youtube.com/watch?v=id)`. */
const RAW_YOUTUBE = /(^|[^\w])youtube\(\s*(?:(?:https?:)?\/\/[^\s()<>]*?(?:v=|youtu\.be\/|embed\/))?([\w-]{6,})[^\s()<>]*\s*\)/gi;
/** `webm(url)`. */
const RAW_WEBM = new RegExp(String.raw`(^|[^\w])webm\(\s*` + URL_ARG + String.raw`\s*\)`, 'gi');
/** `[label](url)`; the label may contain tags (`[ <img …> ](href)`). */
const MD_LINK = /\[((?:[^[\]<]|<[^>]*>)*?)\]\(\s*((?:https?:)?\/\/[^)\s]+|\/[^)\s]*)\s*\)/g;

/**
 * Converts the unambiguous AniList markdown that can be left raw anywhere inside HTML (`<center>`,
 * `<h5>`, `<div>` …): `img120(url)` images, `youtube(id)`, `webm(url)` and `[label](url)` links.
 * Text inside `<code>` / `<pre>` and inside existing links is left alone.
 */
export function renderRawMediaAndLinks(html: string): string {
  if (!/img\d*%?\(|youtube\(|webm\(|\]\(/i.test(html)) return html;
  // Keep code verbatim: split it out, convert the rest, put it back.
  const parts = html.split(/(<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<a\b[\s\S]*?<\/a>)/i);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = convertRawMedia(parts[i]);
  }
  // Links last, over the whole string: a link label may hold an image converted above.
  return parts
    .map((part, i) => (i % 2 === 0 ? part : `\u0000${i}\u0000`))
    .join('')
    .replace(MD_LINK, (_m, label: string, url: string) => `<a href="${escapeAttr(url)}">${label}</a>`)
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => parts[Number(i)]);
}

function convertRawMedia(text: string): string {
  return text
    .replace(RAW_IMG, (_m, lead: string, width: string | undefined, url: string) => {
      const w = width ? ` width="${escapeAttr(width)}"` : '';
      return `${lead}<img${w} src="${escapeAttr(url)}">`;
    })
    .replace(RAW_YOUTUBE, (_m, lead: string, id: string) => `${lead}<span class="youtube" id="${escapeAttr(id)}"></span>`)
    .replace(RAW_WEBM, (_m, lead: string, url: string) => `${lead}<video src="${escapeAttr(url)}"></video>`);
}

/** Finishes the markdown left in the inner HTML of one centred block. */
export function renderRawMarkdown(inner: string): string {
  let html = renderRawMediaAndLinks(inner);
  // Stray centre fences that AniList left behind.
  html = html.replace(/~{3,}/g, '');

  const parts = html.split(/(<[^>]+>)/);
  let linkDepth = 0;
  let codeDepth = 0;
  let atLineStart = true;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    if (part.startsWith('<')) {
      const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(part);
      if (m) {
        const closing = m[1] === '/';
        const tag = m[2].toLowerCase();
        if (tag === 'a') linkDepth = Math.max(0, linkDepth + (closing ? -1 : 1));
        if (tag === 'code' || tag === 'pre') codeDepth = Math.max(0, codeDepth + (closing ? -1 : 1));
        if (BLOCK_TAGS.has(tag)) atLineStart = true;
      }
      continue;
    }
    if (codeDepth > 0) {
      atLineStart = part.endsWith('\n');
      continue;
    }
    let text = headings(part, atLineStart);
    text = emphasis(text);
    if (linkDepth === 0) text = linkBareUrls(text);
    atLineStart = part.endsWith('\n');
    parts[i] = text.replace(/\r?\n/g, '<br>');
  }
  return parts.join('');
}

/**
 * Applies `renderRawMarkdown` to the content of every `<center>` block. Blocks are matched
 * innermost-first, so nested or unbalanced `<center>` tags degrade gracefully.
 */
export function expandCenteredMarkdown(html: string): string {
  if (!/<center\b/i.test(html)) return html;
  return html.replace(/(<center\b[^>]*>)([\s\S]*?)(<\/center>|$)/gi, (_m, open: string, inner: string, close: string) => {
    return `${open}${renderRawMarkdown(inner)}${close}`;
  });
}
