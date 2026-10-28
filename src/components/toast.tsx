import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type ToastKind = 'info' | 'success' | 'error';

export type ToastOptions = {
  kind?: ToastKind;
  /** Visible duration in ms (default 2000). */
  duration?: number;
  /** Fire the matching haptic (default true for success/error). */
  haptic?: boolean;
};

type ToastItem = { id: number; message: string; kind: ToastKind; duration: number };

type ToastState = { current: ToastItem | null };

const useToastStore = create<ToastState>(() => ({ current: null }));

let nextId = 1;

const SUFFIX: Record<ToastKind, string> = { info: '', success: ' ✅', error: ' ⚠️' };

function show(message: string, opts: ToastOptions = {}) {
  const kind = opts.kind ?? 'info';
  if (opts.haptic ?? kind !== 'info') {
    if (kind === 'success') haptics.success();
    else if (kind === 'error') haptics.error();
  }
  useToastStore.setState({ current: { id: nextId++, message: message + SUFFIX[kind], kind, duration: opts.duration ?? 2000 } });
}

/**
 * Imperative toast API (callable from anywhere, including mutation callbacks):
 *   toast('Copied');                    // plain
 *   toast.success('Added to favorites'); // "Added to favorites ✅"
 *   toast.error('Could not save');
 */
export const toast = Object.assign(show, {
  success: (message: string, opts?: Omit<ToastOptions, 'kind'>) => show(message, { ...opts, kind: 'success' }),
  error: (message: string, opts?: Omit<ToastOptions, 'kind'>) => show(message, { ...opts, kind: 'error' }),
  hide: () => useToastStore.setState({ current: null }),
});

/** True while a toast is on screen (screens hide their collapsed nav title so they don't collide). */
export function useToastVisible(): boolean {
  return useToastStore((s) => s.current != null);
}

/**
 * Renders the current toast: text only, centered under the status bar, bold white with a shadow
 * and no pill (AniClient 00:31.97). Mount once near the root, above the navigator.
 */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  useEffect(() => {
    if (!current) return;
    const id = current.id;
    const t = setTimeout(() => {
      if (useToastStore.getState().current?.id === id) useToastStore.setState({ current: null });
    }, current.duration);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 6 }]}>
      {current ? (
        <Animated.View key={current.id} entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)}>
          <AppText
            variant="headline"
            weight="800"
            align="center"
            color={theme.dark ? '#FFFFFF' : theme.colors.text}
            style={[styles.text, { textShadowColor: theme.colors.shadow }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert">
            {current.message}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  text: { textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
});
