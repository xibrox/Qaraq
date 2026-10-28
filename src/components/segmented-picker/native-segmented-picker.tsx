import { SegmentedSwitch } from '@/components/segmented-switch';

import type { NativeSegmentedPickerProps } from './types';

/** Web fallback: the RN `SegmentedSwitch` at in-content size. */
export function NativeSegmentedPicker<T extends string>(props: NativeSegmentedPickerProps<T>) {
  return <SegmentedSwitch {...props} size="md" />;
}

export type { NativeSegmentedPickerProps } from './types';
