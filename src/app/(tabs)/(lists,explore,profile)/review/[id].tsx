import { useLocalSearchParams } from 'expo-router';

import { ReviewDetailScreen } from '@/components/media/review-detail-screen';

/** Review detail with up/down rating ("Review" nav title from the shared stack screens). */
export default function ReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewDetailScreen key={id} id={Number(id)} />;
}
