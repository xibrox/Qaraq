import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { Icon, icons } from '@/components/icon';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme';

export type PersonHeroProps = {
  imageUrl?: string | null;
  name: string;
  /** Gray line under the name (native name). */
  subtitle?: string | null;
  /** Extra small line (occupations, "Animation Studio"). */
  caption?: string | null;
  favourites?: number | null;
  isFavourite?: boolean;
  /** Tapping the favourites pill toggles the favourite (also available in the nav bar). */
  onToggleFavourite?: () => void;
  favouriteDisabled?: boolean;
  /** Content under the pill (e.g. alternative names). */
  children?: ReactNode;
};

/**
 * Character / Staff / Studio hero: portrait on the left (omitted for studios), name, native
 * name and a favourites pill with the heart toggle (red when favourited).
 */
export function PersonHero({
  imageUrl,
  name,
  subtitle,
  caption,
  favourites,
  isFavourite,
  onToggleFavourite,
  favouriteDisabled,
  children,
}: PersonHeroProps) {
  const theme = useTheme();
  const c = theme.colors;
  const hasImage = imageUrl !== undefined;
  return (
    <View style={[styles.row, !hasImage && styles.centered]}>
      {hasImage ? (
        <View style={[styles.imageShadow, { shadowColor: c.accentBase }]}>
          <CoverImage uri={imageUrl} width={118} radius={theme.radii.md} priority="high" accessibilityLabel={name} />
        </View>
      ) : null}
      <View style={[styles.texts, !hasImage && styles.textsCentered]}>
        <AppText variant="title2" selectable align={hasImage ? undefined : 'center'}>
          {name}
        </AppText>
        {subtitle ? (
          <AppText variant="callout" tone="secondary" selectable align={hasImage ? undefined : 'center'}>
            {subtitle}
          </AppText>
        ) : null}
        {caption ? (
          <AppText variant="footnote" tone="tertiary" align={hasImage ? undefined : 'center'}>
            {caption}
          </AppText>
        ) : null}
        <Pressable
          onPress={onToggleFavourite}
          disabled={!onToggleFavourite || favouriteDisabled}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavourite, disabled: favouriteDisabled }}
          accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
          style={({ pressed }) => [
            styles.pill,
            { borderColor: c.chipBorder, backgroundColor: c.chipFill, opacity: pressed ? 0.6 : 1 },
            !hasImage && styles.pillCentered,
          ]}>
          <Icon
            name={isFavourite ? icons.heartFill : icons.heart}
            size={14}
            color={isFavourite ? c.favourite : c.textSecondary}
          />
          <AppText variant="footnote" weight="800">
            {formatNumber(favourites ?? 0)}
          </AppText>
        </Pressable>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  centered: { justifyContent: 'center' },
  imageShadow: { shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  texts: { flex: 1, gap: 4, paddingTop: 2 },
  textsCentered: { alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  pillCentered: { alignSelf: 'center' },
});
