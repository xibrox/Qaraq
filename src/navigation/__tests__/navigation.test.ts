// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { appUrlToPath, customListSlug, hrefs, mediaTypeFromSlug } from '../hrefs';
import { resolveToolbarAppearance } from '../resolve-toolbar-appearance';

describe('appUrlToPath', () => {
  test('routes notification deep links', () => {
    expect(appUrlToPath('qaraq://media/5')).toBe('/media/5');
    expect(appUrlToPath('qaraq://user/42/')).toBe('/user/42');
    expect(appUrlToPath('qaraq://activity/7?from=push')).toBe('/activity/7');
    expect(appUrlToPath('/character/9')).toBe('/character/9');
    expect(appUrlToPath('qaraq://notifications')).toBe('/(tabs)/(profile)/notifications');
    expect(appUrlToPath('qaraq:///notifications/')).toBe('/(tabs)/(profile)/notifications');
  });
  test('ignores the OAuth callback, other schemes and unknown paths', () => {
    expect(appUrlToPath('qaraq://auth#access_token=x')).toBeNull();
    expect(appUrlToPath('https://anilist.co/anime/5')).toBeNull();
    expect(appUrlToPath('qaraq://media/abc')).toBeNull();
    expect(appUrlToPath('')).toBeNull();
    expect(appUrlToPath(null)).toBeNull();
  });
});

describe('hrefs', () => {
  test('builds shared and grouped routes', () => {
    expect(hrefs.media(1)).toBe('/media/1');
    expect(hrefs.favourites(3, 'characters')).toBe('/favourites/3/characters');
    expect(hrefs.notifications()).toBe('/(tabs)/(profile)/notifications');
    expect(hrefs.settings.notifications()).toBe('/(tabs)/(settings)/notifications');
    expect(hrefs.settings.customLists('MANGA')).toBe('/(tabs)/(settings)/custom-lists/manga');
    expect(hrefs.tab('explore')).toBe('/(tabs)/(explore)');
    expect(hrefs.search({ type: 'MANGA', sort: 'SCORE_DESC', q: '' })).toBe('/search?type=MANGA&sort=SCORE_DESC');
  });
  test('custom list slugs round-trip', () => {
    expect(mediaTypeFromSlug(customListSlug('ANIME'))).toBe('ANIME');
    expect(mediaTypeFromSlug(customListSlug('MANGA'))).toBe('MANGA');
    expect(mediaTypeFromSlug(undefined)).toBe('ANIME');
  });
});

describe('resolveToolbarAppearance', () => {
  const ios26 = { canLiquidGlass: true, reduceTransparency: false, platform: 'ios' };
  const ios18 = { canLiquidGlass: false, reduceTransparency: false, platform: 'ios' };
  const android = { canLiquidGlass: false, reduceTransparency: false, platform: 'android' };
  test('Follow uses Liquid Glass where available, else solid', () => {
    expect(resolveToolbarAppearance('follow', ios26)).toBe('liquidGlass');
    expect(resolveToolbarAppearance('follow', ios18)).toBe('solid');
    expect(resolveToolbarAppearance('follow', android)).toBe('solid');
  });
  test('Glass falls back to translucent bars', () => {
    expect(resolveToolbarAppearance('glass', ios26)).toBe('liquidGlass');
    expect(resolveToolbarAppearance('glass', ios18)).toBe('translucent');
    expect(resolveToolbarAppearance('glass', android)).toBe('translucent');
  });
  test('Solid and Reduce Transparency are always opaque', () => {
    expect(resolveToolbarAppearance('solid', ios26)).toBe('solid');
    expect(resolveToolbarAppearance('glass', { ...ios26, reduceTransparency: true })).toBe('solid');
  });
});

describe('hrefs.entry', () => {
  test('defaults to the full editor and carries the quick mode', () => {
    expect(hrefs.entry(5)).toBe('/entry/5');
    expect(hrefs.entry(5, 'quick')).toBe('/entry/5?mode=quick');
    expect(hrefs.settings.whatsNew()).toBe('/(tabs)/(settings)/whats-new');
  });
});
