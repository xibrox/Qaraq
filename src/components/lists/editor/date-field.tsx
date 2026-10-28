import { AppText } from '@/components/app-text';

import { DateFieldShell } from './date-field-shell';
import type { DateFieldProps } from './date-field-types';
import { formatDraftDate } from './date-format';
import { todayDraft } from './editor-model';

/** Fallback (web): tap sets today, ⓧ clears. */
export function DateField({ value, onChange, label }: DateFieldProps) {
  if (!value) return <DateFieldShell label={label} onPress={() => onChange(todayDraft())} />;
  return (
    <DateFieldShell label={label} onClear={() => onChange(null)}>
      <AppText variant="callout">{formatDraftDate(value)}</AppText>
    </DateFieldShell>
  );
}
