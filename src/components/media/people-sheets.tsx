import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages, useMediaCharacters, useMediaStaff } from '@/api/queries/hooks';
import type { MediaCharacterEdge, MediaStaffEdge } from '@/api/types';
import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { formatEnum } from '@/lib/format';
import { pickName } from '@/lib/title';
import { useTheme } from '@/theme';

import { SheetModal } from './sheet-modal';

type BaseProps = { mediaId: number; visible: boolean; onClose: () => void };

function Footer({ loading }: { loading: boolean }) {
  const theme = useTheme();
  return loading ? <ActivityIndicator style={styles.footer} color={theme.colors.textSecondary} /> : null;
}

/** Full character list with voice actors (opened from "Characters ›"). */
export function CharactersSheet({ mediaId, visible, onClose, onCharacter, onStaff }: BaseProps & { onCharacter: (id: number) => void; onStaff: (id: number) => void }) {
  const theme = useTheme();
  const q = useMediaCharacters({ id: mediaId, perPage: 25 }, { enabled: visible });
  const items = flattenPages(q.data, (p) => p.Media?.characters?.edges).filter(
    (e): e is MediaCharacterEdge & { node: NonNullable<MediaCharacterEdge['node']> } => !!e.node,
  );
  return (
    <SheetModal visible={visible} title="Characters" onClose={onClose}>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error && !items.length ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e, i) => `${e.id ?? i}-${e.node.id}`}
          contentContainerStyle={styles.list}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<Footer loading={q.isFetchingNextPage} />}
          renderItem={({ item }) => {
            const va = item.voiceActorRoles?.find((r) => r?.voiceActor)?.voiceActor ?? null;
            return (
              <View style={[styles.row, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md }]}>
                <Pressable style={styles.half} onPress={() => onCharacter(item.node.id)} accessibilityRole="button">
                  <CoverImage uri={item.node.image?.medium} width={50} radius={theme.radii.xs} />
                  <View style={styles.texts}>
                    <AppText variant="footnote" weight="700" numberOfLines={2}>
                      {pickName(item.node.name)}
                    </AppText>
                    <AppText variant="caption1" tone="secondary">
                      {formatEnum(item.role)}
                    </AppText>
                  </View>
                </Pressable>
                {va ? (
                  <Pressable style={[styles.half, styles.right]} onPress={() => onStaff(va.id)} accessibilityRole="button">
                    <View style={[styles.texts, styles.alignEnd]}>
                      <AppText variant="footnote" weight="700" numberOfLines={2} align="right">
                        {pickName(va.name)}
                      </AppText>
                      <AppText variant="caption1" tone="secondary" align="right">
                        {va.languageV2 ?? ''}
                      </AppText>
                    </View>
                    <CoverImage uri={va.image?.medium} width={50} radius={theme.radii.xs} />
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SheetModal>
  );
}

/** Full staff list (opened from "Staff ›"). */
export function StaffSheet({ mediaId, visible, onClose, onStaff }: BaseProps & { onStaff: (id: number) => void }) {
  const theme = useTheme();
  const q = useMediaStaff({ id: mediaId, perPage: 25 }, { enabled: visible });
  const items = flattenPages(q.data, (p) => p.Media?.staff?.edges).filter(
    (e): e is MediaStaffEdge & { node: NonNullable<MediaStaffEdge['node']> } => !!e.node,
  );
  return (
    <SheetModal visible={visible} title="Staff" onClose={onClose}>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error && !items.length ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e, i) => `${e.id ?? i}-${e.node.id}`}
          contentContainerStyle={styles.list}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<Footer loading={q.isFetchingNextPage} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onStaff(item.node.id)}
              accessibilityRole="button"
              style={[styles.row, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md }]}>
              <CoverImage uri={item.node.image?.medium} width={50} radius={theme.radii.xs} />
              <View style={styles.texts}>
                <AppText variant="footnote" weight="700">
                  {pickName(item.node.name)}
                </AppText>
                <AppText variant="caption1" tone="secondary">
                  {item.role ?? ''}
                </AppText>
              </View>
            </Pressable>
          )}
        />
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', overflow: 'hidden', padding: 6, gap: 8 },
  half: { flex: 1, flexDirection: 'row', gap: 8 },
  right: { justifyContent: 'flex-end' },
  texts: { flex: 1, gap: 2, paddingTop: 2 },
  alignEnd: { alignItems: 'flex-end' },
  footer: { marginVertical: 16 },
});
