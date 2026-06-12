import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import {
  documentPlLinks,
  documentRelations,
  documents,
  duplicateDetections,
} from "@/lib/db/schema";
import { DEDUP_THRESHOLD, type DocInput, scoreDocumentPair } from "@/lib/dedup/scorer";
import { adminProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session.user.workspaceId;
  if (!wsId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned." });
  return wsId;
}

// Alias tables for self-join
const docA = documents;
const docB = documents;

export const dedupRouter = router({
  /**
   * Get pending duplicate detections for the current workspace (paginated).
   */
  getPendingDuplicates: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const offset = (input.page - 1) * input.pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: duplicateDetections.id,
            workspaceId: duplicateDetections.workspaceId,
            documentAId: duplicateDetections.documentAId,
            documentBId: duplicateDetections.documentBId,
            score: duplicateDetections.score,
            hashMatch: duplicateDetections.hashMatch,
            docNumberMatch: duplicateDetections.docNumberMatch,
            titleSimilarity: duplicateDetections.titleSimilarity,
            ocrTextSimilarity: duplicateDetections.ocrTextSimilarity,
            plOverlap: duplicateDetections.plOverlap,
            metaMatch: duplicateDetections.metaMatch,
            thumbPhashDistance: duplicateDetections.thumbPhashDistance,
            status: duplicateDetections.status,
            detectedAt: duplicateDetections.detectedAt,
            // Doc A summary
            docANumber: sql<string>`da."document_number"`.as("doc_a_number"),
            docATitle: sql<string>`da."title"`.as("doc_a_title"),
            docAFileHash: sql<string | null>`da."file_hash"`.as("doc_a_file_hash"),
            docACategory: sql<string>`da."category"`.as("doc_a_category"),
            // Doc B summary
            docBNumber: sql<string>`db."document_number"`.as("doc_b_number"),
            docBTitle: sql<string>`db."title"`.as("doc_b_title"),
            docBFileHash: sql<string | null>`db."file_hash"`.as("doc_b_file_hash"),
            docBCategory: sql<string>`db."category"`.as("doc_b_category"),
          })
          .from(duplicateDetections)
          .innerJoin(
            sql`"documents" as "da"`,
            sql`"da"."id" = ${duplicateDetections.documentAId}`,
          )
          .innerJoin(
            sql`"documents" as "db"`,
            sql`"db"."id" = ${duplicateDetections.documentBId}`,
          )
          .where(
            and(
              eq(duplicateDetections.status, "pending"),
              eq(duplicateDetections.workspaceId, workspaceId),
            ),
          )
          .orderBy(desc(duplicateDetections.score))
          .offset(offset)
          .limit(input.pageSize),
        db
          .select({ total: count() })
          .from(duplicateDetections)
          .where(
            and(
              eq(duplicateDetections.status, "pending"),
              eq(duplicateDetections.workspaceId, workspaceId),
            ),
          ),
      ]);

      return {
        items,
        total: totalResult[0]?.total ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * Get full detail for a single detection with both documents and their PL links.
   */
  getDetectionDetail: protectedProcedure
    .input(z.object({ detectionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [detection] = await db
        .select()
        .from(duplicateDetections)
        .where(
          and(
            eq(duplicateDetections.id, input.detectionId),
            eq(duplicateDetections.workspaceId, workspaceId),
          ),
        );

      if (!detection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Detection not found." });
      }

      // Fetch both documents
      const [docAResult] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, detection.documentAId));

      const [docBResult] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, detection.documentBId));

      // Fetch PL links for both documents
      const plLinksA = await db
        .select({ plNumberId: documentPlLinks.plNumberId })
        .from(documentPlLinks)
        .where(eq(documentPlLinks.documentId, detection.documentAId));

      const plLinksB = await db
        .select({ plNumberId: documentPlLinks.plNumberId })
        .from(documentPlLinks)
        .where(eq(documentPlLinks.documentId, detection.documentBId));

      return {
        detection,
        documentA: docAResult ?? null,
        documentB: docBResult ?? null,
        plLinksA: plLinksA.map((l) => l.plNumberId),
        plLinksB: plLinksB.map((l) => l.plNumberId),
      };
    }),

  /**
   * Confirm a duplicate detection - keep one document, archive the other.
   */
  confirmDuplicate: adminProcedure
    .input(
      z.object({
        detectionId: z.string(),
        keepDocumentId: z.string(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";

      // 1. Fetch the detection record
      const [detection] = await db
        .select()
        .from(duplicateDetections)
        .where(eq(duplicateDetections.id, input.detectionId));

      if (!detection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Detection not found." });
      }

      if (detection.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Detection already resolved." });
      }

      // 2. Determine which document is being archived
      const archivedId =
        input.keepDocumentId === detection.documentAId
          ? detection.documentBId
          : detection.documentAId;

      if (input.keepDocumentId !== detection.documentAId && input.keepDocumentId !== detection.documentBId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "keepDocumentId must be one of the pair." });
      }

      // 3. Create a document_relations entry (docA=kept, docB=archived)
      const relationId = randomUUID();
      await db.insert(documentRelations).values({
        id: relationId,
        documentAId: input.keepDocumentId,
        documentBId: archivedId,
        relationType: "duplicate_of",
        createdBy: userId,
      });

      // 4. Archive non-kept doc
      await db
        .update(documents)
        .set({ isDeleted: 1, deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(documents.id, archivedId));

      // 5. Redirect PL links from archived to kept
      await db
        .update(documentPlLinks)
        .set({ documentId: input.keepDocumentId })
        .where(eq(documentPlLinks.documentId, archivedId));

      // 6. Update detection status
      await db
        .update(duplicateDetections)
        .set({
          status: "merged",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNote: input.note ?? null,
        })
        .where(eq(duplicateDetections.id, input.detectionId));

      // 7. Audit log
      await createAuditEntry(db, {
        userId,
        userName,
        action: "DEDUP_CONFIRM",
        resourceType: "duplicate_detection",
        resourceId: input.detectionId,
        resourceTitle: `Kept ${input.keepDocumentId}, archived ${archivedId}`,
        details: `Confirmed duplicate. Kept document ${input.keepDocumentId}, archived ${archivedId}.${input.note ? ` Note: ${input.note}` : ""}`,
        workspaceId: detection.workspaceId,
      });

      return { success: true, archivedDocumentId: archivedId, keptDocumentId: input.keepDocumentId };
    }),

  /**
   * Dismiss a detection as not a real duplicate.
   */
  dismissDetection: adminProcedure
    .input(
      z.object({
        detectionId: z.string(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";

      const [detection] = await db
        .select()
        .from(duplicateDetections)
        .where(eq(duplicateDetections.id, input.detectionId));

      if (!detection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Detection not found." });
      }

      if (detection.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Detection already resolved." });
      }

      await db
        .update(duplicateDetections)
        .set({
          status: "dismissed",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNote: input.note ?? null,
        })
        .where(eq(duplicateDetections.id, input.detectionId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "DEDUP_DISMISS",
        resourceType: "duplicate_detection",
        resourceId: input.detectionId,
        details: `Dismissed duplicate detection.${input.note ? ` Note: ${input.note}` : ""}`,
        workspaceId: detection.workspaceId,
      });

      return { success: true, detectionId: input.detectionId };
    }),

  /**
   * Trigger a deduplication scan for a workspace.
   * Fetches all non-deleted documents and scores pairs in batches.
   */
  triggerScan: adminProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";

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
        .where(
          and(
            eq(documents.workspaceId, input.workspaceId),
            eq(documents.isDeleted, 0),
          ),
        );

      // Fetch PL links for all documents at once
      const docIds = allDocs.map((d) => d.id);
      let plLinksMap: Map<string, string[]> = new Map();

      if (docIds.length > 0) {
        // Batch fetch PL links - query in chunks to avoid overly large IN clauses
        const PL_BATCH = 500;
        const allPlLinks: Array<{ documentId: string; plNumberId: string }> = [];
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
          allPlLinks.push(...links);
        }

        plLinksMap = new Map<string, string[]>();
        for (const link of allPlLinks) {
          const existing = plLinksMap.get(link.documentId) ?? [];
          existing.push(link.plNumberId);
          plLinksMap.set(link.documentId, existing);
        }
      }

      // Build DocInput objects
      const docInputs: DocInput[] = allDocs.map((doc) => ({
        id: doc.id,
        fileHash: doc.fileHash,
        documentNumber: doc.documentNumber,
        title: doc.title,
        ocrText: doc.ocrText,
        plNumberIds: plLinksMap.get(doc.id) ?? [],
        workshop: doc.workshop,
        section: doc.section,
        category: doc.category,
        thumbnailPath: doc.thumbnailPath,
      }));

      // Process pairs in batches to avoid N^2 memory explosion
      // We process documents in chunks of 50 and compare all pairs within/across chunks
      const CHUNK_SIZE = 50;
      let totalPairsScored = 0;
      let newDetections = 0;

      for (let i = 0; i < docInputs.length; i++) {
        // For each document, compare with all subsequent documents in batches
        const batchEnd = Math.min(i + CHUNK_SIZE, docInputs.length);
        const insertBatch: Array<{
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

        for (let j = i + 1; j < docInputs.length; j++) {
          const docInputA = docInputs[i];
          const docInputB = docInputs[j];

          const result = scoreDocumentPair(docInputA, docInputB);
          totalPairsScored++;

          if (result.score >= DEDUP_THRESHOLD) {
            // Ensure documentAId < documentBId for uniqueness
            const [aId, bId] =
              docInputA.id < docInputB.id
                ? [docInputA.id, docInputB.id]
                : [docInputB.id, docInputA.id];

            insertBatch.push({
              id: randomUUID(),
              workspaceId: input.workspaceId,
              documentAId: aId,
              documentBId: bId,
              score: result.score,
              hashMatch: result.signals.exactHash === 1.0,
              docNumberMatch: result.signals.docNumber === 1.0,
              titleSimilarity: result.signals.titleTrigram ?? 0,
              ocrTextSimilarity: result.signals.ocrTextTrigram ?? 0,
              plOverlap: result.signals.plOverlap ?? 0,
              metaMatch: result.signals.metadata === 1.0,
              thumbPhashDistance: null,
              status: "pending",
            });
          }

          // Insert in sub-batches to avoid too-large queries
          if (insertBatch.length >= 100) {
            const batch = insertBatch.splice(0, insertBatch.length);
            const inserted = await db
              .insert(duplicateDetections)
              .values(batch)
              .onConflictDoNothing({ target: [duplicateDetections.documentAId, duplicateDetections.documentBId] })
              .returning({ id: duplicateDetections.id });
            newDetections += inserted.length;
          }
        }

        // Insert remaining from this iteration
        if (insertBatch.length > 0) {
          const inserted = await db
            .insert(duplicateDetections)
            .values(insertBatch)
            .onConflictDoNothing({ target: [duplicateDetections.documentAId, duplicateDetections.documentBId] })
            .returning({ id: duplicateDetections.id });
          newDetections += inserted.length;
        }
      }

      // Audit log
      await createAuditEntry(db, {
        userId,
        userName,
        action: "DEDUP_SCAN",
        resourceType: "workspace",
        resourceId: input.workspaceId,
        details: `Dedup scan completed. Scored ${totalPairsScored} pairs, found ${newDetections} new detections.`,
        workspaceId: input.workspaceId,
      });

      return { newDetections, totalPairsScored };
    }),
});
