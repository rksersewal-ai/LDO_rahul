import { randomUUID } from "node:crypto";
import { type Job, Worker } from "bullmq";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { dedupScanHistory, documentPlLinks, documents, duplicateDetections } from "@/lib/db/schema";
import { DEDUP_THRESHOLD, type DocInput, scoreDocumentPair } from "@/lib/dedup/scorer";
import type { DedupJobPayload } from "./dedup-queue";
import { withJobTimeout } from "./job-timeout";

/**
 * Compute a basic (fast) dedup score using only hash, doc number, and metadata signals.
 * Skips OCR trigram and PL overlap computation for speed.
 */
export function scoreDocumentPairBasic(
  docA: DocInput,
  docB: DocInput,
): {
  score: number;
  signals: { exactHash: number | null; docNumber: number | null; metadata: number | null };
} {
  const exactHash: number | null =
    docA.fileHash && docB.fileHash ? (docA.fileHash === docB.fileHash ? 1.0 : 0.0) : null;

  const docNumber: number | null =
    docA.documentNumber && docB.documentNumber
      ? docA.documentNumber === docB.documentNumber
        ? 1.0
        : 0.0
      : null;

  // Metadata: 1.0 if all 3 match, 0.5 if 2/3 match, 0.0 otherwise
  let metadata: number | null = null;
  if (
    docA.workshop ||
    docA.section ||
    docA.category ||
    docB.workshop ||
    docB.section ||
    docB.category
  ) {
    let matchCount = 0;
    if (docA.workshop && docB.workshop && docA.workshop === docB.workshop) matchCount++;
    if (docA.section && docB.section && docA.section === docB.section) matchCount++;
    if (docA.category && docB.category && docA.category === docB.category) matchCount++;
    metadata = matchCount >= 3 ? 1.0 : matchCount === 2 ? 0.5 : 0.0;
  }

  // Weighted score with redistribution of available signals
  const signalValues: Array<{ value: number | null; weight: number }> = [
    { value: exactHash, weight: 0.4 },
    { value: docNumber, weight: 0.4 },
    { value: metadata, weight: 0.2 },
  ];

  let availableWeightSum = 0;
  for (const s of signalValues) {
    if (s.value !== null) availableWeightSum += s.weight;
  }

  let score = 0;
  if (availableWeightSum > 0) {
    for (const s of signalValues) {
      if (s.value !== null) {
        score += s.value * (s.weight / availableWeightSum);
      }
    }
  }

  return { score, signals: { exactHash, docNumber, metadata } };
}

/**
 * Process a dedup scan job.
 */
export async function processDedupJob(job: Job<DedupJobPayload>): Promise<void> {
  const { workspaceId, scanType, triggeredBy, batchSize = 500 } = job.data;
  const scanId = randomUUID();

  // Insert scan history record with status='running'
  await db.insert(dedupScanHistory).values({
    id: scanId,
    workspaceId,
    scanType,
    status: "running",
    triggeredBy,
    startedAt: new Date(),
    batchSize,
  });

  let totalPairsScored = 0;
  let detectionsFound = 0;

  try {
    // Fetch all non-deleted documents in workspace
    const allDocs = await db
      .select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        title: documents.title,
        fileHash: documents.fileHash,
        ocrText: documents.ocrText,
        workshop: documents.workshop,
        section: documents.section,
        category: documents.category,
        thumbnailPath: documents.thumbnailPath,
      })
      .from(documents)
      .where(and(eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 0)));

    // Fetch PL links for all documents
    const docIds = allDocs.map((d) => d.id);
    const plLinksMap = new Map<string, string[]>();

    if (docIds.length > 0 && scanType === "advanced") {
      // Only fetch PL links for advanced scan (basic scan skips PL overlap)
      const PL_BATCH = 500;
      for (let i = 0; i < docIds.length; i += PL_BATCH) {
        const batch = docIds.slice(i, i + PL_BATCH);
        const links = await db
          .select({
            documentId: documentPlLinks.documentId,
            plNumberId: documentPlLinks.plNumberId,
          })
          .from(documentPlLinks)
          .where(
            sql`${documentPlLinks.documentId} IN (${sql.join(
              batch.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          );
        for (const link of links) {
          const existing = plLinksMap.get(link.documentId) ?? [];
          existing.push(link.plNumberId);
          plLinksMap.set(link.documentId, existing);
        }
      }
    }

    // Build DocInput objects
    const docInputs: DocInput[] = allDocs.map((doc) => ({
      id: doc.id,
      fileHash: doc.fileHash,
      documentNumber: doc.documentNumber,
      title: doc.title,
      ocrText: scanType === "advanced" ? doc.ocrText : null, // Basic scan skips OCR text
      plNumberIds: plLinksMap.get(doc.id) ?? [],
      workshop: doc.workshop,
      section: doc.section,
      category: doc.category,
      thumbnailPath: doc.thumbnailPath,
    }));

    // Process pairs in batches
    const insertBuffer: Array<{
      id: string;
      workspaceId: string;
      documentAId: string;
      documentBId: string;
      score: number;
      hashMatch: boolean;
      docNumberMatch: boolean;
      titleSimilarity: number;
      ocrTextSimilarity: number;
      plOverlap: number;
      metaMatch: boolean;
      thumbPhashDistance: number | null;
      status: string;
    }> = [];

    for (let i = 0; i < docInputs.length; i++) {
      // Check for job cancellation between batches
      if (i > 0 && i % batchSize === 0) {
        const isActive = await job.isActive();
        if (!isActive) {
          // Job was cancelled
          await db
            .update(dedupScanHistory)
            .set({
              status: "cancelled",
              completedAt: new Date(),
              pairsScored: totalPairsScored,
              detectionsFound,
            })
            .where(eq(dedupScanHistory.id, scanId));
          return;
        }
      }

      for (let j = i + 1; j < docInputs.length; j++) {
        const docInputA = docInputs[i];
        const docInputB = docInputs[j];

        let score: number;
        let hashMatch = false;
        let docNumberMatch = false;
        let titleSimilarity = 0;
        let ocrTextSimilarity = 0;
        let plOverlap = 0;
        let metaMatch = false;

        if (scanType === "basic") {
          const result = scoreDocumentPairBasic(docInputA, docInputB);
          score = result.score;
          hashMatch = result.signals.exactHash === 1.0;
          docNumberMatch = result.signals.docNumber === 1.0;
          metaMatch = result.signals.metadata === 1.0;
        } else {
          const result = scoreDocumentPair(docInputA, docInputB);
          score = result.score;
          hashMatch = result.signals.exactHash === 1.0;
          docNumberMatch = result.signals.docNumber === 1.0;
          titleSimilarity = result.signals.titleTrigram ?? 0;
          ocrTextSimilarity = result.signals.ocrTextTrigram ?? 0;
          plOverlap = result.signals.plOverlap ?? 0;
          metaMatch = result.signals.metadata === 1.0;
        }

        totalPairsScored++;

        if (score >= DEDUP_THRESHOLD) {
          // Ensure documentAId < documentBId for uniqueness
          const [aId, bId] =
            docInputA.id < docInputB.id
              ? [docInputA.id, docInputB.id]
              : [docInputB.id, docInputA.id];

          insertBuffer.push({
            id: randomUUID(),
            workspaceId,
            documentAId: aId,
            documentBId: bId,
            score,
            hashMatch,
            docNumberMatch,
            titleSimilarity,
            ocrTextSimilarity,
            plOverlap,
            metaMatch,
            thumbPhashDistance: null,
            status: "pending",
          });
        }

        // Flush insert buffer when it reaches batchSize
        if (insertBuffer.length >= batchSize) {
          const batch = insertBuffer.splice(0, insertBuffer.length);
          const inserted = await db
            .insert(duplicateDetections)
            .values(batch)
            .onConflictDoNothing({
              target: [duplicateDetections.documentAId, duplicateDetections.documentBId],
            })
            .returning({ id: duplicateDetections.id });
          detectionsFound += inserted.length;
        }
      }
    }

    // Flush remaining insertions
    if (insertBuffer.length > 0) {
      const inserted = await db
        .insert(duplicateDetections)
        .values(insertBuffer)
        .onConflictDoNothing({
          target: [duplicateDetections.documentAId, duplicateDetections.documentBId],
        })
        .returning({ id: duplicateDetections.id });
      detectionsFound += inserted.length;
    }

    // Update history to completed
    await db
      .update(dedupScanHistory)
      .set({
        status: "completed",
        completedAt: new Date(),
        pairsScored: totalPairsScored,
        detectionsFound,
      })
      .where(eq(dedupScanHistory.id, scanId));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update history to failed
    await db
      .update(dedupScanHistory)
      .set({
        status: "failed",
        completedAt: new Date(),
        pairsScored: totalPairsScored,
        detectionsFound,
        errorMessage,
      })
      .where(eq(dedupScanHistory.id, scanId));

    throw error; // Re-throw so BullMQ marks job as failed
  }
}

/**
 * Create and return a BullMQ Worker for the 'dedup-scan' queue.
 *
 * Concurrency and per-job timeout are configurable via env. Dedup scans are
 * O(n²) over a workspace and can run long, so the default ceiling is generous.
 */
export function createDedupWorker(): Worker<DedupJobPayload> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const concurrency = Number(process.env.DEDUP_WORKER_CONCURRENCY ?? "1");
  const jobTimeoutMs = Number(process.env.DEDUP_JOB_TIMEOUT_MS ?? `${30 * 60 * 1000}`);

  const worker = new Worker<DedupJobPayload>(
    "dedup-scan",
    (job) => withJobTimeout(processDedupJob(job), jobTimeoutMs, `Dedup scan job ${job.id}`),
    {
      connection: {
        host: new URL(redisUrl).hostname,
        port: Number(new URL(redisUrl).port) || 6379,
        maxRetriesPerRequest: null,
      },
      concurrency,
    },
  );

  return worker;
}
