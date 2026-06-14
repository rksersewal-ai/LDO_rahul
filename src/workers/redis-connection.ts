import type { RedisOptions } from "ioredis";
import { logWarn } from "@/lib/logging/structured-logger";

const DEFAULT_REDIS_URL = "redis://localhost:6379";

/**
 * Build ioredis connection options for BullMQ from REDIS_URL.
 *
 * Naive `{ host, port }` extraction (as previously used by every queue and
 * worker) silently dropped the username, password, database index and TLS
 * (`rediss://`) from the URL — so any secured or managed Redis (Upstash,
 * Railway, ElastiCache with auth, etc.) would fail to connect and break the
 * OCR / dedup / retention pipelines. This parses the full URL and preserves
 * all of those.
 *
 * BullMQ requires `maxRetriesPerRequest: null` on the connection, so it is
 * always set here. Connection failures are surfaced via the `error` event
 * listeners attached where queues/workers are created.
 */
export function getRedisConnectionOptions(): RedisOptions {
  const url = process.env.REDIS_URL || DEFAULT_REDIS_URL;

  try {
    const parsed = new URL(url);
    const dbFromPath =
      parsed.pathname && parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined;

    return {
      host: parsed.hostname || "127.0.0.1",
      port: Number(parsed.port) || 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      db: dbFromPath !== undefined && Number.isFinite(dbFromPath) ? dbFromPath : undefined,
      // Enable TLS for rediss:// endpoints.
      tls: parsed.protocol === "rediss:" ? {} : undefined,
      // Required by BullMQ for blocking commands.
      maxRetriesPerRequest: null,
    };
  } catch {
    logWarn("[redis-connection] Invalid REDIS_URL; falling back to localhost defaults", {});
    return { host: "127.0.0.1", port: 6379, maxRetriesPerRequest: null };
  }
}
