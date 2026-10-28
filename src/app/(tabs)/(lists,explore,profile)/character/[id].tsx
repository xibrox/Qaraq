import { useLocalSearchParams } from 'expo-router';

import { CharacterDetailScreen } from '@/components/people/character-screen';

export default function CharacterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CharacterDetailScreen id={Number(id)} />;
}
