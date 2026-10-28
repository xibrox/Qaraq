import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { flattenPages, useStaff, useStaffCharacterMedia, useStaffStaffMedia } from '@/api/queries/hooks';
import { useFavouriteToggle } from '@/api/queries/people';
import type { CharacterLite, MediaCard, StaffDetail, StaffMediaEdge } from '@/api/types';
import { AppText } from '@/components/app-text';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { SegmentedSwitch } from '@/components/segmented-switch';
import { formatFuzzyDate } from '@/lib/format';
import { pickName } from '@/lib/title';

import { AlternativeNames } from './alternative-names';
import { connectionComplete } from './connection';
import { DetailGridList } from './detail-grid-list';
import { DetailToolbar } from './detail-toolbar';
import { InfoCard } from './info-card';
import { MediaPoster, VoiceRoleCard } from './media-cards';
import { OptionMenuPill } from './option-menu-pill';
import {
  CHARACTER_ROLE_LABELS,
  MEDIA_TYPE_FILTER_OPTIONS,
  PEOPLE_MEDIA_SORT,
  PEOPLE_MEDIA_SORT_OPTIONS,
  type MediaTypeFilter,
  type PeopleMediaSort,
} from './options';
import { PersonHero } from './person-hero';
import { RichDescription } from './rich-description';

type StaffTab = 'characters' | 'staff';

type VoiceRoleItem = { kind: 'voice'; key: string; character: CharacterLite; media: MediaCard; role?: string };
type StaffRoleItem = { kind: 'staff'; key: string; media: MediaCard; roles: string[] };
type GridItem = VoiceRoleItem | StaffRoleItem;

/** One media can carry several production roles ("Director", "Storyboard (eps 1-3)"); group them. */
export function groupStaffRoles(edges: readonly StaffMediaEdge[]): StaffRoleItem[] {
  const byMedia = new Map<number, StaffRoleItem>();
  for (const edge of edges) {
    if (!edge.node) continue;
    const existing = byMedia.get(edge.node.id);
    const role = edge.staffRole?.trim();
    if (existing) {
      if (role && !existing.roles.includes(role)) existing.roles.push(role);
    } else {
      byMedia.set(edge.node.id, { kind: 'staff', key: `m${edge.node.id}`, media: edge.node, roles: role ? [role] : [] });
    }
  }
  return [...byMedia.values()];
}

function yearsActive(staff: StaffDetail): string | undefined {
  const [start, end] = (staff.yearsActive ?? []).filter((y): y is number => y != null);
  if (!start) return undefined;
  return end ? `${start} - ${end}` : `${start} - Present`;
}

/** Staff page: portrait, info, description, voiced characters and production roles. */
export function StaffDetailScreen({ id }: { id: number }) {
  const [tab, setTab] = useState<StaffTab | null>(null);
  const [sort, setSort] = useState<PeopleMediaSort>('newest');
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all');
  const { toggle } = useFavouriteToggle();
  const enabled = Number.isFinite(id);

  const info = useStaff({ id, perPage: 1 }, { enabled });
  const voiced = useStaffCharacterMedia({ id, perPage: 30, sort: PEOPLE_MEDIA_SORT[sort] }, { enabled });
  const roles = useStaffStaffMedia(
    { id, perPage: 30, sort: PEOPLE_MEDIA_SORT[sort], ...(typeFilter === 'all' ? null : { type: typeFilter }) },
    { enabled },
  );

  const staff = info.data?.Staff;
  if (!staff) {
    if (info.error) return <ErrorState error={info.error} onRetry={() => info.refetch()} />;
    return <LoadingState />;
  }

  const name = pickName(staff.name);
  const voicedTotal = staff.characterMedia?.pageInfo?.total ?? 0;
  const rolesTotal = staff.staffMedia?.pageInfo?.total ?? 0;
  const activeTab: StaffTab = tab ?? (voicedTotal > 0 ? 'characters' : 'staff');
  const showSwitch = voicedTotal > 0 && rolesTotal > 0;
  const active = activeTab === 'characters' ? voiced : roles;
  const complete =
    activeTab === 'characters'
      ? connectionComplete(voiced.data, (p) => p.Staff?.characterMedia?.pageInfo, (p) => p.Staff?.characterMedia?.edges?.length ?? 0)
      : connectionComplete(roles.data, (p) => p.Staff?.staffMedia?.pageInfo, (p) => p.Staff?.staffMedia?.edges?.length ?? 0);

  const items: GridItem[] =
    activeTab === 'characters'
      ? flattenPages(voiced.data, (p) => p.Staff?.characterMedia?.edges).flatMap((edge) =>
          edge.node
            ? (edge.characters ?? [])
                .filter((ch): ch is CharacterLite => !!ch)
                .map(
                  (character): VoiceRoleItem => ({
                    kind: 'voice',
                    key: `${character.id}-${edge.node!.id}`,
                    character,
                    media: edge.node!,
                    role: edge.characterRole ? CHARACTER_ROLE_LABELS[edge.characterRole] : undefined,
                  }),
                )
            : [],
        )
      : groupStaffRoles(flattenPages(roles.data, (p) => p.Staff?.staffMedia?.edges));

  const toggleFavourite = () => toggle({ kind: 'staff', id: staff.id }, staff.isFavourite);
  const occupations = (staff.primaryOccupations ?? []).filter(Boolean).join(', ');

  const header = (
    <View style={styles.header}>
      <PersonHero
        imageUrl={staff.image?.large ?? staff.image?.medium ?? null}
        name={name}
        subtitle={staff.name?.native}
        caption={occupations || undefined}
        favourites={staff.favourites}
        isFavourite={staff.isFavourite}
        favouriteDisabled={staff.isFavouriteBlocked}
        onToggleFavourite={toggleFavourite}>
        <AlternativeNames names={staff.name?.alternative} />
      </PersonHero>
      <InfoCard
        rows={[
          { label: 'Birth', value: formatFuzzyDate(staff.dateOfBirth, 'medium') },
          { label: 'Death', value: formatFuzzyDate(staff.dateOfDeath, 'medium') },
          { label: 'Age', value: staff.age ? String(staff.age) : undefined },
          { label: 'Gender', value: staff.gender },
          { label: 'Years Active', value: yearsActive(staff) },
          { label: 'Hometown', value: staff.homeTown },
          { label: 'Blood Type', value: staff.bloodType },
          { label: 'Language', value: staff.languageV2 },
        ]}
      />
      <RichDescription html={staff.description} />
      {showSwitch ? (
        <SegmentedSwitch
          size="md"
          segments={[
            { value: 'characters', label: 'Characters' },
            { value: 'staff', label: 'Staff Roles' },
          ]}
          value={activeTab}
          onChange={setTab}
          style={styles.switch}
        />
      ) : (
        <AppText variant="sectionHeader" tone="muted" accessibilityRole="header">
          {activeTab === 'characters' ? 'Characters' : 'Staff Roles'}
        </AppText>
      )}
      <View style={styles.toolbar}>
        <OptionMenuPill title="Sort By" options={PEOPLE_MEDIA_SORT_OPTIONS} value={sort} onChange={setSort} />
        {activeTab === 'staff' ? (
          <OptionMenuPill
            title="Media"
            icon={icons.list}
            options={MEDIA_TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <>
      <DetailToolbar
        isFavourite={staff.isFavourite}
        onToggleFavourite={toggleFavourite}
        favouriteDisabled={staff.isFavouriteBlocked}
        siteUrl={staff.siteUrl}
        shareTitle={name}
      />
      <DetailGridList
        title={name}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={(item, width) =>
          item.kind === 'voice' ? (
            <VoiceRoleCard character={item.character} media={item.media} width={width} roleLabel={item.role} />
          ) : (
            <MediaPoster media={item.media} width={width} subtitle={item.roles.join(' · ')} />
          )
        }
        header={header}
        loading={active.isPending}
        loadingMore={active.isFetchingNextPage}
        onEndReached={() => {
          if (active.hasNextPage && !complete && !active.isFetchingNextPage) active.fetchNextPage();
        }}
        onRefresh={() => Promise.all([info.refetch(), active.refetch()])}
        emptyText={activeTab === 'characters' ? 'No characters' : 'No staff roles'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 16, paddingBottom: 4 },
  switch: { alignSelf: 'flex-start', marginTop: 4 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
