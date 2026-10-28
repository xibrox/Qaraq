import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export type ProfileTab = 'activity' | 'favorite' | 'stats';

export const PROFILE_TABS: readonly { key: ProfileTab; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'favorite', label: 'Favorite' },
  { key: 'stats', label: 'Stats' },
];

export const PROFILE_TAB_BAR_HEIGHT = 48;

export type ProfileTabBarProps = {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  style?: StyleProp<ViewStyle>;
};

/** "Activity | Favorite | Stats" with a sliding white underline under the selected tab. */
export function ProfileTabBar({ value, onChange, style }: ProfileTabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);
  const index = Math.max(0, PROFILE_TABS.findIndex((t) => t.key === value));
  const segment = width / PROFILE_TABS.length;

  const underline = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(index * segment, { duration: 220 }) }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: c.background, borderBottomColor: c.separator }, style]}>
      {PROFILE_TABS.map((t) => {
        const selected = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(t.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={styles.tab}>
            <AppText variant="callout" weight={selected ? '700' : '500'} color={selected ? c.text : c.textSecondary}>
              {t.label}
            </AppText>
          </Pressable>
        );
      })}
      {width > 0 ? (
        <Animated.View style={[styles.underline, { width: segment, backgroundColor: c.accent }, underline]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: PROFILE_TAB_BAR_HEIGHT, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  underline: { position: 'absolute', left: 0, bottom: 0, height: 2, borderRadius: 1 },
});
