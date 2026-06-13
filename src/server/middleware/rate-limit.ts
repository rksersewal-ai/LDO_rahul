import { TRPCError } from "@trpc/server";

const MAX_REQUESTS = 100;
const WINDOW_MS = 60_000; // 60 seconds
const CLEANUP_INTERVAL_MS = 120_000; // cleanup every 2 minutes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** In-memory sliding window rate limiter keyed by userId. */
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries
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
  // Allow process to exit without waiting for the timer
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Rate limit check for tRPC middleware.
 * Checks if the user has exceeded MAX_REQUESTS in the current window.
 * Throws TOO_MANY_REQUESTS if exceeded.
 */
export function checkRateLimit(userId: string | undefined): void {
  ensureCleanupStarted();

  if (!userId) {
    // If no user, skip rate limiting (auth middleware will handle rejection)
    return;
  }

  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || entry.resetAt <= now) {
    // Start new window
    rateLimitStore.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  // Within existing window
  if (entry.count >= MAX_REQUESTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please wait a moment before trying again.",
    });
  }

  entry.count += 1;
}

// Export for testing
export { rateLimitStore, MAX_REQUESTS, WINDOW_MS };
