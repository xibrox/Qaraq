export type ReorderItem = { key: string; label: string };

/**
 * AniClient's "Reorder: Anime list" sheet, opened by the "⇄" button after the chips: every
 * visible chip in order, dragged (iOS) or moved with arrows (Android, web) into a new order,
 * plus a reset button. Each move saves immediately, so there is no save button. SwiftUI list
 * in edit mode on iOS, Material 3 modal bottom sheet on Android, RN modal on web.
 */
export type ReorderSheetProps = {
  visible: boolean;
  /** "Reorder: Anime list". */
  title: string;
  items: readonly ReorderItem[];
  /** The full new order of `items` keys. */
  onReorder: (keys: string[]) => void;
  onReset: () => void;
  onClose: () => void;
};
