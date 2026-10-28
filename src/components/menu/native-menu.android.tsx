import CheckIcon from '@expo/material-symbols/check.xml';
import {
  Box,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import { background, clip, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';
import { Fragment, useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme, type Theme } from '@/theme';

import type { MenuAction, MenuEntry, NativeMenuProps } from './types';

type Ctx = { theme: Theme; close: () => void; reserveCheck: boolean };

/** Does any action in this list show a checkmark? Then every row reserves the check column. */
function hasChecks(entries: MenuEntry[]): boolean {
  return entries.some((e) => (e.kind === 'section' || e.kind === 'submenu' ? hasChecks(e.items) : e.checked !== undefined));
}

function Header({ title, theme }: { title: string; theme: Theme }) {
  return (
    <DropdownMenuItem enabled={false}>
      <DropdownMenuItem.Text>
        <Text color={theme.colors.textSecondary} style={{ typography: 'labelMedium' }}>
          {title}
        </Text>
      </DropdownMenuItem.Text>
    </DropdownMenuItem>
  );
}

function ActionItem({ action, ctx }: { action: MenuAction; ctx: Ctx }) {
  const c = ctx.theme.colors;
  const textColor = action.destructive ? c.danger : c.text;
  const leading = action.checked ? (
    <Icon source={CheckIcon} tint={c.text} size={20} />
  ) : action.icon?.android ? (
    <Icon source={action.icon.android} tint={textColor} size={20} />
  ) : ctx.reserveCheck ? (
    <Box modifiers={[size(20, 20)]} />
  ) : null;
  return (
    <DropdownMenuItem
      enabled={!action.disabled}
      onClick={() => {
        ctx.close();
        action.onPress?.();
      }}>
      {leading ? <DropdownMenuItem.LeadingIcon>{leading}</DropdownMenuItem.LeadingIcon> : null}
      <DropdownMenuItem.Text>
        <Column>
          <Text color={textColor}>{action.title}</Text>
          {action.subtitle ? (
            <Text color={c.textSecondary} style={{ typography: 'bodySmall' }}>
              {action.subtitle}
            </Text>
          ) : null}
        </Column>
      </DropdownMenuItem.Text>
      {action.swatch ? (
        <DropdownMenuItem.TrailingIcon>
          <Box modifiers={[size(18, 18), clip(Shapes.Circle), background(action.swatch)]} />
        </DropdownMenuItem.TrailingIcon>
      ) : null}
    </DropdownMenuItem>
  );
}

/**
 * Compose has no nested menus, so sections and submenus are flattened into header + items,
 * separated by dividers.
 */
function renderEntries(entries: MenuEntry[], ctx: Ctx): ReactElement[] {
  return entries.map((entry, i) => {
    if (entry.kind === 'section' || entry.kind === 'submenu') {
      return (
        <Fragment key={entry.key}>
          {i > 0 ? <HorizontalDivider color={ctx.theme.colors.separator} /> : null}
          {entry.title ? <Header title={entry.title} theme={ctx.theme} /> : null}
          {renderEntries(entry.items, ctx)}
        </Fragment>
      );
    }
    return <ActionItem key={entry.key} action={entry} ctx={ctx} />;
  });
}

/**
 * Material 3 dropdown menu (Compose `DropdownMenu`) anchored to an RN trigger. Opens on tap,
 * or on long press with `trigger="longPress"`.
 */
export function NativeMenu({ children, items, title, trigger = 'press', disabled, onOpen, onClose, accessibilityLabel, style, testID }: NativeMenuProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  // Items are only mounted once the menu has been opened: every Compose item is a native view, and
  // a screen of filter chips with hundreds of genre/tag/year items took seconds to push (and could
  // ANR a low-memory device). Kept mounted afterwards so the close animation still has content.
  const [built, setBuilt] = useState(false);

  const show = () => {
    if (disabled) return;
    if (trigger === 'longPress') haptics.heavy();
    setBuilt(true);
    setOpen(true);
    onOpen?.();
  };
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const ctx: Ctx | null = built ? { theme, close, reserveCheck: hasChecks(items) } : null;

  return (
    <Host matchContents style={style} colorScheme={theme.scheme}>
      <DropdownMenu expanded={open} onDismissRequest={close} color={theme.colors.surfaceElevated} cornerRadius={theme.radii.xl}>
        <DropdownMenu.Trigger>
          <RNHostView matchContents>
            <Pressable
              onPress={trigger === 'press' ? show : undefined}
              onLongPress={trigger === 'longPress' ? show : undefined}
              disabled={disabled}
              testID={testID}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ disabled, expanded: open }}>
              {children}
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {ctx && title ? <Header title={title} theme={theme} /> : null}
          {ctx ? renderEntries(items, ctx) : null}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}

export type { MenuAction, MenuEntry, MenuIcon, MenuSection, MenuSubmenu, NativeMenuProps } from './types';
export { choiceItems } from './types';
