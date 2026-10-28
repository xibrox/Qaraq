import type { IconName } from '@/components/icon';

/** Icons used only by My List and the entry editor (shared ones live in `icons`). */
export const listIcons = {
  /** Leading toolbar glyph (lines with a vertical bar). */
  sidebar: { ios: 'list.bullet.indent', android: 'view_sidebar' },
  /** "⬍" sort pill glyph. */
  sortPill: { ios: 'chevron.up.chevron.down', android: 'unfold_more' },
  /** Decreasing bars on the sort-direction button. */
  bars: { ios: 'line.3.horizontal.decrease', android: 'sort' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  /** "⇄" button after the chips. */
  swap: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
  /** "≡" button on the quick editor (expands to the full editor). */
  expand: { ios: 'line.3.horizontal', android: 'menu' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  clear: { ios: 'xmark.circle.fill', android: 'cancel' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  signIn: { ios: 'person.crop.circle.badge.plus', android: 'person_add' },
  emptyList: { ios: 'rectangle.stack', android: 'stacks' },
  noResults: { ios: 'magnifyingglass', android: 'search_off' },
} as const satisfies Record<string, IconName>;
