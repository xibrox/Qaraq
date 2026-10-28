import type { IconName } from '@/components/icon';

/** Icons used by the profile and notifications screens. */
export const profileIcons = {
  info: { ios: 'info', android: 'info' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  person: { ios: 'person.fill', android: 'person' },
  following: { ios: 'figure.walk', android: 'directions_walk' },
  global: { ios: 'globe', android: 'public' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_alt' },
  caretDown: { ios: 'arrowtriangle.down.fill', android: 'arrow_drop_down' },
  bell: { ios: 'bell', android: 'notifications' },
  signIn: { ios: 'person.crop.circle', android: 'account_circle' },
} as const satisfies Record<string, IconName>;
