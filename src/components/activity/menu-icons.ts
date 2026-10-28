import ContentCopy from '@expo/material-symbols/content_copy.xml';
import Delete from '@expo/material-symbols/delete.xml';
import DirectionsWalk from '@expo/material-symbols/directions_walk.xml';
import Edit from '@expo/material-symbols/edit.xml';
import FilterList from '@expo/material-symbols/filter_list.xml';
import Mail from '@expo/material-symbols/mail.xml';
import MoreHoriz from '@expo/material-symbols/more_horiz.xml';
import Notifications from '@expo/material-symbols/notifications.xml';
import NotificationsOff from '@expo/material-symbols/notifications_off.xml';
import OpenInNew from '@expo/material-symbols/open_in_new.xml';
import Person from '@expo/material-symbols/person.xml';
import PersonAdd from '@expo/material-symbols/person_add.xml';
import PersonRemove from '@expo/material-symbols/person_remove.xml';
import Public from '@expo/material-symbols/public.xml';
import Reply from '@expo/material-symbols/reply.xml';
import Share from '@expo/material-symbols/share.xml';

import type { MenuIcon } from '@/components/menu/types';

/** Native menu icons (SF Symbol on iOS, Material Symbol XML on Android) for activity/profile menus. */
export const menuIcons = {
  subscribe: { ios: 'bell', android: Notifications },
  unsubscribe: { ios: 'bell.slash', android: NotificationsOff },
  edit: { ios: 'pencil', android: Edit },
  copy: { ios: 'doc.on.doc', android: ContentCopy },
  share: { ios: 'square.and.arrow.up', android: Share },
  delete: { ios: 'trash', android: Delete },
  reply: { ios: 'arrowshape.turn.up.left', android: Reply },
  browser: { ios: 'safari', android: OpenInNew },
  message: { ios: 'envelope', android: Mail },
  follow: { ios: 'person.badge.plus', android: PersonAdd },
  unfollow: { ios: 'person.badge.minus', android: PersonRemove },
  feedMine: { ios: 'person.fill', android: Person },
  feedFollowing: { ios: 'figure.walk', android: DirectionsWalk },
  feedGlobal: { ios: 'globe', android: Public },
  filter: { ios: 'line.3.horizontal.decrease', android: FilterList },
} as const satisfies Record<string, MenuIcon>;

/** Android-only image sources for header toolbar buttons (iOS uses SF Symbol names). */
export const toolbarXml = { mail: Mail, more: MoreHoriz } as const;
