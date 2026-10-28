import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';

/** Persisted AniList session. */
export type StoredToken = {
  accessToken: string;
  /** ms epoch */
  expiresAt: number;
  viewerId: number | null;
};

const TOKEN_KEY = 'qaraq.anilist.token';

// expo-secure-store has no web implementation; fall back to MMKV (localStorage) on web.
const useSecureStore = Platform.OS === 'ios' || Platform.OS === 'android';

function isStoredToken(v: unknown): v is StoredToken {
  const t = v as StoredToken;
  return !!t && typeof t.accessToken === 'string' && typeof t.expiresAt === 'number';
}

export async function loadToken(): Promise<StoredToken | null> {
  try {
    const raw = useSecureStore ? await SecureStore.getItemAsync(TOKEN_KEY) : (storage.getString(TOKEN_KEY) ?? null);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredToken(parsed)) return null;
    return { ...parsed, viewerId: typeof parsed.viewerId === 'number' ? parsed.viewerId : null };
  } catch {
    return null;
  }
}

export async function saveToken(token: StoredToken): Promise<void> {
  const raw = JSON.stringify(token);
  if (useSecureStore) {
    await SecureStore.setItemAsync(TOKEN_KEY, raw, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } else {
    storage.set(TOKEN_KEY, raw);
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (useSecureStore) await SecureStore.deleteItemAsync(TOKEN_KEY);
    else storage.remove(TOKEN_KEY);
  } catch {
    // ignore
  }
}
