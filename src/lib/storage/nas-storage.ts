import { mkdir, readFile, writeFile, unlink, stat, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";

/**
 * NAS-backed file storage service with workspace isolation,
 * content-addressed paths, retry logic, and health checks.
 */

function getNasPath(): string {
  return process.env.STORAGE_NAS_PATH || "./storage";
}

/** Exported for testing - gets the current NAS base path */
export function getBasePath(): string {
  return getNasPath();
}

// --- Retry Helper ---

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `NAS storage operation '${operationName}' failed after ${MAX_RETRIES} retries: ${lastError?.message}`,
  );
}

// --- Path Helpers ---

/**
 * Get the content-addressed storage path for a file.
 * Pattern: {NAS_PATH}/originals/{workspace_id}/{sha256[0:2]}/{sha256[2:4]}/{full_hash}.{ext}
 */
function getContentAddressedFilePath(
  hash: string,
  workspaceId: string,
  ext: string,
): string {
  const dir1 = hash.substring(0, 2);
  const dir2 = hash.substring(2, 4);
  return join(getNasPath(), "originals", workspaceId, dir1, dir2, `${hash}.${ext}`);
}

/**
 * Get the thumbnail path for a document.
 * Pattern: {NAS_PATH}/thumbnails/{workspace_id}/{document_id}.webp
 */
export function getThumbnailPath(workspaceId: string, docId: string): string {
  return join(getNasPath(), "thumbnails", workspaceId, `${docId}.webp`);
}

/**
 * Get the temp directory path for a job.
 * Pattern: {NAS_PATH}/temp/{job_id}/
 */
export function getTempPath(jobId: string): string {
  return join(getNasPath(), "temp", jobId);
}

// --- Core I/O Functions ---

/**
 * Store a file using content-addressed storage with workspace isolation.
 * Returns the full absolute path where the file was stored.
 */
export async function storeFile(
  buffer: Buffer,
  hash: string,
  workspaceId: string,
  ext: string,
): Promise<string> {
  const filePath = getContentAddressedFilePath(hash, workspaceId, ext);

  await withRetry(async () => {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, buffer);
  }, `storeFile(${hash})`);

  return filePath;
}

/**
 * Retrieve a file from NAS storage by its full path.
 */
export async function getFile(path: string): Promise<Buffer> {
  return withRetry(async () => {
    return await readFile(path);
  }, `getFile(${path})`);
}

/**
 * Delete a file from NAS storage.
 *
 * POLICY: Under the no-hard-delete policy this MUST NOT be used to remove
 * content-addressed originals (a hash is shared by many documents). It is
 * retained only for transient artifacts such as temp/working files and tiles.
 * To remove a document's content logically, flag its hash via
 * `markHashRemovedIfOrphaned` in `@/lib/storage/hash-removal` instead.
 */
export async function deleteFile(path: string): Promise<void> {
  return withRetry(async () => {
    await unlink(path);
  }, `deleteFile(${path})`);
}

/**
 * Check if a file exists at the given path.
 * Does NOT retry on ENOENT (file not found is a definitive answer).
 * Only retries on transient I/O errors.
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "ENOENT") {
      return false;
    }
    // Transient I/O error - retry
    return withRetry(async () => {
      try {
        await stat(path);
        return true;
      } catch (retryError: unknown) {
        if (retryError && typeof retryError === "object" && "code" in retryError && (retryError as { code: string }).code === "ENOENT") {
          return false;
        }
        throw retryError;
      }
    }, `fileExists(${path})`);
  }
}

/**
 * Store a thumbnail as webp in the workspace-isolated thumbnail directory.
 * Returns the full path where the thumbnail was stored.
 */
export async function storeThumbnail(
  buffer: Buffer,
  workspaceId: string,
  docId: string,
): Promise<string> {
  const thumbPath = getThumbnailPath(workspaceId, docId);

  await withRetry(async () => {
    const dir = dirname(thumbPath);
    await mkdir(dir, { recursive: true });
    await writeFile(thumbPath, buffer);
  }, `storeThumbnail(${docId})`);

  return thumbPath;
}

/**
 * Calculate total storage usage (in bytes) for a workspace.
 * Traverses the originals and thumbnails directories for the given workspace.
 */
export async function getStorageUsage(workspaceId: string): Promise<number> {
  let totalBytes = 0;

  const dirsToScan = [
    join(getNasPath(), "originals", workspaceId),
    join(getNasPath(), "thumbnails", workspaceId),
  ];

  for (const baseDir of dirsToScan) {
    try {
      totalBytes += await calculateDirSize(baseDir);
    } catch {
      // Directory may not exist yet - that is fine, contributes 0 bytes
    }
  }

  return totalBytes;
}

async function calculateDirSize(dirPath: string): Promise<number> {
  let size = 0;

  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      size += await calculateDirSize(fullPath);
    } else {
      const fileStat = await stat(fullPath);
      size += fileStat.size;
    }
  }

  return size;
}

// --- Health Check ---

/**
 * Perform a health check on the NAS storage by writing, reading, and deleting a test file.
 */
export async function healthCheck(): Promise<{ healthy: boolean; error?: string }> {
  const basePath = getNasPath();
  const testFilePath = join(basePath, ".health_check");
  const testContent = `health_check_${Date.now()}`;

  try {
    // Ensure base directory exists
    await mkdir(basePath, { recursive: true });

    // Write test file
    await writeFile(testFilePath, testContent);

    // Read and verify
    const readContent = await readFile(testFilePath, "utf-8");
    if (readContent !== testContent) {
      return { healthy: false, error: "Health check file content mismatch after write/read" };
    }

    // Delete test file
    await unlink(testFilePath);

    return { healthy: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { healthy: false, error: `NAS health check failed: ${message}` };
  }
}
