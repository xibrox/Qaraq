import { Image, type ImageLoadEventData } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme';

import { activityIcons } from '../activity-icons';
import { anilistUrlToHref } from './link-routing';
import { parseAniListHtml, type Block, type Inline, type MarkdownImage, type TextAlign } from './parse-blocks';

export type AniListMarkdownProps = {
  /** AniList `text(asHtml: true)` output (plain text also works). */
  html: string | null | undefined;
  /** Colour of plain paragraph text (headings, bold and links are always primary). */
  bodyTone?: 'primary' | 'secondary';
  /** Body font size (default 15). */
  fontSize?: number;
  /** Override link handling (default: in-app route for anilist.co links, browser otherwise). */
  onLinkPress?: (url: string) => void;
  style?: StyleProp<ViewStyle>;
};

const HEADING_SIZE: Record<number, number> = { 1: 26, 2: 22, 3: 20, 4: 18, 5: 16, 6: 15 };
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

type RenderCtx = {
  width: number;
  bodyColor: string;
  fontSize: number;
  openLink: (url: string) => void;
};

function useLinkOpener(override?: (url: string) => void) {
  const router = useRouter();
  return (rawUrl: string) => {
    const url = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    if (override) return override(url);
    const href = anilistUrlToHref(url);
    if (href) {
      router.push(href);
      return;
    }
    if (/^https?:\/\//i.test(url)) void WebBrowser.openBrowserAsync(url);
  };
}

/**
 * Renders AniList markdown (via its HTML output) natively: paragraphs, centred blocks, headings,
 * bold/italic/strike/code, links and @mentions, images (img / img220), spoilers, lists,
 * quotes, rules, YouTube and webm embeds.
 */
export function AniListMarkdown({ html, bodyTone = 'secondary', fontSize = 15, onLinkPress, style }: AniListMarkdownProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const openLink = useLinkOpener(onLinkPress);
  const blocks = parseAniListHtml(html);
  const ctx: RenderCtx = {
    width,
    bodyColor: bodyTone === 'primary' ? theme.colors.text : theme.colors.textSecondary,
    fontSize,
    openLink,
  };
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };
  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {renderBlocks(blocks, ctx)}
    </View>
  );
}

function renderBlocks(blocks: Block[], ctx: RenderCtx): ReactNode[] {
  return blocks.map((b, i) => <BlockView key={i} block={b} ctx={ctx} />);
}

function justify(align: TextAlign): ViewStyle['justifyContent'] {
  return align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
}

function BlockView({ block, ctx }: { block: Block; ctx: RenderCtx }) {
  const theme = useTheme();
  const c = theme.colors;
  switch (block.kind) {
    case 'text':
      return <TextBlock block={block} ctx={ctx} />;
    case 'images':
      return (
        <View style={[styles.imageRow, { justifyContent: justify(block.align) }]}>
          {block.images.map((img, i) => (
            <MarkdownImageView key={`${img.src}-${i}`} image={img} maxWidth={ctx.width} onLink={ctx.openLink} />
          ))}
        </View>
      );
    case 'rule':
      return <View style={[styles.rule, { backgroundColor: c.separator }]} />;
    case 'spoiler':
      return <SpoilerBlock blocks={block.blocks} ctx={ctx} />;
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <AppText style={{ color: ctx.bodyColor, fontSize: ctx.fontSize, lineHeight: ctx.fontSize * 1.35 }}>
                {block.ordered ? `${i + 1}.` : '•'}
              </AppText>
              <View style={styles.listBody}>{renderBlocks(item, ctx)}</View>
            </View>
          ))}
        </View>
      );
    case 'quote':
      return (
        <View style={[styles.quote, { borderLeftColor: c.border, backgroundColor: c.fillSecondary }]}>
          {renderBlocks(block.blocks, ctx)}
        </View>
      );
    case 'code':
      return (
        <View style={[styles.code, { backgroundColor: c.field }]}>
          <AppText style={{ fontFamily: MONO, fontSize: 13, lineHeight: 18 }} color={c.text}>
            {block.text}
          </AppText>
        </View>
      );
    case 'youtube':
      return <YouTubeBlock id={block.id} align={block.align} ctx={ctx} />;
    case 'video':
      return (
        <View style={{ flexDirection: 'row', justifyContent: justify(block.align) }}>
          <Pressable
            onPress={() => ctx.openLink(block.src)}
            accessibilityRole="link"
            style={[styles.videoPill, { backgroundColor: c.field, borderColor: c.border }]}>
            <Icon name={activityIcons.play} size={14} />
            <AppText variant="footnote" weight="700">
              Play video
            </AppText>
          </Pressable>
        </View>
      );
  }
}

function inlineStyle(seg: Inline, ctx: RenderCtx, primary: string, codeBg: string): TextStyle {
  const lines = [seg.href || seg.underline ? 'underline' : null, seg.strike ? 'line-through' : null].filter(Boolean).join(' ');
  return {
    ...(seg.bold || seg.href ? { color: primary } : null),
    ...(seg.bold ? { fontWeight: '800' as const } : null),
    ...(seg.italic ? { fontStyle: 'italic' as const } : null),
    ...(lines ? { textDecorationLine: lines as TextStyle['textDecorationLine'] } : null),
    ...(seg.code ? { fontFamily: MONO, backgroundColor: codeBg, fontSize: ctx.fontSize - 2 } : null),
    ...(seg.small ? { fontSize: ctx.fontSize - 3 } : null),
  };
}

function TextBlock({ block, ctx }: { block: Extract<Block, { kind: 'text' }>; ctx: RenderCtx }) {
  const theme = useTheme();
  const size = block.heading ? HEADING_SIZE[block.heading] : ctx.fontSize;
  return (
    <AppText
      align={block.align}
      color={block.heading ? theme.colors.text : ctx.bodyColor}
      weight={block.heading ? '800' : '400'}
      style={{ fontSize: size, lineHeight: Math.round(size * 1.38) }}>
      {block.inlines.map((seg, i) => {
        const style = inlineStyle(seg, ctx, theme.colors.text, theme.colors.field);
        const href = seg.href;
        return (
          <Text
            key={i}
            style={style}
            onPress={href ? () => ctx.openLink(href) : undefined}
            suppressHighlighting={false}
            accessibilityRole={href ? 'link' : undefined}>
            {seg.text}
          </Text>
        );
      })}
    </AppText>
  );
}

function parseWidth(raw: string | undefined, max: number): number | undefined {
  if (!raw) return undefined;
  const pct = /^(\d+(?:\.\d+)?)%$/.exec(raw.trim());
  if (pct) return (max * Number(pct[1])) / 100;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function MarkdownImageView({ image, maxWidth, onLink }: { image: MarkdownImage; maxWidth: number; onLink: (url: string) => void }) {
  const theme = useTheme();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  if (maxWidth <= 0) return null;
  const requested = parseWidth(image.width, maxWidth);
  const width = Math.max(1, Math.round(Math.min(maxWidth, requested ?? natural?.w ?? maxWidth)));
  const aspect = natural ? natural.w / natural.h : 16 / 9;
  const href = image.href;
  if (failed) {
    // Broken image: a small placeholder instead of a large empty box (still a link if it was one).
    return (
      <Pressable
        onPress={href ? () => onLink(href) : undefined}
        disabled={!href}
        accessibilityRole={href ? 'link' : 'image'}
        accessibilityLabel="Image failed to load"
        style={[styles.brokenImage, { backgroundColor: theme.colors.skeleton }]}>
        <Icon name={activityIcons.image} size={16} color={theme.colors.textTertiary} />
      </Pressable>
    );
  }
  const onLoad = (e: ImageLoadEventData) => {
    const { width: w, height: h } = e.source;
    if (w > 0 && h > 0 && (!natural || natural.w !== w || natural.h !== h)) setNatural({ w, h });
  };
  // Explicit width and height on a skeleton-filled frame, with the image filling it: expo-image
  // draws nothing when its size comes only from `aspectRatio` (QA: blank boxes, no skeleton).
  const img = (
    <View style={{ width, height: Math.max(1, Math.round(width / aspect)), borderRadius: 4, overflow: 'hidden', backgroundColor: theme.colors.skeleton }}>
      <Image
        source={{ uri: image.src.startsWith('//') ? `https:${image.src}` : image.src }}
        onLoad={onLoad}
        onError={() => setFailed(true)}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        transition={150}
        cachePolicy="memory-disk"
        autoplay
        accessibilityIgnoresInvertColors
      />
    </View>
  );
  if (!href) return img;
  return (
    <Pressable onPress={() => onLink(href)} accessibilityRole="link">
      {img}
    </Pressable>
  );
}

function SpoilerBlock({ blocks, ctx }: { blocks: Block[]; ctx: RenderCtx }) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return (
      <Pressable onPress={() => setRevealed(false)} style={styles.spoilerOpen} accessibilityHint="Hides the spoiler">
        {renderBlocks(blocks, ctx)}
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => setRevealed(true)}
      accessibilityRole="button"
      accessibilityLabel="Spoiler, tap to view"
      style={({ pressed }) => [styles.spoiler, { backgroundColor: theme.colors.field, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={activityIcons.eyeSlash} size={14} color={theme.colors.textSecondary} />
      <AppText variant="footnote" tone="secondary" weight="700">
        Spoiler, tap to view
      </AppText>
    </Pressable>
  );
}

function YouTubeBlock({ id, align, ctx }: { id: string; align: TextAlign; ctx: RenderCtx }) {
  if (ctx.width <= 0) return null;
  const width = Math.min(ctx.width, 480);
  return (
    <View style={{ flexDirection: 'row', justifyContent: justify(align) }}>
      <Pressable onPress={() => ctx.openLink(`https://www.youtube.com/watch?v=${id}`)} accessibilityRole="link" accessibilityLabel="YouTube video">
        <Image
          source={{ uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }}
          style={{ width, aspectRatio: 16 / 9, borderRadius: 8 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <View style={styles.playBadge}>
            <Icon name={activityIcons.play} size={22} color="#fff" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  brokenImage: { width: 44, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rule: { height: StyleSheet.hairlineWidth * 2, marginVertical: 6 },
  list: { gap: 4 },
  listItem: { flexDirection: 'row', gap: 8 },
  listBody: { flex: 1, gap: 4 },
  quote: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, borderRadius: 2, gap: 6 },
  code: { borderRadius: 6, padding: 10 },
  spoiler: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  spoilerOpen: { gap: 8 },
  videoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
