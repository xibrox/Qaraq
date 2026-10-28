import { BottomSheet, Button, Form, Group, Host, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { font, foregroundStyle, presentationDetents, presentationDragIndicator, preferredColorScheme, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import type { CustomListSheetProps } from './types';

/** SwiftUI sheet with a Form of toggles, one per custom list. */
export function CustomListSheet({ visible, title, lists, onToggle, onManage, onClose }: CustomListSheetProps) {
  const theme = useTheme();
  return (
    <Host style={styles.host} colorScheme={theme.scheme} pointerEvents="box-none">
      <BottomSheet isPresented={visible} onIsPresentedChange={(open) => !open && onClose()}>
        <Group
          modifiers={[
            presentationDetents(['medium', 'large']),
            presentationDragIndicator('visible'),
            // The sheet is its own presentation; pin it to the app theme (not the OS appearance).
            preferredColorScheme(theme.scheme),
          ]}>
          <Form modifiers={[tint(theme.colors.accent)]}>
            <Section
              header={
                <Text modifiers={[font({ family: theme.fontFamily, size: 17, weight: 'bold' }), foregroundStyle(theme.colors.text)]}>
                  {title}
                </Text>
              }
              title="Custom Lists">
              {lists.map((l) => (
                <Toggle
                  key={l.name}
                  label={l.name}
                  isOn={l.checked}
                  onIsOnChange={(on) => onToggle(l.name, on)}
                  modifiers={[tint(theme.colors.success)]}
                />
              ))}
            </Section>
            <Section>
              <Button label="Manage Custom Lists" systemImage="list.bullet" onPress={onManage} />
            </Section>
          </Form>
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, left: 0, bottom: 0 },
});
