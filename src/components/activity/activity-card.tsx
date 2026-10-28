import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Activity, ListActivity, MessageActivity, TextActivity, UserLite } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { CoverImage } from '@/components/cover-image';
import { Icon } from '@/components/icon';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { donatorBadge, formatTimeAgo, listActivityPrefix } from './activity-format';
import { ActivityFooter } from './activity-footer';
import { activityIcons } from './activity-icons';
import { ActivityMenuButton } from './activity-menu';
import { CollapsibleContent } from './collapsible-content';
import { AniListMarkdown } from './markdown/anilist-markdown';
import { userHref } from './markdown/link-routing';

export type ActivityCardProps = {
  activity: Activity;
  /**
   * Show the author's name and avatar (default true). Off on a single user's feed
   * ("My Activity"), where AniClient's list cards are shorter.
   */
  showAuthor?: boolean;
  /** Clip long text with a fade and "⌄" (feed). Off on the detail screen. */
  collapsible?: boolean;
  /** Tapping the card opens the activity detail (default true; off on the detail screen). */
  linkToDetail?: boolean;
  /** Called after the viewer deletes this activity. */
  onDeleted?: () => void;
};

/** One feed item: list progress, text status or profile message. */
export function ActivityCard({ activity, showAuthor = true, collapsible = true, linkToDetail = true, onDeleted }: ActivityCardProps) {
  const router = useRouter();
  const openDetail = linkToDetail ? () => router.push(hrefs.activity(activity.id)) : undefined;
  switch (activity.__typename) {
    case 'ListActivity':
      return <ListActivityCard activity={activity} showAuthor={showAuthor} onPress={openDetail} onDeleted={onDeleted} />;
    case 'TextActivity':
      return (
        <TextActivityCard activity={activity} showAuthor={showAuthor} collapsible={collapsible} onPress={openDetail} onDeleted={onDeleted} />
      );
    case 'MessageActivity':
      return <MessageActivityCard activity={activity} collapsible={collapsible} onPress={openDetail} onDeleted={onDeleted} />;
    default:
      return null;
  }
}

type CardProps<A extends Activity> = { activity: A; onPress?: () => void; onDeleted?: () => void };

/**
 * Not grouped for screen readers (`accessible={false}`): the author link, "•••" menu, text and
 * reply/like buttons stay individually reachable instead of one concatenated label.
 */
function CardPressable({ onPress, children }: { onPress?: () => void; children: ReactNode }) {
  if (!onPress) return <View style={styles.card}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessible={false}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}>
      {children}
    </Pressable>
  );
}

function UserName({ user, color }: { user: UserLite | null; color?: string }) {
  const router = useRouter();
  const theme = useTheme();
  if (!user) return null;
  const badge = donatorBadge(user);
  return (
    <View style={styles.nameRow}>
      <Pressable onPress={() => router.push(userHref(user.id))} hitSlop={4} accessibilityRole="link" style={styles.shrink}>
        <AppText variant="subheadline" weight="700" color={color ?? theme.colors.textSecondary} numberOfLines={1}>
          {user.name}
        </AppText>
      </Pressable>
      {badge ? (
        <View style={[styles.badge, { borderColor: theme.colors.chipBorder }]}>
          <AppText variant="caption2" tone="secondary" numberOfLines={1}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function TimeAndMenu({ activity, onDeleted }: { activity: Activity; onDeleted?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.timeRow}>
      {activity.isPinned ? <Icon name={activityIcons.pin} size={11} color={theme.colors.textSecondary} /> : null}
      <AppText variant="footnote" tone="secondary" numberOfLines={1}>
        {formatTimeAgo(activity.createdAt)}
      </AppText>
      <ActivityMenuButton activity={activity} onDeleted={onDeleted} />
    </View>
  );
}

function ListActivityCard({ activity, showAuthor, onPress, onDeleted }: CardProps<ListActivity> & { showAuthor: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const preferredTitle = useSetting('preferredTitle');
  const media = activity.media;
  const title = pickTitle(media?.title, preferredTitle, 'Unknown title');
  const prefix = listActivityPrefix(activity.status, activity.progress);
  const user = activity.user;
  const listText = (
    <AppText variant="feed" weight="400" numberOfLines={showAuthor ? 4 : 3}>
      {`${prefix} `}
      <AppText variant="feed" weight="800">
        {title}
      </AppText>
    </AppText>
  );
  return (
    <CardPressable onPress={onPress}>
      <View style={styles.listRow}>
        <Pressable onPress={media ? () => router.push(hrefs.media(media.id)) : undefined} accessibilityRole="link" accessibilityLabel={title}>
          <CoverImage
            uri={media?.coverImage?.large ?? media?.coverImage?.medium}
            width={showAuthor ? 84 : 80}
            height={showAuthor ? 128 : 92}
            radius={theme.radii.md}
            isAdult={media?.isAdult}
            recyclingKey={`activity-${activity.id}`}
          />
        </Pressable>
        <View style={styles.listBody}>
          {showAuthor ? (
            <>
              <View style={styles.headerRow}>
                <View style={styles.flex}>
                  <UserName user={user} />
                </View>
                <TimeAndMenu activity={activity} onDeleted={onDeleted} />
              </View>
              {listText}
            </>
          ) : (
            // My Activity: the text starts on the first line, beside the time and "•••".
            <View style={styles.topRow}>
              <View style={styles.flex}>{listText}</View>
              <TimeAndMenu activity={activity} onDeleted={onDeleted} />
            </View>
          )}
          <View style={styles.listBottom}>
            {showAuthor && user ? (
              <Pressable onPress={() => router.push(userHref(user.id))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Avatar uri={user.avatar?.medium ?? user.avatar?.large} name={user.name} size={44} shape="rounded" />
              </Pressable>
            ) : (
              <View />
            )}
            <ActivityFooter
              activityId={activity.id}
              replyCount={activity.replyCount}
              likeCount={activity.likeCount}
              isLiked={!!activity.isLiked}
              onRepliesPress={onPress}
            />
          </View>
        </View>
      </View>
    </CardPressable>
  );
}

function TextActivityCard({
  activity,
  showAuthor,
  collapsible,
  onPress,
  onDeleted,
}: CardProps<TextActivity> & { showAuthor: boolean; collapsible: boolean }) {
  const router = useRouter();
  const user = activity.user;
  const body = (
    <CollapsibleContent enabled={collapsible}>
      <AniListMarkdown html={activity.text} />
    </CollapsibleContent>
  );
  return (
    <CardPressable onPress={onPress}>
      {showAuthor ? (
        <>
          <View style={styles.headerRow}>
            {user ? (
              <Pressable onPress={() => router.push(userHref(user.id))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Avatar uri={user.avatar?.medium ?? user.avatar?.large} name={user.name} size={44} shape="rounded" />
              </Pressable>
            ) : null}
            <View style={styles.flex}>
              <UserName user={user} />
            </View>
            <TimeAndMenu activity={activity} onDeleted={onDeleted} />
          </View>
          <View style={styles.textBody}>{body}</View>
        </>
      ) : (
        // My Activity: no author row, so the text starts beside the time and "•••".
        <View style={styles.topRow}>
          <View style={styles.flex}>{body}</View>
          <TimeAndMenu activity={activity} onDeleted={onDeleted} />
        </View>
      )}
      <ActivityFooter
        activityId={activity.id}
        replyCount={activity.replyCount}
        likeCount={activity.likeCount}
        isLiked={!!activity.isLiked}
        onRepliesPress={onPress}
      />
    </CardPressable>
  );
}

function MessageActivityCard({ activity, collapsible, onPress, onDeleted }: CardProps<MessageActivity> & { collapsible: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const messenger = activity.messenger;
  return (
    <CardPressable onPress={onPress}>
      <View style={styles.headerRow}>
        {messenger ? (
          <Pressable
            onPress={() => router.push(userHref(messenger.id))}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <Avatar uri={messenger.avatar?.medium ?? messenger.avatar?.large} name={messenger.name} size={44} shape="rounded" />
          </Pressable>
        ) : null}
        <View style={[styles.flex, styles.nameRow]}>
          <UserName user={messenger} />
          <Icon name={activityIcons.arrowRight} size={9} color={theme.colors.textTertiary} accessibilityLabel="to" />
          <UserName user={activity.recipient} />
          {activity.isPrivate ? (
            <Icon name={activityIcons.lock} size={12} color={theme.colors.textTertiary} accessibilityLabel="Private" />
          ) : null}
        </View>
        <TimeAndMenu activity={activity} onDeleted={onDeleted} />
      </View>
      <View style={styles.textBody}>
        <CollapsibleContent enabled={collapsible}>
          <AniListMarkdown html={activity.message} />
        </CollapsibleContent>
      </View>
      <ActivityFooter
        activityId={activity.id}
        replyCount={activity.replyCount}
        likeCount={activity.likeCount}
        isLiked={!!activity.isLiked}
        onRepliesPress={onPress ?? (() => router.push(hrefs.activity(activity.id)))}
      />
    </CardPressable>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  listRow: { flexDirection: 'row', gap: 10 },
  listBody: { flex: 1, gap: 6 },
  listBottom: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  shrink: { flexShrink: 1 },
  flex: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  textBody: { paddingTop: 2 },
});
