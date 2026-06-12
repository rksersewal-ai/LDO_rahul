-- PL System Phase 2 Migration
-- Adds lifecycle_stage enum, alias/relationship tables, upgrades document_pl_links, creates ocr_pl_candidates

-- New enum types
CREATE TYPE "pl_lifecycle_stage" AS ENUM ('draft', 'active', 'restricted', 'obsolete', 'deprecated');
CREATE TYPE "pl_alias_type" AS ENUM ('legacy', 'vendor', 'drawing', 'local_name');
CREATE TYPE "pl_relation_type" AS ENUM ('equivalent_to', 'substitute_for', 'supersedes', 'child_of', 'accessory_of', 'related_to');
CREATE TYPE "document_pl_link_type" AS ENUM ('manual', 'ocr_candidate', 'ocr_accepted', 'bom_inferred', 'work_record_inferred');
CREATE TYPE "ocr_pl_candidate_status" AS ENUM ('pending', 'accepted', 'rejected', 'unresolved');

-- Add 'obsolete' to pl_status enum
ALTER TYPE "pl_status" ADD VALUE IF NOT EXISTS 'obsolete';

-- Add new columns to pl_numbers
ALTER TABLE "pl_numbers" ADD COLUMN "manufacturer" varchar(255);
ALTER TABLE "pl_numbers" ADD COLUMN "vendor_code" varchar(128);
ALTER TABLE "pl_numbers" ADD COLUMN "part_family" varchar(128);
ALTER TABLE "pl_numbers" ADD COLUMN "lifecycle_stage" "pl_lifecycle_stage" DEFAULT 'active';
ALTER TABLE "pl_numbers" ADD COLUMN "last_used_at" timestamp with time zone;
ALTER TABLE "pl_numbers" ADD COLUMN "metadata_json" text;

-- Create pl_aliases table
CREATE TABLE IF NOT EXISTS "pl_aliases" (
  "id" text PRIMARY KEY NOT NULL,
  "pl_id" text NOT NULL REFERENCES "pl_numbers"("id"),
  "workspace_id" text,
  "alias" varchar(128) NOT NULL,
  "alias_type" "pl_alias_type" NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_pl_aliases_workspace_alias" UNIQUE ("workspace_id", "alias")
);

CREATE INDEX IF NOT EXISTS "idx_pl_aliases_pl_id" ON "pl_aliases" ("pl_id");

-- Create pl_relationships table
CREATE TABLE IF NOT EXISTS "pl_relationships" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text,
  "source_pl_id" text NOT NULL REFERENCES "pl_numbers"("id"),
  "target_pl_id" text NOT NULL REFERENCES "pl_numbers"("id"),
  "relation_type" "pl_relation_type" NOT NULL,
  "notes" text,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_pl_relationships_source_target_type" UNIQUE ("source_pl_id", "target_pl_id", "relation_type")
);

CREATE INDEX IF NOT EXISTS "idx_pl_relationships_source" ON "pl_relationships" ("source_pl_id");
CREATE INDEX IF NOT EXISTS "idx_pl_relationships_target" ON "pl_relationships" ("target_pl_id");

-- Upgrade document_pl_links table
ALTER TABLE "document_pl_links" DROP CONSTRAINT IF EXISTS "document_pl_links_pkey";
ALTER TABLE "document_pl_links" ADD COLUMN "id" text;
ALTER TABLE "document_pl_links" ADD COLUMN "link_type" "document_pl_link_type" NOT NULL DEFAULT 'manual';
ALTER TABLE "document_pl_links" ADD COLUMN "confidence" real;
ALTER TABLE "document_pl_links" ADD COLUMN "source_version_id" text;

-- Set id for existing rows (generate UUIDs)
UPDATE "document_pl_links" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;

-- Make id NOT NULL and set as primary key
ALTER TABLE "document_pl_links" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "document_pl_links" ADD CONSTRAINT "document_pl_links_pkey" PRIMARY KEY ("id");

-- Add unique constraint on (document_id, pl_number_id)
ALTER TABLE "document_pl_links" ADD CONSTRAINT "uq_document_pl_links_doc_pl" UNIQUE ("document_id", "pl_number_id");

-- Create ocr_pl_candidates table
CREATE TABLE IF NOT EXISTS "ocr_pl_candidates" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "version_id" text,
  "workspace_id" text,
  "pl_number" varchar(8) NOT NULL,
  "confidence" real,
  "page_number" integer,
  "context" text,
  "mod11_valid" boolean NOT NULL DEFAULT false,
  "status" "ocr_pl_candidate_status" NOT NULL DEFAULT 'pending',
  "accepted_by" text,
  "accepted_at" timestamp with time zone,
  "rejected_by" text,
  "rejected_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_ocr_pl_candidates_document_id" ON "ocr_pl_candidates" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_ocr_pl_candidates_workspace_id" ON "ocr_pl_candidates" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_ocr_pl_candidates_pl_number" ON "ocr_pl_candidates" ("pl_number");
CREATE INDEX IF NOT EXISTS "idx_ocr_pl_candidates_status" ON "ocr_pl_candidates" ("status");
