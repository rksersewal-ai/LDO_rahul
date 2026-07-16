import { randomUUID } from "node:crypto";
import { type Job, Worker } from "bullmq";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { dedupScanHistory, documentPlLinks, documents, duplicateDetections } from "@/lib/db/schema";
import { DEDUP_THRESHOLD, type DocInput, scoreDocumentPair } from "@/lib/dedup/scorer";
import { logError } from "@/lib/logging/structured-logger";
import type { DedupJobPayload } from "./dedup-queue";
import { withJobTimeout } from "./job-timeout";
import { awaitLoadHeadroom } from "./load-gate";
import { getRedisConnectionOptions } from "./redis-connection";

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

type CandidateDocRow = {
  id: string;
  documentNumber: string;
  title: string;
  fileHash: string | null;
  ocrText: string | null;
  workshop: string | null;
  section: string | null;
  category: string | null;
  thumbnailPath: string | null;
};

/**
 * Process a dedup scan job.
 *
 * SCALABILITY: this uses a candidate-blocking strategy instead of the previous
 * O(n²) all-pairs comparison (which was infeasible beyond a few thousand docs
 * and had to be capped). Candidate pairs are generated cheaply via the database:
 *
 *   - exact file_hash groups      (GROUP BY, index-assisted)  → true duplicates
 *   - exact document_number groups (GROUP BY)
 *   - exact title groups          (GROUP BY)
 *   - shared PL-link pairs         (self-join, advanced scans only)
 *
 * Only those candidate pairs are then scored with the full scorer. This is
 * O(n) for candidate generation plus O(candidates) for scoring, so it scales to
 * very large workspaces. A composite-score detection (≥ DEDUP_THRESHOLD) is
 * dominated by the hash / doc-number / title / PL signals, all of which are
 * covered by these candidate sources; pairs sharing none of them cannot reach
 * the threshold, so nothing meaningful is missed.
 */
export async function processDedupJob(job: Job<DedupJobPayload>): Promise<void> {
  const { workspaceId, scanType, triggeredBy, batchSize = 500 } = job.data;
  const scanId = randomUUID();

  await db.insert(dedupScanHistory).values({
    id: scanId,
    workspaceId,
    scanType,
    status: "running",
    triggeredBy,
    startedAt: new Date(),
    batchSize,
  });

  // Yield to the event loop periodically so a long scan never blocks the
  // worker's BullMQ heartbeat (which would cause stalled-job churn).
  const YIELD_EVERY = Number(process.env.DEDUP_YIELD_EVERY ?? "5000");
  // Hard ceiling on candidate pairs held/scored in a single scan. Bounds memory
  // and CPU even for pathological inputs (e.g. thousands of identical titles).
  const MAX_CANDIDATE_PAIRS = Number(process.env.DEDUP_MAX_CANDIDATE_PAIRS ?? "100000");
  // Skip exact/PL groups larger than this when forming candidates: a group of
  // hundreds of docs sharing one value is not a meaningful pairwise-dup signal
  // and would otherwise explode the candidate set.
  const MAX_GROUP_SIZE = Number(process.env.DEDUP_MAX_GROUP_SIZE ?? "200");

  let totalPairsScored = 0;
  let detectionsFound = 0;
  let sinceYield = 0;
  let truncated = false;

  try {
    // --- 1. Generate candidate pairs (cheap, DB-side) -----------------------
    const candidatePairs = new Set<string>();

    const addPair = (x: string, y: string): boolean => {
      if (x === y) return true;
      const key = x < y ? `${x}|${y}` : `${y}|${x}`;
      if (candidatePairs.has(key)) return true;
      if (candidatePairs.size >= MAX_CANDIDATE_PAIRS) {
        truncated = true;
        return false;
      }
      candidatePairs.add(key);
      return true;
    };

    // Star-pair each member of an exact-match group with the group's canonical
    // (first) document. For exact duplicates this is sufficient for review and
    // bounds candidates to O(group size) instead of O(group size²).
    const addGroup = (ids: string[]): boolean => {
      if (ids.length < 2 || ids.length > MAX_GROUP_SIZE) {
        if (ids.length > MAX_GROUP_SIZE) truncated = true;
        return true;
      }
      const canonical = ids[0];
      for (let k = 1; k < ids.length; k++) {
        if (!addPair(canonical, ids[k])) return false;
      }
      return true;
    };

    const liveFilter = and(eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 0));

    // a. Exact file_hash duplicate groups.
    const hashGroups = await db
      .select({ ids: sql<string[]>`array_agg(${documents.id})` })
      .from(documents)
      .where(and(liveFilter, sql`${documents.fileHash} IS NOT NULL`))
      .groupBy(documents.fileHash)
      .having(sql`count(*) > 1`);
    for (const g of hashGroups) {
      if (!addGroup(g.ids)) break;
    }

    // b. Exact document_number duplicate groups.
    const docNumberGroups = await db
      .select({ ids: sql<string[]>`array_agg(${documents.id})` })
      .from(documents)
      .where(liveFilter)
      .groupBy(documents.documentNumber)
      .having(sql`count(*) > 1`);
    for (const g of docNumberGroups) {
      if (!addGroup(g.ids)) break;
    }

    // c. Exact title duplicate groups.
    const titleGroups = await db
      .select({ ids: sql<string[]>`array_agg(${documents.id})` })
      .from(documents)
      .where(liveFilter)
      .groupBy(documents.title)
      .having(sql`count(*) > 1`);
    for (const g of titleGroups) {
      if (!addGroup(g.ids)) break;
    }

    // d. Shared-PL candidate pairs (advanced scans only). Excludes PLs with very
    //    large fan-out, which don't imply pairwise duplication.
    if (scanType === "advanced") {
      const plResult = await db.execute(sql`
        WITH small_pls AS (
          SELECT ${documentPlLinks.plNumberId} AS pl_id
          FROM ${documentPlLinks}
          GROUP BY ${documentPlLinks.plNumberId}
          HAVING count(*) BETWEEN 2 AND ${Number(MAX_GROUP_SIZE)}
        )
        SELECT a.document_id AS a_id, b.document_id AS b_id
        FROM ${documentPlLinks} a
        JOIN ${documentPlLinks} b
          ON a.pl_number_id = b.pl_number_id AND a.document_id < b.document_id
        JOIN small_pls sp ON sp.pl_id = a.pl_number_id
        JOIN ${documents} da ON da.id = a.document_id
          AND da.workspace_id = ${String(workspaceId)} AND da.is_deleted = 0
        JOIN ${documents} dbb ON dbb.id = b.document_id
          AND dbb.workspace_id = ${String(workspaceId)} AND dbb.is_deleted = 0
        LIMIT ${Number(MAX_CANDIDATE_PAIRS)}
      `);
      // drizzle's execute returns either a QueryResult ({ rows }) or the rows
      // array directly depending on the driver/version — handle both.
      const raw = plResult as unknown as
        | { rows?: Array<{ a_id: string; b_id: string }> }
        | Array<{ a_id: string; b_id: string }>;
      const rows = Array.isArray(raw) ? raw : (raw.rows ?? []);
      for (const r of rows) {
        if (!addPair(r.a_id, r.b_id)) break;
      }
    }

    if (candidatePairs.size === 0) {
      await db
        .update(dedupScanHistory)
        .set({ status: "completed", completedAt: new Date(), pairsScored: 0, detectionsFound: 0 })
        .where(eq(dedupScanHistory.id, scanId));
      return;
    }

    // --- 2. Load DocInput only for documents involved in candidate pairs -----
    const pairList = [...candidatePairs].map((k) => k.split("|") as [string, string]);
    const involvedIds = [...new Set(pairList.flat())];

    const docMap = new Map<string, DocInput>();
    const DOC_BATCH = 500;
    for (let i = 0; i < involvedIds.length; i += DOC_BATCH) {
      const batch = involvedIds.slice(i, i + DOC_BATCH);
      const rows: CandidateDocRow[] = await db
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
        .where(inArray(documents.id, batch));
      for (const d of rows) {
        docMap.set(d.id, {
          id: d.id,
          fileHash: d.fileHash,
          documentNumber: d.documentNumber,
          title: d.title,
          ocrText: scanType === "advanced" ? d.ocrText : null,
          plNumberIds: [],
          workshop: d.workshop,
          section: d.section,
          category: d.category,
          thumbnailPath: d.thumbnailPath,
        });
      }
    }

    // PL links for involved docs (advanced only — used by plOverlap signal).
    if (scanType === "advanced") {
      for (let i = 0; i < involvedIds.length; i += DOC_BATCH) {
        const batch = involvedIds.slice(i, i + DOC_BATCH);
        const links = await db
          .select({
            documentId: documentPlLinks.documentId,
            plNumberId: documentPlLinks.plNumberId,
          })
          .from(documentPlLinks)
          .where(inArray(documentPlLinks.documentId, batch));
        for (const link of links) {
          docMap.get(link.documentId)?.plNumberIds.push(link.plNumberId);
        }
      }
    }

    // --- 3. Score candidate pairs and insert detections ---------------------
    const insertBuffer: Array<typeof duplicateDetections.$inferInsert> = [];

    const flush = async () => {
      if (insertBuffer.length === 0) return;
      const batch = insertBuffer.splice(0, insertBuffer.length);
      const inserted = await db
        .insert(duplicateDetections)
        .values(batch)
        .onConflictDoNothing({
          target: [duplicateDetections.documentAId, duplicateDetections.documentBId],
        })
        .returning({ id: duplicateDetections.id });
      detectionsFound += inserted.length;
    };

    for (const [idA, idB] of pairList) {
      const docInputA = docMap.get(idA);
      const docInputB = docMap.get(idB);
      if (!docInputA || !docInputB) continue;

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
      sinceYield++;

      if (score >= DEDUP_THRESHOLD) {
        const [aId, bId] = idA < idB ? [idA, idB] : [idB, idA];
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

      if (insertBuffer.length >= batchSize) {
        await flush();
      }

      // Periodically yield + check for cancellation.
      if (sinceYield >= YIELD_EVERY) {
        sinceYield = 0;
        await new Promise((resolve) => setImmediate(resolve));
        if (!(await job.isActive())) {
          await flush();
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
    }

    await flush();

    await db
      .update(dedupScanHistory)
      .set({
        status: "completed",
        completedAt: new Date(),
        pairsScored: totalPairsScored,
        detectionsFound,
        errorMessage: truncated
          ? `Candidate set was truncated at ${MAX_CANDIDATE_PAIRS} pairs (or groups exceeded ${MAX_GROUP_SIZE}). Some lower-signal pairs may not have been evaluated.`
          : null,
      })
      .where(eq(dedupScanHistory.id, scanId));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
 * Concurrency and per-job timeout are configurable via env. With the
 * candidate-blocking algorithm scans are far cheaper than the old O(n²) pass,
 * but the timeout ceiling stays generous for very large workspaces.
 */
export function createDedupWorker(): Worker<DedupJobPayload> {
  const concurrency = Number(process.env.DEDUP_WORKER_CONCURRENCY ?? "1");
  const jobTimeoutMs = Number(process.env.DEDUP_JOB_TIMEOUT_MS ?? `${30 * 60 * 1000}`);

  const worker = new Worker<DedupJobPayload>(
    "dedup-scan",
    async (job) => {
      // Same adaptive backpressure as the OCR worker: dedup scans are
      // image-hash heavy, so defer the start when the host is saturated.
      await awaitLoadHeadroom({ label: "dedup-worker" });
      return withJobTimeout(processDedupJob(job), jobTimeoutMs, `Dedup scan job ${job.id}`);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency,
    },
  );

  worker.on("error", (err) => {
    logError("[dedup-worker] Worker error", {}, err);
  });

  return worker;
}
