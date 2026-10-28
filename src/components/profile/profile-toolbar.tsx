import { Stack } from 'expo-router';

import { menuIcons, toolbarXml } from '@/components/activity/menu-icons';
import { useTheme } from '@/theme';

const isIOS = process.env.EXPO_OS === 'ios';

/** Own profile: the envelope on the right with a red unread badge; opens Notifications. */
export function InboxToolbar({ unread, onPress }: { unread: number; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={isIOS ? 'envelope.fill' : toolbarXml.mail}
        tintColor={theme.colors.text}
        onPress={onPress}
        accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
        {unread > 0 ? (
          <Stack.Toolbar.Badge style={{ backgroundColor: theme.colors.danger, color: '#fff' }}>
            {unread > 99 ? '99+' : String(unread)}
          </Stack.Toolbar.Badge>
        ) : null}
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}

export type UserToolbarProps = {
  isFollowing: boolean;
  canSocial: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onOpenWeb: () => void;
  onShare: () => void;
  onCopyLink: () => void;
};

/** Another user's profile: "•••" with Follow/Unfollow, Message, View on AniList, Share and Copy Link. */
export function UserToolbar({ isFollowing, canSocial, onToggleFollow, onMessage, onOpenWeb, onShare, onCopyLink }: UserToolbarProps) {
  const theme = useTheme();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon={isIOS ? 'ellipsis' : toolbarXml.more} tintColor={theme.colors.text} accessibilityLabel="More">
        {canSocial ? (
          <Stack.Toolbar.MenuAction
            icon={isIOS ? (isFollowing ? 'person.badge.minus' : 'person.badge.plus') : isFollowing ? menuIcons.unfollow.android : menuIcons.follow.android}
            destructive={isFollowing}
            onPress={onToggleFollow}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Stack.Toolbar.MenuAction>
        ) : null}
        {canSocial ? (
          <Stack.Toolbar.MenuAction icon={isIOS ? 'envelope' : menuIcons.message.android} onPress={onMessage}>
            Message
          </Stack.Toolbar.MenuAction>
        ) : null}
        <Stack.Toolbar.MenuAction icon={isIOS ? 'safari' : menuIcons.browser.android} onPress={onOpenWeb}>
          View on AniList
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon={isIOS ? 'square.and.arrow.up' : menuIcons.share.android} onPress={onShare}>
          Share
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon={isIOS ? 'doc.on.doc' : menuIcons.copy.android} onPress={onCopyLink}>
          Copy Link
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
