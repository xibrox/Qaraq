import type { Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputInstance, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';
import { Icon, icons } from './icon';

export type SearchFieldProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** Placeholder (default "Search"). */
  placeholder?: string;
  autoFocus?: boolean;
  /**
   * Button mode: when set, the field is not editable and tapping it calls `onPress`
   * (e.g. My List / Explore field that pushes the search screen).
   */
  onPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Called by the clear (x) button; defaults to `onChangeText('')`. */
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<TextInputInstance>;
  testID?: string;
};

/** The AniClient search field: magnifier + "Search" on a dark (or glass) rounded field, ~36pt tall. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search',
  autoFocus,
  onPress,
  onFocus,
  onBlur,
  onClear,
  style,
  ref,
  testID,
}: SearchFieldProps) {
  const theme = useTheme();
  const c = theme.colors;
  const h = theme.sizes.searchFieldHeight;
  const hasText = !!value && value.length > 0;

  const body = (
    <GlassSurface radius={theme.radii.lg} interactive={!!onPress} style={[styles.field, { height: h }]}>
      <Icon name={icons.search} size={15} color={c.textSecondary} />
      {onPress ? (
        <AppText variant="callout" tone="secondary" numberOfLines={1} style={styles.input}>
          {hasText ? value : placeholder}
        </AppText>
      ) : (
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={c.textSecondary}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          selectionColor={c.accent}
          keyboardAppearance={theme.dark ? 'dark' : 'light'}
          style={[
            styles.input,
            { color: c.text, fontFamily: theme.fontFamily, fontSize: theme.typography.callout.fontSize },
          ]}
          testID={testID}
          accessibilityLabel={placeholder}
        />
      )}
      {hasText && !onPress ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText?.(''))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search">
          <View style={[styles.clear, { backgroundColor: c.textTertiary }]}>
            <Icon name={icons.close} size={9} color={c.background} weight="bold" />
          </View>
        </Pressable>
      ) : null}
    </GlassSurface>
  );

  if (!onPress) return <View style={[styles.flex, style]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      testID={testID}
      style={({ pressed }) => [styles.flex, { opacity: pressed ? 0.7 : 1 }, style]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6 },
  input: { flex: 1, paddingVertical: 0 },
  clear: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
