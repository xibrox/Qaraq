import { SymbolView, type AndroidSymbol, type SymbolWeight } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useColors } from '@/theme';

/** A platform icon: an SF Symbol on iOS and a Material Symbol on Android/web. */
export type IconName = { ios: SFSymbol; android: AndroidSymbol };

export type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to the primary text colour. */
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Renders SF Symbols on iOS (expo-symbols) and Material Symbols on Android. */
export function Icon({ name, size = 20, color, weight = 'semibold', style, accessibilityLabel }: IconProps) {
  const colors = useColors();
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android }}
      size={size}
      tintColor={color ?? colors.text}
      weight={weight}
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    />
  );
}

/** Icons used across the app, named after their AniClient role. */
export const icons = {
  sidebar: { ios: 'sidebar.left', android: 'menu_open' },
  search: { ios: 'magnifyingglass', android: 'search' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  moreVertical: { ios: 'ellipsis', android: 'more_vert' },
  back: { ios: 'arrow.left', android: 'arrow_back' },
  close: { ios: 'xmark', android: 'close' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  upDown: { ios: 'chevron.up.chevron.down', android: 'unfold_more' },
  check: { ios: 'checkmark', android: 'check' },
  star: { ios: 'star.fill', android: 'star' },
  heart: { ios: 'heart', android: 'favorite' },
  heartFill: { ios: 'heart.fill', android: 'favorite' },
  sort: { ios: 'arrow.up.arrow.down', android: 'swap_vert' },
  sortDescending: { ios: 'line.3.horizontal.decrease', android: 'sort' },
  sortAscending: { ios: 'line.3.horizontal.decrease', android: 'sort' },
  swap: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
  filter: { ios: 'line.3.horizontal.decrease.circle', android: 'filter_list' },
  clearFilter: { ios: 'line.3.horizontal.decrease.circle.fill', android: 'filter_list_off' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  pencil: { ios: 'pencil', android: 'edit' },
  trash: { ios: 'trash', android: 'delete' },
  list: { ios: 'list.bullet', android: 'format_list_bulleted' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view' },
  mail: { ios: 'envelope', android: 'mail' },
  bell: { ios: 'bell', android: 'notifications' },
  gear: { ios: 'gearshape', android: 'settings' },
  info: { ios: 'info.circle', android: 'info' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  globe: { ios: 'globe', android: 'public' },
  person: { ios: 'person', android: 'person' },
  people: { ios: 'figure.walk', android: 'directions_walk' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  photo: { ios: 'photo', android: 'image' },
  tv: { ios: 'tv', android: 'tv' },
  book: { ios: 'book', android: 'menu_book' },
  comment: { ios: 'bubble.left', android: 'chat_bubble' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
} as const satisfies Record<string, IconName>;
