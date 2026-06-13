import { createHash } from "node:crypto";

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  hashChain: string | null;
  previousHash: string | null;
  createdAt: Date;
}

export interface VerifyChainResult {
  valid: boolean;
  brokenAt?: number;
  details?: string;
}

/**
 * Verifies the integrity of an audit log hash chain.
 * Entries must be ordered by createdAt ASC.
 *
 * For each entry, recomputes SHA-256 of (timestamp|userId|action|previousHash)
 * and compares it to the stored hashChain value.
 *
 * @param entries - Audit log entries ordered by createdAt ASC
 * @returns Verification result indicating whether the chain is valid
 */
export function verifyAuditChain(entries: AuditLogEntry[]): VerifyChainResult {
  if (entries.length === 0) {
    return { valid: true, details: "No entries to verify" };
  }

  let expectedPreviousHash = "GENESIS";

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Verify previousHash matches what we expect
    if (entry.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAt: i,
        details: `Entry ${i} (id: ${entry.id}): previousHash mismatch. Expected "${expectedPreviousHash}", got "${entry.previousHash}"`,
      };
    }

    // Recompute the hash for this entry
    const timestamp = entry.createdAt instanceof Date
      ? entry.createdAt.toISOString()
      : new Date(entry.createdAt).toISOString();

    const hashInput = `${timestamp}|${entry.userId}|${entry.action}|${expectedPreviousHash}`;
    const expectedHash = createHash("sha256").update(hashInput).digest("hex");

    if (entry.hashChain !== expectedHash) {
      return {
        valid: false,
        brokenAt: i,
        details: `Entry ${i} (id: ${entry.id}): hashChain mismatch. Expected "${expectedHash}", got "${entry.hashChain}"`,
      };
    }

    // This entry's hash becomes the expected previousHash for the next entry
    expectedPreviousHash = entry.hashChain;
  }

  return { valid: true, details: `Verified ${entries.length} entries successfully` };
}
