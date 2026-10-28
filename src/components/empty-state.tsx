import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PrimaryButton } from './primary-button';

export type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: IconName;
  /** Optional call to action ("Sign In", "Explore"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Extra content under the message. */
  children?: ReactNode;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Empty list / no results / signed-out placeholder. */
export function EmptyState({ title, message, icon, actionLabel, onAction, children, fill = true, style }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.box, fill && styles.fill, style]}>
      {icon ? <Icon name={icon} size={40} color={theme.colors.textTertiary} /> : null}
      <AppText variant="headline" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="subheadline" tone="secondary" align="center">
          {message}
        </AppText>
      ) : null}
      {children}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 40 },
  fill: { flex: 1 },
  action: { marginTop: 12, alignSelf: 'center', minWidth: 160 },
});
