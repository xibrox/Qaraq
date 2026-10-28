import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

import { setOnUnauthorized, setTokenGetter } from '@/api/client';
import {
  ANILIST_AUTHORIZE_URL,
  ANILIST_CLIENT_ID,
  ANILIST_GRAPHQL_URL,
  ANILIST_REDIRECT_URI,
  IS_ANILIST_CONFIGURED,
} from '@/config';
import { clearQueryCache } from '@/lib/queryClient';

import { buildAuthorizeUrl, expiryFromNow, isExpired, parseAuthCallback } from './oauth';
import { clearToken, loadToken, saveToken, type StoredToken } from './token';

/**
 * Auth state.
 * - `loading`: bootstrapping from secure storage on launch
 * - `signedOut`: guest mode, public AniList browsing works without a token
 * - `signedIn`: token present (viewerId is filled in as soon as Viewer resolves)
 */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export type AuthState = {
  status: AuthStatus;
  token: string | null;
  expiresAt: number | null;
  viewerId: number | null;
  /** User explicitly chose to continue without an account (onboarding dismissed). */
  guest: boolean;
  /** Last sign-in error message, if any. */
  error: string | null;
};

export type SignInResult = { ok: true } | { ok: false; reason: 'cancelled' | 'error'; message?: string };

const initialState: AuthState = {
  status: 'loading',
  token: null,
  expiresAt: null,
  viewerId: null,
  guest: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(() => initialState);

const getState = () => useAuthStore.getState();
const setState = (p: Partial<AuthState>) => useAuthStore.setState(p);

// Wire the API client to this store once, at module load.
setTokenGetter(() => {
  const { token, expiresAt } = getState();
  if (!token) return null;
  if (expiresAt != null && isExpired(expiresAt, Date.now(), 0)) {
    // Token expired while the app was running: end the session instead of silently
    // sending anonymous requests while the UI still thinks the user is signed in.
    void signOut();
    return null;
  }
  return token;
});
setOnUnauthorized(() => {
  // Token revoked/expired server-side: drop the session, keep browsing as guest.
  if (getState().status === 'signedIn') void signOut();
});

// Completes the auth popup on web; no-op on native.
WebBrowser.maybeCompleteAuthSession();

/** Fetch the signed-in user's id with a minimal request (independent of the API layer). */
async function fetchViewerId(accessToken: string): Promise<number | null> {
  try {
    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: 'query { Viewer { id } }' }),
    });
    if (res.status === 401 || res.status === 400) throw new UnauthorizedError();
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { Viewer?: { id?: number } } };
    return json.data?.Viewer?.id ?? null;
  } catch (e) {
    if (e instanceof UnauthorizedError) throw e;
    return null; // network error: keep the token, retry later
  }
}

class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

async function applySession(session: StoredToken) {
  setState({
    status: 'signedIn',
    token: session.accessToken,
    expiresAt: session.expiresAt,
    viewerId: session.viewerId,
    guest: false,
    error: null,
  });
}

/**
 * Resolve and persist viewerId if missing (no-op when signed out or already known).
 * Exported so the root layout can retry when the app returns to the foreground after a
 * launch-time network failure.
 */
export async function ensureViewerId(): Promise<void> {
  const { token, expiresAt, viewerId } = getState();
  if (!token || viewerId != null) return;
  try {
    const id = await fetchViewerId(token);
    if (id == null || getState().token !== token) return;
    setState({ viewerId: id });
    await saveToken({ accessToken: token, expiresAt: expiresAt ?? expiryFromNow(null), viewerId: id });
  } catch (e) {
    if (e instanceof UnauthorizedError) await signOut();
  }
}

let bootstrapPromise: Promise<void> | null = null;

/** Restore the session from secure storage. Call once on launch (idempotent). */
export function bootstrapAuth(): Promise<void> {
  bootstrapPromise ??= (async () => {
    const stored = await loadToken();
    if (!stored || isExpired(stored.expiresAt)) {
      if (stored) await clearToken();
      setState({ ...initialState, status: 'signedOut' });
      return;
    }
    await applySession(stored);
    void ensureViewerId();
  })();
  return bootstrapPromise;
}

/** Open AniList's authorize page and complete the implicit grant. */
export async function signIn(): Promise<SignInResult> {
  if (!IS_ANILIST_CONFIGURED) {
    const message = 'AniList client id is not configured (app.json > expo.extra.anilistClientId).';
    setState({ error: message });
    return { ok: false, reason: 'error', message };
  }
  try {
    const url = buildAuthorizeUrl(ANILIST_AUTHORIZE_URL, ANILIST_CLIENT_ID);
    const result = await WebBrowser.openAuthSessionAsync(url, ANILIST_REDIRECT_URI, {
      preferEphemeralSession: false,
    });
    if (result.type !== 'success') return { ok: false, reason: 'cancelled' };

    const parsed = parseAuthCallback(result.url);
    if (parsed.type === 'error') {
      const message = parsed.description ?? parsed.error;
      setState({ error: message });
      return { ok: false, reason: parsed.error === 'access_denied' ? 'cancelled' : 'error', message };
    }

    const session: StoredToken = {
      accessToken: parsed.accessToken,
      expiresAt: expiryFromNow(parsed.expiresIn),
      viewerId: null,
    };
    await saveToken(session);
    await applySession(session);
    // Guest data in the cache was fetched without the user's context (isFavourite, mediaListEntry...).
    // Clear only after the token is in the store, so observers that refetch immediately use it.
    clearQueryCache();
    await ensureViewerId();
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setState({ error: message });
    return { ok: false, reason: 'error', message };
  }
}

/** Sign out: forget the token and cached user data; the app stays usable as guest. */
let signingOut: Promise<void> | null = null;

export function signOut(): Promise<void> {
  // Several in-flight requests can hit 401 at once; collapse them into one sign-out.
  signingOut ??= (async () => {
    try {
      // Drop the token from memory first so refetches triggered by clearing the cache are anonymous.
      setState({ ...initialState, status: 'signedOut' });
      clearQueryCache();
      await clearToken();
    } finally {
      signingOut = null;
    }
  })();
  return signingOut;
}

/** Continue without an account. */
export function continueAsGuest() {
  setState({ guest: true, status: getState().status === 'loading' ? 'signedOut' : getState().status });
}

export function clearAuthError() {
  setState({ error: null });
}

// Selectors / hooks
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useViewerId = () => useAuthStore((s) => s.viewerId);
export const useIsSignedIn = () => useAuthStore((s) => s.status === 'signedIn');
export const getAccessToken = () => getState().token;
export const getViewerId = () => getState().viewerId;
