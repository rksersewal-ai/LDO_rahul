import { Worker, type Job } from "bullmq";
import pdf from "pdf-parse";
// @ts-expect-error - sharp types not resolved with bundler moduleResolution
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { readFile } from "node:fs/promises";

import { db } from "@/lib/db";
import { documents, ocrJobs, ocrPlCandidates, notifications } from "@/lib/db/schema";
import { extractPlCandidates, isValidModulo11 } from "@/lib/pl/validation";
import type { OcrJobPayload } from "./ocr-queue";

/**
 * Process a single OCR job: extract text, identify PL candidates,
 * generate thumbnail, and update database records.
 */
export async function processOcrJob(job: Job<OcrJobPayload>): Promise<void> {
  const { documentId, versionId, filePath, mimeType } = job.data;

  try {
    // Step a: Update documents to processing
    await db
      .update(documents)
      .set({ ocrStatus: "processing" })
      .where(eq(documents.id, documentId));

    // Step b: Load file
    const fileBuffer = await readFile(filePath);

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
        // Degraded - no text layer
        confidence = 0.3;
      }
    } else if (mimeType.startsWith("image/")) {
      // Use sharp to get metadata (no tesseract available)
      await sharp(fileBuffer).metadata();
      extractedText = "";
      confidence = 0.3;
    }

    // Step e: Compute confidence based on text length
    if (extractedText.length > 500) {
      confidence = 0.95;
    } else if (extractedText.length > 100) {
      confidence = 0.8;
    } else {
      confidence = 0.3;
    }

    // Step f: Extract PL candidates
    const plCandidates = extractPlCandidates(extractedText);

    // Step g: Get workspace ID from document
    const docRecord = await db
      .select({ workspaceId: documents.workspaceId, createdBy: documents.createdBy })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    const workspaceId = docRecord[0]?.workspaceId ?? null;
    const uploadedBy = docRecord[0]?.createdBy ?? null;

    // Step h: Insert PL candidates
    for (const pl of plCandidates) {
      const candidateConfidence = isValidModulo11(pl) ? 0.9 : 0.6;
      const idx = extractedText.indexOf(pl);
      const contextStart = Math.max(0, idx - 15);
      const contextEnd = Math.min(extractedText.length, idx + pl.length + 15);
      const context = extractedText.slice(contextStart, contextEnd);

      await db.insert(ocrPlCandidates).values({
        id: nanoid(),
        documentId,
        versionId,
        workspaceId,
        plNumber: pl,
        confidence: candidateConfidence,
        context,
        mod11Valid: isValidModulo11(pl),
        status: "pending",
        createdAt: new Date(),
      });
    }

    // Step i: Generate thumbnail
    try {
      await sharp(fileBuffer)
        .resize({ width: 400 })
        .png()
        .toFile(`storage/thumbnails/${documentId}.png`);
    } catch {
      // Skip thumbnail generation if it fails (e.g., for PDFs)
    }

    // Step j: Update documents record
    await db
      .update(documents)
      .set({
        ocrStatus: "completed",
        ocrText: extractedText.slice(0, 10000),
        ocrConfidence: confidence,
        pageCount,
        thumbnailPath: `storage/thumbnails/${documentId}.png`,
      })
      .where(eq(documents.id, documentId));

    // Step k: Update ocrJobs
    await db
      .update(ocrJobs)
      .set({
        status: "completed",
        confidence,
        extractedText: extractedText.slice(0, 10000),
        pageCount,
        completedAt: new Date(),
      })
      .where(eq(ocrJobs.documentId, documentId));

    // Step l: Insert notification for uploader
    if (uploadedBy) {
      await db.insert(notifications).values({
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // On error: update documents to failed
    await db
      .update(documents)
      .set({ ocrStatus: "failed" })
      .where(eq(documents.id, documentId));

    // Update ocrJobs to failed
    await db
      .update(ocrJobs)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(ocrJobs.documentId, documentId));
  }
}

/**
 * Create and return a BullMQ Worker for the 'ocr-pipeline' queue.
 */
export function createOcrWorker(): Worker<OcrJobPayload> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const worker = new Worker<OcrJobPayload>("ocr-pipeline", processOcrJob, {
    connection: {
      host: new URL(redisUrl).hostname,
      port: Number(new URL(redisUrl).port) || 6379,
      maxRetriesPerRequest: null,
    },
    concurrency: 2,
  });

  return worker;
}
