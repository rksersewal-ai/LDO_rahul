-- Hybrid OCR pipeline: per-page extraction audit
-- Covers: document_pages table
--
-- Records whether each page's text came from native PDF extraction or OCR,
-- along with OCR confidence and the DPI used. Enables auditing native-vs-OCR
-- coverage and tuning DPI presets from confidence trends.
--
-- Idempotent (IF NOT EXISTS) so it is safe to apply via drizzle-kit push or
-- manually, consistent with the existing migration files in this directory.

CREATE TABLE IF NOT EXISTS "document_pages" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "page_number" integer NOT NULL,
  "extraction_method" varchar(20) NOT NULL,
  "text_content" text,
  "ocr_confidence" real,
  "dpi_used" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_document_pages_doc_page" UNIQUE ("document_id", "page_number")
);

CREATE INDEX IF NOT EXISTS "idx_document_pages_document_id" ON "document_pages" ("document_id");
