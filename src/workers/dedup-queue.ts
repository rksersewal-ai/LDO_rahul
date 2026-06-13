import { Queue } from "bullmq";

export interface DedupJobPayload {
  workspaceId: string;
  scanType: "basic" | "advanced";
  triggeredBy: string;
  batchSize?: number;
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let dedupQueue: Queue | null = null;

/**
 * Returns a singleton BullMQ Queue instance for the 'dedup-scan' queue.
 */
export function getDedupQueue(): Queue {
  if (!dedupQueue) {
    dedupQueue = new Queue("dedup-scan", {
      connection: {
        host: new URL(redisUrl).hostname,
        port: Number(new URL(redisUrl).port) || 6379,
        maxRetriesPerRequest: null,
      },
    });
  }
  return dedupQueue;
}

/**
 * Add a dedup scan job to the queue.
 */
export async function addDedupJob(payload: DedupJobPayload): Promise<void> {
  const queue = getDedupQueue();
  await queue.add("dedup-scan", payload, {
    attempts: 1,
    removeOnComplete: {
      age: 86400, // 24 hours
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  });
}
