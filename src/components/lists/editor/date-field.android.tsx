import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

import { DateFieldShell } from './date-field-shell';
import type { DateFieldProps } from './date-field-types';
import { formatDraftDate } from './date-format';
import { todayDraft, type DraftDate } from './editor-model';

const pad = (n: number) => String(n).padStart(2, '0');

/** Date-only ISO string, so the dialog opens on the right day in every time zone. */
function isoDay(d: NonNullable<DraftDate>): string {
  return `${d.year}-${pad(d.month ?? 1)}-${pad(d.day ?? 1)}`;
}

/** Android: tapping the field opens a Material 3 DatePickerDialog. */
export function DateField({ value, onChange, label }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <DateFieldShell label={label} onPress={() => setOpen(true)} onClear={value ? () => onChange(null) : undefined}>
        {value ? <AppText variant="callout">{formatDraftDate(value)}</AppText> : undefined}
      </DateFieldShell>
      {open ? (
        <Host style={styles.host} colorScheme={theme.scheme} seedColor={theme.colors.accent}>
          <DatePickerDialog
            initialDate={isoDay(value ?? todayDraft())}
            color={theme.colors.accent}
            confirmButtonLabel="OK"
            dismissButtonLabel="Cancel"
            onDateSelected={(d) => {
              setOpen(false);
              // Material date pickers report UTC midnight of the chosen day.
              onChange({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
            }}
            onDismissRequest={() => setOpen(false)}
          />
        </Host>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1 },
});
