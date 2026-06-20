import { describe, expect, it, vi } from "vitest";
import { detectCycle } from "../cycle-detection";

/**
 * Creates a mock db instance that simulates the Drizzle query builder pattern:
 * db.select(...).from(...).where(...)
 *
 * The entries map defines the tree structure: key = entry id, value = parentId (or null for root).
 */
function createMockDb(entries: Record<string, string | null>) {
  return {
    select: () => ({
      from: () => ({
        where: (condition: any) => {
          // Extract the ID being queried from the condition
          // In our implementation, we pass eq(bomEntries.id, currentId)
          // The mock needs to find the entry by ID from the condition value
          const id = extractIdFromCondition(condition);
          if (id && entries[id] !== undefined) {
            return [{ id, parentId: entries[id] }];
          }
          return [];
        },
      }),
    }),
  };
}

/**
 * Extract the ID value from a drizzle eq() condition.
 * Drizzle's eq() returns an object with the column and value.
 * We inspect its structure to get the queried ID.
 */
function extractIdFromCondition(condition: any): string | null {
  // Drizzle eq() returns a BinaryOperator with left (column) and right (value)
  if (condition && typeof condition === "object") {
    // Try common drizzle condition shapes
    if ("value" in condition) return condition.value;
    if ("right" in condition) return condition.right;
  }
  return null;
}

// Since the actual drizzle eq() output shape can vary, let us mock at a higher level
// by intercepting the chain with a custom approach.
function createTreeDb(entries: Record<string, string | null>) {
  let queriedId: string | null = null;

  const whereHandler = () => {
    if (queriedId && entries[queriedId] !== undefined) {
      return [{ id: queriedId, parentId: entries[queriedId] }];
    }
    return [];
  };

  const fromHandler = () => ({
    where: (condition: any) => {
      // The eq function from drizzle-orm produces an SQL chunk.
      // For testing we use a proxy approach to capture the ID being looked up.
      return whereHandler();
    },
  });

  const selectHandler = () => ({
    from: fromHandler,
  });

  // Create a Proxy-based mock that captures the ID from eq() calls
  const handler = {
    select: selectHandler,
    _setQueriedId: (id: string) => {
      queriedId = id;
    },
  };

  return handler;
}

// Better approach: mock the entire module behavior by creating a mock that
// intercepts the actual call pattern used in cycle-detection.ts
function buildMockDb(tree: Record<string, string | null>) {
  // tree: { entryId: parentId | null }
  // When detectCycle queries for an entry by ID, return {id, parentId}
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation((condition: any) => {
      // We need to figure out which ID was queried
      // The condition is eq(bomEntries.id, currentId) - drizzle returns a SQL object
      // Since we can't easily parse it, we'll use a different approach
      return [];
    }),
  };

  return mockDb;
}

// The cleanest approach: since detectCycle uses `dbInstance.select(...).from(...).where(...)`,
// we can mock the full chain and track what ID was passed to eq() by mocking the eq import.
// But since detectCycle imports eq from drizzle-orm, we need to mock at the db level.
//
// Best solution: create a mock db that returns the right data based on sequential calls.

function createSequentialMockDb(responses: Array<{ id: string; parentId: string | null } | null>) {
  let callIndex = 0;

  const mockDb = {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => {
          const response = responses[callIndex];
          callIndex++;
          return response ? [response] : [];
        }),
      })),
    })),
  };

  return mockDb;
}

describe("detectCycle", () => {
  describe("null parentId", () => {
    it("returns false when proposedParentId is null (root entry)", async () => {
      // No DB queries needed since null short-circuits
      const mockDb = createSequentialMockDb([]);
      const result = await detectCycle("product-1", null, "entry-1", mockDb);
      expect(result).toBe(false);
    });
  });

  describe("direct self-reference", () => {
    it("returns true when proposedParentId equals entryId", async () => {
      const mockDb = createSequentialMockDb([]);
      const result = await detectCycle("product-1", "entry-1", "entry-1", mockDb);
      expect(result).toBe(true);
    });
  });

  describe("indirect cycle detection", () => {
    it("returns true when entry is ancestor of proposed parent", async () => {
      // Tree: A -> B -> C (A is parent of B, B is parent of C)
      // Moving A under C would create cycle: C -> A -> B -> C
      // detectCycle("product", "C", "A", db)
      // Walk: query C -> parentId=B, query B -> parentId=A -> found entryId!
      const mockDb = createSequentialMockDb([
        { id: "C", parentId: "B" }, // first query: lookup C, get parentId=B
        { id: "B", parentId: "A" }, // second query: lookup B, get parentId=A -> matches entryId
      ]);

      const result = await detectCycle("product-1", "C", "A", mockDb);
      expect(result).toBe(true);
    });

    it("returns true for deep indirect cycle (grandparent loop)", async () => {
      // Tree: A -> B -> C -> D
      // Moving A under D: walk up from D -> C -> B -> A (cycle!)
      const mockDb = createSequentialMockDb([
        { id: "D", parentId: "C" }, // lookup D
        { id: "C", parentId: "B" }, // lookup C
        { id: "B", parentId: "A" }, // lookup B -> parentId=A matches entryId
      ]);

      const result = await detectCycle("product-1", "D", "A", mockDb);
      expect(result).toBe(true);
    });
  });

  describe("clean tree (no cycle)", () => {
    it("returns false when parent chain does not contain entryId", async () => {
      // Tree: X -> Y -> Z (root)
      // Moving entry W under X: walk up from X -> Y -> Z -> null (no cycle)
      const mockDb = createSequentialMockDb([
        { id: "X", parentId: "Y" }, // lookup X
        { id: "Y", parentId: "Z" }, // lookup Y
        { id: "Z", parentId: null }, // lookup Z -> parentId=null, stop
      ]);

      const result = await detectCycle("product-1", "X", "W", mockDb);
      expect(result).toBe(false);
    });

    it("returns false when parent chain reaches a broken link", async () => {
      // Parent chain has a reference to a non-existent entry
      const mockDb = createSequentialMockDb([
        { id: "X", parentId: "MISSING" }, // lookup X -> parent is MISSING
        null, // lookup MISSING -> not found
      ]);

      const result = await detectCycle("product-1", "X", "W", mockDb);
      expect(result).toBe(false);
    });
  });

  describe("safety limit", () => {
    it("returns true (treats as cycle) when iteration limit is exceeded", async () => {
      // Create a long chain of 101 entries that never resolves
      // This simulates corrupted data with a loop that our simple check might not catch
      const responses: Array<{ id: string; parentId: string | null }> = [];
      for (let i = 0; i < 101; i++) {
        responses.push({ id: `entry-${i}`, parentId: `entry-${i + 1}` });
      }

      const mockDb = createSequentialMockDb(responses);
      const result = await detectCycle("product-1", "entry-0", "never-found", mockDb);
      expect(result).toBe(true);
    });
  });
});
