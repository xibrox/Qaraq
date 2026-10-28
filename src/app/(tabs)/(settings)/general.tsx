import { router } from 'expo-router';

import {
  SettingsButtonRow,
  SettingsCheckRow,
  SettingsDestructiveRow,
  SettingsForm,
  SettingsNavigationRow,
  SettingsSection,
  SettingsValueRow,
  type SettingsOption,
} from '@/components/settings';
import { confirm } from '@/components/settings/confirm';
import { useImageCache } from '@/components/settings/image-cache';
import { settingsIcons } from '@/components/settings/settings-icons';
import { toast } from '@/components/toast';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import {
  ACCENT_COLOR_LABELS,
  ACCENT_COLORS,
  ACTIVITY_FEED_LABELS,
  ACTIVITY_FEEDS,
  ACTIVITY_FILTER_LABELS,
  ACTIVITY_FILTERS,
  APP_TAB_LABELS,
  APP_TABS,
  MEDIA_TYPE_LABELS,
  MEDIA_TYPES,
  PREFERRED_TITLE_LABELS,
  PREFERRED_TITLE_SUBTITLES,
  PREFERRED_TITLES,
  resetSettings,
  setSetting,
  THEME_BACKGROUND_LABELS,
  THEME_BACKGROUNDS,
  TOOLBAR_STYLE_LABELS,
  TOOLBAR_STYLE_SUBTITLES,
  TOOLBAR_STYLES,
  updateHaptics,
  useSettings,
  type AccentColor,
  type ActivityFeed,
  type ActivityFilter,
  type AppTab,
  type MediaType,
  type PreferredTitle,
  type ThemeBackground,
  type ToolbarStyle,
} from '@/settings';
import { ACCENT_HEX, BACKGROUND_HEX } from '@/theme';

function labelled<T extends string>(values: readonly T[], labels: Record<T, string>, subtitles?: Record<T, string>) {
  return values.map((value): SettingsOption<T> => ({ value, label: labels[value], subtitle: subtitles?.[value] }));
}

const MEDIA_OPTIONS = labelled<MediaType>(MEDIA_TYPES, MEDIA_TYPE_LABELS);
const TAB_OPTIONS = labelled<AppTab>(APP_TABS, APP_TAB_LABELS);
const FEED_OPTIONS = labelled<ActivityFeed>(ACTIVITY_FEEDS, ACTIVITY_FEED_LABELS);
const FILTER_OPTIONS = labelled<ActivityFilter>(ACTIVITY_FILTERS, ACTIVITY_FILTER_LABELS);
const TITLE_OPTIONS = labelled<PreferredTitle>(PREFERRED_TITLES, PREFERRED_TITLE_LABELS, PREFERRED_TITLE_SUBTITLES);
const TOOLBAR_OPTIONS = labelled<ToolbarStyle>(TOOLBAR_STYLES, TOOLBAR_STYLE_LABELS, TOOLBAR_STYLE_SUBTITLES);

/** All 12 accents are free in Qaraq (AniClient crowns half of them as PRO). */
const COLOR_OPTIONS = ACCENT_COLORS.map(
  (value): SettingsOption<AccentColor> => ({ value, label: ACCENT_COLOR_LABELS[value], swatch: ACCENT_HEX[value] }),
);

/** "System" has no single colour; a neutral gray swatch stands for "follows the OS". */
const SYSTEM_SWATCH = '#8E8E93';
const THEME_OPTIONS = THEME_BACKGROUNDS.map(
  (value): SettingsOption<ThemeBackground> => ({
    value,
    label: THEME_BACKGROUND_LABELS[value],
    swatch: value === 'system' ? SYSTEM_SWATCH : BACKGROUND_HEX[value],
  }),
);

async function confirmReset() {
  const ok = await confirm({
    title: 'Reset App Settings',
    message: 'All app settings go back to their defaults. Your AniList account and lists are not affected.',
    confirmLabel: 'Reset',
    destructive: true,
  });
  if (!ok) return;
  resetSettings();
  haptics.success();
  toast.success('Settings reset');
}

/** "General Settings": every change applies immediately through the settings store. */
export default function GeneralSettingsScreen() {
  const s = useSettings((st) => ({
    defaultMediaType: st.defaultMediaType,
    defaultTab: st.defaultTab,
    defaultActivityFeed: st.defaultActivityFeed,
    defaultActivityFilter: st.defaultActivityFilter,
    accentColor: st.accentColor,
    theme: st.theme,
    blurAdultContent: st.blurAdultContent,
    vibration: st.haptics.enabled,
    preferredTitle: st.preferredTitle,
    toolbarStyle: st.toolbarStyle,
  }));
  const cache = useImageCache();

  const clearCache = async () => {
    await cache.clear();
    haptics.success();
    toast.success('Image cache cleared');
  };

  return (
    <SettingsForm>
      <SettingsSection title="App Launch Defaults">
        <SettingsValueRow
          title="Default Media"
          subtitle="Anime or Manga by default"
          value={s.defaultMediaType}
          options={MEDIA_OPTIONS}
          onChange={(v) => setSetting('defaultMediaType', v)}
        />
        <SettingsValueRow
          title="Default Tab"
          subtitle="Tab when the app starts"
          value={s.defaultTab}
          options={TAB_OPTIONS}
          onChange={(v) => setSetting('defaultTab', v)}
        />
        <SettingsValueRow
          title="Default Activity Feed"
          subtitle="Activity feed on profile"
          value={s.defaultActivityFeed}
          options={FEED_OPTIONS}
          menuTitle="Activity Feed Type"
          onChange={(v) => setSetting('defaultActivityFeed', v)}
        />
        <SettingsValueRow
          title="Default Activity Filter"
          subtitle="Activity filter on profile"
          value={s.defaultActivityFilter}
          options={FILTER_OPTIONS}
          onChange={(v) => setSetting('defaultActivityFilter', v)}
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsValueRow
          title="Color"
          icon={settingsIcons.color}
          value={s.accentColor}
          options={COLOR_OPTIONS}
          onChange={(v) => setSetting('accentColor', v)}
        />
        <SettingsValueRow
          title="Theme"
          icon={settingsIcons.theme}
          value={s.theme}
          options={THEME_OPTIONS}
          onChange={(v) => setSetting('theme', v)}
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsCheckRow
          title="Blur 18+ Content"
          icon={settingsIcons.blur}
          checked={s.blurAdultContent}
          onToggle={(v) => setSetting('blurAdultContent', v)}
        />
        <SettingsCheckRow
          title="Vibration"
          icon={settingsIcons.vibration}
          checked={s.vibration}
          onToggle={(v) => {
            updateHaptics({ enabled: v });
            if (v) haptics.selection();
          }}
        />
        <SettingsValueRow
          title="Preferred Title"
          icon={settingsIcons.preferredTitle}
          value={s.preferredTitle}
          options={TITLE_OPTIONS}
          onChange={(v) => setSetting('preferredTitle', v)}
        />
        <SettingsValueRow
          title="Toolbar Style"
          icon={settingsIcons.toolbarStyle}
          value={s.toolbarStyle}
          options={TOOLBAR_OPTIONS}
          onChange={(v) => setSetting('toolbarStyle', v)}
        />
      </SettingsSection>

      <SettingsSection title="Other">
        <SettingsNavigationRow title="Gestures" icon={settingsIcons.gestures} onPress={() => router.push(hrefs.settings.gestures())} />
        <SettingsNavigationRow title="More Settings" icon={settingsIcons.more} onPress={() => router.push(hrefs.settings.more())} />
      </SettingsSection>

      <SettingsSection>
        <SettingsButtonRow
          title="Clear Image Cache"
          value={cache.clearing ? 'Clearing...' : cache.label}
          disabled={cache.clearing}
          onPress={() => void clearCache()}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsDestructiveRow title="Reset App Settings" align="center" onPress={() => void confirmReset()} />
      </SettingsSection>
    </SettingsForm>
  );
}
