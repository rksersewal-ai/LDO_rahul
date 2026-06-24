import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { checkStorageQuota } from "../validation";

describe("checkStorageQuota", () => {
  const ONE_GB_IN_BYTES = 1073741824;

  it("does not throw when used storage plus file size is under quota", () => {
    expect(() => checkStorageQuota(0n, 1024, 1)).not.toThrow();

    // Closer to quota but still under
    const usedBytes = BigInt(ONE_GB_IN_BYTES) - 2000n;
    expect(() => checkStorageQuota(usedBytes, 1000, 1)).not.toThrow();
  });

  it("does not throw when used storage plus file size exactly equals quota", () => {
    const usedBytes = BigInt(ONE_GB_IN_BYTES) - 1024n;
    expect(() => checkStorageQuota(usedBytes, 1024, 1)).not.toThrow();
  });

  it("throws TRPCError with PRECONDITION_FAILED when quota is exceeded", () => {
    // Just 1 byte over
    const usedBytes = BigInt(ONE_GB_IN_BYTES);

    expect(() => checkStorageQuota(usedBytes, 1, 1)).toThrowError();

    try {
      checkStorageQuota(usedBytes, 1, 1);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("PRECONDITION_FAILED");
      expect((error as TRPCError).message).toBe("QUOTA_EXCEEDED");
    }
  });

  it("handles multi-gigabyte quotas", () => {
    const quotaGb = 5;
    const maxBytes = BigInt(quotaGb) * BigInt(ONE_GB_IN_BYTES);

    // Exactly at quota
    expect(() => checkStorageQuota(maxBytes - 500n, 500, quotaGb)).not.toThrow();

    // Exceeds quota
    expect(() => checkStorageQuota(maxBytes, 1, quotaGb)).toThrowError();
  });
});
