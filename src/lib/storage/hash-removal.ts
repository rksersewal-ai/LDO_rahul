import { randomUUID } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { type Database, db as defaultDb } from "@/lib/db";
import { documentLegalHolds, documents, legalHolds, removedFileHashes } from "@/lib/db/schema";
import { logInfo, logWarn } from "@/lib/logging/structured-logger";

/**
 * No-hard-delete policy helpers.
 *
 * Storage is content-addressed, so many documents may share one physical file
 * (identified by its SHA-256 hash). These helpers NEVER touch the filesystem.
 * They only maintain a logical "removed" flag at the hash level in the
 * `removed_file_hashes` registry. Physical bytes always remain on NAS.
 *
 * Accepts an optional transaction/db handle (`dbc`) so callers can run these
 * operations inside an existing transaction for atomicity.
 */

/** A database-like handle that supports the queries used here (works with both db and tx). */
type Db = Pick<Database, "select" | "insert" | "update">;

/**
 * Count how many live (non-deleted) documents still reference a given file hash.
 * Optionally excludes a specific document (e.g. the one currently being removed).
 */
export async function countActiveReferences(
  fileHash: string,
  excludeDocumentId?: string,
  dbc: Db = defaultDb,
): Promise<number> {
  const conditions = [eq(documents.fileHash, fileHash), eq(documents.isDeleted, false)];
  if (excludeDocumentId) {
    conditions.push(ne(documents.id, excludeDocumentId));
  }

  const [row] = await dbc
    .select({ value: sql<number>`count(*)::int` })
    .from(documents)
    .where(and(...conditions));

  return row?.value ?? 0;
}

/**
 * Returns true if the given file hash is currently flagged as removed
 * (and has not been restored).
 */
export async function isHashRemoved(fileHash: string, dbc: Db = defaultDb): Promise<boolean> {
  const [row] = await dbc
    .select({ id: removedFileHashes.id })
    .from(removedFileHashes)
    .where(
      and(eq(removedFileHashes.fileHash, fileHash), sql`${removedFileHashes.restoredAt} IS NULL`),
    )
    .limit(1);

  return Boolean(row);
}

interface MarkHashRemovedParams {
  fileHash: string;
  removedBy?: string;
  workspaceId?: string | null;
  lastDocumentId?: string;
  reason?: string;
}

/**
 * Flag a file hash as logically removed. NEVER deletes the physical file.
 * Idempotent: if the hash already has an active removal record it is updated;
 * if it had been restored, the record is re-activated.
 */
export async function markHashRemoved(
  params: MarkHashRemovedParams,
  dbc: Db = defaultDb,
): Promise<void> {
  const { fileHash, removedBy, workspaceId, lastDocumentId, reason } = params;

  await dbc
    .insert(removedFileHashes)
    .values({
      id: randomUUID(),
      fileHash,
      workspaceId: workspaceId ?? null,
      lastDocumentId: lastDocumentId ?? null,
      removedBy: removedBy ?? null,
      reason: reason ?? null,
      removedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: removedFileHashes.fileHash,
      set: {
        workspaceId: workspaceId ?? null,
        lastDocumentId: lastDocumentId ?? null,
        removedBy: removedBy ?? null,
        reason: reason ?? null,
        removedAt: new Date(),
        // Clear any prior restore so the hash is "removed" again.
        restoredAt: null,
        restoredBy: null,
      },
    });

  logInfo("[hash-removal] File hash flagged as removed (physical file retained)", {
    fileHash,
    lastDocumentId,
    workspaceId: workspaceId ?? undefined,
  });
}

/**
 * Returns true if ANY document sharing this file hash is under an ACTIVE legal
 * hold. Legal holds override the no-hard-delete removal flow entirely: a held
 * hash must never be flagged removed, even when no live document references it
 * (a deleted-but-held document still freezes the content for e-discovery).
 */
export async function isHashUnderLegalHold(
  fileHash: string,
  dbc: Db = defaultDb,
): Promise<boolean> {
  const [row] = await dbc
    .select({ holdId: documentLegalHolds.holdId })
    .from(documentLegalHolds)
    .innerJoin(documents, eq(documents.id, documentLegalHolds.documentId))
    .innerJoin(legalHolds, eq(legalHolds.id, documentLegalHolds.holdId))
    .where(and(eq(documents.fileHash, fileHash), eq(legalHolds.status, "active")))
    .limit(1);

  return Boolean(row);
}

/**
 * Flag a file hash as removed ONLY when no other live document references it.
 * This is the safe entry point for document deletion under content-addressed
 * storage: it prevents flagging a hash that is still shared by other documents,
 * and it NEVER flags a hash that is under an active legal hold.
 * Returns true if the hash was flagged, false otherwise.
 */
export async function markHashRemovedIfOrphaned(
  params: MarkHashRemovedParams,
  dbc: Db = defaultDb,
): Promise<boolean> {
  // Legal hold takes precedence over everything — never flag a held hash.
  if (await isHashUnderLegalHold(params.fileHash, dbc)) {
    logWarn("[hash-removal] Skipped removal flag: file hash is under an active legal hold", {
      fileHash: params.fileHash,
      lastDocumentId: params.lastDocumentId,
    });
    return false;
  }

  const remaining = await countActiveReferences(params.fileHash, params.lastDocumentId, dbc);
  if (remaining > 0) {
    return false;
  }
  await markHashRemoved(params, dbc);
  return true;
}

/**
 * Restore a previously removed hash (e.g. a new document re-references it).
 * Leaves the audit trail intact by recording who/when it was restored.
 */
export async function restoreHash(
  fileHash: string,
  restoredBy?: string,
  dbc: Db = defaultDb,
): Promise<void> {
  await dbc
    .update(removedFileHashes)
    .set({ restoredAt: new Date(), restoredBy: restoredBy ?? null })
    .where(
      and(eq(removedFileHashes.fileHash, fileHash), sql`${removedFileHashes.restoredAt} IS NULL`),
    );

  logInfo("[hash-removal] File hash restored", { fileHash, restoredBy });
}
