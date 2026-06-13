import { eq } from "drizzle-orm";
import { bomEntries } from "@/lib/db/schema";

const MAX_ITERATIONS = 100;

/**
 * Detect whether moving/adding an entry under a proposed parent would create
 * a circular reference in the BOM tree.
 *
 * Algorithm:
 * 1. If proposedParentId is null, no cycle is possible (root entries).
 * 2. If proposedParentId === entryId, it is a direct self-reference (cycle).
 * 3. Walk up the ancestor chain from proposedParentId. If at any point an
 *    ancestor's id equals entryId, a cycle would be created.
 * 4. A safety limit of 100 iterations prevents infinite loops on corrupted data.
 *
 * @returns true if a cycle would be created, false otherwise.
 */
export async function detectCycle(
  bomProductId: string,
  proposedParentId: string | null,
  entryId: string,
  dbInstance: any,
): Promise<boolean> {
  // Root entries cannot create cycles
  if (proposedParentId === null) {
    return false;
  }

  // Direct self-reference
  if (proposedParentId === entryId) {
    return true;
  }

  // Walk up the parent chain from proposedParentId
  let currentId: string | null = proposedParentId;
  let iterations = 0;

  while (currentId !== null && iterations < MAX_ITERATIONS) {
    iterations++;

    const [row] = await dbInstance
      .select({ id: bomEntries.id, parentId: bomEntries.parentId })
      .from(bomEntries)
      .where(eq(bomEntries.id, currentId)) as Array<{ id: string; parentId: string | null }>;

    if (!row) {
      // Parent not found - chain is broken, no cycle
      return false;
    }

    // Move to the next ancestor
    currentId = row.parentId;

    // If the ancestor is the entry we are trying to move, cycle detected
    if (currentId === entryId) {
      return true;
    }
  }

  // Safety limit reached - treat as potential cycle to be safe
  if (iterations >= MAX_ITERATIONS) {
    return true;
  }

  return false;
}
