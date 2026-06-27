import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export const MIME_WHITELIST = ["application/pdf", "image/tiff", "image/jpeg", "image/png"] as const;

export const MAGIC_BYTES = {
  PDF: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  JPEG: Buffer.from([0xff, 0xd8, 0xff]),
  PNG: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  TIFF_LE: Buffer.from([0x49, 0x49, 0x2a, 0x00]),
  TIFF_BE: Buffer.from([0x4d, 0x4d, 0x00, 0x2a]),
} as const;

/**
 * Validate that the given MIME type is in the allowed whitelist.
 */
export function validateMimeType(mimeType: string): boolean {
  return (MIME_WHITELIST as readonly string[]).includes(mimeType);
}

/**
 * Validate file content by checking magic bytes against known signatures.
 * Returns the detected type or null if unrecognized.
 */
export function validateMagicBytes(buffer: Buffer): {
  valid: boolean;
  detectedType: string | null;
} {
  if (buffer.length < 4) {
    return { valid: false, detectedType: null };
  }

  if (buffer.subarray(0, 4).equals(MAGIC_BYTES.PDF)) {
    return { valid: true, detectedType: "application/pdf" };
  }
  if (buffer.subarray(0, 3).equals(MAGIC_BYTES.JPEG)) {
    return { valid: true, detectedType: "image/jpeg" };
  }
  if (buffer.subarray(0, 4).equals(MAGIC_BYTES.PNG)) {
    return { valid: true, detectedType: "image/png" };
  }
  if (buffer.subarray(0, 4).equals(MAGIC_BYTES.TIFF_LE)) {
    return { valid: true, detectedType: "image/tiff" };
  }
  if (buffer.subarray(0, 4).equals(MAGIC_BYTES.TIFF_BE)) {
    return { valid: true, detectedType: "image/tiff" };
  }

  return { valid: false, detectedType: null };
}

/**
 * Check if adding a file would exceed the workspace storage quota.
 * Throws a TRPCError with code PRECONDITION_FAILED if quota would be exceeded.
 */
export function checkStorageQuota(
  usedStorageBytes: bigint,
  fileSize: number,
  quotaGb: number,
): void {
  if (usedStorageBytes + BigInt(fileSize) > BigInt(quotaGb) * BigInt(1073741824)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "QUOTA_EXCEEDED",
    });
  }
}

/**
 * Check if a file with the given hash already exists in the workspace.
 */
export async function checkDuplicate(
  db: Database,
  fileHash: string,
  workspaceId: string,
): Promise<{ isDuplicate: boolean; existingDocumentId?: string }> {
  const existing = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.fileHash, fileHash),
        eq(documents.workspaceId, workspaceId),
        eq(documents.isDeleted, 0),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { isDuplicate: true, existingDocumentId: existing[0].id };
  }

  return { isDuplicate: false };
}
