import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme';

export type QaraqHeaderCardProps = {
  /** Signed-in AniList user, or null for guests. */
  user: { name: string; avatarUrl?: string | null } | null;
  /** Guests: open the sign-in modal. Signed in: open the profile. */
  onPress?: () => void;
};

/**
 * Replaces AniClient's "(A)ni PRO / ♛ Unlock Bonus Features ♛" banner. Qaraq has no paywall,
 * so the card is the app wordmark plus the account state.
 */
export function QaraqHeaderCard({ user, onPress }: QaraqHeaderCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={user ? `Qaraq, signed in as ${user.name}` : 'Qaraq, sign in with AniList'}
      android_ripple={{ color: c.fill }}
      style={({ pressed }) => [
        styles.card,
        // Fills its section card edge to edge, on the same surface as the other settings cards.
        { backgroundColor: c.groupedSurface, opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1 },
      ]}>
      <View style={styles.wordmark}>
        <View style={[styles.ring, { borderColor: c.text }]}>
          <AppText variant="headline" weight="800" style={styles.ringLetter}>
            Q
          </AppText>
        </View>
        <AppText variant="title2" weight="800">
          araq
        </AppText>
        <AppText variant="caption2" tone="secondary" style={styles.sparkle}>
          ✦
        </AppText>
      </View>
      <View style={styles.subtitle}>
        <AppText variant="caption1" tone="star">
          ✦
        </AppText>
        <AppText variant="caption1" tone="secondary">
          Every Feature Unlocked
        </AppText>
        <AppText variant="caption1" tone="star">
          ✦
        </AppText>
      </View>
      <View style={[styles.account, { borderTopColor: c.separator }]}>
        {user ? (
          <>
            <Avatar uri={user.avatarUrl ?? undefined} name={user.name} size={22} ringWidth={0} />
            <AppText variant="footnote" tone="secondary" numberOfLines={1}>
              Signed in as{' '}
              <AppText variant="footnote" weight="700">
                {user.name}
              </AppText>
            </AppText>
          </>
        ) : (
          <AppText variant="footnote" tone="secondary">
            Browsing as guest ·{' '}
            <AppText variant="footnote" weight="700" tone="accent">
              Sign in with AniList
            </AppText>
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', paddingTop: 14, alignItems: 'center', overflow: 'hidden' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ring: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLetter: { lineHeight: 22 },
  sparkle: { alignSelf: 'flex-start', marginLeft: 2 },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 12 },
  account: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
