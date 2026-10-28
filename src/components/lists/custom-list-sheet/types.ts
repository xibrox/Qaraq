export type CustomListOption = { name: string; checked: boolean };

/**
 * Sheet opened by the "Custom List" swipe action: one toggle per custom list. Each toggle
 * saves immediately (optimistic), so there is no save button. SwiftUI sheet on iOS, Material 3
 * modal bottom sheet on Android, RN modal on web.
 */
export type CustomListSheetProps = {
  visible: boolean;
  /** Media title shown as the sheet header. */
  title: string;
  lists: readonly CustomListOption[];
  onToggle: (name: string, checked: boolean) => void;
  /** "Manage Custom Lists" (opens Settings > Custom Lists). */
  onManage: () => void;
  onClose: () => void;
};
