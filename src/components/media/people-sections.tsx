import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaCharacterEdge, MediaStaffEdge } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { CoverImage } from '@/components/cover-image';
import { MediaCarousel } from '@/components/media-carousel';
import { SectionHeader } from '@/components/section-header';
import { pickName } from '@/lib/title';
import { useTheme } from '@/theme';

const CHARACTER_WIDTH = 84;
const STAFF_WIDTH = 168;

type CharacterProps = {
  edges: (MediaCharacterEdge | null)[] | null | undefined;
  onSeeAll?: () => void;
  onCharacter: (id: number) => void;
  onStaff: (id: number) => void;
};

/** "Characters ›": portrait cards with names; the voice actor's avatar sits on the corner. */
export function CharactersSection({ edges, onSeeAll, onCharacter, onStaff }: CharacterProps) {
  const theme = useTheme();
  const c = theme.colors;
  const items = (edges ?? []).filter((e): e is MediaCharacterEdge & { node: NonNullable<MediaCharacterEdge['node']> } => !!e?.node);
  if (!items.length) return null;
  return (
    <View>
      <SectionHeader title="Characters" tone="muted" inset={12} onPress={onSeeAll} style={styles.header} />
      <MediaCarousel
        data={items}
        keyExtractor={(e, i) => `${e.id ?? i}-${e.node.id}`}
        itemWidth={CHARACTER_WIDTH}
        gap={8}
        inset={12}
        renderItem={({ item }) => {
          const va = item.voiceActorRoles?.find((r) => r?.voiceActor)?.voiceActor ?? null;
          const name = pickName(item.node.name);
          return (
            <View style={{ width: CHARACTER_WIDTH }}>
              <Pressable onPress={() => onCharacter(item.node.id)} accessibilityRole="button" accessibilityLabel={name}>
                <CoverImage uri={item.node.image?.large} width={CHARACTER_WIDTH} radius={theme.radii.md} recyclingKey={`ch${item.node.id}`} />
              </Pressable>
              {va ? (
                <Pressable
                  onPress={() => onStaff(va.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Voiced by ${pickName(va.name)}`}
                  hitSlop={4}
                  style={styles.vaBadge}>
                  <Avatar uri={va.image?.medium} name={pickName(va.name)} size={28} ringColor={c.background} ringWidth={2} />
                </Pressable>
              ) : null}
              <AppText variant="caption1" weight="700" numberOfLines={2} style={styles.name}>
                {name}
              </AppText>
              {va ? (
                <AppText variant="caption2" tone="secondary" numberOfLines={1} onPress={() => onStaff(va.id)} suppressHighlighting>
                  {pickName(va.name)}
                </AppText>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

type StaffProps = {
  edges: (MediaStaffEdge | null)[] | null | undefined;
  onSeeAll?: () => void;
  onStaff: (id: number) => void;
};

/** "Staff ›": square photo, name and gray role ("Original Creator"). */
export function StaffSection({ edges, onSeeAll, onStaff }: StaffProps) {
  const theme = useTheme();
  const items = (edges ?? []).filter((e): e is MediaStaffEdge & { node: NonNullable<MediaStaffEdge['node']> } => !!e?.node);
  if (!items.length) return null;
  return (
    <View>
      <SectionHeader title="Staff" tone="muted" inset={12} onPress={onSeeAll} style={styles.header} />
      <MediaCarousel
        data={items}
        keyExtractor={(e, i) => `${e.id ?? i}-${e.node.id}`}
        itemWidth={STAFF_WIDTH}
        gap={8}
        inset={12}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onStaff(item.node.id)}
            accessibilityRole="button"
            accessibilityLabel={`${pickName(item.node.name)}, ${item.role ?? ''}`}
            style={({ pressed }) => [styles.staff, { width: STAFF_WIDTH, opacity: pressed ? 0.7 : 1 }]}>
            <CoverImage uri={item.node.image?.large} width={58} height={70} radius={theme.radii.xs} recyclingKey={`st${item.node.id}`} />
            <View style={styles.staffTexts}>
              <AppText variant="footnote" weight="700" numberOfLines={2}>
                {pickName(item.node.name)}
              </AppText>
              <AppText variant="caption2" tone="secondary" numberOfLines={2}>
                {item.role ?? ''}
              </AppText>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  vaBadge: { position: 'absolute', right: -2, top: CHARACTER_WIDTH * 1.5 - 26 },
  name: { marginTop: 6 },
  staff: { flexDirection: 'row', gap: 8 },
  staffTexts: { flex: 1, gap: 4, paddingTop: 2 },
});
