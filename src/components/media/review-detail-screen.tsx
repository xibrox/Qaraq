import MoreVertIcon from '@expo/material-symbols/more_vert.xml';
import OpenInNewIcon from '@expo/material-symbols/open_in_new.xml';
import ShareIcon from '@expo/material-symbols/share.xml';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';

import { useRateReview, useReview } from '@/api/queries/hooks';
import type { ReviewDetail, ReviewRating } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { AniListMarkdown } from '@/components/activity/markdown/anilist-markdown';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { CoverImage } from '@/components/cover-image';
import { ErrorState } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { toast } from '@/components/toast';
import { formatTimeAgo } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useScrollUnderHeaderOptions } from '@/navigation/toolbar-appearance';
import { useTheme } from '@/theme';

import { mediaFormatLabel } from './media-format';
import { mediaIcons } from './media-icons';
import { tierColor } from './media-score';

const isIOS = process.env.EXPO_OS === 'ios';

function ReviewToolbar({ review, title }: { review: ReviewDetail; title: string }) {
  const theme = useTheme();
  const url = review.siteUrl;
  if (!url) return null;
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon={isIOS ? 'ellipsis' : MoreVertIcon} tintColor={theme.colors.text} accessibilityLabel="More">
        <Stack.Toolbar.MenuAction
          icon={isIOS ? 'safari' : OpenInNewIcon}
          onPress={() => WebBrowser.openBrowserAsync(url).catch(() => undefined)}>
          View on AniList
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon={isIOS ? 'square.and.arrow.up' : ShareIcon}
          onPress={() => Share.share(isIOS ? { url, title } : { message: `${title}\n${url}` }).catch(() => undefined)}>
          Share
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}

/**
 * iOS nav bar: AniClient's plain "←" (the system back is a "<" chevron in a glass circle) and, under
 * the transparent Liquid Glass bar, a hard scroll-edge (an opaque bar in light themes) so the body
 * text doesn't run behind the title.
 * Android's native stack already shows a plain arrow over an opaque bar.
 */
function ReviewNavBar() {
  const theme = useTheme();
  const router = useRouter();
  const headerOptions = useScrollUnderHeaderOptions();
  if (!isIOS) return null;
  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          ...headerOptions,
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="arrow.left"
          tintColor={theme.colors.text}
          hidesSharedBackground
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(hrefs.tab('explore')))}
        />
      </Stack.Toolbar>
    </>
  );
}

type VoteProps = { review: ReviewDetail };

/** "12 out of 15 users liked this review" with 👍 / 👎 toggles (tap the active one to clear). */
function ReviewVotes({ review }: VoteProps) {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const viewerId = useViewerId();
  const rate = useRateReview();
  const own = viewerId != null && viewerId === review.userId;
  const current: ReviewRating = review.userRating ?? 'NO_VOTE';

  const vote = (rating: Exclude<ReviewRating, 'NO_VOTE'>) => {
    if (!signedIn) {
      router.push(hrefs.signIn());
      return;
    }
    haptics.selection();
    rate.mutate(
      { reviewId: review.id, rating: current === rating ? 'NO_VOTE' : rating },
      { onError: () => toast.error('Could not rate this review') },
    );
  };

  const button = (rating: Exclude<ReviewRating, 'NO_VOTE'>) => {
    const up = rating === 'UP_VOTE';
    const active = current === rating;
    const icon = up ? (active ? mediaIcons.thumbsUp : mediaIcons.thumbsUpOutline) : active ? mediaIcons.thumbsDown : mediaIcons.thumbsDownOutline;
    return (
      <Pressable
        onPress={() => vote(rating)}
        disabled={own || rate.isPending}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled: own }}
        accessibilityLabel={up ? 'Upvote review' : 'Downvote review'}
        style={({ pressed }) => [
          styles.vote,
          {
            backgroundColor: active ? c.accent : c.chipFill,
            borderColor: active ? c.accent : c.chipBorder,
            borderRadius: theme.radii.md,
            opacity: own ? 0.4 : pressed ? 0.7 : 1,
          },
        ]}>
        <Icon name={icon} size={18} color={active ? c.onAccent : c.text} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.votes, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
      <AppText variant="footnote" tone="secondary" align="center">
        {`${review.rating ?? 0} out of ${review.ratingAmount ?? 0} users liked this review`}
      </AppText>
      <View style={styles.voteRow}>
        {button('UP_VOTE')}
        {button('DOWN_VOTE')}
      </View>
    </View>
  );
}

/** Review detail: media banner, author, score, full body and the rating footer. */
export function ReviewDetailScreen({ id }: { id: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const preferred = useSetting('preferredTitle');
  const q = useReview(id, { enabled: Number.isFinite(id) });
  // Only a pull shows the spinner (a background refetch after voting would push the content down on iOS).
  const [pulling, setPulling] = useState(false);
  const review = q.data ?? null;

  if (!review) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <ReviewNavBar />
        {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <LoadingState />}
      </View>
    );
  }

  const media = review.media;
  const mediaTitle = media ? pickTitle(media.title, preferred) : '';
  const shareTitle = `Review of ${mediaTitle} by ${review.user?.name ?? ''}`.trim();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ReviewNavBar />
      <ReviewToolbar review={review} title={shareTitle} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => {
              setPulling(true);
              void q.refetch().finally(() => setPulling(false));
            }}
            tintColor={c.textSecondary}
          />
        }>
        {media ? (
          <Pressable
            onPress={() => router.push(hrefs.media(media.id))}
            accessibilityRole="button"
            accessibilityLabel={`Open ${mediaTitle}`}
            style={({ pressed }) => [styles.mediaCard, { backgroundColor: c.surface, borderRadius: theme.radii.xl, opacity: pressed ? 0.8 : 1 }]}>
            {media.bannerImage ? (
              <CoverImage uri={media.bannerImage} aspectRatio={3.2} radius={0} isAdult={media.isAdult} style={styles.banner} />
            ) : null}
            <View style={styles.mediaRow}>
              <CoverImage uri={media.coverImage?.large} width={52} radius={theme.radii.xs} isAdult={media.isAdult} />
              <View style={styles.mediaTexts}>
                <AppText variant="headline" weight="800" numberOfLines={2}>
                  {mediaTitle}
                </AppText>
                <AppText variant="footnote" tone="secondary" weight="700">
                  {mediaFormatLabel(media.format)}
                </AppText>
              </View>
              <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} color={c.textTertiary} />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.authorRow}>
          <Pressable
            onPress={() => review.user && router.push(hrefs.user(review.user.id))}
            accessibilityRole="button"
            accessibilityLabel={review.user?.name ?? 'Author'}
            style={styles.author}>
            <Avatar uri={review.user?.avatar?.medium} name={review.user?.name} size={40} />
            <View style={styles.authorTexts}>
              <AppText variant="callout" weight="800" numberOfLines={1}>
                {review.user?.name ?? ''}
              </AppText>
              <AppText variant="caption1" tone="secondary">
                {formatTimeAgo(review.createdAt)}
              </AppText>
            </View>
          </Pressable>
          {review.score != null ? (
            <View style={[styles.score, { borderColor: tierColor(review.score, c) }]}>
              <AppText variant="headline" weight="800" color={tierColor(review.score, c)}>
                {String(review.score)}
              </AppText>
              <AppText variant="caption1" tone="secondary" weight="700">
                /100
              </AppText>
            </View>
          ) : null}
        </View>

        {review.summary ? (
          <AppText variant="callout" tone="secondary" weight="600" style={styles.summary}>
            {review.summary}
          </AppText>
        ) : null}
        <View style={[styles.divider, { backgroundColor: c.separator }]} />
        <AniListMarkdown html={review.body} bodyTone="primary" style={styles.body} />
        <ReviewVotes review={review} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 12, paddingBottom: 48, gap: 14 },
  mediaCard: { overflow: 'hidden' },
  banner: { width: '100%' },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  mediaTexts: { flex: 1, gap: 2 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorTexts: { flex: 1, gap: 1 },
  score: { flexDirection: 'row', alignItems: 'baseline', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  summary: { fontStyle: 'italic' },
  divider: { height: StyleSheet.hairlineWidth },
  body: { paddingHorizontal: 2 },
  votes: { padding: 14, gap: 12, alignItems: 'center', marginTop: 8 },
  voteRow: { flexDirection: 'row', gap: 12 },
  vote: { width: 64, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
