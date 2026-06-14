import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentPlLinks, documents, ocrJobs, workspaces } from "@/lib/db/schema";
import { logError, logWarn } from "@/lib/logging/structured-logger";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import { restoreHash } from "@/lib/storage/hash-removal";
import { storeFile } from "@/lib/storage/nas-storage";
import { checkStorageQuota, validateMagicBytes } from "@/lib/upload/validation";
import type { UploadDocumentInput } from "@/lib/validators/documents";
import { addOcrJob } from "@/workers/ocr-queue";

/** Typed error carrying an HTTP status so the route can map it cleanly. */
export class UploadError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export interface ProcessUploadInput {
  buffer: Buffer;
  originalFilename: string;
  metadata: UploadDocumentInput;
  workspaceId: string;
  userId: string;
  userName: string;
  clearanceRequired?: number;
}

export interface ProcessUploadResult {
  documentId: string;
  documentNumber: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  ocrQueued: boolean;
}

/** MIME types we run OCR on. Everything else is stored as not_required. */
const OCR_MIME_TYPES = new Set(["application/pdf", "image/tiff", "image/jpeg", "image/png"]);

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/tiff":
      return "tiff";
    default:
      return "bin";
  }
}

/**
 * Validate the document category against the database enum, falling back to
 * OTHER when the form supplies a value the DB enum does not contain (the upload
 * form and the DB enum currently diverge for some categories). This prevents an
 * invalid-enum insert from crashing the upload.
 */
function normalizeCategory(category: string): (typeof documents.category.enumValues)[number] {
  const valid = documents.category.enumValues;
  if ((valid as readonly string[]).includes(category)) {
    return category as (typeof valid)[number];
  }
  logWarn("[upload] Category not in DB enum; storing as OTHER", { code: category });
  return "OTHER";
}

/**
 * Full document upload pipeline (single source of truth):
 *   validate content -> hash -> quota -> store to NAS -> insert document
 *   (+ PL links, quota update, OCR job, hash-restore, audit) -> enqueue OCR.
 *
 * The physical file is written to NAS BEFORE the DB transaction so a failed
 * transaction leaves only a harmless orphan blob (never a document row pointing
 * at a missing file). Under the no-hard-delete policy orphan blobs are retained.
 */
export async function processDocumentUpload(
  input: ProcessUploadInput,
): Promise<ProcessUploadResult> {
  const { buffer, originalFilename, metadata, workspaceId, userId, userName } = input;

  // 1. Content validation by magic bytes (never trust the client MIME type).
  const { valid, detectedType } = validateMagicBytes(buffer);
  if (!valid || !detectedType) {
    throw new UploadError(415, "Unsupported or corrupt file. Allowed: PDF, TIFF, JPEG, PNG.");
  }
  const mimeType = detectedType;
  const fileSize = buffer.length;

  // 2. Content hash (SHA-256) for content-addressed storage + dedup.
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  // 3. Reject only when a LIVE (non-deleted) document already has this hash in
  //    the workspace. Re-uploading previously deleted content is allowed and
  //    re-references the retained bytes.
  const [liveDup] = await db
    .select({ id: documents.id, documentNumber: documents.documentNumber })
    .from(documents)
    .where(
      and(
        eq(documents.fileHash, fileHash),
        eq(documents.workspaceId, workspaceId),
        eq(documents.isDeleted, 0),
      ),
    )
    .limit(1);

  if (liveDup) {
    throw new UploadError(
      409,
      `This file already exists as ${liveDup.documentNumber}.`,
      "DUPLICATE_FILE",
    );
  }

  // 4. Storage quota.
  const [ws] = await db
    .select({
      usedStorageBytes: workspaces.usedStorageBytes,
      storageQuotaGb: workspaces.storageQuotaGb,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws) {
    throw new UploadError(412, "Workspace not found or not configured.");
  }

  try {
    checkStorageQuota(ws.usedStorageBytes, fileSize, ws.storageQuotaGb);
  } catch {
    throw new UploadError(413, "Workspace storage quota exceeded.", "QUOTA_EXCEEDED");
  }

  // 5. Persist bytes to NAS first (content-addressed, idempotent).
  const ext = extensionFor(mimeType);
  let filePath: string;
  try {
    filePath = await storeFile(buffer, fileHash, workspaceId, ext);
  } catch (error) {
    logError(
      "[upload] Failed to store file to NAS",
      { code: fileHash },
      error instanceof Error ? error : undefined,
    );
    throw new UploadError(502, "Failed to store the file. Please try again.");
  }

  const ocrEligible = OCR_MIME_TYPES.has(mimeType);
  const documentId = randomUUID();
  const ocrJobId = ocrEligible ? nanoid() : null;
  const now = new Date();

  // 6. Atomic DB writes.
  try {
    await db.transaction(async (tx) => {
      await tx.insert(documents).values({
        id: documentId,
        documentNumber: metadata.documentNumber,
        title: sanitizeUserInput(metadata.title),
        category: normalizeCategory(metadata.category),
        status: "draft",
        revision: metadata.revision || "A",
        revisionDate: metadata.revisionDate ? new Date(metadata.revisionDate) : null,
        fileHash,
        filePath,
        fileSize,
        mimeType,
        originalFilename: originalFilename.slice(0, 512),
        ocrStatus: ocrEligible ? "queued" : "not_required",
        workshop: metadata.agency || null,
        tags: metadata.tags.length > 0 ? metadata.tags.join(",") : null,
        clearanceRequired: input.clearanceRequired ?? 1,
        createdBy: userId,
        updatedBy: userId,
        workspaceId,
        createdAt: now,
        updatedAt: now,
      });

      if (metadata.linkedPlIds.length > 0) {
        await tx
          .insert(documentPlLinks)
          .values(
            metadata.linkedPlIds.map((plId) => ({
              id: randomUUID(),
              documentId,
              plNumberId: plId,
              linkType: "manual" as const,
              linkedBy: userId,
            })),
          )
          .onConflictDoNothing();
      }

      // Re-reference content: un-flag the hash if it had been logically removed.
      await restoreHash(fileHash, userId, tx);

      // Update workspace storage accounting.
      await tx
        .update(workspaces)
        .set({
          usedStorageBytes: sql`${workspaces.usedStorageBytes} + ${fileSize}`,
          updatedAt: now,
        })
        .where(eq(workspaces.id, workspaceId));

      if (ocrJobId) {
        await tx.insert(ocrJobs).values({
          id: ocrJobId,
          documentId,
          workspaceId,
          status: "queued",
          createdAt: now,
          updatedAt: now,
        });
      }

      await createAuditEntry(tx, {
        userId,
        userName,
        action: "document.create",
        resourceType: "document",
        resourceId: documentId,
        resourceTitle: metadata.title,
        workspaceId,
        details: `Uploaded ${originalFilename} (${fileSize} bytes, ${mimeType})`,
      });
    });
  } catch (error) {
    // Unique violation on document_number (Postgres 23505).
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new UploadError(
        409,
        `Document number ${metadata.documentNumber} already exists.`,
        "DUPLICATE_DOCUMENT_NUMBER",
      );
    }
    logError(
      "[upload] Document insert transaction failed",
      { code: documentId },
      error instanceof Error ? error : undefined,
    );
    throw new UploadError(500, "Failed to record the document. Please try again.");
  }

  // 7. Enqueue OCR after commit. Failure is non-fatal — the job row is queued
  //    and can be retried via ocr.retrigger.
  let ocrQueued = false;
  if (ocrJobId) {
    try {
      await addOcrJob({
        jobId: ocrJobId,
        documentId,
        versionId: "",
        filePath,
        mimeType,
      });
      ocrQueued = true;
    } catch (error) {
      logError(
        "[upload] Failed to enqueue OCR job (document saved; retriggerable)",
        { code: documentId },
        error instanceof Error ? error : undefined,
      );
    }
  }

  return {
    documentId,
    documentNumber: metadata.documentNumber,
    fileHash,
    fileSize,
    mimeType,
    ocrQueued,
  };
}
