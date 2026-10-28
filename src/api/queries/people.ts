/**
 * Extra hooks for the people / favourites / follows screens (Character, Staff, Studio pages,
 * Favorite lists, Followers / Following). They build on the shared operations in `src/api` and
 * the shared cache keys in `queryKeys`; nothing here defines a new GraphQL document.
 */
import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { router } from 'expo-router';

import { toggleFavourite, type FavouriteTarget } from '@/api/favourites';
import { queryKeys, rememberFavouriteToggle, useToggleFavourite } from '@/api/queries/hooks';
import type {
  FavouriteKind,
  FollowUser,
  PageInfo,
  UserFavouritesQuery,
  UserProfileQuery,
} from '@/api/types';
import { toggleFollow } from '@/api/user';
import { useIsSignedIn } from '@/auth';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';

type Snapshot = [QueryKey, unknown][];

function restore(qc: ReturnType<typeof useQueryClient>, snapshot: Snapshot | undefined) {
  snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
}

/** FavouriteKind (plural, route param) -> FavouriteTarget kind (singular, mutation). */
export function favouriteTargetFor(kind: FavouriteKind, id: number): FavouriteTarget {
  switch (kind) {
    case 'anime':
      return { kind: 'anime', id };
    case 'manga':
      return { kind: 'manga', id };
    case 'characters':
      return { kind: 'character', id };
    case 'staff':
      return { kind: 'staff', id };
    case 'studios':
      return { kind: 'studio', id };
  }
}

/**
 * Optimistic favourite toggle with AniClient feedback: haptic + "Added to favorites ✅" toast.
 * The shared `useToggleFavourite` flips the detail caches; this wraps it with the sign-in guard
 * and the toast. Guests are sent to the sign-in modal.
 */
export function useFavouriteToggle() {
  const signedIn = useIsSignedIn();
  const mutation = useToggleFavourite();
  const toggle = (target: FavouriteTarget, currentlyFavourite: boolean) => {
    if (!signedIn) {
      router.push(hrefs.signIn());
      return;
    }
    haptics.selection();
    if (currentlyFavourite) toast('Removed from favorites');
    else toast.success('Added to favorites');
    mutation.mutate(target, {
      onError: () => toast.error('Could not update favorites'),
    });
  };
  return { toggle, isPending: mutation.isPending };
}

/**
 * Removes an item from the viewer's own favourites list screen, dropping the row from the
 * infinite list cache straight away (rolled back on error).
 */
export function useRemoveFavourite(userId: number, kind: FavouriteKind) {
  const qc = useQueryClient();
  const prefix: QueryKey = [...queryKeys.user.byId(userId), 'favourites', kind];
  return useMutation({
    mutationFn: (id: number) => toggleFavourite(favouriteTargetFor(kind, id)),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: prefix });
      const snapshot: Snapshot = [];
      for (const [key, data] of qc.getQueriesData<InfiniteData<UserFavouritesQuery>>({ queryKey: prefix })) {
        if (!data?.pages) continue;
        snapshot.push([key, data]);
        qc.setQueryData<InfiniteData<UserFavouritesQuery>>(key, {
          ...data,
          pages: data.pages.map((page) => {
            const conn = page.User?.favourites?.[kind];
            if (!page.User || !conn) return page;
            const nodes = (conn.nodes ?? []).filter((n) => n?.id !== id);
            return {
              ...page,
              User: { ...page.User, favourites: { ...page.User.favourites, [kind]: { ...conn, nodes } } },
            };
          }),
        });
      }
      haptics.selection();
      toast('Removed from favorites');
      return { snapshot };
    },
    // Detail pages opened afterwards must not show the stale "favourited" state AniList still serves.
    onSuccess: (_d, id) => rememberFavouriteToggle(favouriteTargetFor(kind, id), false),
    onError: (_e, _id, ctx) => {
      restore(qc, ctx?.snapshot);
      toast.error('Could not update favorites');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.user.all() }),
  });
}

type FollowListPage = {
  Page: {
    pageInfo: PageInfo;
    followers?: (FollowUser | null)[] | null;
    following?: (FollowUser | null)[] | null;
  };
};
type FollowPages = InfiniteData<FollowListPage>;

function patchFollowPages(data: FollowPages, userId: number, isFollowing: boolean): FollowPages {
  const patch = (list: (FollowUser | null)[] | null | undefined) =>
    list?.map((u) => (u && u.id === userId ? { ...u, isFollowing } : u)) ?? list;
  return {
    ...data,
    pages: data.pages.map(({ Page }) => ({
      Page: {
        ...Page,
        ...('followers' in Page ? { followers: patch(Page.followers) } : null),
        ...('following' in Page ? { following: patch(Page.following) } : null),
      },
    })),
  };
}

const isFollowListKey = (key: QueryKey) => key[1] === 'user' && (key[3] === 'followers' || key[3] === 'following');

/**
 * Follow / unfollow from a Followers / Following list. Flips `isFollowing` on every cached
 * follow list and profile for that user immediately; the server result is written back on success.
 */
export function useToggleFollowInLists() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: number; next: boolean }) => toggleFollow(userId),
    onMutate: async ({ userId, next }) => {
      await qc.cancelQueries({ queryKey: queryKeys.user.all() });
      const snapshot: Snapshot = [];
      for (const [key, data] of qc.getQueriesData<FollowPages>({ predicate: (q) => isFollowListKey(q.queryKey) })) {
        if (!data?.pages) continue;
        snapshot.push([key, data]);
        qc.setQueryData(key, patchFollowPages(data, userId, next));
      }
      for (const [key, data] of qc.getQueriesData<UserProfileQuery>({ queryKey: queryKeys.user.profiles() })) {
        if (data?.User?.id !== userId) continue;
        snapshot.push([key, data]);
        qc.setQueryData<UserProfileQuery>(key, { User: { ...data.User, isFollowing: next } });
      }
      haptics.selection();
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      restore(qc, ctx?.snapshot);
      toast.error('Could not update follow');
    },
    onSuccess: (data) => {
      const u = data.ToggleFollow;
      if (!u) return;
      for (const [key, d] of qc.getQueriesData<FollowPages>({ predicate: (q) => isFollowListKey(q.queryKey) })) {
        if (d?.pages) qc.setQueryData(key, patchFollowPages(d, u.id, !!u.isFollowing));
      }
    },
    onSettled: () => {
      // Profiles carry follower counts; lists stay as patched to avoid rows jumping around.
      qc.invalidateQueries({ queryKey: queryKeys.user.profiles() });
      qc.invalidateQueries({ queryKey: queryKeys.activity.feeds() });
    },
  });
}
