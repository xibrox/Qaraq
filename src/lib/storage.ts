import { createMMKV, type MMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * App-wide MMKV instance (react-native-mmkv v4, Nitro based).
 * Synchronous, fast key/value storage for non-secret data (settings, caches, last tab...).
 * Secrets (the AniList token) live in expo-secure-store instead, see src/auth/token.ts.
 */
export const storage: MMKV = createMMKV({ id: 'qaraq' });

/** Typed JSON helpers on top of MMKV. */
export function getJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  storage.remove(key);
}

/** zustand `StateStorage` backed by MMKV (synchronous, so hydration is immediate). */
export const mmkvStateStorage: StateStorage<void> = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.remove(name);
  },
};

/** Ready-to-use `storage` option for zustand's `persist` middleware. */
export function createPersistStorage<S>() {
  return createJSONStorage<S, void>(() => mmkvStateStorage);
}
