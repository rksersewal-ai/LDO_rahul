import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  classificationLabels,
  documentLegalHolds,
  documents,
  legalHolds,
  recordDeclarations,
  removedFileHashes,
} from "@/lib/db/schema";
import {
  countActiveReferences,
  isHashUnderLegalHold,
  markHashRemovedIfOrphaned,
  restoreHash,
} from "@/lib/storage/hash-removal";
import { protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId?: string | null } } }): string {
  const wsId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string | undefined;
  if (!wsId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return wsId;
}

export const governanceRouter = router({
  /**
   * Get all legal holds for the caller's workspace.
   */
  getLegalHolds: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const rows = await db.select().from(legalHolds).where(eq(legalHolds.workspaceId, workspaceId));

    return rows;
  }),

  /**
   * Create a new legal hold.
   * Requires supervisor or admin role.
   */
  createLegalHold: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        caseReference: z.string().max(128).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "legal_hold.manage");

      const id = randomUUID();

      await db.insert(legalHolds).values({
        id,
        workspaceId,
        name: input.name,
        description: input.description ?? null,
        caseReference: input.caseReference ?? null,
        status: "active",
        placedBy: userId,
      });

      await createAuditEntry(db, {
        userId,
        userName,
        action: "LEGAL_HOLD_CREATED",
        resourceType: "legal_hold",
        resourceId: id,
        resourceTitle: input.name,
        workspaceId,
        details: `Created legal hold "${input.name}"${input.caseReference ? ` (case: ${input.caseReference})` : ""}`,
      });

      return { id, name: input.name };
    }),

  /**
   * Apply a legal hold to one or more documents.
   * Requires supervisor or admin role.
   * Verifies the hold belongs to the caller's workspace.
   */
  applyHoldToDocuments: protectedProcedure
    .input(
      z.object({
        holdId: z.string(),
        documentIds: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "legal_hold.manage");

      // Verify the hold belongs to the caller's workspace
      const [hold] = await db
        .select({ id: legalHolds.id })
        .from(legalHolds)
        .where(and(eq(legalHolds.id, input.holdId), eq(legalHolds.workspaceId, workspaceId)))
        .limit(1);

      if (!hold) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Legal hold not found in workspace",
        });
      }

      const values = input.documentIds.map((documentId) => ({
        documentId,
        holdId: input.holdId,
        appliedBy: userId,
      }));

      await db.insert(documentLegalHolds).values(values);

      await createAuditEntry(db, {
        userId,
        userName,
        action: "LEGAL_HOLD_APPLIED",
        resourceType: "legal_hold",
        resourceId: input.holdId,
        workspaceId,
        details: `Applied legal hold to ${input.documentIds.length} document(s)`,
        newValue: JSON.stringify(input.documentIds),
      });

      return { success: true, appliedCount: input.documentIds.length };
    }),

  /**
   * Release a legal hold.
   * Requires supervisor or admin role.
   * Verifies the hold belongs to the caller's workspace.
   */
  releaseHold: protectedProcedure
    .input(
      z.object({
        holdId: z.string(),
        releaseReason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "legal_hold.manage");

      // Verify the hold belongs to the caller's workspace
      const [hold] = await db
        .select({ id: legalHolds.id })
        .from(legalHolds)
        .where(and(eq(legalHolds.id, input.holdId), eq(legalHolds.workspaceId, workspaceId)))
        .limit(1);

      if (!hold) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Legal hold not found in workspace",
        });
      }

      await db
        .update(legalHolds)
        .set({
          status: "released",
          releasedBy: userId,
          releasedAt: new Date(),
          releaseReason: input.releaseReason,
        })
        .where(eq(legalHolds.id, input.holdId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "LEGAL_HOLD_RELEASED",
        resourceType: "legal_hold",
        resourceId: input.holdId,
        workspaceId,
        details: `Released legal hold. Reason: ${input.releaseReason}`,
      });

      return { success: true };
    }),

  /**
   * Get classification labels for the caller's workspace.
   */
  getClassificationLabels: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const rows = await db
      .select()
      .from(classificationLabels)
      .where(eq(classificationLabels.workspaceId, workspaceId));

    return rows;
  }),

  /**
   * Set classification on a document.
   * Requires supervisor or admin role.
   * Verifies the document belongs to the caller's workspace.
   */
  setDocumentClassification: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        classificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "documents.classify");

      // Verify the document belongs to the caller's workspace
      const [doc] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)))
        .limit(1);

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found in workspace",
        });
      }

      await db
        .update(documents)
        .set({ classificationId: input.classificationId })
        .where(eq(documents.id, input.documentId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "DOCUMENT_CLASSIFICATION_SET",
        resourceType: "document",
        resourceId: input.documentId,
        workspaceId,
        details: `Set document classification to ${input.classificationId}`,
        newValue: input.classificationId,
      });

      return { success: true };
    }),

  /**
   * Declare a document as a formal record with a retention period.
   * Requires supervisor or admin role.
   */
  declareRecord: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        retentionPeriodYears: z.number().int().min(1),
        recordSeriesId: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "records.manage");

      // Verify the document exists and belongs to the user's workspace
      const [doc] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found in workspace",
        });
      }

      // Compute retention_expires_at
      const now = new Date();
      const retentionExpiresAt = new Date(now);
      retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + input.retentionPeriodYears);

      const id = randomUUID();

      await db.insert(recordDeclarations).values({
        id,
        documentId: input.documentId,
        workspaceId,
        recordSeriesId: input.recordSeriesId ?? null,
        retentionPeriodYears: input.retentionPeriodYears,
        retentionExpiresAt,
        declaredBy: userId,
        notes: input.notes ?? null,
      });

      await createAuditEntry(db, {
        userId,
        userName,
        action: "RECORD_DECLARED",
        resourceType: "record_declaration",
        resourceId: id,
        resourceTitle: `Record declaration for document ${input.documentId}`,
        workspaceId,
        details: `Declared document ${input.documentId} as record with ${input.retentionPeriodYears} year retention`,
      });

      return {
        id,
        documentId: input.documentId,
        workspaceId,
        recordSeriesId: input.recordSeriesId ?? null,
        retentionPeriodYears: input.retentionPeriodYears,
        retentionExpiresAt,
        declaredBy: userId,
        declaredAt: now,
        notes: input.notes ?? null,
      };
    }),

  /**
   * Approve destruction of a declared record after retention period has passed.
   * Requires supervisor or admin role.
   * Verifies the declaration belongs to the caller's workspace.
   */
  approveDestruction: protectedProcedure
    .input(
      z.object({
        recordDeclarationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "records.manage");

      const [declaration] = await db
        .select()
        .from(recordDeclarations)
        .where(
          and(
            eq(recordDeclarations.id, input.recordDeclarationId),
            eq(recordDeclarations.workspaceId, workspaceId),
          ),
        );

      if (!declaration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record declaration not found in workspace",
        });
      }

      // Verify retention period has passed
      if (new Date() <= declaration.retentionExpiresAt) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Retention period has not yet expired. Cannot approve destruction.",
        });
      }

      await db
        .update(recordDeclarations)
        .set({
          destroyApprovedBy: userId,
          destroyApprovedAt: new Date(),
        })
        .where(eq(recordDeclarations.id, input.recordDeclarationId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "RECORD_DESTRUCTION_APPROVED",
        resourceType: "record_declaration",
        resourceId: input.recordDeclarationId,
        workspaceId,
        details: `Approved destruction of record declaration ${input.recordDeclarationId}`,
      });

      return { success: true };
    }),

  /**
   * Execute the (logical) destruction of an approved record declaration.
   *
   * NO-HARD-DELETE POLICY: "destruction" here means logical disposition only —
   * the document is soft-deleted, the declaration is stamped with destroyedAt,
   * and the underlying file hash is flagged removed if no other live document
   * references it. The physical bytes are NEVER unlinked from NAS, so the record
   * remains fully recoverable for audit / e-discovery.
   *
   * Requires records.manage, prior approval, and that the document is not under
   * an active legal hold.
   */
  executeDestruction: protectedProcedure
    .input(
      z.object({
        recordDeclarationId: z.string(),
        confirmationNote: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);

      requirePermission(ctx, "records.manage");

      const [declaration] = await db
        .select()
        .from(recordDeclarations)
        .where(
          and(
            eq(recordDeclarations.id, input.recordDeclarationId),
            eq(recordDeclarations.workspaceId, workspaceId),
          ),
        );

      if (!declaration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record declaration not found in workspace",
        });
      }

      if (!declaration.destroyApprovedAt) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Destruction has not been approved. Approve destruction first.",
        });
      }

      if (declaration.destroyedAt) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This record has already been disposed.",
        });
      }

      // Fetch the document so we know its file hash for the removal flag.
      const [doc] = await db
        .select({ id: documents.id, fileHash: documents.fileHash, title: documents.title })
        .from(documents)
        .where(
          and(eq(documents.id, declaration.documentId), eq(documents.workspaceId, workspaceId)),
        );

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Underlying document not found" });
      }

      // Legal hold overrides destruction.
      if (doc.fileHash && (await isHashUnderLegalHold(doc.fileHash))) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Document is under an active legal hold and cannot be disposed.",
        });
      }

      const destroyedAt = new Date();

      await db.transaction(async (tx) => {
        // Stamp the declaration as destroyed (logical disposition record).
        await tx
          .update(recordDeclarations)
          .set({ destroyedAt })
          .where(eq(recordDeclarations.id, input.recordDeclarationId));

        // Soft-delete the document — never a physical delete.
        await tx
          .update(documents)
          .set({ isDeleted: 1, deletedAt: destroyedAt, updatedAt: destroyedAt, updatedBy: userId })
          .where(eq(documents.id, declaration.documentId));

        // Flag the file hash removed only if nothing live still references it.
        if (doc.fileHash) {
          await markHashRemovedIfOrphaned(
            {
              fileHash: doc.fileHash,
              removedBy: userId,
              workspaceId,
              lastDocumentId: doc.id,
              reason: "records.executeDestruction",
            },
            tx,
          );
        }

        await createAuditEntry(tx, {
          userId,
          userName,
          action: "RECORD_DESTRUCTION_EXECUTED",
          resourceType: "record_declaration",
          resourceId: input.recordDeclarationId,
          resourceTitle: doc.title,
          workspaceId,
          details: `Executed logical destruction of record ${input.recordDeclarationId} (document soft-deleted, file retained per no-hard-delete policy).${input.confirmationNote ? ` Note: ${input.confirmationNote}` : ""}`,
        });
      });

      return { success: true, destroyedAt };
    }),

  /**
   * Get all record declarations for the caller's workspace.
   */
  getRecordDeclarations: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const rows = await db
      .select()
      .from(recordDeclarations)
      .where(eq(recordDeclarations.workspaceId, workspaceId));

    return rows;
  }),

  /**
   * Disposition review queue: declarations whose retention period has expired
   * but which have not yet been destroyed. These are candidates for review and
   * (logical) destruction — nothing is ever auto-deleted.
   */
  getDispositionReviewQueue: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    requirePermission(ctx, "records.manage");

    const now = new Date();

    const rows = await db
      .select({
        id: recordDeclarations.id,
        documentId: recordDeclarations.documentId,
        documentTitle: documents.title,
        documentNumber: documents.documentNumber,
        recordSeriesId: recordDeclarations.recordSeriesId,
        retentionPeriodYears: recordDeclarations.retentionPeriodYears,
        retentionExpiresAt: recordDeclarations.retentionExpiresAt,
        declaredBy: recordDeclarations.declaredBy,
        declaredAt: recordDeclarations.declaredAt,
        destroyApprovedAt: recordDeclarations.destroyApprovedAt,
        destroyApprovedBy: recordDeclarations.destroyApprovedBy,
      })
      .from(recordDeclarations)
      .leftJoin(documents, eq(documents.id, recordDeclarations.documentId))
      .where(
        and(
          eq(recordDeclarations.workspaceId, workspaceId),
          isNull(recordDeclarations.destroyedAt),
          lte(recordDeclarations.retentionExpiresAt, now),
        ),
      )
      .orderBy(asc(recordDeclarations.retentionExpiresAt));

    return rows.map((r) => ({
      ...r,
      retentionExpiresAt: r.retentionExpiresAt.toISOString(),
      declaredAt: r.declaredAt.toISOString(),
      destroyApprovedAt: r.destroyApprovedAt?.toISOString() ?? null,
      approved: Boolean(r.destroyApprovedAt),
    }));
  }),

  /**
   * Summary stats for the removed-file-hash registry (no-hard-delete dashboard).
   * Reports how many hashes are flagged removed vs restored, and the logically
   * removed storage footprint still retained on disk.
   */
  getRemovedHashStats: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    requirePermission(ctx, "records.manage");

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        removed: sql<number>`count(*) FILTER (WHERE ${removedFileHashes.restoredAt} IS NULL)::int`,
        restored: sql<number>`count(*) FILTER (WHERE ${removedFileHashes.restoredAt} IS NOT NULL)::int`,
      })
      .from(removedFileHashes)
      .where(eq(removedFileHashes.workspaceId, workspaceId));

    // Retained bytes: sum the file size of one representative document per
    // removed hash (documents may be soft-deleted, so we don't filter is_deleted).
    const [bytes] = await db
      .select({
        retainedBytes: sql<number>`COALESCE(SUM(sub.file_size), 0)::bigint`,
      })
      .from(
        sql`(
          SELECT DISTINCT ON (d.file_hash) d.file_size AS file_size
          FROM ${documents} d
          INNER JOIN ${removedFileHashes} r ON r.file_hash = d.file_hash
          WHERE r.workspace_id = ${workspaceId} AND r.restored_at IS NULL
        ) AS sub`,
      );

    return {
      total: counts?.total ?? 0,
      removed: counts?.removed ?? 0,
      restored: counts?.restored ?? 0,
      retainedBytes: Number(bytes?.retainedBytes ?? 0),
    };
  }),

  /**
   * Paginated list of removed file hashes for the workspace, with the current
   * count of live documents still referencing each hash (normally 0).
   */
  getRemovedHashes: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
        includeRestored: z.boolean().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      requirePermission(ctx, "records.manage");

      const offset = (input.page - 1) * input.pageSize;
      const whereClause = input.includeRestored
        ? eq(removedFileHashes.workspaceId, workspaceId)
        : and(eq(removedFileHashes.workspaceId, workspaceId), isNull(removedFileHashes.restoredAt));

      const [rows, totalResult] = await Promise.all([
        db
          .select()
          .from(removedFileHashes)
          .where(whereClause)
          .orderBy(desc(removedFileHashes.removedAt))
          .limit(input.pageSize)
          .offset(offset),
        db.select({ total: sql<number>`count(*)::int` }).from(removedFileHashes).where(whereClause),
      ]);

      // Annotate each hash with its live reference count and legal-hold status.
      const items = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          fileHash: r.fileHash,
          lastDocumentId: r.lastDocumentId,
          removedBy: r.removedBy,
          removedAt: r.removedAt.toISOString(),
          reason: r.reason,
          restoredAt: r.restoredAt?.toISOString() ?? null,
          restoredBy: r.restoredBy,
          activeReferences: await countActiveReferences(r.fileHash),
          underLegalHold: await isHashUnderLegalHold(r.fileHash),
        })),
      );

      return { items, total: totalResult[0]?.total ?? 0 };
    }),

  /**
   * Restore (un-flag) a removed file hash. Records who/when in the registry and
   * writes an audit entry. The physical bytes were never deleted, so the content
   * becomes immediately available again.
   */
  restoreRemovedHash: protectedProcedure
    .input(z.object({ fileHash: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx);
      requirePermission(ctx, "records.manage");

      const [existing] = await db
        .select({ id: removedFileHashes.id })
        .from(removedFileHashes)
        .where(
          and(
            eq(removedFileHashes.fileHash, input.fileHash),
            eq(removedFileHashes.workspaceId, workspaceId),
            isNull(removedFileHashes.restoredAt),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Removed hash not found in workspace (or already restored).",
        });
      }

      await restoreHash(input.fileHash, userId);

      await createAuditEntry(db, {
        userId,
        userName,
        action: "FILE_HASH_RESTORED",
        resourceType: "removed_file_hash",
        resourceId: input.fileHash,
        workspaceId,
        details: `Restored previously removed file hash ${input.fileHash}`,
      });

      return { success: true };
    }),
});
