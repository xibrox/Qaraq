import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Icon, icons, type IconName } from './icon';

export type FabProps = {
  onPress: () => void;
  accessibilityLabel: string;
  /** Default pencil (entry editor / compose). Custom lists use a save glyph. */
  icon?: IconName;
  /** Distance from the bottom edge (default 16). Content above the tab bar is handled by NativeTabs insets. */
  bottom?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** The button's frame within the screen (its absolute-fill parent). */
  onLayout?: (e: LayoutChangeEvent) => void;
  /**
   * Lift the FAB above the tab bar (default false). The root safe area does not include the
   * NativeTabs bar (its height can't be measured), so this measures the screen's own safe area with
   * a nested SafeAreaProvider: on iOS that bottom inset includes the tab bar; on Android the screen
   * already ends above the bar, so it is 0. `bottom` is added on top of it.
   */
  aboveTabBar?: boolean;
};

/** Floating action button: ~56pt accent circle with a dark glyph and drop shadow, bottom-right. */
export function Fab({ aboveTabBar, ...props }: FabProps) {
  // Android: the screen already ends above the tab bar (inset 0), and the native SafeAreaProvider
  // ignores `pointerEvents="box-none"`, so the full-screen wrapper would swallow every touch on
  // the content underneath. Render the button directly.
  if (!aboveTabBar || Platform.OS === 'android') return <FabButton {...props} />;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SafeAreaProvider style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <InsetFab {...props} />
      </SafeAreaProvider>
    </View>
  );
}

function InsetFab({ bottom = 16, ...props }: Omit<FabProps, 'aboveTabBar'>) {
  const insets = useSafeAreaInsets();
  return <FabButton {...props} bottom={bottom + insets.bottom} />;
}

function FabButton({ onPress, accessibilityLabel, icon = icons.pencil, bottom = 16, style, testID, onLayout }: Omit<FabProps, 'aboveTabBar'>) {
  const theme = useTheme();
  const size = theme.sizes.fab;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.accent,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Icon name={icon} size={22} color={theme.colors.onAccent} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
