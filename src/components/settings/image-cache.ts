import { Directory, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * "Clear Image Cache" support. expo-image has no size API, so the size is read from the
 * native disk cache folders it uses:
 * - iOS: SDWebImage's shared cache, `Library/Caches/com.hackemist.SDImageCache`
 * - Android: Glide's internal disk cache, `<cacheDir>/image_manager_disk_cache`
 */
const CACHE_FOLDERS: Partial<Record<typeof Platform.OS, readonly string[]>> = {
  ios: ['com.hackemist.SDImageCache'],
  android: ['image_manager_disk_cache'],
};

/** Bytes used by the image disk cache (0 when unknown or on web). */
export function getImageCacheSize(): number {
  const folders = CACHE_FOLDERS[Platform.OS];
  if (!folders) return 0;
  let total = 0;
  for (const name of folders) {
    try {
      const dir = new Directory(Paths.cache, name);
      if (dir.exists) total += dir.size ?? 0;
    } catch {
      // Unreadable folder: count it as empty.
    }
  }
  return total;
}

/** Clear expo-image's memory and disk caches. */
export async function clearImageCache(): Promise<void> {
  await Promise.allSettled([Image.clearMemoryCache(), Image.clearDiskCache()]);
}

/**
 * "17.85 MB" (decimal units, like iOS' ByteCountFormatter). Anything under 1 KB reads "0 KB":
 * an emptied cache still holds a few bytes of folder metadata.
 */
export function formatCacheSize(bytes: number): string {
  if (bytes < 1000) return '0 KB';
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(2)} KB`;
  if (bytes < 1000 * 1000 * 1000) return `${(bytes / 1000 / 1000).toFixed(2)} MB`;
  return `${(bytes / 1000 / 1000 / 1000).toFixed(2)} GB`;
}

/** Live image cache size plus a `clear()` action that refreshes it. */
export function useImageCache() {
  const [bytes, setBytes] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(() => {
    // Directory.size walks the folder synchronously; defer it past the first frame.
    setTimeout(() => setBytes(getImageCacheSize()), 0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    setClearing(true);
    try {
      await clearImageCache();
    } finally {
      setClearing(false);
      refresh();
    }
  }, [refresh]);

  return { bytes, label: bytes == null ? '' : formatCacheSize(bytes), clearing, clear, refresh };
}
