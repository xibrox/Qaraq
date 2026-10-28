export type SortSheetOption<T extends string> = { value: T; label: string };

export type SortSheetProps<T extends string> = {
  visible: boolean;
  /** "Manga: Sort By". */
  title: string;
  options: readonly SortSheetOption<T>[];
  /** Current sort, or null when none is set. */
  selected: T | null;
  onSelect: (value: T) => void;
  /** Eraser button: clears the sort. */
  onClear: () => void;
  onClose: () => void;
};
