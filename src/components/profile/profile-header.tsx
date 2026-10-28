import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { UserProfile } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/icon-button';
import { PrimaryButton } from '@/components/primary-button';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme';

import { profileIcons } from './profile-icons';

export const BANNER_HEIGHT = 170;
const AVATAR = 96;
const RING = 4;

export type ProfileHeaderProps = {
  user: UserProfile;
  followers?: number;
  following?: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  onInfoPress: () => void;
  /** Overscroll distance (pt) that stretches the banner. */
  stretch: SharedValue<number>;
  /** Other users: Follow/Unfollow + Message actions. */
  social?: {
    isFollowing: boolean;
    isFollower: boolean;
    pending: boolean;
    onToggleFollow: () => void;
    onMessage: () => void;
  };
};

/**
 * Profile hero: banner with a small "i" button, a large ringed avatar centred on the banner
 * edge, flanked by "Followers" / "Following" cards. Overscroll stretches the banner.
 */
export function ProfileHeader({
  user,
  followers,
  following,
  onFollowersPress,
  onFollowingPress,
  onInfoPress,
  stretch,
  social,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const c = theme.colors;

  const bannerStyle = useAnimatedStyle(() => {
    const s = Math.max(0, stretch.get());
    return {
      transform: [{ translateY: -s / 2 }, { scale: interpolate(s, [0, BANNER_HEIGHT], [1, 2], 'extend') }],
    };
  });

  return (
    <View style={styles.root}>
      <View style={[styles.bannerWrap, { height: BANNER_HEIGHT }]}>
        <Animated.View style={[StyleSheet.absoluteFill, bannerStyle]}>
          {user.bannerImage ? (
            <Image source={{ uri: user.bannerImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surfaceElevated }]} />
          )}
        </Animated.View>
        <IconButton
          icon={profileIcons.info}
          variant="glass"
          size={30}
          iconSize={15}
          accessibilityLabel="About"
          onPress={onInfoPress}
          style={styles.info}
        />
      </View>

      <View style={styles.statsRow}>
        <FollowCard label="Followers" value={followers} onPress={onFollowersPress} />
        <View style={{ width: AVATAR + RING * 2 + 16 }} />
        <FollowCard label="Following" value={following} onPress={onFollowingPress} />
      </View>
      <View style={styles.avatarClearance} />

      <View style={[styles.avatar, { top: BANNER_HEIGHT - (AVATAR + RING * 2) / 2 + 22 }]} pointerEvents="none">
        <Avatar uri={user.avatar?.large ?? user.avatar?.medium} name={user.name} size={AVATAR} ringColor={c.background} ringWidth={RING} />
      </View>

      {social ? (
        <View style={styles.actions}>
          <PrimaryButton
            size="sm"
            label={social.isFollowing ? 'Following' : social.isFollower ? 'Follow Back' : 'Follow'}
            variant={social.isFollowing ? 'secondary' : 'filled'}
            loading={social.pending}
            onPress={social.onToggleFollow}
            style={styles.action}
          />
          <PrimaryButton size="sm" label="Message" variant="secondary" onPress={social.onMessage} style={styles.action} />
        </View>
      ) : null}
    </View>
  );
}

function FollowCard({ label, value, onPress }: { label: string; value?: number; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value ?? 0} ${label}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, opacity: pressed ? 0.7 : 1 },
      ]}>
      <AppText variant="subheadline" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="value" numberOfLines={1}>
        {value == null ? '-' : formatNumber(value)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 14 },
  bannerWrap: { overflow: 'visible' },
  info: { position: 'absolute', left: 10, bottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, height: 50 },
  card: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', gap: 1 },
  avatar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 24 },
  avatarClearance: { height: 16 },
  action: { flex: 1 },
});
