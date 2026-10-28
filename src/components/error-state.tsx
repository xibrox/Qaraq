import type { StyleProp, ViewStyle } from 'react-native';

import { AniListError } from '@/api/client';

import { EmptyState } from './empty-state';
import { icons } from './icon';

/** Human-readable message for an AniList/network error. */
export function describeError(error: unknown): { title: string; message: string } {
  if (error instanceof AniListError) {
    switch (error.kind) {
      case 'network':
        return { title: 'You are offline', message: 'Check your connection and try again.' };
      case 'rate_limited':
        return { title: 'Too many requests', message: 'AniList is rate limiting requests. Try again in a minute.' };
      case 'not_found':
        return { title: 'Not found', message: 'This page no longer exists on AniList.' };
      case 'unauthorized':
        return { title: 'Signed out', message: 'Your AniList session expired. Sign in again.' };
      default:
        return { title: 'Something went wrong', message: error.message || 'AniList returned an error.' };
    }
  }
  return {
    title: 'Something went wrong',
    message: error instanceof Error && error.message ? error.message : 'Please try again.',
  };
}

export type ErrorStateProps = {
  error: unknown;
  /** Shows a "Try Again" button. */
  onRetry?: () => void;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Error placeholder with retry. */
export function ErrorState({ error, onRetry, fill = true, style }: ErrorStateProps) {
  const { title, message } = describeError(error);
  return (
    <EmptyState
      icon={icons.warning}
      title={title}
      message={message}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
      fill={fill}
      style={style}
    />
  );
}
