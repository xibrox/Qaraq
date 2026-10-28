import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CoverImage } from '@/components/cover-image';
import { formatTimeAgo } from '@/components/activity/activity-format';
import { useTheme } from '@/theme';

import type { NotificationContent } from './notification-content';

export const NOTIFICATION_THUMB = { width: 60, height: 70 } as const;

export type NotificationRowProps = {
  content: NotificationContent;
  createdAt: number | null;
  /** Shown with an accent dot until the list is reloaded (AniList has no per-item read flag). */
  unread?: boolean;
  onPress?: () => void;
  onThumbPress?: () => void;
  recyclingKey: string;
};

/**
 * AniClient notification row: ~60×70 thumbnail on the left (media cover or user avatar), the
 * message with bold entity names, and a gray relative time top-right. No separators.
 */
export const NotificationRow = memo(function NotificationRow({
  content,
  createdAt,
  unread,
  onPress,
  onThumbPress,
  recyclingKey,
}: NotificationRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const label = content.segments.map((s) => s.text).join('');
  const thumb = content.thumb;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={unread ? `Unread. ${label}` : label}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <Pressable onPress={onThumbPress ?? onPress} disabled={!onThumbPress && !onPress} style={styles.thumbWrap}>
        {thumb ? (
          <CoverImage
            uri={thumb.uri}
            width={NOTIFICATION_THUMB.width}
            height={NOTIFICATION_THUMB.height}
            radius={theme.radii.sm}
            isAdult={thumb.isAdult}
            recyclingKey={recyclingKey}
          />
        ) : (
          <View style={NOTIFICATION_THUMB} />
        )}
        {unread ? <View style={[styles.dot, { backgroundColor: c.accent, borderColor: c.background }]} /> : null}
      </Pressable>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <AppText variant="subheadline" style={styles.message}>
            {content.segments.map((s, i) =>
              s.bold ? (
                <AppText key={i} variant="subheadline" weight="800">
                  {s.text}
                </AppText>
              ) : (
                s.text
              ),
            )}
          </AppText>
          {createdAt ? (
            <AppText variant="footnote" tone="secondary" numberOfLines={1} style={styles.time}>
              {formatTimeAgo(createdAt)}
            </AppText>
          ) : null}
        </View>
        {content.detail ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={3}>
            {content.detail}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 5 },
  thumbWrap: { width: NOTIFICATION_THUMB.width, height: NOTIFICATION_THUMB.height },
  dot: { position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  body: { flex: 1, gap: 4, paddingTop: 2 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  message: { flex: 1 },
  time: { paddingTop: 1 },
});
