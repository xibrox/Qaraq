import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, Share, StyleSheet, View } from 'react-native';

import { useDeleteActivity, useToggleActivitySubscription } from '@/api/queries/hooks';
import { fetchActivityMarkdown } from '@/api/queries/profile';
import type { Activity } from '@/api/types';
import { useIsSignedIn, useViewerId } from '@/auth';
import { describeError } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { NativeMenu } from '@/components/menu/native-menu';
import type { MenuEntry } from '@/components/menu/types';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { activityIcons } from './activity-icons';
import { activityUrl, canDeleteActivity, canEditActivity } from './activity-format';
import { useActivitySheets } from './activity-sheets';
import { menuIcons } from './menu-icons';

const IS_IOS = Platform.OS === 'ios';

/** Copies an AniList URL and confirms with a toast. */
export async function copyLink(url: string) {
  await Clipboard.setStringAsync(url);
  haptics.success();
  toast('Link copied');
}

/** Builds the "•••" menu for an activity: subscribe, edit, copy link, share, delete. */
export function useActivityMenuItems(activity: Activity, onDeleted?: () => void): MenuEntry[] {
  const viewerId = useViewerId();
  const signedIn = useIsSignedIn();
  const sheets = useActivitySheets();
  const subscription = useToggleActivitySubscription();
  const del = useDeleteActivity();
  const url = activityUrl(activity);

  const items: MenuEntry[] = [];
  if (signedIn) {
    items.push({
      key: 'subscribe',
      title: activity.isSubscribed ? 'Unsubscribe' : 'Subscribe',
      icon: activity.isSubscribed ? menuIcons.unsubscribe : menuIcons.subscribe,
      onPress: () => {
        haptics.selection();
        subscription.mutate(
          { activityId: activity.id, subscribe: !activity.isSubscribed },
          {
            onSuccess: () => toast(activity.isSubscribed ? 'Unsubscribed' : 'Subscribed'),
            onError: (e) => toast.error(describeError(e).message),
          },
        );
      },
    });
  }
  if (canEditActivity(activity, viewerId)) {
    items.push({
      key: 'edit',
      title: 'Edit',
      icon: menuIcons.edit,
      onPress: async () => {
        try {
          const initialText = await fetchActivityMarkdown(activity.id);
          if (activity.__typename === 'MessageActivity') {
            sheets.compose({
              kind: 'message',
              activityId: activity.id,
              initialText,
              isPrivate: !!activity.isPrivate,
              recipient: { id: activity.recipientId ?? 0, name: activity.recipient?.name ?? '' },
            });
          } else {
            sheets.compose({ kind: 'status', activityId: activity.id, initialText });
          }
        } catch (e) {
          toast.error(describeError(e).message);
        }
      },
    });
  }
  items.push(
    { key: 'copy', title: 'Copy Link', icon: menuIcons.copy, onPress: () => void copyLink(url) },
    { key: 'share', title: 'Share', icon: menuIcons.share, onPress: () => void Share.share({ url, message: url }) },
  );
  if (canDeleteActivity(activity, viewerId)) {
    items.push({
      kind: 'section',
      key: 'danger',
      items: [
        {
          key: 'delete',
          title: 'Delete',
          icon: menuIcons.delete,
          destructive: true,
          onPress: () =>
            Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  haptics.destructive();
                  del.mutate(
                    { id: activity.id },
                    {
                      onSuccess: () => {
                        toast('Activity deleted');
                        onDeleted?.();
                      },
                      onError: (e) => toast.error(describeError(e).message),
                    },
                  );
                },
              },
            ]),
        },
      ],
    });
  }
  return items;
}

/** The gray "•••" in the card header. */
export function ActivityMenuButton({ activity, onDeleted }: { activity: Activity; onDeleted?: () => void }) {
  const theme = useTheme();
  const items = useActivityMenuItems(activity, onDeleted);
  return (
    // Claims the RN responder so the touch that opens the menu doesn't also reach the card's
    // Pressable underneath (QA: "•••" on a list card navigated to the activity detail). The guard
    // sits outside the SwiftUI Host: touches inside it resolve to the Host view, so a responder on
    // the RN child alone never fires. iOS only: the SwiftUI Menu handles the tap natively there,
    // while Android's trigger is an RN Pressable.
    <View
      collapsable={false}
      onStartShouldSetResponder={IS_IOS ? () => true : undefined}
      onResponderTerminationRequest={IS_IOS ? () => false : undefined}>
      <NativeMenu items={items} accessibilityLabel="More actions">
        <View style={styles.more} accessibilityRole="button" accessibilityLabel="More actions">
          <Icon name={activityIcons.more} size={16} color={theme.colors.textSecondary} />
        </View>
      </NativeMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  more: { paddingHorizontal: 4, paddingVertical: 4 },
});
