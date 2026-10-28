import AppTabs from '@/components/app-tabs';

/**
 * Anchor the tab navigator on My List so a cold launch to `/` opens it (instead of the
 * alphabetically first group) and Android back from another tab returns to My List first.
 * The "Default Tab" setting is applied on top of this by useLaunchRouting.
 */
export const unstable_settings = { anchor: '(lists)' };

/** NativeTabs with the four AniClient tabs; each tab group owns a native Stack. */
export default function TabsLayout() {
  return <AppTabs />;
}
