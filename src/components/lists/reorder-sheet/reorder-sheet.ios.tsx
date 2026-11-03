import { BottomSheet, Button, Group, HStack, Host, Image, List, Section, Spacer, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonStyle,
  contentShape,
  environment,
  font,
  foregroundStyle,
  frame,
  listStyle,
  presentationDetents,
  presentationDragIndicator,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { moveItems } from '../list-model';
import type { ReorderItem, ReorderSheetProps } from './types';

/** SwiftUI sheet: a list kept in edit mode, so every row shows the system drag handle. */
export function ReorderSheet({ visible, title, items, onReorder, onReset, onClose }: ReorderSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  const family = theme.fontFamily;
  return (
    <Host style={styles.host} colorScheme={theme.scheme}>
      <BottomSheet isPresented={visible} onIsPresentedChange={(open) => (open ? undefined : onClose())}>
        <Group
          modifiers={[
            presentationDetents(['medium', 'large']),
            presentationDragIndicator('visible'),
            // The sheet is its own presentation; pin it to the app theme (not the OS appearance).
            preferredColorScheme(theme.scheme),
          ]}>
          <List modifiers={[listStyle('insetGrouped'), environment('editMode', 'active')]}>
            <Section
              header={
                <HStack>
                  <Text modifiers={[font({ family, size: 15, weight: 'semibold' }), foregroundStyle(c.textSecondary)]}>{title}</Text>
                  <Spacer />
                  {/* An icon-only `systemImage` Button with no label lays out at 0x0 in a section header, so give it an Image child and a frame. */}
                  <Button
                    onPress={() => {
                      haptics.selection();
                      onReset();
                    }}
                    modifiers={[buttonStyle('plain'), accessibilityLabel('Reset order')]}>
                    <Image
                      systemName="arrow.triangle.2.circlepath"
                      size={18}
                      color={c.text}
                      modifiers={[frame({ width: 36, height: 30 }), contentShape(shapes.rectangle())]}
                    />
                  </Button>
                </HStack>
              }>
              <List.ForEach
                data={items}
                keyExtractor={(item: ReorderItem) => item.key}
                recycling={false}
                onMove={(from, to) => {
                  haptics.selection();
                  onReorder(moveItems(items, from, to).map((i) => i.key));
                }}>
                {({ item }) => <Text modifiers={[font({ family, size: 16, weight: 'medium' }), foregroundStyle(c.text)]}>{item.label}</Text>}
              </List.ForEach>
            </Section>
          </List>
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, left: 0, top: 0 },
});
