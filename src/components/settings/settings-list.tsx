import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { choiceItems, NativeMenu } from '@/components/menu/native-menu';
import { SegmentedSwitch } from '@/components/segmented-switch';
import { useTheme } from '@/theme';

import type {
  SettingsButtonRowProps,
  SettingsCheckRowProps,
  SettingsCustomRowProps,
  SettingsDestructiveRowProps,
  SettingsFormProps,
  SettingsNavigationRowProps,
  SettingsSectionProps,
  SettingsSegmentedRowProps,
  SettingsSwitchRowProps,
  SettingsTextRowProps,
  SettingsValueRowProps,
} from './types';

// RN fallback (web). iOS: settings-list.ios.tsx (SwiftUI Form); Android: settings-list.android.tsx (Compose).

function flattenRows(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') return;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) out.push(...flattenRows(child.props.children));
    else out.push(child);
  });
  return out;
}

export function SettingsForm({ children, footer, style, testID }: SettingsFormProps) {
  const theme = useTheme();
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: theme.colors.groupedBackground }, style]}
      contentContainerStyle={styles.form}
      contentInsetAdjustmentBehavior="automatic"
      testID={testID}>
      {children}
      {footer ? (
        <AppText variant="footnote" tone="tertiary" align="center">
          {footer}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const theme = useTheme();
  const rows = flattenRows(children);
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="headline" tone="muted" style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View style={{ backgroundColor: theme.colors.groupedSurface, borderRadius: theme.radii.xl, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="secondary" style={styles.sectionFooter}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

type RowShellProps = {
  title: string;
  subtitle?: string;
  icon?: { ios?: unknown; android?: unknown };
  titleColor?: string;
  centered?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

function RowShell({ title, subtitle, titleColor, centered, trailing, onPress, disabled, testID }: RowShellProps) {
  const theme = useTheme();
  const body = (
    <View style={[styles.row, { minHeight: theme.sizes.settingsRow, opacity: disabled ? 0.4 : 1 }]}>
      <View style={styles.titles}>
        <AppText variant="callout" weight="600" color={titleColor} align={centered ? 'center' : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => pressed && { backgroundColor: theme.colors.fill }}>
      {body}
    </Pressable>
  );
}

function Value({ text }: { text: string }) {
  return (
    <AppText variant="callout" tone="secondary" numberOfLines={1}>
      {text}
    </AppText>
  );
}

export function SettingsNavigationRow({ value, onPress, ...rest }: SettingsNavigationRowProps) {
  const c = useTheme().colors;
  return (
    <RowShell
      {...rest}
      onPress={onPress}
      trailing={
        <View style={styles.trailing}>
          {value ? <Value text={value} /> : null}
          <Icon name={icons.chevronRight} size={13} color={c.textTertiary} />
        </View>
      }
    />
  );
}

export function SettingsButtonRow({ value, onPress, align, ...rest }: SettingsButtonRowProps) {
  if (align === 'center') return <RowShell title={rest.title} disabled={rest.disabled} testID={rest.testID} centered onPress={onPress} />;
  return <RowShell {...rest} onPress={onPress} trailing={value ? <Value text={value} /> : null} />;
}

export function SettingsValueRow<T extends string>({ value, options, onChange, menuTitle, ...rest }: SettingsValueRowProps<T>) {
  const c = useTheme().colors;
  const current = options.find((o) => o.value === value);
  return (
    <NativeMenu items={choiceItems(options, value, onChange)} title={menuTitle} disabled={rest.disabled}>
      <RowShell
        {...rest}
        trailing={
          <View style={styles.trailing}>
            {current?.swatch ? (
              <View style={[styles.swatch, { backgroundColor: current.swatch }]} />
            ) : (
              <Value text={current?.label ?? ''} />
            )}
            <Icon name={icons.upDown} size={12} color={c.textSecondary} />
          </View>
        }
      />
    </NativeMenu>
  );
}

export function SettingsCheckRow({ checked, onToggle, ...rest }: SettingsCheckRowProps) {
  const c = useTheme().colors;
  return (
    <RowShell
      {...rest}
      onPress={() => onToggle(!checked)}
      trailing={checked ? <Icon name={icons.check} size={16} color={c.accent} /> : null}
    />
  );
}

export function SettingsSwitchRow({ value, onValueChange, ...rest }: SettingsSwitchRowProps) {
  const c = useTheme().colors;
  return (
    <RowShell
      {...rest}
      trailing={
        <Switch value={value} onValueChange={onValueChange} disabled={rest.disabled} trackColor={{ true: c.success, false: c.fill }} />
      }
    />
  );
}

export function SettingsDestructiveRow({ onPress, align, ...rest }: SettingsDestructiveRowProps) {
  const c = useTheme().colors;
  return <RowShell {...rest} centered={align === 'center'} titleColor={c.danger} onPress={onPress} />;
}

export function SettingsTextRow({ value, ...rest }: SettingsTextRowProps) {
  return <RowShell {...rest} trailing={value ? <Value text={value} /> : null} />;
}

export function SettingsSegmentedRow<T extends string>({ segments, value, onChange, disabled, testID }: SettingsSegmentedRowProps<T>) {
  return (
    <View style={styles.segmented} testID={testID}>
      <SegmentedSwitch segments={segments} value={value} onChange={onChange} disabled={disabled} />
    </View>
  );
}

export function SettingsCustomRow({ children, bare }: SettingsCustomRowProps) {
  return <View style={bare ? undefined : styles.custom}>{children}</View>;
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 6 },
  sectionTitle: { paddingHorizontal: 4 },
  sectionFooter: { paddingHorizontal: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  titles: { flex: 1, gap: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 20, height: 20, borderRadius: 5 },
  custom: { padding: 12 },
  segmented: { alignItems: 'center' },
});
