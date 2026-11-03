import ArrowDownIcon from '@expo/material-symbols/arrow_downward.xml';
import ArrowUpIcon from '@expo/material-symbols/arrow_upward.xml';
import ResetIcon from '@expo/material-symbols/restart_alt.xml';
import { Column, Host, Icon, IconButton, ModalBottomSheet, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { moveItems } from '../list-model';
import type { ReorderSheetProps } from './types';

/** Material 3 modal bottom sheet; Compose has no drag-to-reorder list, so each row has up/down arrows. */
export function ReorderSheet({ visible, title, items, onReorder, onReset, onClose }: ReorderSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  if (!visible) return null;
  const move = (from: number, to: number) => {
    haptics.selection();
    onReorder(moveItems(items, [from], to).map((i) => i.key));
  };
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
                onReset();
              }}>
              <Icon source={ResetIcon} tint={c.text} size={22} contentDescription="Reset order" />
            </IconButton>
          </Row>
          {items.map((item, i) => (
            <Row key={item.key} verticalAlignment="center" modifiers={[fillMaxWidth(), height(52), padding(16, 0, 4, 0)]}>
              <Text color={c.text} style={{ typography: 'bodyLarge' }} modifiers={[weight(1)]}>
                {item.label}
              </Text>
              <IconButton enabled={i > 0} onClick={() => move(i, i - 1)}>
                <Icon source={ArrowUpIcon} tint={i > 0 ? c.text : c.textTertiary} size={22} contentDescription={`Move ${item.label} up`} />
              </IconButton>
              <IconButton enabled={i < items.length - 1} onClick={() => move(i, i + 2)}>
                <Icon
                  source={ArrowDownIcon}
                  tint={i < items.length - 1 ? c.text : c.textTertiary}
                  size={22}
                  contentDescription={`Move ${item.label} down`}
                />
              </IconButton>
            </Row>
          ))}
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, left: 0, top: 0 },
});
