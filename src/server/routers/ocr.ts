import { z } from "zod";
import {
  getOcrJob,
  getOcrJobByDocumentId,
  getOcrStats,
  listOcrJobs,
  queueDocument,
} from "@/lib/ocr/ocr-service";
import type { OcrJobStatus, OcrPriority } from "@/lib/ocr/pipeline-config";
import { OCR_PIPELINE_CONFIG } from "@/lib/ocr/pipeline-config";
import {
  getWorkerStatus,
  processNextJob,
  simulateJobProgress,
  workerCancelJob,
  workerRetryJob,
} from "@/server/services/ocr-worker";
import { adminProcedure, engineerProcedure, protectedProcedure, router } from "@/server/trpc";

export const ocrRouter = router({
  /** List OCR jobs with optional status/priority filter */
  getQueue: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
          priority: z.enum(["high", "normal", "low"]).optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(({ input }) => {
      return listOcrJobs({
        status: input?.status as OcrJobStatus | undefined,
        priority: input?.priority as OcrPriority | undefined,
        limit: input?.limit,
        offset: input?.offset,
      });
    }),

  /** Get a single OCR job by ID */
  getJob: protectedProcedure.input(z.object({ jobId: z.string() })).query(({ input }) => {
    const job = getOcrJob(input.jobId);
    if (!job) {
      throw new Error("OCR job not found");
    }
    return job;
  }),

  /** Get OCR job for a specific document */
  getByDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(({ input }) => {
      return getOcrJobByDocumentId(input.documentId);
    }),

  /** Queue a document for OCR processing */
  queueDocument: engineerProcedure
    .input(
      z.object({
        documentId: z.string(),
        documentNumber: z.string(),
        documentTitle: z.string(),
        pages: z.number().min(1).max(OCR_PIPELINE_CONFIG.max_pages),
        priority: z.enum(["high", "normal", "low"]).default("normal"),
      }),
    )
    .mutation(({ input }) => {
      return queueDocument({
        documentId: input.documentId,
        documentNumber: input.documentNumber,
        documentTitle: input.documentTitle,
        pages: input.pages,
        priority: input.priority,
      });
    }),

  /** Retry a failed OCR job */
  retryJob: engineerProcedure.input(z.object({ jobId: z.string() })).mutation(({ input }) => {
    const result = workerRetryJob(input.jobId);
    if (!result) {
      throw new Error("Cannot retry job: not found, not failed, or max retries exceeded");
    }
    return result;
  }),

  /** Cancel an OCR job */
  cancelJob: engineerProcedure.input(z.object({ jobId: z.string() })).mutation(({ input }) => {
    const result = workerCancelJob(input.jobId);
    if (!result) {
      throw new Error("Cannot cancel job: not found or already completed/cancelled");
    }
    return result;
  }),

  /** Get OCR queue statistics */
  getStats: protectedProcedure.query(() => {
    return getOcrStats();
  }),

  /** Get worker status */
  getWorkerStatus: protectedProcedure.query(() => {
    return getWorkerStatus();
  }),

  /** Get pipeline configuration (read-only) */
  getConfig: protectedProcedure.query(() => {
    return OCR_PIPELINE_CONFIG;
  }),

  /** Advance a job's progress (dev/testing only) */
  advanceJob: adminProcedure.input(z.object({ jobId: z.string() })).mutation(({ input }) => {
    const result = simulateJobProgress(input.jobId);
    if (!result) {
      throw new Error("Cannot advance job: not found");
    }
    return result;
  }),

  /** Process next queued job (dev/testing only) */
  processNext: adminProcedure.mutation(() => {
    const result = processNextJob();
    if (!result) {
      return { message: "No jobs to process or at capacity" };
    }
    return result;
  }),
});
