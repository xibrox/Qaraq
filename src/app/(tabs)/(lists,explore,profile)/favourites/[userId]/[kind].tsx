import { useLocalSearchParams } from 'expo-router';

import { FavouritesListScreen } from '@/components/favourites/favourites-list-screen';
import { isFavouriteKind } from '@/components/favourites/labels';
import { RouteUserGate } from '@/components/people/route-user-gate';

export default function FavouritesRoute() {
  const { userId, kind } = useLocalSearchParams<{ userId: string; kind: string }>();
  return (
    <RouteUserGate param={userId}>
      {(id) => <FavouritesListScreen userId={id} kind={isFavouriteKind(kind) ? kind : 'anime'} />}
    </RouteUserGate>
  );
}
