import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, max } from "drizzle-orm";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import {
  getDiffSchema,
  getVersionHistorySchema,
  restoreVersionSchema,
  uploadVersionSchema,
} from "@/lib/validators/document-versions";
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
 * Compute word-level diff between two texts.
 * Returns arrays of additions, deletions, and unchanged words.
 */
function computeWordDiff(
  oldText: string,
  newText: string,
): { additions: string[]; deletions: string[]; unchanged: string[] } {
  const oldWords = oldText.split(/\s+/).filter(Boolean);
  const newWords = newText.split(/\s+/).filter(Boolean);

  const additions: string[] = [];
  const deletions: string[] = [];
  const unchanged: string[] = [];

  // Simple LCS-based word diff
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m;
  let j = n;
  const result: { type: "add" | "del" | "same"; word: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: "same", word: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", word: newWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: "del", word: oldWords[i - 1] });
      i--;
    }
  }

  for (const item of result) {
    if (item.type === "add") additions.push(item.word);
    else if (item.type === "del") deletions.push(item.word);
    else unchanged.push(item.word);
  }

  return { additions, deletions, unchanged };
}

export const documentVersionsRouter = router({
  uploadVersion: engineerProcedure.input(uploadVersionSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify the document exists and belongs to this workspace
    const [doc] = await db
      .select({ id: documents.id, title: documents.title })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // Get next version number
    const [maxResult] = await db
      .select({ maxVersion: max(documentVersions.versionNumber) })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, input.documentId));

    const nextVersion = (maxResult?.maxVersion ?? 0) + 1;

    // Unset previous current version
    await db
      .update(documentVersions)
      .set({ isCurrentVersion: 0 })
      .where(
        and(
          eq(documentVersions.documentId, input.documentId),
          eq(documentVersions.isCurrentVersion, 1),
        ),
      );

    // Insert new version
    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(documentVersions)
      .values({
        id,
        documentId: input.documentId,
        versionNumber: nextVersion,
        revision: input.revision ?? null,
        changeNote: input.changeNote ?? null,
        uploadedBy: userId,
        uploadedAt: now,
        isCurrentVersion: 1,
        workspaceId,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document_version.upload",
      resourceType: "document_version",
      resourceId: id,
      resourceTitle: `${doc.title} v${nextVersion}`,
      details: `Uploaded version ${nextVersion} for document "${doc.title}"${input.changeNote ? `: ${input.changeNote}` : ""}`,
      workspaceId,
    });

    return created;
  }),

  getVersionHistory: protectedProcedure
    .input(getVersionHistorySchema)
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify document belongs to workspace
      const [doc] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const versions = await db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, input.documentId),
            eq(documentVersions.workspaceId, workspaceId),
          ),
        )
        .orderBy(desc(documentVersions.versionNumber))
        .limit(input.limit)
        .offset(input.offset);

      return versions;
    }),

  restoreVersion: engineerProcedure.input(restoreVersionSchema).mutation(async ({ input, ctx }) => {
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

    // Find the version to restore
    const [targetVersion] = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, input.documentId),
          eq(documentVersions.versionNumber, input.versionNumber),
        ),
      );

    if (!targetVersion) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
    }

    // Get next version number
    const [maxResult] = await db
      .select({ maxVersion: max(documentVersions.versionNumber) })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, input.documentId));

    const nextVersion = (maxResult?.maxVersion ?? 0) + 1;

    // Unset previous current version
    await db
      .update(documentVersions)
      .set({ isCurrentVersion: 0 })
      .where(
        and(
          eq(documentVersions.documentId, input.documentId),
          eq(documentVersions.isCurrentVersion, 1),
        ),
      );

    // Create new version as a copy of the target
    const id = randomUUID();
    const now = new Date();

    const [restored] = await db
      .insert(documentVersions)
      .values({
        id,
        documentId: input.documentId,
        versionNumber: nextVersion,
        revision: targetVersion.revision,
        filePath: targetVersion.filePath,
        fileSize: targetVersion.fileSize,
        fileHash: targetVersion.fileHash,
        mimeType: targetVersion.mimeType,
        originalFilename: targetVersion.originalFilename,
        ocrStatus: targetVersion.ocrStatus,
        ocrText: targetVersion.ocrText,
        ocrConfidence: targetVersion.ocrConfidence,
        thumbnailPath: targetVersion.thumbnailPath,
        pageCount: targetVersion.pageCount,
        changeNote: `Restored from version ${input.versionNumber}`,
        uploadedBy: userId,
        uploadedAt: now,
        isCurrentVersion: 1,
        workspaceId,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "document_version.restore",
      resourceType: "document_version",
      resourceId: id,
      resourceTitle: `${doc.title} v${nextVersion}`,
      details: `Restored version ${input.versionNumber} as new version ${nextVersion} for document "${doc.title}"`,
      workspaceId,
    });

    return restored;
  }),

  getDiff: protectedProcedure.input(getDiffSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Verify document belongs to workspace
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)));

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }

    // Fetch both versions
    const [fromVersion] = await db
      .select({ ocrText: documentVersions.ocrText })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, input.documentId),
          eq(documentVersions.versionNumber, input.fromVersion),
        ),
      );

    const [toVersion] = await db
      .select({ ocrText: documentVersions.ocrText })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, input.documentId),
          eq(documentVersions.versionNumber, input.toVersion),
        ),
      );

    if (!fromVersion || !toVersion) {
      throw new TRPCError({ code: "NOT_FOUND", message: "One or both versions not found" });
    }

    const oldText = fromVersion.ocrText ?? "";
    const newText = toVersion.ocrText ?? "";

    const diff = computeWordDiff(oldText, newText);

    return {
      fromVersion: input.fromVersion,
      toVersion: input.toVersion,
      ...diff,
    };
  }),
});
