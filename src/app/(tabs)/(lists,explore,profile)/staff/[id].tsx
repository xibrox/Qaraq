import { useLocalSearchParams } from 'expo-router';

import { StaffDetailScreen } from '@/components/people/staff-screen';

export default function StaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StaffDetailScreen id={Number(id)} />;
}
