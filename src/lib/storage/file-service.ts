import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { getContentAddressedPath } from "./deduplication";

// Use the same env-var name as nas-storage.ts and .env.example (NAS_STORAGE_PATH)
// for consistency across the codebase.
const STORAGE_ROOT = process.env.NAS_STORAGE_PATH || "./storage";

/**
 * Store a file using content-addressed storage.
 * Path: <STORAGE_ROOT>/originals/sha256/<first2>/<next2>/<full-hash>
 */
export async function storeFile(buffer: Buffer, hash: string): Promise<string> {
  const relativePath = getContentAddressedPath(hash);
  const absolutePath = join(STORAGE_ROOT, relativePath.replace("/storage/", ""));
  const dir = dirname(absolutePath);

  await mkdir(dir, { recursive: true });

  // Only write if file doesn't already exist (content-addressed = idempotent)
  const exists = await fileExists(hash);
  if (!exists) {
    await writeFile(absolutePath, buffer);
  }

  return relativePath;
}

/**
 * Get the absolute filesystem path for a content hash.
 */
export function getFilePath(hash: string): string {
  const relativePath = getContentAddressedPath(hash);
  return join(STORAGE_ROOT, relativePath.replace("/storage/", ""));
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
 * Read a stored file by hash.
 */
export async function readStoredFile(hash: string): Promise<Buffer> {
  return readFile(getFilePath(hash));
}

/**
 * Check if a file exists in storage by hash.
 */
export async function fileExists(hash: string): Promise<boolean> {
  try {
    await access(getFilePath(hash), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// NOTE: There is intentionally no hard-delete helper here.
//
// Storage is content-addressed, so a single physical file is shared by every
// document with the same hash. Physically unlinking it would corrupt other
// documents and violate the system's no-hard-delete policy. To remove a file
// logically, flag its hash via `markHashRemovedIfOrphaned` in
// `@/lib/storage/hash-removal` — the bytes always remain on disk for recovery,
// audit, and legal holds.
