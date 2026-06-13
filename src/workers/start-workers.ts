import { createOcrWorker } from "./ocr-worker";
import { createDedupWorker } from "./dedup-worker";

/**
 * Worker runner entry point.
 * Starts OCR and Dedup BullMQ workers and handles graceful shutdown.
 * Run with: npx tsx src/workers/start-workers.ts
 */

const ocrWorker = createOcrWorker();
const dedupWorker = createDedupWorker();

console.log("Workers started");

async function shutdown() {
  console.log("Shutting down workers...");
  await Promise.all([ocrWorker.close(), dedupWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
