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

/**
 * Leading row icons for the Settings screens (SF Symbol on iOS, Material Symbol on Android). The
 * colour fills the iOS icon tile, like the iPhone Settings app.
 */
export const settingsIcons = {
  general: { ios: 'gearshape.fill', android: Settings, color: '#8E8E93' },
  notifications: { ios: 'bell.badge.fill', android: Notifications, color: '#FF3B30' },
  anilist: { ios: 'a.square', android: AccountCircle, color: '#02A9FF' },
  whatsNew: { ios: 'newspaper.fill', android: Campaign, color: '#FF9500' },
  rateApp: { ios: 'star.fill', android: Star, color: '#FFCC00' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: Logout, color: '#FF3B30' },
  signIn: { ios: 'person.crop.circle.fill.badge.plus', android: Login, color: '#007AFF' },
  color: { ios: 'paintbrush.pointed.fill', android: Brush, color: '#AF52DE' },
  theme: { ios: 'paintpalette.fill', android: Palette, color: '#5856D6' },
  blur: { ios: 'circle.grid.3x3', android: BlurOn, color: '#30B0C7' },
  vibration: { ios: 'iphone.radiowaves.left.and.right', android: MobileVibrate, color: '#FF2D55' },
  preferredTitle: { ios: 'character.textbox', android: Translate, color: '#007AFF' },
  toolbarStyle: { ios: 'menubar.rectangle', android: Toolbar, color: '#5AC8FA' },
  gestures: { ios: 'hand.tap.fill', android: Gesture, color: '#34C759' },
  more: { ios: 'gearshape.2.fill', android: Tune, color: '#8E8E93' },
} as const satisfies Record<string, SettingsIcon>;
