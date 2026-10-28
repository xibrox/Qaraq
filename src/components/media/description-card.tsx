import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewInstance } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { useRevealTop } from '@/components/scroll-reveal';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { htmlToPlainText } from './media-format';

const COLLAPSED_LINES = 4;
const LONG_TEXT = 180;

/** Summary card collapsed to ~4 lines with a fade; tap to expand (honors Expand Summary By Default). */
export function DescriptionCard({ html }: { html: string | null | undefined }) {
  const theme = useTheme();
  const c = theme.colors;
  const expandByDefault = useSetting('expandSummaryByDefault');
  const [expanded, setExpanded] = useState(expandByDefault);
  const cardRef = useRef<ViewInstance>(null);
  const revealTop = useRevealTop();
  const text = htmlToPlainText(html);
  if (!text) return null;
  const collapsible = text.length > LONG_TEXT || text.includes('\n');
  const collapsed = collapsible && !expanded;
  return (
    <Pressable
      ref={cardRef}
      onPress={
        collapsible
          ? () => {
              setExpanded(!expanded);
              if (expanded) revealTop?.(cardRef.current);
            }
          : undefined
      }
      accessibilityRole={collapsible ? 'button' : undefined}
      accessibilityHint={collapsible ? (expanded ? 'Collapses the summary' : 'Shows the full summary') : undefined}
      style={[styles.card, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
      <AppText variant="footnote" tone="secondary" numberOfLines={collapsed ? COLLAPSED_LINES : undefined} selectable={!collapsible}>
        {text}
      </AppText>
      {collapsed ? (
        <View
          pointerEvents="none"
          style={[styles.fade, { backgroundImage: `linear-gradient(to bottom, ${c.surface}00 0%, ${c.surface} 85%)` }]}
        />
      ) : null}
      {collapsible ? (
        <View style={styles.chevron}>
          <Icon name={icons.chevronDown} size={12} color={c.textTertiary} style={expanded ? styles.up : undefined} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 18, height: 36 },
  chevron: { alignItems: 'center', height: 18, justifyContent: 'center' },
  up: { transform: [{ rotate: '180deg' }] },
});
