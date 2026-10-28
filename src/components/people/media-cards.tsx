import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CharacterLite, MediaCard, MediaListStatus, StaffLite } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { CoverImage } from '@/components/cover-image';
import { MediaGridCard } from '@/components/media-grid-card';
import { pickName, pickTitle } from '@/lib/title';
import { hrefs } from '@/navigation/hrefs';
import { listStatusLabel, useSetting } from '@/settings';
import { STATUS_COLORS, useTheme } from '@/theme';

/** Small overlay badge with the viewer's list status ("Watching"). */
export function ListStatusBadge({ status, type }: { status: MediaListStatus | null | undefined; type: MediaCard['type'] }) {
  if (!status) return null;
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: STATUS_COLORS[status] }]} />
      <AppText variant="caption2" color="#FFFFFF" numberOfLines={1}>
        {listStatusLabel(status, type ?? 'ANIME')}
      </AppText>
    </View>
  );
}

export type MediaPosterProps = {
  media: MediaCard;
  width: number;
  /** Gray line under the title (role, year · format). */
  subtitle?: string;
};

/** Poster card for detail grids, with the viewer's list status badge. */
export function MediaPoster({ media, width, subtitle }: MediaPosterProps) {
  const preferredTitle = useSetting('preferredTitle');
  const title = pickTitle(media.title, preferredTitle);
  return (
    <MediaGridCard
      title={title}
      coverUrl={media.coverImage?.large ?? media.coverImage?.medium}
      isAdult={media.isAdult}
      width={width}
      subtitle={subtitle}
      recyclingKey={String(media.id)}
      topLeft={<ListStatusBadge status={media.mediaListEntry?.status} type={media.type} />}
      onPress={() => router.push(hrefs.media(media.id))}
    />
  );
}

export type AppearanceCardProps = {
  media: MediaCard;
  width: number;
  roleLabel?: string;
  /** Voice actors for the selected language. */
  voiceActors: StaffLite[];
};

/** Character appearance: poster + role, then the voice actor(s) in the chosen language. */
export function AppearanceCard({ media, width, roleLabel, voiceActors }: AppearanceCardProps) {
  const theme = useTheme();
  const first = voiceActors[0];
  return (
    <View style={{ width }}>
      <MediaPoster media={media} width={width} subtitle={roleLabel} />
      {first ? (
        <Pressable
          onPress={() => router.push(hrefs.staff(first.id))}
          accessibilityRole="button"
          accessibilityLabel={`Voiced by ${pickName(first.name)}`}
          style={({ pressed }) => [styles.vaRow, { opacity: pressed ? 0.6 : 1 }]}>
          <Avatar uri={first.image?.medium} name={pickName(first.name)} size={22} />
          {/* Sibling texts, not a nested span: Android's ellipsis can crash on spans past the cut. */}
          <AppText variant="caption1" tone="secondary" numberOfLines={1} style={styles.shrink}>
            {pickName(first.name)}
          </AppText>
          {voiceActors.length > 1 ? (
            <AppText variant="caption1" tone="tertiary">{`+${voiceActors.length - 1}`}</AppText>
          ) : null}
        </Pressable>
      ) : (
        <View style={[styles.vaRow, { height: 22 }]}>
          <AppText variant="caption1" color={theme.colors.textQuaternary}>
            No voice actor
          </AppText>
        </View>
      )}
    </View>
  );
}

export type VoiceRoleCardProps = {
  character: CharacterLite;
  media: MediaCard;
  width: number;
  roleLabel?: string;
};

/** Staff "Characters" grid: character portrait with the show's cover tucked in the corner. */
export function VoiceRoleCard({ character, media, width, roleLabel }: VoiceRoleCardProps) {
  const theme = useTheme();
  const preferredTitle = useSetting('preferredTitle');
  const name = pickName(character.name);
  const mediaTitle = pickTitle(media.title, preferredTitle);
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => router.push(hrefs.character(character.id))}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${mediaTitle}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        <View>
          <CoverImage uri={character.image?.large ?? character.image?.medium} width={width} radius={theme.radii.md} recyclingKey={`c${character.id}`} />
          <Pressable
            onPress={() => router.push(hrefs.media(media.id))}
            accessibilityRole="button"
            accessibilityLabel={`Open ${mediaTitle}`}
            hitSlop={4}
            style={[styles.inset, { borderColor: theme.colors.background }]}>
            <CoverImage uri={media.coverImage?.medium} width={30} radius={4} isAdult={media.isAdult} />
          </Pressable>
        </View>
        <AppText variant="footnote" weight="700" numberOfLines={2} style={styles.title}>
          {name}
        </AppText>
      </Pressable>
      <AppText variant="caption1" tone="secondary" numberOfLines={2} onPress={() => router.push(hrefs.media(media.id))}>
        {mediaTitle}
      </AppText>
      {roleLabel ? (
        <AppText variant="caption2" tone="tertiary" numberOfLines={1} style={styles.role}>
          {roleLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  vaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  shrink: { flexShrink: 1 },
  inset: { position: 'absolute', right: 4, bottom: 4, borderWidth: 1.5, borderRadius: 5 },
  title: { marginTop: 6 },
  role: { marginTop: 1 },
});
