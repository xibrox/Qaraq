import { useEffect, useState } from 'react';

import { nowSeconds } from '@/lib/format';

/** Current unix time in seconds, refreshed every `intervalMs` (airing countdowns). */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(nowSeconds);
  useEffect(() => {
    const id = setInterval(() => setNow(nowSeconds()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
