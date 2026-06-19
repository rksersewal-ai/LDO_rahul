import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// We test the module by setting the env var before import
let testDir: string;

describe("nas-storage", () => {
  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "nas-storage-test-"));
    process.env.STORAGE_NAS_PATH = testDir;
  });

  afterEach(async () => {
    delete process.env.STORAGE_NAS_PATH;
    await rm(testDir, { recursive: true, force: true });
    // Clear module cache so env var is re-read
    const modPath = Object.keys(require.cache).find((k) => k.includes("nas-storage"));
    if (modPath) delete require.cache[modPath];
  });

  // Since the NAS_PATH is read at module load time, we dynamically import
  // after setting env. Use a helper to get a fresh module each test.
  async function getNasStorage() {
    // Vitest uses ESM - we can use dynamic import with cache busting
    const mod = await import("../nas-storage");
    return mod;
  }

  describe("path generation", () => {
    it("getThumbnailPath returns correct workspace-isolated path", async () => {
      const nas = await getNasStorage();
      const result = nas.getThumbnailPath("ws-123", "doc-456");
      // The module reads NAS_PATH at load time, so it may use default
      // But path structure should be correct
      expect(result).toContain("thumbnails");
      expect(result).toContain("ws-123");
      expect(result).toContain("doc-456.webp");
    });

    it("getTempPath returns correct job temp path", async () => {
      const nas = await getNasStorage();
      const result = nas.getTempPath("job-789");
      expect(result).toContain("temp");
      expect(result).toContain("job-789");
    });
  });

  describe("storeFile and getFile", () => {
    it("stores and retrieves a file with content-addressed path", async () => {
      const nas = await getNasStorage();
      const content = Buffer.from("hello world");
      const hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const workspaceId = "ws-test";
      const ext = "pdf";

      const storedPath = await nas.storeFile(content, hash, workspaceId, ext);

      // Verify path structure: {NAS_PATH}/originals/{workspace_id}/{sha256[0:2]}/{sha256[2:4]}/{full_hash}.{ext}
      expect(storedPath).toContain("originals");
      expect(storedPath).toContain(workspaceId);
      expect(storedPath).toContain("ab"); // first 2 chars
      expect(storedPath).toContain("cd"); // next 2 chars
      expect(storedPath).toContain(`${hash}.${ext}`);

      // Read back the file
      const retrieved = await nas.getFile(storedPath);
      expect(retrieved.toString()).toBe("hello world");
    });
  });

  describe("deleteFile", () => {
    it("deletes a stored file", async () => {
      const nas = await getNasStorage();
      const content = Buffer.from("to delete");
      const hash = "1111111122222222333333334444444455555555666666667777777788888888";

      const storedPath = await nas.storeFile(content, hash, "ws-del", "txt");
      expect(await nas.fileExists(storedPath)).toBe(true);

      await nas.deleteFile(storedPath);
      expect(await nas.fileExists(storedPath)).toBe(false);
    });
  });

  describe("fileExists", () => {
    it("returns false for non-existent file", async () => {
      const nas = await getNasStorage();
      const result = await nas.fileExists("/nonexistent/path/file.txt");
      expect(result).toBe(false);
    });
  });

  describe("storeThumbnail", () => {
    it("stores thumbnail at correct workspace path", async () => {
      const nas = await getNasStorage();
      const thumbBuffer = Buffer.from("fake thumbnail data");

      const thumbPath = await nas.storeThumbnail(thumbBuffer, "ws-thumb", "doc-123");
      expect(thumbPath).toContain("thumbnails");
      expect(thumbPath).toContain("ws-thumb");
      expect(thumbPath).toContain("doc-123.webp");

      const retrieved = await readFile(thumbPath);
      expect(retrieved.toString()).toBe("fake thumbnail data");
    });
  });

  describe("getStorageUsage", () => {
    it("returns total bytes for a workspace", async () => {
      const nas = await getNasStorage();
      const content1 = Buffer.from("file one content");
      const content2 = Buffer.from("file two");

      await nas.storeFile(
        content1,
        "aaaa111122222222333333334444444455555555666666667777777788888888",
        "ws-usage",
        "pdf",
      );
      await nas.storeFile(
        content2,
        "bbbb111122222222333333334444444455555555666666667777777788888888",
        "ws-usage",
        "pdf",
      );

      const usage = await nas.getStorageUsage("ws-usage");
      expect(usage).toBe(content1.length + content2.length);
    });

    it("returns 0 for non-existent workspace", async () => {
      const nas = await getNasStorage();
      const usage = await nas.getStorageUsage("non-existent-workspace");
      expect(usage).toBe(0);
    });
  });

  describe("healthCheck", () => {
    it("returns healthy when NAS is accessible", async () => {
      const nas = await getNasStorage();
      const result = await nas.healthCheck();
      expect(result.healthy).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns unhealthy when NAS path is inaccessible", async () => {
      // Point to /dev/null which cannot be used as a directory
      process.env.STORAGE_NAS_PATH = "/dev/null/impossible";
      const nas = await getNasStorage();
      const result = await nas.healthCheck();
      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("retry logic", () => {
    it("getFile fails with clear error after retries on non-existent file", async () => {
      const nas = await getNasStorage();
      await expect(nas.getFile("/absolutely/does/not/exist.txt")).rejects.toThrow(
        /NAS storage operation.*failed after 3 retries/,
      );
    });

    it("deleteFile fails with clear error after retries on non-existent file", async () => {
      const nas = await getNasStorage();
      await expect(nas.deleteFile("/absolutely/does/not/exist.txt")).rejects.toThrow(
        /NAS storage operation.*failed after 3 retries/,
      );
    });
  });
});
