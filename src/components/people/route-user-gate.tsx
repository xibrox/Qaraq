import type { ReactNode } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { icons } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';

import { useRouteUserId } from './use-route-user-id';

/** Resolves a `[userId]` route param (id or username) before rendering the screen. */
export function RouteUserGate({ param, children }: { param: string | string[] | undefined; children: (userId: number) => ReactNode }) {
  const user = useRouteUserId(param);
  switch (user.status) {
    case 'ready':
      return children(user.id);
    case 'loading':
      return <LoadingState />;
    case 'error':
      return <ErrorState error={user.error} onRetry={user.retry} />;
    case 'missing':
      return <EmptyState icon={icons.person} title="User not found" />;
  }
}
