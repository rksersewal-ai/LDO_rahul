import { logError, logInfo } from "@/lib/logging/structured-logger";
import { createOcrWorker } from "./ocr-worker";
import { createDedupWorker } from "./dedup-worker";

/**
 * Worker runner entry point.
 * Starts OCR and Dedup BullMQ workers and handles graceful shutdown.
 * Run with: npx tsx src/workers/start-workers.ts
 */

const ocrWorker = createOcrWorker();
const dedupWorker = createDedupWorker();

logInfo("Workers started", { workers: ["ocr-pipeline", "dedup-scan"] });

async function shutdown() {
  logInfo("Shutting down workers...");
  await Promise.all([ocrWorker.close(), dedupWorker.close()]);
  process.exit(0);
}

// Catch unhandled promise rejections so they are logged in structured format
// before the process crashes (Node.js ≥15 exits on unhandled rejections by default).
process.on("unhandledRejection", (reason) => {
  logError(
    "Unhandled promise rejection in worker process",
    {},
    reason instanceof Error ? reason : new Error(String(reason)),
  );
  // Allow the default behavior (exit) to proceed after logging.
});

process.on("uncaughtException", (error) => {
  logError("Uncaught exception in worker process", {}, error);
  process.exit(1);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
