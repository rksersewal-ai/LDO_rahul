import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  classificationLabels,
  documentLegalHolds,
  documents,
  legalHolds,
} from "@/lib/db/schema";
import type { UserRole } from "@/lib/types/auth";
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
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as UserRole;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      if (!isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Requires supervisor role or higher to create legal holds",
        });
      }

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
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as UserRole;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      if (!isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Requires supervisor role or higher to apply legal holds",
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
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as UserRole;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      if (!isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Requires supervisor role or higher to release legal holds",
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
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as UserRole;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      if (!isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Requires supervisor role or higher to set document classification",
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
});
