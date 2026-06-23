import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { computeFullHash } from "../deduplication";

describe("computeFullHash", () => {
  it("computes the correct SHA-256 hash for a known string buffer", () => {
    const text = "hello world";
    const buffer = Buffer.from(text);
    const expectedHash = createHash("sha256").update(buffer).digest("hex");

    const result = computeFullHash(buffer);

    expect(result).toBe(expectedHash);
    // Specifically hardcode the known sha256 for "hello world"
    expect(result).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("computes the correct SHA-256 hash for an empty buffer", () => {
    const buffer = Buffer.from("");
    const expectedHash = createHash("sha256").update(buffer).digest("hex");

    const result = computeFullHash(buffer);

    expect(result).toBe(expectedHash);
    // Specifically hardcode the known sha256 for empty string
    expect(result).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("consistently computes the same hash for the same input", () => {
    const buffer = Buffer.from("consistent input");

    const hash1 = computeFullHash(buffer);
    const hash2 = computeFullHash(buffer);
    const hash3 = computeFullHash(buffer);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });
});
