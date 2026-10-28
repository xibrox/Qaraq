import type { IconName } from '@/components/icon';

/** Extra icons for Explore / Search / Media detail (kept local; shared ones live in `icons`). */
export const mediaIcons = {
  play: { ios: 'play.fill', android: 'play_arrow' },
  playCircle: { ios: 'play.circle.fill', android: 'play_circle' },
  link: { ios: 'link', android: 'link' },
  eraser: { ios: 'eraser', android: 'ink_eraser' },
  typeList: { ios: 'line.3.horizontal', android: 'menu' },
  smiley: { ios: 'face.smiling', android: 'sentiment_satisfied' },
  thumbsUp: { ios: 'hand.thumbsup.fill', android: 'thumb_up' },
  thumbsUpOutline: { ios: 'hand.thumbsup', android: 'thumb_up' },
  thumbsDownOutline: { ios: 'hand.thumbsdown', android: 'thumb_down' },
  thumbsDown: { ios: 'hand.thumbsdown.fill', android: 'thumb_down' },
  clock: { ios: 'clock', android: 'schedule' },
  friends: { ios: 'person.2', android: 'group' },
  openExternal: { ios: 'arrow.up.right.square', android: 'open_in_new' },
  info: { ios: 'info.circle', android: 'info' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeSlash: { ios: 'eye.slash', android: 'visibility_off' },
  mic: { ios: 'mic', android: 'mic' },
  radioOn: { ios: 'largecircle.fill.circle', android: 'radio_button_checked' },
  radioOff: { ios: 'circle', android: 'radio_button_unchecked' },
} as const satisfies Record<string, IconName>;
