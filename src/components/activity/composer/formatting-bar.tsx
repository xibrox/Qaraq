import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, type IconName } from '@/components/icon';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { activityIcons } from '../activity-icons';
import type { FormatAction } from './format';

export type FormattingBarProps = {
  onAction: (action: FormatAction) => void;
  /** Show the trailing hide-keyboard button (default true). */
  showDismiss?: boolean;
};

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

type Item =
  | { action: FormatAction; label: string; text: string; style?: 'serif' | 'bold' | 'italic' }
  | { action: FormatAction; label: string; icon: IconName };

const ITEMS: Item[] = [
  { action: 'spoiler', label: 'Spoiler', text: '+Spoiler' },
  { action: 'heading', label: 'Heading', text: 'H', style: 'serif' },
  { action: 'bold', label: 'Bold', text: 'B', style: 'bold' },
  { action: 'italic', label: 'Italic', text: 'I', style: 'italic' },
  { action: 'center', label: 'Center', icon: activityIcons.center },
  { action: 'list', label: 'Bulleted list', icon: activityIcons.bulletList },
  { action: 'image', label: 'Image', icon: activityIcons.image },
];

/** AniClient's keyboard accessory: "+Spoiler", H, B, I, center, bulleted list, image, hide keyboard. */
export function FormattingBar({ onAction, showDismiss = true }: FormattingBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.bar, { backgroundColor: c.header, borderTopColor: c.separator }]}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.items}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.action}
            onPress={() => {
              haptics.selection();
              onAction(item.action);
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            hitSlop={4}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.5 : 1 }]}>
            {'icon' in item ? (
              <Icon name={item.icon} size={18} color={c.textSecondary} />
            ) : (
              <AppText
                variant="callout"
                color={c.textSecondary}
                weight={item.style === 'italic' ? '400' : '800'}
                style={[
                  item.style === 'italic' && { fontStyle: 'italic', fontFamily: SERIF },
                  item.style === 'serif' && { fontFamily: SERIF, fontSize: 19 },
                ]}>
                {item.text}
              </AppText>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {showDismiss ? (
        <Pressable
          onPress={() => Keyboard.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Hide keyboard"
          hitSlop={4}
          style={({ pressed }) => [styles.item, styles.dismiss, { opacity: pressed ? 0.5 : 1 }]}>
          <Icon name={activityIcons.hideKeyboard} size={18} color={c.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 42, borderTopWidth: StyleSheet.hairlineWidth },
  items: { alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  item: { minWidth: 38, height: 38, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  dismiss: { marginRight: 4 },
});
