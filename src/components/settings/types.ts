import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { MenuIcon } from '@/components/menu/types';

/**
 * Shared props for the native settings primitives (`settings-list.ios.tsx` = SwiftUI `Form`,
 * `settings-list.android.tsx` = Compose, `settings-list.tsx` = RN fallback for web).
 *
 * AniClient look (docs/aniclient-ui-spec.md §8): inset grouped cards, ~44pt rows, monochrome
 * leading icons, title + gray subtitle, value + ⇕ pull-down menus, trailing checkmarks instead
 * of switches (except Airing "Enable"), red destructive rows.
 *
 * Icons use `MenuIcon`: an SF Symbol on iOS and an XML image source on Android
 * (`import Bell from '@expo/material-symbols/notifications.xml'`). Either side may be omitted.
 */
export type SettingsIcon = MenuIcon;

export type SettingsFormProps = {
  /** `SettingsSection` elements. */
  children: ReactNode;
  /** Small centered gray footer under the last section ("v1.9.5"). */
  footer?: string;
  /** Style for the root host (default `flex: 1`). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type SettingsSectionProps = {
  /** Section header ("App Launch Defaults", "Appearance"). Not uppercased. */
  title?: string;
  /** Gray footnote under the card. */
  footer?: string;
  /** Rows. */
  children: ReactNode;
};

type RowBase = {
  title: string;
  /** Gray second line under the title ("Anime or Manga by default"). */
  subtitle?: string;
  icon?: SettingsIcon;
  disabled?: boolean;
  testID?: string;
};

/** "General ›": pushes a screen. Optional trailing gray value. */
export type SettingsNavigationRowProps = RowBase & {
  value?: string;
  onPress: () => void;
};

/** Option of a pull-down value row. */
export type SettingsOption<T extends string> = {
  value: T;
  label: string;
  /** Gray subtitle inside the menu ("AniList title settings", "(55/100)"). */
  subtitle?: string;
  /** Colour swatch (Color / Theme pickers); the row's value then shows the swatch. */
  swatch?: string;
};

/** "Default Media   Anime ⇕": a native pull-down menu with a leading checkmark on the current option. */
export type SettingsValueRowProps<T extends string> = RowBase & {
  value: T;
  options: readonly SettingsOption<T>[];
  onChange: (value: T) => void;
  /** Small gray header inside the menu. */
  menuTitle?: string;
};

/** AniClient boolean row: trailing ✓ when on. Tapping toggles. */
export type SettingsCheckRowProps = RowBase & {
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

/** Native switch row (only Airing Notifications "Enable" in AniClient). */
export type SettingsSwitchRowProps = RowBase & {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/** Title alignment of a button row: `leading` (default) or `center` ("Reset Anime Gestures"). */
export type SettingsRowAlignment = 'leading' | 'center';

/** Plain tappable row without chevron ("Discord", "Rate App", "Clear Image Cache   17.85 MB"). */
export type SettingsButtonRowProps = RowBase & {
  value?: string;
  onPress: () => void;
  /** `center` draws a centered title only (icon, subtitle and value are ignored). */
  align?: SettingsRowAlignment;
};

/** Red row ("Sign Out", "Reset App Settings", "Delete Account"). Confirm in `onPress`. */
export type SettingsDestructiveRowProps = Omit<RowBase, 'subtitle'> & {
  onPress: () => void;
  /** `center` for the full-width "Reset App Settings" / "Delete Account" cards. */
  align?: SettingsRowAlignment;
};

/** Read-only row: title (+ subtitle) and an optional trailing value. */
export type SettingsTextRowProps = RowBase & {
  value?: string;
};

/**
 * Centered native segmented control placed directly in `SettingsForm` (not inside a section),
 * e.g. the Gesture Settings "Anime | Manga" switch.
 */
export type SettingsSegmentedRowProps<T extends string> = {
  segments: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * Arbitrary RN content as a row (PRO banner, gesture preview, custom list editor field).
 * Must be a single element; it is hosted with `RNHostView` on iOS/Android.
 */
export type SettingsCustomRowProps = {
  children: ReactElement;
  /** Remove the row's card background/insets (iOS `listRowBackground` clear). */
  bare?: boolean;
};
