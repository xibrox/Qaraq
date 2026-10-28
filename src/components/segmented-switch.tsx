import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { MEDIA_TYPE_LABELS } from '@/settings/labels';
import type { MediaType } from '@/settings/types';
import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';

export type Segment<T extends string> = { value: T; label: string };

export type SegmentedSwitchProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Dimmed and non-interactive (e.g. while Explore is loading). */
  disabled?: boolean;
  /** `sm` = header toolbar size (default), `md` = in-content size. */
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * AniClient's compact segmented switch ("Anime | Manga"): the selected segment is an accent
 * pill (white by default) with dark text, the others are plain text on the field/glass track.
 * For form-style segmented pickers use `NativeSegmentedPicker` instead.
 */
export function SegmentedSwitch<T extends string>({
  segments,
  value,
  onChange,
  disabled,
  size = 'sm',
  style,
  testID,
}: SegmentedSwitchProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  const height = size === 'sm' ? 30 : 36;
  return (
    <GlassSurface
      radius={8}
      style={[styles.track, { height, opacity: disabled ? 0.5 : 1 }, style]}
      testID={testID}>
      <View style={styles.row} accessibilityRole="tablist">
        {segments.map((s) => {
          const selected = s.value === value;
          return (
            <Pressable
              key={s.value}
              disabled={disabled}
              onPress={() => {
                if (selected) return;
                haptics.selection();
                onChange(s.value);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled }}
              style={[
                styles.segment,
                { borderRadius: 6, paddingHorizontal: size === 'sm' ? 6 : 14 },
                selected && { backgroundColor: c.accent },
              ]}>
              <AppText
                variant={size === 'sm' ? 'footnote' : 'subheadline'}
                weight="700"
                color={selected ? c.onAccent : c.text}
                numberOfLines={1}>
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const MEDIA_SEGMENTS: readonly Segment<MediaType>[] = [
  { value: 'ANIME', label: MEDIA_TYPE_LABELS.ANIME },
  { value: 'MANGA', label: MEDIA_TYPE_LABELS.MANGA },
];

export type MediaTypeSwitchProps = Omit<SegmentedSwitchProps<MediaType>, 'segments'>;

/** "Anime | Manga" switch. */
export function MediaTypeSwitch(props: MediaTypeSwitchProps) {
  return <SegmentedSwitch segments={MEDIA_SEGMENTS} {...props} />;
}

const styles = StyleSheet.create({
  track: { padding: 2, justifyContent: 'center' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  segment: { justifyContent: 'center', alignItems: 'center' },
});
