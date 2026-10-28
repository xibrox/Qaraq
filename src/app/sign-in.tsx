import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { clearAuthError, continueAsGuest, signIn, useAuthStore } from '@/auth';
import { markOnboarded } from '@/components/settings/onboarding';
import { SignInView } from '@/components/settings/sign-in-view';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';

function dismiss() {
  if (router.canGoBack()) router.back();
  else router.replace(hrefs.tab('lists'));
}

/** Root modal: AniList login (implicit grant) or guest mode. Shown on first launch. */
export default function SignInScreen() {
  const error = useAuthStore((s) => s.error);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Seen once is enough: never auto-present it again.
    markOnboarded();
    clearAuthError();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    const result = await signIn();
    setLoading(false);
    if (result.ok) {
      haptics.success();
      toast.success('Signed in');
      dismiss();
    } else if (result.reason === 'error') {
      haptics.error();
    }
  };

  return (
    <SignInView
      loading={loading}
      error={error}
      onSignIn={() => void handleSignIn()}
      onGuest={() => {
        continueAsGuest();
        dismiss();
      }}
      onClose={dismiss}
    />
  );
}
