import { useHeaderHeight } from 'expo-router/react-navigation';
import { Platform } from 'react-native';

import { useToolbarAppearance } from '@/navigation/toolbar-appearance';

/**
 * Top padding for scroll content under a transparent native header on Android ("Glass" Toolbar
 * Style). iOS handles this with `contentInsetAdjustmentBehavior="automatic"`, so it returns 0 there.
 */
export function useAndroidHeaderInset(): number {
  const appearance = useToolbarAppearance();
  const headerHeight = useHeaderHeight();
  if (Platform.OS !== 'android' || appearance === 'solid') return 0;
  return headerHeight;
}
