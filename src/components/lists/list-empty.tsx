import { router } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import type { MediaType } from '@/api/types';
import { hrefs } from '@/navigation/hrefs';

import { listIcons } from './list-icons';

/** Guest mode: My List needs an AniList account. */
export function SignedOutState({ type }: { type: MediaType }) {
  return (
    <EmptyState
      icon={listIcons.signIn}
      title="Sign in to see your list"
      message={`Track your ${type === 'MANGA' ? 'manga' : 'anime'}, update progress with a swipe and sync everything with AniList.`}
      actionLabel="Sign In"
      onAction={() => router.push(hrefs.signIn())}
    />
  );
}

export type EmptySectionProps = {
  /** Section label ("Watching", "Peak"). */
  label: string;
  searching: boolean;
  type: MediaType;
};

/** Empty section or no search matches. */
export function EmptySection({ label, searching, type }: EmptySectionProps) {
  if (searching) {
    return <EmptyState icon={listIcons.noResults} title="No results" message={`Nothing in ${label} matches your search.`} fill={false} />;
  }
  return (
    <EmptyState
      icon={listIcons.emptyList}
      title={`${label} is empty`}
      message={`Find something to add in Explore.`}
      actionLabel={`Explore ${type === 'MANGA' ? 'Manga' : 'Anime'}`}
      onAction={() => router.navigate(hrefs.tab('explore'))}
      fill={false}
    />
  );
}
