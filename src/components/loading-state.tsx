import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type LoadingStateProps = {
  /** Default "Loading..." (AniClient also uses "Loading Mangas..."). */
  label?: string;
  /** Fill the available space and center (default true). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Centered spinner with "Loading...". */
export function LoadingState({ label = 'Loading...', fill = true, style }: LoadingStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.box, fill && styles.fill, style]} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={theme.colors.textSecondary} />
      {label ? (
        <AppText variant="subheadline" tone="secondary">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  fill: { flex: 1 },
});
