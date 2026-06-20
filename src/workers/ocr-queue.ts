import { Queue } from "bullmq";
import { logError } from "@/lib/logging/structured-logger";
import { getRedisConnectionOptions } from "./redis-connection";

export interface OcrJobPayload {
  jobId: string;
  documentId: string;
  versionId: string;
  filePath: string;
  mimeType: string;
}

let ocrQueue: Queue | null = null;

/**
 * Returns a singleton BullMQ Queue instance for the 'ocr-pipeline' queue.
 */
export function getOcrQueue(): Queue {
  if (!ocrQueue) {
    ocrQueue = new Queue("ocr-pipeline", {
      connection: getRedisConnectionOptions(),
    });
    // Prevent an unhandled 'error' event (e.g. transient Redis outage) from
    // crashing the host process.
    ocrQueue.on("error", (err) => {
      logError("[ocr-queue] Redis connection error", {}, err);
    });
  }
  return ocrQueue;
}

/**
 * Add an OCR job to the queue.
 *
 * removeOnComplete/removeOnFail bound the number of finished job records kept in
 * Redis — without them, every processed document would leave a permanent job
 * record and slowly exhaust Redis memory at scale.
 */
export async function addOcrJob(payload: OcrJobPayload): Promise<void> {
  const queue = getOcrQueue();
  await queue.add("process-ocr", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800 },
  });
}
