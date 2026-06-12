import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
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
} from "@/lib/db/schema";
import { protectedProcedure, router } from "@/server/trpc";

export const governanceRouter = router({
  /**
   * Get all legal holds for a workspace.
   */
  getLegalHolds: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(legalHolds)
        .where(eq(legalHolds.workspaceId, input.workspaceId));

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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      requirePermission(ctx, "legal_hold.manage");

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

      // TODO: Notify document owners about the legal hold.
      // Requires a join to resolve document owner user IDs from documentIds.

      return { success: true, appliedCount: input.documentIds.length };
    }),

  /**
   * Release a legal hold.
   * Requires supervisor or admin role.
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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      requirePermission(ctx, "legal_hold.manage");

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

      // TODO: Notify document owners about the hold release.
      // Requires a join to resolve affected document owner user IDs.

      return { success: true };
    }),

  /**
   * Get classification labels for a workspace.
   */
  getClassificationLabels: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(classificationLabels)
        .where(eq(classificationLabels.workspaceId, input.workspaceId));

      return rows;
    }),

  /**
   * Set classification on a document.
   * Requires supervisor or admin role.
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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      requirePermission(ctx, "documents.classify");

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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

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
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      requirePermission(ctx, "records.manage");

      const [declaration] = await db
        .select()
        .from(recordDeclarations)
        .where(eq(recordDeclarations.id, input.recordDeclarationId));

      if (!declaration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record declaration not found",
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
   * Get all record declarations for a workspace.
   */
  getRecordDeclarations: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(recordDeclarations)
        .where(eq(recordDeclarations.workspaceId, input.workspaceId));

      return rows;
    }),
});
