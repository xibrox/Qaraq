import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useDeleteActivityReply } from '@/api/queries/hooks';
import type { ActivityReply } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { describeError } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { NativeMenu } from '@/components/menu/native-menu';
import type { MenuEntry } from '@/components/menu/types';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { copyLink } from './activity-menu';
import { LikeButton } from './activity-footer';
import { donatorBadge, formatTimeAgo } from './activity-format';
import { activityIcons } from './activity-icons';
import { AniListMarkdown } from './markdown/anilist-markdown';
import { userHref } from './markdown/link-routing';
import { menuIcons } from './menu-icons';

export type ReplyRowProps = {
  reply: ActivityReply;
  /** Inserts "@name " into the composer. */
  onMention?: (name: string) => void;
};

/** A reply under an activity: avatar, name, time, "•••", markdown text, likes. */
export function ReplyRow({ reply, onMention }: ReplyRowProps) {
  const theme = useTheme();
  const router = useRouter();
  const viewerId = useViewerId();
  const signedIn = useIsSignedIn();
  const del = useDeleteActivityReply();
  const user = reply.user;
  const badge = donatorBadge(user);

  const items: MenuEntry[] = [];
  if (signedIn && user && onMention) {
    items.push({ key: 'reply', title: 'Reply', icon: menuIcons.reply, onPress: () => onMention(user.name) });
  }
  if (reply.activityId != null) {
    const activityId = reply.activityId;
    items.push({ key: 'copy', title: 'Copy Link', icon: menuIcons.copy, onPress: () => void copyLink(`https://anilist.co/activity/${activityId}`) });
  }
  if (viewerId != null && reply.userId === viewerId) {
    items.push({
      key: 'delete',
      title: 'Delete',
      icon: menuIcons.delete,
      destructive: true,
      onPress: () =>
        Alert.alert('Delete Reply', 'Are you sure you want to delete this reply?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              haptics.destructive();
              del.mutate(
                { id: reply.id, activityId: reply.activityId ?? undefined },
                { onError: (e) => toast.error(describeError(e).message) },
              );
            },
          },
        ]),
    });
  }

  return (
    <View style={[styles.row, { borderTopColor: theme.colors.separator }]}>
      <View style={styles.header}>
        {user ? (
          <Pressable onPress={() => router.push(userHref(user.id))} accessibilityRole="link" accessibilityLabel={user.name} style={styles.user}>
            <Avatar uri={user.avatar?.medium ?? user.avatar?.large} name={user.name} size={36} shape="rounded" />
            <AppText variant="subheadline" weight="700" tone="secondary" numberOfLines={1} style={styles.shrink}>
              {user.name}
            </AppText>
            {badge ? (
              <View style={[styles.badge, { borderColor: theme.colors.chipBorder }]}>
                <AppText variant="caption2" tone="secondary">
                  {badge}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.user} />
        )}
        <AppText variant="footnote" tone="secondary">
          {formatTimeAgo(reply.createdAt)}
        </AppText>
        {items.length ? (
          <NativeMenu items={items}>
            <View style={styles.more} accessibilityRole="button" accessibilityLabel="More actions">
              <Icon name={activityIcons.more} size={16} color={theme.colors.textSecondary} />
            </View>
          </NativeMenu>
        ) : null}
      </View>
      <AniListMarkdown html={reply.text} />
      <View style={styles.footer}>
        <LikeButton id={reply.id} type="ACTIVITY_REPLY" liked={!!reply.isLiked} count={reply.likeCount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  user: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  shrink: { flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  more: { padding: 4 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
});
