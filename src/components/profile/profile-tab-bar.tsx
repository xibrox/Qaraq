import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { NativeSegmentedPicker } from '@/components/segmented-picker/native-segmented-picker';

export type ProfileTab = 'activity' | 'favorite' | 'stats';

export const PROFILE_TABS: readonly { value: ProfileTab; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'favorite', label: 'Favorite' },
  { value: 'stats', label: 'Stats' },
];

export const PROFILE_TAB_BAR_HEIGHT = 48;

export type ProfileTabBarProps = {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Activity | Favorite | Stats" as the system segmented control (Liquid Glass on iOS 26). It has
 * no background of its own, so stuck under the nav bar it floats over the feed.
 */
export function ProfileTabBar({ value, onChange, style }: ProfileTabBarProps) {
  return (
    <View style={[styles.bar, style]}>
      {/* A capsule behind it, like the bar's glass behind the Anime/Manga switch. On iOS SwiftUI draws it. */}
      {Platform.OS === 'ios' ? (
        <NativeSegmentedPicker segments={PROFILE_TABS} value={value} onChange={onChange} capsule style={styles.picker} />
      ) : (
        <GlassSurface radius="pill" style={styles.glass}>
          <NativeSegmentedPicker segments={PROFILE_TABS} value={value} onChange={onChange} style={styles.picker} />
        </GlassSurface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: PROFILE_TAB_BAR_HEIGHT, paddingHorizontal: 16, justifyContent: 'center' },
  glass: { height: 36, paddingHorizontal: 2, justifyContent: 'center' },
  picker: { alignSelf: 'stretch' },
});
