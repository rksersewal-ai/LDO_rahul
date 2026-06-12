import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentComments, documents } from "@/lib/db/schema";
import {
  addCommentSchema,
  deleteCommentSchema,
  editCommentSchema,
  getCommentsSchema,
  resolveCommentSchema,
} from "@/lib/validators/document-comments";
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

interface CommentNode {
  id: string;
  documentId: string;
  versionId: string | null;
  parentId: string | null;
  content: string;
  isDeleted: number;
  isResolved: number;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  children: CommentNode[];
}

/**
 * Build tree structure from flat comments list by grouping on parent_id.
 */
function buildCommentTree(comments: Omit<CommentNode, "children">[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // Initialize nodes
  for (const comment of comments) {
    map.set(comment.id, { ...comment, children: [] });
  }

  // Build tree
  for (const comment of comments) {
    const node = map.get(comment.id)!;
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const documentCommentsRouter = router({
  addComment: engineerProcedure.input(addCommentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify document belongs to workspace
    const [doc] = await db
      .select({ id: documents.id, title: documents.title })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // If parentId specified, verify it exists
    if (input.parentId) {
      const [parent] = await db
        .select({ id: documentComments.id })
        .from(documentComments)
        .where(
          and(
            eq(documentComments.id, input.parentId),
            eq(documentComments.workspaceId, workspaceId),
          ),
        );

      if (!parent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parent comment not found" });
      }
    }

    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(documentComments)
      .values({
        id,
        documentId: input.documentId,
        versionId: input.versionId ?? null,
        parentId: input.parentId ?? null,
        content: input.content,
        createdBy: userId,
        workspaceId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document_comment.add",
      resourceType: "document_comment",
      resourceId: id,
      resourceTitle: doc.title,
      details: `Added comment on document "${doc.title}"${input.parentId ? " (reply)" : ""}`,
      workspaceId,
    });

    return created;
  }),

  getComments: protectedProcedure.input(getCommentsSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Verify document belongs to workspace
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    const conditions = [
      eq(documentComments.documentId, input.documentId),
      eq(documentComments.workspaceId, workspaceId),
    ];

    // Filter by versionId when provided
    if (input.versionId) {
      conditions.push(eq(documentComments.versionId, input.versionId));
    }

    const allComments = await db
      .select({
        id: documentComments.id,
        documentId: documentComments.documentId,
        versionId: documentComments.versionId,
        parentId: documentComments.parentId,
        content: documentComments.content,
        isDeleted: documentComments.isDeleted,
        isResolved: documentComments.isResolved,
        resolvedBy: documentComments.resolvedBy,
        resolvedAt: documentComments.resolvedAt,
        createdBy: documentComments.createdBy,
        createdAt: documentComments.createdAt,
        updatedAt: documentComments.updatedAt,
      })
      .from(documentComments)
      .where(and(...conditions))
      .orderBy(documentComments.createdAt);

    return buildCommentTree(allComments);
  }),

  editComment: engineerProcedure.input(editCommentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Find the comment
    const [comment] = await db
      .select()
      .from(documentComments)
      .where(
        and(eq(documentComments.id, input.commentId), eq(documentComments.workspaceId, workspaceId)),
      );

    if (!comment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
    }

    // Only own comments
    if (comment.createdBy !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only edit your own comments",
      });
    }

    // Must be within 24 hours
    const hoursSinceCreation =
      (Date.now() - new Date(comment.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Comments can only be edited within 24 hours of creation",
      });
    }

    const now = new Date();

    const [updated] = await db
      .update(documentComments)
      .set({ content: input.content, updatedAt: now })
      .where(eq(documentComments.id, input.commentId))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document_comment.edit",
      resourceType: "document_comment",
      resourceId: input.commentId,
      details: "Edited comment",
      workspaceId,
    });

    return updated;
  }),

  deleteComment: engineerProcedure.input(deleteCommentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Find the comment
    const [comment] = await db
      .select()
      .from(documentComments)
      .where(
        and(eq(documentComments.id, input.commentId), eq(documentComments.workspaceId, workspaceId)),
      );

    if (!comment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
    }

    // Only comment owner can delete their own comment
    if (comment.createdBy !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only delete your own comments",
      });
    }

    // Soft delete
    await db
      .update(documentComments)
      .set({ isDeleted: 1, updatedAt: new Date() })
      .where(eq(documentComments.id, input.commentId));

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document_comment.delete",
      resourceType: "document_comment",
      resourceId: input.commentId,
      details: "Soft-deleted comment",
      workspaceId,
    });

    return { success: true };
  }),

  resolveComment: supervisorProcedure
    .input(resolveCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Find the comment
      const [comment] = await db
        .select()
        .from(documentComments)
        .where(
          and(
            eq(documentComments.id, input.commentId),
            eq(documentComments.workspaceId, workspaceId),
          ),
        );

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      }

      const now = new Date();

      const [updated] = await db
        .update(documentComments)
        .set({
          isResolved: 1,
          resolvedBy: userId,
          resolvedAt: now,
          updatedAt: now,
        })
        .where(eq(documentComments.id, input.commentId))
        .returning();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "document_comment.resolve",
        resourceType: "document_comment",
        resourceId: input.commentId,
        details: "Resolved comment",
        workspaceId,
      });

      return updated;
    }),
});
