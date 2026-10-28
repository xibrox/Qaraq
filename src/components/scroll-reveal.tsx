import { createContext, useContext } from 'react';
import type { ViewInstance } from 'react-native';

/** Scrolls the enclosing list up until `view`'s top edge is visible below the nav bar. */
export type RevealTop = (view: ViewInstance | null) => void;

const ScrollRevealContext = createContext<RevealTop | null>(null);

export const ScrollRevealProvider = ScrollRevealContext.Provider;

/** The enclosing scroll container's reveal function (null outside one). */
export function useRevealTop(): RevealTop | null {
  return useContext(ScrollRevealContext);
}

const MARGIN = 8;

/**
 * Scrolls a container so `view`'s top is visible again. Collapsing an expanded description keeps
 * the scroll offset, which leaves the user deep in the content below; this scrolls back. Call it
 * from an event handler: `visibleTop` is the window y where content stops being covered by the
 * nav bar, `offset` reads the current content offset, `scrollTo` scrolls to an absolute offset.
 */
export function revealViewTop(
  view: ViewInstance | null,
  visibleTop: number,
  offset: () => number,
  scrollTo: (y: number) => void,
): void {
  // Two frames: the collapsed layout has to be committed before measuring.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      view?.measureInWindow((_x, y) => {
        const covered = visibleTop + MARGIN - y;
        if (covered > 0) scrollTo(offset() - covered);
      });
    }),
  );
}
