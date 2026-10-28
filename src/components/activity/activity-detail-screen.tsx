import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { flattenPages, useActivity, useActivityReplies, useSaveActivityReply } from '@/api/queries/hooks';
import type { ActivityRepliesQuery, ActivityReply } from '@/api/types';
import { useIsSignedIn } from '@/auth';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { describeError, ErrorState } from '@/components/error-state';
import { Icon } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { useToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useTheme } from '@/theme';

import { ActivityCard } from './activity-card';
import { activityIcons } from './activity-icons';
import { ActivitySheetsProvider } from './activity-sheets';
import { ReplyComposer } from './composer/reply-composer';
import { useMarkdownEditor } from './composer/use-markdown-editor';
import { ReplyRow } from './reply-row';
import { useKeyboardVisible } from './use-keyboard-visible';

/** "Activity" detail: the full card, "💬 Replies:", replies, and the pinned reply composer. */
export function ActivityDetailScreen({ id }: { id: number }) {
  return (
    <ActivitySheetsProvider>
      <ActivityDetail id={id} />
    </ActivitySheetsProvider>
  );
}

function ActivityDetail({ id }: { id: number }) {
  const theme = useTheme();
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const appearance = useToolbarAppearance();
  const headerHeight = useHeaderHeight();
  const keyboardVisible = useKeyboardVisible();
  const activity = useActivity(id);
  const replies = useActivityReplies(id);
  const save = useSaveActivityReply();
  const editor = useMarkdownEditor();
  const inputRef = useRef<TextInputInstance>(null);
  const listRef = useRef<FlatList<ActivityReply>>(null);
  const items = flattenPages<ActivityRepliesQuery, ActivityReply>(replies.data, (p) => p.Page.activityReplies);

  if (activity.isPending) return <LoadingState />;
  if (activity.isError) return <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />;
  const a = activity.data;
  if (!a) return <EmptyState title="Activity not found" message="It may have been deleted." />;

  const locked = !!a.isLocked;
  const send = () => {
    const text = editor.text.trim();
    if (!text) return;
    save.mutate(
      { activityId: id, text },
      {
        onSuccess: () => {
          haptics.success();
          editor.reset();
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 350);
        },
        onError: (e) => {
          haptics.error();
          toast.error(describeError(e).message);
        },
      },
    );
  };
  const mention = (name: string) => {
    editor.insert(`@${name} `);
    inputRef.current?.focus();
  };

  const header = (
    <View>
      <ActivityCard activity={a} collapsible={false} linkToDetail={false} onDeleted={() => router.back()} />
      <View style={styles.repliesLabel}>
        <Icon name={activityIcons.replies} size={15} color={theme.colors.textSecondary} />
        <AppText variant="label" tone="secondary">
          Replies:
        </AppText>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={appearance === 'solid' ? headerHeight : 0}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => <ReplyRow reply={item} onMention={signedIn && !locked ? mention : undefined} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          replies.isPending ? (
            <LoadingState fill={false} />
          ) : (
            <AppText tone="tertiary" align="center" style={styles.empty}>
              No replies yet
            </AppText>
          )
        }
        ListFooterComponent={replies.isFetchingNextPage ? <LoadingState fill={false} label="" /> : undefined}
        onEndReached={() => {
          if (replies.hasNextPage && !replies.isFetchingNextPage) void replies.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={activity.isRefetching || (replies.isRefetching && !replies.isFetchingNextPage)}
            onRefresh={() => {
              void activity.refetch();
              void replies.refetch();
            }}
            tintColor={theme.colors.textSecondary}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      />
      <SafeAreaView edges={keyboardVisible ? [] : ['bottom']} style={{ backgroundColor: theme.colors.background }}>
        <ReplyComposer
          editor={editor}
          inputRef={inputRef}
          onSend={send}
          sending={save.isPending}
          disabled={!signedIn || locked}
          placeholder={!signedIn ? 'Sign in to reply' : locked ? 'Replies are locked' : 'Write a reply...'}
          onDisabledPress={!signedIn ? () => router.push(hrefs.signIn()) : undefined}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 4, paddingBottom: 16 },
  repliesLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  empty: { paddingVertical: 24 },
});
