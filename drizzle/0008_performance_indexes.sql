-- Performance: composite + partial indexes matching real query shapes
--
-- Most list/dashboard queries filter by (workspace_id, is_deleted) and order by
-- created_at DESC. The existing single-column indexes force extra filtering and
-- sorts. These composite + partial indexes let Postgres satisfy those queries
-- with a single index scan and keep the "live documents" working set small.

-- Documents: workspace + live + newest-first (covers list, recent, dashboard).
CREATE INDEX IF NOT EXISTS "idx_documents_ws_deleted_created"
  ON "documents" ("workspace_id", "is_deleted", "created_at" DESC);

-- Documents: partial index over live rows only (smaller, hot path).
CREATE INDEX IF NOT EXISTS "idx_documents_ws_live"
  ON "documents" ("workspace_id", "created_at" DESC)
  WHERE "is_deleted" = 0;

-- Documents: status filtering within a workspace (filters/facets).
CREATE INDEX IF NOT EXISTS "idx_documents_ws_status"
  ON "documents" ("workspace_id", "status")
  WHERE "is_deleted" = 0;

-- Documents: file-hash lookups for dedup / removed-hash reference counting.
CREATE INDEX IF NOT EXISTS "idx_documents_filehash_live"
  ON "documents" ("file_hash")
  WHERE "is_deleted" = 0;

-- Audit log: workspace activity feed ordered newest-first.
CREATE INDEX IF NOT EXISTS "idx_audit_log_ws_created"
  ON "audit_log" ("workspace_id", "created_at" DESC);

-- Audit log: full-chain verification scans oldest-first.
CREATE INDEX IF NOT EXISTS "idx_audit_log_created_asc"
  ON "audit_log" ("created_at");

-- Record declarations: disposition-review queue (expired + not destroyed).
CREATE INDEX IF NOT EXISTS "idx_record_declarations_ws_expires"
  ON "record_declarations" ("workspace_id", "retention_expires_at")
  WHERE "destroyed_at" IS NULL;

-- Duplicate detections: pending review queue per workspace.
CREATE INDEX IF NOT EXISTS "idx_duplicate_detections_ws_status"
  ON "duplicate_detections" ("workspace_id", "status");
