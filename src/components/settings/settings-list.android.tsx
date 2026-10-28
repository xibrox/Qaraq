import CheckIcon from '@expo/material-symbols/check.xml';
import ChevronRightIcon from '@expo/material-symbols/chevron_right.xml';
import UnfoldMoreIcon from '@expo/material-symbols/unfold_more.xml';
import {
  AlertDialog,
  Box,
  Card,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  RNHostView,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Switch,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  padding,
  Shapes,
  size,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import { useFocusEffect } from 'expo-router';
import { Children, Fragment, isValidElement, useCallback, useState, type ReactNode } from 'react';

import { haptics } from '@/lib/haptics';
import { useTheme, type Theme } from '@/theme';

import { registerConfirmHost, settleConfirm, useConfirmStore } from './confirm';

import type {
  SettingsButtonRowProps,
  SettingsCheckRowProps,
  SettingsCustomRowProps,
  SettingsDestructiveRowProps,
  SettingsFormProps,
  SettingsIcon,
  SettingsNavigationRowProps,
  SettingsOption,
  SettingsSectionProps,
  SettingsSegmentedRowProps,
  SettingsSwitchRowProps,
  SettingsTextRowProps,
  SettingsValueRowProps,
} from './types';

// Jetpack Compose (Material 3) settings: a LazyColumn of rounded cards, one per section.

type TextStyleProp = NonNullable<Parameters<typeof Text>[0]['style']>;

/** Compose text style in the app font (Nunito), so rows match the RN parts of the screen. */
function textStyle(theme: Theme, style: TextStyleProp = {}): TextStyleProp {
  return { fontFamily: theme.fontFamily, ...style };
}

/** Flatten fragments so dividers can be interleaved between real rows. */
function flattenRows(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') return;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      out.push(...flattenRows(child.props.children));
    } else {
      out.push(child);
    }
  });
  return out;
}

/**
 * Material 3 dialog for `confirm()` while this settings screen is focused (RN's `Alert` would
 * show the old AppCompat dialog). The destructive action is red.
 */
function ConfirmDialog() {
  const theme = useTheme();
  const c = theme.colors;
  const pending = useConfirmStore((st) => st.pending);
  useFocusEffect(useCallback(() => registerConfirmHost(), []));
  if (!pending) return null;
  return (
    <AlertDialog
      key={pending.id}
      onDismissRequest={() => settleConfirm(false)}
      colors={{ containerColor: c.surfaceElevated, titleContentColor: c.text, textContentColor: c.textSecondary }}>
      <AlertDialog.Title>
        <Text style={textStyle(theme, { typography: 'headlineSmall' })}>{pending.title}</Text>
      </AlertDialog.Title>
      {pending.message ? (
        <AlertDialog.Text>
          <Text style={textStyle(theme, { typography: 'bodyMedium' })}>{pending.message}</Text>
        </AlertDialog.Text>
      ) : null}
      <AlertDialog.ConfirmButton>
        <TextButton onClick={() => settleConfirm(true)} colors={{ contentColor: pending.destructive ? c.danger : c.accent }}>
          <Text style={textStyle(theme, { typography: 'labelLarge', fontWeight: '700' })}>{pending.confirmLabel ?? 'OK'}</Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
      <AlertDialog.DismissButton>
        <TextButton onClick={() => settleConfirm(false)} colors={{ contentColor: c.textSecondary }}>
          <Text style={textStyle(theme, { typography: 'labelLarge' })}>{pending.cancelLabel ?? 'Cancel'}</Text>
        </TextButton>
      </AlertDialog.DismissButton>
    </AlertDialog>
  );
}

export function SettingsForm({ children, footer, style, testID }: SettingsFormProps) {
  const theme = useTheme();
  return (
    <Host style={[{ flex: 1 }, style]} colorScheme={theme.scheme} seedColor={theme.colors.accent}>
      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        contentPadding={{ start: 16, end: 16, top: 8, bottom: 32 }}
        modifiers={[fillMaxSize(), background(theme.colors.groupedBackground), ...(testID ? [testIDModifier(testID)] : [])]}>
        {children}
        {footer ? (
          <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 8, 0, 0)]}>
            <Text color={theme.colors.textTertiary} style={textStyle(theme, { typography: 'bodySmall' })}>
              {footer}
            </Text>
          </Row>
        ) : null}
      </LazyColumn>
      {/* After the list: mounting it before would shift the LazyColumn's slot and reset its scroll. */}
      <ConfirmDialog />
    </Host>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const theme = useTheme();
  const rows = flattenRows(children);
  return (
    <Column modifiers={[fillMaxWidth(), padding(0, 8, 0, 0)]}>
      {title ? (
        <Text
          color={theme.colors.textMuted}
          style={textStyle(theme, { typography: 'titleSmall', fontWeight: '700' })}
          modifiers={[padding(4, 0, 4, 6)]}>
          {title}
        </Text>
      ) : null}
      {/* `groupedSurface`: white cards on #F2F2F7 in the light theme. */}
      <Card colors={{ containerColor: theme.colors.groupedSurface }} modifiers={[fillMaxWidth()]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <HorizontalDivider color={theme.colors.separator} /> : null}
            {row}
          </Fragment>
        ))}
      </Card>
      {footer ? (
        <Text color={theme.colors.textSecondary} style={textStyle(theme, { typography: 'bodySmall' })} modifiers={[padding(4, 6, 4, 0)]}>
          {footer}
        </Text>
      ) : null}
    </Column>
  );
}

function useRowColors() {
  const c = useTheme().colors;
  return {
    containerColor: 'transparent',
    contentColor: c.text,
    supportingContentColor: c.textSecondary,
    leadingContentColor: c.text,
    trailingContentColor: c.textSecondary,
  };
}

function LeadingIcon({ icon, tint }: { icon?: SettingsIcon; tint: string }) {
  if (!icon?.android) return null;
  return (
    <ListItem.LeadingContent>
      {/* Fixed box: the slot keeps its width while the vector icon is still loading. */}
      <Box modifiers={[size(22, 22)]}>
        <Icon source={icon.android} tint={tint} size={22} />
      </Box>
    </ListItem.LeadingContent>
  );
}

function Headline({ title, subtitle, color }: { title: string; subtitle?: string; color?: string }) {
  const theme = useTheme();
  return (
    <>
      <ListItem.HeadlineContent>
        <Text color={color} style={textStyle(theme, { typography: 'bodyLarge', fontWeight: '600' })}>
          {title}
        </Text>
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          <Text style={textStyle(theme, { typography: 'bodyMedium' })}>{subtitle}</Text>
        </ListItem.SupportingContent>
      ) : null}
    </>
  );
}

function tap(handler: () => void, disabled?: boolean) {
  return disabled ? [] : [clickable(handler)];
}

export function SettingsNavigationRow({ title, subtitle, icon, value, onPress, disabled }: SettingsNavigationRowProps) {
  const theme = useTheme();
  return (
    <ListItem colors={useRowColors()} modifiers={tap(onPress, disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 4 }}>
          {value ? (
            <Text color={theme.colors.textSecondary} style={textStyle(theme)}>
              {value}
            </Text>
          ) : null}
          <Icon source={ChevronRightIcon} tint={theme.colors.textTertiary} size={20} />
        </Row>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/** Full-width centered title ("Reset Anime Gestures", "Delete Account"). */
function CenteredRow({ title, color, onPress, disabled }: { title: string; color: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Row
      horizontalArrangement="center"
      verticalAlignment="center"
      modifiers={[fillMaxWidth(), ...tap(onPress, disabled), padding(16, 16, 16, 16)]}>
      <Text color={color} style={textStyle(theme, { typography: 'bodyLarge', fontWeight: '600' })}>
        {title}
      </Text>
    </Row>
  );
}

export function SettingsButtonRow({ title, subtitle, icon, value, onPress, disabled, align }: SettingsButtonRowProps) {
  const theme = useTheme();
  const rowColors = useRowColors();
  if (align === 'center') {
    return <CenteredRow title={title} color={theme.colors.text} onPress={onPress} disabled={disabled} />;
  }
  return (
    <ListItem colors={rowColors} modifiers={tap(onPress, disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      {/* Always mounted: re-adding a removed ListItem slot doesn't show up in Compose. */}
      <ListItem.TrailingContent>
        <Text color={theme.colors.textSecondary} style={textStyle(theme)}>
          {value ?? ''}
        </Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/** Colour dot with a thin outline, so black/white swatches stay visible on any surface. */
function Swatch({ color, diameter = 18 }: { color: string; diameter?: number }) {
  const outline = useTheme().colors.separator;
  return (
    <Box modifiers={[size(diameter, diameter), clip(Shapes.Circle), background(outline), padding(1, 1, 1, 1)]}>
      <Box modifiers={[fillMaxSize(), clip(Shapes.Circle), background(color)]} />
    </Box>
  );
}

function OptionItem<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: SettingsOption<T>;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  return (
    <DropdownMenuItem onClick={onSelect}>
      <DropdownMenuItem.LeadingIcon>
        {selected ? (
          <Icon source={CheckIcon} tint={theme.colors.text} size={20} />
        ) : (
          <Box modifiers={[size(20, 20)]} />
        )}
      </DropdownMenuItem.LeadingIcon>
      <DropdownMenuItem.Text>
        <Column>
          <Text color={theme.colors.text} style={textStyle(theme)}>
            {option.label}
          </Text>
          {option.subtitle ? (
            <Text color={theme.colors.textSecondary} style={textStyle(theme, { typography: 'bodySmall' })}>
              {option.subtitle}
            </Text>
          ) : null}
        </Column>
      </DropdownMenuItem.Text>
      {option.swatch ? (
        <DropdownMenuItem.TrailingIcon>
          <Swatch color={option.swatch} />
        </DropdownMenuItem.TrailingIcon>
      ) : null}
    </DropdownMenuItem>
  );
}

export function SettingsValueRow<T extends string>({
  title,
  subtitle,
  icon,
  value,
  options,
  onChange,
  menuTitle,
  disabled,
}: SettingsValueRowProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <ListItem colors={useRowColors()} modifiers={tap(() => setOpen(true), disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <DropdownMenu
          expanded={open}
          onDismissRequest={() => setOpen(false)}
          color={theme.colors.surfaceElevated}
          cornerRadius={theme.radii.xl}>
          <DropdownMenu.Trigger>
            <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 2 }}>
              {current?.swatch ? (
                <Swatch color={current.swatch} />
              ) : (
                <Text color={theme.colors.textSecondary} style={textStyle(theme)}>
                  {current?.label ?? ''}
                </Text>
              )}
              <Icon source={UnfoldMoreIcon} tint={theme.colors.textSecondary} size={18} />
            </Row>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {menuTitle ? (
              <DropdownMenuItem enabled={false}>
                <DropdownMenuItem.Text>
                  <Text color={theme.colors.textSecondary} style={textStyle(theme, { typography: 'labelMedium' })}>
                    {menuTitle}
                  </Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ) : null}
            {options.map((o) => (
              <OptionItem
                key={o.value}
                option={o}
                selected={o.value === value}
                onSelect={() => {
                  setOpen(false);
                  // Apply after the close reaches Compose: a theme/accent change re-renders the
                  // whole app, which would otherwise keep the menu open with the old check.
                  if (o.value !== value) setTimeout(() => onChange(o.value), 0);
                }}
              />
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function SettingsCheckRow({ title, subtitle, icon, checked, onToggle, disabled }: SettingsCheckRowProps) {
  const theme = useTheme();
  return (
    <ListItem colors={useRowColors()} modifiers={tap(() => onToggle(!checked), disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      {/*
        The slot stays mounted and only the tint changes: removing ListItem.TrailingContent and
        adding it back while the screen is mounted never shows the checkmark again.
      */}
      <ListItem.TrailingContent>
        <Icon source={CheckIcon} tint={checked ? theme.colors.accent : 'transparent'} size={22} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function SettingsSwitchRow({ title, subtitle, icon, value, onValueChange, disabled }: SettingsSwitchRowProps) {
  const theme = useTheme();
  return (
    <ListItem colors={useRowColors()} modifiers={tap(() => onValueChange(!value), disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <Switch
          value={value}
          enabled={!disabled}
          onCheckedChange={onValueChange}
          colors={{ checkedTrackColor: theme.colors.success, checkedThumbColor: '#FFFFFF' }}
        />
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function SettingsDestructiveRow({ title, icon, onPress, disabled, align }: SettingsDestructiveRowProps) {
  const theme = useTheme();
  const rowColors = useRowColors();
  if (align === 'center') {
    return <CenteredRow title={title} color={theme.colors.danger} onPress={onPress} disabled={disabled} />;
  }
  return (
    <ListItem colors={rowColors} modifiers={tap(onPress, disabled)}>
      <LeadingIcon icon={icon} tint={theme.colors.danger} />
      <Headline title={title} color={theme.colors.danger} />
    </ListItem>
  );
}

export function SettingsCustomRow({ children, bare }: SettingsCustomRowProps) {
  return (
    <Box modifiers={bare ? [fillMaxWidth()] : [fillMaxWidth(), padding(16, 10, 16, 10)]}>
      <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>
    </Box>
  );
}

export function SettingsTextRow({ title, subtitle, icon, value }: SettingsTextRowProps) {
  const theme = useTheme();
  return (
    <ListItem colors={useRowColors()}>
      <LeadingIcon icon={icon} tint={theme.colors.text} />
      <Headline title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <Text color={theme.colors.textSecondary} style={textStyle(theme)}>
          {value ?? ''}
        </Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/** Centered Material 3 segmented button row, placed directly in the form. */
export function SettingsSegmentedRow<T extends string>({ segments, value, onChange, disabled, testID }: SettingsSegmentedRowProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Row horizontalArrangement="center" modifiers={[fillMaxWidth(), padding(0, 4, 0, 4)]}>
      <SingleChoiceSegmentedButtonRow modifiers={testID ? [testIDModifier(testID)] : []}>
        {segments.map((s) => (
          <SegmentedButton
            key={s.value}
            selected={s.value === value}
            enabled={!disabled}
            onClick={() => {
              if (s.value === value) return;
              haptics.selection();
              onChange(s.value);
            }}
            colors={{
              activeContainerColor: c.accent,
              activeContentColor: c.onAccent,
              activeBorderColor: c.accent,
              inactiveContainerColor: c.chipFill,
              inactiveContentColor: c.text,
              inactiveBorderColor: c.chipBorder,
            }}>
            <SegmentedButton.Label>
              <Text style={textStyle(theme)}>{s.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Row>
  );
}
