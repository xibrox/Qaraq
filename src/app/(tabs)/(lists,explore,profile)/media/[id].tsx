import { useLocalSearchParams } from 'expo-router';

import { MediaDetailScreen } from '@/components/media/media-detail-screen';

/** Media detail (spec §4). Draws its own floating header; the native bar is hidden from the page. */
export default function MediaDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MediaDetailScreen key={id} id={Number(id)} />;
}
