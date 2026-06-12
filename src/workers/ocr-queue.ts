import { Queue } from "bullmq";

export interface OcrJobPayload {
  documentId: string;
  versionId: string;
  filePath: string;
  mimeType: string;
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let ocrQueue: Queue | null = null;

/**
 * Returns a singleton BullMQ Queue instance for the 'ocr-pipeline' queue.
 */
export function getOcrQueue(): Queue {
  if (!ocrQueue) {
    ocrQueue = new Queue("ocr-pipeline", {
      connection: {
        host: new URL(redisUrl).hostname,
        port: Number(new URL(redisUrl).port) || 6379,
        maxRetriesPerRequest: null,
      },
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
