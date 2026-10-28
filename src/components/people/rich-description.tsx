import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View, type ViewInstance } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { useRevealTop } from '@/components/scroll-reveal';
import { haptics } from '@/lib/haptics';
import { hrefs } from '@/navigation/hrefs';
import { useSetting } from '@/settings';
import { useTheme } from '@/theme';

import { parseAniListLink, parseHtml, type HtmlRun } from './html';

export type RichDescriptionProps = {
  /** AniList HTML (`description(asHtml: true)`). */
  html: string | null | undefined;
  /** Lines shown while collapsed (default 6). */
  collapsedLines?: number;
};

function openLink(href: string) {
  const link = parseAniListLink(href);
  if (!link) {
    Linking.openURL(href).catch(() => undefined);
    return;
  }
  switch (link.kind) {
    case 'media':
      router.push(hrefs.media(link.id));
      return;
    case 'character':
      router.push(hrefs.character(link.id));
      return;
    case 'staff':
      router.push(hrefs.staff(link.id));
      return;
    case 'studio':
      router.push(hrefs.studio(link.id));
  }
}

/**
 * Description card for character / staff pages: rendered AniList HTML with tap-to-reveal
 * spoilers, in-app AniList links, and AniClient's collapse ("⌄" to expand). Honors
 * "Expand Summary By Default".
 */
export function RichDescription({ html, collapsedLines = 6 }: RichDescriptionProps) {
  const theme = useTheme();
  const c = theme.colors;
  const expandByDefault = useSetting('expandSummaryByDefault');
  const [expanded, setExpanded] = useState(expandByDefault);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [overflows, setOverflows] = useState(false);
  const cardRef = useRef<ViewInstance>(null);
  const revealTop = useRevealTop();
  const runs = parseHtml(html);
  if (runs.length === 0) return null;

  const reveal = (i: number) => {
    haptics.selection();
    setRevealed((prev) => new Set(prev).add(i));
  };

  // Android crashes the whole app (java.lang.IndexOutOfBoundsException from TextLine.measure /
  // ReactUnderlineSpan) when `numberOfLines` ellipsizes a text whose nested spans (links, spoiler
  // backgrounds, heading sizes) cross the ellipsis. Character and voice-actor descriptions are
  // full of those, so on Android the collapsed state never ellipsizes: the full text is laid out
  // and clipped to `collapsedLines` with maxHeight. Links also stay colour-only while collapsed.
  const android = Platform.OS === 'android';
  const underline = !android || expanded;
  const collapsedStyle = !expanded && android ? { maxHeight: collapsedLines * LINE_HEIGHT, overflow: 'hidden' as const } : null;
  const renderRun = (run: HtmlRun, i: number) => {
    const hidden = run.spoiler != null && !revealed.has(run.spoiler);
    const style = [
      run.bold && styles.bold,
      run.bold && !run.href ? { color: c.text } : null,
      run.italic && styles.italic,
      run.heading && styles.heading,
      run.href && !hidden ? { color: c.accent, textDecorationLine: underline ? ('underline' as const) : ('none' as const) } : null,
      hidden ? { color: c.surfaceElevated, backgroundColor: c.surfaceElevated } : null,
    ];
    const onPress = hidden ? () => reveal(run.spoiler!) : run.href ? () => openLink(run.href!) : undefined;
    return (
      <AppText
        key={i}
        variant="body"
        tone="secondary"
        style={style}
        onPress={onPress}
        accessibilityRole={run.href && !hidden ? 'link' : undefined}
        accessibilityLabel={hidden ? 'Spoiler, double tap to reveal' : undefined}>
        {run.text}
      </AppText>
    );
  };

  const hasSpoilers = runs.some((r) => r.spoiler != null);
  return (
    <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: c.surface, borderRadius: theme.radii.xl }]}>
      <AppText
        variant="body"
        tone="secondary"
        numberOfLines={expanded || android ? undefined : collapsedLines}
        onTextLayout={(e) => {
          // Ellipsized text reports at most `collapsedLines` lines; full text reports them all.
          const lines = e.nativeEvent.lines.length;
          const truncated = !expanded && !android;
          if (!overflows && (truncated ? lines >= collapsedLines : lines > collapsedLines)) setOverflows(true);
        }}
        style={[styles.text, collapsedStyle]}>
        {runs.map(renderRun)}
      </AppText>
      {hasSpoilers && expanded && revealed.size === 0 ? (
        <AppText variant="caption1" tone="tertiary">
          Tap a hidden passage to reveal spoilers
        </AppText>
      ) : null}
      {overflows ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            setExpanded(!expanded);
            if (expanded) revealTop?.(cardRef.current);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse description' : 'Expand description'}
          style={styles.toggle}>
          <Icon
            name={icons.chevronDown}
            size={16}
            color={c.textSecondary}
            style={expanded ? styles.flipped : undefined}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const LINE_HEIGHT = 21;

const styles = StyleSheet.create({
  card: { padding: 14, gap: 6 },
  text: { lineHeight: LINE_HEIGHT },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  heading: { fontSize: 17 },
  toggle: { alignSelf: 'center', paddingTop: 2 },
  flipped: { transform: [{ rotate: '180deg' }] },
});
