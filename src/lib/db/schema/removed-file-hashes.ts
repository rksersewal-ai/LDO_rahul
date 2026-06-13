import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Registry of file content hashes that have been flagged as "removed".
 *
 * The system uses content-addressed storage: many documents can share a single
 * physical file identified by its SHA-256 hash. To honour the no-hard-delete
 * policy, physical files are NEVER unlinked from NAS. Instead, when the last
 * live (non-deleted) document referencing a hash is removed, the hash is
 * recorded here. The bytes remain on disk for recovery, audit, e-discovery and
 * legal-hold purposes; this table simply records the logical removal so the
 * application can hide / exclude the content while keeping it fully recoverable.
 *
 * A removed hash can be restored (restoredAt / restoredBy populated) if a new
 * document re-references the same content.
 */
export const removedFileHashes = pgTable(
  "removed_file_hashes",
  {
    id: text("id").primaryKey(),
    // The SHA-256 content hash that has been logically removed. Unique so the
    // registry holds at most one active record per hash.
    fileHash: varchar("file_hash", { length: 64 }).notNull().unique(),
    // Workspace the last referencing document belonged to (for scoping / audit).
    workspaceId: text("workspace_id"),
    // The document whose removal triggered the hash flag (for traceability).
    lastDocumentId: text("last_document_id"),
    removedBy: text("removed_by"),
    removedAt: timestamp("removed_at", { withTimezone: true }).notNull().defaultNow(),
    reason: text("reason"),
    // Populated when the hash is re-referenced by a new document and restored.
    restoredAt: timestamp("restored_at", { withTimezone: true }),
    restoredBy: text("restored_by"),
  },
  (table) => [
    index("idx_removed_file_hashes_file_hash").on(table.fileHash),
    index("idx_removed_file_hashes_workspace_id").on(table.workspaceId),
  ],
);
