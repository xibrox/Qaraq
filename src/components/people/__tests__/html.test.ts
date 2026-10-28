// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { decodeEntities, htmlToPlainText, parseAniListLink, parseHtml } from '../html';

describe('people html', () => {
  test('parses bold labels, breaks and spoilers', () => {
    const runs = parseHtml(
      "<p><strong>Height:</strong> 155 cm<br>\n</p><p>Shy &amp; kind. <span class='markdown_spoiler'><span>She <b>dies</b>.</span></span></p>",
    );
    expect(runs[0]).toEqual({ text: 'Height:', bold: true });
    expect(htmlToPlainText("<p>a</p>\n\n<p>b</p>")).toBe('a\n\nb');
    const spoiler = runs.filter((r) => r.spoiler === 0).map((r) => r.text).join('');
    expect(spoiler).toBe('She dies.');
    expect(runs.find((r) => r.text === 'dies')?.bold).toBe(true);
  });

  test('decodes entities', () => {
    expect(decodeEntities('&quot;Hi&quot; &#39;x&#x27; &amp;')).toBe('"Hi" \'x\' &');
  });

  test('recognises AniList links', () => {
    expect(parseAniListLink('https://anilist.co/manga/30013/One-Piece')).toEqual({ kind: 'media', id: 30013 });
    expect(parseAniListLink('https://anilist.co/staff/95185')).toEqual({ kind: 'staff', id: 95185 });
    expect(parseAniListLink('https://example.com')).toBeNull();
  });
});
