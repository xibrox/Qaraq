import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { flattenPages, useLikes } from '@/api/queries/hooks';
import type { LikeableType, LikesQuery, UserLite } from '@/api/types';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme';

import { userHref } from './markdown/link-routing';
import { RNBottomSheet } from './rn-bottom-sheet';

export type LikersTarget = { id: number; type: Extract<LikeableType, 'ACTIVITY' | 'ACTIVITY_REPLY'> };

export type LikersSheetProps = {
  target: LikersTarget | null;
  onDismiss: () => void;
};

/** Native bottom sheet listing the users who liked an activity or reply. */
export function LikersSheet({ target, onDismiss }: LikersSheetProps) {
  const theme = useTheme();
  return (
    <RNBottomSheet isPresented={target != null} onDismiss={onDismiss} snapPoints={['half', 'full']} containerColor={theme.colors.surface}>
      {target ? <LikersList target={target} onDismiss={onDismiss} /> : null}
    </RNBottomSheet>
  );
}

function LikersList({ target, onDismiss }: { target: LikersTarget; onDismiss: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const likes = useLikes(target.id, target.type);
  const users = flattenPages<LikesQuery, UserLite>(likes.data, (p) => p.Page.likes);

  return (
    <View style={styles.root}>
      <AppText variant="headline" align="center" style={styles.title}>
        Likes
      </AppText>
      <ScrollView
        contentContainerStyle={styles.list}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200 && likes.hasNextPage && !likes.isFetchingNextPage) {
            void likes.fetchNextPage();
          }
        }}
        scrollEventThrottle={64}>
        {likes.isPending ? <ActivityIndicator style={styles.spinner} color={theme.colors.textSecondary} /> : null}
        {!likes.isPending && users.length === 0 ? (
          <AppText tone="secondary" align="center" style={styles.spinner}>
            No likes yet
          </AppText>
        ) : null}
        {users.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => {
              onDismiss();
              router.push(userHref(u.id));
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
            <Avatar uri={u.avatar?.medium ?? u.avatar?.large} name={u.name} size={40} shape="rounded" />
            <AppText variant="listTitle" numberOfLines={1} style={styles.name}>
              {u.name}
            </AppText>
          </Pressable>
        ))}
        {likes.isFetchingNextPage ? <ActivityIndicator style={styles.spinner} color={theme.colors.textSecondary} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { paddingTop: 18, paddingBottom: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  name: { flex: 1 },
  spinner: { marginTop: 24 },
});
