import { Fragment, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { useTheme } from '@/theme';

import type { MenuAction, MenuEntry, NativeMenuProps } from './types';

function flatten(entries: MenuEntry[], depth = 0): { header?: string; action?: MenuAction; key: string }[] {
  return entries.flatMap((e) => {
    if (e.kind === 'section' || e.kind === 'submenu') {
      const head = e.title ? [{ header: e.title, key: `h-${e.key}-${depth}` }] : [];
      return [...head, ...flatten(e.items, depth + 1)];
    }
    return [{ action: e, key: e.key }];
  });
}

/**
 * Fallback menu (web, and the base module TypeScript resolves): a centered sheet listing the
 * actions. iOS uses SwiftUI `Menu` (`native-menu.ios.tsx`), Android Compose `DropdownMenu`
 * (`native-menu.android.tsx`).
 */
export function NativeMenu({ children, items, title, trigger = 'press', disabled, onOpen, onClose, style, testID }: NativeMenuProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const show = () => {
    setOpen(true);
    onOpen?.();
  };
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const rows = flatten(items);
  return (
    <>
      <Pressable
        onPress={trigger === 'press' ? show : undefined}
        onLongPress={trigger === 'longPress' ? show : undefined}
        disabled={disabled}
        accessibilityRole="button"
        style={style}
        testID={testID}>
        {children}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={[styles.scrim, { backgroundColor: c.overlay }]} onPress={close}>
          <View style={[styles.panel, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.xl }]}>
            <ScrollView>
              {title ? (
                <AppText variant="footnote" tone="secondary" style={styles.header}>
                  {title}
                </AppText>
              ) : null}
              {rows.map((r) => (
                <Fragment key={r.key}>
                  {r.header ? (
                    <AppText variant="footnote" tone="secondary" style={styles.header}>
                      {r.header}
                    </AppText>
                  ) : null}
                  {r.action ? (
                    <Pressable
                      disabled={r.action.disabled}
                      onPress={() => {
                        close();
                        r.action?.onPress?.();
                      }}
                      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.fill }]}>
                      <View style={styles.check}>
                        {r.action.checked ? <Icon name={icons.check} size={15} color={c.text} /> : null}
                      </View>
                      <View style={styles.texts}>
                        <AppText variant="callout" color={r.action.destructive ? c.danger : c.text}>
                          {r.action.title}
                        </AppText>
                        {r.action.subtitle ? (
                          <AppText variant="footnote" tone="secondary">
                            {r.action.subtitle}
                          </AppText>
                        ) : null}
                      </View>
                      {r.action.swatch ? <View style={[styles.swatch, { backgroundColor: r.action.swatch }]} /> : null}
                    </Pressable>
                  ) : null}
                </Fragment>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  panel: { minWidth: 240, maxWidth: 360, maxHeight: '70%', paddingVertical: 6, overflow: 'hidden' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  check: { width: 18, alignItems: 'center' },
  texts: { flex: 1 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
});

export type { MenuAction, MenuEntry, MenuIcon, MenuSection, MenuSubmenu, NativeMenuProps } from './types';
export { choiceItems } from './types';
