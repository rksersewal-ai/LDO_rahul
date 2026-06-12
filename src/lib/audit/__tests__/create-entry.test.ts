import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/db";
import { type AuditEntryInput, createAuditEntry } from "../create-entry";

function createMockDb(previousHash?: string) {
  const selectResult = previousHash ? [{ hashChain: previousHash }] : [];

  const insertValues = vi.fn().mockResolvedValue(undefined);
  const insertFn = vi.fn().mockReturnValue({ values: insertValues });

  const limitFn = vi.fn().mockResolvedValue(selectResult);
  const orderByFn = vi.fn().mockReturnValue({ limit: limitFn });
  const fromFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
  const selectFieldsFn = vi.fn().mockReturnValue({ from: fromFn });

  return {
    select: selectFieldsFn,
    insert: insertFn,
    _insertValues: insertValues,
    _selectFields: selectFieldsFn,
  };
}

describe("createAuditEntry", () => {
  const baseInput: AuditEntryInput = {
    userId: "user-123",
    userName: "Test User",
    action: "document.create",
    resourceType: "document",
    resourceId: "doc-456",
    resourceTitle: "Test Document",
    workspaceId: "ws-789",
    ipAddress: "192.168.1.1",
    userAgent: "TestAgent/1.0",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries previous hash from audit log via db.select", async () => {
    const mockDb = createMockDb("previous-hash-abc");

    await createAuditEntry(mockDb as unknown as Database, baseInput);

    // Verify db.select was called to get the previous hash
    expect(mockDb._selectFields).toHaveBeenCalled();
  });

  it("inserts audit entry with correct fields and computed hash chain", async () => {
    const mockDb = createMockDb("previous-hash-abc");

    await createAuditEntry(mockDb as unknown as Database, baseInput);

    // Verify db.insert was called
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "document.create",
        entityType: "document",
        entityId: "doc-456",
        userId: "user-123",
        userName: "Test User",
        previousHash: "previous-hash-abc",
        workspaceId: "ws-789",
        ipAddress: "192.168.1.1",
        userAgent: "TestAgent/1.0",
      }),
    );
  });

  it("uses GENESIS as previous hash when no previous entry exists", async () => {
    const mockDb = createMockDb(undefined);

    await createAuditEntry(mockDb as unknown as Database, baseInput);

    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        previousHash: "GENESIS",
      }),
    );
  });

  it("computes SHA-256 hash chain from timestamp, userId, action, and previousHash", async () => {
    const mockDb = createMockDb("prev-hash-xyz");

    await createAuditEntry(mockDb as unknown as Database, baseInput);

    // The hash chain should be a valid 64-char hex string (SHA-256)
    const insertedValues = mockDb._insertValues.mock.calls[0][0];
    expect(insertedValues.hashChain).toMatch(/^[a-f0-9]{64}$/);

    // Verify the hash is computed from expected inputs
    const timestamp = insertedValues.createdAt.toISOString();
    const expectedInput = `${timestamp}|user-123|document.create|prev-hash-xyz`;
    const expectedHash = createHash("sha256").update(expectedInput).digest("hex");
    expect(insertedValues.hashChain).toBe(expectedHash);
  });

  it("does not throw on DB insert failure", async () => {
    const insertValues = vi.fn().mockRejectedValue(new Error("DB connection lost"));
    const insertFn = vi.fn().mockReturnValue({ values: insertValues });

    const limitFn = vi.fn().mockResolvedValue([]);
    const orderByFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const selectFieldsFn = vi.fn().mockReturnValue({ from: fromFn });

    const mockDb = {
      select: selectFieldsFn,
      insert: insertFn,
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw
    await expect(
      createAuditEntry(mockDb as unknown as Database, baseInput),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[AuditLog] Failed to create audit entry:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("does not throw on DB select failure", async () => {
    const selectFieldsFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("Connection refused")),
        }),
      }),
    });

    const mockDb = {
      select: selectFieldsFn,
      insert: vi.fn(),
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      createAuditEntry(mockDb as unknown as Database, baseInput),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("sets details from resourceTitle when details not provided", async () => {
    const mockDb = createMockDb("hash-1");
    const input: AuditEntryInput = {
      ...baseInput,
      details: undefined,
      resourceTitle: "My Document",
    };

    await createAuditEntry(mockDb as unknown as Database, input);

    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        details: "Resource: My Document",
      }),
    );
  });

  it("uses provided details over resourceTitle", async () => {
    const mockDb = createMockDb("hash-1");
    const input: AuditEntryInput = {
      ...baseInput,
      details: "Custom detail message",
      resourceTitle: "My Document",
    };

    await createAuditEntry(mockDb as unknown as Database, input);

    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        details: "Custom detail message",
      }),
    );
  });
});
