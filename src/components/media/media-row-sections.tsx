import { StyleSheet, View } from 'react-native';

import type { MediaCard, MediaRecommendation, MediaRelationEdge } from '@/api/types';
import { MediaCarousel } from '@/components/media-carousel';
import { MediaGridCard } from '@/components/media-grid-card';
import { SectionHeader } from '@/components/section-header';
import { pickTitle } from '@/lib/title';
import { useSetting } from '@/settings';

import { CoverPill, MediaTypeBadge } from './media-badges';
import { relationLabel } from './media-format';

const CARD_WIDTH = 92;

type Item = { key: string; media: MediaCard; pill?: string };

function MediaRow({ title, items, onOpen }: { title: string; items: Item[]; onOpen: (id: number) => void }) {
  const preferred = useSetting('preferredTitle');
  if (!items.length) return null;
  return (
    <View>
      <SectionHeader title={title} tone="muted" inset={12} style={styles.header} />
      <MediaCarousel
        data={items}
        keyExtractor={(i) => i.key}
        itemWidth={CARD_WIDTH}
        gap={8}
        inset={12}
        renderItem={({ item }) => (
          <MediaGridCard
            title={pickTitle(item.media.title, preferred)}
            coverUrl={item.media.coverImage?.large}
            isAdult={item.media.isAdult}
            width={CARD_WIDTH}
            recyclingKey={String(item.media.id)}
            topLeft={<MediaTypeBadge type={item.media.type} />}
            topRight={item.pill ? <CoverPill label={item.pill} /> : undefined}
            onPress={() => onOpen(item.media.id)}
          />
        )}
      />
    </View>
  );
}

/** "Related": relation pill top-right, media-type badge top-left. */
export function RelatedSection({ edges, onOpen }: { edges: (MediaRelationEdge | null)[] | null | undefined; onOpen: (id: number) => void }) {
  const items: Item[] = (edges ?? []).flatMap((e, i) =>
    e?.node ? [{ key: `${e.id ?? i}-${e.node.id}`, media: e.node, pill: relationLabel(e.relationType) }] : [],
  );
  return <MediaRow title="Related" items={items} onOpen={onOpen} />;
}

/** "You may also like" (AniList recommendations). */
export function RecommendationsSection({
  nodes,
  onOpen,
}: {
  nodes: (MediaRecommendation | null)[] | null | undefined;
  onOpen: (id: number) => void;
}) {
  const items: Item[] = (nodes ?? []).flatMap((r) => (r?.mediaRecommendation ? [{ key: String(r.id), media: r.mediaRecommendation }] : []));
  return <MediaRow title="You may also like" items={items} onOpen={onOpen} />;
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
});
