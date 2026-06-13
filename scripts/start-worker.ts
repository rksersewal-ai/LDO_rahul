import { createOcrWorker } from "../src/workers/ocr-worker";

const worker = createOcrWorker();

worker.on("ready", () => {
  console.log("OCR worker is ready and listening for jobs.");
});

worker.on("completed", (job) => {
  console.log(`OCR job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
  console.error(`OCR job ${job?.id ?? "unknown"} failed:`, error);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down OCR worker...`);
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
