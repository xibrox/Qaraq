import { NativeTabs } from 'expo-router/native-tabs';

import { useUnreadNotificationCount } from '@/api/queries/hooks';
import { useIsSignedIn } from '@/auth';
import { TABS } from '@/navigation/tabs';
import { useToolbarAppearance } from '@/navigation/toolbar-appearance';
import { useSetting } from '@/settings/store';
import { useTheme } from '@/theme';

/**
 * The four AniClient tabs ("My List", "Explore", "Profile", "Settings") as native tabs:
 * Liquid Glass on iOS 26+, a UITabBar on older iOS, Material 3 navigation bar on Android.
 *
 * "Toolbar Style" applies where the platform lets us draw the bar: Solid gives an opaque
 * `colors.header` bar, Glass a translucent/blurred one. On iOS 26 the system always draws glass.
 * The selected tab uses the accent (white by default, as in AniClient); others are gray.
 */
export default function AppTabs() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useToolbarAppearance();
  const signedIn = useIsSignedIn();
  const badgeEnabled = useSetting('notifications').badge;
  const { data: unread = 0 } = useUnreadNotificationCount({ enabled: signedIn && badgeEnabled });

  const showBadge = signedIn && badgeEnabled && unread > 0;
  const solid = appearance === 'solid';
  const label = { fontFamily: theme.fontFamily, fontSize: 11, fontWeight: '600' as const };

  return (
    <NativeTabs
      tintColor={c.accent}
      iconColor={{ default: c.textSecondary, selected: c.accent }}
      labelStyle={{ default: { ...label, color: c.textSecondary }, selected: { ...label, color: c.accent } }}
      backgroundColor={solid ? c.header : c.barBackground}
      blurEffect={solid ? 'none' : theme.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      disableTransparentOnScrollEdge={solid}
      shadowColor={solid ? 'transparent' : undefined}
      badgeBackgroundColor={c.danger}
      badgeTextColor="#FFFFFF"
      indicatorColor={c.accentMuted}
      rippleColor={c.fill}
      labelVisibilityMode="labeled"
      minimizeBehavior="never">
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.tab} name={t.group}>
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf} md={t.md} />
          {/* Only mount the badge when it has something to show: expo-router ignores `hidden`
              whenever the badge has children, so a hidden '0' badge would still be drawn. */}
          {t.tab === 'profile' && showBadge ? (
            <NativeTabs.Trigger.Badge>{unread > 99 ? '99+' : String(unread)}</NativeTabs.Trigger.Badge>
          ) : null}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
