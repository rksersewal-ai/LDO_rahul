import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  documentCabinets,
  documentCategoryEnum,
  documentPlLinks,
  documents,
  documentTags,
  plNumbers,
  recordDeclarations,
} from "@/lib/db/schema";
import { canTransition, executeTransition } from "@/lib/fsm/document-fsm";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import { markHashRemovedIfOrphaned, restoreHash } from "@/lib/storage/hash-removal";
import type { UserRole } from "@/lib/types/auth";
import { escapeLikePattern } from "@/lib/utils/escape-like";
import {
  approveDocumentSchema,
  bulkActionSchema,
  documentListSchema,
  linkPlSchema,
  unlinkPlSchema,
  updateDocumentSchema,
  uploadDocumentSchema,
} from "@/lib/validators/documents";
import { engineerProcedure, protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

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

export const documentsRouter = router({
  list: protectedProcedure.input(documentListSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const conditions = [eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 0)];

    if (input.search) {
      const escaped = escapeLikePattern(input.search);
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: or() is only undefined when called with zero conditions; we always pass >=2
        or(
          ilike(documents.documentNumber, `%${escaped}%`),
          ilike(documents.title, `%${escaped}%`),
          ilike(documents.tags, `%${escaped}%`),
        )!,
      );
    }

    if (input.category) {
      const categoryLower = input.category.toLowerCase();
      const validCategories = documentCategoryEnum.enumValues;
      const matchedCategory = validCategories.find(
        (c) => c.toLowerCase() === categoryLower || c === input.category,
      );
      if (matchedCategory) {
        conditions.push(eq(documents.category, matchedCategory));
      }
    }

    if (input.status) {
      conditions.push(
        eq(
          documents.status,
          input.status.toLowerCase() as (typeof documents.status.enumValues)[number],
        ),
      );
    }

    if (input.ocrStatus) {
      const ocrStatusLower = input.ocrStatus.toLowerCase();
      conditions.push(
        eq(documents.ocrStatus, ocrStatusLower as (typeof documents.ocrStatus.enumValues)[number]),
      );
    }

    if (input.fileType) {
      conditions.push(ilike(documents.mimeType, `%${input.fileType}%`));
    }

    if (input.ownerId) {
      conditions.push(eq(documents.createdBy, input.ownerId));
    }

    if (input.dateFrom) {
      conditions.push(gte(documents.createdAt, new Date(input.dateFrom)));
    }

    if (input.dateTo) {
      conditions.push(lte(documents.createdAt, new Date(input.dateTo)));
    }

    // Keyset pagination: only for the default createdAt sort. Decodes the
    // cursor "<createdAtISO>|<id>" and adds a row-value comparison so the query
    // can seek directly past the last seen row (no large OFFSET scan).
    const useKeyset = Boolean(input.cursor) && input.sortBy === "createdAt";
    if (useKeyset && input.cursor) {
      const sepIdx = input.cursor.lastIndexOf("|");
      const cursorIso = input.cursor.slice(0, sepIdx);
      const cursorId = input.cursor.slice(sepIdx + 1);
      const cursorDate = new Date(cursorIso);
      if (!Number.isNaN(cursorDate.getTime()) && cursorId) {
        conditions.push(
          input.sortOrder === "asc"
            ? sql`(${documents.createdAt}, ${documents.id}) > (${cursorDate}, ${cursorId})`
            : sql`(${documents.createdAt}, ${documents.id}) < (${cursorDate}, ${cursorId})`,
        );
      }
    }

    const whereClause = and(...conditions);

    const sortColumnMap: Record<string, typeof documents.createdAt | typeof documents.updatedAt> = {
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      documentNumber: documents.documentNumber as never,
      title: documents.title as never,
      category: documents.category as never,
      status: documents.status as never,
    };

    const sortCol = sortColumnMap[input.sortBy] ?? documents.createdAt;
    const orderFn = input.sortOrder === "asc" ? asc : desc;
    // For createdAt sorting add id as a stable tie-breaker (required for keyset).
    const orderBy =
      input.sortBy === "createdAt" ? [orderFn(sortCol), orderFn(documents.id)] : [orderFn(sortCol)];

    const baseQuery = db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(input.limit);

    const [data, totalResult] = await Promise.all([
      // Keyset mode seeks via the WHERE clause; offset mode uses OFFSET.
      useKeyset ? baseQuery : baseQuery.offset(input.offset),
      db.select({ total: count() }).from(documents).where(whereClause),
    ]);

    // Compute the next cursor when a full page was returned under createdAt sort.
    let nextCursor: string | null = null;
    if (input.sortBy === "createdAt" && data.length === input.limit) {
      const last = data[data.length - 1];
      if (last?.createdAt) {
        nextCursor = `${last.createdAt.toISOString()}|${last.id}`;
      }
    }

    return {
      data,
      total: totalResult[0]?.total ?? 0,
      limit: input.limit,
      offset: input.offset,
      nextCursor,
    };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, input.id),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // Fetch linked PL IDs
    const links = await db
      .select({ plNumberId: documentPlLinks.plNumberId })
      .from(documentPlLinks)
      .where(eq(documentPlLinks.documentId, input.id));

    const linkedPlIds = links.map((l) => l.plNumberId);

    return { ...doc, linkedPlIds };
  }),

  upload: engineerProcedure.input(uploadDocumentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const id = randomUUID();

    const [newDoc] = await db
      .insert(documents)
      .values({
        id,
        documentNumber: input.documentNumber,
        title: sanitizeUserInput(input.title),
        category: input.category as (typeof documents.category.enumValues)[number],
        status: "draft",
        revision: input.revision || "A",
        revisionDate: input.revisionDate ? new Date(input.revisionDate) : null,
        workshop: input.agency || null,
        ocrStatus: "queued",
        tags: input.tags.length > 0 ? input.tags.join(",") : null,
        createdBy: userId,
        updatedBy: userId,
        workspaceId,
      })
      .returning();

    // Create PL links if provided — use a single batch insert to avoid N+1 queries
    if (input.linkedPlIds.length > 0) {
      await db.insert(documentPlLinks).values(
        input.linkedPlIds.map((plId) => ({
          id: randomUUID(),
          documentId: id,
          plNumberId: plId,
          linkType: "manual" as const,
          linkedBy: userId,
        })),
      );
    }

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.create",
      resourceType: "document",
      resourceId: id,
      resourceTitle: newDoc.title,
      workspaceId,
    });

    return newDoc;
  }),

  update: engineerProcedure.input(updateDocumentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const [current] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, input.id),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    const updateData: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updateData.title = sanitizeUserInput(input.title);
    if (input.category !== undefined) updateData.category = input.category;
    if (input.status !== undefined) {
      // Verify FSM transition is valid before applying status change
      const userRole = (ctx.session.user?.role ?? "viewer") as string;
      if (!canTransition(current.status, input.status.toLowerCase(), userRole)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Invalid status transition from ${current.status} to ${input.status.toLowerCase()}`,
        });
      }
      updateData.status = input.status.toLowerCase();
    }
    if (input.revision !== undefined) updateData.revision = input.revision;
    if (input.revisionDate !== undefined) {
      updateData.revisionDate = input.revisionDate ? new Date(input.revisionDate) : null;
    }
    if (input.agency !== undefined) updateData.workshop = input.agency;
    if (input.tags !== undefined) updateData.tags = input.tags.join(",");

    const [updated] = await db
      .update(documents)
      .set(updateData)
      .where(and(eq(documents.id, input.id), eq(documents.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.update",
      resourceType: "document",
      resourceId: input.id,
      resourceTitle: updated.title,
      oldValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      workspaceId,
    });

    return updated;
  }),

  delete: engineerProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Check if this document has an active record declaration
    const [activeDeclaration] = await db
      .select({ id: recordDeclarations.id })
      .from(recordDeclarations)
      .where(
        and(eq(recordDeclarations.documentId, input.id), isNull(recordDeclarations.destroyedAt)),
      );

    if (activeDeclaration) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete a declared record. The document is under records management.",
      });
    }

    const [current] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, input.id),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // Soft-delete the document and, under the no-hard-delete policy, flag its
    // file hash as removed ONLY when no other live document still references it.
    // The physical file on NAS is never unlinked. Both writes run in a single
    // transaction so the document state and the hash registry stay consistent.
    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({ isDeleted: 1, deletedAt: new Date(), updatedAt: new Date(), updatedBy: userId })
        .where(and(eq(documents.id, input.id), eq(documents.workspaceId, workspaceId)));

      if (current.fileHash) {
        await markHashRemovedIfOrphaned(
          {
            fileHash: current.fileHash,
            removedBy: userId,
            workspaceId,
            lastDocumentId: input.id,
            reason: "document.delete",
          },
          tx,
        );
      }
    });

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.delete",
      resourceType: "document",
      resourceId: input.id,
      resourceTitle: current.title,
      workspaceId,
    });

    return { success: true };
  }),

  /**
   * List soft-deleted documents in the workspace (the Recycle Bin).
   * Under the no-hard-delete policy nothing is ever physically removed, so these
   * documents — and their files — remain fully restorable.
   */
  listDeleted: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const conditions = [eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 1)];
      if (input.search) {
        const escaped = escapeLikePattern(input.search);
        conditions.push(
          // biome-ignore lint/style/noNonNullAssertion: or() is only undefined when called with zero conditions; we always pass >=2
          or(
            ilike(documents.documentNumber, `%${escaped}%`),
            ilike(documents.title, `%${escaped}%`),
          )!,
        );
      }
      const whereClause = and(...conditions);

      const [data, totalResult] = await Promise.all([
        db
          .select({
            id: documents.id,
            documentNumber: documents.documentNumber,
            title: documents.title,
            category: documents.category,
            fileHash: documents.fileHash,
            deletedAt: documents.deletedAt,
            updatedBy: documents.updatedBy,
          })
          .from(documents)
          .where(whereClause)
          .orderBy(desc(documents.deletedAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ total: count() }).from(documents).where(whereClause),
      ]);

      return {
        data: data.map((d) => ({ ...d, deletedAt: d.deletedAt?.toISOString() ?? null })),
        total: totalResult[0]?.total ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Restore a soft-deleted document. Clears isDeleted and un-flags the file hash
   * in the removed registry (the document re-references its content). The
   * physical file was never deleted, so restoration is always possible.
   */
  restore: engineerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user?.id ?? "unknown";
      const userName = ctx.session.user?.name ?? "Unknown User";

      const [current] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.id),
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 1),
          ),
        );

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deleted document not found" });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(documents)
          .set({ isDeleted: 0, deletedAt: null, updatedAt: new Date(), updatedBy: userId })
          .where(and(eq(documents.id, input.id), eq(documents.workspaceId, workspaceId)));

        if (current.fileHash) {
          await restoreHash(current.fileHash, userId, tx);
        }
      });

      await createAuditEntry(db, {
        userId,
        userName,
        action: "document.restore",
        resourceType: "document",
        resourceId: input.id,
        resourceTitle: current.title,
        workspaceId,
      });

      return { success: true };
    }),

  linkPL: engineerProcedure.input(linkPlSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Verify document exists in workspace
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.id, input.documentId),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    await db
      .insert(documentPlLinks)
      .values({
        id: randomUUID(),
        documentId: input.documentId,
        plNumberId: input.plId,
        linkType: input.linkType === "reference" ? "manual" : "manual",
        linkedBy: userId,
      })
      .onConflictDoNothing();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.link_pl",
      resourceType: "document",
      resourceId: input.documentId,
      details: `Linked PL ${input.plId}`,
      workspaceId,
    });

    return { success: true };
  }),

  unlinkPL: engineerProcedure.input(unlinkPlSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Verify document exists in workspace
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.id, input.documentId),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    await db
      .delete(documentPlLinks)
      .where(
        and(
          eq(documentPlLinks.documentId, input.documentId),
          eq(documentPlLinks.plNumberId, input.plId),
        ),
      );

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.unlink_pl",
      resourceType: "document",
      resourceId: input.documentId,
      details: `Unlinked PL ${input.plId}`,
      workspaceId,
    });

    return { success: true };
  }),

  approve: supervisorProcedure.input(approveDocumentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";
    const userRole = (ctx.session.user?.role ?? "viewer") as string;

    const [current] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, input.id),
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
        ),
      );

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // Verify FSM allows approval from current status
    if (!canTransition(current.status, "approved", userRole)) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Invalid status transition from ${current.status} to approved`,
      });
    }

    const [updated] = await db
      .update(documents)
      .set({
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, input.id), eq(documents.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document.approve",
      resourceType: "document",
      resourceId: input.id,
      resourceTitle: updated.title,
      details: input.notes ?? undefined,
      workspaceId,
    });

    return updated;
  }),

  reject: supervisorProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user?.id ?? "unknown";
      const userName = ctx.session.user?.name ?? "Unknown User";
      const userRole = (ctx.session.user?.role ?? "viewer") as string;

      const [current] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.id),
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 0),
          ),
        );

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Reject transitions: under_review -> rejected is a valid FSM transition.
      // The rejected state is a valid enum value. From rejected, the user can
      // separately transition back to draft via the FSM (rejected -> draft).
      if (!canTransition(current.status, "rejected", userRole)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Invalid status transition from ${current.status} to rejected`,
        });
      }

      const [updated] = await db
        .update(documents)
        .set({
          status: "rejected",
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(eq(documents.id, input.id), eq(documents.workspaceId, workspaceId)))
        .returning();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "document.reject",
        resourceType: "document",
        resourceId: input.id,
        resourceTitle: updated.title,
        details: input.reason ?? "Document rejected",
        workspaceId,
      });

      return updated;
    }),

  transition: engineerProcedure
    .input(z.object({ id: z.string(), newStatus: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user?.id ?? "unknown";
      const userName = ctx.session.user?.name ?? "Unknown User";
      const userRole = (ctx.session.user?.role ?? "viewer") as UserRole;

      // For "archived" transitions, verify supervisor+ role
      if (input.newStatus === "archived" && !isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only supervisors and above can mark documents as obsolete/archived",
        });
      }

      return executeTransition(input.id, input.newStatus, {
        db,
        userId,
        userName,
        workspaceId,
        userRole,
      });
    }),

  checkDuplicate: protectedProcedure
    .input(z.object({ fileHash: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [existing] = await db
        .select({
          id: documents.id,
          documentNumber: documents.documentNumber,
          title: documents.title,
        })
        .from(documents)
        .where(
          and(
            eq(documents.fileHash, input.fileHash),
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 0),
          ),
        )
        .limit(1);

      if (existing) {
        return {
          isDuplicate: true,
          existingDocumentId: existing.id,
          existingDocumentNumber: existing.documentNumber,
          existingDocumentTitle: existing.title,
        };
      }

      return { isDuplicate: false };
    }),

  getLinkedPls: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify document belongs to workspace and is not deleted
      const [doc] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 0),
          ),
        );

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const linkedPls = await db
        .select({
          id: plNumbers.id,
          plNumber: plNumbers.plNumber,
          name: plNumbers.name,
          category: plNumbers.category,
          status: plNumbers.status,
        })
        .from(documentPlLinks)
        .innerJoin(plNumbers, eq(documentPlLinks.plNumberId, plNumbers.id))
        .where(eq(documentPlLinks.documentId, input.documentId));

      return linkedPls;
    }),

  bulkAction: engineerProcedure.input(bulkActionSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const succeeded: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ id: string; reason: string }> = [];

    // Validate all documents belong to this workspace
    const docs = await db
      .select({ id: documents.id, status: documents.status })
      .from(documents)
      .where(and(inArray(documents.id, input.ids), eq(documents.workspaceId, workspaceId)));

    const validDocIds = new Set(docs.map((d) => d.id));
    const docStatusMap = new Map(docs.map((d) => [d.id, d.status]));

    // Check for IDs not in workspace
    for (const id of input.ids) {
      if (!validDocIds.has(id)) {
        failed.push(id);
        errors.push({ id, reason: "Document not found in workspace" });
      }
    }

    // Filter to only valid docs
    const validIds = input.ids.filter((id) => validDocIds.has(id));

    // For delete action, skip legal-held (approved) documents
    const processableIds: string[] = [];
    if (input.action === "delete") {
      // Check for active record declarations
      const activeDeclarations = await db
        .select({ documentId: recordDeclarations.documentId })
        .from(recordDeclarations)
        .where(
          and(
            inArray(recordDeclarations.documentId, validIds),
            isNull(recordDeclarations.destroyedAt),
          ),
        );

      const declaredDocIds = new Set(activeDeclarations.map((d) => d.documentId));

      for (const id of validIds) {
        if (declaredDocIds.has(id)) {
          failed.push(id);
          errors.push({ id, reason: "Cannot delete declared record" });
        } else {
          const status = docStatusMap.get(id);
          if (status === "approved") {
            failed.push(id);
            errors.push({ id, reason: "Cannot delete approved/legal-held document" });
          } else {
            processableIds.push(id);
          }
        }
      }
    } else {
      processableIds.push(...validIds);
    }

    if (processableIds.length === 0) {
      return { succeeded, failed, errors };
    }

    // Process the bulk action
    switch (input.action) {
      case "archive": {
        await db
          .update(documents)
          .set({ status: "archived", updatedAt: new Date(), updatedBy: userId })
          .where(
            and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "delete": {
        // Soft-delete and flag orphaned file hashes as removed (no physical
        // deletion), atomically per the no-hard-delete policy.
        await db.transaction(async (tx) => {
          const targets = await tx
            .select({ id: documents.id, fileHash: documents.fileHash })
            .from(documents)
            .where(
              and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
            );

          await tx
            .update(documents)
            .set({ isDeleted: 1, deletedAt: new Date(), updatedAt: new Date(), updatedBy: userId })
            .where(
              and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
            );

          // Flag each distinct hash only if no live document still references it.
          const seen = new Set<string>();
          for (const t of targets) {
            if (!t.fileHash || seen.has(t.fileHash)) continue;
            seen.add(t.fileHash);
            await markHashRemovedIfOrphaned(
              {
                fileHash: t.fileHash,
                removedBy: userId,
                workspaceId,
                lastDocumentId: t.id,
                reason: "document.bulkAction.delete",
              },
              tx,
            );
          }
        });
        succeeded.push(...processableIds);
        break;
      }

      case "tag": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Tag ID (value) is required for tag action" });
          }
          break;
        }
        if (processableIds.length > 0) {
          try {
            const values = processableIds.map((docId) => ({
              documentId: docId,
              tagId: input.value!,
              taggedBy: userId,
            }));
            await db.insert(documentTags).values(values).onConflictDoNothing();
            succeeded.push(...processableIds);
          } catch (e) {
            for (const id of processableIds) {
              failed.push(id);
              errors.push({ id, reason: "Failed to add tag in bulk" });
            }
          }
        }
        break;
      }

      case "untag": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Tag ID (value) is required for untag action" });
          }
          break;
        }
        await db
          .delete(documentTags)
          .where(
            and(
              inArray(documentTags.documentId, processableIds),
              eq(documentTags.tagId, input.value),
            ),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "cabinet_add": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Cabinet ID (value) is required for cabinet_add action" });
          }
          break;
        }
        if (processableIds.length > 0) {
          try {
            const values = processableIds.map((docId) => ({
              documentId: docId,
              cabinetId: input.value!,
              addedBy: userId,
            }));
            await db.insert(documentCabinets).values(values).onConflictDoNothing();
            succeeded.push(...processableIds);
          } catch (e) {
            for (const id of processableIds) {
              failed.push(id);
              errors.push({ id, reason: "Failed to add to cabinet in bulk" });
            }
          }
        }
        break;
      }

      case "cabinet_remove": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({
              id,
              reason: "Cabinet ID (value) is required for cabinet_remove action",
            });
          }
          break;
        }
        await db
          .delete(documentCabinets)
          .where(
            and(
              inArray(documentCabinets.documentId, processableIds),
              eq(documentCabinets.cabinetId, input.value),
            ),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "classify": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Category (value) is required for classify action" });
          }
          break;
        }
        // Validate category against allowed enum values
        const validCategories = documentCategoryEnum.enumValues;
        if (!validCategories.includes(input.value as (typeof validCategories)[number])) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({
              id,
              reason: `Invalid category "${input.value}". Must be one of: ${validCategories.join(", ")}`,
            });
          }
          break;
        }
        await db
          .update(documents)
          .set({
            category: input.value as (typeof documents.category.enumValues)[number],
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(
            and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
          );
        succeeded.push(...processableIds);
        break;
      }
    }

    // Create audit entry for the bulk operation
    await createAuditEntry(db, {
      userId,
      userName,
      action: `bulk_${input.action}`,
      resourceType: "document",
      resourceId: processableIds[0] ?? input.ids[0],
      resourceTitle: `Bulk ${input.action} on ${input.ids.length} documents`,
      details: `Action: ${input.action}, Total: ${input.ids.length}, Succeeded: ${succeeded.length}, Failed: ${failed.length}`,
      workspaceId,
    });

    return { succeeded, failed, errors };
  }),
});
