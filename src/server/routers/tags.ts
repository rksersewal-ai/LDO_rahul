import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentTags, documents, tags } from "@/lib/db/schema";
import {
  createTagSchema,
  tagDocumentsSchema,
  tagGetDocumentsSchema,
  untagDocumentSchema,
  updateTagSchema,
} from "@/lib/validators/tags";
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

export const tagsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        description: tags.description,
        createdBy: tags.createdBy,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
      })
      .from(tags)
      .where(eq(tags.workspaceId, workspaceId))
      .orderBy(tags.name);

    // Get usage counts
    const usageCounts = await db
      .select({
        tagId: documentTags.tagId,
        usageCount: count(),
      })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(tags.workspaceId, workspaceId))
      .groupBy(documentTags.tagId);

    const countMap = new Map(usageCounts.map((c) => [c.tagId, c.usageCount]));

    return allTags.map((tag) => ({
      ...tag,
      usageCount: countMap.get(tag.id) ?? 0,
    }));
  }),

  create: engineerProcedure.input(createTagSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Check unique constraint (workspace + name)
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.workspaceId, workspaceId), eq(tags.name, input.name)));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A tag with the name "${input.name}" already exists`,
      });
    }

    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(tags)
      .values({
        id,
        workspaceId,
        name: input.name,
        color: input.color ?? "#6366F1",
        description: input.description ?? null,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "tag.create",
      resourceType: "tag",
      resourceId: id,
      resourceTitle: input.name,
      details: `Created tag "${input.name}"`,
      workspaceId,
    });

    return created;
  }),

  update: engineerProcedure.input(updateTagSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const [oldTag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, input.id), eq(tags.workspaceId, workspaceId)));

    if (!oldTag) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
    }

    // If name is being changed, check uniqueness
    if (input.name && input.name !== oldTag.name) {
      const [existing] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.workspaceId, workspaceId), eq(tags.name, input.name)));

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A tag with the name "${input.name}" already exists`,
        });
      }
    }

    const { id, ...updates } = input;
    const setValues: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.color !== undefined) setValues.color = updates.color;
    if (updates.description !== undefined) setValues.description = updates.description;

    const [updated] = await db.update(tags).set(setValues).where(eq(tags.id, id)).returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "tag.update",
      resourceType: "tag",
      resourceId: id,
      resourceTitle: updated.name,
      details: `Updated tag "${updated.name}" fields: ${Object.keys(updates).join(", ")}`,
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

      const [tag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.id, input.id), eq(tags.workspaceId, workspaceId)));

      if (!tag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      // Cascade: delete document_tags rows first
      await db.delete(documentTags).where(eq(documentTags.tagId, input.id));

      // Delete the tag
      await db.delete(tags).where(eq(tags.id, input.id));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "tag.delete",
        resourceType: "tag",
        resourceId: input.id,
        resourceTitle: tag.name,
        details: `Deleted tag "${tag.name}"`,
        workspaceId,
      });

      return { success: true };
    }),

  getDocuments: protectedProcedure.input(tagGetDocumentsSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Verify tag belongs to workspace
    const [tag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, input.tagId), eq(tags.workspaceId, workspaceId)));

    if (!tag) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
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
          taggedBy: documentTags.taggedBy,
          taggedAt: documentTags.taggedAt,
        })
        .from(documentTags)
        .innerJoin(documents, eq(documentTags.documentId, documents.id))
        .where(eq(documentTags.tagId, input.tagId))
        .orderBy(desc(documentTags.taggedAt))
        .offset(offset)
        .limit(input.pageSize),
      db
        .select({ totalCount: count() })
        .from(documentTags)
        .where(eq(documentTags.tagId, input.tagId)),
    ]);

    return {
      data,
      totalCount: totalResult[0]?.totalCount ?? 0,
      page: input.page,
      pageSize: input.pageSize,
    };
  }),

  tagDocuments: engineerProcedure.input(tagDocumentsSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify tag belongs to workspace
    const [tag] = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(and(eq(tags.id, input.tagId), eq(tags.workspaceId, workspaceId)));

    if (!tag) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
    }

    // Enforce max 20 tags per document - check each document
    for (const docId of input.documentIds) {
      const [tagCount] = await db
        .select({ cnt: count() })
        .from(documentTags)
        .where(eq(documentTags.documentId, docId));

      if ((tagCount?.cnt ?? 0) >= 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Document ${docId} already has the maximum of 20 tags`,
        });
      }
    }

    const now = new Date();
    const values = input.documentIds.map((docId) => ({
      documentId: docId,
      tagId: input.tagId,
      taggedBy: userId,
      taggedAt: now,
    }));

    // Use onConflictDoNothing so duplicates are silently ignored
    await db.insert(documentTags).values(values).onConflictDoNothing();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "tag.tagDocuments",
      resourceType: "tag",
      resourceId: input.tagId,
      resourceTitle: tag.name,
      details: `Tagged ${input.documentIds.length} document(s) with "${tag.name}"`,
      workspaceId,
    });

    return { success: true, count: input.documentIds.length };
  }),

  untagDocument: engineerProcedure.input(untagDocumentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify tag belongs to workspace
    const [tag] = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(and(eq(tags.id, input.tagId), eq(tags.workspaceId, workspaceId)));

    if (!tag) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
    }

    await db
      .delete(documentTags)
      .where(and(eq(documentTags.tagId, input.tagId), eq(documentTags.documentId, input.documentId)));

    await createAuditEntry(db, {
      userId,
      userName,
      action: "tag.untagDocument",
      resourceType: "tag",
      resourceId: input.tagId,
      resourceTitle: tag.name,
      details: `Removed tag "${tag.name}" from document ${input.documentId}`,
      workspaceId,
    });

    return { success: true };
  }),
});
