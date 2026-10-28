import EraserIcon from '@expo/material-symbols/ink_eraser.xml';
import { Column, Host, Icon, IconButton, ModalBottomSheet, RadioButton, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, height, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import type { SortSheetProps } from './types';

/** "Manga: Sort By" as a Material 3 modal bottom sheet with radio rows. */
export function SortSheet<T extends string>({ visible, title, options, selected, onSelect, onClear, onClose }: SortSheetProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  if (!visible) return null;
  return (
    <Host style={styles.host} colorScheme={theme.scheme}>
      <ModalBottomSheet onDismissRequest={onClose} containerColor={c.surface} contentColor={c.text} showDragHandle>
        <Column modifiers={[fillMaxWidth(), padding(8, 0, 8, 24)]}>
          <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(16, 0, 4, 8)]}>
            <Text color={c.textSecondary} style={{ typography: 'titleSmall' }}>
              {title}
            </Text>
            <Spacer modifiers={[weight(1)]} />
            <IconButton
              onClick={() => {
                haptics.selection();
                onClear();
              }}>
              <Icon source={EraserIcon} tint={c.text} size={22} contentDescription="Clear sort" />
            </IconButton>
          </Row>
          {options.map((o) => {
            const choose = () => {
              haptics.selection();
              onSelect(o.value);
            };
            return (
              <Row
                key={o.value}
                verticalAlignment="center"
                modifiers={[fillMaxWidth(), height(48), clickable(choose), padding(8, 0, 16, 0)]}>
                <RadioButton selected={o.value === selected} onClick={choose} colors={{ selectedColor: c.accent, unselectedColor: c.textSecondary }} />
                <Text color={c.text} style={{ typography: 'bodyLarge' }}>
                  {o.label}
                </Text>
              </Row>
            );
          })}
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, left: 0, top: 0 },
});

export type { SortSheetOption, SortSheetProps } from './types';
