import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { type Database, db as defaultDb } from "@/lib/db";
import {
  documentPlLinks,
  documentRelations,
  documents,
  duplicateDetections,
} from "@/lib/db/schema";
import { markHashRemovedIfOrphaned } from "@/lib/storage/hash-removal";

/**
 * Shared duplicate-merge logic — the single source of truth used by both
 * `dedup.confirmDuplicate` and `admin.mergeDuplicates`.
 *
 * Behaviour (NO-HARD-DELETE):
 *  1. Record a `duplicate_of` relation (kept -> archived) for provenance.
 *  2. Soft-delete the non-kept document (physical bytes are NEVER unlinked).
 *  3. Redirect the archived document's PL links to the kept document,
 *     dropping any links that would collide.
 *  4. Flag the archived document's file hash as removed ONLY if no other live
 *     document still references it (and never when under a legal hold).
 *  5. Mark the detection as `merged` and write a tamper-evident audit entry.
 *
 * Everything runs inside a single transaction so the relation, archival,
 * PL-link redirect, detection status, hash flag and audit stay consistent.
 */
export interface MergeDuplicateParams {
  detectionId: string;
  keepDocumentId: string;
  note?: string;
  userId: string;
  userName: string;
  /** Reason recorded on the removed-hash registry entry (call-site specific). */
  reason?: string;
}

export interface MergeDuplicateResult {
  success: true;
  keptDocumentId: string;
  archivedDocumentId: string;
}

export async function mergeDuplicateDetection(
  params: MergeDuplicateParams,
  dbc: Database = defaultDb,
): Promise<MergeDuplicateResult> {
  const { detectionId, keepDocumentId, note, userId, userName } = params;
  const reason = params.reason ?? "dedup.merge";

  const [detection] = await dbc
    .select()
    .from(duplicateDetections)
    .where(eq(duplicateDetections.id, detectionId));

  if (!detection) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Detection not found." });
  }

  if (detection.status !== "pending") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Detection already resolved." });
  }

  if (keepDocumentId !== detection.documentAId && keepDocumentId !== detection.documentBId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "keepDocumentId must be one of the detected pair.",
    });
  }

  const archivedId =
    keepDocumentId === detection.documentAId ? detection.documentBId : detection.documentAId;

  await dbc.transaction(async (tx) => {
    // 1. Provenance relation (docA = kept, docB = archived).
    await tx.insert(documentRelations).values({
      id: randomUUID(),
      documentAId: keepDocumentId,
      documentBId: archivedId,
      relationType: "duplicate_of",
      createdBy: userId,
    });

    // 2. Soft-delete the archived document (physical file retained).
    const [archivedDoc] = await tx
      .update(documents)
      .set({ isDeleted: 1, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.id, archivedId))
      .returning({ fileHash: documents.fileHash });

    // 3. Redirect PL links from archived to kept, dropping collisions.
    const keptPlLinks = await tx
      .select({ plNumberId: documentPlLinks.plNumberId })
      .from(documentPlLinks)
      .where(eq(documentPlLinks.documentId, keepDocumentId));
    const keptPlIds = new Set(keptPlLinks.map((l) => l.plNumberId));

    if (keptPlIds.size > 0) {
      await tx
        .delete(documentPlLinks)
        .where(
          and(
            eq(documentPlLinks.documentId, archivedId),
            inArray(documentPlLinks.plNumberId, [...keptPlIds]),
          ),
        );
    }

    await tx
      .update(documentPlLinks)
      .set({ documentId: keepDocumentId })
      .where(eq(documentPlLinks.documentId, archivedId));

    // 4. No-hard-delete: flag the archived hash removed only if orphaned.
    if (archivedDoc?.fileHash) {
      await markHashRemovedIfOrphaned(
        {
          fileHash: archivedDoc.fileHash,
          removedBy: userId,
          workspaceId: detection.workspaceId,
          lastDocumentId: archivedId,
          reason,
        },
        tx,
      );
    }

    // 5. Resolve the detection + audit.
    await tx
      .update(duplicateDetections)
      .set({
        status: "merged",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNote: note ?? null,
      })
      .where(eq(duplicateDetections.id, detectionId));

    await createAuditEntry(tx, {
      userId,
      userName,
      action: "DEDUP_CONFIRM",
      resourceType: "duplicate_detection",
      resourceId: detectionId,
      resourceTitle: `Kept ${keepDocumentId}, archived ${archivedId}`,
      details: `Confirmed duplicate. Kept document ${keepDocumentId}, archived ${archivedId}.${note ? ` Note: ${note}` : ""}`,
      workspaceId: detection.workspaceId,
    });
  });

  return { success: true, keptDocumentId: keepDocumentId, archivedDocumentId: archivedId };
}
