// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { formatTimeAgo, listActivityPrefix } from '../activity-format';
import { applyFormat } from '../composer/format';
import { parseAniListHtml } from '../markdown/parse-blocks';

const NOW = 1_800_000_000_000;
const ago = (s: number) => NOW / 1000 - s;

describe('formatTimeAgo', () => {
  test('uses AniClient wording', () => {
    expect(formatTimeAgo(ago(5), NOW)).toBe('a few seconds ago');
    expect(formatTimeAgo(ago(60), NOW)).toBe('a minute ago');
    expect(formatTimeAgo(ago(60 * 10), NOW)).toBe('10 minutes ago');
    expect(formatTimeAgo(ago(3600), NOW)).toBe('an hour ago');
    expect(formatTimeAgo(ago(3600 * 2), NOW)).toBe('2 hours ago');
    expect(formatTimeAgo(ago(86400 * 30), NOW)).toBe('a month ago');
    expect(formatTimeAgo(ago(86400 * 65), NOW)).toBe('2 months ago');
    expect(formatTimeAgo(ago(86400 * 400), NOW)).toBe('a year ago');
  });
});

describe('listActivityPrefix', () => {
  test('builds the verb phrase', () => {
    expect(listActivityPrefix('read chapter', '1134 - 1187')).toBe('Read chapter 1134 - 1187 of');
    expect(listActivityPrefix('watched episode', '9')).toBe('Watched episode 9 of');
    expect(listActivityPrefix('completed', null)).toBe('Completed');
    expect(listActivityPrefix('plans to watch', '')).toBe('Plans to watch');
  });
});

describe('parseAniListHtml', () => {
  test('centred headings, links and text', () => {
    const blocks = parseAniListHtml(
      '<center><h2>2006 <a href="https://anilist.co/anime/918">Gintama</a></h2>Cheers for the nom <a href="https://anilist.co/user/Hudra">@Hudra</a></center>',
    );
    expect(blocks).toHaveLength(2);
    const [h, p] = blocks;
    expect(h.kind === 'text' && h.heading === 2 && h.align === 'center').toBe(true);
    if (h.kind === 'text') expect(h.inlines.map((i) => i.text).join('')).toBe('2006 Gintama');
    if (p.kind === 'text') expect(p.inlines[1].href).toBe('https://anilist.co/user/Hudra');
  });

  test('images group into a row, spoilers and rules become blocks', () => {
    const blocks = parseAniListHtml(
      "<p><img src='a.png' width='220'> <img src='b.png'></p><hr><span class='markdown_spoiler'><span>Secret &amp; more</span></span>",
    );
    expect(blocks.map((b) => b.kind)).toEqual(['images', 'rule', 'spoiler']);
    if (blocks[0].kind === 'images') expect(blocks[0].images.map((i) => i.width)).toEqual(['220', undefined]);
    const sp = blocks[2];
    if (sp.kind === 'spoiler' && sp.blocks[0].kind === 'text') expect(sp.blocks[0].inlines[0].text).toBe('Secret & more');
  });

  test('youtube, lists and line breaks', () => {
    const blocks = parseAniListHtml("line one<br>line two<ul><li>a</li><li>b</li></ul><span class='youtube' id='dQw4w9WgXcQ'></span>");
    expect(blocks.map((b) => b.kind)).toEqual(['text', 'list', 'youtube']);
    if (blocks[0].kind === 'text') expect(blocks[0].inlines.map((i) => i.text).join('')).toBe('line one\nline two');
    if (blocks[1].kind === 'list') expect(blocks[1].items).toHaveLength(2);
  });

  test("AniList's <div class='youtube'> with a URL id", () => {
    const blocks = parseAniListHtml(
      "<center><div class='youtube' id='https://youtu.be/hpuQbf1W_04'></div>\nhi</center><div class='youtube' id='https://www.youtube.com/watch?v=0DDA6mwEKw8'></div><div class='youtube' id='https://youtube.com/shorts/etSDQFao9nE'></div>",
    );
    expect(blocks.filter((b) => b.kind === 'youtube')).toEqual([
      { kind: 'youtube', id: 'hpuQbf1W_04', align: 'center' },
      { kind: 'youtube', id: '0DDA6mwEKw8', align: 'left' },
      { kind: 'youtube', id: 'etSDQFao9nE', align: 'left' },
    ]);
  });

  test('inline markdown inside <center> is rendered', () => {
    const [b] = parseAniListHtml('<center>__--- Spoilers a partir de aquí ---__ and *soft* snake_case</center>');
    expect(b.kind).toBe('text');
    if (b.kind !== 'text') return;
    expect(b.inlines.map((i) => i.text).join('')).toBe('--- Spoilers a partir de aquí --- and soft snake_case');
    expect(b.inlines[0]).toMatchObject({ text: '--- Spoilers a partir de aquí ---', bold: true });
    expect(b.inlines.find((i) => i.text === 'soft')?.italic).toBe(true);
    // Outside <center> underscores stay literal.
    const [p] = parseAniListHtml('<p>__raw__</p>');
    if (p.kind === 'text') expect(p.inlines[0].text).toBe('__raw__');
  });

  test('links with an empty target drop their brackets', () => {
    const blocks = parseAniListHtml(
      '<h1>[<center><strong>Spoilers ahead!</strong></center>]()</h1>\n<p>[<strong>STORY:</strong>]()<br />\nText</p>',
    );
    const text = blocks.map((b) => (b.kind === 'text' ? b.inlines.map((i) => i.text).join('') : b.kind));
    expect(text).toEqual(['Spoilers ahead!', 'STORY:\nText']);
  });

  test('plain text keeps newlines', () => {
    const blocks = parseAniListHtml('hi\nthere & <you>');
    if (blocks[0].kind === 'text') expect(blocks[0].inlines.map((i) => i.text).join('')).toBe('hi\nthere & <you>');
  });
});

describe('applyFormat', () => {
  test('wraps the selection', () => {
    expect(applyFormat('hello world', { start: 6, end: 11 }, 'bold')).toEqual({
      text: 'hello __world__',
      selection: { start: 8, end: 13 },
    });
    expect(applyFormat('x', { start: 1, end: 1 }, 'spoiler')).toEqual({ text: 'x~!!~', selection: { start: 3, end: 3 } });
  });

  test('toggles line prefixes', () => {
    const on = applyFormat('a\nbc', { start: 3, end: 3 }, 'heading');
    expect(on).toEqual({ text: 'a\n# bc', selection: { start: 5, end: 5 } });
    expect(applyFormat(on.text, on.selection, 'heading')).toEqual({ text: 'a\nbc', selection: { start: 3, end: 3 } });
  });
});
