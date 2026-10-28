import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { menuIcons } from '@/components/activity/menu-icons';
import { AppText } from '@/components/app-text';
import { Icon, type IconName } from '@/components/icon';
import { NativeMenu } from '@/components/menu/native-menu';
import { choiceItems, type MenuIcon } from '@/components/menu/types';
import { haptics } from '@/lib/haptics';
import { ACTIVITY_FEED_LABELS, ACTIVITY_FEEDS, ACTIVITY_FILTER_LABELS, ACTIVITY_FILTERS, type ActivityFeed, type ActivityFilter } from '@/settings';
import { useTheme } from '@/theme';

import { profileIcons } from './profile-icons';

const FEED_ICON: Record<ActivityFeed, IconName> = {
  mine: profileIcons.person,
  following: profileIcons.following,
  global: profileIcons.global,
};

const FEED_MENU_ICON: Record<ActivityFeed, MenuIcon> = {
  mine: menuIcons.feedMine,
  following: menuIcons.feedFollowing,
  global: menuIcons.feedGlobal,
};

export type ActivityFeedToolbarProps = {
  feed: ActivityFeed;
  onFeedChange: (feed: ActivityFeed) => void;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  /** Hidden on other users' profiles (their feed is always their own activity). */
  showFeedMenu?: boolean;
};

/** Activity tab toolbar: "[icon] Following ▾" (Activity Feed Type) and the "[funnel] ▾" filter. */
export function ActivityFeedToolbar({ feed, onFeedChange, filter, onFilterChange, showFeedMenu = true }: ActivityFeedToolbarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const select = <T,>(fn: (v: T) => void) => (v: T) => {
    haptics.selection();
    fn(v);
  };
  const feedOptions = ACTIVITY_FEEDS.map((f) => ({ value: f, label: ACTIVITY_FEED_LABELS[f], icon: FEED_MENU_ICON[f] }));
  const filterOptions = ACTIVITY_FILTERS.map((f) => ({ value: f, label: ACTIVITY_FILTER_LABELS[f] }));
  const pill = [styles.pill, { backgroundColor: c.surface, borderRadius: theme.radii.md }];

  return (
    <View style={styles.row}>
      {showFeedMenu ? (
        <NativeMenu
          title="Activity Feed Type"
          items={choiceItems(feedOptions, feed, select(onFeedChange))}
          accessibilityLabel={`Activity feed: ${ACTIVITY_FEED_LABELS[feed]}`}>
          <View style={pill} accessibilityRole="button" accessibilityLabel={`Activity feed: ${ACTIVITY_FEED_LABELS[feed]}`}>
            <Icon name={FEED_ICON[feed]} size={14} color={c.textSecondary} />
            <AppText variant="subheadline" weight="600" tone="secondary">
              {ACTIVITY_FEED_LABELS[feed]}
            </AppText>
            <Icon name={profileIcons.caretDown} size={9} color={c.textSecondary} />
          </View>
        </NativeMenu>
      ) : (
        <View />
      )}
      <NativeMenu
        title="Activity Filter"
        items={choiceItems(filterOptions, filter, select(onFilterChange))}
        accessibilityLabel={`Activity filter: ${ACTIVITY_FILTER_LABELS[filter]}`}>
        <View style={pill} accessibilityRole="button" accessibilityLabel={`Activity filter: ${ACTIVITY_FILTER_LABELS[filter]}`}>
          <FunnelGlyph size={14} color={filter === 'all' ? c.textSecondary : c.accent} />
          {filter !== 'all' ? (
            <AppText variant="subheadline" weight="600" tone="secondary">
              {ACTIVITY_FILTER_LABELS[filter]}
            </AppText>
          ) : null}
          <Icon name={profileIcons.caretDown} size={9} color={c.textSecondary} />
        </View>
      </NativeMenu>
    </View>
  );
}

/**
 * AniClient's filled funnel. SF Symbols has no funnel (only `line.3.horizontal.decrease`), so it is
 * drawn here (Material `filter_alt` path) and looks the same on both platforms.
 */
function FunnelGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        fill={color}
        d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 10 },
});
