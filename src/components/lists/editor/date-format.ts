import { formatFuzzyDate } from '@/lib/format';

import type { DraftDate } from './editor-model';

/** "9/11/2026" in the device's numeric date order; partial dates fall back to "Sep 2026" / "2026". */
export function formatDraftDate(d: DraftDate): string {
  if (!d) return '';
  if (d.month && d.day) {
    try {
      return new Date(d.year, d.month - 1, d.day).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch {
      return `${d.month}/${d.day}/${d.year}`;
    }
  }
  return formatFuzzyDate(d, 'medium');
}
