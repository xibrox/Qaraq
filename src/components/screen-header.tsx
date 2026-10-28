import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useTheme, withAlpha } from '@/theme';

import { AppText } from './app-text';

const TITLE_ROW_HEIGHT = 44;

export type ScreenHeaderProps = {
  /** Centered nav title ("Anime List", "Explore Manga"). */
  title?: string;
  /** Node left of the title (e.g. back button). */
  left?: ReactNode;
  /** Node right of the title (e.g. envelope button). */
  right?: ReactNode;
  /** Rows under the title: HeaderToolbar, StatusChipRow, info row, ProgressLine... */
  children?: ReactNode;
  /**
   * Float over content (absolute, content scrolls under the soft edge). Pair with
   * `useFloatingHeader()` to pad the scroll content. Default false (in-flow).
   */
  floating?: boolean;
  /** Reports the measured height (including the safe-area inset). */
  onHeightChange?: (height: number) => void;
  /** Include the top safe-area inset (default true; false inside sheets). */
  safeAreaTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Custom tab-root header used by screens whose AniClient header is more than a nav bar
 * (My List, Explore): centered title + toolbar rows. Hide the native header for those screens
 * (`<Stack.Screen options={{ headerShown: false }} />`). The header itself is never glass, only
 * its controls (search field, switch, buttons) are. With Toolbar Style Solid it sits on the solid
 * background (the AniClient look); otherwise content fades out softly under it, like the iOS 26
 * soft scroll edge.
 */
export function ScreenHeader({
  title,
  left,
  right,
  children,
  floating = false,
  onHeightChange,
  safeAreaTop = true,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const appearance = useToolbarAppearance();
  const [height, setHeight] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setHeight(h);
    onHeightChange?.(h);
  };

  const inner = (
    <View style={{ paddingTop: safeAreaTop ? insets.top : 0, paddingBottom: 8 }}>
      {title || left || right ? (
        <View style={styles.titleRow}>
          <View style={[styles.side, styles.sideLeft]}>{left}</View>
          {title ? (
            <AppText variant="navTitle" numberOfLines={1} style={styles.title} accessibilityRole="header">
              {title}
            </AppText>
          ) : (
            <View style={styles.title} />
          )}
          <View style={[styles.side, styles.sideRight]}>{right}</View>
        </View>
      ) : null}
      <View style={styles.rows}>{children}</View>
    </View>
  );

  const container: StyleProp<ViewStyle> = [floating && styles.floating, style];

  if (appearance === 'solid') {
    return (
      <View onLayout={onLayout} style={[{ backgroundColor: theme.colors.background }, container]}>
        {inner}
      </View>
    );
  }
  // Opaque behind the status bar and title, then easing out across the control rows, so rows
  // scrolling under the header dissolve instead of meeting a hard line. It stops at the header's
  // bottom edge: reaching past it laid a band over the resting content that read as a shadow.
  const bg = theme.colors.background;
  const solidUntil = height > 0 ? ((safeAreaTop ? insets.top : 0) + TITLE_ROW_HEIGHT) / height : 0;
  const pct = (f: number) => `${(Math.min(1, f) * 100).toFixed(1)}%`;
  const fade = `linear-gradient(to bottom, ${bg} 0%, ${bg} ${pct(solidUntil)}, ${withAlpha(bg, 0)} 100%)`;
  return (
    <View onLayout={onLayout} style={container}>
      {height > 0 ? (
        <View pointerEvents="none" style={[styles.fade, { height, backgroundImage: fade }]} />
      ) : null}
      {inner}
    </View>
  );
}

/**
 * Helper for floating headers: whether to float (glass/translucent appearance) and the content
 * inset to apply to the scroll view underneath.
 *
 *   const header = useFloatingHeader();
 *   <FlatList contentContainerStyle={{ paddingTop: header.inset }} scrollIndicatorInsets={{ top: header.inset }} />
 *   <ScreenHeader floating={header.floating} onHeightChange={header.onHeightChange} ... />
 */
export function useFloatingHeader() {
  const appearance = useToolbarAppearance();
  const [height, setHeight] = useState(0);
  const floating = appearance !== 'solid';
  return { floating, height, inset: floating ? height : 0, onHeightChange: setHeight };
}

const styles = StyleSheet.create({
  floating: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
  titleRow: { height: TITLE_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  sideLeft: { justifyContent: 'flex-start' },
  sideRight: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  rows: { gap: 10 },
});
