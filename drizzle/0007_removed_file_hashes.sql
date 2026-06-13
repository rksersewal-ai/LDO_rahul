-- No-hard-delete policy: removed file hash registry
-- Covers: removed_file_hashes table
--
-- Content-addressed storage means several documents can share one physical file
-- (keyed by SHA-256). Physical files are NEVER deleted from NAS. When the last
-- live document referencing a hash is removed, the hash is recorded here as
-- logically removed. The underlying bytes remain on disk for recovery, audit,
-- e-discovery, and legal holds.

CREATE TABLE IF NOT EXISTS "removed_file_hashes" (
  "id" text PRIMARY KEY NOT NULL,
  "file_hash" varchar(64) NOT NULL,
  "workspace_id" text,
  "last_document_id" text,
  "removed_by" text,
  "removed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "reason" text,
  "restored_at" timestamp with time zone,
  "restored_by" text,
  CONSTRAINT "removed_file_hashes_file_hash_unique" UNIQUE("file_hash")
);

CREATE INDEX IF NOT EXISTS "idx_removed_file_hashes_file_hash" ON "removed_file_hashes" ("file_hash");
CREATE INDEX IF NOT EXISTS "idx_removed_file_hashes_workspace_id" ON "removed_file_hashes" ("workspace_id");
