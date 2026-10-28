import { Stack, useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useMediaDetail } from '@/api/queries/hooks';
import { useAuthStatus, useIsSignedIn } from '@/auth';
import type { FollowingListEntry } from '@/api/types';
import { ErrorState } from '@/components/error-state';
import { Fab } from '@/components/fab';
import { LoadingState } from '@/components/loading-state';
import { revealViewTop, ScrollRevealProvider, type RevealTop } from '@/components/scroll-reveal';
import { pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { AiringScheduleSection } from './airing-schedule';
import { CoverViewer } from './cover-viewer';
import { DescriptionCard } from './description-card';
import { ExternalLinksSection } from './external-links';
import { FollowingSheet } from './following-sheet';
import { InfoCard } from './info-card';
import { ListStatusButton } from './list-status-button';
import { MEDIA_BAR_FADE, MEDIA_BAR_HEIGHT, MediaHeaderBar } from './media-header-bar';
import { HERO_BANNER_HEIGHT, MediaHero } from './media-hero';
import { RecommendationsSection, RelatedSection } from './media-row-sections';
import { CharactersSection, StaffSection } from './people-sections';
import { CharactersSheet, StaffSheet } from './people-sheets';
import { ReviewsSection, ReviewsSheet } from './reviews-section';
import { StatsSection } from './stats-section';
import { TagsSection } from './tags-section';
import { useMediaActions } from './use-media-actions';
import { EpisodesSection, TrailerSection } from './video-sections';

const SHEET_DISMISS_MS = 350;

type SheetKind = 'cover' | 'characters' | 'staff' | 'reviews' | 'following' | null;

/**
 * Media detail (spec §4): blurred banner hero with floating glass buttons that collapse into an
 * opaque bar, info card + rank pills, list status button, carousels, stats, reviews and links.
 * The pencil FAB opens the entry editor (`hrefs.entry`).
 */
export function MediaDetailScreen({ id }: { id: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const preferred = useSetting('preferredTitle');
  const signedIn = useIsSignedIn();
  const [sheet, setSheet] = useState<SheetKind>(null);
  // Only a pull shows the spinner: background refetches (e.g. after a favourite toggle) would make
  // the iOS RefreshControl appear and push the content down.
  const [pulling, setPulling] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const collapseAt = HERO_BANNER_HEIGHT + insets.top;
  const revealTop: RevealTop = (view) =>
    revealViewTop(
      view,
      insets.top + MEDIA_BAR_HEIGHT,
      () => scrollY.get(),
      (y) => {
        // Don't stop mid-fade with a half-transparent bar over the hero: stop just before it
        // instead (the card then sits a little lower, still fully visible).
        const fadeStart = collapseAt + MEDIA_BAR_FADE[0];
        const target = y > fadeStart && y < collapseAt + MEDIA_BAR_FADE[1] ? fadeStart : y;
        scrollRef.current?.scrollTo({ y: target, animated: true });
      },
    );
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  // The FAB and the "Add to List" / status bar do the same thing, and the FAB would cover the end
  // of the bar, so the FAB hides while the bar is on screen above the FAB's bottom edge (below it
  // is the iOS tab bar). Bar offsets are in scroll-content coords; the FAB's in screen coords.
  const sectionsTop = useSharedValue(0);
  const statusBox = useSharedValue({ y: 0, height: 0 });
  const fabBottom = useSharedValue(0);
  const [fabHidden, setFabHidden] = useState(false);
  useAnimatedReaction(
    () => {
      const box = statusBox.get();
      if (!box.height || !fabBottom.get()) return false;
      const top = sectionsTop.get() + box.y - scrollY.get();
      return top + box.height > 0 && top < fabBottom.get();
    },
    (visible, previous) => {
      if (visible !== previous) scheduleOnRN(setFabHidden, visible);
    },
  );

  // A deep link can open this before the stored session loads; anonymous data lacks list/favourite state.
  const authReady = useAuthStatus() !== 'loading';
  const detail = useMediaDetail({ id, withFollowing: signedIn }, { enabled: authReady && Number.isFinite(id) });
  const media = detail.data?.Media ?? null;
  const following = (detail.data?.following?.mediaList ?? []).filter((f): f is FollowingListEntry => f != null);
  const actions = useMediaActions(media);

  const title = media ? pickTitle(media.title, preferred) : '';
  const close = () => setSheet(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace(hrefs.tab('explore')));

  const openMedia = (mediaId: number) => router.push(hrefs.media(mediaId));
  /** Pushes after the open page sheet has animated away (a push under a modal is not visible). */
  const go = (href: Href) => {
    if (sheet == null || sheet === 'cover') {
      router.push(href);
      return;
    }
    close();
    setTimeout(() => router.push(href), SHEET_DISMISS_MS);
  };
  const openCharacter = (characterId: number) => go(hrefs.character(characterId));
  const openStaff = (staffId: number) => go(hrefs.staff(staffId));
  const openReview = (reviewId: number) => go(hrefs.review(reviewId));
  const openUser = (userId: number) => go(hrefs.user(userId));

  const header = (
    <MediaHeaderBar
      title={title}
      scrollY={scrollY}
      collapseAt={collapseAt}
      isFavourite={media?.isFavourite}
      onBack={back}
      onToggleFavourite={media ? actions.toggleFavourite : undefined}
      menuItems={media ? actions.menuItems : undefined}
    />
  );

  if (!media) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {header}
        {detail.error ? (
          <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
        ) : (
          <LoadingState />
        )}
      </View>
    );
  }

  const type = media.type ?? 'ANIME';
  const reviewsHasMore = !!media.reviews?.pageInfo?.hasNextPage;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => {
              setPulling(true);
              void detail.refetch().finally(() => setPulling(false));
            }}
            tintColor={c.textSecondary}
            progressViewOffset={insets.top + 44}
          />
        }>
        <MediaHero
          media={media}
          following={following}
          onCoverPress={() => setSheet('cover')}
          onFriendsPress={() => setSheet('following')}
          onGenrePress={(genre) => router.push(hrefs.search({ type, genre }))}
        />
        <View style={styles.sections} onLayout={(e) => sectionsTop.set(e.nativeEvent.layout.y)}>
          <ScrollRevealProvider value={revealTop}>
            <DescriptionCard html={media.description} />
          </ScrollRevealProvider>
          <View style={[styles.divider, { backgroundColor: c.separator }]} />
          <InfoCard media={media} onStudioPress={(studioId) => router.push(hrefs.studio(studioId))} />
          <View onLayout={(e) => statusBox.set({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}>
            <ListStatusButton media={media} onPress={actions.editEntry} />
          </View>
          <TagsSection tags={media.tags} />
          <AiringScheduleSection schedule={media.airingSchedule} type={media.type} />
          <RelatedSection edges={media.relations?.edges} onOpen={openMedia} />
          <CharactersSection
            edges={media.characters?.edges}
            onSeeAll={() => setSheet('characters')}
            onCharacter={openCharacter}
            onStaff={openStaff}
          />
          <StaffSection edges={media.staff?.edges} onSeeAll={() => setSheet('staff')} onStaff={openStaff} />
          <RecommendationsSection nodes={media.recommendations?.nodes} onOpen={openMedia} />
          <TrailerSection trailer={media.trailer} />
          <EpisodesSection episodes={media.streamingEpisodes} />
          <StatsSection stats={media.stats} type={type} />
          <ReviewsSection
            nodes={media.reviews?.nodes}
            hasMore={reviewsHasMore}
            onSeeAll={() => setSheet('reviews')}
            onOpen={openReview}
          />
          <ExternalLinksSection links={media.externalLinks} />
        </View>
      </Animated.ScrollView>
      {header}
      {fabHidden ? null : (
        <Animated.View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}>
          <Fab
            onPress={actions.editEntry}
            accessibilityLabel={media.mediaListEntry ? 'Edit list entry' : 'Add to list'}
            aboveTabBar
            onLayout={(e) => fabBottom.set(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
          />
        </Animated.View>
      )}

      <CoverViewer
        visible={sheet === 'cover'}
        uri={media.coverImage?.extraLarge ?? media.coverImage?.large}
        isAdult={media.isAdult}
        onClose={close}
      />
      <CharactersSheet
        mediaId={media.id}
        visible={sheet === 'characters'}
        onClose={close}
        onCharacter={openCharacter}
        onStaff={openStaff}
      />
      <StaffSheet mediaId={media.id} visible={sheet === 'staff'} onClose={close} onStaff={openStaff} />
      <ReviewsSheet mediaId={media.id} visible={sheet === 'reviews'} onClose={close} onOpen={openReview} />
      {actions.signedIn ? (
        <FollowingSheet
          mediaId={media.id}
          mediaType={type}
          total={type === 'MANGA' ? media.chapters : media.episodes}
          visible={sheet === 'following'}
          onClose={close}
          onUser={openUser}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 160 },
  sections: { gap: 22, marginTop: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
});
