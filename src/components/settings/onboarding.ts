import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStatus } from '@/auth';
import { storage } from '@/lib/storage';
import { hrefs } from '@/navigation/hrefs';

/**
 * First-launch onboarding: the sign-in modal is shown once, the first time the app starts
 * signed out. Signing in, continuing as guest or dismissing the modal all count as done.
 */
const ONBOARDED_KEY = 'qaraq.onboarded';

export function hasOnboarded(): boolean {
  return storage.getBoolean(ONBOARDED_KEY) === true;
}

export function markOnboarded(): void {
  storage.set(ONBOARDED_KEY, true);
}

/**
 * Present the sign-in modal on first launch. Mount once inside the root navigator
 * (after `useLaunchRouting`). No-op when signed in or already onboarded.
 */
export function useFirstLaunchSignIn(): void {
  const status = useAuthStatus();
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'signedIn') {
      if (!hasOnboarded()) markOnboarded();
      return;
    }
    if (hasOnboarded()) return;
    // Let the tab navigator mount first, so the modal opens above it.
    const t = setTimeout(() => router.push(hrefs.signIn()), 300);
    return () => clearTimeout(t);
  }, [status]);
}
