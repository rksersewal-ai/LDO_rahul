import { Queue } from "bullmq";
import { logError } from "@/lib/logging/structured-logger";
import { getRedisConnectionOptions } from "./redis-connection";

export interface DedupJobPayload {
  workspaceId: string;
  scanType: "basic" | "advanced";
  triggeredBy: string;
  batchSize?: number;
}

let dedupQueue: Queue | null = null;

/**
 * Returns a singleton BullMQ Queue instance for the 'dedup-scan' queue.
 */
export function getDedupQueue(): Queue {
  if (!dedupQueue) {
    dedupQueue = new Queue("dedup-scan", {
      connection: getRedisConnectionOptions(),
    });
    dedupQueue.on("error", (err) => {
      logError("[dedup-queue] Redis connection error", {}, err);
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
