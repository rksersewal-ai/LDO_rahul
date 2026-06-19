import { logError, logInfo } from "@/lib/logging/structured-logger";
import { createDedupWorker } from "./dedup-worker";
import { createOcrWorker } from "./ocr-worker";
import { scheduleRecurringRetentionScan } from "./retention-queue";
import { createRetentionWorker } from "./retention-worker";

/**
 * Worker runner entry point.
 * Starts OCR, Dedup and Retention BullMQ workers and handles graceful shutdown.
 * Run with: npx tsx src/workers/start-workers.ts
 */

const ocrWorker = createOcrWorker();
const dedupWorker = createDedupWorker();
const retentionWorker = createRetentionWorker();

// Configure stalled job detection - jobs not reporting progress within 30s are marked stalled
// BullMQ automatically retries stalled jobs based on the job's 'attempts' setting.

// Register the recurring retention scan (idempotent across restarts).
scheduleRecurringRetentionScan().catch((error) => {
  logError(
    "Failed to schedule recurring retention scan",
    {},
    error instanceof Error ? error : new Error(String(error)),
  );
});

logInfo("Workers started", { workers: ["ocr-pipeline", "dedup-scan", "retention-scan"] });

async function shutdown() {
  logInfo("Shutting down workers...");
  await Promise.all([ocrWorker.close(), dedupWorker.close(), retentionWorker.close()]);
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
