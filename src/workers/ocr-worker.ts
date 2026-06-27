import os from "node:os";
import { type Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
// @ts-ignore
import sharp from "sharp";

import { db } from "@/lib/db";
import { documentPages, documents, notifications, ocrJobs, ocrPlCandidates } from "@/lib/db/schema";
import { logError, logWarn } from "@/lib/logging/structured-logger";
import { type HybridOcrResult, runHybridOcr } from "@/lib/ocr/hybrid-pipeline";
import { extractPlCandidates, isValidModulo11 } from "@/lib/pl/validation";
import * as nasStorage from "@/lib/storage/nas-storage";
import { withJobTimeout } from "./job-timeout";
import { awaitLoadHeadroom } from "./load-gate";
import type { OcrJobPayload } from "./ocr-queue";
import { getRedisConnectionOptions } from "./redis-connection";

/** Generate a small WebP thumbnail; handles PDFs by rendering the first page. */
async function generateThumbnail(fileBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  try {
    if (mimeType === "application/pdf") {
      return await sharp(fileBuffer, { page: 0, density: 100 })
        .resize({ width: 400 })
        .webp()
        .toBuffer();
    }
    return await sharp(fileBuffer).resize({ width: 400 }).webp().toBuffer();
  } catch {
    return null;
  }
}

/**
 * Persist per-page extraction audit (best-effort). If the document_pages table
 * hasn't been migrated yet, this logs a warning and the job still succeeds.
 */
async function persistPageAudit(documentId: string, result: HybridOcrResult): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(documentPages).where(eq(documentPages.documentId, documentId));
      if (result.pages.length === 0) return;
      await tx.insert(documentPages).values(
        result.pages.map((p) => ({
          id: nanoid(),
          documentId,
          pageNumber: p.pageNumber,
          extractionMethod: p.method,
          textContent: p.text.slice(0, 20000),
          ocrConfidence: p.confidence,
          dpiUsed: p.dpiUsed,
        })),
      );
    });
  } catch (error) {
    logWarn("[ocr-worker] Per-page audit persistence skipped (document_pages unavailable?)", {
      code: documentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Process a single OCR job using the hybrid digital-first pipeline:
 * native PDFs extract text with zero OCR; scanned/hybrid PDFs OCR only the
 * image pages; images are OCR'd (with tiling for large drawings).
 */
export async function processOcrJob(job: Job<OcrJobPayload>): Promise<void> {
  const { documentId, versionId, filePath, mimeType } = job.data;

  try {
    await db.update(documents).set({ ocrStatus: "processing" }).where(eq(documents.id, documentId));
    await db
      .update(ocrJobs)
      .set({ status: "processing", startedAt: new Date() })
      .where(eq(ocrJobs.id, job.data.jobId));

    // Load file from NAS storage.
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

    // Run the hybrid pipeline. Progress is reported per OCR page.
    const result = await runHybridOcr(fileBuffer, mimeType, {
      onProgress: async (p) => {
        if (p.stage === "ocr" && p.totalPages > 0) {
          await job.updateProgress({
            stage: p.stage,
            currentPage: p.currentPage,
            totalPages: p.totalPages,
          });
          await db
            .update(ocrJobs)
            .set({ processedPages: p.currentPage, pageCount: p.totalPages })
            .where(eq(ocrJobs.id, job.data.jobId));
        }
      },
    });

    const extractedText = result.text;
    const confidence = result.confidence;
    const pageCount = result.pageCount;

    // Identify PL candidates from the full extracted text.
    const plCandidates = extractPlCandidates(extractedText);

    await db.transaction(async (tx) => {
      const docRecord = await tx
        .select({ workspaceId: documents.workspaceId, createdBy: documents.createdBy })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      const workspaceId = docRecord[0]?.workspaceId ?? null;
      const uploadedBy = docRecord[0]?.createdBy ?? null;

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

      const thumbnailBuffer = await generateThumbnail(fileBuffer, mimeType);
      let thumbnailPath = nasStorage.getThumbnailPath(workspaceId ?? "default", documentId);
      if (thumbnailBuffer) {
        try {
          thumbnailPath = await nasStorage.storeThumbnail(
            thumbnailBuffer,
            workspaceId ?? "default",
            documentId,
          );
        } catch {
          // Non-fatal: keep computed path; thumbnail simply won't exist.
        }
      }

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

      await tx
        .update(ocrJobs)
        .set({
          status: "completed",
          confidence,
          extractedText: extractedText.slice(0, 10000),
          pageCount,
          processedPages: result.ocrPageCount,
          engine: result.method === "native" ? "native" : "tesseract",
          completedAt: new Date(),
        })
        .where(eq(ocrJobs.id, job.data.jobId));

      if (uploadedBy) {
        const methodLabel =
          result.method === "native"
            ? "native text extraction (no OCR)"
            : result.method === "hybrid"
              ? `hybrid (${result.ocrPageCount} page(s) OCR'd)`
              : "OCR";
        await tx.insert(notifications).values({
          id: nanoid(),
          userId: uploadedBy,
          type: "document_upload",
          title: "Document Processing Complete",
          message: `Processed via ${methodLabel} at ${Math.round(confidence * 100)}% confidence`,
          entityType: "document",
          entityId: documentId,
          isRead: false,
          createdAt: new Date(),
        });
      }
    });

    // Per-page audit outside the main transaction (best-effort).
    await persistPageAudit(documentId, result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await db.update(documents).set({ ocrStatus: "failed" }).where(eq(documents.id, documentId));
    await db
      .update(ocrJobs)
      .set({ status: "failed", errorMessage })
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
  // OCR (tesseract + sharp) is CPU-bound. Clamp concurrency to the available
  // cores, reserving one for the rest of the system, so OCR can never fully
  // saturate the host. The env value is an upper bound, not an override.
  const cpuCount = os.cpus().length || 1;
  const maxByCpu = Math.max(1, cpuCount - 1);
  const requested = Number(process.env.OCR_WORKER_CONCURRENCY ?? "2");
  const concurrency = Math.max(1, Math.min(requested, maxByCpu));
  // OCR can be slow on large multi-page scans; default 5 min ceiling per job.
  const jobTimeoutMs = Number(process.env.OCR_JOB_TIMEOUT_MS ?? `${5 * 60 * 1000}`);

  const worker = new Worker<OcrJobPayload>(
    "ocr-pipeline",
    async (job) => {
      // Adaptive backpressure: if the host is already saturated, briefly delay
      // the start of this CPU-bound job rather than piling onto a struggling
      // machine. Bounded by WORKER_LOAD_GATE_MAX_WAIT_MS so jobs never starve.
      await awaitLoadHeadroom({ label: "ocr-worker" });
      return withJobTimeout(processOcrJob(job), jobTimeoutMs, `OCR job ${job.id}`);
    },
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
