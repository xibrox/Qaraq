import { BottomSheet, RNHostView, type BottomSheetProps } from '@expo/ui';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { sheetColorScheme } from './sheet-color-scheme';

export type RNBottomSheetProps = Omit<BottomSheetProps, 'children' | 'contentPadding'> & {
  /** React Native content; rendered only while the sheet is presented. */
  children: ReactElement | null | false;
};

/**
 * The universal `@expo/ui` BottomSheet with React Native content that fills the sheet.
 *
 * The sheet presents its content in its own view controller (iOS) / window (Android), so plain RN
 * children are shrink-wrapped to their intrinsic width and get no touch dispatching: `Pressable`s
 * stop responding, and `flex: 1` rows collapse. Wrapping the content in a non-matching
 * `RNHostView` makes it take the sheet's full size and dispatch its own touches; a nested `Host`
 * (e.g. a `Switch`) inside it is then legal. On iOS the sheet follows the app theme's colour scheme.
 */
export function RNBottomSheet({ children, isPresented, modifiers, ...props }: RNBottomSheetProps) {
  const theme = useTheme();
  const scheme = sheetColorScheme(theme.scheme);
  return (
    <BottomSheet
      isPresented={isPresented}
      contentPadding={0}
      modifiers={scheme ? [...scheme, ...(modifiers ?? [])] : modifiers}
      {...props}>
      {isPresented && children ? (
        <RNHostView>
          <View style={styles.fill}>{children}</View>
        </RNHostView>
      ) : (
        <View />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch' },
});
