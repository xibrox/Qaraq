import { appUrlToPath } from '@/navigation/hrefs';

/**
 * Rewrites incoming system URLs before Expo Router resolves them.
 * - `qaraq://media/<id>`, `user/<id>`, `activity/<id>`, `character|staff|studio|review/<id>`
 *   map to the shared detail routes (pushed in the current tab, or My List on cold start).
 * - `qaraq://notifications` maps to the Profile tab's Notifications screen (the bare path is
 *   ambiguous with Settings > Notification Settings).
 * - `qaraq://auth#access_token=...` is the OAuth callback, consumed by expo-web-browser; never route it.
 * Anything else passes through unchanged.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string | null {
  try {
    if (/^(qaraq:\/\/|\/)?auth([/?#]|$)/i.test(path)) return initial ? '/' : null;
    return appUrlToPath(path) ?? path;
  } catch {
    return initial ? '/' : null;
  }
}
