/**
 * Pure helpers for AniList's OAuth implicit grant (no RN imports, unit-testable).
 * Docs: https://docs.anilist.co/guide/auth/implicit
 */

export type AuthCallbackResult =
  | { type: 'success'; accessToken: string; tokenType: string; expiresIn: number | null }
  | { type: 'error'; error: string; description?: string };

/** One year, AniList's documented token lifetime; used when `expires_in` is missing. */
export const DEFAULT_TOKEN_LIFETIME_SECONDS = 365 * 24 * 60 * 60;

export function buildAuthorizeUrl(authorizeUrl: string, clientId: string): string {
  return `${authorizeUrl}?client_id=${encodeURIComponent(clientId)}&response_type=token`;
}

function parseParams(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, ' '));
    const v = i < 0 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  }
  return out;
}

/**
 * Parse the redirect URL (e.g. `qaraq://auth#access_token=...&token_type=Bearer&expires_in=31536000`).
 * Reads both the fragment and the query string (errors arrive in the query).
 */
export function parseAuthCallback(url: string): AuthCallbackResult {
  const hashIndex = url.indexOf('#');
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const qIndex = beforeHash.indexOf('?');
  const query = qIndex >= 0 ? beforeHash.slice(qIndex + 1) : '';
  const params = { ...parseParams(query), ...parseParams(fragment) };

  if (params.access_token) {
    const exp = Number(params.expires_in);
    return {
      type: 'success',
      accessToken: params.access_token,
      tokenType: params.token_type || 'Bearer',
      expiresIn: Number.isFinite(exp) && exp > 0 ? exp : null,
    };
  }
  return {
    type: 'error',
    error: params.error || 'missing_token',
    description: params.error_description || params.message,
  };
}

/** Absolute expiry (ms epoch) from `expires_in` seconds. */
export function expiryFromNow(expiresIn: number | null, nowMs: number = Date.now()): number {
  return nowMs + (expiresIn ?? DEFAULT_TOKEN_LIFETIME_SECONDS) * 1000;
}

/** Treat tokens expiring within `skewMs` (default 1 hour) as expired. */
export function isExpired(expiresAt: number, nowMs: number = Date.now(), skewMs = 60 * 60 * 1000): boolean {
  return expiresAt - skewMs <= nowMs;
}
