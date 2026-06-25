import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));

import { invalidateCache } from "@/lib/cache/query-cache";
import { db } from "@/lib/db";
import { getEffectiveSetting } from "../get-effective-setting";

function mockSelectChain(returnValue: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(returnValue);
  return chain;
}

describe("getEffectiveSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getEffectiveSetting is cached (L1 + Redis); clear it so each test case
    // resolves against its own fresh db mocks rather than a cached value.
    invalidateCache();
  });

  it("returns user-scope setting when it exists", async () => {
    const chain = mockSelectChain([{ value: "user-value" }]);
    (db.select as Mock).mockReturnValueOnce(chain);

    const result = await getEffectiveSetting("someKey", {
      userId: "u1",
      workspaceId: "w1",
    });

    expect(result).toBe("user-value");
  });

  it("falls back to workspace when user scope not found", async () => {
    const userChain = mockSelectChain([]);
    const wsChain = mockSelectChain([{ value: "workspace-value" }]);

    (db.select as Mock).mockReturnValueOnce(userChain).mockReturnValueOnce(wsChain);

    const result = await getEffectiveSetting("someKey", {
      userId: "u1",
      workspaceId: "w1",
    });

    expect(result).toBe("workspace-value");
  });

  it("falls back to system when workspace not found", async () => {
    const userChain = mockSelectChain([]);
    const wsChain = mockSelectChain([]);
    const orgChain = mockSelectChain([]);
    const systemChain = mockSelectChain([{ value: "system-db-value" }]);

    (db.select as Mock)
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(wsChain)
      .mockReturnValueOnce(orgChain)
      .mockReturnValueOnce(systemChain);

    const result = await getEffectiveSetting("someKey", {
      userId: "u1",
      workspaceId: "w1",
      orgId: "org1",
    });

    expect(result).toBe("system-db-value");
  });

  it("falls back to SYSTEM_DEFAULTS when nothing in DB", async () => {
    const userChain = mockSelectChain([]);
    const wsChain = mockSelectChain([]);
    const systemChain = mockSelectChain([]);

    (db.select as Mock)
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(wsChain)
      .mockReturnValueOnce(systemChain);

    const result = await getEffectiveSetting("security.login.maxFailedAttempts", {
      userId: "u1",
      workspaceId: "w1",
    });

    expect(result).toBe("5");
  });

  it("returns null for unknown key with no DB entries", async () => {
    const userChain = mockSelectChain([]);
    const wsChain = mockSelectChain([]);
    const systemChain = mockSelectChain([]);

    (db.select as Mock)
      .mockReturnValueOnce(userChain)
      .mockReturnValueOnce(wsChain)
      .mockReturnValueOnce(systemChain);

    const result = await getEffectiveSetting("unknown.key.xyz", {
      userId: "u1",
      workspaceId: "w1",
    });

    expect(result).toBeNull();
  });
});
