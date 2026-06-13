import { describe, expect, it } from "vitest";
import { checkDuplicate, computeFullHash, computeThreePointHash, getContentAddressedPath } from "../deduplication";

describe("checkDuplicate", () => {
  it("returns isDuplicate: false when no existing hashes are provided", () => {
    const buffer = Buffer.from("Hello world, this is a test buffer for deduplication.");
    const existingHashes: Array<{ id: string; fileHash: string | null }> = [];

    const result = checkDuplicate(buffer, existingHashes);

    expect(result.isDuplicate).toBe(false);
    expect(result.fullHash).toBe(computeFullHash(buffer));
    expect(result.threePointHash).toBe(computeThreePointHash(buffer));
    expect(result.contentPath).toBe(getContentAddressedPath(result.fullHash));
    expect(result.existingDocumentId).toBeUndefined();
  });

  it("returns isDuplicate: true and existingDocumentId when an existing hash matches", () => {
    const buffer = Buffer.from("Hello world, this is another test buffer.");
    const fullHash = computeFullHash(buffer);

    const existingHashes = [
      { id: "doc-1", fileHash: "some-other-hash" },
      { id: "doc-2", fileHash: fullHash },
      { id: "doc-3", fileHash: "yet-another-hash" },
    ];

    const result = checkDuplicate(buffer, existingHashes);

    expect(result.isDuplicate).toBe(true);
    expect(result.fullHash).toBe(fullHash);
    expect(result.existingDocumentId).toBe("doc-2");
  });

  it("returns isDuplicate: false when existing hashes do not match the full hash", () => {
    const buffer = Buffer.from("Unique content here.");
    const fullHash = computeFullHash(buffer);

    const existingHashes = [
      { id: "doc-1", fileHash: "hash-1" },
      { id: "doc-2", fileHash: "hash-2" },
    ];

    const result = checkDuplicate(buffer, existingHashes);

    expect(result.isDuplicate).toBe(false);
    expect(result.fullHash).toBe(fullHash);
    expect(result.existingDocumentId).toBeUndefined();
  });

  it("computes hashes correctly for large buffers (3-point hash fallback)", () => {
    // Generate a 200KB buffer to test the 3-point hash calculation
    const buffer = Buffer.alloc(200 * 1024, 'a');

    const result = checkDuplicate(buffer, []);

    expect(result.isDuplicate).toBe(false);
    expect(result.fullHash).toBe(computeFullHash(buffer));
    expect(result.threePointHash).toBe(computeThreePointHash(buffer));

    // Test that the 3-point hash is actually different from full hash
    expect(result.threePointHash).not.toBe(result.fullHash);
  });
});
