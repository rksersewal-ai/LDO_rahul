-- Document Versions table
CREATE TABLE IF NOT EXISTS "document_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "version_number" integer NOT NULL,
  "revision" varchar(16),
  "file_path" text,
  "file_size" integer,
  "file_hash" varchar(64),
  "mime_type" varchar(128),
  "original_filename" varchar(512),
  "ocr_status" "ocr_status" NOT NULL DEFAULT 'not_required',
  "ocr_text" text,
  "ocr_confidence" real,
  "thumbnail_path" text,
  "page_count" integer,
  "change_note" text,
  "uploaded_by" text,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_current_version" integer DEFAULT 0 NOT NULL,
  "workspace_id" text NOT NULL,
  CONSTRAINT "uq_document_versions_doc_version" UNIQUE("document_id", "version_number")
);

CREATE INDEX IF NOT EXISTS "idx_document_versions_document_id" ON "document_versions" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_versions_workspace_id" ON "document_versions" ("workspace_id");

-- Document Comments table
CREATE TABLE IF NOT EXISTS "document_comments" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "version_id" text,
  "parent_id" text,
  "content" text NOT NULL,
  "is_deleted" integer DEFAULT 0 NOT NULL,
  "is_resolved" integer DEFAULT 0 NOT NULL,
  "resolved_by" text,
  "resolved_at" timestamp with time zone,
  "created_by" text NOT NULL,
  "workspace_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_document_comments_document_id" ON "document_comments" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_comments_parent_id" ON "document_comments" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_document_comments_created_by" ON "document_comments" ("created_by");

-- Document Share Links table
CREATE TABLE IF NOT EXISTS "document_share_links" (
  "id" text PRIMARY KEY NOT NULL,
  "token" varchar(48) NOT NULL UNIQUE,
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "version_id" text,
  "created_by" text NOT NULL,
  "password_hash" text,
  "expires_at" timestamp with time zone,
  "max_views" integer,
  "view_count" integer DEFAULT 0 NOT NULL,
  "is_revoked" integer DEFAULT 0 NOT NULL,
  "allow_download" integer DEFAULT 1 NOT NULL,
  "workspace_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_document_share_links_token" ON "document_share_links" ("token");
CREATE INDEX IF NOT EXISTS "idx_document_share_links_document_id" ON "document_share_links" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_share_links_workspace_id" ON "document_share_links" ("workspace_id");
