import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentShareLinks, documents } from "@/lib/db/schema";
import {
  createShareLinkSchema,
  getShareLinksSchema,
  resolveShareTokenSchema,
  revokeShareLinkSchema,
} from "@/lib/validators/document-share-links";
import { engineerProcedure, protectedProcedure, publicProcedure, router } from "@/server/trpc";

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

export const documentShareLinksRouter = router({
  createShareLink: engineerProcedure
    .input(createShareLinkSchema)
    .mutation(async ({ input, ctx }) => {
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

      const id = randomUUID();
      const token = nanoid(48);

      // Hash password if provided
      let passwordHash: string | null = null;
      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 12);
      }

      const [created] = await db
        .insert(documentShareLinks)
        .values({
          id,
          token,
          documentId: input.documentId,
          versionId: input.versionId ?? null,
          createdBy: userId,
          passwordHash,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          maxViews: input.maxViews ?? null,
          viewCount: 0,
          isRevoked: 0,
          allowDownload: input.allowDownload ? 1 : 0,
          workspaceId,
        })
        .returning();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "document_share_link.create",
        resourceType: "document_share_link",
        resourceId: id,
        resourceTitle: doc.title,
        details: `Created share link for document "${doc.title}"${input.password ? " (password protected)" : ""}${input.expiresAt ? ` expires ${input.expiresAt}` : ""}`,
        workspaceId,
      });

      return { ...created, token };
    }),

  getShareLinks: protectedProcedure.input(getShareLinksSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Verify document belongs to workspace
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    const links = await db
      .select({
        id: documentShareLinks.id,
        token: documentShareLinks.token,
        documentId: documentShareLinks.documentId,
        versionId: documentShareLinks.versionId,
        createdBy: documentShareLinks.createdBy,
        hasPassword: documentShareLinks.passwordHash,
        expiresAt: documentShareLinks.expiresAt,
        maxViews: documentShareLinks.maxViews,
        viewCount: documentShareLinks.viewCount,
        isRevoked: documentShareLinks.isRevoked,
        allowDownload: documentShareLinks.allowDownload,
        createdAt: documentShareLinks.createdAt,
      })
      .from(documentShareLinks)
      .where(
        and(
          eq(documentShareLinks.documentId, input.documentId),
          eq(documentShareLinks.workspaceId, workspaceId),
        ),
      );

    // Map hasPassword to boolean (don't expose the hash)
    return links.map((link) => ({
      ...link,
      hasPassword: !!link.hasPassword,
    }));
  }),

  revokeShareLink: engineerProcedure
    .input(revokeShareLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Find the link
      const [link] = await db
        .select()
        .from(documentShareLinks)
        .where(
          and(
            eq(documentShareLinks.id, input.linkId),
            eq(documentShareLinks.workspaceId, workspaceId),
          ),
        );

      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
      }

      await db
        .update(documentShareLinks)
        .set({ isRevoked: 1 })
        .where(eq(documentShareLinks.id, input.linkId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "document_share_link.revoke",
        resourceType: "document_share_link",
        resourceId: input.linkId,
        details: `Revoked share link for document ${link.documentId}`,
        workspaceId,
      });

      return { success: true };
    }),

  resolveShareToken: publicProcedure.input(resolveShareTokenSchema).query(async ({ input }) => {
    // Find the share link by token - NO workspace filter (public)
    const [link] = await db
      .select()
      .from(documentShareLinks)
      .where(eq(documentShareLinks.token, input.token));

    if (!link) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
    }

    // Check if revoked
    if (link.isRevoked === 1) {
      return { status: "revoked" as const, document: null };
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { status: "expired" as const, document: null };
    }

    // Check max views
    if (link.maxViews !== null && link.viewCount >= link.maxViews) {
      return { status: "expired" as const, document: null };
    }

    // Check password
    if (link.passwordHash) {
      if (!input.password) {
        return { status: "password_required" as const, document: null };
      }
      const valid = await bcrypt.compare(input.password, link.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
    }

    // Atomically increment view count, respecting max_views constraint
    const [updated] = await db
      .update(documentShareLinks)
      .set({ viewCount: sql`${documentShareLinks.viewCount} + 1` })
      .where(
        and(
          eq(documentShareLinks.id, link.id),
          sql`(${documentShareLinks.maxViews} IS NULL OR ${documentShareLinks.viewCount} < ${documentShareLinks.maxViews})`,
        ),
      )
      .returning({ viewCount: documentShareLinks.viewCount });

    // If no rows updated, the link has been exhausted by a concurrent request
    if (!updated) {
      return { status: "expired" as const, document: null };
    }

    // Fetch document info
    const [doc] = await db
      .select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        title: documents.title,
        description: documents.description,
        category: documents.category,
        status: documents.status,
        revision: documents.revision,
        mimeType: documents.mimeType,
        originalFilename: documents.originalFilename,
        pageCount: documents.pageCount,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.id, link.documentId));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    return {
      status: "valid" as const,
      document: doc,
      allowDownload: link.allowDownload === 1,
      versionId: link.versionId,
    };
  }),
});
