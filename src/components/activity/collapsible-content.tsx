import { useId, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { activityIcons } from './activity-icons';

export type CollapsibleContentProps = {
  children: ReactNode;
  /** Height shown while collapsed (default 260). */
  collapsedHeight?: number;
  /** Colour the fade blends into (default: screen background). */
  fadeColor?: string;
  /** When false, always renders fully expanded (activity detail). */
  enabled?: boolean;
};

const FADE = 90;

/**
 * Long text statuses in the feed: clipped with a fade to the background and a centred "⌄"
 * chevron that expands the content in place.
 */
export function CollapsibleContent({ children, collapsedHeight = 260, fadeColor, enabled = true }: CollapsibleContentProps) {
  const theme = useTheme();
  const gradientId = `fade-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [contentHeight, setContentHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const color = fadeColor ?? theme.colors.background;
  const collapsible = enabled && contentHeight > collapsedHeight + 40;
  const collapsed = collapsible && !expanded;

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h !== contentHeight) setContentHeight(h);
  };

  return (
    <View>
      <View style={collapsed ? { height: collapsedHeight, overflow: 'hidden' } : undefined}>
        <View onLayout={onLayout}>{children}</View>
        {collapsed ? (
          <View pointerEvents="none" style={[styles.fade, { height: FADE }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity={0} />
                  <Stop offset="1" stopColor={color} stopOpacity={0.95} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
            </Svg>
          </View>
        ) : null}
      </View>
      {collapsible ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            setExpanded((v) => !v);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          style={styles.chevron}>
          <Icon
            name={activityIcons.chevronDown}
            size={18}
            color={theme.colors.textSecondary}
            style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  chevron: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 20 },
});
