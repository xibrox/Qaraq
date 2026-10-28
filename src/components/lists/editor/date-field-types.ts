import type { DraftDate } from './editor-model';

/**
 * "Start Date:" / "Finish Date:" field: calendar icon, the date ("9/11/2026") and an ⓧ clear
 * button. iOS uses a SwiftUI compact `DatePicker`, Android a Material 3 `DatePickerDialog`.
 */
export type DateFieldProps = {
  value: DraftDate;
  onChange: (value: DraftDate) => void;
  /** Spoken label ("Start Date"). */
  label: string;
};
