/**
 * Simple in-memory query cache with TTL for dashboard aggregation queries.
 * Prevents repeated database queries for data that changes infrequently.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value or fetch it if expired/missing.
 * @param key - Unique cache key
 * @param ttlMs - Time-to-live in milliseconds
 * @param fetcher - Async function to fetch the data if not cached
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Invalidate cache entries matching a key pattern.
 * If no pattern is provided, clears all cache entries.
 * @param keyPattern - Optional string prefix pattern to match
 */
export function invalidateCache(keyPattern?: string): void {
  if (!keyPattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(keyPattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Get current cache size (for diagnostics).
 */
export function getCacheSize(): number {
  return cache.size;
}
