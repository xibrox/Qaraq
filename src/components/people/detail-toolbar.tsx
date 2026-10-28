import FavoriteIcon from '@expo/material-symbols/favorite.xml';
import MoreVertIcon from '@expo/material-symbols/more_vert.xml';
import OpenInNewIcon from '@expo/material-symbols/open_in_new.xml';
import ShareIcon from '@expo/material-symbols/share.xml';
import { Stack } from 'expo-router';
import { Linking, Share } from 'react-native';

import { useTheme } from '@/theme';

const isIOS = process.env.EXPO_OS === 'ios';

export type DetailToolbarProps = {
  isFavourite: boolean;
  onToggleFavourite: () => void;
  favouriteDisabled?: boolean;
  /** AniList page for "View on AniList" / "Share". */
  siteUrl?: string | null;
  /** Name used in the share sheet. */
  shareTitle: string;
};

/**
 * Nav bar items for Character / Staff / Studio: heart (red when favourited) and "⋮" with
 * "View on AniList" and "Share", like media detail. Liquid Glass circles on iOS 26.
 */
export function DetailToolbar({ isFavourite, onToggleFavourite, favouriteDisabled, siteUrl, shareTitle }: DetailToolbarProps) {
  const theme = useTheme();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={isIOS ? (isFavourite ? 'heart.fill' : 'heart') : FavoriteIcon}
        tintColor={isFavourite ? theme.colors.favourite : theme.colors.text}
        onPress={onToggleFavourite}
        disabled={favouriteDisabled}
        accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
      />
      {siteUrl ? (
        <Stack.Toolbar.Menu icon={isIOS ? 'ellipsis' : MoreVertIcon} tintColor={theme.colors.text} accessibilityLabel="More">
          <Stack.Toolbar.MenuAction
            icon={isIOS ? 'arrow.up.right.square' : OpenInNewIcon}
            onPress={() => Linking.openURL(siteUrl).catch(() => undefined)}>
            View on AniList
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon={isIOS ? 'square.and.arrow.up' : ShareIcon}
            onPress={() => Share.share(isIOS ? { url: siteUrl, title: shareTitle } : { message: `${shareTitle}\n${siteUrl}` })}>
            Share
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      ) : null}
    </Stack.Toolbar>
  );
}
