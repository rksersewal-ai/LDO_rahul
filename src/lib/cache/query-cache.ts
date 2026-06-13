/**
 * Two-tier query cache with TTL for frequently-read, infrequently-changing data
 * (settings resolution, dashboard aggregates).
 *
 *  - L1: in-process Map (fastest, per-instance).
 *  - L2: Redis (shared across app instances) — enabled when REDIS_URL is set.
 *
 * The Redis tier makes cache hits and invalidation consistent across a
 * horizontally-scaled deployment. All Redis operations are best-effort: any
 * failure falls back to L1 / the fetcher and never throws into the request path.
 */

import { logWarn } from "@/lib/logging/structured-logger";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const REDIS_NAMESPACE = "qc:";

// Lazy ioredis client (shared). Null when Redis is unavailable/disabled.
let redisClient: InstanceType<typeof import("ioredis").default> | null = null;
let redisInitTried = false;

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  if (redisInitTried && !redisClient) return null;
  redisInitTried = true;
  try {
    const Redis = (await import("ioredis")).default;
    const client = new Redis(process.env.REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      // Discard a broken client; a later call will lazily recreate it.
      redisClient = null;
      redisInitTried = false;
    });
    await client.connect();
    redisClient = client;
    return redisClient;
  } catch {
    redisClient = null;
    return null;
  }
}

/**
 * Get a cached value or fetch it if expired/missing.
 * Checks L1, then L2 (Redis), then runs the fetcher and populates both tiers.
 *
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

  // L1
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  // L2 (Redis), best-effort
  try {
    const redis = await getRedis();
    if (redis) {
      const raw = await redis.get(REDIS_NAMESPACE + key);
      if (raw != null) {
        const data = JSON.parse(raw) as T;
        cache.set(key, { data, expiresAt: now + ttlMs });
        return data;
      }
    }
  } catch {
    // Ignore Redis read errors and fall through to the fetcher.
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlMs });

  // Populate Redis without blocking the response (fire-and-forget).
  void (async () => {
    try {
      const redis = await getRedis();
      if (redis) {
        await redis.set(REDIS_NAMESPACE + key, JSON.stringify(data), "PX", ttlMs);
      }
    } catch {
      // Best-effort; ignore.
    }
  })();

  return data;
}

/**
 * Invalidate cache entries matching a key prefix (or all if omitted).
 * Clears L1 synchronously and clears matching L2 keys best-effort.
 */
export function invalidateCache(keyPattern?: string): void {
  // L1
  if (!keyPattern) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPattern)) {
        cache.delete(key);
      }
    }
  }

  // L2 (fire-and-forget)
  void (async () => {
    try {
      const redis = await getRedis();
      if (!redis) return;
      const match = `${REDIS_NAMESPACE}${keyPattern ?? ""}*`;
      const stream = redis.scanStream({ match, count: 200 });
      const pipeline = redis.pipeline();
      let hasKeys = false;
      for await (const keys of stream as AsyncIterable<string[]>) {
        for (const k of keys) {
          pipeline.del(k);
          hasKeys = true;
        }
      }
      if (hasKeys) await pipeline.exec();
    } catch (error) {
      logWarn("[query-cache] Redis invalidation failed (L1 already cleared)", {
        keyPattern,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}

/**
 * Get current L1 cache size (for diagnostics).
 */
export function getCacheSize(): number {
  return cache.size;
}
