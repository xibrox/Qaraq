import {
  Button,
  Form,
  HStack,
  Host,
  Image,
  Label,
  Menu,
  Picker,
  RNHostView,
  Section,
  Spacer,
  Text,
  Toggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityValue,
  contentShape,
  disabled as disabledModifier,
  font,
  foregroundStyle,
  frame,
  headerProminence,
  layoutPriority,
  lineLimit,
  listRowBackground,
  multilineTextAlignment,
  listRowInsets,
  pickerStyle,
  scrollContentBackground,
  background,
  shapes,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import { haptics } from '@/lib/haptics';
import { useTheme, type Theme } from '@/theme';

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

// SwiftUI Form, styled like AniClient's inset grouped settings (Nunito, themed card fill).

const ICON_COLUMN = 26;

function titleFont(theme: Theme) {
  return font({ family: theme.fontFamily, size: 17, weight: 'semibold' });
}

function subtitleFont(theme: Theme) {
  return font({ family: theme.fontFamily, size: 13 });
}

function rowModifiers(theme: Theme, disabled?: boolean) {
  // `groupedSurface`: white cards on #F2F2F7 in the light theme, `surface` on dark themes.
  const mods = [listRowBackground(theme.colors.groupedSurface)];
  if (disabled) mods.push(disabledModifier(true));
  return mods;
}

function Leading({ icon, color }: { icon?: SettingsIcon; color: string }) {
  if (!icon?.ios) return null;
  return (
    <Image systemName={icon.ios} size={16} color={color} modifiers={[frame({ width: ICON_COLUMN, alignment: 'leading' })]} />
  );
}

function Titles({ title, subtitle, color }: { title: string; subtitle?: string; color?: string }) {
  const theme = useTheme();
  return (
    // Leading-aligned when a long title wraps (SwiftUI centres multiline Text by default), and
    // prioritised over the value so "Staff Name Language" keeps its line before the value truncates.
    <VStack alignment="leading" spacing={2} modifiers={[layoutPriority(1)]}>
      <Text modifiers={[titleFont(theme), foregroundStyle(color ?? theme.colors.text), lineLimit(2), multilineTextAlignment('leading')]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          modifiers={[subtitleFont(theme), foregroundStyle(theme.colors.textSecondary), lineLimit(2), multilineTextAlignment('leading')]}>
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

function ValueText({ value }: { value: string }) {
  const theme = useTheme();
  return (
    <Text modifiers={[font({ family: theme.fontFamily, size: 16 }), foregroundStyle(theme.colors.textSecondary), lineLimit(1)]}>
      {value}
    </Text>
  );
}

/** Root: a full-screen SwiftUI `Form` with the theme background. */
export function SettingsForm({ children, footer, style, testID }: SettingsFormProps) {
  const theme = useTheme();
  return (
    <Host style={[{ flex: 1 }, style]} colorScheme={theme.scheme} testID={testID}>
      <Form modifiers={[scrollContentBackground('hidden'), background(theme.colors.groupedBackground), tint(theme.colors.accent)]}>
        {children}
        {footer ? (
          <Section>
            <HStack modifiers={[listRowBackground('clear')]}>
              <Spacer />
              <Text modifiers={[subtitleFont(theme), foregroundStyle(theme.colors.textTertiary)]}>{footer}</Text>
              <Spacer />
            </HStack>
          </Section>
        ) : null}
      </Form>
    </Host>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const theme = useTheme();
  return (
    <Section
      modifiers={[headerProminence('increased')]}
      header={
        title ? (
          <Text modifiers={[font({ family: theme.fontFamily, size: 17, weight: 'bold' }), foregroundStyle(theme.colors.textMuted)]}>
            {title}
          </Text>
        ) : undefined
      }
      footer={
        footer ? (
          <Text modifiers={[subtitleFont(theme), foregroundStyle(theme.colors.textSecondary)]}>{footer}</Text>
        ) : undefined
      }>
      {children}
    </Section>
  );
}

export function SettingsNavigationRow({ title, subtitle, icon, value, onPress, disabled, testID }: SettingsNavigationRowProps) {
  const theme = useTheme();
  return (
    <Button onPress={onPress} modifiers={rowModifiers(theme, disabled)} testID={testID}>
      <HStack spacing={10}>
        <Leading icon={icon} color={theme.colors.text} />
        <Titles title={title} subtitle={subtitle} />
        <Spacer />
        {value ? <ValueText value={value} /> : null}
        <Image systemName="chevron.right" size={13} color={theme.colors.textTertiary} />
      </HStack>
    </Button>
  );
}

function CenteredTitle({ title, color }: { title: string; color: string }) {
  const theme = useTheme();
  return (
    <HStack>
      <Spacer />
      <Text modifiers={[titleFont(theme), foregroundStyle(color), lineLimit(1)]}>{title}</Text>
      <Spacer />
    </HStack>
  );
}

export function SettingsButtonRow({ title, subtitle, icon, value, onPress, disabled, testID, align }: SettingsButtonRowProps) {
  const theme = useTheme();
  if (align === 'center') {
    return (
      <Button onPress={onPress} modifiers={rowModifiers(theme, disabled)} testID={testID}>
        <CenteredTitle title={title} color={theme.colors.text} />
      </Button>
    );
  }
  return (
    <Button onPress={onPress} modifiers={rowModifiers(theme, disabled)} testID={testID}>
      <HStack spacing={10}>
        <Leading icon={icon} color={theme.colors.text} />
        <Titles title={title} subtitle={subtitle} />
        <Spacer />
        {value ? <ValueText value={value} /> : null}
      </HStack>
    </Button>
  );
}

/** Rounded colour square for the Color / Theme rows. Explicit colour, so it is not tinted. */
function Swatch({ color }: { color: string }) {
  return <Image systemName="square.fill" size={22} color={color} />;
}

/**
 * Menu items for a value row. Plain options are checkmark toggles (title + gray subtitle, like
 * UIMenu). Swatch options get a `.palette` picker first: menu pickers draw their images as
 * monochrome templates, but palette options keep their per-option `tint`, so the colours show.
 * The named list follows so every option still has a readable name.
 */
function ValueMenuItems<T extends string>({
  title,
  value,
  options,
  onSelect,
}: {
  title: string;
  value: T;
  options: readonly SettingsOption<T>[];
  onSelect: (v: T) => void;
}) {
  const hasSwatches = options.some((o) => o.swatch);
  const list = options.map((o) => (
    <Toggle
      key={o.value}
      label={o.subtitle ? undefined : o.label}
      isOn={o.value === value}
      onIsOnChange={() => onSelect(o.value)}>
      {o.subtitle
        ? [
            <Text key="t">{o.label}</Text>,
            <Text key="s" modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
              {o.subtitle}
            </Text>,
          ]
        : undefined}
    </Toggle>
  ));
  if (!hasSwatches) return <>{list}</>;
  return (
    <>
      <Picker label={title} selection={value} onSelectionChange={(v: T) => onSelect(v)} modifiers={[pickerStyle('palette')]}>
        {options.map((o) => (
          <Label
            key={o.value}
            title={o.label}
            systemImage={o.swatch ? 'square.fill' : 'circle'}
            modifiers={[tag(o.value), ...(o.swatch ? [tint(o.swatch), foregroundStyle(o.swatch)] : [])]}
          />
        ))}
      </Picker>
      <Section>{list}</Section>
    </>
  );
}

/**
 * "Default Media   Anime ⇕": a SwiftUI `Menu` whose label is the whole row. A custom menu (not a
 * menu-style `Picker`) keeps option subtitles, the optional gray menu header and coloured swatches.
 */
export function SettingsValueRow<T extends string>({
  title,
  subtitle,
  icon,
  value,
  options,
  onChange,
  menuTitle,
  disabled,
  testID,
}: SettingsValueRowProps<T>) {
  const theme = useTheme();
  const current = options.find((o) => o.value === value);
  const onSelect = (v: T) => {
    if (v !== value) onChange(v);
  };
  const items = <ValueMenuItems title={title} value={value} options={options} onSelect={onSelect} />;
  return (
    <Menu
      modifiers={[...rowModifiers(theme, disabled), accessibilityValue(current?.label ?? '')]}
      testID={testID}
      label={
        <HStack spacing={10} modifiers={[contentShape(shapes.rectangle())]}>
          <Leading icon={icon} color={theme.colors.text} />
          <Titles title={title} subtitle={subtitle} />
          <Spacer />
          {current?.swatch ? <Swatch color={current.swatch} /> : <ValueText value={current?.label ?? ''} />}
          <Image systemName="chevron.up.chevron.down" size={12} color={theme.colors.textSecondary} />
        </HStack>
      }>
      {menuTitle ? <Section title={menuTitle}>{items}</Section> : items}
    </Menu>
  );
}

export function SettingsCheckRow({ title, subtitle, icon, checked, onToggle, disabled, testID }: SettingsCheckRowProps) {
  const theme = useTheme();
  return (
    <Button
      onPress={() => onToggle(!checked)}
      modifiers={[
        ...rowModifiers(theme, disabled),
        accessibilityValue(checked ? 'On' : 'Off'),
        ...(checked ? [accessibilityAddTraits(['isSelected'])] : []),
      ]}
      testID={testID}>
      <HStack spacing={10}>
        <Leading icon={icon} color={theme.colors.text} />
        <Titles title={title} subtitle={subtitle} />
        <Spacer />
        {checked ? <Image systemName="checkmark" size={15} color={theme.colors.accent} /> : null}
      </HStack>
    </Button>
  );
}

export function SettingsSwitchRow({ title, subtitle, icon, value, onValueChange, disabled, testID }: SettingsSwitchRowProps) {
  const theme = useTheme();
  return (
    <Toggle
      isOn={value}
      onIsOnChange={onValueChange}
      modifiers={[tint(theme.colors.success), ...rowModifiers(theme, disabled)]}
      testID={testID}>
      <HStack spacing={10}>
        <Leading icon={icon} color={theme.colors.text} />
        <Titles title={title} subtitle={subtitle} />
      </HStack>
    </Toggle>
  );
}

export function SettingsDestructiveRow({ title, icon, onPress, disabled, testID, align }: SettingsDestructiveRowProps) {
  const theme = useTheme();
  if (align === 'center') {
    return (
      <Button role="destructive" onPress={onPress} modifiers={rowModifiers(theme, disabled)} testID={testID}>
        <CenteredTitle title={title} color={theme.colors.danger} />
      </Button>
    );
  }
  return (
    <Button role="destructive" onPress={onPress} modifiers={rowModifiers(theme, disabled)} testID={testID}>
      <HStack spacing={10}>
        <Leading icon={icon} color={theme.colors.danger} />
        <Titles title={title} color={theme.colors.danger} />
        <Spacer />
      </HStack>
    </Button>
  );
}

export function SettingsCustomRow({ children, bare }: SettingsCustomRowProps) {
  const theme = useTheme();
  return (
    <VStack
      modifiers={
        bare
          ? [listRowBackground('clear'), listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 })]
          : [listRowBackground(theme.colors.groupedSurface)]
      }>
      {/* Width from the row, height from the RN content (full-width banners and previews). */}
      <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>
    </VStack>
  );
}

export function SettingsTextRow({ title, subtitle, icon, value, disabled, testID }: SettingsTextRowProps) {
  const theme = useTheme();
  return (
    <HStack spacing={10} modifiers={rowModifiers(theme, disabled)} testID={testID}>
      <Leading icon={icon} color={theme.colors.text} />
      <Titles title={title} subtitle={subtitle} />
      <Spacer />
      {value ? <ValueText value={value} /> : null}
    </HStack>
  );
}

/** Centered `.segmented` Picker in its own clear section. */
export function SettingsSegmentedRow<T extends string>({ segments, value, onChange, disabled, testID }: SettingsSegmentedRowProps<T>) {
  return (
    <Section>
      <HStack
        modifiers={[listRowBackground('clear'), listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 })]}
        testID={testID}>
        <Spacer />
        <Picker
          selection={value}
          onSelectionChange={(v: T) => {
            if (v === value) return;
            haptics.selection();
            onChange(v);
          }}
          modifiers={[pickerStyle('segmented'), frame({ width: 200 }), ...(disabled ? [disabledModifier(true)] : [])]}>
          {segments.map((s) => (
            <Text key={s.value} modifiers={[tag(s.value)]}>
              {s.label}
            </Text>
          ))}
        </Picker>
        <Spacer />
      </HStack>
    </Section>
  );
}
