import { Checkbox, Column, Host, ListItem, ModalBottomSheet, Text, TextButton } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import type { CustomListSheetProps } from './types';

/** Material 3 modal bottom sheet with a checkbox row per custom list. */
export function CustomListSheet({ visible, title, lists, onToggle, onManage, onClose }: CustomListSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  if (!visible) return null;
  return (
    <Host style={styles.host} colorScheme={theme.scheme} seedColor={c.accent}>
      <ModalBottomSheet onDismissRequest={onClose} containerColor={c.surface} contentColor={c.text}>
        <Column modifiers={[fillMaxWidth(), padding(0, 0, 0, 24)]}>
          <Text color={c.text} style={{ typography: 'titleMedium', fontWeight: '700' }} modifiers={[padding(24, 0, 24, 4)]}>
            {title}
          </Text>
          <Text color={c.textSecondary} style={{ typography: 'labelMedium' }} modifiers={[padding(24, 0, 24, 8)]}>
            Custom Lists
          </Text>
          {lists.map((l) => (
            <ListItem
              key={l.name}
              colors={{ containerColor: 'transparent', contentColor: c.text }}
              modifiers={[clickable(() => onToggle(l.name, !l.checked))]}>
              <ListItem.HeadlineContent>
                <Text color={c.text} style={{ typography: 'bodyLarge' }}>
                  {l.name}
                </Text>
              </ListItem.HeadlineContent>
              <ListItem.TrailingContent>
                <Checkbox
                  value={l.checked}
                  onCheckedChange={(on) => onToggle(l.name, on)}
                  colors={{ checkedColor: c.accent, checkmarkColor: c.onAccent, uncheckedColor: c.textSecondary }}
                />
              </ListItem.TrailingContent>
            </ListItem>
          ))}
          <TextButton onClick={onManage} modifiers={[padding(12, 8, 12, 0)]}>
            <Text color={c.accent}>Manage Custom Lists</Text>
          </TextButton>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, left: 0, bottom: 0 },
});
