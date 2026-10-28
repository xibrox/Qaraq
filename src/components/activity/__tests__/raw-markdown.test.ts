// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { parseAniListHtml, type Block, type Inline } from '../markdown/parse-blocks';
import { mediaUrlTitle } from '../markdown/raw-markdown';

const texts = (blocks: Block[]) =>
  blocks.flatMap((b) => (b.kind === 'text' ? [b.inlines.map((i) => i.text).join('')] : []));
const inlines = (blocks: Block[]): Inline[] => blocks.flatMap((b) => (b.kind === 'text' ? b.inlines : []));

describe('markdown inside centred blocks', () => {
  test('links, bare media URLs and line breaks (activity 1186918566)', () => {
    const html =
      "<center>thanks <a target='_blank' href='https://anilist.co/user/x'>@x</a> ; [POST](https://anilist.co/activity/1186907801)\nhere are mine\n2006\nhttps://anilist.co/anime/1535/Death-Note/\n2007</center>";
    const blocks = parseAniListHtml(html);
    expect(texts(blocks)).toEqual(['thanks @x ; POST\nhere are mine\n2006\nDeath Note\n2007']);
    const segs = inlines(blocks);
    expect(segs.find((s) => s.text === 'POST')?.href).toBe('https://anilist.co/activity/1186907801');
    expect(segs.find((s) => s.text === 'Death Note')?.href).toBe('https://anilist.co/anime/1535/Death-Note/');
    expect(blocks.every((b) => b.kind !== 'text' || b.align === 'center')).toBe(true);
  });

  test('bold, italic and headings', () => {
    const blocks = parseAniListHtml('<center>__2006__\n**One important note:** it was *noticed*\n# 2007\n##</center>');
    const segs = inlines(blocks);
    expect(segs.find((s) => s.text === '2006')?.bold).toBe(true);
    expect(segs.find((s) => s.text === 'One important note:')?.bold).toBe(true);
    expect(segs.find((s) => s.text === 'noticed')?.italic).toBe(true);
    expect(blocks.some((b) => b.kind === 'text' && b.heading === 1 && b.inlines.map((i) => i.text).join('') === '2007')).toBe(true);
    expect(texts(blocks).join('|')).not.toContain('#');
  });

  test('links in HTML headings and image links (Kusogaki wrap)', () => {
    const html =
      "<center><h5>Hosted by [Kusogaki](https://anilist.co/user/Kusogaki/)</h5>\n[ <img width='80%' src='https://kusogaki.co/images/wraps/29938.png'> ](https://kusogaki.co/alwrap?targetUserId=29938)\n\n[Get Your Wrap](https://kusogaki.co/alwrap)</center>";
    const blocks = parseAniListHtml(html);
    const all = texts(blocks).join('|');
    expect(all).not.toContain('](');
    expect(all).not.toContain('[');
    expect(inlines(blocks).find((s) => s.text === 'Kusogaki')?.href).toBe('https://anilist.co/user/Kusogaki/');
    expect(inlines(blocks).find((s) => s.text === 'Get Your Wrap')?.href).toBe('https://kusogaki.co/alwrap');
    const images = blocks.find((b) => b.kind === 'images');
    expect(images?.kind === 'images' && images.images[0]).toEqual({
      src: 'https://kusogaki.co/images/wraps/29938.png',
      width: '80%',
      href: 'https://kusogaki.co/alwrap?targetUserId=29938',
    });
  });

  test('doubled centre fences rendered as a code block become centred text', () => {
    const html =
      '<pre><code class="language-&lt;center&gt;__2007__">\n\nhttps://anilist.co/anime/1689/5-Centimeters-per-Second/&lt;/center&gt;&lt;center&gt;\n\n&lt;/center&gt;&lt;center&gt;__2011__</code></pre>';
    const blocks = parseAniListHtml(html);
    expect(blocks.some((b) => b.kind === 'code')).toBe(false);
    const all = texts(blocks).join('|');
    expect(all).not.toContain('center>');
    expect(all).toContain('5 Centimeters per Second');
    expect(inlines(blocks).find((s) => s.text === '2011')?.bold).toBe(true);
  });

  test('leaves markdown-looking text outside centred blocks alone', () => {
    expect(texts(parseAniListHtml('<p>5 * 3 * 2 and snake_case_word</p>'))).toEqual(['5 * 3 * 2 and snake_case_word']);
  });

  test('auto-linked media URLs show the title', () => {
    const blocks = parseAniListHtml('<p><a href="https://anilist.co/manga/30013/One-Piece">https://anilist.co/manga/30013/One-Piece</a></p>');
    expect(texts(blocks)).toEqual(['One Piece']);
  });
});

describe('mediaUrlTitle', () => {
  test('derives a title from the slug', () => {
    expect(mediaUrlTitle('https://anilist.co/anime/1535/Death-Note/')).toBe('Death Note');
    expect(mediaUrlTitle('https://anilist.co/anime/1535')).toBe('Anime 1535');
    expect(mediaUrlTitle('https://anilist.co/user/x')).toBeNull();
  });
});

describe('raw AniList media and links inside HTML', () => {
  const images = (blocks: Block[]) => blocks.flatMap((b) => (b.kind === 'images' ? b.images : []));

  test('img120(url) inside a centred block (activity 1186510230)', () => {
    const blocks = parseAniListHtml('<center>beep or boop\n\nimg120(https://i.ibb.co/4wtx94nP/pumkinhomu.png)</center>');
    expect(texts(blocks)).toEqual(['beep or boop']);
    expect(images(blocks)).toEqual([{ src: 'https://i.ibb.co/4wtx94nP/pumkinhomu.png', width: '120', href: undefined }]);
    const row = blocks.find((b) => b.kind === 'images');
    expect(row?.kind === 'images' ? row.align : null).toBe('center');
  });

  test('Kusogaki wrap with raw img80% inside a link', () => {
    const html =
      "<center><h5>Hosted by [Kusogaki](https://anilist.co/user/Kusogaki/)</h5>\n[ img80%(https://kusogaki.co/images/wraps/29938.png) ](https://kusogaki.co/alwrap?targetUserId=29938)\n\n[Get Your Wrap](https://kusogaki.co/alwrap)</center>";
    const blocks = parseAniListHtml(html);
    const all = texts(blocks).join('|');
    expect(all).not.toContain('](');
    expect(all).not.toContain('[');
    expect(all).not.toContain('img80');
    expect(inlines(blocks).find((s) => s.text === 'Kusogaki')?.href).toBe('https://anilist.co/user/Kusogaki/');
    expect(inlines(blocks).find((s) => s.text === 'Get Your Wrap')?.href).toBe('https://kusogaki.co/alwrap');
    expect(images(blocks)).toEqual([
      { src: 'https://kusogaki.co/images/wraps/29938.png', width: '80%', href: 'https://kusogaki.co/alwrap?targetUserId=29938' },
    ]);
  });

  test('markdown links in HTML headings outside <center>', () => {
    const blocks = parseAniListHtml('<h5>Hosted by [Kusogaki](https://anilist.co/user/Kusogaki/)</h5><p>plain</p>');
    expect(texts(blocks)).toEqual(['Hosted by Kusogaki', 'plain']);
    expect(inlines(blocks).find((s) => s.text === 'Kusogaki')?.href).toBe('https://anilist.co/user/Kusogaki/');
  });

  test('youtube(id) and webm(url) become media', () => {
    const blocks = parseAniListHtml('<center>youtube(dQw4w9WgXcQ)\nwebm(https://files.catbox.moe/abc.webm)</center>');
    expect(blocks.map((b) => b.kind)).toEqual(['youtube', 'video']);
    expect(blocks[0]).toEqual({ kind: 'youtube', id: 'dQw4w9WgXcQ', align: 'center' });
    expect(blocks[1]).toEqual({ kind: 'video', src: 'https://files.catbox.moe/abc.webm', align: 'center' });
  });

  test('code stays verbatim', () => {
    const blocks = parseAniListHtml('<pre><code>img220(https://x.co/a.png) [a](https://b.co)</code></pre>');
    expect(blocks).toEqual([{ kind: 'code', text: 'img220(https://x.co/a.png) [a](https://b.co)' }]);
  });
});

describe('inline markdown recursion', () => {
  test('nested emphasis terminates', () => {
    const text = (blocks: Block[]) =>
      blocks.flatMap((b) => (b.kind === 'text' ? b.inlines.map((i: Inline) => i.text) : [])).join('');
    expect(text(parseAniListHtml('<center>*>*</center>'))).toBe('>');
    expect(text(parseAniListHtml('<center>*a >* and **b**</center>'))).toBe('a > and b');
  });
});
