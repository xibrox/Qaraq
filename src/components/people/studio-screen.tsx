import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { flattenPages, useStudio } from '@/api/queries/hooks';
import { useFavouriteToggle } from '@/api/queries/people';
import type { MediaCard, StudioMediaEdge } from '@/api/types';
import { AppText } from '@/components/app-text';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { formatEnum } from '@/lib/format';

import { connectionComplete, trustedCount } from './connection';
import { DetailGridList } from './detail-grid-list';
import { DetailToolbar } from './detail-toolbar';
import { MediaPoster } from './media-cards';
import { OptionMenuPill, type MenuOption } from './option-menu-pill';
import { PEOPLE_MEDIA_SORT, PEOPLE_MEDIA_SORT_OPTIONS, type PeopleMediaSort } from './options';
import { PersonHero } from './person-hero';

type StudioScope = 'all' | 'main';

const SCOPE_OPTIONS: readonly MenuOption<StudioScope>[] = [
  { value: 'all', label: 'All Works' },
  { value: 'main', label: 'Main Studio', subtitle: 'Hide co-productions' },
];

function mediaSubtitle(media: MediaCard): string {
  const year = media.startDate?.year ?? media.seasonYear;
  return [year ? String(year) : null, formatEnum(media.format)].filter(Boolean).join(' · ');
}

/** Studio page: name, favourite toggle, works grid sorted by start date or popularity. */
export function StudioDetailScreen({ id }: { id: number }) {
  const [sort, setSort] = useState<PeopleMediaSort>('newest');
  const [scope, setScope] = useState<StudioScope>('all');
  const { toggle } = useFavouriteToggle();

  // Header info from a tiny first page so it stays put while the grid query changes with sort.
  const info = useStudio({ id, perPage: 1 }, { enabled: Number.isFinite(id) });
  const query = useStudio(
    { id, perPage: 30, sort: PEOPLE_MEDIA_SORT[sort], ...(scope === 'main' ? { isMain: true } : null) },
    { enabled: Number.isFinite(id) },
  );

  const studio = info.data?.pages[0]?.Studio;
  if (!studio) {
    if (info.error) return <ErrorState error={info.error} onRetry={() => info.refetch()} />;
    return <LoadingState />;
  }

  const edges = flattenPages(query.data, (p) => p.Studio?.media?.edges).filter(
    (e): e is StudioMediaEdge & { node: MediaCard } => !!e.node,
  );
  // Media can repeat across pages when AniList reorders; keep the first.
  const seen = new Set<number>();
  const unique = edges.filter((e) => (seen.has(e.node.id) ? false : (seen.add(e.node.id), true)));
  const complete = connectionComplete(
    query.data,
    (p) => p.Studio?.media?.pageInfo,
    (p) => p.Studio?.media?.edges?.length ?? 0,
  );
  const total = trustedCount(complete, unique.length);
  const toggleFavourite = () => toggle({ kind: 'studio', id: studio.id }, studio.isFavourite);

  const header = (
    <View style={styles.header}>
      <PersonHero
        name={studio.name}
        caption={studio.isAnimationStudio ? 'Animation Studio' : 'Studio'}
        favourites={studio.favourites}
        isFavourite={studio.isFavourite}
        onToggleFavourite={toggleFavourite}
      />
      <View style={styles.sectionTitle}>
        <AppText variant="sectionHeader" tone="muted" accessibilityRole="header">
          Works
        </AppText>
        {total ? (
          <AppText variant="subheadline" tone="tertiary">
            {total}
          </AppText>
        ) : null}
      </View>
      <View style={styles.toolbar}>
        <OptionMenuPill title="Sort By" options={PEOPLE_MEDIA_SORT_OPTIONS} value={sort} onChange={setSort} />
        <OptionMenuPill title="Show" icon={icons.filter} options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
      </View>
    </View>
  );

  return (
    <>
      <DetailToolbar
        isFavourite={studio.isFavourite}
        onToggleFavourite={toggleFavourite}
        siteUrl={studio.siteUrl}
        shareTitle={studio.name}
      />
      <DetailGridList
        title={studio.name}
        data={unique}
        keyExtractor={(e) => String(e.node.id)}
        renderItem={(e, width) => <MediaPoster media={e.node} width={width} subtitle={mediaSubtitle(e.node)} />}
        header={header}
        loading={query.isPending}
        loadingMore={query.isFetchingNextPage}
        onEndReached={() => {
          if (query.hasNextPage && !complete && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onRefresh={() => Promise.all([info.refetch(), query.refetch()])}
        emptyText="No works"
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 16, paddingBottom: 4, paddingTop: 12 },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
