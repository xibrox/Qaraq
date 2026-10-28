import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { createPersistStorage } from '@/lib/storage';

import { createDefaultSettings, DEFAULT_SWIPE_GESTURES, mergeSettings } from './defaults';
import type {
  AiringNotificationStatus,
  ListDisplayMode,
  ListSectionKey,
  ListSort,
  MediaType,
  Settings,
  SwipeAction,
  SwipeDirection,
} from './types';

export const SETTINGS_STORAGE_KEY = 'qaraq.settings';
/** v2: AniClient-aligned settings (accent/theme presets, per-type swipes, More Settings). */
export const SETTINGS_VERSION = 2;

type SettingsActions = {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  update: (partial: Partial<Settings>) => void;
  reset: () => void;
};

export type SettingsState = Settings & SettingsActions;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...createDefaultSettings(),
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      update: (partial) => set(partial),
      reset: () => set(createDefaultSettings()),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      storage: createPersistStorage<Settings>(),
      // Persist only data, never actions.
      partialize: (state): Settings => {
        const { set: _set, update: _update, reset: _reset, ...data } = state;
        return data;
      },
      // Deep merge + enum validation, so new settings get defaults and stale values are dropped.
      merge: (persisted, current) => ({
        ...current,
        ...mergeSettings(createDefaultSettings(), persisted),
      }),
      // v1 -> v2: incompatible shapes are discarded key by key by mergeSettings' validators.
      migrate: (persisted) => persisted as Settings,
    },
  ),
);

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

/** True once persisted settings have been loaded (MMKV is synchronous, so usually immediately). */
export function hasSettingsHydrated(): boolean {
  return useSettingsStore.persist.hasHydrated();
}

/** Run `fn` once settings are hydrated (immediately if they already are). Returns an unsubscribe. */
export function onSettingsHydrated(fn: (s: Settings) => void): () => void {
  if (hasSettingsHydrated()) {
    fn(useSettingsStore.getState());
    return () => {};
  }
  return useSettingsStore.persist.onFinishHydration((s) => fn(s));
}

// ---------------------------------------------------------------------------
// Hooks / selectors
// ---------------------------------------------------------------------------

/** Subscribe to one setting. */
export function useSetting<K extends keyof Settings>(key: K): Settings[K] {
  return useSettingsStore((s) => s[key]);
}

/** Subscribe with a custom selector (shallow compared, so returning objects is fine). */
export function useSettings<T>(selector: (s: Settings) => T): T {
  return useSettingsStore(useShallow(selector));
}

/** Non-reactive read (event handlers, background tasks, non-React code). */
export function getSettings(): Settings {
  return useSettingsStore.getState();
}

export const selectListDisplayMode = (type: MediaType) => (s: Settings) => s.listDisplayMode[type];
export const selectListSort = (type: MediaType) => (s: Settings) => s.listSort[type];
export const selectSectionOrder = (type: MediaType) => (s: Settings) => s.listSectionOrder[type];
export const selectHiddenSections = (type: MediaType) => (s: Settings) => s.hiddenListSections[type];
export const selectSwipe = (type: MediaType) => (s: Settings) => s.swipe[type];
export const selectHaptics = (s: Settings) => s.haptics;
export const selectAiringNotifications = (s: Settings) => s.notifications.airing;
export const selectAdult = (s: Settings) => ({
  showAdultContent: s.showAdultContent,
  blurAdultContent: s.blurAdultContent,
});

/** Swipe gestures for one media type (reactive). */
export function useSwipeGestures(type: MediaType) {
  return useSettings(selectSwipe(type));
}

/** Chip keys in display order, excluding hidden ones. */
export function visibleSections(s: Settings, type: MediaType): ListSectionKey[] {
  const hidden = new Set(s.hiddenListSections[type]);
  return s.listSectionOrder[type].filter((k) => !hidden.has(k));
}

/** Tab to open on launch ("Default Tab"). */
export function getStartupTab(s: Settings = getSettings()) {
  return s.defaultTab;
}

// ---------------------------------------------------------------------------
// Setter helpers (usable anywhere, no hook needed)
// ---------------------------------------------------------------------------

const st = () => useSettingsStore.getState();
const patch = (partial: Partial<Settings>) => useSettingsStore.setState(partial);

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  st().set(key, value);
}

export function updateSettings(partial: Partial<Settings>) {
  st().update(partial);
}

/** "Reset App Settings". */
export function resetSettings() {
  st().reset();
}

export function setListDisplayMode(type: MediaType, mode: ListDisplayMode) {
  patch({ listDisplayMode: { ...st().listDisplayMode, [type]: mode } });
}

export function setListSort(type: MediaType, sort: ListSort) {
  patch({ listSort: { ...st().listSort, [type]: sort } });
}

export function setSectionOrder(type: MediaType, order: ListSectionKey[]) {
  patch({ listSectionOrder: { ...st().listSectionOrder, [type]: order } });
}

/**
 * Make sure custom lists returned by AniList appear in the chip order (appended after the
 * existing keys) and drop custom lists that no longer exist.
 */
export function syncCustomListSections(type: MediaType, customListNames: string[]) {
  const wanted = new Set(customListNames.map((n) => `custom:${n}` as ListSectionKey));
  const current = st().listSectionOrder[type];
  const kept = current.filter((k) => !k.startsWith('custom:') || wanted.has(k));
  const missing = [...wanted].filter((k) => !kept.includes(k));
  if (missing.length === 0 && kept.length === current.length) return;
  setSectionOrder(type, [...kept, ...missing]);
}

function toggleIn(list: ListSectionKey[], key: ListSectionKey, on?: boolean) {
  const has = list.includes(key);
  const want = on ?? !has;
  if (want === has) return list;
  return want ? [...list, key] : list.filter((k) => k !== key);
}

export function toggleSectionHidden(type: MediaType, key: ListSectionKey, hidden?: boolean) {
  const all = st().hiddenListSections;
  patch({ hiddenListSections: { ...all, [type]: toggleIn(all[type], key, hidden) } });
}

/** Gesture Settings: set "Swipe Right" / "Swipe Left" for one media type. */
export function setSwipeAction(type: MediaType, direction: SwipeDirection, action: SwipeAction) {
  const swipe = st().swipe;
  patch({ swipe: { ...swipe, [type]: { ...swipe[type], [direction]: action } } });
}

/** "Reset Anime Gestures" / "Reset Manga Gestures". */
export function resetSwipeGestures(type: MediaType) {
  patch({ swipe: { ...st().swipe, [type]: { ...DEFAULT_SWIPE_GESTURES } } });
}

export function updateHaptics(partial: Partial<Settings['haptics']>) {
  patch({ haptics: { ...st().haptics, ...partial } });
}

export function updateNotificationSettings(partial: Partial<Settings['notifications']>) {
  patch({ notifications: { ...st().notifications, ...partial } });
}

export function updateAiringNotifications(partial: Partial<Settings['notifications']['airing']>) {
  const n = st().notifications;
  patch({ notifications: { ...n, airing: { ...n.airing, ...partial } } });
}

/** Notification Settings checkmark rows. */
export function setAiringStatus(status: AiringNotificationStatus, enabled: boolean) {
  const airing = st().notifications.airing;
  updateAiringNotifications({ statuses: { ...airing.statuses, [status]: enabled } });
}

export function setNotificationType(type: keyof Settings['notifications']['types'], enabled: boolean) {
  const n = st().notifications;
  patch({ notifications: { ...n, types: { ...n.types, [type]: enabled } } });
}

export function setAiringMuted(mediaId: number, muted: boolean) {
  const airing = st().notifications.airing;
  const ids = new Set(airing.mutedMediaIds);
  if (muted) ids.add(mediaId);
  else ids.delete(mediaId);
  updateAiringNotifications({ mutedMediaIds: [...ids] });
}

export function isAiringMuted(mediaId: number, s: Settings = getSettings()) {
  return s.notifications.airing.mutedMediaIds.includes(mediaId);
}
