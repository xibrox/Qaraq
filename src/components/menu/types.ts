import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Menu item icon: an SF Symbol on iOS and an image source on Android
 * (`import Check from '@expo/material-symbols/check.xml'`). Either side may be omitted.
 */
export type MenuIcon = { ios?: SFSymbol; android?: ImageSourcePropType };

export type MenuAction = {
  kind?: 'action';
  key: string;
  title: string;
  /** Gray second line ("AniList title settings", "(55/100)"). */
  subtitle?: string;
  icon?: MenuIcon;
  /** `true` shows a checkmark (selected option); `false` reserves the check column. */
  checked?: boolean;
  /** Colour swatch shown as the leading icon (Color / Theme pickers). */
  swatch?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

/** Inline group with an optional small gray header ("Activity Feed Type"). */
export type MenuSection = {
  kind: 'section';
  key: string;
  title?: string;
  items: MenuEntry[];
};

/** Nested submenu. */
export type MenuSubmenu = {
  kind: 'submenu';
  key: string;
  title: string;
  icon?: MenuIcon;
  items: MenuEntry[];
};

export type MenuEntry = MenuAction | MenuSection | MenuSubmenu;

export type NativeMenuProps = {
  /** RN trigger content (button, pill, row). Don't give it its own onPress. */
  children: ReactNode;
  items: MenuEntry[];
  /** Small gray header at the top of the menu. */
  title?: string;
  /** Open on tap (default, pull-down menu) or long press (context menu). */
  trigger?: 'press' | 'longPress';
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** Spoken label for the trigger (the native menu button otherwise has an empty label on iOS). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Build single-choice options for a picker-style menu. */
export function choiceItems<T extends string | number>(
  options: readonly { value: T; label: string; subtitle?: string; swatch?: string; icon?: MenuIcon }[],
  selected: T,
  onSelect: (value: T) => void,
): MenuAction[] {
  return options.map((o) => ({
    key: String(o.value),
    title: o.label,
    subtitle: o.subtitle,
    swatch: o.swatch,
    icon: o.icon,
    checked: o.value === selected,
    onPress: () => onSelect(o.value),
  }));
}
