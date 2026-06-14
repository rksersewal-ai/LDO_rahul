import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import pdf from "pdf-parse";
// @ts-expect-error - sharp types not resolved with bundler moduleResolution
import sharp from "sharp";

import { db } from "@/lib/db";
import { documents, notifications, ocrJobs, ocrPlCandidates } from "@/lib/db/schema";
import { logError } from "@/lib/logging/structured-logger";
import { recognizeImage } from "@/lib/ocr/tesseract-engine";
import { extractPlCandidates, isValidModulo11 } from "@/lib/pl/validation";
import * as nasStorage from "@/lib/storage/nas-storage";
import { withJobTimeout } from "./job-timeout";
import type { OcrJobPayload } from "./ocr-queue";
import { getRedisConnectionOptions } from "./redis-connection";

/**
 * Process a single OCR job: extract text, identify PL candidates,
 * generate thumbnail, and update database records.
 */
export async function processOcrJob(job: Job<OcrJobPayload>): Promise<void> {
  const { documentId, versionId, filePath, mimeType } = job.data;

  try {
    // Step a: Update documents to processing
    await db.update(documents).set({ ocrStatus: "processing" }).where(eq(documents.id, documentId));

    // Step b: Load file from NAS storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = await nasStorage.getFile(filePath);
    } catch (storageError) {
      const storageMsg =
        storageError instanceof Error ? storageError.message : "Unknown storage error";
      await db
        .update(ocrJobs)
        .set({ status: "failed", errorMessage: `NAS storage unavailable: ${storageMsg}` })
        .where(eq(ocrJobs.id, job.data.jobId));
      await db.update(documents).set({ ocrStatus: "failed" }).where(eq(documents.id, documentId));
      return;
    }

    // Step c: Initialize extraction variables
    let extractedText = "";
    let pageCount = 1;
    let confidence = 0.3;

    // Step d: Branch by mimeType
    if (mimeType === "application/pdf") {
      const data = await pdf(fileBuffer);
      extractedText = data.text;
      pageCount = data.numpages;

      if (extractedText.length <= 100) {
        // Image-only PDF - render first page to PNG then OCR
        const pngBuffer = await sharp(fileBuffer, { page: 0 }).png().toBuffer();
        const ocrResult = await recognizeImage(pngBuffer, "image/png");
        if (ocrResult.text.length > 0) {
          extractedText = ocrResult.text;
          confidence = ocrResult.confidence;
        } else {
          // Tesseract returned empty - degraded fallback
          confidence = 0.3;
        }
      }
    } else if (mimeType.startsWith("image/")) {
      // Use tesseract for image OCR
      const ocrResult = await recognizeImage(fileBuffer, mimeType);
      if (ocrResult.text.length > 0) {
        extractedText = ocrResult.text;
        confidence = ocrResult.confidence;
      } else {
        // Tesseract returned empty - degraded fallback
        extractedText = "";
        confidence = 0.3;
      }
    }

    // Step e: Compute confidence based on text length (only if not already set by tesseract)
    if (extractedText.length > 500) {
      confidence = Math.max(confidence, 0.95);
    } else if (extractedText.length > 100) {
      confidence = Math.max(confidence, 0.8);
    }
    // If extractedText <= 100, keep existing confidence (0.3 for degraded or tesseract value)

    // Step f: Extract PL candidates
    const plCandidates = extractPlCandidates(extractedText);

    // Step g-l: Wrap DB mutations in a transaction
    await db.transaction(async (tx) => {
      // Step g: Get workspace ID from document
      const docRecord = await tx
        .select({ workspaceId: documents.workspaceId, createdBy: documents.createdBy })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      const workspaceId = docRecord[0]?.workspaceId ?? null;
      const uploadedBy = docRecord[0]?.createdBy ?? null;

      // Step h: Insert PL candidates in a single batch to avoid N+1 inserts
      if (plCandidates.length > 0) {
        const candidateRows = plCandidates.map((pl) => {
          const candidateConfidence = isValidModulo11(pl) ? 0.9 : 0.6;
          const idx = extractedText.indexOf(pl);
          const contextStart = Math.max(0, idx - 15);
          const contextEnd = Math.min(extractedText.length, idx + pl.length + 15);
          const context = extractedText.slice(contextStart, contextEnd);

          return {
            id: nanoid(),
            documentId,
            versionId,
            workspaceId,
            plNumber: pl,
            confidence: candidateConfidence,
            context,
            mod11Valid: isValidModulo11(pl),
            status: "pending" as const,
            createdAt: new Date(),
          };
        });

        await tx.insert(ocrPlCandidates).values(candidateRows);
      }

      // Step i: Generate thumbnail via NAS storage
      let thumbnailPath = nasStorage.getThumbnailPath(workspaceId ?? "default", documentId);
      try {
        const thumbnailBuffer = await sharp(fileBuffer).resize({ width: 400 }).webp().toBuffer();
        thumbnailPath = await nasStorage.storeThumbnail(
          thumbnailBuffer,
          workspaceId ?? "default",
          documentId,
        );
      } catch {
        // Skip thumbnail generation if it fails (e.g., for PDFs)
      }

      // Step j: Update documents record
      await tx
        .update(documents)
        .set({
          ocrStatus: "completed",
          ocrText: extractedText.slice(0, 10000),
          ocrConfidence: confidence,
          pageCount,
          thumbnailPath,
        })
        .where(eq(documents.id, documentId));

      // Step k: Update ocrJobs by job ID
      await tx
        .update(ocrJobs)
        .set({
          status: "completed",
          confidence,
          extractedText: extractedText.slice(0, 10000),
          pageCount,
          completedAt: new Date(),
        })
        .where(eq(ocrJobs.id, job.data.jobId));

      // Step l: Insert notification for uploader
      if (uploadedBy) {
        await tx.insert(notifications).values({
          id: nanoid(),
          userId: uploadedBy,
          type: "document_upload",
          title: "OCR Processing Complete",
          message: `Document OCR completed with ${Math.round(confidence * 100)}% confidence`,
          entityType: "document",
          entityId: documentId,
          isRead: false,
          createdAt: new Date(),
        });
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // On error: update documents to failed
    await db.update(documents).set({ ocrStatus: "failed" }).where(eq(documents.id, documentId));

    // Update ocrJobs to failed by job ID
    await db
      .update(ocrJobs)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(ocrJobs.id, job.data.jobId));
  }
}

/**
 * Create and return a BullMQ Worker for the 'ocr-pipeline' queue.
 *
 * Concurrency and per-job timeout are configurable via env so deployments can
 * tune throughput vs. resource use without code changes.
 */
export function createOcrWorker(): Worker<OcrJobPayload> {
  const concurrency = Number(process.env.OCR_WORKER_CONCURRENCY ?? "2");
  // OCR can be slow on large multi-page scans; default 5 min ceiling per job.
  const jobTimeoutMs = Number(process.env.OCR_JOB_TIMEOUT_MS ?? `${5 * 60 * 1000}`);

  const worker = new Worker<OcrJobPayload>(
    "ocr-pipeline",
    (job) => withJobTimeout(processOcrJob(job), jobTimeoutMs, `OCR job ${job.id}`),
    {
      connection: getRedisConnectionOptions(),
      concurrency,
    },
  );

  // Without an 'error' listener a transient Redis outage crashes the process.
  worker.on("error", (err) => {
    logError("[ocr-worker] Worker error", {}, err);
  });

  return worker;
}
