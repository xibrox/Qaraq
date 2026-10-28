import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Liquid Glass can be drawn (iOS 26+ runtime and SDK, no compatibility flag, and not one of the
 * early iOS 26 betas whose glass API crashes). Constant for the process lifetime.
 */
export const CAN_LIQUID_GLASS: boolean =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** Tracks the iOS "Reduce Transparency" accessibility setting (false elsewhere). */
export function useReduceTransparency(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
