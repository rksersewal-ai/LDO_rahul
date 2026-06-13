import { createHash } from "node:crypto";

/**
 * Compute SHA-256 hash of a complete file buffer.
 */
export function computeFullHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * 3-point 64KB hash calculation for fast deduplication.
 * Reads 64KB from:
 * - Start: offset 0
 * - Middle: (fileSize / 2) - 32KB
 * - End: fileSize - 64KB
 * Then hashes all three chunks together.
 */
export function computeThreePointHash(buffer: Buffer): string {
  const CHUNK_SIZE = 64 * 1024; // 64KB

  if (buffer.length < CHUNK_SIZE * 3) {
    // File is too small for 3-point hash, just hash the whole thing
    return computeFullHash(buffer);
  }

  const startChunk = buffer.subarray(0, CHUNK_SIZE);
  const middleOffset = Math.floor(buffer.length / 2) - Math.floor(CHUNK_SIZE / 2);
  const middleChunk = buffer.subarray(middleOffset, middleOffset + CHUNK_SIZE);
  const endChunk = buffer.subarray(buffer.length - CHUNK_SIZE);

  const hash = createHash("sha256");
  hash.update(startChunk);
  hash.update(middleChunk);
  hash.update(endChunk);

  return hash.digest("hex");
}

/**
 * Content-addressed storage path from a hash.
 * Format: originals/sha256/<first2>/<next2>/<full-hash>
 */
export function getContentAddressedPath(hash: string): string {
  const dir1 = hash.substring(0, 2);
  const dir2 = hash.substring(2, 4);
  return `originals/sha256/${dir1}/${dir2}/${hash}`;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  fullHash: string;
  threePointHash: string;
  contentPath: string;
  existingDocumentId?: string;
}

/**
 * Check for duplicates using metadata + 3-point 64KB hash + full SHA-256.
 * Returns deduplication result with hash info and whether a duplicate exists.
 */
export function checkDuplicate(
  buffer: Buffer,
  existingHashes: Array<{ id: string; fileHash: string | null }>,
): DeduplicationResult {
  const fullHash = computeFullHash(buffer);
  const threePointHash = computeThreePointHash(buffer);
  const contentPath = getContentAddressedPath(fullHash);

  // Check if any existing document has the same hash
  const existingDoc = existingHashes.find((doc) => doc.fileHash === fullHash);

  return {
    isDuplicate: !!existingDoc,
    fullHash,
    threePointHash,
    contentPath,
    existingDocumentId: existingDoc?.id,
  };
}
