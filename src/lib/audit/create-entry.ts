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
  await createAuditEntries(db, [input]);
}

/**
 * Creates multiple audit log entries with a SHA-256 hash chain for tamper detection.
 * Never throws - logs to console.error on failure.
 * Accepts either the db instance or a transaction (tx) from db.transaction().
 */
export async function createAuditEntries(
  db: DbOrTransaction,
  inputs: AuditEntryInput[],
): Promise<void> {
  if (inputs.length === 0) return;

  try {
    // Get the previous entry's hash for chain continuity
    const [previousEntry] = await db
      .select({ hashChain: auditLog.hashChain })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    let currentPreviousHash = previousEntry?.hashChain ?? "GENESIS";

    const entriesToInsert = inputs.map((input) => {
      const id = randomUUID();
      const now = new Date();

      // Compute SHA-256 hash: timestamp + userId + action + previousHash
      const hashInput = `${now.toISOString()}|${input.userId}|${input.action}|${currentPreviousHash}`;
      const hashChain = createHash("sha256").update(hashInput).digest("hex");

      const entry = {
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
        previousHash: currentPreviousHash,
        createdAt: now,
      };

      currentPreviousHash = hashChain;
      return entry;
    });

    await db.insert(auditLog).values(entriesToInsert);
  } catch (error) {
    logError(
      "[AuditLog] Failed to create audit entries",
      { action: inputs[0]?.action, resourceType: inputs[0]?.resourceType, count: inputs.length },
      error,
    );
  }
}
