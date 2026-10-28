import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaType, ScoreFormat, StaffLite, StudioLite, UserStatisticsDetail } from '@/api/types';
import { AppText } from '@/components/app-text';
import { icons } from '@/components/icon';
import { OptionMenuPill, type MenuOption } from '@/components/people/option-menu-pill';
import { formatEnum } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { pickName } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { listStatusLabel } from '@/settings';
import { STATUS_COLORS, useTheme } from '@/theme';

import { BarChart, type Bar } from './bar-chart';
import { Distribution, type DistributionItem } from './distribution';
import { DonutChart } from './donut-chart';
import { chartColor } from './palette';
import { PeopleCarousel, type PersonStat } from './people-carousel';
import { RankedList } from './ranked-list';
import { StatCard } from './stat-card';
import {
  countryName,
  describeEntry,
  formatMetric,
  lengthOrder,
  metricLabel,
  metricValue,
  scoreBucketLabel,
  scoresAreHundredScale,
  sortByMetric,
  type StatEntry,
  type StatMetric,
} from './stats-data';
import { SummaryCard } from './summary-card';

const ALL_METRICS: readonly StatMetric[] = ['count', 'meanScore', 'time'];
const ADDITIVE_METRICS: readonly StatMetric[] = ['count', 'time'];

function present<T>(list: readonly (T | null)[] | null | undefined): T[] {
  return (list ?? []).filter((x): x is T => x != null);
}

/** A stat card whose content follows a per-card Count / Mean Score / Time menu. */
function MetricCard({
  title,
  type,
  metrics = ALL_METRICS,
  children,
}: {
  title: string;
  type: MediaType;
  metrics?: readonly StatMetric[];
  children: (metric: StatMetric) => ReactNode;
}) {
  const [metric, setMetric] = useState<StatMetric>('count');
  const options: MenuOption<StatMetric>[] = metrics.map((m) => ({ value: m, label: metricLabel(m, type) }));
  return (
    <StatCard
      title={title}
      trailing={<OptionMenuPill title="Show" icon={icons.sortDescending} options={options} value={metric} onChange={setMetric} />}>
      {children(metric)}
    </StatCard>
  );
}

function TopGenres({ stats }: { stats: UserStatisticsDetail }) {
  const top = present(stats.genres)
    .filter((g) => g.genre)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  if (top.length === 0) return null;
  return (
    <StatCard title="Top Genres" centeredTitle>
      <DonutChart slices={top.map((g, i) => ({ key: g.genre!, label: g.genre!, value: g.count, color: chartColor(i) }))} />
    </StatCard>
  );
}

function bars<T extends StatEntry>(
  entries: T[],
  labelOf: (e: T) => string,
  metric: StatMetric,
  type: MediaType,
  format: ScoreFormat | null | undefined,
  keyOf: (e: T) => string = labelOf,
): Bar[] {
  return entries.map((e) => {
    const label = labelOf(e);
    return {
      key: keyOf(e),
      label,
      value: metricValue(e, metric, type),
      detail: `${label} · ${describeEntry(e, type, format)}`,
    };
  });
}

function distribution<T extends StatEntry>(
  entries: T[],
  labelOf: (e: T) => string,
  colorOf: (e: T, index: number) => string,
  metric: StatMetric,
  type: MediaType,
  format: ScoreFormat | null | undefined,
): DistributionItem[] {
  return sortByMetric(entries, metric, type).map((e, i) => ({
    key: labelOf(e),
    label: labelOf(e),
    value: metricValue(e, metric, type),
    color: colorOf(e, i),
    detail: describeEntry(e, type, format),
  }));
}

function personStats<T extends StatEntry>(
  entries: T[],
  personOf: (e: T) => { id: number; name: string; imageUrl?: string | null; studio?: boolean } | null,
  metric: StatMetric,
  type: MediaType,
  format: ScoreFormat | null | undefined,
): PersonStat[] {
  return sortByMetric(entries, metric, type)
    .slice(0, 20)
    .flatMap((e) => {
      const p = personOf(e);
      if (!p) return [];
      return [
        {
          key: String(p.id),
          name: p.name,
          imageUrl: p.studio ? undefined : (p.imageUrl ?? null),
          value: formatMetric(metricValue(e, metric, type), metric, type, format),
          detail: metric === 'count' ? undefined : `${e.count} ${e.count === 1 ? 'title' : 'titles'}`,
          href: p.studio ? hrefs.studio(p.id) : hrefs.staff(p.id),
        },
      ];
    });
}

type TagStat = NonNullable<NonNullable<UserStatisticsDetail['tags']>[number]>;

/**
 * Tags ranking. AniList general-spoiler tags ("Time Skip", "Tragedy") stay hidden behind
 * "Show Spoilers", the same as on the media page.
 */
function TagsCard({ tags, type, scoreFormat }: { tags: TagStat[]; type: MediaType; scoreFormat: ScoreFormat | null | undefined }) {
  const theme = useTheme();
  const [showSpoilers, setShowSpoilers] = useState(false);
  const spoilerCount = tags.filter((t) => t.tag?.isGeneralSpoiler).length;
  const visible = showSpoilers ? tags : tags.filter((t) => !t.tag?.isGeneralSpoiler);
  return (
    <MetricCard title="Tags" type={type}>
      {(m) => (
        <>
          <RankedList
            items={sortByMetric(visible, m, type).map((t) => ({
              key: String(t.tag!.id),
              label: t.tag!.name,
              labelColor: t.tag!.isGeneralSpoiler ? theme.colors.danger : undefined,
              value: metricValue(t, m, type),
              detail: describeEntry(t, type, scoreFormat),
            }))}
            formatValue={(v) => formatMetric(v, m, type, scoreFormat)}
          />
          {spoilerCount > 0 ? (
            <Pressable
              onPress={() => {
                haptics.selection();
                setShowSpoilers((v) => !v);
              }}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.spoilerToggle}>
              <AppText variant="subheadline" weight="700" tone="secondary">
                {showSpoilers ? 'Hide Spoilers' : `Show Spoilers (${spoilerCount})`}
              </AppText>
            </Pressable>
          ) : null}
        </>
      )}
    </MetricCard>
  );
}

const staffPerson = (s: StaffLite | null) =>
  s ? { id: s.id, name: pickName(s.name), imageUrl: s.image?.large ?? s.image?.medium } : null;
const studioPerson = (s: StudioLite | null) => (s ? { id: s.id, name: s.name, studio: true } : null);

export type StatsBodyProps = {
  stats: UserStatisticsDetail;
  type: MediaType;
  scoreFormat: ScoreFormat | null | undefined;
};

/** Everything under the Summary switch: summary, top genres and every AniList breakdown. */
export function StatsBody({ stats, type, scoreFormat }: StatsBodyProps) {
  const fmt = (metric: StatMetric) => (v: number) => formatMetric(v, metric, type, scoreFormat);
  const scores = present(stats.scores).filter((s) => s.score != null).sort((a, b) => a.score! - b.score!);
  const hundredScale = scoresAreHundredScale(
    scores.map((s) => s.score),
    scoreFormat,
  );
  const lengths = present(stats.lengths).sort((a, b) => lengthOrder(a.length) - lengthOrder(b.length));
  const releaseYears = present(stats.releaseYears).filter((y) => y.releaseYear).sort((a, b) => a.releaseYear! - b.releaseYear!);
  const startYears = present(stats.startYears).filter((y) => y.startYear).sort((a, b) => a.startYear! - b.startYear!);
  const formats = present(stats.formats);
  const statuses = present(stats.statuses);
  const countries = present(stats.countries);
  const genres = present(stats.genres).filter((g) => g.genre);
  const tags = present(stats.tags).filter((t) => t.tag);
  const voiceActors = present(stats.voiceActors).filter((v) => v.voiceActor);
  const staff = present(stats.staff).filter((s) => s.staff);
  const studios = present(stats.studios).filter((s) => s.studio);
  const anime = type === 'ANIME';

  return (
    <View style={styles.container}>
      <SummaryCard stats={stats} type={type} scoreFormat={scoreFormat} />
      <TopGenres stats={stats} />

      {scores.length > 0 ? (
        <MetricCard title="Score" type={type} metrics={ADDITIVE_METRICS}>
          {(m) => <BarChart bars={bars(
                scores,
                (s) => scoreBucketLabel(s.score, scoreFormat, hundredScale),
                m,
                type,
                scoreFormat,
                (s) => String(s.score),
              )} formatValue={fmt(m)} />}
        </MetricCard>
      ) : null}

      {lengths.length > 0 ? (
        <MetricCard title={anime ? 'Episode Count' : 'Chapter Count'} type={type}>
          {(m) => <BarChart bars={bars(lengths, (l) => l.length ?? 'Unknown', m, type, scoreFormat)} formatValue={fmt(m)} />}
        </MetricCard>
      ) : null}

      {formats.length > 0 ? (
        <MetricCard title="Format Distribution" type={type}>
          {(m) => (
            <Distribution
              items={distribution(formats, (f) => formatEnum(f.format) || 'Unknown', (_f, i) => chartColor(i), m, type, scoreFormat)}
              formatValue={fmt(m)}
              additive={m !== 'meanScore'}
            />
          )}
        </MetricCard>
      ) : null}

      {statuses.length > 0 ? (
        <MetricCard title="Status Distribution" type={type}>
          {(m) => (
            <Distribution
              items={distribution(
                statuses,
                (s) => (s.status ? listStatusLabel(s.status, type) : 'Unknown'),
                (s, i) => (s.status ? STATUS_COLORS[s.status] : chartColor(i)),
                m,
                type,
                scoreFormat,
              )}
              formatValue={fmt(m)}
              additive={m !== 'meanScore'}
            />
          )}
        </MetricCard>
      ) : null}

      {countries.length > 0 ? (
        <MetricCard title="Country Distribution" type={type}>
          {(m) => (
            <Distribution
              items={distribution(countries, (c) => countryName(c.country), (_c, i) => chartColor(i), m, type, scoreFormat)}
              formatValue={fmt(m)}
              additive={m !== 'meanScore'}
            />
          )}
        </MetricCard>
      ) : null}

      {releaseYears.length > 0 ? (
        <MetricCard title="Release Year" type={type}>
          {(m) => <BarChart bars={bars(releaseYears, (y) => String(y.releaseYear), m, type, scoreFormat)} formatValue={fmt(m)} />}
        </MetricCard>
      ) : null}

      {startYears.length > 0 ? (
        <MetricCard title={anime ? 'Watch Year' : 'Read Year'} type={type}>
          {(m) => <BarChart bars={bars(startYears, (y) => String(y.startYear), m, type, scoreFormat)} formatValue={fmt(m)} />}
        </MetricCard>
      ) : null}

      {genres.length > 0 ? (
        <MetricCard title="Genres" type={type}>
          {(m) => (
            <RankedList
              items={sortByMetric(genres, m, type).map((g) => ({
                key: g.genre!,
                label: g.genre!,
                value: metricValue(g, m, type),
                detail: describeEntry(g, type, scoreFormat),
              }))}
              formatValue={fmt(m)}
            />
          )}
        </MetricCard>
      ) : null}

      {tags.length > 0 ? <TagsCard tags={tags} type={type} scoreFormat={scoreFormat} /> : null}

      {anime && voiceActors.length > 0 ? (
        <MetricCard title="Voice Actors" type={type}>
          {(m) => <PeopleCarousel items={personStats(voiceActors, (v) => staffPerson(v.voiceActor), m, type, scoreFormat)} />}
        </MetricCard>
      ) : null}

      {staff.length > 0 ? (
        <MetricCard title="Staff" type={type}>
          {(m) => <PeopleCarousel items={personStats(staff, (s) => staffPerson(s.staff), m, type, scoreFormat)} />}
        </MetricCard>
      ) : null}

      {anime && studios.length > 0 ? (
        <MetricCard title="Studios" type={type}>
          {(m) => <PeopleCarousel items={personStats(studios, (s) => studioPerson(s.studio), m, type, scoreFormat)} />}
        </MetricCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  spoilerToggle: { alignSelf: 'center' },
});
