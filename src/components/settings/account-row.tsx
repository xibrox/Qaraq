import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Icon, icons } from '@/components/icon';
import { useTheme } from '@/theme';

export type AccountRowProps = {
  /** Signed-in AniList user, or null for guests. */
  user: { name: string; avatarUrl?: string | null } | null;
  /** Signed in: open the profile. Guests: open sign-in. */
  onPress: () => void;
};

/**
 * Top row of Settings, like the Apple Account row in the iPhone Settings app: avatar, name and
 * "AniList Account", or a sign-in prompt for guests. System font, to match the native rows.
 */
export function AccountRow({ user, onPress }: AccountRowProps) {
  const c = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={user ? `${user.name}, AniList account` : 'Sign in to AniList'}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      {user ? (
        <Avatar uri={user.avatarUrl ?? undefined} name={user.name} size={60} ringWidth={0} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: c.textTertiary }]}>
          <Icon name={icons.person} size={30} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.text}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {user ? user.name : 'Sign in to AniList'}
        </Text>
        <Text style={[styles.caption, { color: c.textSecondary }]} numberOfLines={2}>
          {user ? 'AniList Account' : 'Sync your lists, activity and stats.'}
        </Text>
      </View>
      <Icon name={icons.chevronRight} size={14} color={c.textTertiary} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  placeholder: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 22, fontWeight: '600' },
  caption: { fontSize: 15 },
});
