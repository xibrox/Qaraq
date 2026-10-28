import { StyleSheet, View } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';

export type SaveBarProps = {
  onSave: () => void;
  disabled?: boolean;
};

const BAR_PADDING_TOP = 8;
const BUTTON_HEIGHT = 56;

/**
 * Bottom padding under the button. Inside an iOS form sheet the safe area still reports the tab
 * bar the sheet covers (~85pt), which floated SAVE far above the sheet's bottom edge. The sheet
 * always ends at the screen bottom, so cap it at the window's own inset (home indicator).
 */
export function saveBarBottomPadding(bottomInset: number): number {
  const windowBottom = initialWindowMetrics?.insets.bottom ?? bottomInset;
  return Math.max(12, Math.min(bottomInset, windowBottom));
}

/** Height of the bar before it is measured: top padding + button + bottom padding. */
export function estimatedSaveBarHeight(bottomInset: number): number {
  return BAR_PADDING_TOP + BUTTON_HEIGHT + saveBarBottomPadding(bottomInset);
}

/** Pinned full-width white "SAVE" button (black uppercase, 56pt, radius 12). */
export function SaveBar({ onSave, disabled }: SaveBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: saveBarBottomPadding(insets.bottom) }]}>
      <PrimaryButton label="Save" onPress={onSave} disabled={disabled} style={styles.button} testID="entry-save" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 12, paddingTop: BAR_PADDING_TOP },
  button: { borderRadius: 12 },
});
