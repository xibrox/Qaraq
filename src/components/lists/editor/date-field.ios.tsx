import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden, opacity, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

import { DateFieldShell } from './date-field-shell';
import type { DateFieldProps } from './date-field-types';
import { formatDraftDate } from './date-format';
import { dateToDraft, draftToDate, todayDraft } from './editor-model';

/**
 * iOS: a flat dark field showing the numeric date ("9/11/2026", as in AniClient). A SwiftUI
 * compact DatePicker sits over the text, nearly transparent, so tapping the date still opens the
 * native calendar popover without drawing the system pill inside the field. Empty state taps to today.
 */
export function DateField({ value, onChange, label }: DateFieldProps) {
  const theme = useTheme();
  const date = draftToDate(value);
  if (!date || !value) return <DateFieldShell label={label} onPress={() => onChange(todayDraft())} />;
  return (
    <DateFieldShell label={label} onClear={() => onChange(null)}>
      <View style={styles.wrap}>
        <AppText variant="callout" numberOfLines={1}>
          {formatDraftDate(value)}
        </AppText>
        <View style={styles.pickerOverlay} pointerEvents="box-none">
          <Host matchContents colorScheme={theme.scheme}>
            <DatePicker
              selection={date}
              displayedComponents={['date']}
              range={{ end: new Date(2100, 0, 1) }}
              onDateChange={(d) => onChange(dateToDraft(d))}
              // SwiftUI stops hit-testing at opacity 0, so keep it just above that.
              modifiers={[labelsHidden(), datePickerStyle('compact'), tint(theme.colors.accent), opacity(0.02)]}
            />
          </Host>
        </View>
      </View>
    </DateFieldShell>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', justifyContent: 'center', overflow: 'hidden', minHeight: 34 },
  pickerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'flex-start' },
});
