import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { MediaStatus } from '@/api/types';
import { MEDIA_STATUS_COLORS } from '@/theme';

/** Small releasing/finished dot: green while airing/publishing, red otherwise (spec §1). */
export function StatusDot({ status, size = 7, style }: { status: MediaStatus | null | undefined; size?: number; style?: StyleProp<ViewStyle> }) {
  if (!status) return null;
  return (
    <View
      accessibilityLabel={status === 'RELEASING' ? 'Releasing' : undefined}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: MEDIA_STATUS_COLORS[status] }, style]}
    />
  );
}
