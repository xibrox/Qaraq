import { StatusChipRow } from '@/components/status-chip-row';
import type { ListSectionKey } from '@/settings/types';

import { listIcons } from './list-icons';
import type { ListSection } from './use-my-list';

export type SectionChipsProps = {
  sections: readonly ListSection[];
  selected: ListSectionKey | null;
  onSelect: (key: ListSectionKey) => void;
  /** The circular "⇄" button after the chips: opens the reorder sheet. */
  onReorder: () => void;
};

/**
 * Status chips ("Watching" … "Dropped") of the chosen list with AniClient's circular "⇄"
 * button at the end, which opens the "Reorder" sheet for the chips.
 */
export function SectionChips({ sections, selected, onSelect, onReorder }: SectionChipsProps) {
  return (
    <StatusChipRow
      items={sections}
      selectedKey={selected}
      onSelect={onSelect}
      trailingAction={{ icon: listIcons.swap, accessibilityLabel: 'Reorder lists', onPress: onReorder }}
    />
  );
}
