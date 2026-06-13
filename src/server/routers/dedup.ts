import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import {
  dedupScanHistory,
  documentPlLinks,
  documentRelations,
  documents,
  duplicateDetections,
  settings,
} from "@/lib/db/schema";
import { DEDUP_THRESHOLD, type DocInput, scoreDocumentPair } from "@/lib/dedup/scorer";
import { addDedupJob } from "@/workers/dedup-queue";
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

      // 5. Redirect PL links from archived to kept (handle collisions)
      // Get existing PL links on the kept document
      const keptPlLinks = await db
        .select({ plNumberId: documentPlLinks.plNumberId })
        .from(documentPlLinks)
        .where(eq(documentPlLinks.documentId, input.keepDocumentId));
      const keptPlIds = new Set(keptPlLinks.map((l) => l.plNumberId));

      // Delete colliding links from archived doc
      if (keptPlIds.size > 0) {
        await db
          .delete(documentPlLinks)
          .where(
            and(
              eq(documentPlLinks.documentId, archivedId),
              inArray(documentPlLinks.plNumberId, [...keptPlIds]),
            ),
          );
      }

      // Redirect remaining non-colliding links
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
   * Trigger a deduplication scan for a workspace (background job via BullMQ).
   */
  triggerScan: adminProcedure
    .input(z.object({ scanType: z.enum(["basic", "advanced"]).default("basic") }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const workspaceId = requireWorkspaceId(ctx);

      await addDedupJob({
        workspaceId,
        scanType: input.scanType,
        triggeredBy: userId,
      });

      return { jobQueued: true, scanType: input.scanType };
    }),

  /**
   * Get scan history for admin dashboard (most recent 20 scans).
   */
  getScanHistory: adminProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const history = await db
      .select()
      .from(dedupScanHistory)
      .where(eq(dedupScanHistory.workspaceId, workspaceId))
      .orderBy(desc(dedupScanHistory.startedAt))
      .limit(20);

    return history;
  }),

  /**
   * Get dedup scan settings from the settings table.
   */
  getScanSettings: adminProcedure.query(async () => {
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(
        and(
          eq(settings.scope, "system"),
          like(settings.key, "dedup.scan.%"),
        ),
      );

    const settingsMap: Record<string, string> = {};
    for (const row of rows) {
      settingsMap[row.key] = row.value;
    }

    return {
      schedule: settingsMap["dedup.scan.schedule"] ?? "0 2 * * *",
      type: (settingsMap["dedup.scan.type"] as "basic" | "advanced") ?? "basic",
      enabled: settingsMap["dedup.scan.enabled"] === "true",
      batchSize: Number(settingsMap["dedup.scan.batchSize"]) || 500,
    };
  }),

  /**
   * Update dedup scan settings.
   */
  updateScanSettings: adminProcedure
    .input(
      z.object({
        schedule: z.string().optional(),
        type: z.enum(["basic", "advanced"]).optional(),
        enabled: z.boolean().optional(),
        batchSize: z.number().min(50).max(5000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const now = new Date();

      const updates: Array<{ key: string; value: string; dataType: "string" | "number" | "boolean" }> = [];

      if (input.schedule !== undefined) {
        updates.push({ key: "dedup.scan.schedule", value: input.schedule, dataType: "string" });
      }
      if (input.type !== undefined) {
        updates.push({ key: "dedup.scan.type", value: input.type, dataType: "string" });
      }
      if (input.enabled !== undefined) {
        updates.push({ key: "dedup.scan.enabled", value: String(input.enabled), dataType: "boolean" });
      }
      if (input.batchSize !== undefined) {
        updates.push({ key: "dedup.scan.batchSize", value: String(input.batchSize), dataType: "number" });
      }

      for (const update of updates) {
        const id = randomUUID();
        await db
          .insert(settings)
          .values({
            id,
            scope: "system",
            scopeId: null,
            key: update.key,
            value: update.value,
            dataType: update.dataType,
            description: `Dedup scan setting: ${update.key}`,
            isPublic: false,
            updatedBy: userId,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [settings.scope, settings.scopeId, settings.key],
            set: {
              value: update.value,
              dataType: update.dataType,
              updatedBy: userId,
              updatedAt: now,
            },
          });

        await createAuditEntry(db, {
          userId,
          userName,
          action: "SETTINGS_UPDATE",
          resourceType: "setting",
          resourceId: update.key,
          details: `Updated ${update.key} to ${update.value}`,
        });
      }

      return { success: true };
    }),
});
