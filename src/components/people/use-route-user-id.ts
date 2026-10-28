import { useUserProfile } from '@/api/queries/hooks';

export type RouteUserId =
  | { status: 'ready'; id: number }
  | { status: 'loading' }
  | { status: 'error'; error: unknown; retry: () => void }
  | { status: 'missing' };

/**
 * `[userId]` route params are numeric ids from in-app links, but deep links may carry a
 * username (qaraq://favourites/TaigaHrk/characters). Resolve names through the profile query.
 */
export function useRouteUserId(param: string | string[] | undefined): RouteUserId {
  const raw = (Array.isArray(param) ? param[0] : param)?.trim() ?? '';
  const numeric = /^\d+$/.test(raw) ? Number(raw) : null;
  const name = numeric == null && raw ? raw : undefined;
  const profile = useUserProfile({ name }, { enabled: !!name });
  if (numeric != null) return { status: 'ready', id: numeric };
  if (!name) return { status: 'missing' };
  const id = profile.data?.User?.id;
  if (id != null) return { status: 'ready', id };
  if (profile.error) return { status: 'error', error: profile.error, retry: () => profile.refetch() };
  if (profile.isPending) return { status: 'loading' };
  return { status: 'missing' };
}
