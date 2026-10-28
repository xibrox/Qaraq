import EditIcon from '@expo/material-symbols/edit.xml';
import FavoriteIcon from '@expo/material-symbols/favorite.xml';
import HeartBrokenIcon from '@expo/material-symbols/heart_broken.xml';
import OpenInNewIcon from '@expo/material-symbols/open_in_new.xml';
import PlaylistAddIcon from '@expo/material-symbols/playlist_add.xml';
import ShareIcon from '@expo/material-symbols/share.xml';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';

import { useSaveMediaListEntry, useToggleFavourite } from '@/api/queries/hooks';
import { MEDIA_LIST_STATUSES, type MediaDetail, type MediaListStatus } from '@/api/types';
import { useIsSignedIn } from '@/auth';
import type { MenuEntry } from '@/components/menu/native-menu';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { listStatusLabel, useSetting } from '@/settings';

/** Media detail actions shared by the heart button, the "⋮" menu, the status button and the FAB. */
export function useMediaActions(media: MediaDetail | null | undefined) {
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const preferred = useSetting('preferredTitle');
  const favourite = useToggleFavourite();
  const save = useSaveMediaListEntry();

  const requireSignIn = (): boolean => {
    if (signedIn) return true;
    router.push(hrefs.signIn());
    return false;
  };

  const toggleFavourite = () => {
    if (!media || !requireSignIn()) return;
    if (media.isFavouriteBlocked) {
      toast.error('Favourites are blocked for this title');
      return;
    }
    const adding = !media.isFavourite;
    haptics.impact('soft');
    favourite.mutate(
      { kind: media.type === 'MANGA' ? 'manga' : 'anime', id: media.id },
      {
        onSuccess: () => (adding ? toast.success('Added to favorites') : toast('Removed from favorites')),
        onError: () => toast.error('Could not update favorites'),
      },
    );
  };

  const openOnAniList = () => {
    if (media?.siteUrl) WebBrowser.openBrowserAsync(media.siteUrl).catch(() => undefined);
  };

  const share = () => {
    if (!media?.siteUrl) return;
    const title = pickTitle(media.title, preferred);
    Share.share({ title, message: `${title}\n${media.siteUrl}`, url: media.siteUrl }).catch(() => undefined);
  };

  const editEntry = () => {
    if (!media || !requireSignIn()) return;
    router.push(hrefs.entry(media.id));
  };

  const setStatus = (status: MediaListStatus) => {
    if (!media || !requireSignIn()) return;
    haptics.success();
    save.mutate(
      { id: media.mediaListEntry?.id, mediaId: media.id, status },
      {
        onSuccess: () => toast.success(`Set to ${listStatusLabel(status, media.type ?? 'ANIME')}`),
        onError: () => toast.error('Could not update your list'),
      },
    );
  };

  const type = media?.type ?? 'ANIME';
  const current = media?.mediaListEntry?.status ?? null;

  const menuItems: MenuEntry[] = [
    { key: 'anilist', title: 'View on AniList', icon: { ios: 'safari', android: OpenInNewIcon }, onPress: openOnAniList },
    { key: 'share', title: 'Share', icon: { ios: 'square.and.arrow.up', android: ShareIcon }, onPress: share },
    {
      kind: 'section',
      key: 'library',
      items: [
        {
          key: 'favourite',
          title: media?.isFavourite ? 'Remove from Favorites' : 'Add to Favorites',
          icon: media?.isFavourite ? { ios: 'heart.slash', android: HeartBrokenIcon } : { ios: 'heart', android: FavoriteIcon },
          onPress: toggleFavourite,
        },
        {
          kind: 'submenu',
          key: 'status',
          title: current ? 'Set Status' : 'Add to List',
          icon: { ios: 'text.badge.plus', android: PlaylistAddIcon },
          items: MEDIA_LIST_STATUSES.map((s) => ({
            key: s,
            title: listStatusLabel(s, type),
            checked: s === current,
            onPress: () => setStatus(s),
          })),
        },
        { key: 'edit', title: current ? 'Edit Entry' : 'Open Editor', icon: { ios: 'pencil', android: EditIcon }, onPress: editEntry },
      ],
    },
  ];

  return { signedIn, toggleFavourite, openOnAniList, share, editEntry, setStatus, menuItems, saving: save.isPending };
}
