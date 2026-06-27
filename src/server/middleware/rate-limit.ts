import { TRPCError } from "@trpc/server";

const MAX_REQUESTS = 100;
const WINDOW_MS = 60_000; // 60 seconds
const WINDOW_SECONDS = Math.ceil(WINDOW_MS / 1000);
const CLEANUP_INTERVAL_MS = 120_000; // cleanup every 2 minutes
const REDIS_KEY_PREFIX = "rl:"; // rate-limit namespace

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Per-process in-memory sliding window store. Used as a fast path and as a
 * fallback whenever Redis is unavailable.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired in-memory entries
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupStarted(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

// --- Lazy, shared ioredis client (best-effort) ---
//
// When REDIS_URL is set, the limiter enforces a GLOBAL counter across all
// replicas via atomic INCR + EXPIRE. If Redis is unavailable, it transparently
// falls back to the per-process in-memory window so requests are never blocked
// by an infrastructure outage (fail-open on the limiter, not the auth layer).
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
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      // Drop a broken client; a later call lazily recreates it.
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

/** In-memory sliding window check. Throws TOO_MANY_REQUESTS when exceeded. */
function checkInMemory(key: string, maxRequests = MAX_REQUESTS): void {
  ensureCleanupStarted();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (entry.count >= maxRequests) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please wait a moment before trying again.",
    });
  }

  entry.count += 1;
}

/**
 * Redis fixed-window check using atomic INCR + EXPIRE. The first request in a
 * window sets the TTL; subsequent requests increment the shared counter so the
 * limit holds across every app instance. Returns false if Redis is unavailable
 * (caller then falls back to the in-memory window).
 */
async function checkRedis(keySuffix: string, maxRequests = MAX_REQUESTS): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;

  try {
    const key = `${REDIS_KEY_PREFIX}${keySuffix}`;
    const count = await redis.incr(key);
    if (count === 1) {
      // First hit in this window — set the expiry.
      await redis.expire(key, WINDOW_SECONDS);
    } else if (count === -1) {
      return false;
    }

    if (count > maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please wait a moment before trying again.",
      });
    }
    return true;
  } catch (error) {
    // Re-throw our own limit error; swallow infra errors to fall back.
    if (error instanceof TRPCError) throw error;
    return false;
  }
}

/**
 * Rate limit check for tRPC middleware (per-user, MAX_REQUESTS per window).
 * Prefers a Redis-backed global counter; falls back to in-memory when Redis is
 * not configured or unreachable. Throws TOO_MANY_REQUESTS when exceeded.
 */
export async function checkRateLimit(userId: string | undefined): Promise<void> {
  if (!userId) {
    // No user → auth middleware will reject; nothing to rate-limit here.
    return;
  }

  const handledByRedis = await checkRedis(`user:${userId}`);
  if (!handledByRedis) {
    checkInMemory(`user:${userId}`);
  }
}

/**
 * Rate limit a public or system action by an explicit key. Useful for LAN
 * public endpoints such as share links where no authenticated user is present.
 */
export async function checkRateLimitKey(
  key: string,
  options: { maxRequests?: number } = {},
): Promise<void> {
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const handledByRedis = await checkRedis(key, maxRequests);
  if (!handledByRedis) {
    checkInMemory(key, maxRequests);
  }
}

// Export for testing
export { MAX_REQUESTS, rateLimitStore, WINDOW_MS };
