import { createContext, use, useState, type ReactNode } from 'react';

import { ComposeSheet, type ComposeTarget } from './compose-sheet';
import { LikersSheet, type LikersTarget } from './likers-sheet';

export type ActivitySheets = {
  /** Opens the likers list for an activity or reply. */
  showLikers: (target: LikersTarget) => void;
  /** Opens the compose sheet (new/edit status, message). */
  compose: (target: ComposeTarget) => void;
};

const ActivitySheetsContext = createContext<ActivitySheets | null>(null);

/**
 * Hosts one likers sheet and one compose sheet per screen, so feed cards don't each mount a
 * native sheet. Wrap any screen that renders `ActivityCard`s.
 */
export function ActivitySheetsProvider({ children }: { children: ReactNode }) {
  const [likers, setLikers] = useState<LikersTarget | null>(null);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);
  const value: ActivitySheets = { showLikers: setLikers, compose: setComposeTarget };
  return (
    <ActivitySheetsContext value={value}>
      {children}
      <LikersSheet target={likers} onDismiss={() => setLikers(null)} />
      <ComposeSheet target={composeTarget} onDismiss={() => setComposeTarget(null)} />
    </ActivitySheetsContext>
  );
}

const NOOP: ActivitySheets = { showLikers: () => {}, compose: () => {} };

/** Sheet openers from the nearest `ActivitySheetsProvider` (no-ops without one). */
export function useActivitySheets(): ActivitySheets {
  return use(ActivitySheetsContext) ?? NOOP;
}
