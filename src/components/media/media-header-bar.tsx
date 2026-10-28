import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass-surface';
import { Icon, icons } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { NativeMenu, type MenuEntry } from '@/components/menu/native-menu';
import { useToastVisible } from '@/components/toast';
import { useTheme } from '@/theme';

type Props = {
  title: string;
  scrollY: SharedValue<number>;
  /** Scroll offset where the bar becomes opaque (bottom of the hero). */
  collapseAt: number;
  isFavourite?: boolean;
  onBack: () => void;
  onToggleFavourite?: () => void;
  menuItems?: MenuEntry[];
};

export const MEDIA_BAR_HEIGHT = 52;
/** Scroll range, relative to `collapseAt`, over which the bar fades in. */
export const MEDIA_BAR_FADE = [-80, -20] as const;

/**
 * Media detail top bar: floating translucent circles (← / ♥ / ⋮) over the banner that collapse into
 * an opaque bar with the truncated title once the hero scrolls away (spec §1, §4).
 */
export function MediaHeaderBar({ title, scrollY, collapseAt, isFavourite, onBack, onToggleFavourite, menuItems }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  // The toast draws under the status bar, right where the collapsed title sits: hide the title meanwhile.
  const toastVisible = useToastVisible();

  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [collapseAt + MEDIA_BAR_FADE[0], collapseAt + MEDIA_BAR_FADE[1]], [0, 1], 'clamp'),
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }, fade]} pointerEvents="none" />
      <View style={styles.row} pointerEvents="box-none">
        <IconButton icon={icons.back} variant="glass" size={40} iconSize={18} accessibilityLabel="Back" onPress={onBack} />
        <Animated.Text
          numberOfLines={1}
          accessibilityRole="header"
          style={[
            styles.title,
            { color: c.text, fontFamily: theme.fontFamily, fontSize: theme.typography.navTitle.fontSize, fontWeight: '700' },
            fade,
          ]}>
          {toastVisible ? '' : title}
        </Animated.Text>
        {onToggleFavourite ? (
          <IconButton
            icon={isFavourite ? icons.heartFill : icons.heart}
            color={isFavourite ? c.favourite : c.text}
            variant="glass"
            size={40}
            iconSize={18}
            accessibilityLabel={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
            onPress={onToggleFavourite}
          />
        ) : null}
        {menuItems ? (
          <NativeMenu items={menuItems}>
            <GlassSurface mode="always" interactive radius={20} fallbackColor="rgba(40, 40, 40, 0.6)" style={styles.menuButton}>
              <Icon name={icons.moreVertical} size={18} color={c.text} accessibilityLabel="More options" />
            </GlassSurface>
          </NativeMenu>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  row: { height: MEDIA_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  title: { flex: 1, paddingHorizontal: 4 },
  menuButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
