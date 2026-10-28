import AccountCircle from '@expo/material-symbols/account_circle.xml';
import BlurOn from '@expo/material-symbols/blur_on.xml';
import Brush from '@expo/material-symbols/brush.xml';
import Campaign from '@expo/material-symbols/campaign.xml';
import Gesture from '@expo/material-symbols/gesture.xml';
import Login from '@expo/material-symbols/login.xml';
import Logout from '@expo/material-symbols/logout.xml';
import MobileVibrate from '@expo/material-symbols/mobile_vibrate.xml';
import Notifications from '@expo/material-symbols/notifications.xml';
import Palette from '@expo/material-symbols/palette.xml';
import Settings from '@expo/material-symbols/settings.xml';
import Star from '@expo/material-symbols/star.xml';
import Toolbar from '@expo/material-symbols/toolbar.xml';
import Translate from '@expo/material-symbols/translate.xml';
import Tune from '@expo/material-symbols/tune.xml';

import type { SettingsIcon } from './types';

/** Leading row icons for the Settings screens (SF Symbol on iOS, Material Symbol on Android). */
export const settingsIcons = {
  general: { ios: 'gearshape', android: Settings },
  notifications: { ios: 'bell.badge', android: Notifications },
  anilist: { ios: 'a.square', android: AccountCircle },
  whatsNew: { ios: 'newspaper', android: Campaign },
  rateApp: { ios: 'star.fill', android: Star },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: Logout },
  signIn: { ios: 'person.crop.circle.badge.plus', android: Login },
  color: { ios: 'paintbrush.pointed', android: Brush },
  theme: { ios: 'paintpalette', android: Palette },
  blur: { ios: 'circle.grid.3x3', android: BlurOn },
  vibration: { ios: 'iphone.radiowaves.left.and.right', android: MobileVibrate },
  preferredTitle: { ios: 'character.textbox', android: Translate },
  toolbarStyle: { ios: 'menubar.rectangle', android: Toolbar },
  gestures: { ios: 'hand.tap', android: Gesture },
  more: { ios: 'gearshape.2', android: Tune },
} as const satisfies Record<string, SettingsIcon>;
