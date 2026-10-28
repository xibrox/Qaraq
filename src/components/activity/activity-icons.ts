import type { IconName } from '@/components/icon';

/** Icons used only by the activity feed, cards and composer (shared ones live in `icons`). */
export const activityIcons = {
  comment: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' },
  replies: { ios: 'bubble.left.and.bubble.right', android: 'forum' },
  heart: { ios: 'heart', android: 'favorite_border' },
  heartFill: { ios: 'heart.fill', android: 'favorite' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  eyeSlash: { ios: 'eye.slash', android: 'visibility_off' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  send: { ios: 'arrow.up', android: 'arrow_upward' },
  lock: { ios: 'lock.fill', android: 'lock' },
  arrowRight: { ios: 'arrowtriangle.right.fill', android: 'arrow_right' },
  center: { ios: 'text.aligncenter', android: 'format_align_center' },
  bulletList: { ios: 'list.bullet', android: 'format_list_bulleted' },
  image: { ios: 'photo', android: 'image' },
  hideKeyboard: { ios: 'keyboard.chevron.compact.down', android: 'keyboard_hide' },
  person: { ios: 'person.fill', android: 'person' },
  following: { ios: 'figure.walk', android: 'directions_walk' },
  global: { ios: 'globe', android: 'public' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_alt' },
  pin: { ios: 'pin.fill', android: 'push_pin' },
} as const satisfies Record<string, IconName>;
