import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getContentAddressedPath } from "./deduplication";

const STORAGE_ROOT = process.env.STORAGE_PATH || "./storage";

/**
 * Store a file using content-addressed storage.
 * Path: <STORAGE_ROOT>/originals/sha256/<first2>/<next2>/<full-hash>
 */
export function storeFile(buffer: Buffer, hash: string): string {
  const relativePath = getContentAddressedPath(hash);
  const absolutePath = join(STORAGE_ROOT, relativePath);
  const dir = dirname(absolutePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Only write if file doesn't already exist (content-addressed = idempotent)
  if (!existsSync(absolutePath)) {
    writeFileSync(absolutePath, buffer);
  }

  return relativePath;
}

/**
 * Get the absolute filesystem path for a content hash.
 */
export function getFilePath(hash: string): string {
  const relativePath = getContentAddressedPath(hash);
  return join(STORAGE_ROOT, relativePath);
}

/**
 * Get the thumbnail path for a document.
 */
export function getThumbnailPath(documentId: string): string {
  return join(STORAGE_ROOT, "thumbnails", `${documentId}.webp`);
}

/**
 * Get the tiles directory path for a document (deep zoom).
 */
export function getTilesPath(documentId: string): string {
  return join(STORAGE_ROOT, "tiles", documentId);
}

/**
 * Get the OCR output path for a document.
 */
export function getOcrOutputPath(documentId: string): string {
  return join(STORAGE_ROOT, "ocr", `${documentId}.json`);
}

/**
 * Delete a stored file by hash.
 * Only removes if no other documents reference the same hash.
 */
export function deleteFile(hash: string): boolean {
  const absolutePath = getFilePath(hash);
  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
    return true;
  }
  return false;
}

/**
 * Check if a file exists in storage by hash.
 */
export function fileExists(hash: string): boolean {
  return existsSync(getFilePath(hash));
}
