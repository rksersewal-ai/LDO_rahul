import { Queue } from "bullmq";

export interface RetentionScanPayload {
  /** Optional: limit the scan to a single workspace. Omit to scan all. */
  workspaceId?: string;
  triggeredBy?: string;
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

/** How often the recurring retention scan runs (default: every 24h). */
export const RETENTION_SCAN_INTERVAL_MS = Number(
  process.env.RETENTION_SCAN_INTERVAL_MS ?? `${24 * 60 * 60 * 1000}`,
);

let retentionQueue: Queue | null = null;

/**
 * Returns a singleton BullMQ Queue instance for the 'retention-scan' queue.
 */
export function getRetentionQueue(): Queue {
  if (!retentionQueue) {
    retentionQueue = new Queue("retention-scan", {
      connection: {
        host: new URL(redisUrl).hostname,
        port: Number(new URL(redisUrl).port) || 6379,
        maxRetriesPerRequest: null,
      },
    });
  }
  return retentionQueue;
}

/**
 * Add a one-off retention scan job (e.g. triggered manually by an admin).
 */
export async function addRetentionScanJob(payload: RetentionScanPayload = {}): Promise<void> {
  const queue = getRetentionQueue();
  await queue.add("retention-scan", payload, {
    attempts: 1,
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  });
}

/**
 * Register the recurring retention scan. Uses a stable repeat key so duplicate
 * schedulers are not created across worker restarts.
 */
export async function scheduleRecurringRetentionScan(): Promise<void> {
  const queue = getRetentionQueue();
  await queue.add("retention-scan", { triggeredBy: "scheduler" } satisfies RetentionScanPayload, {
    repeat: { every: RETENTION_SCAN_INTERVAL_MS },
    jobId: "retention-scan-recurring",
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  });
}
