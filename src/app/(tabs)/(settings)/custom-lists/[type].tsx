import { router, Stack, useLocalSearchParams } from 'expo-router';

import { useUpdateUser, useViewer } from '@/api/queries/hooks';
import { useIsSignedIn } from '@/auth';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { CustomListEditor } from '@/components/settings/custom-list-editor';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs, mediaTypeFromSlug } from '@/navigation/hrefs';
import { MEDIA_TYPE_LABELS, syncCustomListSections } from '@/settings';
import { useTheme } from '@/theme';

/** "Anime Custom List" / "Manga Custom List": saved to AniList via UpdateUser `customLists`. */
export default function CustomListsScreen() {
  const { type: slug } = useLocalSearchParams<{ type: string }>();
  const type = mediaTypeFromSlug(slug);
  const groupedBackground = useTheme().colors.groupedBackground;
  const signedIn = useIsSignedIn();
  const viewer = useViewer({ enabled: signedIn });
  const update = useUpdateUser();
  const title = `${MEDIA_TYPE_LABELS[type]} Custom List`;

  const header = <Stack.Screen options={{ title }} />;

  if (!signedIn) {
    return (
      <>
        {header}
        <EmptyState
          style={{ backgroundColor: groupedBackground }}
          icon={icons.list}
          title="Not Signed In"
          message="Sign in with AniList to manage your custom lists."
          actionLabel="Sign In"
          onAction={() => router.push(hrefs.signIn())}
        />
      </>
    );
  }
  if (viewer.isPending) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }
  if (viewer.isError || !viewer.data) {
    return (
      <>
        {header}
        <ErrorState error={viewer.error} onRetry={() => void viewer.refetch()} />
      </>
    );
  }

  const listOptions = type === 'MANGA' ? viewer.data.mediaListOptions?.mangaList : viewer.data.mediaListOptions?.animeList;
  const lists = listOptions?.customLists ?? [];

  const save = (names: string[]) => {
    const unchanged = names.length === lists.length && names.every((n, i) => n === lists[i]);
    if (unchanged) {
      toast('No changes to save');
      return;
    }
    const customLists = { customLists: names };
    update.mutate(type === 'MANGA' ? { mangaListOptions: customLists } : { animeListOptions: customLists }, {
      onSuccess: () => {
        syncCustomListSections(type, names);
        haptics.success();
        toast.success('Custom lists saved');
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save custom lists'),
    });
  };

  return (
    <>
      {header}
      {/* Re-seed the editor whenever AniList returns a different set of lists (after a save). */}
      <CustomListEditor key={lists.join('\u0000')} lists={lists} saving={update.isPending} onSave={save} />
    </>
  );
}
