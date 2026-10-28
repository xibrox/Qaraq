import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useToggleLike } from '@/api/queries/hooks';
import { useIsSignedIn } from '@/auth';
import { AppText } from '@/components/app-text';
import { describeError } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { useTheme } from '@/theme';

import { activityIcons } from './activity-icons';
import { useActivitySheets } from './activity-sheets';

export type LikeButtonProps = {
  id: number;
  type: 'ACTIVITY' | 'ACTIVITY_REPLY';
  liked: boolean;
  count: number;
};

/**
 * "75 ♡": tap the heart to like (optimistic), tap the count or long-press to see who liked it.
 * Signed-out users are sent to sign in.
 */
export function LikeButton({ id, type, liked, count }: LikeButtonProps) {
  const theme = useTheme();
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const sheets = useActivitySheets();
  const toggle = useToggleLike();
  const color = liked ? theme.colors.favourite : theme.colors.textSecondary;
  const showLikers = () => {
    if (count > 0) sheets.showLikers({ id, type });
  };
  return (
    <View style={styles.row}>
      <Pressable onPress={showLikers} onLongPress={showLikers} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${count} ${count === 1 ? 'like' : 'likes'}`}>
        <AppText variant="footnote" weight="700" color={theme.colors.text}>
          {count}
        </AppText>
      </Pressable>
      <Pressable
        onPress={() => {
          if (!signedIn) {
            router.push(hrefs.signIn());
            return;
          }
          haptics.light();
          toggle.mutate({ id, type }, { onError: (e) => toast.error(describeError(e).message) });
        }}
        onLongPress={showLikers}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Unlike' : 'Like'}
        accessibilityState={{ selected: liked }}>
        <Icon name={liked ? activityIcons.heartFill : activityIcons.heart} size={17} color={color} />
      </Pressable>
    </View>
  );
}

/** "3 💬": reply count; tapping opens the activity detail (unless already there). */
export function ReplyCount({ count, onPress }: { count: number; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${count} ${count === 1 ? 'reply' : 'replies'}`} style={styles.row}>
      <AppText variant="footnote" weight="700" color={theme.colors.text}>
        {count}
      </AppText>
      <Icon name={activityIcons.comment} size={15} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

/** Bottom-right "3 💬  75 ♡" of a feed card. */
export function ActivityFooter({
  activityId,
  replyCount,
  likeCount,
  isLiked,
  onRepliesPress,
}: {
  activityId: number;
  replyCount: number;
  likeCount: number;
  isLiked: boolean;
  onRepliesPress?: () => void;
}) {
  return (
    <View style={styles.footer}>
      <ReplyCount count={replyCount} onPress={onRepliesPress} />
      <LikeButton id={activityId} type="ACTIVITY" liked={isLiked} count={likeCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
});
