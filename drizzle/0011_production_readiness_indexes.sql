-- Production-readiness indexes for high-volume PL/document association flows.
-- Idempotent so the migration is safe to run in local, staging, and production.

CREATE INDEX IF NOT EXISTS "idx_doc_pl_links_pl_linked_at"
  ON "document_pl_links" ("pl_number_id", "linked_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_doc_pl_links_doc_linked_at"
  ON "document_pl_links" ("document_id", "linked_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_pl_numbers_ws_updated"
  ON "pl_numbers" ("workspace_id", "updated_at" DESC);
