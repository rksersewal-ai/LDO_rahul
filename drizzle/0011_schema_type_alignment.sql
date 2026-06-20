-- Schema type alignment migration
-- Aligns the physical database with the Drizzle schema changes:
--   1. documents.is_deleted: integer(0/1) → boolean
--   2. documents.file_size: integer → bigint
--   3. document_comments.is_deleted, is_resolved: integer(0/1) → boolean
--   4. pl_numbers: global unique(pl_number) → per-workspace unique(workspace_id, pl_number)
--   5. approvals: add workspace_id index
--
-- All operations are idempotent (IF NOT EXISTS / safe type checks) so this
-- migration can be run multiple times or applied via drizzle-kit push without
-- conflict. Data is preserved — integer 0/1 values are converted to boolean.
--
-- Run with: psql $DATABASE_URL -f drizzle/0011_schema_type_alignment.sql
-- Or let drizzle-kit push handle it automatically.

-- ============================================================================
-- 1. documents.is_deleted: integer → boolean
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'is_deleted'
    AND data_type IN ('integer', 'smallint', 'bigint')
  ) THEN
    -- Add a temporary boolean column
    ALTER TABLE "documents" ADD COLUMN "is_deleted_new" boolean NOT NULL DEFAULT false;
    -- Migrate data: 0 → false, anything else → true
    UPDATE "documents" SET "is_deleted_new" = CASE WHEN "is_deleted" = 0 THEN false ELSE true END;
    -- Drop the old column and rename
    ALTER TABLE "documents" DROP COLUMN "is_deleted";
    ALTER TABLE "documents" RENAME COLUMN "is_deleted_new" TO "is_deleted";
  END IF;
END $$;

-- ============================================================================
-- 2. documents.file_size: integer → bigint
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_size'
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE "documents" ALTER COLUMN "file_size" TYPE bigint;
  END IF;
END $$;

-- ============================================================================
-- 3. document_comments.is_deleted, is_resolved: integer → boolean
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_comments' AND column_name = 'is_deleted'
    AND data_type IN ('integer', 'smallint', 'bigint')
  ) THEN
    ALTER TABLE "document_comments" ADD COLUMN "is_deleted_new" boolean NOT NULL DEFAULT false;
    UPDATE "document_comments" SET "is_deleted_new" = CASE WHEN "is_deleted" = 0 THEN false ELSE true END;
    ALTER TABLE "document_comments" DROP COLUMN "is_deleted";
    ALTER TABLE "document_comments" RENAME COLUMN "is_deleted_new" TO "is_deleted";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_comments' AND column_name = 'is_resolved'
    AND data_type IN ('integer', 'smallint', 'bigint')
  ) THEN
    ALTER TABLE "document_comments" ADD COLUMN "is_resolved_new" boolean NOT NULL DEFAULT false;
    UPDATE "document_comments" SET "is_resolved_new" = CASE WHEN "is_resolved" = 0 THEN false ELSE true END;
    ALTER TABLE "document_comments" DROP COLUMN "is_resolved";
    ALTER TABLE "document_comments" RENAME COLUMN "is_resolved_new" TO "is_resolved";
  END IF;
END $$;

-- ============================================================================
-- 4. pl_numbers: global unique → per-workspace unique
-- ============================================================================
-- Drop the global unique constraint (if it exists) and add the composite one.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pl_numbers_pl_number_unique'
    AND table_name = 'pl_numbers'
  ) THEN
    ALTER TABLE "pl_numbers" DROP CONSTRAINT "pl_numbers_pl_number_unique";
  END IF;
END $$;

-- Add per-workspace unique (idempotent via IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_pl_numbers_workspace_pl'
    AND table_name = 'pl_numbers'
  ) THEN
    ALTER TABLE "pl_numbers" ADD CONSTRAINT "uq_pl_numbers_workspace_pl"
      UNIQUE ("workspace_id", "pl_number");
  END IF;
END $$;

-- ============================================================================
-- 5. Composite indexes (idempotent — matching the Drizzle schema)
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_documents_workspace_deleted"
  ON "documents" ("workspace_id", "is_deleted");

CREATE INDEX IF NOT EXISTS "idx_documents_workspace_status"
  ON "documents" ("workspace_id", "status");

CREATE INDEX IF NOT EXISTS "idx_approvals_workspace_id"
  ON "approvals" ("workspace_id");

-- ============================================================================
-- Done. The database now matches the Drizzle schema declarations.
-- drizzle-kit push will see no drift after this migration is applied.
-- ============================================================================
