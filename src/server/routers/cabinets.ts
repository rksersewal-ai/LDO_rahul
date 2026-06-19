import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { cabinets, documentCabinets, documents } from "@/lib/db/schema";
import {
  addDocumentsToCabinetSchema,
  cabinetGetDocumentsSchema,
  createCabinetSchema,
  removeDocumentFromCabinetSchema,
  updateCabinetSchema,
} from "@/lib/validators/cabinets";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId: string | null } } }): string {
  const wsId = ctx.session.user.workspaceId;
  if (!wsId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return wsId;
}

/**
 * Compute the depth of a cabinet by walking up the parent chain.
 * Returns 0 for root cabinets, 1 for children of root, etc.
 */
async function getCabinetDepth(parentId: string | undefined | null): Promise<number> {
  if (!parentId) return 0;
  let depth = 1;
  let currentParentId: string | null = parentId;
  while (currentParentId) {
    const [parent] = await db
      .select({ parentId: cabinets.parentId })
      .from(cabinets)
      .where(eq(cabinets.id, currentParentId));
    if (!parent) break;
    currentParentId = parent.parentId;
    if (currentParentId) depth++;
  }
  return depth;
}

export const cabinetsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const allCabinets = await db
      .select({
        id: cabinets.id,
        name: cabinets.name,
        description: cabinets.description,
        parentId: cabinets.parentId,
        color: cabinets.color,
        icon: cabinets.icon,
        createdBy: cabinets.createdBy,
        createdAt: cabinets.createdAt,
        updatedAt: cabinets.updatedAt,
      })
      .from(cabinets)
      .where(eq(cabinets.workspaceId, workspaceId))
      .orderBy(cabinets.name);

    // Get document counts per cabinet
    const docCounts = await db
      .select({
        cabinetId: documentCabinets.cabinetId,
        docCount: count(),
      })
      .from(documentCabinets)
      .innerJoin(cabinets, eq(documentCabinets.cabinetId, cabinets.id))
      .where(eq(cabinets.workspaceId, workspaceId))
      .groupBy(documentCabinets.cabinetId);

    const countMap = new Map(docCounts.map((c) => [c.cabinetId, c.docCount]));

    return allCabinets.map((cab) => ({
      ...cab,
      docCount: countMap.get(cab.id) ?? 0,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [cabinet] = await db
        .select()
        .from(cabinets)
        .where(and(eq(cabinets.id, input.id), eq(cabinets.workspaceId, workspaceId)));

      if (!cabinet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
      }

      // Get document count
      const [countResult] = await db
        .select({ docCount: count() })
        .from(documentCabinets)
        .where(eq(documentCabinets.cabinetId, input.id));

      return { ...cabinet, docCount: countResult?.docCount ?? 0 };
    }),

  create: engineerProcedure.input(createCabinetSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Enforce max 3 levels of nesting (depth 0, 1, 2)
    const depth = await getCabinetDepth(input.parentId);
    if (depth >= 3) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Maximum cabinet nesting depth is 3 levels",
      });
    }

    // If parentId is specified, verify it exists in the same workspace
    if (input.parentId) {
      const [parent] = await db
        .select({ id: cabinets.id })
        .from(cabinets)
        .where(and(eq(cabinets.id, input.parentId), eq(cabinets.workspaceId, workspaceId)));

      if (!parent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parent cabinet not found" });
      }
    }

    // Check unique constraint (workspace + parent + name)
    const parentCondition = input.parentId
      ? eq(cabinets.parentId, input.parentId)
      : isNull(cabinets.parentId);

    const [existing] = await db
      .select({ id: cabinets.id })
      .from(cabinets)
      .where(
        and(eq(cabinets.workspaceId, workspaceId), parentCondition, eq(cabinets.name, input.name)),
      );

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A cabinet with this name already exists at this level",
      });
    }

    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(cabinets)
      .values({
        id,
        workspaceId,
        name: input.name,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        color: input.color ?? null,
        icon: input.icon ?? null,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "cabinet.create",
      resourceType: "cabinet",
      resourceId: id,
      resourceTitle: input.name,
      details: `Created cabinet "${input.name}"${input.parentId ? " (nested)" : ""}`,
      workspaceId,
    });

    return created;
  }),

  update: engineerProcedure.input(updateCabinetSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const [oldCabinet] = await db
      .select()
      .from(cabinets)
      .where(and(eq(cabinets.id, input.id), eq(cabinets.workspaceId, workspaceId)));

    if (!oldCabinet) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
    }

    const { id, ...updates } = input;
    const setValues: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.description !== undefined) setValues.description = updates.description;
    if (updates.color !== undefined) setValues.color = updates.color;
    if (updates.icon !== undefined) setValues.icon = updates.icon;

    const [updated] = await db
      .update(cabinets)
      .set(setValues)
      .where(eq(cabinets.id, id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "cabinet.update",
      resourceType: "cabinet",
      resourceId: id,
      resourceTitle: updated.name,
      details: `Updated cabinet "${updated.name}" fields: ${Object.keys(updates).join(", ")}`,
      workspaceId,
    });

    return updated;
  }),

  delete: engineerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      const [cabinet] = await db
        .select()
        .from(cabinets)
        .where(and(eq(cabinets.id, input.id), eq(cabinets.workspaceId, workspaceId)));

      if (!cabinet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
      }

      // Remove document-cabinet associations (documents stay)
      await db.delete(documentCabinets).where(eq(documentCabinets.cabinetId, input.id));

      // Reassign children to the deleted cabinet's parent (or root)
      await db
        .update(cabinets)
        .set({ parentId: cabinet.parentId })
        .where(eq(cabinets.parentId, input.id));

      // Delete the cabinet
      await db.delete(cabinets).where(eq(cabinets.id, input.id));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "cabinet.delete",
        resourceType: "cabinet",
        resourceId: input.id,
        resourceTitle: cabinet.name,
        details: `Deleted cabinet "${cabinet.name}"`,
        workspaceId,
      });

      return { success: true };
    }),

  getDocuments: protectedProcedure
    .input(cabinetGetDocumentsSchema)
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify cabinet belongs to workspace
      const [cabinet] = await db
        .select({ id: cabinets.id })
        .from(cabinets)
        .where(and(eq(cabinets.id, input.cabinetId), eq(cabinets.workspaceId, workspaceId)));

      if (!cabinet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
      }

      const offset = (input.page - 1) * input.pageSize;

      const [data, totalResult] = await Promise.all([
        db
          .select({
            documentId: documents.id,
            documentNumber: documents.documentNumber,
            title: documents.title,
            category: documents.category,
            status: documents.status,
            addedBy: documentCabinets.addedBy,
            addedAt: documentCabinets.addedAt,
          })
          .from(documentCabinets)
          .innerJoin(documents, eq(documentCabinets.documentId, documents.id))
          .where(eq(documentCabinets.cabinetId, input.cabinetId))
          .orderBy(desc(documentCabinets.addedAt))
          .offset(offset)
          .limit(input.pageSize),
        db
          .select({ totalCount: count() })
          .from(documentCabinets)
          .where(eq(documentCabinets.cabinetId, input.cabinetId)),
      ]);

      return {
        data,
        totalCount: totalResult[0]?.totalCount ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  addDocuments: engineerProcedure
    .input(addDocumentsToCabinetSchema)
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Verify cabinet belongs to workspace
      const [cabinet] = await db
        .select({ id: cabinets.id, name: cabinets.name })
        .from(cabinets)
        .where(and(eq(cabinets.id, input.cabinetId), eq(cabinets.workspaceId, workspaceId)));

      if (!cabinet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
      }

      const now = new Date();
      const values = input.documentIds.map((docId) => ({
        documentId: docId,
        cabinetId: input.cabinetId,
        addedBy: userId,
        addedAt: now,
      }));

      // Use onConflictDoNothing so duplicates are silently ignored
      await db.insert(documentCabinets).values(values).onConflictDoNothing();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "cabinet.addDocuments",
        resourceType: "cabinet",
        resourceId: input.cabinetId,
        resourceTitle: cabinet.name,
        details: `Added ${input.documentIds.length} document(s) to cabinet "${cabinet.name}"`,
        workspaceId,
      });

      return { success: true, count: input.documentIds.length };
    }),

  removeDocument: engineerProcedure
    .input(removeDocumentFromCabinetSchema)
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Verify cabinet belongs to workspace
      const [cabinet] = await db
        .select({ id: cabinets.id, name: cabinets.name })
        .from(cabinets)
        .where(and(eq(cabinets.id, input.cabinetId), eq(cabinets.workspaceId, workspaceId)));

      if (!cabinet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cabinet not found" });
      }

      await db
        .delete(documentCabinets)
        .where(
          and(
            eq(documentCabinets.cabinetId, input.cabinetId),
            eq(documentCabinets.documentId, input.documentId),
          ),
        );

      await createAuditEntry(db, {
        userId,
        userName,
        action: "cabinet.removeDocument",
        resourceType: "cabinet",
        resourceId: input.cabinetId,
        resourceTitle: cabinet.name,
        details: `Removed document ${input.documentId} from cabinet "${cabinet.name}"`,
        workspaceId,
      });

      return { success: true };
    }),
});
