import { Button, ContextMenu, Host, Menu, RNHostView, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { accessibilityLabel as a11yLabel, disabled as disabledModifier, foregroundStyle, tint } from '@expo/ui/swift-ui/modifiers';
import type { ReactElement } from 'react';

import { useTheme } from '@/theme';

import type { MenuAction, MenuEntry, NativeMenuProps } from './types';

function actionLabel(a: MenuAction): ReactElement[] | undefined {
  if (!a.subtitle) return undefined;
  return [
    <Text key="t">{a.title}</Text>,
    <Text key="s" modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
      {a.subtitle}
    </Text>,
  ];
}

function renderEntry(entry: MenuEntry): ReactElement | null {
  if (entry.kind === 'section') {
    return (
      <Section key={entry.key} title={entry.title}>
        {entry.items.map(renderEntry)}
      </Section>
    );
  }
  if (entry.kind === 'submenu') {
    return (
      <Menu key={entry.key} label={entry.title} systemImage={entry.icon?.ios}>
        {entry.items.map(renderEntry)}
      </Menu>
    );
  }
  const modifiers = [];
  if (entry.disabled) modifiers.push(disabledModifier(true));
  if (entry.swatch) modifiers.push(tint(entry.swatch));
  const systemImage = entry.swatch ? 'circle.fill' : entry.icon?.ios;
  const children = actionLabel(entry);

  if (entry.checked !== undefined) {
    return (
      <Toggle
        key={entry.key}
        label={children ? undefined : entry.title}
        systemImage={systemImage}
        isOn={entry.checked}
        onIsOnChange={() => entry.onPress?.()}
        modifiers={modifiers}>
        {children}
      </Toggle>
    );
  }
  return (
    <Button
      key={entry.key}
      label={children ? undefined : entry.title}
      systemImage={systemImage}
      role={entry.destructive ? 'destructive' : undefined}
      onPress={entry.onPress}
      modifiers={modifiers}>
      {children}
    </Button>
  );
}

/**
 * Native pull-down menu (SwiftUI `Menu`, or `ContextMenu` for long press) anchored to an RN
 * trigger. Matches the iOS UIMenu look in AniClient: blurred rounded panel, leading checkmarks,
 * gray subtitles, optional gray header.
 */
export function NativeMenu({ children, items, title, trigger = 'press', disabled, accessibilityLabel, style, testID }: NativeMenuProps) {
  const theme = useTheme();
  const body = items.map(renderEntry);
  const content = title ? <Section title={title}>{body}</Section> : body;
  const modifiers = [...(disabled ? [disabledModifier(true)] : []), ...(accessibilityLabel ? [a11yLabel(accessibilityLabel)] : [])];
  const label = (
    <RNHostView matchContents>
      <>{children}</>
    </RNHostView>
  );
  return (
    <Host matchContents style={style} testID={testID} colorScheme={theme.scheme} ignoreSafeArea="all">
      {trigger === 'longPress' ? (
        <ContextMenu modifiers={modifiers.length ? modifiers : undefined}>
          <ContextMenu.Trigger>{label}</ContextMenu.Trigger>
          <ContextMenu.Items>{content}</ContextMenu.Items>
        </ContextMenu>
      ) : (
        <Menu label={label} modifiers={modifiers.length ? modifiers : undefined}>
          {content}
        </Menu>
      )}
    </Host>
  );
}

export type { MenuAction, MenuEntry, MenuIcon, MenuSection, MenuSubmenu, NativeMenuProps } from './types';
export { choiceItems } from './types';
