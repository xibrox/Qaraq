import { BottomSheet, Button, Group, HStack, Host, Image, List, Section, Spacer, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonStyle,
  contentShape,
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

import type { SortSheetProps } from './types';

/**
 * "Manga: Sort By" sheet as a SwiftUI sheet: header with an eraser button, then a radio list.
 * On iOS 26 the sheet picks up the system Liquid Glass material.
 */
export function SortSheet<T extends string>({ visible, title, options, selected, onSelect, onClear, onClose }: SortSheetProps<T>) {
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
          <List modifiers={[listStyle('insetGrouped')]}>
            <Section
              header={
                <HStack>
                  <Text modifiers={[font({ family, size: 15, weight: 'semibold' }), foregroundStyle(c.textSecondary)]}>{title}</Text>
                  <Spacer />
                  {/* An icon-only `systemImage` Button with no label lays out at 0x0 in a section header, so give it an Image child and a frame. */}
                  <Button
                    onPress={() => {
                      haptics.selection();
                      onClear();
                    }}
                    modifiers={[buttonStyle('plain'), accessibilityLabel('Clear sort')]}>
                    <Image
                      systemName="eraser"
                      size={18}
                      color={c.text}
                      modifiers={[frame({ width: 36, height: 30 }), contentShape(shapes.rectangle())]}
                    />
                  </Button>
                </HStack>
              }>
              {options.map((o) => (
                <Button
                  key={o.value}
                  onPress={() => {
                    haptics.selection();
                    onSelect(o.value);
                  }}
                  modifiers={[buttonStyle('plain')]}>
                  <HStack spacing={12} modifiers={[frame({ maxWidth: 10000, alignment: 'leading' }), contentShape(shapes.rectangle())]}>
                    <Image systemName={o.value === selected ? 'largecircle.fill.circle' : 'circle'} size={20} color={c.text} />
                    <Text modifiers={[font({ family, size: 16, weight: 'medium' }), foregroundStyle(c.text)]}>{o.label}</Text>
                    <Spacer />
                  </HStack>
                </Button>
              ))}
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

export type { SortSheetOption, SortSheetProps } from './types';
