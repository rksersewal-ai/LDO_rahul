/**
 * Mock OCR Worker Service
 *
 * Simulates a BullMQ-based OCR worker that:
 * - Picks up jobs from the queue
 * - Progresses them through status states (QUEUED -> PROCESSING -> COMPLETED/FAILED)
 * - Updates progress (pages processed, tiles processed)
 * - Calculates confidence scores
 * - Extracts structured data
 *
 * In production, this would be a separate BullMQ worker process
 * connecting to Redis and invoking Tesseract OCR.
 */

import {
  cancelJob,
  getOcrJob,
  listOcrJobs,
  processDocument,
  retryJob,
} from "@/lib/ocr/ocr-service";
import type { OcrJob } from "@/lib/ocr/pipeline-config";
import { OCR_PIPELINE_CONFIG } from "@/lib/ocr/pipeline-config";

export interface WorkerStatus {
  isRunning: boolean;
  activeJobs: number;
  maxConcurrency: number;
  processedToday: number;
  failedToday: number;
  uptime: number;
}

// Worker state
let workerRunning = false;
let processedToday = 0;
let failedToday = 0;
const startTime = Date.now();

/**
 * Get current worker status
 */
export function getWorkerStatus(): WorkerStatus {
  const { data: processingJobs } = listOcrJobs({ status: "PROCESSING" });

  return {
    isRunning: workerRunning,
    activeJobs: processingJobs.length,
    maxConcurrency: OCR_PIPELINE_CONFIG.worker_concurrency,
    processedToday,
    failedToday,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

/**
 * Start the mock worker. In dev mode, this simply marks the worker as running.
 * The actual job processing is triggered on-demand via simulateJobProgress.
 */
export function startWorker(): void {
  workerRunning = true;
}

/**
 * Stop the mock worker.
 */
export function stopWorker(): void {
  workerRunning = false;
}

/**
 * Simulate a single step of job progression.
 * Call this to advance a job's progress by one increment.
 *
 * @returns The updated job, or null if no jobs need processing
 */
export function simulateJobProgress(jobId: string): OcrJob | null {
  const job = getOcrJob(jobId);
  if (!job) return null;

  switch (job.status) {
    case "QUEUED": {
      // Transition to PROCESSING
      job.status = "PROCESSING";
      job.startedAt = new Date().toISOString();
      return job;
    }
    case "PROCESSING": {
      // Advance progress
      if (job.pagesProcessed < job.pagesTotal) {
        job.pagesProcessed += 1;
        // Advance tiles proportionally
        const tilesPerPage = Math.ceil(job.tilesTotal / job.pagesTotal);
        job.tilesProcessed = Math.min(job.tilesTotal, job.tilesProcessed + tilesPerPage);
      }

      // Check if processing is complete
      if (job.pagesProcessed >= job.pagesTotal) {
        // Simulate random failure (10% chance)
        if (Math.random() < 0.1 && job.retryCount < job.maxRetries) {
          job.status = "FAILED";
          job.error = "Simulated processing failure for testing";
          failedToday++;
          return job;
        }

        // Complete the job
        const result = processDocument(jobId);
        if (result) {
          processedToday++;
        }
        return result;
      }
      return job;
    }
    default:
      return job;
  }
}

/**
 * Process the next queued job (pick up from queue).
 * Returns the job that was started, or null if queue is empty.
 */
export function processNextJob(): OcrJob | null {
  if (!workerRunning) return null;

  const { data: processingJobs } = listOcrJobs({ status: "PROCESSING" });
  if (processingJobs.length >= OCR_PIPELINE_CONFIG.worker_concurrency) {
    return null; // At capacity
  }

  const { data: queuedJobs } = listOcrJobs({ status: "QUEUED" });
  if (queuedJobs.length === 0) return null;

  // Pick highest priority job
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  const sorted = [...queuedJobs].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  const nextJob = sorted[0];
  return simulateJobProgress(nextJob.id);
}

/**
 * Retry a failed job via the worker.
 */
export function workerRetryJob(jobId: string): OcrJob | null {
  return retryJob(jobId);
}

/**
 * Cancel a job via the worker.
 */
export function workerCancelJob(jobId: string): OcrJob | null {
  return cancelJob(jobId);
}
