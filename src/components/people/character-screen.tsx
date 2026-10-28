import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { flattenPages, useCharacter, useCharacterMedia } from '@/api/queries/hooks';
import { useFavouriteToggle } from '@/api/queries/people';
import type { CharacterDetail, CharacterMediaEdge, StaffLanguage, StaffLite } from '@/api/types';
import { AppText } from '@/components/app-text';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { formatFuzzyDate } from '@/lib/format';
import { pickName } from '@/lib/title';

import { AlternativeNames } from './alternative-names';
import { connectionComplete, trustedCount } from './connection';
import { DetailGridList } from './detail-grid-list';
import { DetailToolbar } from './detail-toolbar';
import { InfoCard } from './info-card';
import { AppearanceCard } from './media-cards';
import { OptionMenuPill } from './option-menu-pill';
import {
  CHARACTER_ROLE_LABELS,
  MEDIA_TYPE_FILTER_OPTIONS,
  PEOPLE_MEDIA_SORT,
  PEOPLE_MEDIA_SORT_OPTIONS,
  STAFF_LANGUAGE_OPTIONS,
  type MediaTypeFilter,
  type PeopleMediaSort,
} from './options';
import { PersonHero } from './person-hero';
import { RichDescription } from './rich-description';

function CharacterHeader({
  character,
  onToggleFavourite,
  sort,
  onSortChange,
  language,
  onLanguageChange,
  typeFilter,
  onTypeFilterChange,
  total,
}: {
  character: CharacterDetail;
  onToggleFavourite: () => void;
  sort: PeopleMediaSort;
  onSortChange: (v: PeopleMediaSort) => void;
  language: StaffLanguage;
  onLanguageChange: (v: StaffLanguage) => void;
  typeFilter: MediaTypeFilter;
  onTypeFilterChange: (v: MediaTypeFilter) => void;
  total: number | null;
}) {
  const name = pickName(character.name);
  return (
    <View style={styles.header}>
      <PersonHero
        imageUrl={character.image?.large ?? character.image?.medium ?? null}
        name={name}
        subtitle={character.name?.native}
        favourites={character.favourites}
        isFavourite={character.isFavourite}
        favouriteDisabled={character.isFavouriteBlocked}
        onToggleFavourite={onToggleFavourite}>
        <AlternativeNames names={character.name?.alternative} spoilerNames={character.name?.alternativeSpoiler} />
      </PersonHero>
      <InfoCard
        rows={[
          { label: 'Birthday', value: formatFuzzyDate(character.dateOfBirth, 'medium') },
          { label: 'Age', value: character.age },
          { label: 'Gender', value: character.gender },
          { label: 'Blood Type', value: character.bloodType },
        ]}
      />
      <RichDescription html={character.description} />
      <View style={styles.sectionTitle}>
        <AppText variant="sectionHeader" tone="muted" accessibilityRole="header">
          Appearances
        </AppText>
        {total ? (
          <AppText variant="subheadline" tone="tertiary">
            {total}
          </AppText>
        ) : null}
      </View>
      <View style={styles.toolbar}>
        <OptionMenuPill title="Sort By" options={PEOPLE_MEDIA_SORT_OPTIONS} value={sort} onChange={onSortChange} />
        <OptionMenuPill
          title="Media"
          icon={icons.list}
          options={MEDIA_TYPE_FILTER_OPTIONS}
          value={typeFilter}
          onChange={onTypeFilterChange}
        />
        <OptionMenuPill
          title="Voice Actor Language"
          icon={icons.globe}
          options={STAFF_LANGUAGE_OPTIONS}
          value={language}
          onChange={onLanguageChange}
        />
      </View>
    </View>
  );
}

function voiceActorsOf(edge: CharacterMediaEdge): StaffLite[] {
  return (edge.voiceActorRoles ?? []).map((r) => r?.voiceActor).filter((v): v is StaffLite => !!v);
}

/** Character page: portrait, names (spoiler names hidden), info, description, appearances grid. */
export function CharacterDetailScreen({ id }: { id: number }) {
  const [sort, setSort] = useState<PeopleMediaSort>('popularity');
  const [language, setLanguage] = useState<StaffLanguage>('JAPANESE');
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all');
  const { toggle } = useFavouriteToggle();

  const info = useCharacter({ id, perPage: 1 }, { enabled: Number.isFinite(id) });
  const media = useCharacterMedia(
    {
      id,
      perPage: 30,
      sort: PEOPLE_MEDIA_SORT[sort],
      language,
      ...(typeFilter === 'all' ? null : { type: typeFilter }),
    },
    { enabled: Number.isFinite(id) },
  );

  const character = info.data?.Character;
  if (!character) {
    if (info.error) return <ErrorState error={info.error} onRetry={() => info.refetch()} />;
    return <LoadingState />;
  }

  const name = pickName(character.name);
  const edges = flattenPages(media.data, (p) => p.Character?.media?.edges).filter((e) => e.node);
  const complete = connectionComplete(
    media.data,
    (p) => p.Character?.media?.pageInfo,
    (p) => p.Character?.media?.edges?.length ?? 0,
  );
  const total = trustedCount(complete, edges.length);
  const toggleFavourite = () => toggle({ kind: 'character', id: character.id }, character.isFavourite);

  return (
    <>
      <DetailToolbar
        isFavourite={character.isFavourite}
        onToggleFavourite={toggleFavourite}
        favouriteDisabled={character.isFavouriteBlocked}
        siteUrl={character.siteUrl}
        shareTitle={name}
      />
      <DetailGridList
        title={name}
        data={edges}
        keyExtractor={(e, i) => `${e.id ?? i}-${e.node!.id}`}
        renderItem={(edge, width) => (
          <AppearanceCard
            media={edge.node!}
            width={width}
            roleLabel={edge.characterRole ? CHARACTER_ROLE_LABELS[edge.characterRole] : undefined}
            voiceActors={voiceActorsOf(edge)}
          />
        )}
        header={
          <CharacterHeader
            character={character}
            onToggleFavourite={toggleFavourite}
            sort={sort}
            onSortChange={setSort}
            language={language}
            onLanguageChange={setLanguage}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            total={total}
          />
        }
        loading={media.isPending}
        loadingMore={media.isFetchingNextPage}
        onEndReached={() => {
          if (media.hasNextPage && !complete && !media.isFetchingNextPage) media.fetchNextPage();
        }}
        onRefresh={() => Promise.all([info.refetch(), media.refetch()])}
        emptyText="No appearances"
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 16, paddingBottom: 4 },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
