import { ScrollView, StyleSheet } from 'react-native';

import { useGenreCollection, useMediaTagCollection } from '@/api/queries/hooks';
import type { MediaTag } from '@/api/types';
import { Chip } from '@/components/chip';
import { NativeMenu, type MenuAction, type MenuEntry } from '@/components/menu/native-menu';
import { haptics } from '@/lib/haptics';

import {
  COUNTRY_LABELS,
  countRanges,
  formatOptions,
  seasonOptions,
  sourceOptions,
  statusOptions,
  yearOptions,
  yearRanges,
  type SearchFilters,
} from './search-filters';

type Props = {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  signedIn: boolean;
  showAdult: boolean;
};

type ChipSpec = { key: string; name: string; value: string | null; title: string; items: MenuEntry[] };

function anyItem(active: boolean, clear: () => void): MenuAction {
  return { key: '__any', title: 'Any', checked: !active, onPress: clear };
}

/** Single-choice menu items with an "Any" entry that clears the filter. */
function single<T extends string | number>(
  options: readonly { value: T; label: string }[],
  selected: T | null,
  set: (v: T | null) => void,
): MenuEntry[] {
  return [
    anyItem(selected != null, () => set(null)),
    ...options.map((o) => ({
      key: String(o.value),
      title: o.label,
      checked: o.value === selected,
      onPress: () => set(o.value === selected ? null : o.value),
    })),
  ];
}

function multiLabel(values: string[]): string | null {
  if (!values.length) return null;
  return values.length === 1 ? values[0] : `${values[0]} +${values.length - 1}`;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function tagMenu(tags: MediaTag[], selected: string[], set: (v: string[]) => void, showAdult: boolean): MenuEntry[] {
  const byCategory = new Map<string, MediaTag[]>();
  for (const t of tags) {
    if (t.isAdult && !showAdult) continue;
    const cat = t.category ?? 'Other';
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), t]);
  }
  const groups = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  return [
    anyItem(selected.length > 0, () => set([])),
    ...groups.map(([cat, list]): MenuEntry => ({
      kind: 'submenu',
      key: cat,
      title: cat,
      items: list
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ key: t.name, title: t.name, checked: selected.includes(t.name), onPress: () => set(toggle(selected, t.name)) })),
    })),
  ];
}

/** Horizontal filter chips under the search toolbar (each opens a native pull-down menu). */
export function FilterChipRow({ filters: f, onChange, signedIn, showAdult }: Props) {
  const genres = useGenreCollection();
  const tags = useMediaTagCollection();
  const manga = f.type === 'MANGA';
  const set = (patch: Partial<SearchFilters>) => {
    haptics.selection();
    onChange({ ...f, ...patch });
  };

  const countRange = countRanges(f.type).find((r) => r.key === f.countRange);
  const yearRange = yearRanges().find((r) => r.key === f.yearRange);

  const chips: (ChipSpec | null)[] = [
    {
      key: 'genre',
      name: 'Genre',
      title: 'Genres',
      value: multiLabel(f.genres),
      items: [
        anyItem(f.genres.length > 0, () => set({ genres: [] })),
        ...(genres.data ?? [])
          .filter((g) => showAdult || g !== 'Hentai')
          .map((g) => ({ key: g, title: g, checked: f.genres.includes(g), onPress: () => set({ genres: toggle(f.genres, g) }) })),
      ],
    },
    {
      key: 'year',
      name: 'Year',
      title: 'Year',
      value: f.year != null ? String(f.year) : null,
      items: single(
        yearOptions().map((y) => ({ value: y, label: String(y) })),
        f.year,
        (y) => set({ year: y, yearRange: null }),
      ),
    },
    manga
      ? null
      : {
          key: 'season',
          name: 'Season',
          title: 'Season',
          value: seasonOptions.find((s) => s.value === f.season)?.label ?? null,
          items: single(seasonOptions, f.season, (s) => set({ season: s })),
        },
    {
      key: 'format',
      name: 'Format',
      title: 'Format',
      value: formatOptions(f.type).find((o) => o.value === f.format)?.label ?? null,
      items: single(formatOptions(f.type), f.format, (v) => set({ format: v })),
    },
    {
      key: 'status',
      name: manga ? 'Publishing Status' : 'Airing Status',
      title: manga ? 'Publishing Status' : 'Airing Status',
      value: statusOptions(f.type).find((o) => o.value === f.status)?.label ?? null,
      items: single(statusOptions(f.type), f.status, (v) => set({ status: v })),
    },
    {
      key: 'country',
      name: 'Country of Origin',
      title: 'Country of Origin',
      value: f.country ? (COUNTRY_LABELS[f.country] ?? f.country) : null,
      items: single(
        Object.entries(COUNTRY_LABELS).map(([value, label]) => ({ value, label })),
        f.country,
        (v) => set({ country: v }),
      ),
    },
    {
      key: 'source',
      name: 'Source',
      title: 'Source Material',
      value: sourceOptions.find((o) => o.value === f.source)?.label ?? null,
      items: single(sourceOptions, f.source, (v) => set({ source: v })),
    },
    {
      key: 'tags',
      name: 'Tags',
      title: 'Tags',
      value: multiLabel(f.tags),
      items: tagMenu(tags.data ?? [], f.tags, (v) => set({ tags: v }), showAdult),
    },
    {
      key: 'count',
      name: manga ? 'Chapters' : 'Episodes',
      title: manga ? 'Chapters' : 'Episodes',
      value: countRange ? `${countRange.label} ${manga ? 'Ch.' : 'Eps'}` : null,
      items: single(
        countRanges(f.type).map((r) => ({ value: r.key, label: r.label })),
        f.countRange,
        (v) => set({ countRange: v }),
      ),
    },
    {
      key: 'yearRange',
      name: 'Year Range',
      title: 'Year Range',
      value: yearRange?.label ?? null,
      items: single(
        yearRanges().map((r) => ({ value: r.key, label: r.label })),
        f.yearRange,
        (v) => set({ yearRange: v, year: null }),
      ),
    },
    signedIn
      ? {
          key: 'onList',
          name: 'On My List',
          title: 'My List',
          value: f.onList == null ? null : f.onList ? 'On My List' : 'Not On My List',
          items: single(
            [
              { value: 'yes', label: 'On My List' },
              { value: 'no', label: 'Not On My List' },
            ],
            f.onList == null ? null : f.onList ? 'yes' : 'no',
            (v) => set({ onList: v == null ? null : v === 'yes' }),
          ),
        }
      : null,
    showAdult
      ? {
          key: 'adult',
          name: '18+',
          title: '18+ Content',
          value: f.adult == null ? null : f.adult ? '18+ Only' : 'Hide 18+',
          items: single(
            [
              { value: 'only', label: '18+ Only' },
              { value: 'hide', label: 'Hide 18+' },
            ],
            f.adult == null ? null : f.adult ? 'only' : 'hide',
            (v) => set({ adult: v == null ? null : v === 'only' }),
          ),
        }
      : null,
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      {chips.map((c) =>
        c ? (
          <NativeMenu key={c.key} title={c.title} items={c.items} accessibilityLabel={c.value ? `${c.name}, ${c.value}` : `${c.name} filter`}>
            <Chip label={c.value ?? c.name} selected={c.value != null} variant="outlined" accessibilityLabel={c.value ? `${c.name}, ${c.value}` : `${c.name} filter`} />
          </NativeMenu>
        ) : null,
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, gap: 8 },
});
