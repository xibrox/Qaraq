import { useLocalSearchParams } from 'expo-router';

import { StudioDetailScreen } from '@/components/people/studio-screen';

export default function StudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StudioDetailScreen id={Number(id)} />;
}
