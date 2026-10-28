import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { getSettings } from '@/settings/store';
import type { HapticIntensity } from '@/settings/types';

/**
 * Haptic feedback wrapper that respects Settings > Vibration (enabled + intensity).
 * All calls are fire-and-forget and never throw.
 */

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function enabled(): boolean {
  if (!supported) return false;
  return getSettings().haptics.enabled;
}

function intensity(): HapticIntensity {
  return getSettings().haptics.intensity;
}

const swallow = (p: Promise<void>) => {
  p.catch(() => {});
};

/** Map a semantic weight to an impact style, shifted by the intensity setting. */
const IMPACT_BY_INTENSITY: Record<HapticIntensity, Record<'soft' | 'normal' | 'strong', Haptics.ImpactFeedbackStyle>> = {
  light: {
    soft: Haptics.ImpactFeedbackStyle.Soft,
    normal: Haptics.ImpactFeedbackStyle.Light,
    strong: Haptics.ImpactFeedbackStyle.Medium,
  },
  medium: {
    soft: Haptics.ImpactFeedbackStyle.Light,
    normal: Haptics.ImpactFeedbackStyle.Medium,
    strong: Haptics.ImpactFeedbackStyle.Heavy,
  },
  strong: {
    soft: Haptics.ImpactFeedbackStyle.Medium,
    normal: Haptics.ImpactFeedbackStyle.Heavy,
    strong: Haptics.ImpactFeedbackStyle.Rigid,
  },
};

export const haptics = {
  /** Selection change (pickers, segmented controls, tab switches). */
  selection() {
    if (!enabled()) return;
    swallow(Haptics.selectionAsync());
  },
  /** Generic tap/impact. */
  impact(weight: 'soft' | 'normal' | 'strong' = 'normal') {
    if (!enabled()) return;
    swallow(Haptics.impactAsync(IMPACT_BY_INTENSITY[intensity()][weight]));
  },
  /** Light tick, e.g. swipe crossing the action threshold. */
  light() {
    haptics.impact('soft');
  },
  /** Heavier thump, e.g. long press menu. */
  heavy() {
    haptics.impact('strong');
  },
  success() {
    if (!enabled()) return;
    swallow(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  warning() {
    if (!enabled()) return;
    swallow(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  error() {
    if (!enabled()) return;
    swallow(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  /** Progress +1 on a list entry. */
  increment() {
    haptics.impact('normal');
  },
  /** Destructive action confirmed (delete entry). */
  destructive() {
    haptics.warning();
  },
};

export type HapticsApi = typeof haptics;
