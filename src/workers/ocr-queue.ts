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
 * Add an OCR job to the queue with default options.
 */
export async function addOcrJob(payload: OcrJobPayload): Promise<void> {
  const queue = getOcrQueue();
  await queue.add("process-ocr", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
}
