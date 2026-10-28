import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { APP_TAB_LABELS } from '@/settings/labels';
import type { AppTab } from '@/settings/types';

export type TabDefinition = {
  tab: AppTab;
  /** Route group folder under src/app (also the NativeTabs trigger name). */
  group: '(lists)' | '(explore)' | '(profile)' | '(settings)';
  /** Href of the tab root. */
  href: '/(tabs)/(lists)' | '/(tabs)/(explore)' | '/(tabs)/(profile)' | '/(tabs)/(settings)';
  /** Verbatim tab bar label. */
  label: string;
  sf: SFSymbol | { default: SFSymbol; selected: SFSymbol };
  md: AndroidSymbol;
};

/** The four AniClient tabs, in tab-bar order. */
export const TABS: readonly TabDefinition[] = [
  {
    tab: 'lists',
    group: '(lists)',
    href: '/(tabs)/(lists)',
    label: APP_TAB_LABELS.lists,
    sf: { default: 'rectangle.stack', selected: 'rectangle.stack.fill' },
    md: 'stacks',
  },
  {
    tab: 'explore',
    group: '(explore)',
    href: '/(tabs)/(explore)',
    label: APP_TAB_LABELS.explore,
    sf: 'magnifyingglass',
    md: 'search',
  },
  {
    tab: 'profile',
    group: '(profile)',
    href: '/(tabs)/(profile)',
    label: APP_TAB_LABELS.profile,
    sf: { default: 'person', selected: 'person.fill' },
    md: 'person',
  },
  {
    tab: 'settings',
    group: '(settings)',
    href: '/(tabs)/(settings)',
    label: APP_TAB_LABELS.settings,
    sf: { default: 'gearshape', selected: 'gearshape.fill' },
    md: 'settings',
  },
];

export function tabDefinition(tab: AppTab): TabDefinition {
  return TABS.find((t) => t.tab === tab) ?? TABS[0];
}
