-- Cases table workspace scoping and additional fields migration
-- Adds workspace_id column (required for multi-tenant isolation)
-- Adds type, severity, reporter, vendor, tender, and linked documents columns

-- Add 'escalated' value to case_status enum
ALTER TYPE "case_status" ADD VALUE IF NOT EXISTS 'escalated';

-- Add workspace_id column (NOT NULL with a default placeholder for existing rows)
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "workspace_id" text;
UPDATE "cases" SET "workspace_id" = 'default' WHERE "workspace_id" IS NULL;
ALTER TABLE "cases" ALTER COLUMN "workspace_id" SET NOT NULL;

-- Add new columns for case detail
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "type" varchar(64);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "severity" varchar(32);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "assignee_name" varchar(256);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "reporter_id" text;
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "reporter_name" varchar(256);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "vendor_name" varchar(256);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "tender_number" varchar(128);
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "linked_document_ids" text;

-- Create indexes for workspace scoping and combined queries
CREATE INDEX IF NOT EXISTS "idx_cases_workspace_id" ON "cases" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_cases_workspace_status" ON "cases" ("workspace_id", "case_status");
