import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/server/trpc";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { tagsRouter } from "../tags";

// Mock audit log creation to simplify DB interaction testing
vi.mock("@/lib/audit/create-entry", () => ({
  createAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

// Mock db
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

describe("tagsRouter.tagDocuments", () => {
  const mockCtx = {
    session: {
      user: {
        id: "user-1",
        name: "Test User",
        role: "engineer",
        workspaceId: "ws-1",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks tag count limits and allows tagging when counts are under 20", async () => {
    const documentIds = Array.from({ length: 50 }, (_, i) => `doc-${i + 1}`);

    let selectCalls = 0;

    mockSelect.mockImplementation(() => {
      selectCalls++;
      const currentCall = selectCalls;

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (currentCall === 1) {
              // Tag lookup result
              return Promise.resolve([{ id: "tag-1", name: "Urgent" }]);
            }
            // Document tag counts batch query
            return {
              groupBy: vi.fn().mockResolvedValue([
                { documentId: "doc-1", cnt: 5 },
                { documentId: "doc-2", cnt: 19 },
              ]),
            };
          }),
        }),
      };
    });

    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const caller = tagsRouter.createCaller(mockCtx as unknown as Context);
    const result = await caller.tagDocuments({
      tagId: "tag-1",
      documentIds,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(50);
  });

  it("throws TRPCError if any document already has 20 or more tags", async () => {
    const documentIds = ["doc-1", "doc-2", "doc-3"];

    let selectCalls = 0;

    mockSelect.mockImplementation(() => {
      selectCalls++;
      const currentCall = selectCalls;

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (currentCall === 1) {
              return Promise.resolve([{ id: "tag-1", name: "Urgent" }]);
            }
            return {
              groupBy: vi.fn().mockResolvedValue([
                { documentId: "doc-1", cnt: 5 },
                { documentId: "doc-2", cnt: 20 },
              ]),
            };
          }),
        }),
      };
    });

    const caller = tagsRouter.createCaller(mockCtx as unknown as Context);

    await expect(
      caller.tagDocuments({
        tagId: "tag-1",
        documentIds,
      }),
    ).rejects.toThrow("Document doc-2 already has the maximum of 20 tags");
  });
});
