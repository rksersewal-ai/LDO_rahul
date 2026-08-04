import { createHash, randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { logError } from "@/lib/logging/structured-logger";

export interface AuditEntryInput {
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** A database-like object that supports select/insert (works with both db and tx). */
type DbOrTransaction = Pick<Database, "select" | "insert">;

/**
 * Creates an audit log entry with a SHA-256 hash chain for tamper detection.
 * Never throws - logs to console.error on failure.
 * Accepts either the db instance or a transaction (tx) from db.transaction().
 */
export async function createAuditEntry(db: DbOrTransaction, input: AuditEntryInput): Promise<void> {
  try {
    const id = randomUUID();
    const now = new Date();

    // Get the previous entry's hash for chain continuity
    const [previousEntry] = await db
      .select({ hashChain: auditLog.hashChain })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    const previousHash = previousEntry?.hashChain ?? "GENESIS";

    // Compute SHA-256 hash: timestamp + userId + action + previousHash
    const hashInput = `${now.toISOString()}|${input.userId}|${input.action}|${previousHash}`;
    const hashChain = createHash("sha256").update(hashInput).digest("hex");

    await db.insert(auditLog).values({
      id,
      action: input.action,
      entityType: input.resourceType,
      entityId: input.resourceId,
      userId: input.userId,
      userName: input.userName,
      details: input.details ?? (input.resourceTitle ? `Resource: ${input.resourceTitle}` : null),
      previousState: input.oldValue ?? null,
      newState: input.newValue ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      workspaceId: input.workspaceId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      hashChain,
      previousHash,
      createdAt: now,
    });
  } catch (error) {
    logError(
      "[AuditLog] Failed to create audit entry",
      { action: input.action, resourceType: input.resourceType },
      error,
    );
  }
}

/**
 * Creates multiple audit log entries efficiently in a single batch, maintaining the SHA-256 hash chain.
 * Never throws - logs to console.error on failure.
 * Accepts either the db instance or a transaction (tx) from db.transaction().
 */
export async function createAuditEntries(
  db: DbOrTransaction,
  inputs: AuditEntryInput[],
): Promise<void> {
  if (inputs.length === 0) return;

  try {
    const now = new Date();

    // Get the previous entry's hash for chain continuity
    const [previousEntry] = await db
      .select({ hashChain: auditLog.hashChain })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    let currentHash = previousEntry?.hashChain ?? "GENESIS";

    const values = inputs.map((input) => {
      const id = randomUUID();
      // Compute SHA-256 hash: timestamp + userId + action + currentHash
      const hashInput = `${now.toISOString()}|${input.userId}|${input.action}|${currentHash}`;
      const hashChain = createHash("sha256").update(hashInput).digest("hex");

      const previousHashForEntry = currentHash;
      currentHash = hashChain; // Update currentHash for the next entry

      return {
        id,
        action: input.action,
        entityType: input.resourceType,
        entityId: input.resourceId,
        userId: input.userId,
        userName: input.userName,
        details: input.details ?? (input.resourceTitle ? `Resource: ${input.resourceTitle}` : null),
        previousState: input.oldValue ?? null,
        newState: input.newValue ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        workspaceId: input.workspaceId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        hashChain,
        previousHash: previousHashForEntry,
        createdAt: now,
      };
    });

    await db.insert(auditLog).values(values);
  } catch (error) {
    logError("[AuditLog] Failed to create audit entries", { batchSize: inputs.length }, error);
  }
}
