-- Railway Domain Enrichment Migration
-- Adds railway-specific enums, columns, and rolling_stock_units table
-- Covers: pl_item_type, inspection_agency, rolling_stock_status, bom_product_type, bom_gauge enums
-- New columns on pl_numbers, bom_products, work_records
-- New values for document_category enum
-- Full rolling_stock_units table with indexes

-- New enum types for PL item classification
CREATE TYPE "pl_item_type" AS ENUM ('VD', 'NVD');

CREATE TYPE "inspection_agency" AS ENUM ('RDSO', 'ZONAL', 'WORKSHOP', 'STORES');

-- Rolling stock status enum
CREATE TYPE "rolling_stock_status" AS ENUM ('active', 'under_overhaul', 'condemned', 'transferred', 'awaiting_commissioning');

-- BOM product type and gauge enums
CREATE TYPE "bom_product_type" AS ENUM ('locomotive', 'coach', 'emu', 'assembly', 'sub_assembly', 'component');

CREATE TYPE "bom_gauge" AS ENUM ('broad_gauge', 'metre_gauge', 'narrow_gauge');

-- Add new values to document_category enum
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'STR';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'EC';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'SOS';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'SOR';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'QAP';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'SET_LIST';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'GAD';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'WIRING_DIAGRAM';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'BOM_DOCUMENT';
ALTER TYPE "document_category" ADD VALUE IF NOT EXISTS 'VENDOR_DOCUMENT';

-- Add railway-specific columns to pl_numbers
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "item_type" "pl_item_type";
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "uvam_item_id" varchar(64);
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "eligibility_criteria_text" text;
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "eligibility_criteria_doc_id" text REFERENCES "documents"("id");
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "str_doc_id" text REFERENCES "documents"("id");
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "qap_doc_id" text REFERENCES "documents"("id");
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "inspection_agency" "inspection_agency";
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "unit_of_measurement" varchar(16);
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "shelf_life_months" integer;
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "last_procurement_rate" real;
ALTER TABLE "pl_numbers" ADD COLUMN IF NOT EXISTS "last_procurement_date" timestamp with time zone;

-- Add product variant columns to bom_products
ALTER TABLE "bom_products" ADD COLUMN IF NOT EXISTS "product_type" "bom_product_type";
ALTER TABLE "bom_products" ADD COLUMN IF NOT EXISTS "base_product_id" text;
ALTER TABLE "bom_products" ADD COLUMN IF NOT EXISTS "variant_notes" text;
ALTER TABLE "bom_products" ADD COLUMN IF NOT EXISTS "gauge" "bom_gauge";

-- Add rolling stock unit reference to work_records
ALTER TABLE "work_records" ADD COLUMN IF NOT EXISTS "rolling_stock_unit_id" text;

-- Create rolling_stock_units table
CREATE TABLE IF NOT EXISTS "rolling_stock_units" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "product_id" text REFERENCES "bom_products"("id"),
  "unit_number" varchar(64) NOT NULL UNIQUE,
  "serial_number" varchar(64),
  "manufactured_date" timestamp with time zone,
  "commissioning_date" timestamp with time zone,
  "status" "rolling_stock_status" NOT NULL DEFAULT 'active',
  "home_workshop" varchar(128) NOT NULL,
  "current_location" varchar(128),
  "notes" text,
  "created_by" text,
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for rolling_stock_units
CREATE INDEX IF NOT EXISTS "idx_rolling_stock_units_workspace_id" ON "rolling_stock_units" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_rolling_stock_units_product_id" ON "rolling_stock_units" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_rolling_stock_units_unit_number" ON "rolling_stock_units" ("unit_number");
CREATE INDEX IF NOT EXISTS "idx_rolling_stock_units_status" ON "rolling_stock_units" ("status");
CREATE INDEX IF NOT EXISTS "idx_rolling_stock_units_home_workshop" ON "rolling_stock_units" ("home_workshop");

-- Add FK constraint for work_records -> rolling_stock_units (after table creation)
ALTER TABLE "work_records" ADD CONSTRAINT "fk_work_records_rolling_stock_unit" FOREIGN KEY ("rolling_stock_unit_id") REFERENCES "rolling_stock_units"("id");

-- Index for the new work_records column
CREATE INDEX IF NOT EXISTS "idx_work_records_rolling_stock_unit_id" ON "work_records" ("rolling_stock_unit_id");
