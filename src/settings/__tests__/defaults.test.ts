// @ts-ignore bun:test types are not installed (no @types/bun); bun provides the module at runtime.
import { describe, expect, test } from 'bun:test';

import { parseAuthCallback } from '../../auth/oauth';
import { airingStatusesFromSettings } from '../../lib/airing-statuses';
import { contrastRatio, normalizeHex, onColor } from '../../theme/color';
import {
  ACCENT_HEX,
  buildTheme,
  resolveAccentHex,
  resolveBackground,
} from '../../theme/tokens';
import {
  ACCENT_COLORS,
  createDefaultSettings,
  DEFAULT_SETTINGS,
  LIST_STATUS_SECTIONS,
  mergeSettings,
  THEME_BACKGROUNDS,
} from '../defaults';
import { listStatusLabel, swipeActionLabel } from '../labels';

describe('default settings', () => {
  test('match AniClient defaults', () => {
    const s = createDefaultSettings();
    expect(s.defaultMediaType).toBe('ANIME');
    expect(s.defaultTab).toBe('lists');
    expect(s.defaultActivityFeed).toBe('following');
    expect(s.defaultActivityFilter).toBe('all');
    expect(s.theme).toBe('black');
    expect(s.accentColor).toBe('white');
    expect(s.toolbarStyle).toBe('follow');
    expect(s.blurAdultContent).toBe(true);
    expect(s.showAdultContent).toBe(false);
    expect(s.haptics.enabled).toBe(true);
    expect(s.swipe.ANIME).toEqual({ right: 'increment', left: 'customList' });
    expect(s.swipe.MANGA).toEqual({ right: 'increment', left: 'customList' });
    expect(s.displayMyActivityInFollowing).toBe(true);
    expect(s.expandSummaryByDefault).toBe(false);
    expect(s.hideMangaChapters).toBe(false);
    expect(s.hideMangaVolumes).toBe(false);
    expect(s.scoreType).toBe('star');
    expect(s.notifications.airing.statuses).toEqual({
      CURRENT: true,
      PLANNING: true,
      COMPLETED: false,
      DROPPED: false,
      PAUSED: false,
    });
    expect(s.listSectionOrder.ANIME).toEqual([...LIST_STATUS_SECTIONS]);
    expect(Object.values(s.notifications.types).every(Boolean)).toBe(true);
  });
  test('all 12 accents and 7 backgrounds are selectable', () => {
    expect(ACCENT_COLORS.length).toBe(12);
    expect(THEME_BACKGROUNDS).toEqual(['black', 'darkGray', 'navy', 'maroon', 'purple', 'light', 'system']);
  });
  test('fresh copies are independent', () => {
    const a = createDefaultSettings();
    a.listSectionOrder.ANIME.pop();
    a.swipe.ANIME.right = 'delete';
    expect(createDefaultSettings().listSectionOrder.ANIME.length).toBe(6);
    expect(createDefaultSettings().swipe.ANIME.right).toBe('increment');
    expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
  });
});

describe('mergeSettings', () => {
  test('fills missing nested keys from defaults', () => {
    const merged = mergeSettings(createDefaultSettings(), {
      theme: 'navy',
      swipe: { MANGA: { left: 'delete' } },
      notifications: { airing: { minutesBefore: 15, statuses: { DROPPED: true } } },
    });
    expect(merged.theme).toBe('navy');
    expect(merged.swipe.MANGA).toEqual({ right: 'increment', left: 'delete' });
    expect(merged.swipe.ANIME).toEqual({ right: 'increment', left: 'customList' });
    expect(merged.notifications.airing.minutesBefore).toBe(15);
    expect(merged.notifications.airing.statuses.DROPPED).toBe(true);
    expect(merged.notifications.airing.statuses.CURRENT).toBe(true);
    expect(merged.notifications.airing.enabled).toBe(true);
    expect(merged.notifications.types.AIRING).toBe(true);
  });
  test('rejects wrong types, unknown enum values and unknown keys', () => {
    const merged = mergeSettings(createDefaultSettings(), {
      blurAdultContent: 'yes',
      bogus: 1,
      accentColor: { kind: 'preset', preset: 'anilistBlue' }, // v1 shape
      theme: 'amoled', // v1 value
      toolbarStyle: 'translucent', // v1 value
      defaultTab: 'feed',
      defaultActivityFeed: 'mine',
      swipe: { ANIME: { right: 'incrementProgress', left: 'delete' } },
      listDisplayMode: { ANIME: 'grid', MANGA: 'compactList' },
      listSort: { ANIME: { field: 'nextAiring', direction: 'asc' } },
    }) as unknown as Record<string, unknown> & ReturnType<typeof createDefaultSettings>;
    expect(merged.blurAdultContent).toBe(true);
    expect('bogus' in merged).toBe(false);
    expect(merged.accentColor).toBe('white');
    expect(merged.theme).toBe('black');
    expect(merged.toolbarStyle).toBe('follow');
    expect(merged.defaultTab).toBe('lists');
    expect(merged.defaultActivityFeed).toBe('mine');
    expect(merged.swipe.ANIME).toEqual({ right: 'increment', left: 'delete' });
    expect(merged.listDisplayMode).toEqual({ ANIME: 'grid', MANGA: 'list' });
    expect(merged.listSort.ANIME).toEqual({ field: 'lastUpdated', direction: 'asc' });
  });
  test('garbage input returns defaults', () => {
    expect(mergeSettings(createDefaultSettings(), null)).toEqual(createDefaultSettings());
    expect(mergeSettings(createDefaultSettings(), 'x')).toEqual(createDefaultSettings());
  });
});

describe('labels', () => {
  test('swipe and status labels follow the media type', () => {
    expect(swipeActionLabel('increment', 'ANIME')).toBe('Increase Episode');
    expect(swipeActionLabel('increment', 'MANGA')).toBe('Increase Chapter');
    expect(swipeActionLabel('customList', 'ANIME')).toBe('Custom List');
    expect(listStatusLabel('CURRENT')).toBe('Watching');
    expect(listStatusLabel('REPEATING', 'MANGA')).toBe('Rereading');
  });
});

describe('airing statuses', () => {
  test('Watching covers CURRENT and REPEATING', () => {
    expect(
      airingStatusesFromSettings({ CURRENT: true, PLANNING: true, COMPLETED: false, DROPPED: false, PAUSED: false }),
    ).toEqual(['CURRENT', 'REPEATING', 'PLANNING']);
    expect(
      airingStatusesFromSettings({ CURRENT: false, PLANNING: false, COMPLETED: false, DROPPED: true, PAUSED: false }),
    ).toEqual(['DROPPED']);
  });
});

describe('theme tokens', () => {
  test('accent resolution', () => {
    expect(resolveAccentHex('white')).toBe('#FFFFFF');
    expect(resolveAccentHex('white', 'light')).toBe('#000000');
    expect(resolveAccentHex('blue')).toBe(ACCENT_HEX.blue);
    expect(resolveAccentHex(null)).toBe('#FFFFFF');
  });
  test('background resolution', () => {
    expect(resolveBackground('system', 'dark')).toBe('black');
    expect(resolveBackground('system', 'light')).toBe('light');
    expect(resolveBackground('system', null)).toBe('black');
    expect(resolveBackground('navy', 'light')).toBe('navy');
  });
  test('black theme reproduces the spec colours', () => {
    const t = buildTheme('black', 'white');
    expect(t.dark).toBe(true);
    expect(t.colors.background).toBe('#000000');
    expect(t.colors.header).toBe('#111111');
    expect(t.colors.surface).toBe('#1A1A1A');
    expect(t.colors.chipFill).toBe('#151515');
    expect(t.colors.chipBorder).toBe('#333333');
    expect(t.colors.feedCardBorder).toBe('#222222');
    expect(t.colors.accent).toBe('#FFFFFF');
    expect(t.colors.onAccent).toBe('#000000');
  });
  test('tinted backgrounds derive surfaces from the base', () => {
    const t = buildTheme('navy', 'cyan');
    expect(t.colors.background).toBe('#0B1622');
    expect(t.colors.surface).not.toBe('#1A1A1A');
  });
  test('accent stays legible on every background', () => {
    for (const bg of ['black', 'darkGray', 'navy', 'maroon', 'purple', 'light'] as const) {
      for (const accent of ACCENT_COLORS) {
        const t = buildTheme(bg, accent);
        expect(contrastRatio(t.colors.accent, t.colors.onAccent)).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(t.colors.accent, t.colors.background)).toBeGreaterThanOrEqual(3);
      }
    }
  });
  test('onColor', () => {
    expect(onColor('#000000')).toBe('#FFFFFF');
    expect(onColor('#FFFF00')).not.toBe('#FFFFFF');
    expect(onColor('#007AFF')).toBe('#FFFFFF');
    expect(normalizeHex('#abc')).toBe('#AABBCC');
  });
});

describe('oauth callback parsing', () => {
  test('success fragment', () => {
    const r = parseAuthCallback('qaraq://auth#access_token=abc.def&token_type=Bearer&expires_in=31536000');
    expect(r).toEqual({ type: 'success', accessToken: 'abc.def', tokenType: 'Bearer', expiresIn: 31536000 });
  });
  test('error query', () => {
    const r = parseAuthCallback('qaraq://auth?error=access_denied&error_description=User%20denied');
    expect(r).toEqual({ type: 'error', error: 'access_denied', description: 'User denied' });
  });
});
