import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon, icons, type IconName } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { PrimaryButton } from '@/components/primary-button';
import { useTheme } from '@/theme';

export type SignInViewProps = {
  loading: boolean;
  error?: string | null;
  onSignIn: () => void;
  onGuest: () => void;
  onClose: () => void;
};

const FEATURES: readonly { icon: IconName; title: string; subtitle: string }[] = [
  {
    icon: { ios: 'rectangle.stack', android: 'stacks' },
    title: 'Your Lists, Everywhere',
    subtitle: 'Track anime and manga, synced with AniList',
  },
  {
    icon: { ios: 'bell.badge', android: 'notifications' },
    title: 'Never Miss an Episode',
    subtitle: 'Airing reminders for the shows you follow',
  },
  {
    icon: { ios: 'person.2', android: 'group' },
    title: 'Follow Your Friends',
    subtitle: 'Activity, likes and replies from the community',
  },
];

/** Large "(Q)araq" wordmark, the same mark as the Settings header card. */
function Wordmark() {
  const c = useTheme().colors;
  return (
    <View style={styles.wordmark} accessibilityRole="header" accessibilityLabel="Qaraq">
      <View style={[styles.ring, { borderColor: c.text }]}>
        <AppText variant="largeTitle" weight="800" style={styles.ringLetter}>
          Q
        </AppText>
      </View>
      <AppText variant="largeTitle" weight="800">
        araq
      </AppText>
    </View>
  );
}

/** First-run / sign-in modal: AniList OAuth or guest mode. */
export function SignInView({ loading, error, onSignIn, onGuest, onClose }: SignInViewProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      {/* Android modals are edge to edge, so clear the status bar; the iOS page sheet already does. */}
      <View style={[styles.close, Platform.OS === 'android' ? { paddingTop: insets.top + 14 } : null]}>
        <IconButton icon={icons.close} accessibilityLabel="Close" variant="circle" size={36} iconSize={16} onPress={onClose} />
      </View>

      <View style={styles.hero}>
        <Wordmark />
        <AppText variant="callout" tone="secondary" align="center" style={styles.tagline}>
          A free AniList client for your anime and manga.
        </AppText>
      </View>

      <View style={[styles.features, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
        {FEATURES.map((f, i) => (
          <View key={f.title} style={[styles.feature, i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.featureIcon, { backgroundColor: c.fillSecondary }]}>
              <Icon name={f.icon} size={18} color={c.accent} />
            </View>
            <View style={styles.featureText}>
              <AppText variant="headline">{f.title}</AppText>
              <AppText variant="footnote" tone="secondary">
                {f.subtitle}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {error ? (
          <AppText variant="footnote" tone="danger" align="center">
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Login with AniList" uppercase={false} loading={loading} onPress={onSignIn} />
        <PrimaryButton label="Continue as Guest" variant="secondary" uppercase={false} disabled={loading} onPress={onGuest} />
        <AppText variant="caption1" tone="tertiary" align="center">
          You sign in on anilist.co. Qaraq never sees your password.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  close: { alignItems: 'flex-end', paddingTop: 14 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ring: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringLetter: { lineHeight: 38 },
  tagline: { maxWidth: 280 },
  features: { marginBottom: 24 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  featureIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 1 },
  actions: { gap: 12 },
});
